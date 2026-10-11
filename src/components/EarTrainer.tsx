import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  COMMON_ROOTS,
  getVoicedChord,
  getScaleNotes,
  type EarTrainingChordQuality,
} from "../utils/musicTheory";
import { playNote, playArpeggio, preloadAudio, type InstrumentType } from "../utils/audio";

type TrainingCategory = "chords" | "notes" | "progressions";

type ChordDifficulty = "basic" | "triads" | "sevenths" | "all";

type ChordMeta = {
  id: EarTrainingChordQuality;
  name: string;
  symbol: string;
  formula: string;
  mood: string;
  description: string;
  category: "basic" | "triads" | "sevenths";
};

const CHORD_LIBRARY: ChordMeta[] = [
  {
    id: "major",
    name: "Major",
    symbol: "Maj",
    formula: "1 - 3 - 5",
    mood: "Bright, resolved, triumphant",
    description: "Built with a Major 3rd and Perfect 5th. Pure consonant foundation.",
    category: "basic",
  },
  {
    id: "minor",
    name: "Minor",
    symbol: "m",
    formula: "1 - ♭3 - 5",
    mood: "Dark, melancholic, emotional",
    description: "Lowering the 3rd by a half-step introduces profound introspection.",
    category: "basic",
  },
  {
    id: "diminished",
    name: "Diminished",
    symbol: "dim",
    formula: "1 - ♭3 - ♭5",
    mood: "Tense, suspenseful, spooky",
    description: "Stacked minor 3rds create a tritone, pulling intensely to resolve.",
    category: "triads",
  },
  {
    id: "augmented",
    name: "Augmented",
    symbol: "aug",
    formula: "1 - 3 - ♯5",
    mood: "Surreal, floating, dream-like",
    description: "Stacked major 3rds create an unresolved whole-tone floating sound.",
    category: "triads",
  },
  {
    id: "sus4",
    name: "Suspended 4th",
    symbol: "sus4",
    formula: "1 - 4 - 5",
    mood: "Open, expectant, floating",
    description: "Replaces the 3rd with the 4th, waiting to resolve down to the major 3rd.",
    category: "triads",
  },
  {
    id: "sus2",
    name: "Suspended 2nd",
    symbol: "sus2",
    formula: "1 - 2 - 5",
    mood: "Airy, modern, gentle warmth",
    description: "Replaces the 3rd with the 2nd for an open, contemporary acoustic sound.",
    category: "triads",
  },
  {
    id: "dom7",
    name: "Dominant 7th",
    symbol: "7",
    formula: "1 - 3 - 5 - ♭7",
    mood: "Bluesy, restless, drive",
    description: "Major triad + minor 7th. Contains the tritone that magnetically pulls to I.",
    category: "sevenths",
  },
  {
    id: "maj7",
    name: "Major 7th",
    symbol: "maj7",
    formula: "1 - 3 - 5 - 7",
    mood: "Lush, jazzy, nostalgic warmth",
    description: "Major triad + natural 7th. Half-step friction with octave creates luxury.",
    category: "sevenths",
  },
  {
    id: "m7",
    name: "Minor 7th",
    symbol: "m7",
    formula: "1 - ♭3 - 5 - ♭7",
    mood: "Smooth, mellow, neo-soul",
    description: "Minor triad + minor 7th. Softens the sadness into chilled soul harmony.",
    category: "sevenths",
  },
  {
    id: "m7b5",
    name: "Half-Diminished",
    symbol: "m7♭5",
    formula: "1 - ♭3 - ♭5 - ♭7",
    mood: "Bittersweet, cinematic yearning",
    description: "Diminished triad + minor 7th. Hallmark ii chord in minor and bossa nova.",
    category: "sevenths",
  },
  {
    id: "dim7",
    name: "Diminished 7th",
    symbol: "dim7",
    formula: "1 - ♭3 - ♭5 - 𝄫7",
    mood: "Dramatic, peak horror, thriller",
    description: "Completely symmetrical minor 3rds. Pure dramatic instability.",
    category: "sevenths",
  },
];

type ProgressionQuiz = {
  id: string;
  name: string;
  genre: string;
  numerals: string[];
  chords: { name: string; type: EarTrainingChordQuality; rootOffset: number }[];
  description: string;
};

