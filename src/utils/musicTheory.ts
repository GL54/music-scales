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

export function getNoteSemitone(note: string): number {
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

export type GuitarPosition = 'all' | 'open' | 1 | 2 | 3 | 4 | 5;
export type VoicingType = 'triad' | 'strum';

export function getGuitarPositionFretRange(rootNote: string, position: GuitarPosition, scaleType: ScaleType = 'major'): [number, number] {
  if (position === 'all') return [0, 24];
  if (position === 'open') return [0, 4];

  const rootSemitone = getNoteSemitone(rootNote);
  const eSemitone = getNoteSemitone('E');
  const rootFret = (rootSemitone - eSemitone + 12) % 12;

  const offsets = (scaleType === 'minor' || scaleType === 'minorPentatonic')
    ? [0, 3, 5, 7, 10]
    : [0, 2, 4, 7, 9];

  let startFret = (rootFret + offsets[position as number - 1]) % 12;

  return [Math.max(0, startFret), startFret + 4];
}

export function getGuitarChordVoicing(chordNotes: string[], fretRange: [number, number], voicingType: VoicingType = 'strum'): string[] {
  const fretboard = getGuitarFretboard(24);
  const [minFret, maxFret] = fretRange;

  const stringAvailableNotes: { stringIdx: number, fretNote: FretNote, fret: number }[][] = [];

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    const stringNotes = fretboard[stringIdx];
    const available = [];
    for (let fret = minFret; fret <= maxFret; fret++) {
      if (fret < stringNotes.length) {
        const fn = stringNotes[fret];
        if (chordNotes.some(cn => isSameNote(cn, fn.note))) {
          available.push({ stringIdx, fretNote: fn, fret });
        }
      }
    }
    stringAvailableNotes.push(available);
  }

  const hasAllChordNotes = (combo: FretNote[]) => {
    const used = new Set();
    combo.forEach(fn => {
      const idx = chordNotes.findIndex(cn => isSameNote(cn, fn.note));
      if (idx !== -1) used.add(idx);
    });
    return used.size === chordNotes.length;
  };

  if (voicingType === 'triad') {
    for (let startStr = 3; startStr >= 0; startStr--) {
      const s1 = stringAvailableNotes[startStr];
      const s2 = stringAvailableNotes[startStr + 1];
      const s3 = stringAvailableNotes[startStr + 2];

      for (const n1 of s1) {
        for (const n2 of s2) {
          for (const n3 of s3) {
            const combo = [n1.fretNote, n2.fretNote, n3.fretNote];
            if (hasAllChordNotes(combo)) {
              return combo.map(n => n.fullNote);
            }
          }
        }
      }
    }

    // Fallback if no perfect triad exists on 3 adjacent strings (unlikely)
    return [];
  }

  // Strum Voicing
  let rootStringIdx = -1;
  let rootNoteSelection = null;

  for (let i = 0; i < 6; i++) {
    const rootNotes = stringAvailableNotes[i].filter(n => isSameNote(n.fretNote.note, chordNotes[0]));
    if (rootNotes.length > 0) {
      rootStringIdx = i;
      rootNoteSelection = rootNotes[0];
      break;
    }
  }

  if (rootStringIdx === -1) {
    const fallback = [];
    for (let i = 0; i < 6; i++) {
      if (stringAvailableNotes[i].length > 0) fallback.push(stringAvailableNotes[i][0].fretNote.fullNote);
    }
    return fallback.slice(-3);
  }

  let bestCombo: FretNote[] | null = null;

  const searchStrum = (currentStr: number, currentCombo: FretNote[]) => {
    if (currentStr > 5) {
      if (hasAllChordNotes(currentCombo)) {
        if (!bestCombo) bestCombo = [...currentCombo];
      }
      return;
    }

    const available = stringAvailableNotes[currentStr];
    if (available.length === 0) {
      searchStrum(currentStr + 1, currentCombo);
    } else {
      for (const n of available) {
        currentCombo.push(n.fretNote);
        searchStrum(currentStr + 1, currentCombo);
        currentCombo.pop();
        if (bestCombo) return;
      }
    }
  };

  searchStrum(rootStringIdx + 1, [rootNoteSelection!.fretNote]);

  const finalCombo = bestCombo as FretNote[] | null;
  if (finalCombo) {
    return finalCombo.map((n: FretNote) => n.fullNote);
  }

  const fallback = [rootNoteSelection!.fretNote.fullNote];
  for (let i = rootStringIdx + 1; i < 6; i++) {
    if (stringAvailableNotes[i].length > 0) {
      fallback.push(stringAvailableNotes[i][0].fretNote.fullNote);
    }
  }

  return fallback;
}

