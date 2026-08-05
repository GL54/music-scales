import { getGuitarFretboard, isSameNote, getGuitarPositionFretRange, type GuitarPosition, type FretNote } from '../utils/musicTheory';
import { motion } from 'framer-motion';
import { playNote } from '../utils/audio';

type GuitarFretboardProps = {
  scaleNotes: string[];
  rootNote: string;
  activeNotes?: string[];
  isSustain?: boolean;
  guitarPosition?: GuitarPosition;
};

const GuitarFretboard = ({ scaleNotes, rootNote, activeNotes = [], isSustain = false, guitarPosition = 'all' }: GuitarFretboardProps) => {
  const numFrets = 16;
  const fretboard = [...getGuitarFretboard(numFrets)].reverse();
  const markers = [3, 5, 7, 9, 12, 15];
  
  const fretRange = guitarPosition === 'all' ? [0, numFrets] : getGuitarPositionFretRange(rootNote, guitarPosition);

  // Pre-calculate allowed positions to prevent pitch duplication across strings
  const allowedFretPositions = new Set<string>();
  if (guitarPosition !== 'all') {
    const seenFullNotes = new Set<string>();
    // fretboard is reversed: stringIdx 0 is String 1 (High E), stringIdx 5 is String 6 (Low E)
    // Iterating this way favors notes on higher strings (which means lower fret numbers)
    fretboard.forEach((stringNotes, stringIdx) => {
      for (let fretIdx = fretRange[0]; fretIdx <= fretRange[1]; fretIdx++) {
        if (fretIdx < stringNotes.length) {
          const fretNote = stringNotes[fretIdx];
          if (!seenFullNotes.has(fretNote.fullNote)) {
            seenFullNotes.add(fretNote.fullNote);
            allowedFretPositions.add(`${stringIdx}-${fretIdx}`);
          }
        }
      }
    });
  }

  const handleNoteClick = (fretNote: FretNote) => {
    playNote(fretNote.fullNote, 'guitar', isSustain);
  };

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

          {/* Dimming Masks Overlay */}
          <div className="absolute inset-2 sm:inset-6 grid grid-cols-[1.5rem_repeat(16,1fr)] sm:grid-cols-[2rem_repeat(16,1fr)] pointer-events-none z-20 rounded-[10px] sm:rounded-[14px] overflow-hidden">
            {/* Left Mask */}
            <motion.div
              layout
              initial={false}
              animate={{ opacity: guitarPosition === 'all' || fretRange[0] === 0 ? 0 : 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#1a1125]/70 backdrop-grayscale"
              style={{
                gridColumnStart: 1,
                gridColumnEnd: Math.max(2, fretRange[0] + 1),
                gridRow: 1
              }}
            />
            
            {/* Active Area Highlight Frame */}
            <motion.div
              layout
              initial={false}
              animate={{ opacity: guitarPosition === 'all' ? 0 : 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="border-[3px] border-white/20 rounded-lg shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
              style={{
                gridColumnStart: fretRange[0] + 1,
                gridColumnEnd: fretRange[1] + 2,
                gridRow: 1
              }}
            />

            {/* Right Mask */}
            <motion.div
              layout
              initial={false}
              animate={{ opacity: guitarPosition === 'all' || fretRange[1] >= 16 ? 0 : 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#1a1125]/70 backdrop-grayscale"
              style={{
                gridColumnStart: Math.min(17, fretRange[1] + 2),
                gridColumnEnd: 18,
                gridRow: 1
              }}
            />
          </div>

          {/* Strings */}
          <div className="flex flex-col gap-1 sm:gap-2 relative z-10">
            {fretboard.map((stringNotes, stringIdx) => (
              <div key={stringIdx} className="flex items-center relative min-h-[20px] sm:min-h-[28px]">
                {/* The string line visual */}
                <div
                  className="absolute left-4 sm:left-8 right-0 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 rounded-full z-0 shadow-sm pointer-events-none"
                  style={{ height: `${1 + stringIdx * 0.3}px` }}
                />

                {stringNotes.map((fretNote, fretIdx) => {
                  const { note } = fretNote;
                  const isRoot = isSameNote(note, rootNote);
                  
                  // Use the scale's spelling of the note if it's in the scale
                  const scaleSpelling = scaleNotes.find(sn => isSameNote(sn, note));
                  const displayNote = scaleSpelling || note;
                  const isInScale = !isRoot && !!scaleSpelling;
                  
                  let isHighlighted = isRoot || isInScale;
                  
                  const hasOctave = (an: string) => /\d$/.test(an);
                  let isActive = activeNotes.some(an => {
                    if (hasOctave(an)) return an === fretNote.fullNote;
                    return isSameNote(an, note);
                  });

                  if (guitarPosition !== 'all') {
                    if (fretIdx < fretRange[0] || fretIdx > fretRange[1]) {
                      isHighlighted = false;
                      isActive = false;
                    } else if (!allowedFretPositions.has(`${stringIdx}-${fretIdx}`)) {
                      isHighlighted = false;
                      isActive = false;
                    }
                  }

                  return (
                    <div
                      key={fretIdx}
                      onClick={() => handleNoteClick(fretNote)}
                      className={`group cursor-pointer flex-1 flex justify-center z-10 h-full items-center ${fretIdx === 0 ? 'w-6 sm:w-8 flex-none border-r-2 sm:border-r-4 border-gray-400 pr-1 sm:pr-2' : 'border-r border-white/10'} hover:bg-white/5 transition-colors rounded`}
                    >
                      {isHighlighted || isActive ? (
                        <motion.div
                          whileTap={{ scale: 0.9 }}
                          initial={{ scale: 0 }}
                          animate={{ scale: isActive ? 1.2 : 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={`
                          w-4 h-4 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[8px] sm:text-xs font-bold shadow-lg transition-colors
                          ${isActive ? 'bg-yellow-400 text-black ring-4 ring-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.8)] z-20' 
                            : isRoot ? 'bg-[#fa1ea2] text-white ring-2 sm:ring-4 ring-[#fa1ea2]/30' 
                            : 'bg-[#7cdffc] text-[#01131c]'}
                        `}
                        >
                          {displayNote}
                        </motion.div>
                      ) : (
                        <div className="w-4 h-4 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[8px] sm:text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity bg-[#08191f]/50">
                          {displayNote}
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
