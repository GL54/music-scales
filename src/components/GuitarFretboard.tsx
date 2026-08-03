import { getGuitarFretboard, isSameNote } from '../utils/musicTheory';
import { motion } from 'framer-motion';

type GuitarFretboardProps = {
  scaleNotes: string[];
  rootNote: string;
};

const GuitarFretboard = ({ scaleNotes, rootNote }: GuitarFretboardProps) => {
  const numFrets = 12;
  // Get fretboard and reverse it so high E is at the top (index 0) and low E is at the bottom
  const fretboard = [...getGuitarFretboard(numFrets)].reverse();

  // Fret markers traditionally on frets 3, 5, 7, 9, 12
  const markers = [3, 5, 7, 9, 12];

  return (
    <div className="mt-8 w-full max-w-full">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#7cdffc] rounded-full animate-pulse"></span>
        Guitar Fretboard
      </h3>

      <div className="w-full pb-6">
        <div className="max-w-[1000px] w-full bg-[#1a1125] p-2 sm:p-6 rounded-2xl border border-white/10 shadow-2xl relative mx-auto">
          {/* Fret numbers/markers */}
          <div className="flex pl-4 sm:pl-8 mb-2">
            {Array.from({ length: numFrets + 1 }).map((_, i) => (
              <div key={i} className="flex-1 text-center text-gray-500 text-[10px] sm:text-xs font-mono">
                {markers.includes(i) ? (
                  <div className="flex flex-col items-center gap-1">
                    <span>{i}</span>
                    <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/20 ${i === 12 ? 'ring-1 sm:ring-2 ring-white/20 ring-offset-1 sm:ring-offset-2 ring-offset-transparent' : ''}`}></div>
                  </div>
                ) : i === 0 ? 'Open' : i}
              </div>
            ))}
          </div>

          {/* Strings */}
          <div className="flex flex-col gap-1 sm:gap-2 relative z-10">
            {fretboard.map((stringNotes, stringIdx) => (
              <div key={stringIdx} className="flex items-center group relative min-h-[20px] sm:min-h-[28px]">
                {/* The string line visual */}
                <div
                  className="absolute left-4 sm:left-8 right-0 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 rounded-full z-0 shadow-sm"
                  style={{ height: `${1 + stringIdx * 0.3}px` }}
                />

                {stringNotes.map((note, fretIdx) => {
                  const isRoot = isSameNote(note, rootNote);
                  const isInScale = !isRoot && scaleNotes.some(sn => isSameNote(sn, note));
                  const isHighlighted = isRoot || isInScale;

                  return (
                    <div
                      key={fretIdx}
                      className={`flex-1 flex justify-center z-10 h-full items-center ${fretIdx === 0 ? 'w-6 sm:w-8 flex-none border-r-2 sm:border-r-4 border-gray-400 pr-1 sm:pr-2' : 'border-r border-white/10'}`}
                    >
                      {isHighlighted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={`
                          w-4 h-4 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[8px] sm:text-xs font-bold shadow-lg
                          ${isRoot ? 'bg-[#fa1ea2] text-white ring-2 sm:ring-4 ring-[#fa1ea2]/30' : 'bg-[#7cdffc] text-[#01131c]'}
                        `}
                        >
                          {note}
                        </motion.div>
                      ) : (
                        <div className="w-4 h-4 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[8px] sm:text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity bg-[#08191f]/50">
                          {note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-4 justify-center text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#fa1ea2]"></div>
            <span className="text-gray-300">Root Note</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#7cdffc]"></div>
            <span className="text-gray-300">Scale Note</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuitarFretboard;