const PROGRESSION_PRESETS: ProgressionQuiz[] = [
  {
    id: "pop-axis",
    name: "The Pop 4-Chord Axis",
    genre: "Pop / Rock",
    numerals: ["I", "V", "vi", "IV"],
    chords: [
      { name: "I", type: "major", rootOffset: 0 },
      { name: "V", type: "major", rootOffset: 7 },
      { name: "vi", type: "minor", rootOffset: 9 },
      { name: "IV", type: "major", rootOffset: 5 },
    ],
    description: "Heard in hundreds of hits: 'Don't Stop Believin', 'Someone Like You', 'Let It Be'.",
  },
  {
    id: "classic-cadence",
    name: "Classic Folk / Classical",
    genre: "Classical / Folk",
    numerals: ["I", "IV", "V", "I"],
    chords: [
      { name: "I", type: "major", rootOffset: 0 },
      { name: "IV", type: "major", rootOffset: 5 },
      { name: "V", type: "major", rootOffset: 7 },
      { name: "I", type: "major", rootOffset: 0 },
    ],
    description: "The fundamental authentic cadence: departure to IV, tension at V, home to I.",
  },
  {
    id: "emotional-anthem",
    name: "The Emotional Anthem",
    genre: "Alternative / Film",
    numerals: ["vi", "IV", "I", "V"],
    chords: [
      { name: "vi", type: "minor", rootOffset: 9 },
      { name: "IV", type: "major", rootOffset: 5 },
      { name: "I", type: "major", rootOffset: 0 },
      { name: "V", type: "major", rootOffset: 7 },
    ],
    description: "Starts in minor vulnerability and opens into major triumph: 'Zombie', 'Despacito'.",
  },
  {
    id: "jazz-two-five-one",
    name: "The Jazz ii - V - I",
    genre: "Jazz / Neo-Soul",
    numerals: ["ii", "V", "I", "I"],
    chords: [
      { name: "ii", type: "minor", rootOffset: 2 },
      { name: "V", type: "dom7", rootOffset: 7 },
      { name: "I", type: "maj7", rootOffset: 0 },
      { name: "I", type: "maj7", rootOffset: 0 },
    ],
    description: "The cornerstone of jazz harmony: predominant step, dominant tension, tonic resolution.",
  },
  {
    id: "doo-wop",
    name: "50s Doo-Wop Ballad",
    genre: "50s / Soul",
    numerals: ["I", "vi", "IV", "V"],
    chords: [
      { name: "I", type: "major", rootOffset: 0 },
      { name: "vi", type: "minor", rootOffset: 9 },
      { name: "IV", type: "major", rootOffset: 5 },
      { name: "V", type: "major", rootOffset: 7 },
    ],
    description: "Nostalgic retro ballad standard: 'Stand By Me', 'Earth Angel'.",
  },
];

