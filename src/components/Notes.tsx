import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { COMMON_ROOTS, getScaleNotes, type ScaleType, type GuitarPosition, type VoicingType } from "../utils/musicTheory";
import Card from "./Card";
import ChordsList from "./ChordsList";
import GuitarFretboard from "./GuitarFretboard";
import PianoKeyboard from "./PianoKeyboard";
import { preloadAudio } from "../utils/audio";

const SCALE_TYPES: { id: ScaleType; label: string }[] = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'majorPentatonic', label: 'Major Pentatonic' },
  { id: 'minorPentatonic', label: 'Minor Pentatonic' },
];

const Notes: React.FC = () => {
  const [rootNote, setRootNote] = useState<string>("C");
  const [scaleType, setScaleType] = useState<ScaleType>("major");
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [isSustain, setIsSustain] = useState<boolean>(false);
  const [isArpeggio, setIsArpeggio] = useState<boolean>(false);
  const [guitarPosition, setGuitarPosition] = useState<GuitarPosition>('all');
  const [voicingType, setVoicingType] = useState<VoicingType>('strum');
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Preload audio samples on mount
  useEffect(() => {
    preloadAudio();
  }, []);

  const scaleNotes = getScaleNotes(rootNote, scaleType);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto bg-[#040d12] rounded-3xl shadow-2xl space-y-8 w-full border border-white/5 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#fa1ea2] to-[#7cdffc] pb-2 drop-shadow-sm">
            Scale Explorer
          </h2>
          <p className="text-sm sm:text-base text-gray-400">Discover scales, chords, and fretboard positions.</p>
        </div>

        {/* Root Note Selector */}
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center">Root Note</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {COMMON_ROOTS.map((note) => {
              const isSelected = rootNote === note;
              return (
                <button
                  key={note}
                  onClick={() => setRootNote(note)}
                  className={`
                    w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all duration-300
                    ${isSelected
                      ? "bg-gradient-to-br from-[#fa1ea2] to-[#91039b] text-white shadow-[0_0_20px_rgba(250,30,162,0.4)] scale-110"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"}
                  `}
                >
                  {note}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scale Type Selector */}
        <div className="space-y-3 mb-10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center">Scale Type</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {SCALE_TYPES.map(({ id, label }) => {
              const isSelected = scaleType === id;
              return (
                <button
                  key={id}
                  onClick={() => setScaleType(id)}
                  className={`
                    px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base
                    ${isSelected
                      ? "bg-gradient-to-r from-[#01131c] to-[#08191f] text-[#7cdffc] border border-[#7cdffc]/50 shadow-[0_0_15px_rgba(124,223,252,0.3)]"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent"}
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-white/10 mb-8" />

        {/* Display Components */}
        <div className="space-y-10">
          {/* Main Scale Card */}
          <Card
            heading={rootNote}
            relativeRoot=""
            scale={SCALE_TYPES.find(s => s.id === scaleType)?.label || ""}
            relativeScale={scaleNotes}
            pBg="bg-gradient-to-r from-[#fa1ea2] to-[#7cdffc]"
            pHeading="text-white"
          />

          <ChordsList 
            rootNote={rootNote}
            scaleNotes={scaleNotes} 
            scaleType={scaleType} 
            instrument={instrument} 
            isSustain={isSustain}
            isArpeggio={isArpeggio}
            guitarPosition={guitarPosition}
            voicingType={voicingType}
            onPlayChord={(notes) => {
              timeoutRefs.current.forEach(clearTimeout);
              timeoutRefs.current = [];

              if (isArpeggio) {
                notes.forEach((note, index) => {
                  const t = setTimeout(() => {
                    setActiveNotes([note]);
                  }, index * 200);
                  timeoutRefs.current.push(t);
                });
                
                const clearT = setTimeout(() => {
                  setActiveNotes([]);
                }, notes.length * 200 + (isSustain ? 2000 : 500));
                timeoutRefs.current.push(clearT);
              } else {
                setActiveNotes(notes);
                const t = setTimeout(() => setActiveNotes([]), isSustain ? 2000 : 1000);
                timeoutRefs.current.push(t);
              }
            }}
          />

          <div className="pt-4">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
              <div className="bg-white/5 p-1 rounded-full flex gap-1 border border-white/10">
                <button
                  onClick={() => setInstrument('guitar')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${instrument === 'guitar'
                      ? 'bg-gradient-to-r from-[#fa1ea2] to-[#91039b] text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Guitar
                </button>
                <button
                  onClick={() => setInstrument('piano')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${instrument === 'piano'
                      ? 'bg-gradient-to-r from-[#01131c] to-[#08191f] text-[#7cdffc] border border-[#7cdffc]/30 shadow-lg'
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Keyboard
                </button>
              </div>

              <div className="flex gap-2">
                {/* Sustain Toggle */}
                <button
                  onClick={() => setIsSustain(!isSustain)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                    isSustain 
                      ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                  title={isSustain ? "Sustain is ON" : "Sustain is OFF"}
                >
                  <div className={`w-2 h-2 rounded-full transition-colors ${isSustain ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  Sustain
                </button>

                {/* Arpeggio Toggle */}
                <button
                  onClick={() => setIsArpeggio(!isArpeggio)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                    isArpeggio 
                      ? 'bg-[#7cdffc]/20 text-[#7cdffc] border-[#7cdffc]/50 shadow-[0_0_15px_rgba(124,223,252,0.2)]' 
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                  title={isArpeggio ? "Arpeggio is ON" : "Arpeggio is OFF"}
                >
                  <div className={`w-2 h-2 rounded-full transition-colors ${isArpeggio ? 'bg-[#7cdffc] animate-pulse' : 'bg-gray-500'}`}></div>
                  Arpeggio
                </button>
              </div>
            </div>

            {instrument === 'guitar' && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-6">
                
                {/* Position Selector */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Position</span>
                  <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shadow-inner">
                    {['all', 'open', 1, 2, 3, 4, 5].map(pos => {
                       const label = pos === 'all' ? 'All' : pos === 'open' ? 'Open' : `${pos}`;
                       const isActive = guitarPosition === pos;
                       return (
                         <button
                           key={pos}
                           onClick={() => setGuitarPosition(pos as GuitarPosition)}
                           className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-300 ${
                             isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                           }`}
                         >
                           {isActive && (
                             <motion.div
                               layoutId="position-active-bg"
                               className="absolute inset-0 bg-gradient-to-r from-[#fa1ea2] to-[#91039b] rounded-full shadow-md z-0"
                               transition={{ type: "spring", stiffness: 400, damping: 30 }}
                             />
                           )}
                           <span className="relative z-10">{label}</span>
                         </button>
                       )
                    })}
                  </div>
                </div>

                {/* Voicing Selector */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Voicing</span>
                  <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shadow-inner">
                    {['strum', 'triad'].map(v => {
                       const label = v === 'strum' ? 'Strum' : 'Triad';
                       const isActive = voicingType === v;
                       return (
                         <button
                           key={v}
                           onClick={() => setVoicingType(v as VoicingType)}
                           className={`relative px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-colors duration-300 ${
                             isActive ? 'text-[#7cdffc]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                           }`}
                         >
                           {isActive && (
                             <motion.div
                               layoutId="voicing-active-bg"
                               className="absolute inset-0 bg-gradient-to-r from-[#01131c] to-[#08191f] border border-[#7cdffc]/30 rounded-full shadow-md z-0"
                               transition={{ type: "spring", stiffness: 400, damping: 30 }}
                             />
                           )}
                           <span className="relative z-10">{label}</span>
                         </button>
                       )
                    })}
                  </div>
                </div>

              </div>
            )}

            {instrument === 'guitar' ? (
              <GuitarFretboard scaleNotes={scaleNotes} rootNote={rootNote} activeNotes={activeNotes} isSustain={isSustain} guitarPosition={guitarPosition} />
            ) : (
              <PianoKeyboard scaleNotes={scaleNotes} rootNote={rootNote} activeNotes={activeNotes} isSustain={isSustain} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