export type HarmonicFunction = 'Tonic' | 'Subdominant' | 'Dominant';

export type DiatonicChordWithRole = ChordInfo & {
  degree: number;
  function: HarmonicFunction;
  functionShort: 'T' | 'S' | 'D';
  functionRole: string;
  tensionLevel: 'Low' | 'Medium' | 'High';
  seventhName: string;
  seventhNotes: string[];
};

export type CircleKeyInfo = {
  root: string;
  relativeMinor: string;
  sharps: number;
  flats: number;
  keySignature: string;
  positionIndex: number;
};

export const CIRCLE_OF_FIFTHS: CircleKeyInfo[] = [
  { root: 'C', relativeMinor: 'A', sharps: 0, flats: 0, keySignature: 'Natural (0 accidentals)', positionIndex: 0 },
  { root: 'G', relativeMinor: 'E', sharps: 1, flats: 0, keySignature: '1 Sharp (F#)', positionIndex: 1 },
  { root: 'D', relativeMinor: 'B', sharps: 2, flats: 0, keySignature: '2 Sharps (F#, C#)', positionIndex: 2 },
  { root: 'A', relativeMinor: 'F#', sharps: 3, flats: 0, keySignature: '3 Sharps (F#, C#, G#)', positionIndex: 3 },
  { root: 'E', relativeMinor: 'C#', sharps: 4, flats: 0, keySignature: '4 Sharps (F#, C#, G#, D#)', positionIndex: 4 },
  { root: 'B', relativeMinor: 'G#', sharps: 5, flats: 0, keySignature: '5 Sharps (F#, C#, G#, D#, A#)', positionIndex: 5 },
  { root: 'F#', relativeMinor: 'D#', sharps: 6, flats: 0, keySignature: '6 Sharps (F#, C#, G#, D#, A#, E#)', positionIndex: 6 },
  { root: 'Db', relativeMinor: 'Bb', sharps: 0, flats: 5, keySignature: '5 Flats (Bb, Eb, Ab, Db, Gb)', positionIndex: 7 },
  { root: 'Ab', relativeMinor: 'F', sharps: 0, flats: 4, keySignature: '4 Flats (Bb, Eb, Ab, Db)', positionIndex: 8 },
  { root: 'Eb', relativeMinor: 'C', sharps: 0, flats: 3, keySignature: '3 Flats (Bb, Eb, Ab)', positionIndex: 9 },
  { root: 'Bb', relativeMinor: 'G', sharps: 0, flats: 2, keySignature: '2 Flats (Bb, Eb)', positionIndex: 10 },
  { root: 'F', relativeMinor: 'D', sharps: 0, flats: 1, keySignature: '1 Flat (Bb)', positionIndex: 11 },
];

export function getCircleOfFifthsKey(root: string): CircleKeyInfo | undefined {
  const rootSemi = getNoteSemitone(root);
  return CIRCLE_OF_FIFTHS.find(k => getNoteSemitone(k.root) === rootSemi);
}

