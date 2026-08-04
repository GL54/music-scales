export type ScaleType = 'major' | 'minor' | 'majorPentatonic' | 'minorPentatonic';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_SEMITONES: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10]
};

// Major scale degrees to extract for Pentatonic scales
const PENTATONIC_DEGREES: Record<'majorPentatonic' | 'minorPentatonic', number[]> = {
  majorPentatonic: [0, 1, 2, 4, 5], // 1, 2, 3, 5, 6
  minorPentatonic: [0, 2, 3, 4, 6]  // 1, 3, 4, 5, 7 (of minor scale)
};

export const COMMON_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getNoteSemitone(note: string): number {
  const baseLetter = note[0];
  let semitone = NATURAL_SEMITONES[baseLetter];
  
  for (let i = 1; i < note.length; i++) {
    if (note[i] === '#') semitone += 1;
    if (note[i] === 'b') semitone -= 1;
  }
  
  return (semitone + 12) % 12;
}

export function getScaleNotes(rootNote: string, scaleType: ScaleType): string[] {
  // If pentatonic, calculate the 7-note base scale first to get correct spellings, 
  // then extract the subset.
  const baseScaleType = scaleType === 'majorPentatonic' ? 'major' : 
                        scaleType === 'minorPentatonic' ? 'minor' : scaleType;
  
  const rootLetter = rootNote[0];
  const rootLetterIdx = LETTERS.indexOf(rootLetter);
  
  // Create letter sequence starting from root letter
  const letterSequence = [];
  for (let i = 0; i < 7; i++) {
    letterSequence.push(LETTERS[(rootLetterIdx + i) % 7]);
  }
  
  const rootSemitone = getNoteSemitone(rootNote);
  const intervals = SCALE_INTERVALS[baseScaleType];
  
  const baseScaleNotes: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const targetSemitone = (rootSemitone + intervals[i]) % 12;
    const targetLetter = letterSequence[i];
    const naturalSemitone = NATURAL_SEMITONES[targetLetter];
    
    // Calculate difference (accidentals)
    let diff = targetSemitone - naturalSemitone;
    
    // Normalize diff to be between -5 and +6
    while (diff > 6) diff -= 12;
    while (diff < -5) diff += 12;
    
    let accidentalStr = '';
    if (diff > 0) accidentalStr = '#'.repeat(diff);
    if (diff < 0) accidentalStr = 'b'.repeat(-diff);
    
    baseScaleNotes.push(targetLetter + accidentalStr);
  }
  
  if (scaleType === 'majorPentatonic' || scaleType === 'minorPentatonic') {
    return PENTATONIC_DEGREES[scaleType].map(idx => baseScaleNotes[idx]);
  }
  
  return baseScaleNotes;
}

export type ChordInfo = {
  numeral: string;
  name: string;
  type: 'major' | 'minor' | 'diminished';
  notes: string[];
};

export function getScaleChords(scaleNotes: string[], scaleType: ScaleType): ChordInfo[] {
  if (scaleNotes.length !== 7) {
    return []; // No standard chords for pentatonic
  }
  
  const isMajor = scaleType === 'major';
  
  const numerals = isMajor 
    ? ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
    : ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
    
  const chordTypes: ('major' | 'minor' | 'diminished')[] = isMajor
    ? ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']
    : ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];
    
  return scaleNotes.map((note, index) => {
    let suffix = '';
    if (chordTypes[index] === 'minor') suffix = 'm';
    if (chordTypes[index] === 'diminished') suffix = 'dim';
    
    return {
      numeral: numerals[index],
      name: note + suffix,
      type: chordTypes[index],
      notes: [
        scaleNotes[index],
        scaleNotes[(index + 2) % 7],
        scaleNotes[(index + 4) % 7]
      ]
    };
  });
}

export type FretNote = {
  note: string;
  octave: number;
  fullNote: string;
};

// Generates a standard tuned guitar fretboard (E2, A2, D3, G3, B3, E4)
// We return an array of strings (from low E to high E). 
// Each string is an array of notes from open (fret 0) to maxFrets.
export function getGuitarFretboard(maxFrets: number = 12): FretNote[][] {
  const tuning = [
    { note: 'E', octave: 2 },
    { note: 'A', octave: 2 },
    { note: 'D', octave: 3 },
    { note: 'G', octave: 3 },
    { note: 'B', octave: 3 },
    { note: 'E', octave: 4 }
  ]; // 6th to 1st string
  
  const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  return tuning.map(openString => {
    const stringNotes: FretNote[] = [];
    let currentOctave = openString.octave;
    let startIndex = chromatic.indexOf(openString.note);
    
    for (let fret = 0; fret <= maxFrets; fret++) {
      const noteIndex = (startIndex + fret) % 12;
      const note = chromatic[noteIndex];
      
      // If we crossed from B to C, increment the octave
      if (fret > 0 && note === 'C') {
        currentOctave++;
      }
      
      stringNotes.push({
        note,
        octave: currentOctave,
        fullNote: `${note}${currentOctave}`
      });
    }
    
    return stringNotes;
  });
}

// Enharmonically compare two notes (e.g. C# and Db)
export function isSameNote(note1: string, note2: string): boolean {
  return getNoteSemitone(note1) === getNoteSemitone(note2);
}

// Formats an array of raw notes into an ascending sequence with octaves.
export function getAscendingChordNotes(notes: string[], baseOctave: number = 4): string[] {
  if (notes.length === 0) return [];
  
  const result: string[] = [];
  let currentOctave = baseOctave;
  let previousSemitone = getNoteSemitone(notes[0]);
  
  result.push(`${notes[0]}${currentOctave}`);
  
  for (let i = 1; i < notes.length; i++) {
    const semitone = getNoteSemitone(notes[i]);
    // If the next note has a lower or equal semitone within the 12-tone scale,
    // it means we wrapped around the octave.
    if (semitone <= previousSemitone) {
      currentOctave++;
    }
    result.push(`${notes[i]}${currentOctave}`);
    previousSemitone = semitone;
  }
  
  return result;
}