const CHROMATIC_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const EarTrainer: React.FC = () => {
  const [category, setCategory] = useState<TrainingCategory>("chords");

  // Audio settings
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const [isSustain, setIsSustain] = useState<boolean>(true);
  const [playStyle, setPlayStyle] = useState<"strum" | "arpeggio" | "both">("strum");

  // Score & Gamification
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);

  // Status state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // 1. Chord Quality Quiz State
  const [chordDifficulty, setChordDifficulty] = useState<ChordDifficulty>("triads");
  const [chordRootMode, setChordRootMode] = useState<"fixedC" | "random">("random");
  const [currentChordQuestion, setCurrentChordQuestion] = useState<{
    root: string;
    quality: ChordMeta;
    notes: string[];
  } | null>(null);

  // 2. Note / Scale Degree Quiz State
  const [noteTonic, setNoteTonic] = useState<string>("C");
  const [noteMode, setNoteMode] = useState<"diatonic" | "chromatic">("diatonic");
  const [currentNoteQuestion, setCurrentNoteQuestion] = useState<{
    note: string;
    degreeNumber: number;
    degreeName: string;
    solfege: string;
    semitones: number;
  } | null>(null);

  // 3. Progression Quiz State
  const [progressionTonic, setProgressionTonic] = useState<string>("C");
  const [currentProgressionQuestion, setCurrentProgressionQuestion] = useState<{
    progression: ProgressionQuiz;
    chordsData: { name: string; notes: string[] }[];
  } | null>(null);
  const [activeProgressionStep, setActiveProgressionStep] = useState<number | null>(null);

  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    preloadAudio();
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Filter available chord options by difficulty
  const availableChords = useMemo(() => {
    if (chordDifficulty === "basic") {
      return CHORD_LIBRARY.filter((c) => c.category === "basic");
    }
    if (chordDifficulty === "triads") {
      return CHORD_LIBRARY.filter((c) => c.category === "basic" || c.category === "triads");
    }
    if (chordDifficulty === "sevenths") {
      return CHORD_LIBRARY.filter((c) => c.category === "sevenths");
    }
    return CHORD_LIBRARY;
  }, [chordDifficulty]);

  // Audio Playback
  const playMysteryChord = useCallback(
    (notes: string[], style: "strum" | "arpeggio" | "both" = playStyle) => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
      setIsPlayingAudio(true);

      if (style === "strum") {
        playNote(notes, instrument, isSustain);
        const t = setTimeout(() => setIsPlayingAudio(false), isSustain ? 1800 : 900);
        timeoutRefs.current.push(t);
      } else if (style === "arpeggio") {
        playArpeggio(notes, instrument, isSustain, 0.22);
        const t = setTimeout(() => setIsPlayingAudio(false), notes.length * 220 + 800);
        timeoutRefs.current.push(t);
      } else {
        // Both: Arpeggio up, then strum together!
        playArpeggio(notes, instrument, isSustain, 0.2);
        const t = setTimeout(() => {
          playNote(notes, instrument, isSustain);
          const t2 = setTimeout(() => setIsPlayingAudio(false), 1200);
          timeoutRefs.current.push(t2);
        }, notes.length * 200 + 300);
        timeoutRefs.current.push(t);
      }
    },
    [instrument, isSustain, playStyle]
  );

  // Play Reference Tonic Home
  const playReferenceTonic = useCallback(
    (root: string = "C") => {
      const triad = getVoicedChord(root, "major", 4);
      playNote(triad, instrument, true);
    },
    [instrument]
  );

  // 1. Generate Next Chord Question
  const generateChordQuestion = useCallback(() => {
    const root = chordRootMode === "fixedC" ? "C" : COMMON_ROOTS[Math.floor(Math.random() * COMMON_ROOTS.length)];
    const randomQuality = availableChords[Math.floor(Math.random() * availableChords.length)];
    const notes = getVoicedChord(root, randomQuality.id, 4);

    setCurrentChordQuestion({ root, quality: randomQuality, notes });
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);

    // Auto-play the new mystery chord
    setTimeout(() => {
      playMysteryChord(notes, playStyle);
    }, 150);
  }, [availableChords, chordRootMode, playMysteryChord, playStyle]);

  // 2. Generate Next Note Question
  const generateNoteQuestion = useCallback(() => {
    const diatonicNotes = getScaleNotes(noteTonic, "major");
    const solfegeMap = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti"];
    const degreeNames = [
      "Tonic (1st)",
      "Supertonic (2nd)",
      "Mediant (3rd)",
      "Subdominant (4th)",
      "Dominant (5th)",
      "Submediant (6th)",
      "Leading Tone (7th)",
    ];

    if (noteMode === "diatonic") {
      const randIdx = Math.floor(Math.random() * 7);
      const chosenNote = diatonicNotes[randIdx];
      setCurrentNoteQuestion({
        note: chosenNote,
        degreeNumber: randIdx + 1,
        degreeName: degreeNames[randIdx],
        solfege: solfegeMap[randIdx],
        semitones: randIdx,
      });

      setSelectedAnswer(null);
      setIsAnswerRevealed(false);

      // Play note
      setTimeout(() => {
        playNote(`${chosenNote}4`, instrument, isSustain);
      }, 150);
    } else {
      // Chromatic Mode (12 semitones)
      const randOffset = Math.floor(Math.random() * 12);
      const chosenNote = CHROMATIC_NOTES[randOffset];
      setCurrentNoteQuestion({
        note: chosenNote,
        degreeNumber: randOffset + 1,
        degreeName: `Interval: ${randOffset} semitones`,
        solfege: "",
        semitones: randOffset,
      });

      setSelectedAnswer(null);
      setIsAnswerRevealed(false);

      setTimeout(() => {
        playNote(`${chosenNote}4`, instrument, isSustain);
      }, 150);
    }
  }, [instrument, isSustain, noteMode, noteTonic]);

  // 3. Generate Next Progression Question
  const generateProgressionQuestion = useCallback(() => {
    const randomProg = PROGRESSION_PRESETS[Math.floor(Math.random() * PROGRESSION_PRESETS.length)];
    const tonicIdx = CHROMATIC_NOTES.indexOf(progressionTonic);

    const chordsData = randomProg.chords.map((c) => {
      const chordRoot = CHROMATIC_NOTES[(tonicIdx + c.rootOffset) % 12];
      const notes = getVoicedChord(chordRoot, c.type, 4);
      return { name: `${chordRoot} (${c.name})`, notes };
    });

    setCurrentProgressionQuestion({ progression: randomProg, chordsData });
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setActiveProgressionStep(null);

    // Play progression
    setTimeout(() => {
      chordsData.forEach((chord, i) => {
        const t = setTimeout(() => {
          setActiveProgressionStep(i);
          playNote(chord.notes, instrument, isSustain);
        }, i * 1100);
        timeoutRefs.current.push(t);
      });
      const endT = setTimeout(() => {
        setActiveProgressionStep(null);
      }, chordsData.length * 1100 + 400);
      timeoutRefs.current.push(endT);
    }, 200);
  }, [instrument, isSustain, progressionTonic]);

  // Initialize question on mount or category change
  useEffect(() => {
    if (category === "chords") {
      generateChordQuestion();
    } else if (category === "notes") {
      generateNoteQuestion();
    } else {
      generateProgressionQuestion();
    }
  }, [category, chordDifficulty, chordRootMode, generateChordQuestion, generateNoteQuestion, generateProgressionQuestion, noteMode, noteTonic]);

  // Answer Validation
  const handleSelectAnswer = (answer: string) => {
    if (isAnswerRevealed) return;

    setSelectedAnswer(answer);
    setIsAnswerRevealed(true);
    setTotalQuestions((prev) => prev + 1);

    let isCorrect = false;

    if (category === "chords" && currentChordQuestion) {
      isCorrect = answer === currentChordQuestion.quality.id;
    } else if (category === "notes" && currentNoteQuestion) {
      isCorrect = answer === currentNoteQuestion.note || answer === `${currentNoteQuestion.degreeNumber}`;
    } else if (category === "progressions" && currentProgressionQuestion) {
      isCorrect = answer === currentProgressionQuestion.progression.id;
    }

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  // Keyboard shortcut listener for spacebar / R to replay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (category === "chords" && currentChordQuestion) {
          playMysteryChord(currentChordQuestion.notes);
        } else if (category === "notes" && currentNoteQuestion) {
          playNote(`${currentNoteQuestion.note}4`, instrument, isSustain);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [category, currentChordQuestion, currentNoteQuestion, instrument, isSustain, playMysteryChord]);

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto bg-[#040d12] rounded-3xl shadow-2xl space-y-8 w-full border border-white/5 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-[#7cdffc]/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-[#fa1ea2]/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative z-10 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#7cdffc] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Aural Skills & Pitch Perception Studio
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7cdffc] via-[#a855f7] to-[#fa1ea2] drop-shadow-sm">
            Ear Training Studio
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
            Train your ears to recognize chords, intervals, scale degrees, and chord progressions instinctively.
          </p>
        </div>

        {/* Global Controls & Gamification Score Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl items-center">
          {/* Main Category Tabs */}
          <div className="md:col-span-6 flex p-1 rounded-2xl bg-black/40 border border-white/10">
            {[
              { id: "chords" as TrainingCategory, label: "🎹 Chords Ear Training" },
              { id: "notes" as TrainingCategory, label: "🎯 Notes & Degrees" },
              { id: "progressions" as TrainingCategory, label: "🎼 Progressions" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  category === tab.id
                    ? "bg-gradient-to-r from-[#7cdffc] to-[#a855f7] text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gamification Stats */}
          <div className="md:col-span-6 flex flex-wrap items-center justify-end gap-3 text-xs">
            {/* Streak */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-black/40 border border-amber-500/30 flex items-center gap-2">
              <span className="text-base">🔥</span>
              <div>
                <span className="font-bold text-amber-300">Streak: {streak}</span>
                <span className="text-[10px] text-gray-400 block">Best: {bestStreak}</span>
              </div>
            </div>

            {/* Score */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-black/40 border border-[#7cdffc]/30 flex items-center gap-2">
              <span className="text-base">🎯</span>
              <div>
                <span className="font-bold text-[#7cdffc]">{accuracy}%</span>
                <span className="text-[10px] text-gray-400 block">
                  {correctCount} / {totalQuestions}
                </span>
              </div>
            </div>

            {/* Sound Switcher */}
            <div className="bg-black/40 p-1 rounded-full flex gap-1 border border-white/10">
              <button
                onClick={() => setInstrument("piano")}
                className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                  instrument === "piano" ? "bg-[#7cdffc] text-black font-extrabold" : "text-gray-400 hover:text-white"
                }`}
              >
                Piano
              </button>
              <button
                onClick={() => setInstrument("guitar")}
                className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                  instrument === "guitar" ? "bg-[#fa1ea2] text-white font-extrabold" : "text-gray-400 hover:text-white"
                }`}
              >
                Guitar
              </button>
              <button
                onClick={() => setIsSustain(!isSustain)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  isSustain
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                }`}
                title="Toggle note sustain"
              >
                {isSustain ? "Sustain" : "Staccato"}
              </button>
            </div>
          </div>
        </div>

        {/* CATEGORY 1: CHORD EAR TRAINING */}
        {category === "chords" && (
          <div className="space-y-6">
            {/* Difficulty & Sound Settings */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/30 border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Difficulty:</span>
                {[
                  { id: "basic" as ChordDifficulty, label: "Major vs Minor" },
                  { id: "triads" as ChordDifficulty, label: "All Triads (6)" },
                  { id: "sevenths" as ChordDifficulty, label: "7th Chords (5)" },
                  { id: "all" as ChordDifficulty, label: "Mastery (All 11)" },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setChordDifficulty(d.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      chordDifficulty === d.id
                        ? "bg-[#fa1ea2]/20 text-[#fa1ea2] border-[#fa1ea2]/50 shadow-sm"
                        : "bg-white/5 text-gray-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Play Mode:</span>
                <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/10 text-xs">
                  <button
                    onClick={() => setPlayStyle("strum")}
                    className={`px-2.5 py-0.5 rounded-lg font-bold ${
                      playStyle === "strum" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Strum
                  </button>
                  <button
                    onClick={() => setPlayStyle("arpeggio")}
                    className={`px-2.5 py-0.5 rounded-lg font-bold ${
                      playStyle === "arpeggio" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Arpeggio
                  </button>
                  <button
                    onClick={() => setPlayStyle("both")}
                    className={`px-2.5 py-0.5 rounded-lg font-bold ${
                      playStyle === "both" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Both
                  </button>
                </div>

                <button
                  onClick={() => setChordRootMode(chordRootMode === "fixedC" ? "random" : "fixedC")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                    chordRootMode === "fixedC"
                      ? "bg-amber-400/20 text-amber-300 border-amber-400/50"
                      : "bg-white/5 text-gray-400 border-white/5 hover:text-white"
                  }`}
                  title="Fix all chords to root C or randomize roots"
                >
                  Root: {chordRootMode === "fixedC" ? "Fixed (C)" : "Randomized"}
                </button>
              </div>
            </div>

            {/* Mystery Sound Stage */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 via-black/40 to-white/5 border border-white/15 text-center space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
                  Mystery Chord Challenge
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Listen closely: What chord quality is this?
                </h3>
              </div>

              {/* Big Interactive Replay Button */}
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => currentChordQuestion && playMysteryChord(currentChordQuestion.notes)}
                  className={`px-8 py-4 rounded-full text-base font-extrabold transition-all duration-300 flex items-center gap-3 shadow-xl ${
                    isPlayingAudio
                      ? "bg-[#fa1ea2] text-white scale-105 shadow-[0_0_25px_rgba(250,30,162,0.6)] animate-pulse"
                      : "bg-gradient-to-r from-[#fa1ea2] via-[#a855f7] to-[#7cdffc] text-white hover:scale-105 shadow-[0_0_20px_rgba(250,30,162,0.4)]"
                  }`}
                >
                  <span className="text-xl">{isPlayingAudio ? "🔊" : "▶"}</span>
                  {isPlayingAudio ? "Listening..." : "Replay Chord (Spacebar)"}
                </button>

                <button
                  onClick={() => currentChordQuestion && playMysteryChord(currentChordQuestion.notes, "arpeggio")}
                  title="Play as Slow Arpeggio"
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white text-lg transition-transform hover:scale-105"
                >
                  🎹
                </button>
              </div>

              {/* Answer Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto pt-4">
                {availableChords.map((chord) => {
                  const isSelected = selectedAnswer === chord.id;
                  const isCorrect = currentChordQuestion?.quality.id === chord.id;

                  let buttonStyles = "bg-white/5 border-white/10 text-white hover:bg-white/15 hover:border-white/25";

                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      buttonStyles =
                        "bg-emerald-500/30 border-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.5)] scale-105";
                    } else if (isSelected) {
                      buttonStyles = "bg-rose-500/30 border-rose-500 text-white shadow-md";
                    } else {
                      buttonStyles = "opacity-40 bg-white/5 border-white/5 text-gray-400";
                    }
                  }

                  return (
                    <motion.button
                      key={chord.id}
                      whileHover={!isAnswerRevealed ? { scale: 1.03 } : {}}
                      whileTap={!isAnswerRevealed ? { scale: 0.97 } : {}}
                      onClick={() => handleSelectAnswer(chord.id)}
                      disabled={isAnswerRevealed}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden ${buttonStyles}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-base font-extrabold">{chord.name}</span>
                        <span className="text-xs font-mono font-bold text-[#7cdffc]">{chord.symbol}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 block">{chord.formula}</span>
                      <span className="text-[10px] text-gray-400 block mt-1 line-clamp-1 italic">{chord.mood}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Answer Reveal Feedback & Pedagogical Breakdown */}
              <AnimatePresence>
                {isAnswerRevealed && currentChordQuestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="p-6 rounded-2xl bg-black/60 border border-white/15 max-w-3xl mx-auto text-left space-y-4 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            selectedAnswer === currentChordQuestion.quality.id ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {selectedAnswer === currentChordQuestion.quality.id
                            ? "✓ Brilliant! Correct Answer!"
                            : `✗ Incorrect! You heard ${currentChordQuestion.root} ${currentChordQuestion.quality.name}`}
                        </span>
                        <h4 className="text-2xl font-extrabold text-white mt-1">
                          {currentChordQuestion.root} {currentChordQuestion.quality.name} ({currentChordQuestion.quality.symbol})
                        </h4>
                      </div>

                      <button
                        onClick={generateChordQuestion}
                        className="px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-[#fa1ea2] to-[#7cdffc] text-white hover:scale-105 transition-all shadow-md"
                      >
                        Next Challenge ➔
                      </button>
                    </div>

                    {/* Isolated Pitches to click & hear */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Constituent Pitches (Click each to isolate):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentChordQuestion.notes.map((noteWithOctave, i) => {
                          const cleanNote = noteWithOctave.replace(/\d+/, "");
                          return (
                            <button
                              key={i}
                              onClick={() => playNote(noteWithOctave, instrument, isSustain)}
                              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-mono font-bold text-white transition-transform hover:scale-105"
                            >
                              {cleanNote} <span className="text-[10px] text-[#7cdffc]">▶</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      <strong>Ear Training Insight:</strong> {currentChordQuestion.quality.description} Emotional color:{" "}
                      <em>{currentChordQuestion.quality.mood}</em>.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* CATEGORY 2: NOTES & SCALE DEGREES EAR TRAINING */}
        {category === "notes" && (
          <div className="space-y-6">
            {/* Key Center & Mode Settings */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/30 border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Key Center (Tonic):</span>
                <div className="flex flex-wrap gap-1">
                  {["C", "D", "E", "F", "G", "A", "B"].map((note) => (
                    <button
                      key={note}
                      onClick={() => setNoteTonic(note)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        noteTonic === note
                          ? "bg-[#7cdffc] text-black font-extrabold shadow-sm"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/10 text-xs">
                  <button
                    onClick={() => setNoteMode("diatonic")}
                    className={`px-3 py-1 rounded-lg font-bold ${
                      noteMode === "diatonic" ? "bg-[#7cdffc]/20 text-[#7cdffc]" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Diatonic (7 Degrees)
                  </button>
                  <button
                    onClick={() => setNoteMode("chromatic")}
                    className={`px-3 py-1 rounded-lg font-bold ${
                      noteMode === "chromatic" ? "bg-[#fa1ea2]/20 text-[#fa1ea2]" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Chromatic (12 Notes)
                  </button>
                </div>

                <button
                  onClick={() => playReferenceTonic(noteTonic)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-1.5"
                >
                  <span>🏠</span> Re-hear Tonic Home ({noteTonic})
                </button>
              </div>
            </div>

            {/* Mystery Note Stage */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 via-black/40 to-white/5 border border-white/15 text-center space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#7cdffc]">
                  Relative Pitch Challenge (Key of {noteTonic} Major)
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Identify the mystery pitch relative to {noteTonic}
                </h3>
              </div>

              {/* Sound Controls */}
              <div className="flex justify-center items-center gap-3">
                <button
                  onClick={() => currentNoteQuestion && playNote(`${currentNoteQuestion.note}4`, instrument, isSustain)}
                  className="px-8 py-4 rounded-full text-base font-extrabold bg-gradient-to-r from-[#7cdffc] via-[#a855f7] to-[#fa1ea2] text-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(124,223,252,0.4)] flex items-center gap-3"
                >
                  <span>▶</span> Replay Mystery Pitch
                </button>

                <button
                  onClick={() => playReferenceTonic(noteTonic)}
                  className="px-5 py-4 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all flex items-center gap-2"
                >
                  <span>🏠</span> Play {noteTonic} Tonic Reference
                </button>
              </div>

              {/* Answer Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 max-w-4xl mx-auto pt-4">
                {(noteMode === "diatonic"
                  ? getScaleNotes(noteTonic, "major")
                  : CHROMATIC_NOTES
                ).map((note, idx) => {
                  const solfegeNames = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti"];
                  const isSelected = selectedAnswer === note;
                  const isCorrect = currentNoteQuestion?.note === note;

                  let buttonStyles = "bg-white/5 border-white/10 text-white hover:bg-white/15";

                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      buttonStyles = "bg-emerald-500/30 border-emerald-400 text-white shadow-lg scale-105";
                    } else if (isSelected) {
                      buttonStyles = "bg-rose-500/30 border-rose-500 text-white";
                    } else {
                      buttonStyles = "opacity-40 bg-white/5 border-white/5 text-gray-400";
                    }
                  }

                  return (
                    <motion.button
                      key={note}
                      whileHover={!isAnswerRevealed ? { scale: 1.05 } : {}}
                      whileTap={!isAnswerRevealed ? { scale: 0.95 } : {}}
                      onClick={() => handleSelectAnswer(note)}
                      disabled={isAnswerRevealed}
                      className={`p-4 rounded-2xl border text-center transition-all duration-300 ${buttonStyles}`}
                    >
                      <span className="text-2xl font-extrabold font-mono block">{note}</span>
                      {noteMode === "diatonic" && (
                        <span className="text-[11px] text-[#7cdffc] font-bold block mt-1">
                          Degree {idx + 1} ({solfegeNames[idx]})
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback Reveal */}
              <AnimatePresence>
                {isAnswerRevealed && currentNoteQuestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="p-6 rounded-2xl bg-black/60 border border-white/15 max-w-xl mx-auto text-left space-y-3 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            selectedAnswer === currentNoteQuestion.note ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {selectedAnswer === currentNoteQuestion.note
                            ? "✓ Spot On! Perfect Ear!"
                            : `✗ The note was: ${currentNoteQuestion.note}`}
                        </span>
                        <h4 className="text-2xl font-extrabold text-white mt-0.5">
                          Note: {currentNoteQuestion.note} ({currentNoteQuestion.degreeName})
                        </h4>
                      </div>

                      <button
                        onClick={generateNoteQuestion}
                        className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-[#7cdffc] to-[#fa1ea2] text-white hover:scale-105 transition-all shadow-md"
                      >
                        Next Pitch ➔
                      </button>
                    </div>

                    <p className="text-xs text-gray-300">
                      In the key of {noteTonic} Major, <strong>{currentNoteQuestion.note}</strong> functions as degree{" "}
                      <strong>{currentNoteQuestion.degreeNumber}</strong> ({currentNoteQuestion.solfege}).
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* CATEGORY 3: CHORD PROGRESSION EAR TRAINING */}
        {category === "progressions" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/30 border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Key Center:
                </span>
                {["C", "G", "D", "F", "A", "E"].map((root) => (
                  <button
                    key={root}
                    onClick={() => setProgressionTonic(root)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      progressionTonic === root
                        ? "bg-[#a855f7]/30 text-purple-300 border-[#a855f7]/60 shadow-sm"
                        : "bg-white/5 text-gray-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {root} Major
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">Listen to the harmonic journey and pick the progression</span>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 via-black/40 to-white/5 border border-white/15 text-center space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#a855f7]">
                  Harmonic Progression Ear Training
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  What chord progression was just played?
                </h3>
              </div>

              {/* Replay Progression */}
              <div className="flex justify-center items-center gap-3">
                <button
                  onClick={() => {
                    if (!currentProgressionQuestion) return;
                    currentProgressionQuestion.chordsData.forEach((chord, i) => {
                      const t = setTimeout(() => {
                        setActiveProgressionStep(i);
                        playNote(chord.notes, instrument, isSustain);
                      }, i * 1100);
                      timeoutRefs.current.push(t);
                    });
                    const endT = setTimeout(() => {
                      setActiveProgressionStep(null);
                    }, currentProgressionQuestion.chordsData.length * 1100 + 400);
                    timeoutRefs.current.push(endT);
                  }}
                  className="px-8 py-4 rounded-full text-base font-extrabold bg-gradient-to-r from-[#a855f7] via-[#fa1ea2] to-[#7cdffc] text-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-3"
                >
                  <span>▶</span> Replay Progression
                </button>
              </div>

              {/* 4 Step Progress Boxes */}
              <div className="flex justify-center gap-3 max-w-lg mx-auto">
                {[0, 1, 2, 3].map((stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`flex-1 p-3 rounded-2xl border text-center transition-all ${
                      activeProgressionStep === stepIdx
                        ? "bg-[#7cdffc]/30 border-[#7cdffc] scale-110 shadow-[0_0_15px_rgba(124,223,252,0.5)]"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span className="text-[11px] font-mono text-gray-400 block">Chord {stepIdx + 1}</span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {isAnswerRevealed && currentProgressionQuestion
                        ? currentProgressionQuestion.progression.numerals[stepIdx]
                        : "?"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto pt-2">
                {PROGRESSION_PRESETS.map((prog) => {
                  const isSelected = selectedAnswer === prog.id;
                  const isCorrect = currentProgressionQuestion?.progression.id === prog.id;

                  let buttonStyles = "bg-white/5 border-white/10 text-white hover:bg-white/15";

                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      buttonStyles = "bg-emerald-500/30 border-emerald-400 text-white shadow-lg scale-105";
                    } else if (isSelected) {
                      buttonStyles = "bg-rose-500/30 border-rose-500 text-white";
                    } else {
                      buttonStyles = "opacity-40 bg-white/5 border-white/5 text-gray-400";
                    }
                  }

                  return (
                    <motion.button
                      key={prog.id}
                      whileHover={!isAnswerRevealed ? { scale: 1.02 } : {}}
                      whileTap={!isAnswerRevealed ? { scale: 0.98 } : {}}
                      onClick={() => handleSelectAnswer(prog.id)}
                      disabled={isAnswerRevealed}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 ${buttonStyles}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-base font-extrabold">{prog.name}</span>
                        <span className="text-xs font-mono text-gray-400">{prog.genre}</span>
                      </div>
                      <span className="text-sm font-mono font-extrabold text-[#7cdffc] block">
                        {prog.numerals.join(" - ")}
                      </span>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{prog.description}</p>
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback Reveal */}
              <AnimatePresence>
                {isAnswerRevealed && currentProgressionQuestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="p-6 rounded-2xl bg-black/60 border border-white/15 max-w-2xl mx-auto text-left space-y-3 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            selectedAnswer === currentProgressionQuestion.progression.id
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {selectedAnswer === currentProgressionQuestion.progression.id
                            ? "✓ Nailed It! Perfect Progression Recognition!"
                            : `✗ It was: ${currentProgressionQuestion.progression.name}`}
                        </span>
                        <h4 className="text-2xl font-extrabold text-white mt-0.5">
                          {currentProgressionQuestion.progression.numerals.join(" ➔ ")}
                        </h4>
                      </div>

                      <button
                        onClick={generateProgressionQuestion}
                        className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-[#a855f7] to-[#7cdffc] text-white hover:scale-105 transition-all shadow-md"
                      >
                        Next Progression ➔
                      </button>
                    </div>

                    <p className="text-xs text-gray-300">{currentProgressionQuestion.progression.description}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Ear Training Reference Soundboard Cheatsheet */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Ear Training Reference Soundboard (Listen & Learn)
            </h3>
            <span className="text-xs text-gray-400">Click any chord to calibrate your ear</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {CHORD_LIBRARY.map((chord) => (
              <div
                key={chord.id}
                onClick={() => {
                  const notes = getVoicedChord("C", chord.id, 4);
                  playMysteryChord(notes, "both");
                }}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>{chord.name}</span>
                  <span className="text-gray-400 group-hover:text-[#7cdffc] transition-colors">▶</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">{chord.formula}</span>
                <span className="text-[10px] text-gray-400 block line-clamp-1 italic">{chord.mood}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarTrainer;
