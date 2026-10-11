import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  COMMON_ROOTS,
  getScaleNotes,
  getChordScaleNetwork,
  getAscendingChordNotes,
  type ScaleType,
  type ChordScaleMode,
  type HarmonicFunction,
} from "../utils/musicTheory";
import { playNote, playArpeggio, preloadAudio, type InstrumentType } from "../utils/audio";
import { motion, AnimatePresence } from "framer-motion";

type Layout3D = "constellation" | "helix" | "strata";

type SelectedNodeData =
  | { type: "core"; name: string; notes: string[] }
  | { type: "note"; note: string; degree: number }
  | { type: "chord"; chord: ChordScaleMode }
  | { type: "scale"; chord: ChordScaleMode };

const SCALE_TYPES: { id: ScaleType; label: string }[] = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
];

const FUNCTION_COLORS: Record<HarmonicFunction, string> = {
  Tonic: "#7cdffc",
  Subdominant: "#a855f7",
  Dominant: "#f59e0b",
};

// Helper to generate glowing text sprites in Three.js
function createTextSprite(
  text: string,
  subtext?: string,
  color: string = "#ffffff",
  bgColor: string = "rgba(4, 13, 18, 0.85)",
  borderColor: string = "rgba(255, 255, 255, 0.25)"
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw rounded background pill
    const x = 16, y = 16, w = 224, h = 96, r = 24;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Main text
    ctx.font = "bold 34px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = subtext ? "middle" : "middle";
    ctx.fillText(text, 128, subtext ? 52 : 64);

    // Subtext
    if (subtext) {
      ctx.font = "bold 20px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText(subtext, 128, 86);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(3.2, 1.6, 1);
  return sprite;
}

const ChordScale3DMap: React.FC = () => {
  const [rootNote, setRootNote] = useState<string>("C");
  const [scaleType, setScaleType] = useState<ScaleType>("major");
  const [layoutMode, setLayoutMode] = useState<Layout3D>("constellation");
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const [isSustain, setIsSustain] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);
  const [isTouring, setIsTouring] = useState<boolean>(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);
  const tourTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Music theory data
  const scaleNotes = useMemo(() => getScaleNotes(rootNote, scaleType), [rootNote, scaleType]);
  const chordScaleNetwork = useMemo(() => getChordScaleNetwork(rootNote, scaleType), [rootNote, scaleType]);

  // Set default selected node
  useEffect(() => {
    preloadAudio();
    if (chordScaleNetwork.length > 0) {
      setSelectedNode({ type: "chord", chord: chordScaleNetwork[0] });
    }
  }, [chordScaleNetwork]);

  const [isSceneReady, setIsSceneReady] = useState<boolean>(false);
  const autoRotateRef = useRef<boolean>(isAutoRotate);
  autoRotateRef.current = isAutoRotate;

  // Sound triggers
  const playScaleRun = useCallback((notes: string[]) => {
    const voiced = getAscendingChordNotes(notes, 4);
    playArpeggio(voiced, instrument, isSustain, 0.22);
  }, [instrument, isSustain]);

  const playChordAudio = useCallback((notes: string[]) => {
    const voiced = getAscendingChordNotes(notes, 4);
    playNote(voiced, instrument, isSustain);
  }, [instrument, isSustain]);

  const playSingleNoteAudio = useCallback((note: string) => {
    playNote(`${note}4`, instrument, isSustain);
  }, [instrument, isSustain]);

  // Handle tour playback across all 7 chords and corresponding scales
  const startTour = useCallback(() => {
    if (isTouring || chordScaleNetwork.length === 0) return;
    tourTimeoutsRef.current.forEach(clearTimeout);
    tourTimeoutsRef.current = [];
    setIsTouring(true);

    const stepDuration = 2000;

    chordScaleNetwork.forEach((item, idx) => {
      const t = setTimeout(() => {
        setSelectedNode({ type: "chord", chord: item });
        playChordAudio(item.chordNotes);
      }, idx * stepDuration);
      tourTimeoutsRef.current.push(t);
    });

    const endT = setTimeout(() => {
      setIsTouring(false);
    }, chordScaleNetwork.length * stepDuration + 500);
    tourTimeoutsRef.current.push(endT);
  }, [chordScaleNetwork, isTouring, playChordAudio]);

  const stopTour = useCallback(() => {
    tourTimeoutsRef.current.forEach(clearTimeout);
    tourTimeoutsRef.current = [];
    setIsTouring(false);
  }, []);

  // Update controls autoRotate dynamically
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotate;
    }
  }, [isAutoRotate]);

  // Three.js scene setup and rendering (RUNS ONCE ON MOUNT)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#01131c");
    scene.fog = new THREE.FogExp2("#01131c", 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 22, 28);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 60;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 0.8;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xfa1ea2, 4, 70);
    pointLight1.position.set(0, 12, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7cdffc, 4, 70);
    pointLight2.position.set(16, 8, 16);
    scene.add(pointLight2);

    // Cosmic background starfield
    const starCount = 450;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 120;
      starPositions[i + 1] = (Math.random() - 0.5) * 80;
      starPositions[i + 2] = (Math.random() - 0.5) * 120;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0x7cdffc, size: 0.45, transparent: true, opacity: 0.6 });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Orbital ground ring guides
    const createRing = (radius: number, color: number) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.04, radius + 0.04, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      return ring;
    };
    scene.add(createRing(5, 0xfa1ea2));
    scene.add(createRing(11, 0x7cdffc));
    scene.add(createRing(17, 0xa855f7));

    // Dynamic objects container
    const dynamicGroup = new THREE.Group();
    dynamicGroup.name = "dynamicHarmonyGroup";
    scene.add(dynamicGroup);

    setIsSceneReady(true);

    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Gentle floating animations for stars and pulsar cores
      starField.rotation.y += delta * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild 3D objects when scale, root note, or layout mode changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Find and clear dynamic group
    const existingGroup = scene.children.find((c) => c.name === "dynamicHarmonyGroup");
    if (existingGroup) {
      scene.remove(existingGroup);
    }

    const dynamicGroup = new THREE.Group();
    dynamicGroup.name = "dynamicHarmonyGroup";
    scene.add(dynamicGroup);

    const interactiveList: THREE.Object3D[] = [];

    // Coordinates generator based on chosen 3D layout
    const getNodePositions = () => {
      const notePositions: THREE.Vector3[] = [];
      const chordPositions: THREE.Vector3[] = [];
      const modePositions: THREE.Vector3[] = [];

      for (let i = 0; i < 7; i++) {
        const angle = (i * (2 * Math.PI)) / 7 - Math.PI / 2;

        if (layoutMode === "constellation") {
          // Concentric circular shells
          notePositions.push(new THREE.Vector3(5 * Math.cos(angle), 0, 5 * Math.sin(angle)));
          const chordWaveY = Math.sin(i * 1.5) * 1.2;
          chordPositions.push(new THREE.Vector3(11 * Math.cos(angle), chordWaveY, 11 * Math.sin(angle)));
          modePositions.push(new THREE.Vector3(17 * Math.cos(angle), chordWaveY + 1.5, 17 * Math.sin(angle)));
        } else if (layoutMode === "helix") {
          // Ascending spiral helix
          const helixY = (i - 3) * 1.8;
          notePositions.push(new THREE.Vector3(5 * Math.cos(angle), helixY - 1, 5 * Math.sin(angle)));
          chordPositions.push(new THREE.Vector3(10 * Math.cos(angle), helixY, 10 * Math.sin(angle)));
          modePositions.push(new THREE.Vector3(15 * Math.cos(angle), helixY + 1.2, 15 * Math.sin(angle)));
        } else {
          // Tiered strata platforms
          notePositions.push(new THREE.Vector3(6 * Math.cos(angle), -3.5, 6 * Math.sin(angle)));
          chordPositions.push(new THREE.Vector3(10 * Math.cos(angle), 0.5, 10 * Math.sin(angle)));
          modePositions.push(new THREE.Vector3(15 * Math.cos(angle), 4.5, 15 * Math.sin(angle)));
        }
      }

      return { notePositions, chordPositions, modePositions };
    };

    const { notePositions, chordPositions, modePositions } = getNodePositions();

    // 1. Central Core Node (Master Scale)
    const coreGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xfa1ea2,
      emissive: 0x91039b,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0, 0);
    coreMesh.userData = { type: "core", name: `${rootNote} ${scaleType}`, notes: scaleNotes };
    dynamicGroup.add(coreMesh);
    interactiveList.push(coreMesh);

    // Core Wireframe Pulsar Ring
    const pulsarGeo = new THREE.IcosahedronGeometry(2.1, 1);
    const pulsarMat = new THREE.MeshBasicMaterial({ color: 0xfa1ea2, wireframe: true, transparent: true, opacity: 0.35 });
    const pulsarMesh = new THREE.Mesh(pulsarGeo, pulsarMat);
    coreMesh.add(pulsarMesh);

    // Core Text Sprite
    const coreSprite = createTextSprite(`${rootNote} ${scaleType.toUpperCase()}`, "ROOT SCALE", "#fa1ea2", "rgba(4, 13, 18, 0.9)", "#fa1ea2");
    coreSprite.position.set(0, 2.6, 0);
    dynamicGroup.add(coreSprite);

    // 2. Ring 1: Scale Notes Nodes
    scaleNotes.forEach((note, idx) => {
      const pos = notePositions[idx];
      const noteGeo = new THREE.SphereGeometry(0.75, 24, 24);
      const noteMat = new THREE.MeshStandardMaterial({
        color: 0x7cdffc,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.3,
      });
      const noteMesh = new THREE.Mesh(noteGeo, noteMat);
      noteMesh.position.copy(pos);
      noteMesh.userData = { type: "note", note, degree: idx + 1 };
      dynamicGroup.add(noteMesh);
      interactiveList.push(noteMesh);

      // Line from Core to Note
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xfa1ea2, transparent: true, opacity: 0.3 });
      const line = new THREE.Line(lineGeo, lineMat);
      dynamicGroup.add(line);

      // Note Label Sprite
      const sprite = createTextSprite(note, `Deg ${idx + 1}`, "#ffffff", "rgba(1, 19, 28, 0.85)", "#7cdffc");
      sprite.position.set(pos.x, pos.y + 1.4, pos.z);
      dynamicGroup.add(sprite);
    });

    // 3. Ring 2: Diatonic Chords Nodes
    chordScaleNetwork.forEach((item, idx) => {
      const chordPos = chordPositions[idx];
      const notePos = notePositions[idx];
      const funcColor = FUNCTION_COLORS[item.harmonicFunction];
      const hexColor = parseInt(funcColor.replace("#", "0x"), 16);

      // Octahedron geometry for chords
      const chordGeo = new THREE.OctahedronGeometry(1.2, 0);
      const chordMat = new THREE.MeshStandardMaterial({
        color: hexColor,
        emissive: hexColor,
        emissiveIntensity: 0.7,
        roughness: 0.25,
        metalness: 0.6,
      });
      const chordMesh = new THREE.Mesh(chordGeo, chordMat);
      chordMesh.position.copy(chordPos);
      chordMesh.userData = { type: "chord", chord: item };
      dynamicGroup.add(chordMesh);
      interactiveList.push(chordMesh);

      // Line from Root Note to Diatonic Chord
      const lineGeo = new THREE.BufferGeometry().setFromPoints([notePos, chordPos]);
      const lineMat = new THREE.LineBasicMaterial({ color: hexColor, transparent: true, opacity: 0.45 });
      const line = new THREE.Line(lineGeo, lineMat);
      dynamicGroup.add(line);

      // Chord Label Sprite
      const chordSprite = createTextSprite(item.chordName, `${item.romanNumeral} • ${item.harmonicFunction}`, funcColor, "rgba(4, 13, 18, 0.9)", funcColor);
      chordSprite.position.set(chordPos.x, chordPos.y + 1.8, chordPos.z);
      dynamicGroup.add(chordSprite);

      // 4. Ring 3: Corresponding Chord-Scales Nodes
      const modePos = modePositions[idx];
      const modeHexColor = parseInt(item.moodColor.replace("#", "0x"), 16);

      // Torus geometry for the Chord Scale Mode
      const modeGeo = new THREE.TorusGeometry(1.0, 0.35, 16, 32);
      const modeMat = new THREE.MeshStandardMaterial({
        color: modeHexColor,
        emissive: modeHexColor,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const modeMesh = new THREE.Mesh(modeGeo, modeMat);
      modeMesh.position.copy(modePos);
      modeMesh.rotation.x = Math.PI / 4;
      modeMesh.userData = { type: "scale", chord: item };
      dynamicGroup.add(modeMesh);
      interactiveList.push(modeMesh);

      // Laser Line from Chord to its Corresponding Scale
      const modeLineGeo = new THREE.BufferGeometry().setFromPoints([chordPos, modePos]);
      const modeLineMat = new THREE.LineDashedMaterial({
        color: modeHexColor,
        dashSize: 0.4,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.7,
      });
      const modeLine = new THREE.Line(modeLineGeo, modeLineMat);
      modeLine.computeLineDistances();
      dynamicGroup.add(modeLine);

      // Orbiting micro-satellites for the 7 notes of the mode scale
      item.modeNotes.forEach((mNote, mIdx) => {
        const subAngle = (mIdx * (2 * Math.PI)) / 7;
        const subDist = 2.1;
        const subPos = new THREE.Vector3(
          modePos.x + subDist * Math.cos(subAngle),
          modePos.y + Math.sin(subAngle) * 0.4,
          modePos.z + subDist * Math.sin(subAngle)
        );
        const subGeo = new THREE.SphereGeometry(0.28, 12, 12);
        const subMat = new THREE.MeshBasicMaterial({ color: modeHexColor });
        const subMesh = new THREE.Mesh(subGeo, subMat);
        subMesh.position.copy(subPos);
        subMesh.userData = { type: "note", note: mNote, degree: mIdx + 1 };
        dynamicGroup.add(subMesh);
        interactiveList.push(subMesh);
      });

      // Mode Label Sprite
      const modeSprite = createTextSprite(item.fullScaleName, item.formula, item.moodColor, "rgba(4, 13, 18, 0.9)", item.moodColor);
      modeSprite.position.set(modePos.x, modePos.y + 2.1, modePos.z);
      dynamicGroup.add(modeSprite);
    });

    interactiveObjectsRef.current = interactiveList;
  }, [chordScaleNetwork, layoutMode, rootNote, scaleNotes, scaleType, isSceneReady]);

  // Click handler with Raycasting
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    const y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const data = hit.userData as SelectedNodeData;

      if (data) {
        setSelectedNode(data);

        // Sound trigger
        if (data.type === "core") {
          playScaleRun(data.notes);
        } else if (data.type === "note") {
          playSingleNoteAudio(data.note);
        } else if (data.type === "chord") {
          playChordAudio(data.chord.chordNotes);
        } else if (data.type === "scale") {
          playScaleRun(data.chord.modeNotes);
        }
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto bg-[#040d12] rounded-3xl shadow-2xl space-y-8 w-full border border-white/5 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-[#fa1ea2]/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-[#7cdffc]/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative z-10 space-y-6">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#7cdffc] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Chord-Scale Theory & 3D Spatial Network
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#fa1ea2] via-[#a855f7] to-[#7cdffc] drop-shadow-sm">
            3D Chord & Scale Galaxy
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
            Select any root note and scale type to explore all its scale notes, diatonic chords, and every chord's corresponding modal scale in an interactive 3D universe.
          </p>
        </div>

        {/* Global Selectors & Audio Controls Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          {/* Root Note Picker */}
          <div className="lg:col-span-6 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#fa1ea2] block">
              1. Select Root Note:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ROOTS.map((note) => (
                <button
                  key={note}
                  onClick={() => setRootNote(note)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 ${
                    rootNote === note
                      ? "bg-gradient-to-br from-[#fa1ea2] to-[#91039b] text-white shadow-[0_0_15px_rgba(250,30,162,0.5)] scale-105"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Type Picker */}
          <div className="lg:col-span-3 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7cdffc] block">
              2. Scale Type:
            </span>
            <div className="flex gap-2">
              {SCALE_TYPES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setScaleType(st.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    scaleType === st.id
                      ? "bg-[#7cdffc]/20 text-[#7cdffc] border border-[#7cdffc]/50 shadow-[0_0_12px_rgba(124,223,252,0.3)]"
                      : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instrument & Audio */}
          <div className="lg:col-span-3 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              3. Sound & Playback:
            </span>
            <div className="flex items-center gap-2">
              <div className="bg-black/30 p-1 rounded-full flex gap-1 border border-white/10 flex-1">
                <button
                  onClick={() => setInstrument("piano")}
                  className={`flex-1 py-1 rounded-full text-[11px] font-bold transition-all ${
                    instrument === "piano"
                      ? "bg-gradient-to-r from-[#01131c] to-[#08191f] text-[#7cdffc] border border-[#7cdffc]/40"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Piano
                </button>
                <button
                  onClick={() => setInstrument("guitar")}
                  className={`flex-1 py-1 rounded-full text-[11px] font-bold transition-all ${
                    instrument === "guitar"
                      ? "bg-gradient-to-r from-[#fa1ea2] to-[#91039b] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Guitar
                </button>
              </div>

              <button
                onClick={() => setIsSustain(!isSustain)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  isSustain
                    ? "bg-yellow-400/20 text-yellow-300 border-yellow-400/50"
                    : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                }`}
              >
                Sustain {isSustain ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* 3D Viewport & Interactive Stage */}
        <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#01131c] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {/* Top 3D Control Bar Overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            {/* 3D Layout Mode Buttons */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">3D Layout:</span>
              {[
                { id: "constellation" as Layout3D, label: "🪐 Constellation", title: "Concentric Orbital Shells" },
                { id: "helix" as Layout3D, label: "🧬 Helix", title: "Ascending Harmonic Spiral" },
                { id: "strata" as Layout3D, label: "🏛️ Strata", title: "3-Tiered Platform" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLayoutMode(m.id)}
                  title={m.title}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    layoutMode === m.id
                      ? "bg-gradient-to-r from-[#fa1ea2] to-[#7cdffc] text-white shadow-md"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Quick Actions (Auto-Rotate & Tour) */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 ${
                  isAutoRotate
                    ? "bg-[#7cdffc]/20 text-[#7cdffc] border-[#7cdffc]/50 shadow-[0_0_15px_rgba(124,223,252,0.25)]"
                    : "bg-black/60 text-gray-400 border-white/15 hover:text-white"
                }`}
              >
                <span>🔄</span> Auto-Spin {isAutoRotate ? "ON" : "OFF"}
              </button>

              <button
                onClick={isTouring ? stopTour : startTour}
                className={`px-4 py-1.5 rounded-2xl text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 ${
                  isTouring
                    ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-lg"
                    : "bg-gradient-to-r from-[#fa1ea2] to-[#91039b] text-white border-transparent shadow-[0_0_15px_rgba(250,30,162,0.3)] hover:scale-105"
                }`}
              >
                <span>{isTouring ? "⏹" : "▶"}</span>
                {isTouring ? "Stop Tour" : "Tour The Galaxy"}
              </button>
            </div>
          </div>

          {/* 3D WebGL Canvas */}
          <div
            ref={mountRef}
            onClick={handleCanvasClick}
            className="w-full h-[520px] sm:h-[620px] cursor-grab active:cursor-grabbing"
          />

          {/* Bottom Overlay: 3D Legend & Interaction Guide */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div className="flex flex-wrap items-center gap-2 bg-black/60 px-3.5 py-2 rounded-2xl border border-white/15 backdrop-blur-md text-[11px] pointer-events-auto">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Galaxy Layers:</span>
              <span className="flex items-center gap-1 text-[#fa1ea2] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fa1ea2]"></span> Core Scale
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1 text-[#7cdffc] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7cdffc]"></span> Scale Notes (Ring 1)
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1 text-purple-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Diatonic Chords (Ring 2)
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Chord-Scale Modes (Ring 3)
              </span>
            </div>

            <div className="text-[11px] text-gray-400 bg-black/60 px-3.5 py-2 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto hidden sm:block">
              🖱️ Left Click: Select & Hear • Drag: 3D Orbit • Scroll: Zoom
            </div>
          </div>
        </div>

        {/* Diatonic Chord Selector Strip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Diatonic Chords & Corresponding Scales ({rootNote} {scaleType})
            </h3>
            <span className="text-xs text-gray-500">Click any chord to focus in 3D and listen</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {chordScaleNetwork.map((item) => {
              const isSelected = selectedNode?.type === "chord" && selectedNode.chord.degree === item.degree;
              const funcColor = FUNCTION_COLORS[item.harmonicFunction];

              return (
                <motion.button
                  key={item.degree}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedNode({ type: "chord", chord: item });
                    playChordAudio(item.chordNotes);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all backdrop-blur-md relative overflow-hidden ${
                    isSelected
                      ? "bg-white/15 shadow-xl border-white"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                  style={{
                    borderColor: isSelected ? funcColor : undefined,
                    boxShadow: isSelected ? `0 0 15px ${funcColor}40` : undefined,
                  }}
                >
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>{item.romanNumeral}</span>
                    <span style={{ color: funcColor }} className="font-bold uppercase">
                      {item.harmonicFunction}
                    </span>
                  </div>

                  <div className="my-1">
                    <span className="text-lg font-extrabold text-white block">{item.chordName}</span>
                    <span className="text-xs font-semibold block" style={{ color: item.moodColor }}>
                      {item.modeName}
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-400 font-mono block">
                    {item.chordNotes.join(" • ")}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Node Inspector HUD */}
        <AnimatePresence mode="wait">
          {selectedNode && (
            <motion.div
              key={
                selectedNode.type === "core"
                  ? "core"
                  : selectedNode.type === "note"
                  ? `note-${selectedNode.note}`
                  : `chord-${selectedNode.chord.degree}`
              }
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white/10 via-black/40 to-white/5 border border-white/15 backdrop-blur-xl shadow-2xl space-y-6"
            >
              {selectedNode.type === "chord" || selectedNode.type === "scale" ? (
                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-white border border-white/20">
                          Degree {selectedNode.chord.degree} • {selectedNode.chord.romanNumeral}
                        </span>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border"
                          style={{
                            color: FUNCTION_COLORS[selectedNode.chord.harmonicFunction],
                            borderColor: `${FUNCTION_COLORS[selectedNode.chord.harmonicFunction]}50`,
                            backgroundColor: `${FUNCTION_COLORS[selectedNode.chord.harmonicFunction]}15`,
                          }}
                        >
                          {selectedNode.chord.harmonicFunction} Function
                        </span>
                      </div>

                      <div className="flex items-baseline gap-3 mt-1.5">
                        <h3 className="text-3xl font-extrabold text-white">{selectedNode.chord.chordName} Chord</h3>
                        <span className="text-xl font-bold" style={{ color: selectedNode.chord.moodColor }}>
                          ⇄ {selectedNode.chord.fullScaleName} Scale
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => playChordAudio(selectedNode.chord.chordNotes)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#fa1ea2]/20 text-[#fa1ea2] hover:bg-[#fa1ea2]/30 border border-[#fa1ea2]/40 transition-all flex items-center gap-1.5"
                      >
                        ▶ Play Chord ({selectedNode.chord.chordName})
                      </button>
                      <button
                        onClick={() => playScaleRun(selectedNode.chord.modeNotes)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7cdffc]/20 text-[#7cdffc] hover:bg-[#7cdffc]/30 border border-[#7cdffc]/40 transition-all flex items-center gap-1.5"
                      >
                        ▶ Play Scale ({selectedNode.chord.modeName})
                      </button>
                    </div>
                  </div>

                  {/* Chord Notes vs Modal Scale Notes Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* The Diatonic Chord */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#fa1ea2]">
                          Chord Pitches ({selectedNode.chord.chordType.toUpperCase()})
                        </span>
                        <span className="text-xs text-gray-400 font-mono">7th: {selectedNode.chord.seventhName}</span>
                      </div>

                      <div className="flex gap-2">
                        {selectedNode.chord.seventhNotes.map((note, i) => (
                          <div
                            key={i}
                            onClick={() => playSingleNoteAudio(note)}
                            className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/10 text-center cursor-pointer hover:border-[#fa1ea2] transition-colors"
                          >
                            <span className="text-lg font-bold font-mono text-white block">{note}</span>
                            <span className="text-[10px] text-gray-400 block">
                              {i === 0 ? "Root" : i === 1 ? "3rd" : i === 2 ? "5th" : "7th"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* The Corresponding Modal Scale */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: selectedNode.chord.moodColor }}>
                          Corresponding Scale: {selectedNode.chord.modeName}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{selectedNode.chord.formula}</span>
                      </div>

                      <div className="flex gap-1.5">
                        {selectedNode.chord.modeNotes.map((note, i) => (
                          <div
                            key={i}
                            onClick={() => playSingleNoteAudio(note)}
                            className="flex-1 p-2 rounded-xl bg-black/40 border border-white/10 text-center cursor-pointer hover:border-[#7cdffc] transition-colors"
                          >
                            <span className="text-base font-bold font-mono text-white block">{note}</span>
                            <span className="text-[9px] text-gray-400 block">deg {i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Why this scale corresponds to this chord */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#7cdffc] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7cdffc]"></span>
                      Chord-Scale Harmony Explained:
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {selectedNode.chord.character} When soloing or composing over the <strong>{selectedNode.chord.chordName}</strong> chord in {rootNote} {scaleType}, playing the <strong>{selectedNode.chord.fullScaleName}</strong> scale guarantees 100% harmonic compatibility, because all 7 pitches naturally originate from the parent {rootNote} {scaleType} scale while rotating the tonal emphasis onto {selectedNode.chord.modeNotes[0]}.
                    </p>
                  </div>
                </div>
              ) : selectedNode.type === "core" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#fa1ea2]">Master Parent Scale</span>
                      <h3 className="text-3xl font-extrabold text-white">{selectedNode.name}</h3>
                    </div>
                    <button
                      onClick={() => playScaleRun(selectedNode.notes)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#fa1ea2]/20 text-[#fa1ea2] border border-[#fa1ea2]/40 hover:bg-[#fa1ea2]/30 transition-all"
                    >
                      ▶ Play Full Scale
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {selectedNode.notes.map((note, i) => (
                      <div key={i} className="flex-1 p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                        <span className="text-xl font-bold font-mono text-white">{note}</span>
                        <span className="text-[10px] text-gray-400 block">Deg {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7cdffc]">Scale Degree {selectedNode.degree}</span>
                      <h3 className="text-3xl font-extrabold text-white">Note: {selectedNode.note}</h3>
                    </div>
                    <button
                      onClick={() => playSingleNoteAudio(selectedNode.note)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7cdffc]/20 text-[#7cdffc] border border-[#7cdffc]/40 hover:bg-[#7cdffc]/30 transition-all"
                    >
                      ▶ Play Pitch
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChordScale3DMap;
