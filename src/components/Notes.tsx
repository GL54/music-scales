import React, { useState } from "react";
import { COMMON_ROOTS, getScaleNotes, type ScaleType } from "../utils/musicTheory";
import Card from "./Card";
import ChordsList from "./ChordsList";
import GuitarFretboard from "./GuitarFretboard";
import PianoKeyboard from "./PianoKeyboard";

const SCALE_TYPES: { id: ScaleType; label: string }[] = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'majorPentatonic', label: 'Major Pentatonic' },
  { id: 'minorPentatonic', label: 'Minor Pentatonic' },
];

const Notes: React.FC = () => {
  const [rootNote, setRootNote] = useState<string>("C");
  const [scaleType, setScaleType] = useState<ScaleType>("major");
  const [instrument, setInstrument] = useState<'guitar' | 'keyboard'>('guitar');

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

          <ChordsList scaleNotes={scaleNotes} scaleType={scaleType} />
          
          <div className="pt-4">
            <div className="flex justify-center mb-6">
              <div className="bg-white/5 p-1 rounded-full flex gap-1 border border-white/10">
                <button
                  onClick={() => setInstrument('guitar')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    instrument === 'guitar' 
                      ? 'bg-gradient-to-r from-[#fa1ea2] to-[#91039b] text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Guitar
                </button>
                <button
                  onClick={() => setInstrument('keyboard')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    instrument === 'keyboard' 
                      ? 'bg-gradient-to-r from-[#01131c] to-[#08191f] text-[#7cdffc] border border-[#7cdffc]/30 shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Keyboard
                </button>
              </div>
            </div>

            {instrument === 'guitar' ? (
              <GuitarFretboard scaleNotes={scaleNotes} rootNote={rootNote} />
            ) : (
              <PianoKeyboard scaleNotes={scaleNotes} rootNote={rootNote} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