export function getScaleHarmonicChords(scaleNotes: string[], scaleType: ScaleType): DiatonicChordWithRole[] {
  if (scaleNotes.length !== 7) return [];
  const baseChords = getScaleChords(scaleNotes, scaleType);
  const isMajor = scaleType === 'major';

  const majorRoles = [
    { func: 'Tonic' as HarmonicFunction, short: 'T' as const, role: 'Tonal Home / Rest', tension: 'Low' as const, suffix: 'maj7' },
    { func: 'Subdominant' as HarmonicFunction, short: 'S' as const, role: 'Predominant / Steps smoothly to V', tension: 'Medium' as const, suffix: 'm7' },
    { func: 'Tonic' as HarmonicFunction, short: 'T' as const, role: 'Mediant / Gentle tonic substitute', tension: 'Low' as const, suffix: 'm7' },
    { func: 'Subdominant' as HarmonicFunction, short: 'S' as const, role: 'Subdominant / Broad departure from home', tension: 'Medium' as const, suffix: 'maj7' },
    { func: 'Dominant' as HarmonicFunction, short: 'D' as const, role: 'Dominant / Peak tension pulling to I', tension: 'High' as const, suffix: '7' },
    { func: 'Tonic' as HarmonicFunction, short: 'T' as const, role: 'Submediant / Relative minor home', tension: 'Low' as const, suffix: 'm7' },
    { func: 'Dominant' as HarmonicFunction, short: 'D' as const, role: 'Leading Tone / Tritone instability', tension: 'High' as const, suffix: 'm7b5' }
  ];

  const minorRoles = [
    { func: 'Tonic' as HarmonicFunction, short: 'T' as const, role: 'Tonal Center / Minor Home', tension: 'Low' as const, suffix: 'm7' },
    { func: 'Subdominant' as HarmonicFunction, short: 'S' as const, role: 'Predominant / Half-diminished bridge', tension: 'High' as const, suffix: 'm7b5' },
    { func: 'Tonic' as HarmonicFunction, short: 'T' as const, role: 'Relative Major / Uplifting contrast', tension: 'Low' as const, suffix: 'maj7' },
    { func: 'Subdominant' as HarmonicFunction, short: 'S' as const, role: 'Subdominant / Melancholic journey', tension: 'Medium' as const, suffix: 'm7' },
    { func: 'Dominant' as HarmonicFunction, short: 'D' as const, role: 'Minor Dominant (or V7 in Harmonic Minor)', tension: 'Medium' as const, suffix: 'm7' },
    { func: 'Subdominant' as HarmonicFunction, short: 'S' as const, role: 'Submediant / Majestic release', tension: 'Low' as const, suffix: 'maj7' },
    { func: 'Dominant' as HarmonicFunction, short: 'D' as const, role: 'Subtonic / Connects down to VI or up to III', tension: 'Medium' as const, suffix: '7' }
  ];

  const roles = isMajor ? majorRoles : minorRoles;

  return baseChords.map((chord, idx) => {
    const r = roles[idx];
    const seventhNotes = [
      scaleNotes[idx],
      scaleNotes[(idx + 2) % 7],
      scaleNotes[(idx + 4) % 7],
      scaleNotes[(idx + 6) % 7],
    ];
    return {
      ...chord,
      degree: idx + 1,
      function: r.func,
      functionShort: r.short,
      functionRole: r.role,
      tensionLevel: r.tension,
      seventhName: `${scaleNotes[idx]}${r.suffix}`,
      seventhNotes,
    };
  });
}

export type EarTrainingChordQuality = 
  | 'major' 
  | 'minor' 
  | 'diminished' 
  | 'augmented'
  | 'sus4'
  | 'sus2'
  | 'dom7' 
  | 'maj7' 
  | 'm7'
  | 'm7b5'
  | 'dim7';

// Generate voiced notes for specific chords
export function getVoicedChord(rootNote: string, chordType: EarTrainingChordQuality, baseOctave: number = 4): string[] {
  const rootSemi = getNoteSemitone(rootNote);
  const CHROMATIC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  let intervals: number[] = [0, 4, 7];
  if (chordType === 'minor') intervals = [0, 3, 7];
  if (chordType === 'diminished') intervals = [0, 3, 6];
  if (chordType === 'augmented') intervals = [0, 4, 8];
  if (chordType === 'sus4') intervals = [0, 5, 7];
  if (chordType === 'sus2') intervals = [0, 2, 7];
  if (chordType === 'dom7') intervals = [0, 4, 7, 10];
  if (chordType === 'maj7') intervals = [0, 4, 7, 11];
  if (chordType === 'm7') intervals = [0, 3, 7, 10];
  if (chordType === 'm7b5') intervals = [0, 3, 6, 10];
  if (chordType === 'dim7') intervals = [0, 3, 6, 9];

  const rawNotes = intervals.map(offset => {
    const s = (rootSemi + offset) % 12;
    return CHROMATIC[s];
  });

  return getAscendingChordNotes(rawNotes, baseOctave);
}

export type SharedChordInfo = {
  name: string;
  type: 'major' | 'minor' | 'diminished';
  notes: string[];
  numeral1: string;
  numeral2: string;
  function1: HarmonicFunction;
  function2: HarmonicFunction;
  role1: string;
  role2: string;
  explanation: string;
};

export type NoteDifference = {
  fromNote: string;
  toNote: string;
  semitones: number;
  direction: 'up' | 'down' | 'same';
  description: string;
};

export type BridgeChordStep = {
  name: string;
  numeral: string;
  notes: string[];
  label: string;
  isPivot?: boolean;
  isTargetTonic?: boolean;
  description: string;
};

export type ScaleComparisonData = {
  scaleNotes1: string[];
  scaleNotes2: string[];
  sharedNotes: string[];
  uniqueNotes1: string[];
  uniqueNotes2: string[];
  chords1: DiatonicChordWithRole[];
  chords2: DiatonicChordWithRole[];
  sharedChords: SharedChordInfo[];
  noteDiffs: NoteDifference[];
  relationship: {
    type: 'relative' | 'circle_dominant' | 'circle_subdominant' | 'parallel' | 'close' | 'distant';
    title: string;
    badge: string;
    keyDistance: number;
    whyConnect: string[];
    howConnect: string[];
  };
  bridgeProgression: BridgeChordStep[];
};

