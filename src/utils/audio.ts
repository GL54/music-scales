import * as Tone from 'tone';

let pianoSynth: Tone.PolySynth | null = null;
let guitarSynth: Tone.Sampler | null = null;
let isInitialized = false;
let isInitializing = false;

/**
 * Preloads the audio samples without starting the AudioContext.
 * This fetches the files in the background so they are ready.
 */
export const preloadAudio = () => {
  if (pianoSynth || guitarSynth) return;
  
  // Create a pleasant-sounding polyphonic synthesizer for the piano
  pianoSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "triangle" // softer than square/sawtooth
    },
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 1,
    }
  }).toDestination();
  pianoSynth.volume.value = -12;
  
  // Create an acoustic guitar sampler
  guitarSynth = new Tone.Sampler({
    urls: {
      "C3": "C3.mp3",
      "E3": "E3.mp3",
      "G3": "G3.mp3",
      "C4": "C4.mp3",
      "E4": "E4.mp3",
      "G4": "G4.mp3",
    },
    baseUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_guitar_nylon-mp3/",
  }).toDestination();
  guitarSynth.volume.value = -5; // Adjust volume as needed
};

/**
 * Initializes the audio context and synthesizers on first user interaction.
 * Web Audio API requires a user gesture before it can play sound.
 */
export const initAudio = async () => {
  if (isInitialized || isInitializing) return;
  isInitializing = true;
  
  try {
    await Tone.start();
    
    if (!pianoSynth || !guitarSynth) {
      preloadAudio();
    }
    
    // Wait for all samples to download and decode
    await Tone.loaded();
    
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Tone.js:", error);
  } finally {
    isInitializing = false;
  }
};

export type InstrumentType = 'piano' | 'guitar';

/**
 * Plays a specific note or an array of notes (chord) on the specified instrument.
 */
export const playNote = async (
  note: string | string[], 
  instrument: InstrumentType = 'piano',
  isSustain: boolean = false
) => {
  if (!isInitialized) {
    await initAudio();
  }
  
  try {
    if (instrument === 'guitar' && guitarSynth) {
      if (isSustain) {
        guitarSynth.triggerAttack(note);
      } else {
        guitarSynth.triggerAttackRelease(note, "1n");
      }
    } else if (pianoSynth) {
      const duration = isSustain ? "2n" : "8n";
      pianoSynth.triggerAttackRelease(note, duration);
    }
  } catch (error) {
    console.error("Error playing note:", error);
  }
};

/**
 * Plays notes sequentially (arpeggio).
 */
export const playArpeggio = async (
  notes: string[], 
  instrument: InstrumentType = 'piano',
  isSustain: boolean = false,
  delayBetweenNotes: number = 0.2 // seconds
) => {
  if (!isInitialized) {
    await initAudio();
  }
  
  try {
    const now = Tone.now();
    notes.forEach((note, i) => {
      const time = now + i * delayBetweenNotes;
      
      if (instrument === 'guitar' && guitarSynth) {
        if (isSustain) {
          guitarSynth.triggerAttack(note, time);
        } else {
          guitarSynth.triggerAttackRelease(note, "1n", time);
        }
      } else if (pianoSynth) {
        const duration = isSustain ? "2n" : "8n";
        pianoSynth.triggerAttackRelease(note, duration, time);
      }
    });
  } catch (error) {
    console.error("Error playing arpeggio:", error);
  }
};
