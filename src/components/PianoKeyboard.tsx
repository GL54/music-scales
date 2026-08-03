import { isSameNote } from '../utils/musicTheory';


type PianoKeyboardProps = {
  scaleNotes: string[];
  rootNote: string;
};

// Define 2 octaves of keys.
// 'offset' will help position black keys relative to white keys if we use absolute positioning,
// but an easier way with Flexbox is to make white keys flex-1, 
// and absolute position black keys on the borders between white keys.
const PIANO_KEYS = [
  { note: 'C', type: 'white' }, { note: 'C#', type: 'black' },
  { note: 'D', type: 'white' }, { note: 'D#', type: 'black' },
  { note: 'E', type: 'white' },
  { note: 'F', type: 'white' }, { note: 'F#', type: 'black' },
  { note: 'G', type: 'white' }, { note: 'G#', type: 'black' },
  { note: 'A', type: 'white' }, { note: 'A#', type: 'black' },
  { note: 'B', type: 'white' },
  // Second octave
  { note: 'C', type: 'white' }, { note: 'C#', type: 'black' },
  { note: 'D', type: 'white' }, { note: 'D#', type: 'black' },
  { note: 'E', type: 'white' },
  { note: 'F', type: 'white' }, { note: 'F#', type: 'black' },
  { note: 'G', type: 'white' }, { note: 'G#', type: 'black' },
  { note: 'A', type: 'white' }, { note: 'A#', type: 'black' },
  { note: 'B', type: 'white' },
];

const PianoKeyboard = ({ scaleNotes, rootNote }: PianoKeyboardProps) => {
  // Separate white keys for the layout base
  const whiteKeys = PIANO_KEYS.filter(k => k.type === 'white');
  
  // To position black keys, we calculate their left percentage based on the white keys.
  // There are 14 white keys. Each white key takes (100 / 14)% of the width.
  // A black key is placed exactly on the boundary between two white keys.
  // So C# is between C (index 0) and D (index 1). Left position = (1 / 14) * 100%.
  
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
              
              return (
                <div 
                  key={`white-${i}`} 
                  className={`
                    flex-1 h-full border border-[#1a1125] rounded-b-md sm:rounded-b-lg relative flex items-end justify-center pb-2 sm:pb-4 transition-colors
                    ${isRoot ? 'bg-[#fa1ea2]' : isInScale ? 'bg-[#7cdffc]' : 'bg-gray-100'}
                  `}
                >
                  <span className={`text-[10px] sm:text-sm font-bold ${isRoot || isInScale ? 'text-gray-900' : 'text-gray-400'}`}>
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
            
            // Left position: pos is the number of white keys before it.
            // Width of one white key is 100/14 %.
            // We want it centered on the border, so left is (pos * 100/14)%.
            // But we must translate it left by 50% of its own width.
            const leftPercent = (key.pos / 14) * 100;

            return (
              <div 
                key={`black-${i}`}
                className={`
                  absolute top-1 sm:top-2 h-[60%] w-[4%] sm:w-[3.5%] rounded-b-sm sm:rounded-b-md flex items-end justify-center pb-1 sm:pb-2 z-10 transition-colors shadow-lg
                  ${isRoot ? 'bg-[#fa1ea2]' : isInScale ? 'bg-[#7cdffc]' : 'bg-gray-800'}
                `}
                style={{ 
                  left: `calc(${leftPercent}% - 2%)`, // Adjusted for w-[4%] on mobile, close enough visually
                  border: '1px solid #1a1125' 
                }}
              >
                <span className={`text-[8px] sm:text-[10px] font-bold ${isRoot || isInScale ? 'text-gray-900' : 'text-gray-500'}`}>
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
