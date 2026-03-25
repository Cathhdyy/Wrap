const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active rooms: { roomId: { hostId } }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('create-room', () => {
    const roomId = nanoid(6).toUpperCase(); // 6 character code
    rooms.set(roomId, { hostId: socket.id });
    socket.join(roomId);
    socket.emit('room-created', roomId);
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.join(roomId);
      socket.emit('room-joined', roomId);
      // Notify host that someone joined
      socket.to(room.hostId).emit('peer-joined', socket.id);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  // Relay WebRTC signaling messages
  socket.on('offer', ({ to, offer }) => {
    socket.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    socket.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // Once connection is established, server can drop awareness
  socket.on('connection-established', (roomId) => {
    if (rooms.has(roomId)) {
      rooms.delete(roomId);
      console.log(`P2P established for room ${roomId}. Room removed from server memory.`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Cleanup any rooms where this user was the host
    for (const [roomId, room] of rooms.entries()) {
      if (room.hostId === socket.id) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} closed because host disconnected.`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