export function compareScales(
  root1: string,
  scaleType1: ScaleType,
  root2: string,
  scaleType2: ScaleType
): ScaleComparisonData {
  const scaleNotes1 = getScaleNotes(root1, scaleType1);
  const scaleNotes2 = getScaleNotes(root2, scaleType2);

  const sharedNotes = scaleNotes1.filter(n1 => scaleNotes2.some(n2 => isSameNote(n1, n2)));
  const uniqueNotes1 = scaleNotes1.filter(n1 => !scaleNotes2.some(n2 => isSameNote(n1, n2)));
  const uniqueNotes2 = scaleNotes2.filter(n2 => !scaleNotes1.some(n1 => isSameNote(n1, n2)));

  const chords1 = getScaleHarmonicChords(scaleNotes1, scaleType1);
  const chords2 = getScaleHarmonicChords(scaleNotes2, scaleType2);

  const sharedChords: SharedChordInfo[] = [];
  chords1.forEach(c1 => {
    const match = chords2.find(c2 => c1.type === c2.type && isSameNote(c1.notes[0], c2.notes[0]));
    if (match) {
      sharedChords.push({
        name: c1.name,
        type: c1.type,
        notes: c1.notes,
        numeral1: c1.numeral,
        numeral2: match.numeral,
        function1: c1.function,
        function2: match.function,
        role1: c1.functionRole,
        role2: match.functionRole,
        explanation: `Acts as ${c1.numeral} (${c1.function}) in ${root1} ${scaleType1}, but re-interprets as ${match.numeral} (${match.function}) in ${root2} ${scaleType2}.`
      });
    }
  });

  // Calculate note differences
  const noteDiffs: NoteDifference[] = [];
  uniqueNotes1.forEach(u1 => {
    const u1Semi = getNoteSemitone(u1);
    let closestU2: string | null = null;
    let minDiff = 99;
    uniqueNotes2.forEach(u2 => {
      const u2Semi = getNoteSemitone(u2);
      let diff = (u2Semi - u1Semi + 12) % 12;
      if (diff > 6) diff -= 12;
      if (Math.abs(diff) < Math.abs(minDiff)) {
        minDiff = diff;
        closestU2 = u2;
      }
    });

    if (closestU2 !== null && Math.abs(minDiff) <= 2) {
      noteDiffs.push({
        fromNote: u1,
        toNote: closestU2,
        semitones: Math.abs(minDiff),
        direction: minDiff > 0 ? 'up' : minDiff < 0 ? 'down' : 'same',
        description: minDiff > 0
          ? `${u1} raises ${minDiff === 1 ? 'a half-step' : 'a whole-step'} to ${closestU2}`
          : `${u1} lowers ${minDiff === -1 ? 'a half-step' : 'a whole-step'} to ${closestU2}`
      });
    }
  });

  // Determine Circle of Fifths positions
  const c1 = getCircleOfFifthsKey(root1);
  const c2 = getCircleOfFifthsKey(root2);
  const pos1 = c1 ? c1.positionIndex : 0;
  const pos2 = c2 ? c2.positionIndex : 0;
  const circleDist = Math.min((pos2 - pos1 + 12) % 12, (pos1 - pos2 + 12) % 12);

  // Check relationship type
  const isRelative = (
    (scaleType1 === 'major' && scaleType2 === 'minor' && sharedNotes.length === 7) ||
    (scaleType1 === 'minor' && scaleType2 === 'major' && sharedNotes.length === 7)
  );

  const isParallel = isSameNote(root1, root2) && scaleType1 !== scaleType2;

  let relType: ScaleComparisonData['relationship']['type'] = 'distant';
  let title = 'Distant Keys';
  let badge = `${sharedNotes.length} Common Notes`;
  let whyConnect: string[] = [];
  let howConnect: string[] = [];

  if (isRelative) {
    relType = 'relative';
    title = `Relative ${scaleType2 === 'major' ? 'Major' : 'Minor'} (Twin Keys)`;
    badge = '100% Note & Chord Overlap';
    whyConnect = [
      'Identical Harmonic DNA: Both scales share all 7 identical pitches and all 7 diatonic chords.',
      'Modal Inversion: They represent two emotional perspectives of the same key signature (bright & confident vs. introspective & melancholic).',
      'Effortless Emotional Shift: Listeners can transition between both tonalities without feeling any abrupt harmonic friction.'
    ];
    howConnect = [
      `The 6th degree of ${root1} Major becomes the 1st degree (tonic) of ${root2} Minor.`,
      `The ${scaleType1 === 'major' ? 'vi' : 'III'} chord in ${root1} is identical to the ${scaleType1 === 'major' ? 'i' : 'I'} chord in ${root2}.`,
      'Pop and rock music regularly alternates between these two keys in the same chorus or verse (e.g. C - G - Am - F).'
    ];
  } else if (isParallel) {
    relType = 'parallel';
    title = `Parallel ${scaleType2 === 'major' ? 'Major' : 'Minor'} (Modal Interchange)`;
    badge = 'Same Root (Borrowed Chords)';
    whyConnect = [
      'Same Tonal Center: Both scales share the exact same root pitch, anchoring the listener to the same home.',
      'Sudden Lighting Shift: Changing between Major and Minor alters 3 notes (3rd, 6th, and 7th), shifting the emotional atmosphere instantly.',
      'Cinematic Drama: Film composers and songwriters borrow chords from the parallel scale to inject bittersweet nostalgia or sudden gravity.'
    ];
    howConnect = [
      scaleType1 === 'major'
        ? `Borrow chords from ${root2} Minor into ${root1} Major—most famously the minor iv chord (${scaleNotes2[3]}m) and ♭VI chord (${scaleNotes2[5]}).`
        : `Borrow chords from ${root2} Major into ${root1} Minor, such as using the uplifting Major I or IV chord.`,
      'Voice Leading Magnet: In the minor iv chord, the lowered 6th degree resolves downwards by a half-step to the 5th degree of the tonic chord, creating an iconic emotional release.'
    ];
  } else if (scaleType1 === scaleType2 && (pos2 - pos1 + 12) % 12 === 1) {
    relType = 'circle_dominant';
    title = 'Dominant Key (Circle of 5ths Neighbor)';
    badge = '6 of 7 Notes Shared (+1 Sharp)';
    whyConnect = [
      'Acoustic Overtone Harmony: The interval of a perfect 5th is the 3rd harmonic in the natural acoustic overtone series, making it the strongest natural relationship in nature.',
      'Only 1 Altered Note: Moving clockwise adds exactly 1 sharp (or subtracts 1 flat), preserving 86% of the scale notes.',
      'Strongest Natural Pull: The new note introduced is the leading tone of the target scale, magnetically pulling our ear to the new tonic.'
    ];
    howConnect = [
      `They share 4 common pivot chords: ${sharedChords.map(c => c.name).join(', ')}.`,
      `To modulate, play any shared pivot chord (such as ${sharedChords[0]?.name || 'a pivot'}), followed by the target's Dominant V chord (${root2}'s V chord) resolving to ${root2} Major.`,
      'Smooth voice leading ensures no jarring jumps: only one note shifts by a single semitone.'
    ];
  } else if (scaleType1 === scaleType2 && (pos1 - pos2 + 12) % 12 === 1) {
    relType = 'circle_subdominant';
    title = 'Subdominant Key (Circle of 4ths Neighbor)';
    badge = '6 of 7 Notes Shared (+1 Flat)';
    whyConnect = [
      'Relaxation of Harmonic Tension: Moving counter-clockwise lowers the leading tone, relaxing tension and giving a warm, expansive feeling.',
      'Minimal Friction: Shares 6 of 7 notes and 4 diatonic chords.',
      'Foundational in Blues & Classical: Modulation to the subdominant is a hallmark of bridge sections, soulful ballads, and gospel.'
    ];
    howConnect = [
      `They share 4 pivot chords: ${sharedChords.map(c => c.name).join(', ')}.`,
      `Introduce the flat 7th of ${root1} (turning ${root1} into a Dominant 7th chord) to pull forcefully into ${root2} as the new resolution home.`
    ];
  } else if (circleDist <= 3 || sharedNotes.length >= 4) {
    relType = 'close';
    title = 'Closely Related Keys';
    badge = `${sharedNotes.length} Shared Notes (${sharedChords.length} Pivot Chords)`;
    whyConnect = [
      'High Common-Tone Density: Over half of the scale notes match, ensuring harmonious compatibility.',
      'Pivot Chord Bridges: The presence of shared chords allows smooth modulation without dissonance.',
      'Pleasing Color Shift: Enough differences to sound fresh and invigorating without losing musical orientation.'
    ];
    howConnect = [
      sharedChords.length > 0
        ? `Use the shared pivot chord (${sharedChords[0].name}) as the bridge between both keys.`
        : 'Use common-tone voice leading to connect the tonic chords directly.',
      `Lead into the target key using its dominant V chord to confirm the new tonal center.`
    ];
  } else {
    relType = 'distant';
    title = circleDist === 6 ? 'Tritone Polar Opposite' : 'Distant Chromatic Keys';
    badge = circleDist === 6 ? 'Maximum Contrast (6 Semitones)' : `${sharedNotes.length} Common Notes`;
    whyConnect = [
      'Maximal Harmonic Distance: Distinct color palettes create high drama, suspense, and unexpected beauty.',
      'Cinematic Surprise: Popular in film scores and prog rock for moments of epic transcendence or shocking revelation.',
      'Emotional Rebirth: A sudden shift to a distant key feels like stepping into an entirely new musical universe.'
    ];
    howConnect = [
      'Direct Chromatic Mediant: Shift directly between chords sharing a single common note.',
      'Secondary Dominant Chain: Modulate through a sequence of Circle of Fifths fifths to bridge the distance smoothly.',
      'Tritone Substitution: Exploit the symmetrical tritone interval to leap directly into the target resolution.'
    ];
  }

  // Generate bridge chord progression
  const bridgeProgression: BridgeChordStep[] = [];
  const baseTonicName = chords1[0]?.name || root1;
  const targetTonicName = chords2[0]?.name || root2;

  if (isRelative) {
    if (scaleType1 === 'major') {
      bridgeProgression.push({
        name: baseTonicName,
        numeral: 'I',
        notes: getVoicedChord(root1, 'major', 4),
        label: `${root1} Major Home`,
        description: 'Establishes the bright major tonal center.'
      });
      bridgeProgression.push({
        name: chords1[3]?.name || 'IV',
        numeral: 'IV in Maj / VI in Min',
        notes: getVoicedChord(scaleNotes1[3], 'major', 3),
        label: 'Shared Subdominant Bridge',
        isPivot: true,
        description: `Belongs to both keys (IV in ${root1}, VI in ${root2}m).`
      });
      bridgeProgression.push({
        name: `${scaleNotes2[4]}7`,
        numeral: 'V7 of Min',
        notes: getVoicedChord(scaleNotes2[4], 'dom7', 3),
        label: 'Harmonic Minor Dominant',
        description: `Introduces the raised leading tone to pull magnetically to ${root2}m.`
      });
      bridgeProgression.push({
        name: targetTonicName,
        numeral: 'i',
        notes: getVoicedChord(root2, 'minor', 3),
        label: `${root2} Minor Resolution`,
        isTargetTonic: true,
        description: 'Arrives at the relative minor tonic home.'
      });
    } else {
      bridgeProgression.push({
        name: baseTonicName,
        numeral: 'i',
        notes: getVoicedChord(root1, 'minor', 3),
        label: `${root1} Minor Home`,
        description: 'Establishes the minor tonal center.'
      });
      bridgeProgression.push({
        name: chords1[3]?.name || 'iv',
        numeral: 'iv in Min / ii in Maj',
        notes: getVoicedChord(scaleNotes1[3], 'minor', 4),
        label: 'Shared Predominant Bridge',
        isPivot: true,
        description: `Exists in both keys, softening the mood.`
      });
      bridgeProgression.push({
        name: `${scaleNotes2[4]}7`,
        numeral: 'V7 of Maj',
        notes: getVoicedChord(scaleNotes2[4], 'dom7', 3),
        label: 'Major Dominant 7th',
        description: `The dominant chord pulling directly to ${root2} Major.`
      });
      bridgeProgression.push({
        name: targetTonicName,
        numeral: 'I',
        notes: getVoicedChord(root2, 'major', 4),
        label: `${root2} Major Resolution`,
        isTargetTonic: true,
        description: 'Opens up into the triumphant relative major!'
      });
    }
  } else if (isParallel) {
    if (scaleType1 === 'major') {
      bridgeProgression.push({
        name: baseTonicName,
        numeral: 'I',
        notes: getVoicedChord(root1, 'major', 4),
        label: `${root1} Major Home`,
        description: 'Starting in pure major harmony.'
      });
      bridgeProgression.push({
        name: chords1[3]?.name || 'IV',
        numeral: 'IV',
        notes: getVoicedChord(scaleNotes1[3], 'major', 3),
        label: 'Major Subdominant',
        description: 'Standard bright diatonic departure.'
      });
      bridgeProgression.push({
        name: `${scaleNotes2[3]}m`,
        numeral: 'iv (Borrowed!)',
        notes: getVoicedChord(scaleNotes2[3], 'minor', 3),
        label: 'Borrowed Minor iv Chord',
        isPivot: true,
        description: `Borrowed from ${root2} Minor! The lowered 6th degree pulls down by half-step.`
      });
      bridgeProgression.push({
        name: targetTonicName,
        numeral: 'i / I',
        notes: getVoicedChord(root2, 'minor', 4),
        label: `${root2} Minor Arrival`,
        isTargetTonic: true,
        description: 'Resolves to parallel minor (or back to major for a bittersweet cadence).'
      });
    } else {
      bridgeProgression.push({
        name: baseTonicName,
        numeral: 'i',
        notes: getVoicedChord(root1, 'minor', 3),
        label: `${root1} Minor Home`,
        description: 'Starting in minor harmony.'
      });
      bridgeProgression.push({
        name: chords1[3]?.name || 'iv',
        numeral: 'iv',
        notes: getVoicedChord(scaleNotes1[3], 'minor', 3),
        label: 'Minor Subdominant',
        description: 'Dark, introspective pre-dominant.'
      });
      bridgeProgression.push({
        name: `${scaleNotes2[4]}7`,
        numeral: 'V7',
        notes: getVoicedChord(scaleNotes2[4], 'dom7', 3),
        label: 'Dominant 7th',
        description: 'Building tension with the leading tone.'
      });
      bridgeProgression.push({
        name: targetTonicName,
        numeral: 'I (Picardy Third!)',
        notes: getVoicedChord(root2, 'major', 4),
        label: `${root2} Major Arrival`,
        isTargetTonic: true,
        description: 'The Picardy Third! Resolves unexpectedly into bright major sunshine.'
      });
    }
  } else {
    // General or Circle of 5ths neighbor
    const pivot = sharedChords[0];
    const targetDominantRoot = scaleNotes2.length === 7 ? scaleNotes2[4] : root2;

    bridgeProgression.push({
      name: baseTonicName,
      numeral: 'I / i',
      notes: getVoicedChord(root1, scaleType1 === 'major' ? 'major' : 'minor', 4),
      label: `${root1} Home`,
      description: `Original key center of ${root1} ${scaleType1}.`
    });

    if (pivot) {
      bridgeProgression.push({
        name: pivot.name,
        numeral: `${pivot.numeral1} ⇄ ${pivot.numeral2}`,
        notes: getVoicedChord(pivot.notes[0], pivot.type === 'major' ? 'major' : 'minor', 3),
        label: 'Harmonic Pivot Bridge',
        isPivot: true,
        description: `Exists in BOTH keys (${pivot.numeral1} in ${root1}, ${pivot.numeral2} in ${root2})!`
      });
    } else {
      bridgeProgression.push({
        name: chords1[3]?.name || `${scaleNotes1[1]}m`,
        numeral: 'Subdominant / Step',
        notes: getVoicedChord(scaleNotes1[3] || root1, 'major', 3),
        label: 'Voice Leading Bridge',
        description: 'Moves harmonically toward the new key.'
      });
    }

    bridgeProgression.push({
      name: `${targetDominantRoot}7`,
      numeral: `V7 of ${root2}`,
      notes: getVoicedChord(targetDominantRoot, 'dom7', 3),
      label: 'Secondary Dominant',
      description: `The dominant magnet of ${root2}, pulling our ear into the new resolution.`
    });

    bridgeProgression.push({
      name: targetTonicName,
      numeral: 'I / i',
      notes: getVoicedChord(root2, scaleType2 === 'major' ? 'major' : 'minor', 3),
      label: `${root2} New Tonic!`,
      isTargetTonic: true,
      description: `Successfully modulates into ${root2} ${scaleType2}!`
    });
  }

  return {
    scaleNotes1,
    scaleNotes2,
    sharedNotes,
    uniqueNotes1,
    uniqueNotes2,
    chords1,
    chords2,
    sharedChords,
    noteDiffs,
    relationship: {
      type: relType,
      title,
      badge,
      keyDistance: circleDist,
      whyConnect,
      howConnect,
    },
    bridgeProgression
  };
}

