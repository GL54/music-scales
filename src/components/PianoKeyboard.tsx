import { isSameNote } from '../utils/musicTheory';
import { playNote } from '../utils/audio';

type PianoKeyboardProps = {
  scaleNotes: string[];
  rootNote: string;
  activeNotes?: string[];
  isSustain?: boolean;
};

// Define 2 octaves of keys.
const PIANO_KEYS = [
  { note: 'C', type: 'white', octave: 3 }, { note: 'C#', type: 'black', octave: 3 },
  { note: 'D', type: 'white', octave: 3 }, { note: 'D#', type: 'black', octave: 3 },
  { note: 'E', type: 'white', octave: 3 },
  { note: 'F', type: 'white', octave: 3 }, { note: 'F#', type: 'black', octave: 3 },
  { note: 'G', type: 'white', octave: 3 }, { note: 'G#', type: 'black', octave: 3 },
  { note: 'A', type: 'white', octave: 3 }, { note: 'A#', type: 'black', octave: 3 },
  { note: 'B', type: 'white', octave: 3 },
  // Second octave
  { note: 'C', type: 'white', octave: 4 }, { note: 'C#', type: 'black', octave: 4 },
  { note: 'D', type: 'white', octave: 4 }, { note: 'D#', type: 'black', octave: 4 },
  { note: 'E', type: 'white', octave: 4 },
  { note: 'F', type: 'white', octave: 4 }, { note: 'F#', type: 'black', octave: 4 },
  { note: 'G', type: 'white', octave: 4 }, { note: 'G#', type: 'black', octave: 4 },
  { note: 'A', type: 'white', octave: 4 }, { note: 'A#', type: 'black', octave: 4 },
  { note: 'B', type: 'white', octave: 4 },
].map(k => ({ ...k, fullNote: `${k.note}${k.octave}` }));

const PianoKeyboard = ({ scaleNotes, rootNote, activeNotes = [], isSustain = false }: PianoKeyboardProps) => {
  // Separate white keys for the layout base
  const whiteKeys = PIANO_KEYS.filter(k => k.type === 'white');
  
  let currentWhiteIndex = 0;
  const keysWithPositions = PIANO_KEYS.map((key) => {
    if (key.type === 'white') {
      const pos = currentWhiteIndex;
      currentWhiteIndex++;
      return { ...key, pos };
    } else {
      // Black key is positioned exactly on the boundary AFTER the current white key
      return { ...key, pos: currentWhiteIndex };
    }
  });

  return (
    <div className="mt-8 w-full">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#7cdffc] rounded-full animate-pulse"></span>
        Piano Keyboard
      </h3>
      
      <div className="w-full pb-6">
        <div className="w-full max-w-[800px] h-[140px] sm:h-[180px] md:h-[220px] relative mx-auto bg-[#1a1125] p-1 sm:p-2 rounded-xl shadow-2xl border border-white/10 select-none">
          
          {/* Render White Keys */}
          <div className="flex w-full h-full">
            {whiteKeys.map((key, i) => {
              const isRoot = isSameNote(key.note, rootNote);
              const isInScale = !isRoot && scaleNotes.some(sn => isSameNote(sn, key.note));
              const isActive = activeNotes.some(an => isSameNote(an, key.note));
              
              return (
                <div 
                  key={`white-${i}`} 
                  onClick={() => playNote(key.fullNote, 'piano', isSustain)}
                  className={`
                    cursor-pointer flex-1 h-full border border-[#1a1125] rounded-b-md sm:rounded-b-lg relative flex items-end justify-center pb-2 sm:pb-4 transition-all duration-300 active:translate-y-1 z-0
                    ${isActive ? 'bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] z-10 scale-y-105 origin-top' 
                      : isRoot ? 'bg-[#fa1ea2]' 
                      : isInScale ? 'bg-[#7cdffc]' 
                      : 'bg-gray-100 hover:bg-gray-200'}
                  `}
                >
                  <span className={`text-[10px] sm:text-sm font-bold pointer-events-none transition-colors ${isActive || isRoot || isInScale ? 'text-gray-900' : 'text-gray-400'}`}>
                    {key.note}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Render Black Keys */}
          {keysWithPositions.filter(k => k.type === 'black').map((key, i) => {
            const isRoot = isSameNote(key.note, rootNote);
            const isInScale = !isRoot && scaleNotes.some(sn => isSameNote(sn, key.note));
            const isActive = activeNotes.some(an => isSameNote(an, key.note));
            
            const leftPercent = (key.pos / 14) * 100;

            return (
              <div 
                key={`black-${i}`}
                onClick={() => playNote(key.fullNote, 'piano', isSustain)}
                className={`
                  cursor-pointer absolute top-1 sm:top-2 h-[60%] w-[4%] sm:w-[3.5%] rounded-b-sm sm:rounded-b-md flex items-end justify-center pb-1 sm:pb-2 transition-all duration-300 active:translate-y-1
                  ${isActive ? 'bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] z-20 scale-y-105 origin-top' 
                    : isRoot ? 'bg-[#fa1ea2] z-10' 
                    : isInScale ? 'bg-[#7cdffc] z-10' 
                    : 'bg-gray-800 hover:bg-gray-700 z-10'}
                `}
                style={{ 
                  left: `calc(${leftPercent}% - 2%)`, // Adjusted for w-[4%] on mobile, close enough visually
                  border: '1px solid #1a1125' 
                }}
              >
                <span className={`text-[8px] sm:text-[10px] font-bold pointer-events-none transition-colors ${isActive || isRoot || isInScale ? 'text-gray-900' : 'text-gray-500'}`}>
                  {key.note}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#fa1ea2]"></div>
            <span className="text-gray-300">Root Note</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7cdffc]"></div>
            <span className="text-gray-300">Scale Note</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoKeyboard;
