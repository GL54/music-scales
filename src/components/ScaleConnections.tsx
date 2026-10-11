import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  COMMON_ROOTS,
  CIRCLE_OF_FIFTHS,
  compareScales,
  getAscendingChordNotes,
  getCircleOfFifthsKey,
  type ScaleType,
  type HarmonicFunction,
  type BridgeChordStep,
  type DiatonicChordWithRole
} from "../utils/musicTheory";
import { playNote, playArpeggio, preloadAudio, type InstrumentType } from "../utils/audio";

type PresetMode = "relative" | "dominant" | "subdominant" | "parallel" | "custom";

const SCALE_TYPES: { id: ScaleType; label: string }[] = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
];

const FUNCTION_COLORS: Record<HarmonicFunction, { bg: string; text: string; border: string; glow: string }> = {
  Tonic: {
    bg: "bg-cyan-500/15",
    text: "text-[#7cdffc]",
    border: "border-cyan-500/30",
    glow: "shadow-[0_0_12px_rgba(124,223,252,0.2)]",
  },
  Subdominant: {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/30",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.2)]",
  },
  Dominant: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  },
};

const ScaleConnections: React.FC = () => {
  // Source Scale (Scale A)
  const [root1, setRoot1] = useState<string>("C");
  const [scaleType1, setScaleType1] = useState<ScaleType>("major");

  // Comparison Scale (Scale B)
  const [root2, setRoot2] = useState<string>("G");
  const [scaleType2, setScaleType2] = useState<ScaleType>("major");

  // Preset mode
  const [presetMode, setPresetMode] = useState<PresetMode>("dominant");

  // Audio settings
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const [isSustain, setIsSustain] = useState<boolean>(false);

  // Playback state
  const [playingStepIndex, setPlayingStepIndex] = useState<number | null>(null);
  const [isPlayingProgression, setIsPlayingProgression] = useState<boolean>(false);
  const [activeScaleNotes, setActiveScaleNotes] = useState<string[]>([]);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Educational guides accordion state
  const [expandedGuide, setExpandedGuide] = useState<string | null>("voice-leading");

  useEffect(() => {
    preloadAudio();
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Update target scale when preset mode or source scale changes
  const applyPreset = (mode: PresetMode, newRoot1: string = root1, newType1: ScaleType = scaleType1) => {
    setPresetMode(mode);
    const cKey = getCircleOfFifthsKey(newRoot1);
    const pos = cKey ? cKey.positionIndex : 0;

    if (mode === "relative") {
      if (newType1 === "major") {
        const minorRoot = cKey?.relativeMinor || "A";
        setRoot2(minorRoot);
        setScaleType2("minor");
      } else {
        const majRoot = CIRCLE_OF_FIFTHS.find(k => k.relativeMinor === newRoot1)?.root || "C";
        setRoot2(majRoot);
        setScaleType2("major");
      }
    } else if (mode === "dominant") {
      const nextPos = (pos + 1) % 12;
      const nextKey = CIRCLE_OF_FIFTHS[nextPos];
      setRoot2(nextKey.root);
      setScaleType2(newType1);
    } else if (mode === "subdominant") {
      const prevPos = (pos - 1 + 12) % 12;
      const prevKey = CIRCLE_OF_FIFTHS[prevPos];
      setRoot2(prevKey.root);
      setScaleType2(newType1);
    } else if (mode === "parallel") {
      setRoot2(newRoot1);
      setScaleType2(newType1 === "major" ? "minor" : "major");
    }
  };

  const handleRoot1Change = (newRoot: string) => {
    setRoot1(newRoot);
    if (presetMode !== "custom") {
      applyPreset(presetMode, newRoot, scaleType1);
    }
  };

  const handleScaleType1Change = (newType: ScaleType) => {
    setScaleType1(newType);
    if (presetMode !== "custom") {
      applyPreset(presetMode, root1, newType);
    }
  };

  const handleSwapScales = () => {
    const tempRoot = root1;
    const tempType = scaleType1;
    setRoot1(root2);
    setScaleType1(scaleType2);
    setRoot2(tempRoot);
    setScaleType2(tempType);
    setPresetMode("custom");
  };

  // Compare scales
  const comparison = compareScales(root1, scaleType1, root2, scaleType2);

  // Play progression with synchronized step highlight
  const handlePlayProgression = (steps: BridgeChordStep[]) => {
    if (isPlayingProgression || steps.length === 0) return;
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    setIsPlayingProgression(true);

    const stepDelayMs = 1200;

    steps.forEach((step, idx) => {
      const t = setTimeout(() => {
        setPlayingStepIndex(idx);
        playNote(step.notes, instrument, isSustain);
      }, idx * stepDelayMs);
      timeoutRefs.current.push(t);
    });

    const endT = setTimeout(() => {
      setPlayingStepIndex(null);
      setIsPlayingProgression(false);
    }, steps.length * stepDelayMs + 300);
    timeoutRefs.current.push(endT);
  };

  // Play entire scale run
  const handlePlayScale = (notes: string[]) => {
    const voiced = getAscendingChordNotes(notes, 4);
    playArpeggio(voiced, instrument, isSustain, 0.22);
    setActiveScaleNotes(notes);
    const clearT = setTimeout(() => setActiveScaleNotes([]), notes.length * 220 + 800);
    timeoutRefs.current.push(clearT);
  };

  // Play single chord
  const handlePlayChord = (notes: string[]) => {
    const voiced = getAscendingChordNotes(notes, 4);
    playNote(voiced, instrument, isSustain);
  };

  // Circle of Fifths SVG data
  const circleSize = 340;
  const center = circleSize / 2;
  const outerRadius = 125;
  const innerRadius = 82;

  const key1Data = getCircleOfFifthsKey(root1);
  const key2Data = getCircleOfFifthsKey(root2);
  const pos1 = key1Data ? key1Data.positionIndex : 0;
  const pos2 = key2Data ? key2Data.positionIndex : 0;

  const angle1 = (pos1 * 30 - 90) * (Math.PI / 180);
  const angle2 = (pos2 * 30 - 90) * (Math.PI / 180);

  const x1 = center + (scaleType1 === "major" ? outerRadius : innerRadius) * Math.cos(angle1);
  const y1 = center + (scaleType1 === "major" ? outerRadius : innerRadius) * Math.sin(angle1);
  const x2 = center + (scaleType2 === "major" ? outerRadius : innerRadius) * Math.cos(angle2);
  const y2 = center + (scaleType2 === "major" ? outerRadius : innerRadius) * Math.sin(angle2);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto bg-[#040d12] rounded-3xl shadow-2xl space-y-10 w-full border border-white/5 relative overflow-hidden">
      {/* Decorative ambient background gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-15%] w-[50%] h-[50%] bg-[#fa1ea2]/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] left-[20%] w-[55%] h-[55%] bg-[#7cdffc]/15 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="relative z-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#7cdffc] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#fa1ea2] animate-pulse"></span>
            Harmonic Architecture & Bridges
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#fa1ea2] via-[#91039b] to-[#7cdffc] drop-shadow-sm pb-1">
            Scale & Chord Connections
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
            Discover why scales connect, how their chords move, where they share DNA, and how to seamlessly bridge between them.
          </p>
        </div>

        {/* Global Controls: Instrument & Audio */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sound:</span>
            <div className="bg-black/30 p-1 rounded-full flex gap-1 border border-white/10">
              <button
                onClick={() => setInstrument("piano")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  instrument === "piano"
                    ? "bg-gradient-to-r from-[#01131c] to-[#08191f] text-[#7cdffc] border border-[#7cdffc]/40 shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Keyboard
              </button>
              <button
                onClick={() => setInstrument("guitar")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  instrument === "guitar"
                    ? "bg-gradient-to-r from-[#fa1ea2] to-[#91039b] text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Acoustic Guitar
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSustain(!isSustain)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isSustain
                  ? "bg-yellow-400/20 text-yellow-300 border-yellow-400/50 shadow-[0_0_12px_rgba(250,204,21,0.25)]"
                  : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSustain ? "bg-yellow-400 animate-pulse" : "bg-gray-500"}`}></span>
              Sustain {isSustain ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Connection Preset Quick Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Harmonic Connection Presets</h3>
            <span className="text-xs text-gray-500">Pick a musical relationship or explore custom</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {[
              { id: "dominant" as PresetMode, label: "Dominant (5th)", desc: "+1 Sharp / Circle Step", icon: "⚡" },
              { id: "subdominant" as PresetMode, label: "Subdominant (4th)", desc: "+1 Flat / Warm Departure", icon: "🌊" },
              { id: "relative" as PresetMode, label: "Relative Minor/Major", desc: "100% Shared Notes", icon: "🔄" },
              { id: "parallel" as PresetMode, label: "Parallel Key", desc: "Modal Interchange", icon: "🎭" },
              { id: "custom" as PresetMode, label: "Custom Pair", desc: "Any 2 Scales", icon: "🎛️" },
            ].map(p => {
              const isActive = presetMode === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`relative p-3 rounded-2xl text-left transition-all duration-300 border overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-br from-white/15 to-white/5 border-[#fa1ea2] shadow-[0_0_20px_rgba(250,30,162,0.25)]"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="preset-indicator"
                      className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fa1ea2] to-[#7cdffc]"
                    />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-sm font-bold text-white">{p.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual Scale Selector & Swap Bar */}
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            {/* Scale A (Source) */}
            <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-[#fa1ea2]/30 shadow-[0_0_15px_rgba(250,30,162,0.1)]">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#fa1ea2]/20 text-[#fa1ea2] border border-[#fa1ea2]/40">
                  Scale A (Source)
                </span>
                <span className="text-xs font-mono text-gray-400">{root1} {scaleType1}</span>
              </div>

              {/* Root Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Root Note</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ROOTS.map(note => (
                    <button
                      key={note}
                      onClick={() => handleRoot1Change(note)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        root1 === note
                          ? "bg-gradient-to-br from-[#fa1ea2] to-[#91039b] text-white shadow-[0_0_12px_rgba(250,30,162,0.5)] scale-105"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Scale Type</label>
                <div className="flex gap-2">
                  {SCALE_TYPES.map(st => (
                    <button
                      key={st.id}
                      onClick={() => handleScaleType1Change(st.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        scaleType1 === st.id
                          ? "bg-[#fa1ea2]/20 text-[#fa1ea2] border border-[#fa1ea2]/50 shadow-sm"
                          : "bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Action: Swap & Link Indicator */}
            <div className="flex flex-col items-center justify-center gap-2">
              <button
                onClick={handleSwapScales}
                title="Swap Scales"
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 shadow-lg group"
              >
                <span className="text-xl group-hover:rotate-180 transition-transform duration-300">⇄</span>
              </button>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Connects To</span>
            </div>

            {/* Scale B (Target) */}
            <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-[#7cdffc]/30 shadow-[0_0_15px_rgba(124,223,252,0.1)]">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#7cdffc]/20 text-[#7cdffc] border border-[#7cdffc]/40">
                  Scale B (Target)
                </span>
                <span className="text-xs font-mono text-gray-400">{root2} {scaleType2}</span>
              </div>

              {/* Root Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Root Note</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ROOTS.map(note => (
                    <button
                      key={note}
                      onClick={() => {
                        setRoot2(note);
                        setPresetMode("custom");
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        root2 === note
                          ? "bg-gradient-to-br from-[#01131c] to-[#08191f] text-[#7cdffc] border border-[#7cdffc]/50 shadow-[0_0_12px_rgba(124,223,252,0.5)] scale-105"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Scale Type</label>
                <div className="flex gap-2">
                  {SCALE_TYPES.map(st => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setScaleType2(st.id);
                        setPresetMode("custom");
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        scaleType2 === st.id
                          ? "bg-[#7cdffc]/20 text-[#7cdffc] border border-[#7cdffc]/50 shadow-sm"
                          : "bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Relationship Summary Banner & Bridge Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white/10 via-black/40 to-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
          {/* Left: Circle of Fifths Graphic */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px]">
              <svg viewBox={`0 0 ${circleSize} ${circleSize}`} className="w-full h-full">
                <defs>
                  <linearGradient id="bridgeLine" x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fa1ea2" />
                    <stop offset="100%" stopColor="#7cdffc" />
                  </linearGradient>
                  <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Outer Ring Circle Track */}
                <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="36" />
                {/* Inner Ring Circle Track */}
                <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="28" />

                {/* Bridge Connection Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#bridgeLine)"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                  filter="url(#glowEffect)"
                  className="animate-pulse"
                />

                {/* Center Hub */}
                <circle cx={center} cy={center} r="32" fill="#040d12" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <text x={center} y={center - 4} textAnchor="middle" fill="#7cdffc" fontSize="10" fontWeight="bold">
                  CIRCLE
                </text>
                <text x={center} y={center + 10} textAnchor="middle" fill="#fa1ea2" fontSize="9" fontWeight="bold">
                  OF 5ths
                </text>

                {/* 12 Keys */}
                {CIRCLE_OF_FIFTHS.map(k => {
                  const angle = (k.positionIndex * 30 - 90) * (Math.PI / 180);
                  const outerX = center + outerRadius * Math.cos(angle);
                  const outerY = center + outerRadius * Math.sin(angle);
                  const innerX = center + innerRadius * Math.cos(angle);
                  const innerY = center + innerRadius * Math.sin(angle);

                  const isMajor1 = root1 === k.root && scaleType1 === "major";
                  const isMajor2 = root2 === k.root && scaleType2 === "major";
                  const isMinor1 = root1 === k.relativeMinor && scaleType1 === "minor";
                  const isMinor2 = root2 === k.relativeMinor && scaleType2 === "minor";

                  return (
                    <g key={k.root}>
                      {/* Outer Key Node (Major) */}
                      <circle
                        cx={outerX}
                        cy={outerY}
                        r={isMajor1 || isMajor2 ? "16" : "13"}
                        fill={isMajor1 ? "#fa1ea2" : isMajor2 ? "#7cdffc" : "#08191f"}
                        stroke={isMajor1 ? "#fff" : isMajor2 ? "#fff" : "rgba(255,255,255,0.15)"}
                        strokeWidth={isMajor1 || isMajor2 ? "2" : "1"}
                        className="cursor-pointer transition-all hover:opacity-80"
                        onClick={() => {
                          setRoot2(k.root);
                          setScaleType2("major");
                          setPresetMode("custom");
                        }}
                      />
                      <text
                        x={outerX}
                        y={outerY + 4}
                        textAnchor="middle"
                        fill={isMajor1 ? "#fff" : isMajor2 ? "#040d12" : "#e2e8f0"}
                        fontSize="11"
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        {k.root}
                      </text>

                      {/* Inner Key Node (Relative Minor) */}
                      <circle
                        cx={innerX}
                        cy={innerY}
                        r={isMinor1 || isMinor2 ? "13" : "11"}
                        fill={isMinor1 ? "#91039b" : isMinor2 ? "#38bdf8" : "#02080c"}
                        stroke={isMinor1 || isMinor2 ? "#fff" : "rgba(255,255,255,0.1)"}
                        strokeWidth={isMinor1 || isMinor2 ? "2" : "1"}
                        className="cursor-pointer transition-all hover:opacity-80"
                        onClick={() => {
                          setRoot2(k.relativeMinor);
                          setScaleType2("minor");
                          setPresetMode("custom");
                        }}
                      />
                      <text
                        x={innerX}
                        y={innerY + 3.5}
                        textAnchor="middle"
                        fill={isMinor1 ? "#fff" : isMinor2 ? "#040d12" : "#94a3b8"}
                        fontSize="9"
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        {k.relativeMinor}m
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              Outer ring: Major keys • Inner ring: Relative Minors • Click any key to connect
            </p>
          </div>

          {/* Right: Relationship Breakdown */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fa1ea2]/20 text-[#fa1ea2] border border-[#fa1ea2]/40">
                  {comparison.relationship.title}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#7cdffc]/20 text-[#7cdffc] border border-[#7cdffc]/40">
                  {comparison.relationship.badge}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono text-gray-300 bg-white/5 border border-white/10">
                  {comparison.sharedNotes.length}/7 Notes Shared • {comparison.sharedChords.length} Pivot Chords
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                How & Why {root1} {scaleType1} Connects to {root2} {scaleType2}
              </h3>
            </div>

            {/* Why They Connect */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7cdffc] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7cdffc]"></span>
                Why They Connect (The Musical Physics & Resonance)
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-gray-300">
                {comparison.relationship.whyConnect.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#fa1ea2] font-bold mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* How They Connect */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#fa1ea2] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#fa1ea2]"></span>
                How They Connect (Voice Leading & Transition Technique)
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-gray-300">
                {comparison.relationship.howConnect.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#7cdffc] font-bold mt-0.5">➔</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Note Comparison & Voice Leading Differential Matrix */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7cdffc]"></span>
              Scale Notes & Voice Leading Differential
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handlePlayScale(comparison.scaleNotes1)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#fa1ea2]/20 text-[#fa1ea2] hover:bg-[#fa1ea2]/30 border border-[#fa1ea2]/40 transition-all flex items-center gap-1.5"
              >
                ▶ Play {root1} {scaleType1}
              </button>
              <button
                onClick={() => handlePlayScale(comparison.scaleNotes2)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#7cdffc]/20 text-[#7cdffc] hover:bg-[#7cdffc]/30 border border-[#7cdffc]/40 transition-all flex items-center gap-1.5"
              >
                ▶ Play {root2} {scaleType2}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scale A Notes */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#fa1ea2]">{root1} {scaleType1} Notes</span>
                <span className="text-[11px] text-gray-400">Degrees 1 to 7</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {comparison.scaleNotes1.map((note, idx) => {
                  const isShared = comparison.sharedNotes.includes(note);
                  const isPlaying = activeScaleNotes.includes(note);
                  return (
                    <div
                      key={idx}
                      onClick={() => handlePlayChord([note])}
                      className={`flex-1 min-w-[42px] p-2.5 rounded-xl text-center border cursor-pointer transition-all duration-200 ${
                        isPlaying
                          ? "bg-white text-black scale-110 shadow-lg"
                          : isShared
                          ? "bg-[#7cdffc]/15 text-white border-[#7cdffc]/40 shadow-[0_0_10px_rgba(124,223,252,0.15)] hover:bg-[#7cdffc]/25"
                          : "bg-[#fa1ea2]/15 text-[#fa1ea2] border-[#fa1ea2]/40 hover:bg-[#fa1ea2]/25"
                      }`}
                    >
                      <span className="block text-base font-bold font-mono">{note}</span>
                      <span className="block text-[10px] text-gray-400">{isShared ? "Shared" : "Unique"}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scale B Notes */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7cdffc]">{root2} {scaleType2} Notes</span>
                <span className="text-[11px] text-gray-400">Degrees 1 to 7</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {comparison.scaleNotes2.map((note, idx) => {
                  const isShared = comparison.sharedNotes.includes(note);
                  const isPlaying = activeScaleNotes.includes(note);
                  return (
                    <div
                      key={idx}
                      onClick={() => handlePlayChord([note])}
                      className={`flex-1 min-w-[42px] p-2.5 rounded-xl text-center border cursor-pointer transition-all duration-200 ${
                        isPlaying
                          ? "bg-white text-black scale-110 shadow-lg"
                          : isShared
                          ? "bg-[#7cdffc]/15 text-white border-[#7cdffc]/40 shadow-[0_0_10px_rgba(124,223,252,0.15)] hover:bg-[#7cdffc]/25"
                          : "bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25"
                      }`}
                    >
                      <span className="block text-base font-bold font-mono">{note}</span>
                      <span className="block text-[10px] text-gray-400">{isShared ? "Shared" : "Unique"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Note Shifts Explanation */}
          {comparison.noteDiffs.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Voice Leading Shifts:</span>
              {comparison.noteDiffs.map((diff, idx) => (
                <div key={idx} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-200 flex items-center gap-2">
                  <span className="font-bold text-[#fa1ea2]">{diff.fromNote}</span>
                  <span className="text-gray-400">➔</span>
                  <span className="font-bold text-[#7cdffc]">{diff.toNote}</span>
                  <span className="text-[11px] text-gray-400">({diff.description})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diatonic Chords & Harmonic Roles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fa1ea2]"></span>
              Diatonic Chords & Harmonic Functions
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#7cdffc]">
                <span className="w-2 h-2 rounded-full bg-[#7cdffc]"></span> Tonic (Rest)
              </span>
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> Subdominant (Journey)
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Dominant (Tension)
              </span>
            </div>
          </div>

          {/* Scale A Chords */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#fa1ea2]">
              {root1} {scaleType1} Diatonic Chords
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {comparison.chords1.map((chord: DiatonicChordWithRole) => {
                const colors = FUNCTION_COLORS[chord.function];
                return (
                  <motion.div
                    key={chord.numeral}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handlePlayChord(chord.notes)}
                    className={`p-3 rounded-2xl border backdrop-blur-md cursor-pointer transition-all flex flex-col justify-between ${colors.bg} ${colors.border} ${colors.glow}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-gray-400">{chord.numeral}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${colors.border} ${colors.text}`}>
                        {chord.functionShort}
                      </span>
                    </div>

                    <div className="my-2">
                      <span className="text-lg font-extrabold text-white block">{chord.name}</span>
                      <span className="text-[11px] text-gray-400 block font-mono">
                        {chord.notes.join(" • ")}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-400">
                      <span>{chord.seventhName}</span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400">{chord.function}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Scale B Chords */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7cdffc]">
              {root2} {scaleType2} Diatonic Chords
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {comparison.chords2.map((chord: DiatonicChordWithRole) => {
                const colors = FUNCTION_COLORS[chord.function];
                return (
                  <motion.div
                    key={chord.numeral}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handlePlayChord(chord.notes)}
                    className={`p-3 rounded-2xl border backdrop-blur-md cursor-pointer transition-all flex flex-col justify-between ${colors.bg} ${colors.border} ${colors.glow}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-gray-400">{chord.numeral}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${colors.border} ${colors.text}`}>
                        {chord.functionShort}
                      </span>
                    </div>

                    <div className="my-2">
                      <span className="text-lg font-extrabold text-white block">{chord.name}</span>
                      <span className="text-[11px] text-gray-400 block font-mono">
                        {chord.notes.join(" • ")}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-400">
                      <span>{chord.seventhName}</span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400">{chord.function}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pivot Chords Bridge Spotlight */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#fa1ea2] to-[#7cdffc]"></span>
              The Pivot Chords Bridge (Common Chords)
            </h3>
            <span className="text-xs text-gray-400">
              {comparison.sharedChords.length > 0
                ? `${comparison.sharedChords.length} shared chord${comparison.sharedChords.length > 1 ? "s" : ""} bridge both scales`
                : "No identical diatonic triads (uses chromatic modal interchange)"}
            </span>
          </div>

          {comparison.sharedChords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {comparison.sharedChords.map((shared, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -3 }}
                  onClick={() => handlePlayChord(shared.notes)}
                  className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-[#7cdffc]/30 shadow-[0_0_15px_rgba(124,223,252,0.1)] hover:border-[#7cdffc]/60 cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-extrabold text-white">{shared.name}</span>
                    <span className="text-xs font-bold text-[#7cdffc] bg-[#7cdffc]/15 px-2 py-0.5 rounded-full border border-[#7cdffc]/30">
                      Pivot Chord
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>In {root1} {scaleType1}:</span>
                      <span className="font-mono font-bold text-[#fa1ea2]">{shared.numeral1} ({shared.function1})</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>In {root2} {scaleType2}:</span>
                      <span className="font-mono font-bold text-[#7cdffc]">{shared.numeral2} ({shared.function2})</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 pt-2 border-t border-white/5">
                    {shared.explanation}
                  </p>

                  <div className="text-center pt-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hover:text-white transition-colors">
                      ▶ Click to Listen
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-lg">🎭</span> Modal Interchange & Chromatic Voice Leading
              </h4>
              <p className="text-xs sm:text-sm text-gray-300">
                While these two scales do not share identical diatonic triads, they connect through <strong>Modal Interchange (borrowed chords)</strong>. Songwriters borrow chords from the parallel scale (such as the minor iv chord or ♭VI chord) to create emotional color changes, taking advantage of smooth half-step voice leading.
              </p>
            </div>
          )}
        </div>

        {/* Live Audio: Hear The Connection Bridge Progression */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-black/60 to-white/5 border border-white/10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#7cdffc] block">
                Interactive Audio Demonstration
              </span>
              <h3 className="text-2xl font-extrabold text-white mt-1">
                Hear The Bridge Progression
              </h3>
              <p className="text-xs text-gray-400">
                Listen to how chords transition step-by-step from {root1} {scaleType1} into {root2} {scaleType2}.
              </p>
            </div>

            <button
              onClick={() => handlePlayProgression(comparison.bridgeProgression)}
              disabled={isPlayingProgression}
              className={`px-6 py-3 rounded-full text-sm font-extrabold transition-all duration-300 flex items-center gap-2.5 shadow-lg ${
                isPlayingProgression
                  ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#fa1ea2] via-[#91039b] to-[#7cdffc] text-white hover:scale-105 shadow-[0_0_20px_rgba(250,30,162,0.4)]"
              }`}
            >
              <span className="text-base">{isPlayingProgression ? "⏳" : "▶"}</span>
              {isPlayingProgression ? "Playing Bridge..." : "Play Bridge Progression"}
            </button>
          </div>

          {/* Progression Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparison.bridgeProgression.map((step, idx) => {
              const isCurrentPlaying = playingStepIndex === idx;
              return (
                <motion.div
                  key={idx}
                  onClick={() => playNote(step.notes, instrument, isSustain)}
                  animate={{
                    scale: isCurrentPlaying ? 1.05 : 1,
                    borderColor: isCurrentPlaying
                      ? "#7cdffc"
                      : step.isPivot
                      ? "rgba(124,223,252,0.4)"
                      : step.isTargetTonic
                      ? "rgba(250,30,162,0.4)"
                      : "rgba(255,255,255,0.1)",
                  }}
                  className={`p-4 rounded-2xl border backdrop-blur-md cursor-pointer transition-all space-y-2 relative overflow-hidden ${
                    isCurrentPlaying
                      ? "bg-white/20 shadow-[0_0_25px_rgba(124,223,252,0.4)]"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-gray-400">Step {idx + 1}</span>
                    {step.isPivot && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7cdffc]/20 text-[#7cdffc] border border-[#7cdffc]/40">
                        Pivot Bridge
                      </span>
                    )}
                    {step.isTargetTonic && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fa1ea2]/20 text-[#fa1ea2] border border-[#fa1ea2]/40">
                        New Home!
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-2xl font-extrabold text-white block">{step.name}</span>
                    <span className="text-xs font-mono text-[#7cdffc] block">{step.numeral}</span>
                  </div>

                  <p className="text-[11px] text-gray-300 min-h-[32px]">
                    {step.description}
                  </p>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="font-mono">{step.notes.map(n => n.replace(/\d+/, '')).join(" ")}</span>
                    <span className="text-gray-400 hover:text-white">▶ Play</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Educational Deep Dive Accordion Guides */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              The 4 Principles of Musical Connection (Theory Deep-Dive)
            </h3>
            <span className="text-xs text-gray-400">Expand each guide to explore the underlying science</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: "voice-leading",
                title: "1. The Law of Voice Leading (Parsimony)",
                icon: "🎼",
                summary: "Smooth movement by half-steps and whole-steps creates natural transitions.",
                content:
                  "The human brain craves continuity. In music, 'voice leading' describes how individual melody lines move from one chord to the next. When two scales connect, the smoothest transitions keep common tones stationary while other notes shift by just a single half-step. For example, in C Major to G Major, the only difference is F rising to F#. That half-step climb to the leading tone pulls our ear forward effortlessly without dissonance."
              },
              {
                id: "circle-fifths",
                title: "2. The Physics of the Circle of Fifths",
                icon: "🌀",
                summary: "The perfect fifth is the strongest acoustic overtone relationship in nature.",
                content:
                  "In acoustic physics, when a string vibrates, its 3rd harmonic frequency is a perfect fifth above the fundamental. Because of this natural resonance, moving by a 5th introduces only 1 new sharp or flat per step, sharing 6 of 7 notes. Moving clockwise adds energy and brightness (+1 leading tone), while moving counter-clockwise (Subdominant) softens tension into warmth and relaxation."
              },
              {
                id: "pivot-modulation",
                title: "3. Pivot Chords & The Art of Modulation",
                icon: "🌉",
                summary: "A shared chord acts as a secret chameleon doorway between keys.",
                content:
                  "A pivot chord belongs to both Scale A and Scale B. When played in Scale A, it sounds completely normal and expected. However, when the composer immediately follows it with the dominant V chord of Scale B, the listener's brain retroactively reinterprets the pivot chord as belonging to the new key! This psychological shift is what enables seamless key changes in classical symphonies and pop anthems alike."
              },
              {
                id: "modal-interchange",
                title: "4. Modal Interchange & Borrowed Chords",
                icon: "✨",
                summary: "Why borrowing chords from parallel scales gives listeners chills.",
                content:
                  "Parallel keys share the same tonic root (e.g. C Major and C Minor). In modal interchange, a songwriter in a major key 'borrows' a chord from the parallel minor—most famously the minor iv chord (Fm in C Major). Why does this sound so moving? In Fm ➔ C, the note Ab slides down by a half-step to G, while F slides down to E. This dual half-step resolution into the tonic delivers that iconic bittersweet, cinematic emotional swell heard in The Beatles, Radiohead, and film scores."
              }
            ].map(guide => {
              const isExpanded = expandedGuide === guide.id;
              return (
                <div
                  key={guide.id}
                  className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                    className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{guide.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{guide.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{guide.summary}</p>
                      </div>
                    </div>
                    <span className={`text-gray-400 transition-transform duration-300 text-sm ${isExpanded ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-4 pb-4 pt-1 text-xs sm:text-sm text-gray-300 border-t border-white/5 leading-relaxed"
                      >
                        {guide.content}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScaleConnections;