export type ChordScaleMode = {
  degree: number;
  romanNumeral: string;
  chordName: string;
  chordType: 'major' | 'minor' | 'diminished';
  chordNotes: string[];
  seventhName: string;
  seventhNotes: string[];
  harmonicFunction: HarmonicFunction;
  modeName: string;
  fullScaleName: string;
  modeNotes: string[];
  formula: string;
  character: string;
  moodColor: string;
};

export function getChordScaleNetwork(rootNote: string, scaleType: ScaleType): ChordScaleMode[] {
  const baseScaleNotes = getScaleNotes(rootNote, scaleType);
  if (baseScaleNotes.length !== 7) return [];

  const chords = getScaleHarmonicChords(baseScaleNotes, scaleType);
  const isMajor = scaleType === 'major';

  const majorModesMeta = [
    { modeName: 'Ionian (Major)', formula: '1 - 2 - 3 - 4 - 5 - 6 - 7', character: 'Pure, uplifting, foundational tonal home.', color: '#7cdffc' },
    { modeName: 'Dorian', formula: '1 - 2 - ♭3 - 4 - 5 - 6 - ♭7', character: 'Minor with a bright natural 6th. Soulful jazz, blues, and funk flavor.', color: '#38bdf8' },
    { modeName: 'Phrygian', formula: '1 - ♭2 - ♭3 - 4 - 5 - ♭6 - ♭7', character: 'Minor with a dark half-step 2nd. Spanish Flamenco, exotic and mystical.', color: '#a855f7' },
    { modeName: 'Lydian', formula: '1 - 2 - 3 - ♯4 - 5 - 6 - 7', character: 'Major with a dreamy raised 4th (#11). Cinematic, magical, and futuristic.', color: '#ec4899' },
    { modeName: 'Mixolydian', formula: '1 - 2 - 3 - 4 - 5 - 6 - ♭7', character: 'Major with a flat 7th. Classic rock, blues, and dominant drive.', color: '#f59e0b' },
    { modeName: 'Aeolian (Natural Minor)', formula: '1 - 2 - ♭3 - 4 - 5 - ♭6 - ♭7', character: 'The emotional natural minor standard. Somber, reflective, and poetic.', color: '#6366f1' },
    { modeName: 'Locrian', formula: '1 - ♭2 - ♭3 - 4 - ♭5 - ♭6 - ♭7', character: 'Diminished 5th tension. Unresolved, sharp dissonance pulling to tonic.', color: '#ef4444' },
  ];

  const minorModesMeta = [
    { modeName: 'Aeolian (Natural Minor)', formula: '1 - 2 - ♭3 - 4 - 5 - ♭6 - ♭7', character: 'Minor tonic center of gravity. Somber and emotional.', color: '#6366f1' },
    { modeName: 'Locrian', formula: '1 - ♭2 - ♭3 - 4 - ♭5 - ♭6 - ♭7', character: 'Half-diminished tension. Building momentum toward V.', color: '#ef4444' },
    { modeName: 'Ionian (Relative Major)', formula: '1 - 2 - 3 - 4 - 5 - 6 - 7', character: 'Relative Major lift. Pure, expansive, triumphant contrast.', color: '#7cdffc' },
    { modeName: 'Dorian', formula: '1 - 2 - ♭3 - 4 - 5 - 6 - ♭7', character: 'Subdominant minor. Soulful, warm, with natural 6th.', color: '#38bdf8' },
    { modeName: 'Phrygian', formula: '1 - ♭2 - ♭3 - 4 - 5 - ♭6 - ♭7', character: 'Minor dominant. Spanish mystery and harmonic tension.', color: '#a855f7' },
    { modeName: 'Lydian', formula: '1 - 2 - 3 - ♯4 - 5 - 6 - 7', character: 'Submediant major. Majestic, soaring, and cinematic.', color: '#ec4899' },
    { modeName: 'Mixolydian', formula: '1 - 2 - 3 - 4 - 5 - 6 - ♭7', character: 'Subtonic major. Bluesy transition back to the minor tonic.', color: '#f59e0b' },
  ];

  const modesMeta = isMajor ? majorModesMeta : minorModesMeta;

  return chords.map((chord, idx) => {
    const modeNotes: string[] = [];
    for (let step = 0; step < 7; step++) {
      modeNotes.push(baseScaleNotes[(idx + step) % 7]);
    }

    const meta = modesMeta[idx];
    const rootOfMode = modeNotes[0];

    return {
      degree: idx + 1,
      romanNumeral: chord.numeral,
      chordName: chord.name,
      chordType: chord.type,
      chordNotes: chord.notes,
      seventhName: chord.seventhName,
      seventhNotes: chord.seventhNotes,
      harmonicFunction: chord.function,
      modeName: meta.modeName,
      fullScaleName: `${rootOfMode} ${meta.modeName}`,
      modeNotes,
      formula: meta.formula,
      character: meta.character,
      moodColor: meta.color
    };
  });
}
