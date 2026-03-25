import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks (Optimal for SCTP flow control)
const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3001';

export const useWebRTC = () => {
  const [roomId, setRoomId] = useState(null);
  const [phase, setPhase] = useState('lobby'); // lobby, connecting, active, disconnected
  const [transferState, setTransferState] = useState({
    progress: 0,
    speed: 0,
    name: '',
    size: 0,
    receivedSize: 0,
    isSender: false,
  });

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const chunksRef = useRef([]);
  const metadataRef = useRef(null);
  const startTimeRef = useRef(null);

  const roomIdRef = useRef(null);

  const cleanup = useCallback(() => {
    if (dcRef.current) dcRef.current.close();
    if (pcRef.current) pcRef.current.close();
    if (socketRef.current) socketRef.current.disconnect();
    chunksRef.current = [];
    setPhase('disconnected');
    roomIdRef.current = null;
  }, []);

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on('room-created', (id) => {
      setRoomId(id);
      roomIdRef.current = id;
      setTransferState(prev => ({ ...prev, isSender: true }));
    });

    socketRef.current.on('room-joined', (id) => {
      setRoomId(id);
      roomIdRef.current = id;
      setTransferState(prev => ({ ...prev, isSender: false }));
      setPhase('connecting');
    });

    socketRef.current.on('peer-joined', async (peerId) => {
      console.log('Peer joined, creating offer...');
      setPhase('connecting');
      const pc = createPeerConnection(peerId);
      pcRef.current = pc;

      // Create DataChannel as host
      const dc = pc.createDataChannel('file-transfer', { ordered: true });
      setupDataChannel(dc);
      dcRef.current = dc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', { to: peerId, offer });
    });

    socketRef.current.on('offer', async ({ from, offer }) => {
      console.log('Received offer, creating answer...');
      const pc = createPeerConnection(from);
      pcRef.current = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      // Process any ICE candidates that arrived before the offer
      if (pc.processBufferedIce) await pc.processBufferedIce();
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('answer', { to: from, answer });
    });

    socketRef.current.on('answer', async ({ from, answer }) => {
      console.log('Received answer...');
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      if (pcRef.current.processBufferedIce) await pcRef.current.processBufferedIce();
    });

    socketRef.current.on('ice-candidate', async ({ from, candidate }) => {
      if (candidate && pcRef.current) {
        if (pcRef.current.bufferedIceCandidate) {
          await pcRef.current.bufferedIceCandidate(candidate);
        } else {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    });

    return () => cleanup();
  }, [cleanup]);

  const createPeerConnection = (peerId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    const iceQueue = [];
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { to: peerId, candidate: event.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    pc.ondatachannel = (event) => {
      console.log('DataChannel received');
      setupDataChannel(event.channel);
      dcRef.current = event.channel;
    };

    // Buffer ICE candidates until remote description is set
    pc.bufferedIceCandidate = async (candidate) => {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ice candidate', e);
        }
      } else {
        iceQueue.push(candidate);
      }
    };

    pc.processBufferedIce = async () => {
      while (iceQueue.length > 0) {
        const candidate = iceQueue.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding buffered ice candidate', e);
        }
      }
    };

    return pc;
  };

  const setupDataChannel = (dc) => {
    dc.onopen = () => {
      console.log('DataChannel open! Room:', roomIdRef.current);
      setPhase('active');
      dc.bufferedAmountLowThreshold = 64 * 1024; // 64KB threshold
      socketRef.current.emit('connection-established', roomIdRef.current);
    };

    dc.onclose = () => {
      console.log('DataChannel closed');
      setPhase('disconnected');
    };

    dc.onmessage = (event) => {
      handleMessage(event.data);
    };
  };

  const handleMessage = (data) => {
    if (typeof data === 'string') {
      // Metadata frame
      const metadata = JSON.parse(data);
      metadataRef.current = { ...metadata, receivedBytes: 0, lastUpdate: 0 };
      setTransferState(prev => ({
        ...prev,
        name: metadata.name,
        size: metadata.size,
        receivedSize: 0,
        progress: 0
      }));
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      console.log('Starting receive:', metadata.name);
    } else {
      // Binary chunk
      chunksRef.current.push(data);
      metadataRef.current.receivedBytes += data.byteLength;
      const currentReceivedSize = metadataRef.current.receivedBytes;
      const isComplete = currentReceivedSize >= metadataRef.current.size;
      
      // Throttle state updates to ~4fps, but FORCE the final update at 100%
      if (isComplete || (!metadataRef.current.lastUpdate || Date.now() - metadataRef.current.lastUpdate > 250)) {
        const progress = Math.min(currentReceivedSize / metadataRef.current.size, 1);
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const speed = currentReceivedSize / (elapsed || 1);

        setTransferState(prev => ({
          ...prev,
          receivedSize: currentReceivedSize,
          progress: Math.max(0, progress),
          speed: Math.max(0, speed)
        }));
        metadataRef.current.lastUpdate = Date.now();
      }

      if (isComplete) {
        const blob = new Blob(chunksRef.current, { type: metadataRef.current.type || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.setAttribute('download', metadataRef.current.name);
        a.click();
        
        console.log('File received and download triggered:', metadataRef.current.name);
        
        // 10-second cleanup to absolutely guarantee the OS stream captures the filename
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 10000);
      }
    }
  };

  const createRoom = () => {
    socketRef.current.emit('create-room');
  };

  const joinRoom = (id) => {
    socketRef.current.emit('join-room', id.toUpperCase());
  };

  const sendFile = async (file) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') return;

    setTransferState(prev => ({
      ...prev,
      name: file.name,
      size: file.size,
      progress: 0,
      speed: 0,
      isSender: true
    }));

    // Send metadata
    dcRef.current.send(JSON.stringify({
      name: file.name,
      size: file.size,
      type: file.type
    }));

    const buffer = await file.arrayBuffer();
    let offset = 0;
    startTimeRef.current = Date.now();

    let lastUpdate = 0;

    const sendChunk = () => {
      while (offset < file.size) {
        // Backpressure check - pause at 1MB to prevent SCTP congestion window collapse
        if (dcRef.current.bufferedAmount > 1024 * 1024) {
          dcRef.current.onbufferedamountlow = () => {
            dcRef.current.onbufferedamountlow = null;
            sendChunk();
          };
          return;
        }

        const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
        dcRef.current.send(chunk);
        offset += chunk.byteLength;

        // Throttle state updates (4fps)
        if (Date.now() - lastUpdate > 250) {
          // Calculate TRUE sent amount by subtracting what is stuck in the buffer
          const actualSent = offset - dcRef.current.bufferedAmount;
          const progress = actualSent / file.size;
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const speed = actualSent / (elapsed || 1);

          setTransferState(prev => ({
            ...prev,
            progress: Math.max(0, progress),
            speed: Math.max(0, speed)
          }));
          lastUpdate = Date.now();
        }
      }
      
      // Wait for the buffer to drain completely before declaring success
      const checkDone = setInterval(() => {
        if (!dcRef.current || dcRef.current.bufferedAmount === 0 || dcRef.current.readyState !== 'open') {
          clearInterval(checkDone);
          if (dcRef.current && dcRef.current.readyState === 'open') {
            setTransferState(prev => ({ ...prev, progress: 1, speed: 0 }));
            console.log('File sent successfully');
          }
        } else {
          // Update progress while the final buffer drains
          const actualSent = file.size - dcRef.current.bufferedAmount;
          const progress = actualSent / file.size;
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setTransferState(prev => ({
            ...prev,
            progress: Math.max(0, progress),
            speed: Math.max(0, actualSent / (elapsed || 1))
          }));
        }
      }, 100);
    };

    sendChunk();
  };

  return {
    roomId,
    phase,
    transferState,
    createRoom,
    joinRoom,
    sendFile,
    cleanup
  };
};
