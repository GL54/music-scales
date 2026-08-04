import { getScaleChords, getAscendingChordNotes, getGuitarPositionFretRange, getGuitarChordVoicing, type ScaleType, type GuitarPosition, type VoicingType } from '../utils/musicTheory';
import { motion } from 'framer-motion';
import { playNote, playArpeggio, type InstrumentType } from '../utils/audio';

type ChordsListProps = {
  rootNote: string;
  scaleNotes: string[];
  scaleType: ScaleType;
  instrument: InstrumentType;
  isSustain?: boolean;
  isArpeggio?: boolean;
  guitarPosition?: GuitarPosition;
  voicingType?: VoicingType;
  onPlayChord?: (notes: string[]) => void;
};

const ChordsList = ({ rootNote, scaleNotes, scaleType, instrument, isSustain = false, isArpeggio = false, guitarPosition = 'all', voicingType = 'strum', onPlayChord }: ChordsListProps) => {
  const chords = getScaleChords(scaleNotes, scaleType);

  if (chords.length === 0) {
    return (
      <div className="p-5 mt-4 text-gray-400 italic bg-[#08191f]/50 rounded-xl text-center border border-white/5 backdrop-blur-sm">
        Standard tertian chords are not typically built directly from pentatonic scales.
      </div>
    );
  }

  const handleChordClick = (notes: string[]) => {
    let chordNotes: string[] = [];
    
    if (instrument === 'guitar') {
      const fretRange = getGuitarPositionFretRange(rootNote, guitarPosition);
      chordNotes = getGuitarChordVoicing(notes, fretRange, voicingType);
    } else {
      chordNotes = getAscendingChordNotes(notes, 4);
    }
    
    if (isArpeggio) {
      playArpeggio(chordNotes, instrument, isSustain);
    } else {
      playNote(chordNotes, instrument, isSustain);
    }
    
    if (onPlayChord) {
      onPlayChord(chordNotes);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#fa1ea2] rounded-full animate-pulse"></span>
        Diatonic Chords
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {chords.map((chord, idx) => (
          <motion.div
            key={chord.numeral}
            onClick={() => handleChordClick(chord.notes)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md h-[90px] overflow-hidden cursor-pointer"
            tabIndex={0}
          >
            <span className="text-[#7cdffc] font-mono text-sm absolute top-2">{chord.numeral}</span>
            
            <div className="absolute top-1/2 -translate-y-1/2 mt-2 flex flex-col items-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-90 group-focus:opacity-0 group-focus:scale-90">
              <span className="text-white font-bold text-lg">{chord.name}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{chord.type}</span>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 mt-2 flex flex-col items-center transition-all duration-300 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-focus:opacity-100 group-focus:scale-100">
              <div className="flex gap-1.5 mt-1">
                {chord.notes.map((note, i) => (
                  <span key={i} className="text-xs font-mono text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/5 shadow-inner">
                    {note}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChordsList;
