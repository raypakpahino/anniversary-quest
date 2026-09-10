import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, Sparkles, HelpCircle, X, ArrowRight, 
  ShieldCheck, Zap, RefreshCw, Award, AlertTriangle, 
  Skull, HeartPulse, Volume2, VolumeX, Heart, ArrowLeft, ArrowUp, ArrowDown,
  Sun, Shield, Wind, Sparkle, Flame, BookOpen
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState('landing'); // 'landing' | 'instructions' | 'battle' | 'cutscene' | 'victory' | 'gameover'
  const [isMuted, setIsMuted] = useState(false);
  
  // Combat System (5 Stages)
  const [phase, setPhase] = useState(1);
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [synergy, setSynergy] = useState(0);
  const [currentWeakness, setCurrentWeakness] = useState('comm');
  const [isSurpriseWeakness, setIsSurpriseWeakness] = useState(false);
  const [battleLog, setBattleLog] = useState("Stage 1: The Stubborn Ego Monster appears!");
  const [isTurnLocked, setIsTurnLocked] = useState(false);
  const [attackWarning, setAttackWarning] = useState("");

  // Intros, Jumpscares & Cutscenes
  const [bossIntro, setBossIntro] = useState(false);
  const [jumpscareActive, setJumpscareActive] = useState(false);
  const [cutsceneDialogueIndex, setCutsceneDialogueIndex] = useState(0);
  const [cutsceneCharsFaded, setCutsceneCharsFaded] = useState(false);

  // Multi-Tier QTE Attack States
  const [qteStep, setQteStep] = useState(null); // 'timed' | 'mash' | 'swipe' | null
  const [qteScale, setQteScale] = useState(2.3);
  const [mashCount, setMashCount] = useState(0);
  const [mashTimer, setMashTimer] = useState(100);

  // Injustice Directional Swipe Sequence
  const [requiredSwipe, setRequiredSwipe] = useState('LEFT');
  const [swipeTimer, setSwipeTimer] = useState(100);
  const [touchStartPos, setTouchStartPos] = useState(null);

  // Friday the 13th Needle Wheel (Stage 4)
  const [showFatalCircle, setShowFatalCircle] = useState(false);
  const [circleAngle, setCircleAngle] = useState(0);
  const [circleTargetAngle, setCircleTargetAngle] = useState(180);

  // Slow-Mo Matrix Shield Parry System (Stage 5)
  const [showParryModal, setShowParryModal] = useState(false);
  const [parryRingScale, setParryRingScale] = useState(2.3);

  // Agile Dodge Mechanic (Stage 3)
  const [showDodgeModal, setShowDodgeModal] = useState(false);
  const [dodgeTimer, setDodgeTimer] = useState(100);

  const [pendingAction, setPendingAction] = useState(null);

  // Emergency Recovery Needle & Trivia (Triggers comfortably at <= 55% HP)
  const [showNeedleMinigame, setShowNeedleMinigame] = useState(false);
  const [needlePos, setNeedlePos] = useState(50);
  const [showTriviaModal, setShowTriviaModal] = useState(false);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);

  // VFX & Screenshake
  const [screenShake, setScreenShake] = useState(false);
  const [bossFlash, setBossFlash] = useState(false);
  const [activePolaroid, setActivePolaroid] = useState(0);

  const animRef = useRef({
    p1Offset: { x: 0, y: 0 },
    p2Offset: { x: 0, y: 0 },
    bossOffset: { x: 0, y: 0 },
    cutsceneWalkOffset: 0,
    floatingTexts: [],
    rainDrops: [],
    petals: []
  });

  const canvasRef = useRef(null);
  const cutsceneCanvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const bgmIntervalRef = useRef(null);
  const qteTimerRef = useRef(null);
  const subQteTimerRef = useRef(null);
  const parryTimerRef = useRef(null);
  const dodgeTimerRef = useRef(null);
  const circleAnimRef = useRef(null);
  const circleAngleRef = useRef(0);
  const needleAnimRef = useRef(null);

  const bosses = [
    {
      name: "EGO MONSTER",
      title: "STAGE 1: THE EGO MONSTER",
      baseWeakness: "comm",
      defaultHint: "Honest communication melts his stubborn pride!"
    },
    {
      name: "HANGRY GOBLIN",
      title: "STAGE 2: THE HANGRY GOBLIN",
      baseWeakness: "food",
      defaultHint: "Feed him delicious treats and sweet milk tea!"
    },
    {
      name: "OVERTHINK PHANTOM",
      title: "STAGE 3: OVERTHINK PHANTOM",
      baseWeakness: "hug",
      defaultHint: "Warm hugs and pure reassurance calm the spiral!"
    },
    {
      name: "DREAD DEVOURER",
      title: "STAGE 4: DREAD DEVOURER",
      baseWeakness: "comm",
      defaultHint: "Unbreakable trust and love conquer fear!"
    },
    {
      name: "ABYSS VOID TITAN ⚡",
      title: "FINAL STAGE: ABYSS VOID TITAN",
      baseWeakness: "hug",
      defaultHint: "Hold each other close through the storm!"
    }
  ];

  const triviaQuestions = [
    {
      q: "What is Ray's favorite color? ❤️",
      options: ["Navy Blue", "Red", "Emerald Green", "Pastel Pink"],
      answer: "Red"
    },
    {
      q: "What is Ray's favorite sport? ⚾",
      options: ["Soccer", "Tennis", "Baseball", "Basketball"],
      answer: "Baseball"
    },
    {
      q: "What is Ray's favorite food? 🍜",
      options: ["Burgers", "Noodles", "Fried Chicken", "Pizza"],
      answer: "Noodles"
    }
  ];

  const currentBoss = bosses[phase - 1] || bosses[0];

  useEffect(() => {
    setCurrentWeakness(currentBoss.baseWeakness);
    setIsSurpriseWeakness(false);
  }, [phase]);

  // Rain and Blossom Petal Initializers
  useEffect(() => {
    const drops = [];
    for (let i = 0; i < 70; i++) {
      drops.push({
        x: Math.random() * 160,
        y: Math.random() * 240,
        speed: 5 + Math.random() * 4,
        length: 7 + Math.random() * 6
      });
    }
    const petals = [];
    for (let i = 0; i < 45; i++) {
      petals.push({
        x: Math.random() * 160,
        y: Math.random() * 240,
        speedX: 0.4 - Math.random() * 0.8,
        speedY: 0.8 + Math.random() * 1.2,
        size: 2.2 + Math.random() * 2
      });
    }
    animRef.current.rainDrops = drops;
    animRef.current.petals = petals;
  }, []);

  // Web Audio Chiptune Synthesizer
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (freq, type = 'square', dur = 0.08, ramp = 0.001) => {
    if (isMuted) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(ramp, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // Audio safety
    }
  };

  const playThunderSound = () => {
    if (isMuted) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.9);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.95);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.95);
    } catch {
      // Audio safety
    }
  };

  const playJumpscareSound = () => {
    if (isMuted) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(130, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.75);
      osc2.frequency.setValueAtTime(280, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(1150, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio safety
    }
  };

  const playRomanticChiptune = () => {
    if (isMuted) return;
    const chords = [392.00, 440.00, 523.25, 659.25, 783.99, 1046.5];
    chords.forEach((n, i) => setTimeout(() => playSound(n, 'sine', 0.35), i * 130));
  };

  // Background Music Loop
  useEffect(() => {
    if (isMuted || gameState === 'landing' || gameState === 'instructions' || gameState === 'gameover') {
      if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
      return;
    }

    const melodyCuteStages = [
      261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 261.63, 196.00,
      220.00, 261.63, 293.66, 329.63, 293.66, 261.63, 220.00, 196.00
    ];
    const melodyDarkStages = [
      130.81, 146.83, 155.56, 174.61, 155.56, 146.83, 130.81, 116.54,
      130.81, 155.56, 174.61, 196.00, 174.61, 155.56, 130.81, 98.00
    ];
    const melodyStage5Abyss = [
      55.00, 58.27, 49.00, 46.25, 73.42, 69.30, 55.00, 41.20,
      51.91, 46.25, 49.00, 55.00, 38.89, 41.20, 55.00, 32.70
    ];
    const melodyRomanticSunset = [
      329.63, 392.00, 440.00, 523.25, 659.25, 523.25, 440.00, 392.00,
      349.23, 440.00, 523.25, 659.25, 698.46, 659.25, 523.25, 440.00
    ];

    let noteIndex = 0;
    let notes = melodyCuteStages;
    let tempo = 200;
    let waveType = 'triangle';

    if (gameState === 'cutscene' || gameState === 'victory') {
      notes = melodyRomanticSunset;
      tempo = 175;
      waveType = 'sine';
    } else if (phase === 5) {
      notes = melodyStage5Abyss;
      tempo = 115;
      waveType = 'sawtooth';
    } else if (phase === 4 || phase === 3) {
      notes = melodyDarkStages;
      tempo = 145;
      waveType = 'sawtooth';
    }

    bgmIntervalRef.current = setInterval(() => {
      const note = notes[noteIndex % notes.length];
      playSound(note, waveType, 0.12, 0.001);
      noteIndex++;
    }, tempo);

    return () => {
      if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
    };
  }, [gameState, phase, isMuted]);

  const addFloatingText = (text, x, y, color = '#facc15') => {
    animRef.current.floatingTexts.push({ text, x, y, color, life: 40 });
  };

  // Emergency Recovery Needle Animation
  useEffect(() => {
    if (!showNeedleMinigame) return;
    let pos = 50;
    let dir = 0.9;

    const loop = () => {
      pos += dir * 1.4;
      if (pos >= 94) {
        pos = 94;
        dir = -0.9;
      } else if (pos <= 6) {
        pos = 6;
        dir = 0.9;
      }
      setNeedlePos(pos);
      needleAnimRef.current = requestAnimationFrame(loop);
    };

    needleAnimRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(needleAnimRef.current);
  }, [showNeedleMinigame]);

  // Friday the 13th Needle Wheel Loop (Stage 4)
  useEffect(() => {
    if (!showFatalCircle) return;
    circleAngleRef.current = 0;

    const loop = () => {
      circleAngleRef.current = (circleAngleRef.current + 4.2) % 360;
      setCircleAngle(circleAngleRef.current);
      circleAnimRef.current = requestAnimationFrame(loop);
    };

    circleAnimRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(circleAnimRef.current);
  }, [showFatalCircle]);

  const triggerFatalCircle = () => {
    setIsTurnLocked(true);
    const randomTarget = Math.floor(80 + Math.random() * 200);
    setCircleTargetAngle(randomTarget);
    setShowFatalCircle(true);
    playSound(320, 'sawtooth', 0.2);
  };

  const handleStopFatalCircle = () => {
    if (circleAnimRef.current) cancelAnimationFrame(circleAnimRef.current);
    setShowFatalCircle(false);

    const currentDeg = circleAngleRef.current;
    const target = circleTargetAngle;
    const tolerance = 35; // 70-degree sweet spot

    const diff = Math.abs(currentDeg - target);
    const isSuccess = diff <= tolerance || (360 - diff) <= tolerance;

    if (isSuccess) {
      playSound(880, 'triangle', 0.3);
      setBossFlash(true);
      setTimeout(() => setBossFlash(false), 200);
      addFloatingText("AMBUSH DEFLECTED!", 35, 110, '#34d399');
      setBattleLog("⚡ PURE INSTINCT! Charisse deflected the killer's ambush!");
      setIsTurnLocked(false);
    } else {
      playSound(120, 'sawtooth', 0.5);
      const hitDamage = 35;
      const remainingHp = Math.max(0, playerHp - hitDamage);
      setPlayerHp(remainingHp);
      addFloatingText(`-${hitDamage} HP!`, 40, 110, '#ef4444');
      setBattleLog("⚠️ Ambush grazed your defenses! Stay alert!");
      
      if (remainingHp <= 0) {
        setTimeout(() => setGameState('gameover'), 600);
      } else {
        setIsTurnLocked(false);
      }
    }
  };

  // Slow-Mo Matrix Parry System (Stage 5)
  const triggerMatrixParry = () => {
    setIsTurnLocked(true);
    setShowParryModal(true);
    setParryRingScale(2.3);
    playSound(380, 'sine', 0.15);

    const start = Date.now();
    const duration = 1400;

    if (parryTimerRef.current) clearInterval(parryTimerRef.current);

    parryTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = elapsed / duration;
      const newScale = Math.max(0.4, 2.3 - progress * 1.9);
      setParryRingScale(newScale);

      if (progress >= 1) {
        clearInterval(parryTimerRef.current);
        handleParryFailure();
      }
    }, 16);
  };

  const handleParrySuccess = () => {
    if (parryTimerRef.current) clearInterval(parryTimerRef.current);
    setShowParryModal(false);

    const isGoodTiming = parryRingScale >= 0.75 && parryRingScale <= 1.35;

    if (isGoodTiming) {
      playSound(900, 'triangle', 0.25);
      setBossFlash(true);
      setScreenShake(true);
      setTimeout(() => {
        setBossFlash(false);
        setScreenShake(false);
      }, 300);

      addFloatingText("MATRIX PARRY! 🛡️", 35, 110, '#38bdf8');
      setBattleLog("✨ Ray & Charisse parried the incoming strike together!");
      setSynergy((prev) => Math.min(100, prev + 35));
      setIsTurnLocked(false);
    } else {
      handleParryFailure();
    }
  };

  const handleParryFailure = () => {
    if (parryTimerRef.current) clearInterval(parryTimerRef.current);
    setShowParryModal(false);
    playSound(140, 'sawtooth', 0.3);
    
    const damage = 25;
    const remainingHp = Math.max(0, playerHp - damage);
    setPlayerHp(remainingHp);
    addFloatingText(`-${damage} HP`, 35, 120, '#ef4444');
    setBattleLog("⚠️ Parry mistimed! Guard broken!");

    if (remainingHp <= 0) {
      setTimeout(() => setGameState('gameover'), 600);
    } else {
      setIsTurnLocked(false);
    }
  };

  // Quick-Dodge Evade System (Stage 3)
  const triggerDodgeAction = () => {
    setIsTurnLocked(true);
    setShowDodgeModal(true);
    setDodgeTimer(100);

    const start = Date.now();
    const duration = 1800;

    if (dodgeTimerRef.current) clearInterval(dodgeTimerRef.current);

    dodgeTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setDodgeTimer(remaining);

      if (remaining <= 0) {
        clearInterval(dodgeTimerRef.current);
        setShowDodgeModal(false);
        const dmg = 25;
        const remainingHp = Math.max(0, playerHp - dmg);
        setPlayerHp(remainingHp);
        addFloatingText(`-${dmg} HP`, 35, 120, '#ef4444');
        setBattleLog("⚠️ Too slow to dodge! Swept by claws!");
        if (remainingHp <= 0) setTimeout(() => setGameState('gameover'), 600);
        else setIsTurnLocked(false);
      }
    }, 20);
  };

  const handleDodgeSuccess = () => {
    if (dodgeTimerRef.current) clearInterval(dodgeTimerRef.current);
    setShowDodgeModal(false);
    playSound(850, 'sine', 0.18);
    addFloatingText("CLEAN DODGE! 💨", 35, 110, '#34d399');
    setBattleLog("💨 Quick reflexes! Leaped clear of the sweeping attack!");
    setIsTurnLocked(false);
  };

  // Detailed Environmental Drawing Helpers
  const drawPineTree = (ctx, x, y, scale = 1, mood = 'cute') => {
    const isCorrupt = mood === 'dark' || mood === 'apocalypse';
    ctx.fillStyle = isCorrupt ? (mood === 'apocalypse' ? '#0a0005' : '#1a0505') : '#3e2723';
    ctx.fillRect(x + 5 * scale, y + 24 * scale, 4 * scale, 8 * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 7 * scale, y + 32 * scale, 8 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isCorrupt ? (mood === 'apocalypse' ? '#2d0612' : '#3b0707') : '#14532d';
    ctx.fillRect(x + 1 * scale, y + 16 * scale, 12 * scale, 9 * scale);
    ctx.fillStyle = isCorrupt ? (mood === 'apocalypse' ? '#4a041f' : '#500724') : '#166534';
    ctx.fillRect(x + 2 * scale, y + 17 * scale, 10 * scale, 6 * scale);
    ctx.fillStyle = isCorrupt ? (mood === 'apocalypse' ? '#450a0a' : '#450a0a') : '#15803d';
    ctx.fillRect(x + 3 * scale, y + 9 * scale, 8 * scale, 8 * scale);
    ctx.fillStyle = isCorrupt ? (mood === 'apocalypse' ? '#70092b' : '#7f1d1d') : '#22c55e';
    ctx.fillRect(x + 4 * scale, y + 10 * scale, 6 * scale, 5 * scale);
  };

  const drawMossyRock = (ctx, x, y, w = 16, h = 10, mood = 'cute') => {
    const isCorrupt = mood === 'dark' || mood === 'apocalypse';
    ctx.fillStyle = isCorrupt ? '#1a0404' : '#475569';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 2);
    ctx.fillRect(x, y + 4, w, h - 4);
    ctx.fillStyle = isCorrupt ? '#7f1d1d' : '#22c55e';
    ctx.fillRect(x + 3, y + 1, 6, 3);
  };

  const drawFlowerTuft = (ctx, x, y, color = '#f43f5e') => {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x, y + 2, 2, 4);
    ctx.fillRect(x + 3, y + 1, 2, 5);
    ctx.fillStyle = color;
    ctx.fillRect(x - 1, y, 3, 3);
    ctx.fillRect(x + 3, y - 1, 3, 3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x, y + 1, 1, 1);
  };

  // Character Sprites
  const drawCuteCharisse = (ctx, x, y) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 30, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a1f11';
    ctx.fillRect(x + 2, y + 6, 17, 18);
    ctx.fillRect(x + 1, y + 12, 19, 11);

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x + 1, y + 3, 4, 4);
    ctx.fillRect(x + 16, y + 3, 4, 4);

    ctx.fillStyle = '#ffd7ba';
    ctx.fillRect(x + 5, y + 5, 11, 9);

    ctx.fillStyle = '#2b1408';
    ctx.fillRect(x + 7, y + 8, 3, 4);
    ctx.fillRect(x + 12, y + 8, 3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 7, y + 8, 1, 2);
    ctx.fillRect(x + 12, y + 8, 1, 2);

    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x + 5, y + 14, 11, 10);
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(x + 7, y + 15, 7, 8);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 5, y + 23, 11, 2);

    ctx.fillStyle = '#831843';
    ctx.fillRect(x + 6, y + 25, 4, 4);
    ctx.fillRect(x + 11, y + 25, 4, 4);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 18, y + 7, 2, 21);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(x + 16, y + 3, 6, 5);
  };

  const drawCuteRay = (ctx, x, y) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 30, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#171717';
    ctx.fillRect(x + 4, y + 2, 13, 5);
    ctx.fillRect(x + 3, y + 4, 15, 4);

    ctx.fillStyle = '#ffd7ba';
    ctx.fillRect(x + 5, y + 6, 11, 8);

    ctx.fillStyle = '#171717';
    ctx.fillRect(x + 7, y + 9, 2, 3);
    ctx.fillRect(x + 12, y + 9, 2, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 7, y + 9, 1, 1);
    ctx.fillRect(x + 12, y + 9, 1, 1);

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(x + 4, y + 14, 13, 10);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x + 6, y + 15, 9, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 2, y + 15, 3, 11);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 6, y + 25, 4, 4);
    ctx.fillRect(x + 11, y + 25, 4, 4);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 19, y + 5, 2, 12);
  };

  // Main Canvas Render Loop
  useEffect(() => {
    if (gameState !== 'battle') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let frameId;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const skyGradients = [
        ['#38bdf8', '#0284c7'], // Stage 1: Cute Sunny Blue
        ['#0284c7', '#0f766e'], // Stage 2: Cozy Emerald Teal
        ['#1e1b4b', '#312e81'], // Stage 3: Rainy Twilight
        ['#280205', '#0c0002'], // Stage 4: Dark Bloody Mist
        ['#08000f', '#240026']  // Stage 5: Void Apocalypse
      ];
      const curSky = skyGradients[phase - 1] || skyGradients[0];
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 100);
      skyGrad.addColorStop(0, curSky[0]);
      skyGrad.addColorStop(1, curSky[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 160, 240);

      const mood = phase >= 5 ? 'apocalypse' : (phase >= 3 ? 'dark' : 'cute');

      drawPineTree(ctx, 4, 42, 0.9, mood);
      drawPineTree(ctx, 22, 38, 1.1, mood);
      drawPineTree(ctx, 60, 36, 1.0, mood);
      drawPineTree(ctx, 134, 40, 0.95, mood);

      ctx.fillStyle = phase >= 4 ? '#180205' : (phase === 3 ? '#0a0512' : '#14532d');
      ctx.beginPath();
      ctx.moveTo(0, 95);
      ctx.lineTo(160, 65);
      ctx.lineTo(160, 240);
      ctx.lineTo(0, 240);
      ctx.fill();

      ctx.fillStyle = phase >= 4 ? '#100104' : (phase === 3 ? '#1e1b2e' : '#334155');
      ctx.beginPath();
      ctx.moveTo(20, 120);
      ctx.lineTo(145, 90);
      ctx.lineTo(135, 215);
      ctx.lineTo(10, 215);
      ctx.fill();

      drawMossyRock(ctx, 6, 98, 18, 11, mood);
      drawMossyRock(ctx, 136, 175, 16, 9, mood);
      if (phase <= 2) {
        drawFlowerTuft(ctx, 12, 145, '#f43f5e');
        drawFlowerTuft(ctx, 138, 115, '#fbbf24');
        drawFlowerTuft(ctx, 128, 205, '#ec4899');
        drawFlowerTuft(ctx, 22, 220, '#60a5fa');
      }

      const bob = Math.sin(tick * 0.1) * (phase >= 4 ? 4 : 2);
      const bX = 96 + animRef.current.bossOffset.x;
      const bY = 34 + animRef.current.bossOffset.y + bob;

      if (bossFlash) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bX - 4, bY - 4, 48, 48);
      } else {
        if (phase === 1) {
          ctx.fillStyle = '#4c1d95';
          ctx.fillRect(bX + 2, bY + 6, 36, 30);
          ctx.fillRect(bX + 8, bY, 24, 38);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bX + 10, bY + 14, 5, 4);
          ctx.fillRect(bX + 24, bY + 14, 5, 4);
        } else if (phase === 2) {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(bX + 2, bY + 6, 34, 28);
          ctx.fillRect(bX + 8, bY, 22, 36);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bX + 10, bY + 12, 5, 5);
          ctx.fillRect(bX + 22, bY + 12, 5, 5);
        } else if (phase === 3) {
          ctx.fillStyle = '#9d174d';
          ctx.fillRect(bX + 2, bY + 4, 36, 32);
          ctx.fillStyle = '#be185d';
          ctx.fillRect(bX + 6, bY, 28, 36);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(bX + 10, bY + 11, 7, 4);
          ctx.fillRect(bX + 23, bY + 11, 7, 4);
        } else if (phase === 4) {
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(bX - 2, bY, 44, 40);
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(bX + 4, bY - 4, 32, 44);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bX + 8, bY + 8, 8, 7);
          ctx.fillRect(bX + 24, bY + 8, 8, 7);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(bX + 11, bY + 10, 3, 3);
          ctx.fillRect(bX + 27, bY + 10, 3, 3);
        } else {
          ctx.fillStyle = '#1e0024';
          ctx.fillRect(bX - 8, bY - 12, 56, 56);
          ctx.fillStyle = '#4a0058';
          ctx.fillRect(bX - 4, bY - 8, 48, 50);
          ctx.fillStyle = Math.sin(tick * 0.2) > 0 ? '#ff0055' : '#7700ff';
          ctx.fillRect(bX + 14, bY + 16, 12, 12);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(bX + 2, bY, 6, 3);
          ctx.fillRect(bX + 32, bY, 6, 3);
          ctx.fillStyle = '#ff0033';
          ctx.fillRect(bX + 8, bY + 7, 8, 3);
          ctx.fillRect(bX + 24, bY + 7, 8, 3);
        }
      }

      // Players
      const p2X = 64 + animRef.current.p2Offset.x;
      const p2Y = 152 + animRef.current.p2Offset.y;
      drawCuteRay(ctx, p2X, p2Y);

      const p1X = 22 + animRef.current.p1Offset.x;
      const p1Y = 138 + animRef.current.p1Offset.y;
      drawCuteCharisse(ctx, p1X, p1Y);

      // Rain / Blood Weather
      if (phase >= 3) {
        ctx.strokeStyle = phase >= 4 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(186, 230, 253, 0.45)';
        ctx.lineWidth = phase >= 4 ? 1.5 : 1;
        animRef.current.rainDrops.forEach((drop) => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.length);
          ctx.stroke();

          drop.y += drop.speed;
          drop.x -= 0.6;
          if (drop.y > 240) {
            drop.y = -5;
            drop.x = Math.random() * 165;
          }
        });

        if (phase === 5 && Math.random() < 0.04) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fillRect(0, 0, 160, 240);
        }
      }

      // Floating Texts
      const fts = animRef.current.floatingTexts;
      for (let i = fts.length - 1; i >= 0; i--) {
        const ft = fts[i];
        ctx.fillStyle = ft.color;
        ctx.font = '7px "Press Start 2P"';
        ctx.fillText(ft.text, ft.x, ft.y);
        ft.y -= 0.6;
        ft.life--;
        if (ft.life <= 0) fts.splice(i, 1);
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [gameState, phase, bossFlash]);

  // Epilogue Sunset Cutscene Canvas Loop
  useEffect(() => {
    if (gameState !== 'cutscene') return;
    const canvas = cutsceneCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let frameId;
    let tick = 0;

    const renderCutscene = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const skyGrad = ctx.createLinearGradient(0, 0, 0, 140);
      skyGrad.addColorStop(0, '#f97316');
      skyGrad.addColorStop(0.5, '#fb923c');
      skyGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 160, 240);

      ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
      ctx.beginPath();
      ctx.arc(80, 85, 26 + Math.sin(tick * 0.05) * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(0, 125);
      ctx.quadraticCurveTo(80, 110, 160, 130);
      ctx.lineTo(160, 240);
      ctx.lineTo(0, 240);
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(0, 145);
      ctx.quadraticCurveTo(80, 135, 160, 150);
      ctx.lineTo(160, 240);
      ctx.lineTo(0, 240);
      ctx.fill();

      for (let f = 8; f < 155; f += 16) {
        ctx.fillStyle = f % 2 === 0 ? '#f43f5e' : '#ec4899';
        ctx.fillRect(f, 195 + (f % 5), 3, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(f + 1, 196 + (f % 5), 1, 1);
      }

      ctx.fillStyle = 'rgba(244, 114, 182, 0.8)';
      animRef.current.petals.forEach((p) => {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y > 240) {
          p.y = -5;
          p.x = Math.random() * 160;
        }
      });

      const walkOffset = animRef.current.cutsceneWalkOffset;
      if (cutsceneCharsFaded) {
        animRef.current.cutsceneWalkOffset += 0.4;
      }

      const p1X = 54 + walkOffset;
      const p2X = 82 + walkOffset;
      const walkBob = Math.sin(tick * 0.15) * 1.5;

      ctx.save();
      if (cutsceneCharsFaded && walkOffset > 25) {
        ctx.globalAlpha = Math.max(0, 1 - (walkOffset - 25) / 20);
      }

      drawCuteCharisse(ctx, p1X, 145 + walkBob);
      drawCuteRay(ctx, p2X, 145 + walkBob);

      ctx.fillStyle = '#f43f5e';
      ctx.font = '12px "Press Start 2P"';
      ctx.fillText("❤️", 72 + walkOffset, 138 + Math.sin(tick * 0.1) * 2);

      ctx.restore();

      frameId = requestAnimationFrame(renderCutscene);
    };

    renderCutscene();
    return () => cancelAnimationFrame(frameId);
  }, [gameState, cutsceneCharsFaded]);

  // Turn Execution
  const initiateAttack = (actionKey) => {
    if (isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showParryModal || showFatalCircle || showDodgeModal) return;
    setAttackWarning("");
    setPendingAction(actionKey);
    setQteScale(2.3);
    setQteStep('timed');

    const start = Date.now();
    const duration = 1050;

    if (qteTimerRef.current) clearInterval(qteTimerRef.current);

    qteTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = elapsed / duration;
      const newScale = Math.max(0.4, 2.3 - progress * 1.9);
      setQteScale(newScale);

      if (progress >= 1) {
        clearInterval(qteTimerRef.current);
        handleQTEFailed("TIMED TAP MISSED!");
      }
    }, 16);
  };

  const handleQTETimedTap = () => {
    if (qteTimerRef.current) clearInterval(qteTimerRef.current);
    playSound(520, 'sine', 0.1);

    if (phase === 1) {
      setQteStep(null);
      resolveTurn(pendingAction, true);
    } else {
      startMashStep();
    }
  };

  const startMashStep = () => {
    setQteStep('mash');
    setMashCount(0);
    setMashTimer(100);

    const startTime = Date.now();
    const duration = 2300;

    if (subQteTimerRef.current) clearInterval(subQteTimerRef.current);

    subQteTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setMashTimer(remainingPct);

      if (remainingPct <= 0) {
        clearInterval(subQteTimerRef.current);
        handleQTEFailed("NOT ENOUGH TAPS!");
      }
    }, 20);
  };

  const handleMashTap = () => {
    playSound(600, 'square', 0.04);
    const nextCount = mashCount + 1;
    setMashCount(nextCount);

    if (nextCount >= 8) {
      if (subQteTimerRef.current) clearInterval(subQteTimerRef.current);
      playSound(780, 'triangle', 0.15);

      if (phase === 2) {
        setQteStep(null);
        resolveTurn(pendingAction, true);
      } else {
        startDirectionalSwipe('LEFT');
      }
    }
  };

  const startDirectionalSwipe = (direction) => {
    setRequiredSwipe(direction);
    setSwipeTimer(100);
    setTouchStartPos(null);
    setQteStep('swipe');

    const startTime = Date.now();
    const duration = 3000;

    if (subQteTimerRef.current) clearInterval(subQteTimerRef.current);

    subQteTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setSwipeTimer(remainingPct);

      if (remainingPct <= 0) {
        clearInterval(subQteTimerRef.current);
        handleQTEFailed(`TIME OUT ON ${direction === 'UP_OR_DOWN' ? 'FINISHER' : direction} SWIPE!`);
      }
    }, 20);
  };

  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setTouchStartPos({ x: clientX, y: clientY });
  };

  const handlePointerUp = (e) => {
    if (!touchStartPos || qteStep !== 'swipe') return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    const diffX = clientX - touchStartPos.x;
    const diffY = clientY - touchStartPos.y;
    setTouchStartPos(null);

    const threshold = 35;
    let swipeMatched = false;

    if (requiredSwipe === 'LEFT') {
      if (Math.abs(diffX) > Math.abs(diffY) && diffX < -threshold) swipeMatched = true;
    } else if (requiredSwipe === 'RIGHT') {
      if (Math.abs(diffX) > Math.abs(diffY) && diffX > threshold) swipeMatched = true;
    } else if (requiredSwipe === 'UP_OR_DOWN') {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > threshold) swipeMatched = true;
    }

    if (swipeMatched) {
      if (subQteTimerRef.current) clearInterval(subQteTimerRef.current);
      setQteStep(null);
      executeSwipeSuccess(requiredSwipe);
    }
  };

  const executeSwipeSuccess = (currentDir) => {
    if (currentDir === 'LEFT') {
      playSound(680, 'triangle', 0.15);
      setBossFlash(true);
      setTimeout(() => setBossFlash(false), 120);
      addFloatingText("CHARISSE STRIKE! 💥", 40, 130, '#f472b6');
      setBattleLog("⚔️ Charisse charges in with a starlight strike!");
      setTimeout(() => startDirectionalSwipe('RIGHT'), 200);
    } else if (currentDir === 'RIGHT') {
      playSound(780, 'triangle', 0.15);
      setBossFlash(true);
      setTimeout(() => setBossFlash(false), 120);
      addFloatingText("RAY CROSS-SLASH! 🔥", 55, 125, '#38bdf8');
      setBattleLog("⚡ Ray dashes in with a piercing cross-slash!");
      setTimeout(() => startDirectionalSwipe('UP_OR_DOWN'), 200);
    } else if (currentDir === 'UP_OR_DOWN') {
      playSound(920, 'triangle', 0.25);
      addFloatingText("DUAL SKY FINISHER! ⚡", 45, 115, '#facc15');
      setBattleLog("🌟 Charisse & Ray execute their synchronized team finisher!");
      resolveTurn(pendingAction, true);
    }
  };

  const handleQTEFailed = (reason) => {
    setQteStep(null);
    if (subQteTimerRef.current) clearInterval(subQteTimerRef.current);
    playSound(150, 'sawtooth', 0.25);
    addFloatingText("MISS!", 40, 140, '#94a3b8');
    setAttackWarning(`❌ ${reason}`);
    setBattleLog("Combo dropped! The monster counters!");
    setIsTurnLocked(true);
    setTimeout(() => bossCounterAttack(true), 700);
  };

  const resolveTurn = (actionKey, isCrit) => {
    setIsTurnLocked(true);
    const isEffective = actionKey === currentWeakness;

    if (!isEffective) {
      playSound(200, 'sawtooth', 0.15);
      addFloatingText("BLOCKED!", 100, 35, '#94a3b8');
      setAttackWarning(`INEFFECTIVE! Currently weak to: ${currentWeakness.toUpperCase()}`);
      setBattleLog(`Blocked! It desires ${currentWeakness.toUpperCase()}!`);
      setTimeout(() => bossCounterAttack(false), 600);
      return;
    }

    setBossFlash(true);
    setScreenShake(true);
    setTimeout(() => {
      setBossFlash(false);
      setScreenShake(false);
    }, 350);

    const baseDmg = isCrit ? (phase === 5 ? 40 : 50) : 30;
    playSound(isCrit ? 700 : 500, 'triangle', 0.15);
    addFloatingText(isCrit ? `CRIT! -${baseDmg}` : `-${baseDmg}`, 95, 30, isCrit ? '#f43f5e' : '#facc15');

    const nextBossHp = Math.max(0, bossHp - baseDmg);
    setBossHp(nextBossHp);
    setSynergy((prev) => Math.min(100, prev + (isCrit ? 40 : 25)));
    setBattleLog("💥 Direct hit broke right through!");

    if (nextBossHp <= 0) {
      setTimeout(() => advancePhase(), 800);
    } else {
      if (Math.random() < 0.25) {
        const cravings = ['comm', 'food', 'hug'];
        const surprise = cravings.filter(c => c !== currentBoss.baseWeakness)[Math.floor(Math.random() * 2)];
        setCurrentWeakness(surprise);
        setIsSurpriseWeakness(true);
        const nameMap = { comm: 'LOVE / COMMUNICATE 💌', food: 'FOOD / TREATS 🍔', hug: 'WARM HUGS 🫂' };
        setBattleLog(`💡 SURPRISE CRAVING! Monster temporarily desires: ${nameMap[surprise]}!`);
      } else {
        setCurrentWeakness(currentBoss.baseWeakness);
        setIsSurpriseWeakness(false);
      }

      setTimeout(() => bossCounterAttack(false), 900);
    }
  };

  const executeHeal = () => {
    if (isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showParryModal || showFatalCircle || showDodgeModal) return;
    setIsTurnLocked(true);
    setAttackWarning("");
    playSound(580, 'sine', 0.2);
    const restored = Math.min(100, playerHp + 35);
    setPlayerHp(restored);
    addFloatingText("+35 HP", 35, 140, '#34d399');
    setBattleLog("🧪 Shared Warm Milk Tea! Restored 35 HP to our team!");
    setTimeout(() => bossCounterAttack(false), 900);
  };

  const executeUltimate = () => {
    if (synergy < 100 || isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showParryModal || showFatalCircle || showDodgeModal) return;
    setIsTurnLocked(true);
    setAttackWarning("");
    setSynergy(0);

    playSound(400, 'square', 0.1);
    setTimeout(() => playSound(600, 'square', 0.15), 100);
    setTimeout(() => playSound(800, 'triangle', 0.3), 200);

    setBossFlash(true);
    setScreenShake(true);
    addFloatingText("DUO STRIKE! -75", 85, 25, '#ec4899');
    setTimeout(() => {
      setBossFlash(false);
      setScreenShake(false);
    }, 400);

    const nextBossHp = Math.max(0, bossHp - 75);
    setBossHp(nextBossHp);
    setBattleLog("🌟 DUO ULTIMATE: 'May 9th Starlight Strike' shatters all darkness!");

    if (nextBossHp <= 0) {
      setTimeout(() => advancePhase(), 800);
    } else {
      setTimeout(() => bossCounterAttack(false), 1000);
    }
  };

  const bossCounterAttack = (isHeavyHit = false) => {
    playSound(140, 'sawtooth', 0.25);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);

    // Guaranteed trigger paths for specific mechanics
    if (phase === 5 && Math.random() < 0.65) {
      setTimeout(() => triggerMatrixParry(), 400);
      return;
    }
    if (phase === 4 && (bossHp <= 70 || Math.random() < 0.65)) {
      setTimeout(() => triggerFatalCircle(), 400);
      return;
    }
    if (phase === 3 && Math.random() < 0.55) {
      setTimeout(() => triggerDodgeAction(), 400);
      return;
    }

    const damage = (isHeavyHit ? 28 : 18) + (phase * 3);
    const remainingHp = Math.max(0, playerHp - damage);
    setPlayerHp(remainingHp);
    addFloatingText(`-${damage} HP`, 35, 140, '#ef4444');

    if (remainingHp <= 0) {
      playSound(100, 'sawtooth', 0.5);
      setBattleLog("💀 Team HP hit 0! You were defeated...");
      setTimeout(() => setGameState('gameover'), 700);
    } else if (remainingHp <= 55) {
      // Guaranteed healing check window at <= 55% HP
      setIsTurnLocked(true);
      setTimeout(() => {
        playSound(440, 'sine', 0.2);
        setShowNeedleMinigame(true);
      }, 500);
    } else {
      setBattleLog(`⚠️ ${currentBoss.name} struck back for -${damage} HP!`);
      setIsTurnLocked(false);
    }
  };

  const handleStopNeedle = () => {
    if (needleAnimRef.current) cancelAnimationFrame(needleAnimRef.current);
    setShowNeedleMinigame(false);

    const isSuccess = needlePos >= 30 && needlePos <= 70;

    if (isSuccess) {
      playSound(660, 'sine', 0.2);
      addFloatingText("SWEET SPOT!", 40, 110, '#34d399');
      setCurrentTriviaIndex(Math.floor(Math.random() * triviaQuestions.length));
      setShowTriviaModal(true);
    } else {
      playSound(180, 'sawtooth', 0.3);
      addFloatingText("FAILED!", 40, 110, '#ef4444');
      setBattleLog("⚠️ Emergency needle missed! Stay focused!");
      setIsTurnLocked(false);
    }
  };

  const handleTriviaAnswer = (selectedOption) => {
    const trivia = triviaQuestions[currentTriviaIndex];
    setShowTriviaModal(false);

    if (selectedOption === trivia.answer) {
      playSound(780, 'triangle', 0.3);
      confetti({ particleCount: 60, spread: 50 });
      const revivedHp = Math.min(100, playerHp + 50);
      setPlayerHp(revivedHp);
      addFloatingText("+50 HP REVIVAL!", 30, 130, '#ec4899');
      setBattleLog("💖 Ray's love restored your energy! +50 HP!");
    } else {
      playSound(160, 'sawtooth', 0.25);
      addFloatingText("WRONG ANSWER!", 30, 130, '#ef4444');
      setBattleLog("❌ Close, but not quite! Stay determined!");
    }
    setIsTurnLocked(false);
  };

  const advancePhase = () => {
    if (phase < 5) {
      const nextPhase = phase + 1;
      setPhase(nextPhase);
      setBossHp(100);
      setPlayerHp((p) => Math.min(100, p + 35));
      setAttackWarning("");

      if (nextPhase === 5) {
        setIsTurnLocked(true);
        setJumpscareActive(true);
        setScreenShake(true);
        playJumpscareSound();

        setTimeout(() => {
          setJumpscareActive(false);
          setScreenShake(false);
          setBossIntro(true);
          playThunderSound();

          setTimeout(() => {
            setBossIntro(false);
            setBattleLog("⚡ FINAL BATTLE: The Void Titan rises from the apocalypse storm!");
            setIsTurnLocked(false);
          }, 2000);
        }, 1100);
      } else if (nextPhase === 4) {
        setIsTurnLocked(true);
        setBossIntro(true);
        playSound(150, 'sawtooth', 0.4);

        setTimeout(() => {
          setBossIntro(false);
          setBattleLog("🩸 STAGE 4: Blood rain begins as the Dread Devourer strikes!");
          setIsTurnLocked(false);
        }, 1600);
      } else {
        playSound(660, 'sine', 0.2);
        setBattleLog(`🔥 BOSS DOWN! Warning: ${bosses[phase].title}!`);
        setIsTurnLocked(false);
      }
    } else {
      setIsTurnLocked(true);
      playRomanticChiptune();
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
      setGameState('cutscene');
      setCutsceneDialogueIndex(1);
      setCutsceneCharsFaded(false);
    }
  };

  const resetCampaign = (toMainMenu = false) => {
    setPhase(1);
    setBossHp(100);
    setPlayerHp(100);
    setSynergy(0);
    setCurrentWeakness('comm');
    setIsSurpriseWeakness(false);
    setQteStep(null);
    setBossIntro(false);
    setJumpscareActive(false);
    setShowParryModal(false);
    setShowFatalCircle(false);
    setShowDodgeModal(false);
    setShowNeedleMinigame(false);
    setShowTriviaModal(false);
    setAttackWarning("");
    setIsTurnLocked(false);

    if (toMainMenu) {
      setGameState('landing');
    } else {
      setGameState('battle');
      setBattleLog("Stage 1: The Stubborn Ego Monster appears!");
    }
  };

  // Preserved Personal Love Letters
  const polaroids = [
    {
      caption: "Thank You for Healing My Knee 🩹",
      note: "When I tore the ligament in my right knee, you stayed by my side, took care of me, and supported me every step until I was completely healed. Having you as my companion meant the entire world to me. ❤️",
      emoji: "🩹"
    },
    {
      caption: "My Biggest Supporter: Studies & Basketball 🏀",
      note: "Thank you for endlessly supporting me through all my studies, thesis research (Skripsi 1 & 2), and always cheering the loudest in my basketball tournaments. You are my true MVP. 🏆",
      emoji: "🏀"
    },
    {
      caption: "Happy 4-Month Anniversary, My Love! ✨",
      note: "Dating you since May 9 has been the happiest 4 months of my life. Thank you for being the sweetest partner and the best gamer ever. I love you so, so much Charisse! ❤️",
      emoji: "🎮"
    }
  ];

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center font-cozy text-white select-none bg-black overflow-hidden p-0">
      <div className={`w-full max-w-[430px] h-full flex flex-col justify-between relative bg-slate-950 border-x border-slate-800 shadow-2xl overflow-hidden ${screenShake ? 'animate-shake' : ''}`}>

        {/* ================= SCREEN 1: NEW TITLED LANDING PAGE ================= */}
        {gameState === 'landing' && (
          <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 text-center overflow-hidden">
            <div className="w-full flex justify-between items-center shrink-0 pt-0.5">
              <span className="font-pixel text-[8px] text-pink-400 bg-pink-950/80 border border-pink-700/60 px-2.5 py-1 rounded-full">
                MAY 9, 2026 ➔ TODAY ❤️
              </span>
              
              <button
                onClick={() => {
                  initAudio();
                  setIsMuted(!isMuted);
                }}
                className="p-1.5 rounded-full bg-white/10 border border-slate-700 text-pink-300 hover:text-white backdrop-blur-md"
                title={isMuted ? "Unmute Music" : "Mute Music"}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-yellow-300" />}
              </button>
            </div>

            <div className="flex flex-col items-center my-auto gap-2.5 shrink-0 py-2">
              <div className="relative my-1">
                <div className="text-5xl sm:text-6xl animate-bounce">⚔️💖👑</div>
                <Sparkles className="absolute -top-2 -right-2 text-yellow-300 animate-spin" size={22} />
              </div>

              <div>
                <h1 className="font-pixel text-sm sm:text-base text-pink-200 tracking-wider leading-snug">
                  CHARISSE'S GAME ADVENTURE<br />
                  <span className="text-amber-300 text-xs tracking-widest">4-MONTH ANNIVERSARY QUEST</span>
                </h1>
                <p className="text-[11px] text-pink-300/80 mt-1">
                  123 Days of Love • 5 Epic Boss Battles
                </p>
              </div>

              <div className="bg-purple-950/70 border border-purple-800 rounded-xl p-3 w-full max-w-[320px] text-center shadow-2xl backdrop-blur-md space-y-1 mt-1">
                <span className="font-pixel text-[8px] text-yellow-300 tracking-wider block">
                  ❤️ DEDICATED TO MY FAVORITE GAMER ❤️
                </span>
                <p className="text-[11px] text-pink-100 italic">
                  "Ready to conquer the trials and save our sunset meadow together?"
                </p>
              </div>
            </div>

            {/* 2 Big Buttons: Start Quest & Rules Page */}
            <div className="w-full shrink-0 flex flex-col gap-2 pt-2 pb-1">
              <button
                onClick={() => {
                  initAudio();
                  playSound(440, 'triangle', 0.15);
                  setGameState('battle');
                }}
                className="w-full font-pixel text-xs bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 py-3.5 rounded-xl shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 tracking-wider transform active:scale-95 transition-all"
              >
                START ADVENTURE <ArrowRight size={14} />
              </button>

              <button
                onClick={() => {
                  initAudio();
                  playSound(500, 'sine', 0.05);
                  setGameState('instructions');
                }}
                className="w-full font-pixel text-[9.5px] bg-slate-900 hover:bg-slate-800 text-pink-300 border border-slate-700 py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <BookOpen size={13} /> HOW TO PLAY & COMBAT RULES
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: DEDICATED RULES PAGE ================= */}
        {gameState === 'instructions' && (
          <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 text-left bg-slate-950 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-purple-800/80 pb-2">
              <div className="flex items-center gap-2 font-pixel text-xs text-pink-300">
                <ShieldCheck size={16} className="text-pink-400" />
                <span>ADVENTURE GUIDE</span>
              </div>
              <button
                onClick={() => setGameState('landing')}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200 my-auto py-3 leading-relaxed">
              <div className="bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/60">
                <p className="font-bold text-pink-300 text-[11px] mb-0.5">⚔️ PRIMARY COUNTERS & CRAVINGS</p>
                <p className="text-[11px]">Monsters are mostly weak to their signature weakness, but watch for surprise glowing mood cravings!</p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                <p>🎡 <b>Stage 4 Ambush:</b> Stop the rotating Friday 13th dial in the safe slice!</p>
                <p>⚡ <b>Stage 5 Shield Parry:</b> Tap when the shrinking ring touches the shield!</p>
                <p>💨 <b>Stage 3 Dodge:</b> Quick-jump over claw sweep attacks!</p>
                <p>🩹 <b>Emergency Heal:</b> At &le;55% HP, stop the needle in the green zone to unlock a +50 HP quiz!</p>
                <p>🧋 <b>Warm Milk Tea:</b> Heals +35 HP on command anytime!</p>
              </div>
            </div>

            <button
              onClick={() => setGameState('landing')}
              className="w-full font-pixel text-[10px] bg-pink-600 hover:bg-pink-500 py-3.5 rounded-xl text-center shadow-lg active:scale-95 transition-all shrink-0"
            >
              BACK TO TITLE SCREEN ➔
            </button>
          </div>
        )}

        {/* ================= SCREEN 3: BATTLE ARENA ================= */}
        {gameState === 'battle' && (
          <div className="w-full h-full flex flex-col justify-between relative overflow-hidden">
            
            <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={160}
                height={240}
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Top Left: Stage Badge + Sound Toggle Group */}
              <div className="absolute top-2 left-2 z-40 flex items-center gap-1.5">
                <div className={`border px-2 py-1 rounded-md font-pixel text-[7.5px] shadow-md ${
                  phase === 5 ? 'bg-purple-950/90 border-purple-500 text-purple-300 animate-pulse' : 'bg-black/80 border-slate-700 text-yellow-300'
                }`}>
                  STAGE {phase}/5 {phase === 5 ? '⚡' : (phase >= 3 ? '🌧️' : '')}
                </div>
                <button
                  onClick={() => {
                    initAudio();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1 rounded-md bg-black/80 border border-slate-700 text-pink-300 hover:text-white backdrop-blur-md shadow-md"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-yellow-300" />}
                </button>
              </div>

              {/* Top Right: Boss Health Card */}
              <div className="absolute top-2 right-2 border p-1.5 px-2 rounded-lg min-w-[150px] shadow-lg z-30 bg-black/85 border-slate-700">
                <div className="flex justify-between items-center gap-2 font-pixel text-[7.5px] text-pink-300 mb-0.5 whitespace-nowrap">
                  <span className="tracking-tight">{currentBoss.name}</span>
                  <span className="text-[7px] text-slate-300">{bossHp}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
                    style={{ width: `${bossHp}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Weakness Indicator Badge */}
              <div className="absolute top-10 right-2 z-30 bg-black/80 border border-amber-400/80 px-2 py-0.5 rounded-full font-pixel text-[6.5px] text-amber-300 flex items-center gap-1 shadow-md">
                <span>{isSurpriseWeakness ? '⚡ CRAVING:' : 'WEAKNESS:'}</span>
                <span className="text-white font-bold">
                  {currentWeakness === 'comm' ? '💌 LOVE' : (currentWeakness === 'food' ? '🍔 FOOD' : '🫂 HUG')}
                </span>
              </div>

              {/* Team Health Bar */}
              <div className="absolute bottom-2 left-2 bg-black/85 border border-slate-700 p-1.5 rounded-lg w-38 shadow-lg">
                <div className="flex justify-between font-pixel text-[7.5px] text-emerald-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <HeartPulse size={9} className={playerHp <= 55 ? 'text-red-400 animate-spin' : ''} />
                    OUR TEAM HP
                  </span>
                  <span className={playerHp <= 55 ? 'text-red-400 animate-pulse font-bold' : ''}>{playerHp}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${playerHp <= 55 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${playerHp}%` }}
                  />
                </div>
              </div>

              {/* Jumpscare Overlay (Stage 5 Transition) */}
              {jumpscareActive && (
                <div className="absolute inset-0 z-50 bg-red-950 flex flex-col items-center justify-center p-4 overflow-hidden animate-shake">
                  <div className="text-8xl animate-ping select-none">👁️⚡</div>
                  <div className="absolute inset-0 bg-red-600/40 mix-blend-color-dodge animate-pulse" />
                  <h1 className="font-pixel text-lg sm:text-xl text-white tracking-widest mt-4 drop-shadow-[0_0_20px_rgba(255,0,0,1)] animate-bounce text-center">
                    THE ABYSS CONSUMES!
                  </h1>
                </div>
              )}

              {/* Boss Entrances */}
              {bossIntro && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-4">
                  <span className="font-pixel text-[8px] text-yellow-400 bg-black px-3 py-1 rounded-full border border-yellow-500 mb-2 animate-bounce">
                    {phase === 5 ? '⚡ FINAL BATTLE: VOID APOCALYPSE ⚡' : '🩸 STAGE 4: BLOOD ABYSS 🩸'}
                  </span>
                  <h2 className="font-pixel text-sm sm:text-base text-white tracking-widest leading-relaxed drop-shadow-[0_0_15px_rgba(216,70,239,0.9)]">
                    {currentBoss.title}
                  </h2>
                  <p className="text-[11px] text-pink-200 mt-1 font-bold animate-pulse">
                    {phase === 5 ? 'Thunder rumbles as the ultimate darkness rises!' : 'Watch out for sudden ambushes!'}
                  </p>
                </div>
              )}

              {/* FRIDAY THE 13TH NEEDLE WHEEL MODAL (STAGE 4) */}
              {showFatalCircle && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                  <div className="bg-slate-950 border-2 border-red-600 rounded-2xl p-4 flex flex-col items-center max-w-[280px] w-full text-center shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-shake">
                    <span className="font-pixel text-[8px] text-red-400 bg-red-950 border border-red-700 px-2.5 py-0.5 rounded-full mb-1 flex items-center gap-1">
                      <Skull size={11} /> FRIDAY 13TH AMBUSH!
                    </span>
                    <p className="text-xs text-white font-bold mb-2">
                      STOP the dial in the white slice!
                    </p>

                    <div className="relative w-36 h-36 rounded-full border-4 border-slate-700 flex items-center justify-center overflow-hidden bg-slate-900 shadow-inner">
                      <div 
                        className="absolute w-full h-full pointer-events-none"
                        style={{
                          background: `conic-gradient(from ${circleTargetAngle - 18}deg, transparent 0deg, #ffffff 1deg, #ef4444 18deg, #ffffff 36deg, transparent 37deg)`
                        }}
                      />

                      <div 
                        className="absolute w-full h-1 pointer-events-none"
                        style={{
                          transform: `rotate(${circleAngle}deg)`,
                          transformOrigin: 'center center'
                        }}
                      >
                        <div className="w-1/2 h-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-yellow-400 z-10 flex items-center justify-center font-pixel text-[7px] text-yellow-300">
                        ⚡
                      </div>
                    </div>

                    <button
                      onClick={handleStopFatalCircle}
                      className="w-full mt-3 font-pixel text-[10px] bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl shadow-lg shadow-red-600/50 active:scale-95 transition-all tracking-wider"
                    >
                      STOP DIAL! 🎯
                    </button>
                  </div>
                </div>
              )}

              {/* SLOW-MO MATRIX SHIELD PARRY MODAL (STAGE 5) */}
              {showParryModal && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                  <div className="bg-slate-950 border-2 border-cyan-400 rounded-2xl p-4 flex flex-col items-center max-w-[280px] w-full text-center shadow-[0_0_25px_rgba(34,211,238,0.7)] animate-shake">
                    <span className="font-pixel text-[8px] text-cyan-300 bg-cyan-950 border border-cyan-700 px-2.5 py-0.5 rounded-full mb-2 flex items-center gap-1">
                      <Shield size={11} className="text-cyan-400" /> SLOW-MO MATRIX PARRY!
                    </span>
                    <p className="text-[11px] text-slate-200 font-semibold mb-3">
                      Tap when the shrinking ring hits the shield!
                    </p>

                    <div className="relative w-28 h-28 flex items-center justify-center my-1">
                      <div className="w-14 h-14 rounded-full border-4 border-cyan-400 bg-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_#22d3ee]">
                        <Shield size={22} className="text-cyan-300 animate-pulse" />
                      </div>

                      <div 
                        className="absolute rounded-full border-4 border-yellow-400 pointer-events-none"
                        style={{
                          width: '56px',
                          height: '56px',
                          transform: `scale(${parryRingScale})`,
                        }}
                      />
                    </div>

                    <button
                      onClick={handleParrySuccess}
                      className="w-full mt-3 font-pixel text-[9.5px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-slate-950 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                      SHIELD PARRY! 🛡️
                    </button>
                  </div>
                </div>
              )}

              {/* QUICK-DODGE MODAL (STAGE 3) */}
              {showDodgeModal && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                  <div className="bg-slate-950 border-2 border-emerald-400 rounded-2xl p-4 flex flex-col items-center max-w-[280px] w-full text-center shadow-2xl animate-shake">
                    <span className="font-pixel text-[8px] text-emerald-300 bg-emerald-950 border border-emerald-700 px-2.5 py-0.5 rounded-full mb-2 flex items-center gap-1">
                      <Wind size={11} /> CLAW SWEEP INCOMING!
                    </span>
                    <p className="text-[11px] text-slate-200 font-semibold mb-2">
                      Jump over the incoming sweep!
                    </p>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                      <div 
                        className="bg-emerald-400 h-full transition-all duration-75"
                        style={{ width: `${dodgeTimer}%` }}
                      />
                    </div>

                    <button
                      onClick={handleDodgeSuccess}
                      className="w-full font-pixel text-[9.5px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                      DODGE / JUMP! 💨
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Timed Circle */}
              {qteStep === 'timed' && (
                <div 
                  onClick={handleQTETimedTap}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[1px] cursor-pointer"
                >
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-yellow-400 animate-pulse flex items-center justify-center font-pixel text-[8px] text-yellow-300">
                      TAP!
                    </div>
                    <div 
                      className="absolute rounded-full border-4 border-pink-400 pointer-events-none"
                      style={{
                        width: '48px',
                        height: '48px',
                        transform: `scale(${qteScale})`,
                      }}
                    />
                  </div>
                  <span className="font-pixel text-[7.5px] text-pink-200 mt-2 bg-black/80 px-2.5 py-1 rounded border border-pink-500/50">
                    TAP FAST BEFORE IT CLOSES!
                  </span>
                </div>
              )}

              {/* Step 2: Rapid Mash Heart */}
              {qteStep === 'mash' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[1px] p-3">
                  <div className="bg-slate-900 border-2 border-pink-500 rounded-2xl p-3 flex flex-col items-center max-w-[240px] w-full text-center shadow-2xl">
                    <span className="font-pixel text-[7.5px] text-yellow-300 mb-0.5">STEP 2: RAPID MASH!</span>
                    <p className="text-[11px] text-pink-200 mb-2 font-semibold">Tap repeatedly to fill the heart!</p>

                    <div className="relative w-14 h-14 flex items-center justify-center mb-2">
                      <div 
                        className="w-12 h-12 rounded-full bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center overflow-hidden transition-all"
                        style={{ transform: `scale(${1 + (mashCount / 8) * 0.2})` }}
                      >
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-pink-600 to-rose-400 transition-all duration-75"
                          style={{ height: `${(mashCount / 8) * 100}%` }}
                        />
                        <span className="relative z-10 text-lg animate-pulse">💖</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-2">
                      <div 
                        className="bg-amber-400 h-full transition-all duration-75"
                        style={{ width: `${mashTimer}%` }}
                      />
                    </div>

                    <button
                      onClick={handleMashTap}
                      className="w-full font-pixel text-[8.5px] bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 py-2.5 rounded-xl shadow-lg shadow-pink-500/30 active:scale-90 transition-transform"
                    >
                      TAP! TAP! ({mashCount}/8) 💓
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Directional Swipes */}
              {qteStep === 'swipe' && (
                <div 
                  onTouchStart={handlePointerDown}
                  onTouchEnd={handlePointerUp}
                  onMouseDown={handlePointerDown}
                  onMouseUp={handlePointerUp}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] p-3 cursor-grab"
                >
                  <div className="bg-slate-900 border-2 border-cyan-400 rounded-2xl p-4 flex flex-col items-center max-w-[270px] w-full text-center shadow-2xl pointer-events-none animate-fade-in">
                    <span className="font-pixel text-[8px] text-yellow-300 mb-1">INJUSTICE COMBO FINISHER</span>
                    
                    <div className="flex items-center justify-center gap-2 my-2">
                      {requiredSwipe === 'LEFT' && (
                        <div className="flex items-center gap-2 text-cyan-300 animate-pulse">
                          <ArrowLeft size={34} className="animate-bounce" />
                          <span className="font-pixel text-xs tracking-wider text-white">SWIPE LEFT!</span>
                        </div>
                      )}
                      {requiredSwipe === 'RIGHT' && (
                        <div className="flex items-center gap-2 text-pink-400 animate-pulse">
                          <span className="font-pixel text-xs tracking-wider text-white">SWIPE RIGHT!</span>
                          <ArrowRight size={34} className="animate-bounce" />
                        </div>
                      )}
                      {requiredSwipe === 'UP_OR_DOWN' && (
                        <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                          <ArrowUp size={28} className="animate-bounce" />
                          <ArrowDown size={28} className="animate-bounce" />
                          <span className="font-pixel text-xs tracking-wider text-white">SWIPE UP OR DOWN!</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-cyan-200/90 mb-2">
                      {requiredSwipe === 'LEFT' ? '1/3: Charisse Solo Lunge' : requiredSwipe === 'RIGHT' ? '2/3: Ray Cross-Slash' : '3/3: Synchronized Final Strike!'}
                    </p>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                      <div 
                        className="bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400 h-full transition-all duration-75"
                        style={{ width: `${swipeTimer}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Needle Healing Minigame */}
              {showNeedleMinigame && (
                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-3 animate-fade-in">
                  <div className="bg-slate-900 border-2 border-red-500/90 rounded-2xl p-3.5 w-full max-w-[260px] flex flex-col items-center text-center shadow-2xl">
                    <span className="font-pixel text-[7.5px] text-red-400 flex items-center gap-1 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/50 mb-1.5">
                      <AlertTriangle size={11} /> CRITICAL HEALTH ALERT!
                    </span>
                    <p className="text-[11px] text-pink-100 font-semibold mb-1.5">
                      Stop the needle in the green zone to heal!
                    </p>

                    <div className="relative w-11 h-40 bg-slate-950 border-2 border-slate-700 rounded-full overflow-hidden my-1 flex items-center justify-center shadow-inner">
                      <div className="absolute top-[30%] h-[40%] w-full bg-emerald-500/35 border-y-2 border-emerald-400 flex items-center justify-center">
                        <span className="font-pixel text-[7px] text-emerald-300">HEAL</span>
                      </div>

                      <div 
                        className="absolute left-0.5 right-0.5 h-3 bg-rose-500 border border-white rounded-full shadow-lg shadow-rose-500/80 transition-none"
                        style={{ top: `${needlePos}%` }}
                      />
                    </div>

                    <button
                      onClick={handleStopNeedle}
                      className="w-full mt-2 font-pixel text-[8.5px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-2 rounded-xl shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                    >
                      STOP NEEDLE! 🎯
                    </button>
                  </div>
                </div>
              )}

              {/* Trivia Modal */}
              {showTriviaModal && (
                <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
                  <div className="bg-slate-900 border-2 border-pink-500 rounded-2xl p-4 w-full max-w-[290px] text-center shadow-2xl">
                    <div className="font-pixel text-[7.5px] text-pink-400 bg-pink-950/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 border border-pink-600/50">
                      <Sparkles size={10} className="text-yellow-300" /> RAY'S LOVE TRIVIA
                    </div>
                    <h3 className="text-xs font-bold text-pink-100 mb-1 leading-snug">
                      {triviaQuestions[currentTriviaIndex].q}
                    </h3>
                    <p className="text-[9.5px] text-pink-300/80 mb-2.5">Answer correctly to heal +50 HP!</p>

                    <div className="grid grid-cols-1 gap-1.5">
                      {triviaQuestions[currentTriviaIndex].options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTriviaAnswer(opt)}
                          className="w-full bg-purple-950/70 hover:bg-pink-600 border border-purple-700/70 hover:border-pink-400 py-2 px-2.5 rounded-xl text-[11px] text-white font-semibold active:scale-95 transition-all text-left flex items-center justify-between"
                        >
                          <span>{opt}</span>
                          <span className="font-pixel text-[7px] text-pink-300/60">[{idx + 1}]</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {attackWarning && (
              <div className="absolute top-12 left-2 right-2 z-30 bg-red-600/95 text-white font-pixel text-[7px] leading-tight px-2.5 py-1.5 rounded-lg border border-red-300 flex items-center justify-center gap-1.5 text-center shadow-2xl animate-bounce">
                <AlertTriangle size={12} className="shrink-0 text-yellow-300" />
                <span>{attackWarning}</span>
              </div>
            )}

            {/* Bottom Tactical Deck */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-black border-t-2 border-slate-700 p-2.5 flex flex-col justify-between shrink-0 gap-1.5">
              <div className="bg-black/80 border border-slate-800 rounded-lg p-1.5 min-h-[34px] flex items-center justify-center text-center">
                <p className="text-[10.5px] text-pink-100 font-semibold leading-snug">
                  {battleLog}
                </p>
              </div>

              {/* Synergy Meter */}
              <div className="flex items-center gap-1.5 px-0.5">
                <span className="font-pixel text-[7px] text-amber-300 flex items-center gap-0.5">
                  <Zap size={9} /> SYNERGY:
                </span>
                <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-300"
                    style={{ width: `${synergy}%` }}
                  />
                </div>
                <button
                  disabled={synergy < 100 || isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showParryModal || showFatalCircle || showDodgeModal}
                  onClick={executeUltimate}
                  className={`font-pixel text-[7px] px-2 py-0.5 rounded transition-all ${
                    synergy >= 100 
                      ? 'bg-amber-400 text-slate-950 font-bold animate-bounce shadow-lg shadow-amber-400/50 cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                  }`}
                >
                  ULTIMATE!
                </button>
              </div>

              {/* 4-Button Action Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showParryModal || showFatalCircle || showDodgeModal}
                  onClick={() => initiateAttack('comm')}
                  className={`py-2 px-2 rounded-xl flex items-center justify-start gap-1.5 active:scale-95 transition-all shadow-md text-left ${
                    currentWeakness === 'comm' ? 'bg-pink-600 ring-2 ring-yellow-300 animate-pulse' : 'bg-pink-800/80 hover:bg-pink-700'
                  }`}
                >
                  <span className="text-base">💌</span>
                  <div>
                    <div className="font-pixel text-[7px]">COMMUNICATE</div>
                    <div className="text-[9px] text-pink-200/80">{currentWeakness === 'comm' ? '★ WEAKNESS' : 'Power of Love'}</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showParryModal || showFatalCircle || showDodgeModal}
                  onClick={() => initiateAttack('food')}
                  className={`py-2 px-2 rounded-xl flex items-center justify-start gap-1.5 active:scale-95 transition-all shadow-md text-left ${
                    currentWeakness === 'food' ? 'bg-emerald-600 ring-2 ring-yellow-300 animate-pulse' : 'bg-emerald-800/80 hover:bg-emerald-700'
                  }`}
                >
                  <span className="text-base">🍔</span>
                  <div>
                    <div className="font-pixel text-[7px]">BURGER & TEA</div>
                    <div className="text-[9px] text-emerald-200/80">{currentWeakness === 'food' ? '★ WEAKNESS' : 'Snack Attack'}</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showParryModal || showFatalCircle || showDodgeModal}
                  onClick={() => initiateAttack('hug')}
                  className={`py-2 px-2 rounded-xl flex items-center justify-start gap-1.5 active:scale-95 transition-all shadow-md text-left ${
                    currentWeakness === 'hug' ? 'bg-purple-600 ring-2 ring-yellow-300 animate-pulse' : 'bg-purple-800/80 hover:bg-purple-700'
                  }`}
                >
                  <span className="text-base">🫂</span>
                  <div>
                    <div className="font-pixel text-[7px]">WARM HUG</div>
                    <div className="text-[9px] text-purple-200/80">{currentWeakness === 'hug' ? '★ WEAKNESS' : 'Reassurance'}</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showParryModal || showFatalCircle || showDodgeModal}
                  onClick={executeHeal}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 py-2 px-2 rounded-xl flex items-center justify-start gap-1.5 active:scale-95 transition-all shadow-md shadow-sky-600/30 text-left"
                >
                  <span className="text-base">🧋</span>
                  <div>
                    <div className="font-pixel text-[7px]">WARM MILK TEA</div>
                    <div className="text-[9px] text-sky-200/80">+35 Team HP</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= SCREEN 4: ROMANTIC SUNSET CUTSCENE ================= */}
        {gameState === 'cutscene' && (
          <div className="w-full h-full flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-orange-500 to-amber-300 animate-fade-in">
            <div className="relative flex-1 w-full overflow-hidden">
              <canvas
                ref={cutsceneCanvasRef}
                width={160}
                height={240}
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />

              <div className="absolute top-3 left-3 right-3 flex justify-center">
                <span className="font-pixel text-[8px] text-amber-900 bg-yellow-200/90 border border-amber-400 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-bounce">
                  <Sun size={12} className="text-orange-500" /> THE DARKNESS HAS CLEARED!
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent p-4 text-center shrink-0 border-t border-amber-400/40">
              {cutsceneDialogueIndex === 1 && (
                <div className="space-y-2 animate-fade-in">
                  <div className="bg-sky-950/80 border border-sky-400/60 rounded-xl p-3 shadow-lg max-w-[320px] mx-auto">
                    <span className="font-pixel text-[8px] text-sky-300 block mb-1">RAY PAKPAHAN:</span>
                    <p className="text-xs text-white font-medium italic">
                      "Happy 4th Anniversary, babe! We beat every single challenge together! ❤️"
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      initAudio();
                      playSound(650, 'sine', 0.08);
                      setCutsceneDialogueIndex(2);
                    }}
                    className="w-full font-pixel text-[9.5px] bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    CONTINUE ➔
                  </button>
                </div>
              )}

              {cutsceneDialogueIndex === 2 && (
                <div className="space-y-2 animate-fade-in">
                  <div className="bg-pink-950/80 border border-pink-400/60 rounded-xl p-3 shadow-lg max-w-[320px] mx-auto">
                    <span className="font-pixel text-[8px] text-pink-300 block mb-1">CHARISSE:</span>
                    <p className="text-xs text-white font-medium italic">
                      "I love you so much, babe! Forever and always! 🥰✨"
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      initAudio();
                      playSound(800, 'sine', 0.15);
                      setCutsceneCharsFaded(true);
                      setTimeout(() => {
                        setGameState('victory');
                      }, 1800);
                    }}
                    className="w-full font-pixel text-[9.5px] bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    WALK TOGETHER INTO THE SUNSET 🌅
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SCREEN 5: GAME OVER (DEAD-CENTERED FIX) ================= */}
        {gameState === 'gameover' && (
          <div className="w-full h-full flex flex-col items-center justify-center my-auto p-4 text-center bg-black/95 animate-fade-in gap-3.5">
            <Skull size={44} className="text-red-500 animate-bounce" />
            <div>
              <h2 className="font-pixel text-base text-red-500 tracking-wider">OVERWHELMED BY DARKNESS</h2>
              <p className="text-[11px] text-slate-400 mt-1.5 max-w-[250px] leading-relaxed">
                The storm broke your defense! Watch the monster's current craving and time your Parries and Dodges!
              </p>
            </div>

            <div className="w-full max-w-[260px] flex flex-col gap-2 mt-2">
              <button
                onClick={() => resetCampaign(false)}
                className="w-full font-pixel text-[10px] bg-red-600 hover:bg-red-500 py-3 px-4 rounded-xl shadow-lg shadow-red-600/40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={13} /> TRY AGAIN RIGHT AWAY
              </button>

              <button
                onClick={() => resetCampaign(true)}
                className="w-full font-pixel text-[8.5px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <HelpCircle size={13} /> MAIN MENU
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 6: FINAL VICTORY & PRESERVED LETTERS ================= */}
        {gameState === 'victory' && (
          <div className="w-full h-full flex flex-col items-center justify-between p-3.5 text-center overflow-y-auto">
            <div className="w-full flex flex-col items-center pt-0.5">
              <span className="font-pixel text-[8px] text-yellow-300 bg-yellow-950/70 border border-yellow-600/60 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-md animate-bounce">
                <Trophy size={11} /> 5 TRIALS CLEARED!
              </span>
              <h2 className="font-pixel text-xs text-pink-200 mt-1.5">HAPPY 4-MONTH ANNIVERSARY ✨</h2>
              <p className="text-[10px] text-pink-300/80 mt-0.5">Dating Since May 9, 2026 • True Love Triumphs!</p>
            </div>

            {/* Preserved Love Note Cards */}
            <div 
              onClick={() => {
                initAudio();
                playSound(600, 'sine', 0.05);
                setActivePolaroid((prev) => (prev + 1) % polaroids.length);
              }}
              className="bg-white p-2.5 pb-3 rounded-xl text-slate-800 shadow-2xl max-w-[270px] w-full my-1 transform hover:rotate-1 transition-all cursor-pointer border border-slate-200"
            >
              <div className="w-full h-32 bg-pink-100 rounded-lg flex flex-col items-center justify-center p-2.5 border border-slate-200 text-center">
                <span className="text-3xl mb-1">{polaroids[activePolaroid].emoji}</span>
                <p className="text-[10.5px] text-slate-700 font-semibold italic leading-relaxed">
                  "{polaroids[activePolaroid].note}"
                </p>
              </div>
              <div className="flex justify-between items-center mt-1.5 px-0.5">
                <span className="text-[10.5px] font-bold text-slate-800 truncate mr-2">{polaroids[activePolaroid].caption}</span>
                <span className="text-[8.5px] text-slate-400 font-pixel shrink-0">[{activePolaroid + 1}/3] ➔</span>
              </div>
            </div>

            {/* Preserved Commemorative Victory Scroll */}
            <div className="w-full max-w-[290px] bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 border-2 border-pink-500/80 rounded-2xl p-2.5 text-center relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between text-yellow-300 font-pixel text-[7.5px] mb-1 border-b border-pink-500/30 pb-1">
                <span className="flex items-center gap-1"><Award size={10} /> 123 DAYS OF LOVE</span>
                <span>SINCE MAY 9, 2026</span>
              </div>

              <div className="flex items-center justify-center gap-1 my-0.5 text-rose-400">
                <Heart size={14} fill="#f43f5e" />
                <span className="font-pixel text-[8px] text-pink-200">OFFICIAL LOVE SCROLL</span>
                <Heart size={14} fill="#f43f5e" />
              </div>

              <p className="text-[10.5px] text-slate-200 font-medium leading-relaxed px-1 mt-0.5">
                Through thunder, void storms, and fears, nothing could ever dim our love. Thank you for being my favorite person, best gamer, and dream partner. Here's to forever together!
              </p>

              <div className="mt-1.5 font-pixel text-[8px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/60 py-1 px-1.5 rounded-lg">
                💖 I LOVE YOU FOREVER, CHARISSE! 💖
              </div>
            </div>

            <button
              onClick={() => resetCampaign(false)}
              className="text-[9.5px] text-pink-300/70 hover:text-white flex items-center gap-1 py-0.5 mt-0.5"
            >
              <RefreshCw size={11} /> Play Full Quest Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}