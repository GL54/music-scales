import { getGuitarFretboard } from './src/utils/musicTheory';
const fretboard = [...getGuitarFretboard(16)].reverse();
const fretRange = [0, 4];
const allowedFretPositions = new Set<string>();
const seenFullNotes = new Set<string>();
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
console.log('2-4 is allowed:', allowedFretPositions.has('2-4'));
console.log('1-0 is allowed:', allowedFretPositions.has('1-0'));
console.log('Allowed:', Array.from(allowedFretPositions));
