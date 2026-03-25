import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebRTC } from './hooks/useWebRTC';
import Lobby from './components/Lobby';
import TunnelCanvas from './components/TunnelCanvas';
import { File, Zap, CheckCircle2, X } from 'lucide-react';
import './index.css';

function App() {
  const {
    roomId,
    phase,
    transferState,
    createRoom,
    joinRoom,
    sendFile,
    cleanup
  } = useWebRTC();

  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanup();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cleanup]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-zinc-950 font-sans">
      {/* 3D Canvas behind the UI */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${phase === 'active' || phase === 'connecting' || phase === 'disconnected' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <TunnelCanvas 
          speed={transferState.speed} 
          progress={transferState.progress} 
          phase={phase} 
        />
      </div>

      <AnimatePresence mode="wait">
        {phase !== 'active' && phase !== 'connecting' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full h-full"
          >
            <Lobby
              createRoom={createRoom}
              joinRoom={joinRoom}
              sendFile={sendFile}
              roomId={roomId}
              transferState={transferState}
              phase={phase}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Transfer Overlay for active connection */}
        {(phase === 'active' && transferState.progress > 0 && transferState.progress < 1) && (
          <motion.div 
            key="transfer"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-6 md:bottom-12 z-20 flex flex-col items-center pointer-events-none px-4"
          >
            <div className="warp-glass px-5 md:px-8 py-5 rounded-3xl md:rounded-full flex flex-col md:flex-row items-center gap-5 md:gap-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto backdrop-blur-3xl bg-black/40 w-full md:w-auto max-w-md md:max-w-none relative">
              <div className="flex items-center justify-center w-full md:w-auto gap-4 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6 border-b md:border-b-0">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="flex flex-col flex-1 md:flex-none min-w-0">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Transferring</span>
                  <span className="text-sm font-bold text-white max-w-[180px] md:max-w-[150px] truncate">{transferState.name}</span>
                </div>
              </div>
              
              <div className="w-full md:w-[300px] flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-mono text-zinc-400">{(transferState.progress * 100).toFixed(0)}%</span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {(transferState.speed / 1024 / 1024).toFixed(2)} MB/s
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${transferState.progress * 100}%` }}
                    transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                  />
                </div>
              </div>
              
              <button 
                onClick={cleanup}
                className="absolute md:relative top-4 right-4 md:top-auto md:right-auto w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 md:bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors flex items-center justify-center border border-transparent hover:border-red-500/30"
              >
                <X className="w-4 h-4 md:w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Completion Overlay */}
        {(phase === 'active' && transferState.progress === 1) && (
          <motion.div 
            key="complete"
            initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 1.1, opacity: 0, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-sm px-4"
          >
            <div className="warp-bento relative overflow-hidden max-w-sm w-full flex flex-col items-center text-center py-10 md:py-12 shadow-[0_0_100px_rgba(16,185,129,0.15)] group hover:shadow-[0_0_120px_rgba(16,185,129,0.25)] transition-all">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, damping: 15 }}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-5 md:mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/30 text-emerald-400 relative"
              >
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-ping opacity-20" />
                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2"
              >
                Transfer Complete
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm md:text-base text-zinc-400 font-medium px-4 truncate w-full"
              >
                {transferState.name}
              </motion.p>
              
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={cleanup}
                className="mt-8 md:mt-10 px-8 md:px-10 py-3 md:py-4 bg-white text-black font-black uppercase tracking-[0.15em] text-xs md:text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
              >
                Return to Lobby
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
