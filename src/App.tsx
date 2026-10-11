import { useState } from 'react';
import './App.css';
import Notes from "./components/Notes";
import ScaleConnections from "./components/ScaleConnections";
import ChordScale3DMap from "./components/ChordScale3DMap";
import EarTrainer from "./components/EarTrainer";
import { motion, AnimatePresence } from 'framer-motion';

type PageView = 'eartraining' | 'map3d' | 'connections' | 'explorer';

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('eartraining');

  return (
    <div className="min-h-screen bg-[#01131c] text-white w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8 font-sans selection:bg-[#fa1ea2] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7cdffc] via-[#a855f7] to-[#fa1ea2] p-0.5 shadow-[0_0_15px_rgba(124,223,252,0.4)] flex items-center justify-center">
            <span className="text-lg">🎵</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide">
              Music Theory <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7cdffc] via-[#a855f7] to-[#fa1ea2]">Studio</span>
            </h1>
            <p className="text-[10px] text-gray-400">Interactive Scales, 3D Harmonics & Ear Training</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav className="flex flex-wrap justify-center p-1 rounded-full bg-black/40 border border-white/10 shadow-inner">
          <button
            onClick={() => setCurrentPage('eartraining')}
            className={`relative px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 ${currentPage === 'eartraining' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            {currentPage === 'eartraining' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-gradient-to-r from-[#7cdffc] via-[#a855f7] to-[#fa1ea2] rounded-full shadow-[0_0_15px_rgba(124,223,252,0.4)] z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>👂</span> Ear Trainer
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('map3d')}
            className={`relative px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 ${currentPage === 'map3d' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            {currentPage === 'map3d' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-gradient-to-r from-[#fa1ea2] via-[#a855f7] to-[#7cdffc] rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>🌌</span> 3D Chord-Scale Map
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('connections')}
            className={`relative px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 ${currentPage === 'connections' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            {currentPage === 'connections' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-gradient-to-r from-[#fa1ea2] via-[#91039b] to-[#7cdffc] rounded-full shadow-[0_0_15px_rgba(250,30,162,0.4)] z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>🔗</span> Scale Connections
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('explorer')}
            className={`relative px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 ${currentPage === 'explorer' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            {currentPage === 'explorer' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-gradient-to-r from-[#fa1ea2] to-[#91039b] rounded-full shadow-[0_0_15px_rgba(250,30,162,0.4)] z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>🎸</span> Scale Explorer
            </span>
          </button>
        </nav>
      </header>

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {currentPage === 'eartraining' ? (
            <motion.div
              key="eartraining-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <EarTrainer />
            </motion.div>
          ) : currentPage === 'map3d' ? (
            <motion.div
              key="map3d-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <ChordScale3DMap />
            </motion.div>
          ) : currentPage === 'connections' ? (
            <motion.div
              key="connections-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <ScaleConnections />
            </motion.div>
          ) : (
            <motion.div
              key="explorer-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Notes />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;

