import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Zap, Network, KeyRound, Copy, Check, ChevronRight } from 'lucide-react';

const Lobby = ({ createRoom, joinRoom, sendFile, roomId, transferState, phase }) => {
  const [inputRoomId, setInputRoomId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputRoomId) joinRoom(inputRoomId.trim().toUpperCase());
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendFile(file);
    }
  };

  const copyToClipboard = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-8 text-zinc-100 selection:bg-cyan-500/30 overflow-y-auto overflow-x-hidden">
      <div className="flex-1 flex items-center justify-center w-full py-8 md:py-0">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 grid-rows-[auto] gap-4 md:gap-6 relative"
        >
          {/* Glow effect behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[400px] bg-emerald-500/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

          {/* Header / Brand */}
          <motion.div variants={itemVariants} className="md:col-span-3 warp-bento flex items-center justify-between overflow-hidden relative group p-5 md:p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent relative z-10 flex items-center gap-2 md:gap-3">
              <Zap className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" fill="currentColor" />
              WARP
            </h1>
            <div className="flex items-center gap-2 md:gap-3 relative z-10">
              <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${phase === 'active' ? 'bg-emerald-400 text-emerald-400 animate-pulse' : 'bg-zinc-600 text-zinc-600'}`} />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">{phase}</span>
            </div>
          </motion.div>

          {/* Drop Zone */}
          <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2 relative group h-full">
            <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 transition-opacity duration-500 ${phase === 'active' || phase === 'lobby' ? 'group-hover:opacity-100' : ''}`} />
            <div className={`warp-bento flex flex-col items-center justify-center border-dashed border-2 min-h-[280px] md:h-[350px] transition-all duration-300 relative z-10
              ${phase === 'active' || phase === 'lobby' ? 'border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-900/50 cursor-pointer' : 'border-zinc-800 opacity-50 cursor-not-allowed'}
            `}>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                disabled={phase !== 'active' && phase !== 'lobby'}
              />
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center text-center space-y-4 md:space-y-6 w-full h-full justify-center p-6 ${phase === 'active' || phase === 'lobby' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-xl border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors duration-300"
                >
                  <UploadCloud className="w-8 h-8 md:w-10 md:h-10" />
                </motion.div>
                <div>
                  <p className="text-xl md:text-2xl font-bold tracking-tight text-zinc-200 group-hover:text-white transition-colors">Drop file to warp</p>
                  <p className="text-xs md:text-sm font-medium text-zinc-500 mt-2 max-w-[200px] md:max-w-none mx-auto">Pure P2P. End-to-end encrypted. No limits.</p>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Room Info / Actions */}
          <motion.div variants={itemVariants} className="warp-bento flex flex-col justify-between relative overflow-hidden group p-5 md:p-6">
            <div className="absolute -inset-10 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative z-10 text-zinc-100">
              <h2 className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 md:mb-5 flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 md:w-4 md:h-4" /> Connection
              </h2>
              
              <AnimatePresence mode="wait">
                {!roomId ? (
                  <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <button
                      onClick={createRoom}
                      className="w-full py-3 md:py-3.5 rounded-xl bg-white text-black font-bold text-xs md:text-sm tracking-widest uppercase hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                      Generate Room
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="room" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 md:space-y-4">
                    <p className="text-[10px] md:text-xs text-zinc-400 font-medium">Share this code with recipient</p>
                    <div 
                      onClick={copyToClipboard}
                      className="group/code cursor-pointer flex justify-between items-center py-3 md:py-4 px-4 md:px-5 bg-black/40 border border-white/10 rounded-xl hover:border-emerald-500/50 hover:bg-black/60 transition-all active:scale-[0.98]"
                    >
                      <span className="text-2xl md:text-3xl font-mono font-bold tracking-[0.15em] text-white">
                        {roomId}
                      </span>
                      <div className="text-zinc-500 group-hover/code:text-emerald-400 transition-colors shrink-0 ml-2">
                        {copied ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 md:mt-8 relative z-10 border-t border-white/5 pt-5 md:pt-6">
              <h2 className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                <Network className="w-3.5 h-3.5 md:w-4 md:h-4" /> Join Room
              </h2>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  placeholder="CODE"
                  className="flex-1 w-full min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-base md:text-lg font-mono font-bold text-white uppercase placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
                <button
                  type="submit"
                  className="px-3 md:px-4 shrink-0 rounded-xl bg-zinc-800 text-white border border-white/5 hover:bg-zinc-700 hover:border-white/20 transition-all flex items-center justify-center active:scale-95"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </form>
            </div>
          </motion.div>

          {/* Network Status Log */}
          <motion.div variants={itemVariants} className="warp-bento relative overflow-hidden p-5 md:p-6">
            <h2 className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2 relative z-10">
              <Network className="w-3.5 h-3.5 md:w-4 md:h-4" /> Telemetry
            </h2>
            <div className="relative z-10">
              {transferState.speed > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] md:text-xs font-medium text-zinc-400 uppercase tracking-widest">Warp Speed</span>
                    <span className="text-lg md:text-xl font-mono font-bold text-emerald-400">
                      {(transferState.speed / 1024 / 1024).toFixed(2)} <span className="text-[10px] md:text-sm text-emerald-600">MB/s</span>
                    </span>
                  </div>
                  <div className="w-full bg-black/60 rounded-full h-1 md:h-1.5 overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${transferState.progress * 100}%` }}
                      transition={{ type: 'tween', ease: 'circOut' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-14 md:h-16 flex items-center justify-center border border-dashed border-white/5 rounded-xl bg-black/20">
                  <p className="text-[10px] md:text-sm font-medium text-zinc-600 uppercase tracking-widest">Awaiting transfer...</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Signature Footer */}
      <motion.footer 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="mt-6 md:mt-0 text-[10px] md:text-xs font-medium text-zinc-500 tracking-[0.2em] uppercase max-w-5xl w-full text-center pb-4"
      >
        Made by{' '}
        <a 
          href="https://sanscarr.tech" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-zinc-300 hover:text-emerald-400 hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-300 border-b border-transparent hover:border-emerald-400/50 pb-0.5 ml-1"
        >
          Sanskar Sharma
        </a>
      </motion.footer>
    </div>
  );
};

export default Lobby;
