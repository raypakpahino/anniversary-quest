import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, Sparkles, HelpCircle, X, ArrowRight, 
  ShieldCheck, Zap, RefreshCw, Award, AlertTriangle, 
  Skull, HeartPulse, Volume2, VolumeX, Heart, ArrowLeft, ArrowUp, ArrowDown,
  Sun, Shield, Wind, Sparkle, Flame, BookOpen, Swords, Crosshair
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState('landing');
  const [isMuted, setIsMuted] = useState(false);
  
  // Progressive Combat Scaling
  const [phase, setPhase] = useState(1);
  const [bossHp, setBossHp] = useState(100);
  const [bossMaxHp, setBossMaxHp] = useState(100);
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

  // Attack QTE
  const [qteStep, setQteStep] = useState(null);
  const [qteScale, setQteScale] = useState(2.3);
  const [mashCount, setMashCount] = useState(0);
  const [mashTimer, setMashTimer] = useState(100);
  const [requiredSwipe, setRequiredSwipe] = useState('LEFT');
  const [swipeTimer, setSwipeTimer] = useState(100);
  const [touchStartPos, setTouchStartPos] = useState(null);

  // Non-modal In-world Quick Defense Triggers
  const [quickDefense, setQuickDefense] = useState(null); // { type: 'parry'|'dodge'|'slide', posX, posY, timer }
  const [slideProgress, setSlideProgress] = useState(0);
  const [slideStartX, setSlideStartX] = useState(null);

  const [pendingAction, setPendingAction] = useState(null);

  // Redesigned Starlight Capsule Healing
  const [showCapsuleHeal, setShowCapsuleHeal] = useState(false);
  const [capsuleCharge, setCapsuleCharge] = useState(0);
  const [showTriviaModal, setShowTriviaModal] = useState(false);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);

  // VFX
  const [screenShake, setScreenShake] = useState(false);
  const [bossFlash, setBossFlash] = useState(false);
  const [activePolaroid, setActivePolaroid] = useState(0);

  // Animation Engine
  const animRef = useRef({
    p1: { x: 22, y: 138, scale: 1, rotation: 0, trail: [] },
    p2: { x: 64, y: 152, scale: 1, rotation: 0, trail: [] },
    boss: { x: 96, y: 34, scale: 1, squashY: 1, recoilX: 0, recoilY: 0 },
    slashEffects: [], // { type, x, y, frame, maxFrames }
    impactWaves: [],  // { x, y, radius, color, life }
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
  const defenseIntervalRef = useRef(null);

  const bosses = [
    {
      name: "EGO MONSTER",
      title: "STAGE 1: THE EGO MONSTER",
      baseWeakness: "comm",
      maxHp: 100,
      damage: 16,
      defaultHint: "Honest communication melts his stubborn pride!"
    },
    {
      name: "HANGRY GOBLIN",
      title: "STAGE 2: THE HANGRY GOBLIN",
      baseWeakness: "food",
      maxHp: 140,
      damage: 22,
      defaultHint: "Feed him delicious treats and sweet milk tea!"
    },
    {
      name: "OVERTHINK PHANTOM",
      title: "STAGE 3: OVERTHINK PHANTOM",
      baseWeakness: "hug",
      maxHp: 180,
      damage: 28,
      defaultHint: "Warm hugs and pure reassurance calm the spiral!"
    },
    {
      name: "DREAD DEVOURER",
      title: "STAGE 4: DREAD DEVOURER",
      baseWeakness: "comm",
      maxHp: 230,
      damage: 34,
      defaultHint: "Unbreakable trust and love conquer fear!"
    },
    {
      name: "ABYSS VOID TITAN ⚡",
      title: "FINAL STAGE: ABYSS VOID TITAN",
      baseWeakness: "hug",
      maxHp: 300,
      damage: 42,
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
    setBossMaxHp(currentBoss.maxHp);
    setBossHp(currentBoss.maxHp);
    setCurrentWeakness(currentBoss.baseWeakness);
    setIsSurpriseWeakness(false);
  }, [phase]);

  useEffect(() => {
    const drops = [];
    for (let i = 0; i < 75; i++) {
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
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(ramp, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // Audio safety
    }
  };

  const playHeavySlash = () => {
    if (isMuted) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {}
  };

  const playParryDeflect = () => {
    if (isMuted) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const playThunderSound = () => {
    if (isMuted) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.9);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.95);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.95);
    } catch {}
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
      osc1.frequency.setValueAtTime(160, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.75);
      osc2.frequency.setValueAtTime(320, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(1250, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.38, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch {}
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
      tempo = 110;
      waveType = 'sawtooth';
    } else if (phase >= 3) {
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
    animRef.current.floatingTexts.push({ text, x, y, color, life: 45 });
  };

  const triggerSlashVFX = (type, x, y) => {
    playHeavySlash();
    animRef.current.slashEffects.push({ type, x, y, frame: 0, maxFrames: 14 });
    animRef.current.impactWaves.push({ x, y, radius: 4, color: type === 'cerce' ? '#f472b6' : '#38bdf8', life: 12 });
  };

  // Kinematic Motion System
  const animateCharisseCharge = (callback) => {
    const originX = 22;
    const originY = 138;
    const targetX = 92;
    const targetY = 48;
    const startTime = Date.now();
    const duration = 340;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);

      if (t < 0.5) {
        const p = t / 0.5;
        animRef.current.p1.x = originX + (targetX - originX) * p;
        animRef.current.p1.y = originY + (targetY - originY) * p;
        animRef.current.p1.scale = 1.15;
      } else if (t < 0.7) {
        animRef.current.p1.x = targetX + Math.sin(t * 30) * 4;
        animRef.current.p1.y = targetY;
        animRef.current.boss.recoilX = 8;
        animRef.current.boss.recoilY = -4;
      } else {
        const p = (t - 0.7) / 0.3;
        animRef.current.p1.x = targetX + (originX - targetX) * p;
        animRef.current.p1.y = targetY + (originY - targetY) * p;
        animRef.current.boss.recoilX *= 0.7;
        animRef.current.boss.recoilY *= 0.7;
      }

      if (t >= 1) {
        clearInterval(interval);
        animRef.current.p1.x = originX;
        animRef.current.p1.y = originY;
        animRef.current.p1.scale = 1;
        animRef.current.boss.recoilX = 0;
        animRef.current.boss.recoilY = 0;
        if (callback) callback();
      }
    }, 16);
  };

  const animateRayCrossCharge = (callback) => {
    const originX = 64;
    const originY = 152;
    const targetX = 98;
    const targetY = 52;
    const startTime = Date.now();
    const duration = 340;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);

      if (t < 0.5) {
        const p = t / 0.5;
        animRef.current.p2.x = originX + (targetX - originX) * p;
        animRef.current.p2.y = originY + (targetY - originY) * p;
        animRef.current.p2.scale = 1.2;
      } else if (t < 0.7) {
        animRef.current.p2.x = targetX;
        animRef.current.p2.y = targetY;
        animRef.current.boss.recoilX = -6;
        animRef.current.boss.recoilY = -6;
      } else {
        const p = (t - 0.7) / 0.3;
        animRef.current.p2.x = targetX + (originX - targetX) * p;
        animRef.current.p2.y = targetY + (originY - targetY) * p;
        animRef.current.boss.recoilX *= 0.7;
        animRef.current.boss.recoilY *= 0.7;
      }

      if (t >= 1) {
        clearInterval(interval);
        animRef.current.p2.x = originX;
        animRef.current.p2.y = originY;
        animRef.current.p2.scale = 1;
        animRef.current.boss.recoilX = 0;
        animRef.current.boss.recoilY = 0;
        if (callback) callback();
      }
    }, 16);
  };

  const animateBossLungeAttack = (callback) => {
    const originX = 96;
    const originY = 34;
    const targetX = 38;
    const targetY = 120;
    const startTime = Date.now();
    const duration = 480;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);

      if (t < 0.4) {
        const p = t / 0.4;
        animRef.current.boss.x = originX + (targetX - originX) * p;
        animRef.current.boss.y = originY + (targetY - originY) * p;
        animRef.current.boss.squashY = 1.25;
      } else if (t < 0.6) {
        animRef.current.boss.x = targetX;
        animRef.current.boss.y = targetY;
        animRef.current.p1.x = 18;
        animRef.current.p2.x = 60;
      } else {
        const p = (t - 0.6) / 0.4;
        animRef.current.boss.x = targetX + (originX - targetX) * p;
        animRef.current.boss.y = targetY + (originY - targetY) * p;
        animRef.current.boss.squashY = 1;
      }

      if (t >= 1) {
        clearInterval(interval);
        animRef.current.boss.x = originX;
        animRef.current.boss.y = originY;
        animRef.current.p1.x = 22;
        animRef.current.p2.x = 64;
        if (callback) callback();
      }
    }, 16);
  };

  // In-World Quick Defenses (Parry button / Slide Evade)
  const spawnQuickDefense = (type) => {
    setIsTurnLocked(true);
    const randomPositions = [
      { x: 'right-3 bottom-28' },
      { x: 'left-3 bottom-28' },
      { x: 'right-3 top-36' }
    ];
    const pos = randomPositions[Math.floor(Math.random() * randomPositions.length)].x;
    setQuickDefense({ type, pos, progress: 100 });
    setSlideProgress(0);
    setSlideStartX(null);

    const startTime = Date.now();
    const duration = type === 'parry' ? 1400 : 1800;

    if (defenseIntervalRef.current) clearInterval(defenseIntervalRef.current);

    defenseIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setQuickDefense(prev => prev ? { ...prev, progress: remaining } : null);

      if (remaining <= 0) {
        clearInterval(defenseIntervalRef.current);
        setQuickDefense(null);
        handleDefenseMissed(type);
      }
    }, 20);
  };

  const handleDefenseSuccess = (type) => {
    if (defenseIntervalRef.current) clearInterval(defenseIntervalRef.current);
    setQuickDefense(null);

    if (type === 'parry') {
      playParryDeflect();
      setBossFlash(true);
      setScreenShake(true);
      triggerSlashVFX('dual', 100, 50);
      setTimeout(() => { setBossFlash(false); setScreenShake(false); }, 250);
      addFloatingText("IN-WORLD PARRY! 🛡️", 30, 120, '#38bdf8');
      setBattleLog("⚡ REFLEX PARRY! Staggered the boss and absorbed +40 Synergy!");
      setSynergy(prev => Math.min(100, prev + 40));
    } else {
      playSound(820, 'sine', 0.15);
      addFloatingText("EVADED! 💨", 30, 120, '#34d399');
      setBattleLog("💨 SLIDE DODGE! Charisse & Ray slid under the lethal blow!");
    }
    setIsTurnLocked(false);
  };

  const handleDefenseMissed = (type) => {
    playSound(140, 'sawtooth', 0.3);
    const dmg = type === 'parry' ? 30 : 25;
    const remainingHp = Math.max(0, playerHp - dmg);
    setPlayerHp(remainingHp);
    addFloatingText(`-${dmg} HP!`, 30, 120, '#ef4444');
    setBattleLog(`⚠️ Missed the ${type.toUpperCase()}! Struck by monster!`);

    if (remainingHp <= 0) {
      setTimeout(() => setGameState('gameover'), 600);
    } else {
      setIsTurnLocked(false);
    }
  };

  // Interactive Starlight Capsule Healing
  const openCapsuleHeal = () => {
    setIsTurnLocked(true);
    setShowCapsuleHeal(true);
    setCapsuleCharge(0);
    playSound(520, 'sine', 0.15);
  };

  const handlePumpCapsule = () => {
    const nextCharge = capsuleCharge + 25;
    playSound(400 + nextCharge * 5, 'triangle', 0.08);
    setCapsuleCharge(nextCharge);

    if (nextCharge >= 100) {
      setShowCapsuleHeal(false);
      playSound(880, 'sine', 0.25);
      confetti({ particleCount: 50, spread: 60 });
      setCurrentTriviaIndex(Math.floor(Math.random() * triviaQuestions.length));
      setShowTriviaModal(true);
    }
  };

  const handleTriviaAnswer = (selectedOption) => {
    const trivia = triviaQuestions[currentTriviaIndex];
    setShowTriviaModal(false);

    if (selectedOption === trivia.answer) {
      playSound(780, 'triangle', 0.3);
      confetti({ particleCount: 70, spread: 60 });
      const restored = Math.min(100, playerHp + 55);
      setPlayerHp(restored);
      addFloatingText("+55 HP RESTORED!", 30, 130, '#ec4899');
      setBattleLog("💖 Ray's love restored energy! Team back to full strength!");
    } else {
      playSound(160, 'sawtooth', 0.25);
      addFloatingText("MISSED QUIZ!", 30, 130, '#ef4444');
      setBattleLog("❌ Close! Determined to keep going without healing!");
    }
    setIsTurnLocked(false);
  };

  // Turn Execution System
  const initiateAttack = (actionKey) => {
    if (isTurnLocked || qteStep || showTriviaModal || showCapsuleHeal || quickDefense) return;
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
    const duration = 2200;

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
        handleQTEFailed(`TIME OUT ON ${direction} SWIPE!`);
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
    const bX = 100;
    const bY = 48;

    if (currentDir === 'LEFT') {
      animateCharisseCharge(() => {
        triggerSlashVFX('cerce', bX, bY);
        setBossFlash(true);
        setTimeout(() => setBossFlash(false), 120);
        addFloatingText("CERIS STARLIGHT LUNGE! 🌙", 20, 120, '#f472b6');
        setBattleLog("⚔️ Cerce dashes right up to the monster and slashes!");
        setTimeout(() => startDirectionalSwipe('RIGHT'), 200);
      });
    } else if (currentDir === 'RIGHT') {
      animateRayCrossCharge(() => {
        triggerSlashVFX('ray', bX + 4, bY);
        setBossFlash(true);
        setTimeout(() => setBossFlash(false), 120);
        addFloatingText("RAY CROSS-BLADE CHARGE! ⚡", 20, 120, '#38bdf8');
        setBattleLog("⚡ Ray lunges forward with a piercing cross-slash!");
        setTimeout(() => startDirectionalSwipe('UP_OR_DOWN'), 200);
      });
    } else if (currentDir === 'UP_OR_DOWN') {
      animateCharisseCharge(() => {});
      animateRayCrossCharge(() => {
        triggerSlashVFX('dual', bX, bY);
        addFloatingText("SYNCHRONIZED FINISHER! ✨", 20, 110, '#facc15');
        setBattleLog("🌟 Ray & Cerce deliver the combined starlight strike!");
        resolveTurn(pendingAction, true);
      });
    }
  };

  const handleQTEFailed = (reason) => {
    setQteStep(null);
    if (subQteTimerRef.current) clearInterval(subQteTimerRef.current);
    playSound(150, 'sawtooth', 0.25);
    addFloatingText("MISS!", 40, 140, '#94a3b8');
    setAttackWarning(`❌ ${reason}`);
    setBattleLog("Combo dropped! The monster prepares a heavy strike!");
    setIsTurnLocked(true);
    setTimeout(() => bossCounterAttack(true), 700);
  };

  const resolveTurn = (actionKey, isCrit) => {
    setIsTurnLocked(true);
    const isEffective = actionKey === currentWeakness;

    if (!isEffective) {
      playSound(200, 'sawtooth', 0.15);
      addFloatingText("SHIELD DEFLECTED!", 95, 35, '#94a3b8');
      setAttackWarning(`INEFFECTIVE! Currently weak to: ${currentWeakness.toUpperCase()}`);
      setBattleLog(`Blocked! Monster shielded against that attack!`);
      setTimeout(() => bossCounterAttack(false), 600);
      return;
    }

    setBossFlash(true);
    setScreenShake(true);
    setTimeout(() => { setBossFlash(false); setScreenShake(false); }, 350);

    const baseDmg = isCrit ? (phase === 5 ? 45 : 52) : 28;
    playSound(isCrit ? 700 : 500, 'triangle', 0.15);
    addFloatingText(isCrit ? `CRIT! -${baseDmg}` : `-${baseDmg}`, 95, 30, isCrit ? '#f43f5e' : '#facc15');

    const nextBossHp = Math.max(0, bossHp - baseDmg);
    setBossHp(nextBossHp);
    setSynergy(prev => Math.min(100, prev + (isCrit ? 35 : 22)));
    setBattleLog("💥 Massive strike shook the enemy!");

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

      setTimeout(() => bossCounterAttack(false), 850);
    }
  };

  const executeHeal = () => {
    if (isTurnLocked || qteStep || showTriviaModal || showCapsuleHeal || quickDefense) return;
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
    if (synergy < 100 || isTurnLocked || qteStep || showTriviaModal || showCapsuleHeal || quickDefense) return;
    setIsTurnLocked(true);
    setAttackWarning("");
    setSynergy(0);

    playSound(400, 'square', 0.1);
    setTimeout(() => playSound(600, 'square', 0.15), 100);
    setTimeout(() => playSound(800, 'triangle', 0.3), 200);

    animateCharisseCharge(() => {});
    animateRayCrossCharge(() => {
      setBossFlash(true);
      setScreenShake(true);
      triggerSlashVFX('dual', 100, 48);
      addFloatingText("DUO STRIKE! -75", 85, 25, '#ec4899');
      setTimeout(() => { setBossFlash(false); setScreenShake(false); }, 400);

      const nextBossHp = Math.max(0, bossHp - 75);
      setBossHp(nextBossHp);
      setBattleLog("🌟 DUO ULTIMATE: 'May 9th Starlight Strike' shatters all darkness!");

      if (nextBossHp <= 0) {
        setTimeout(() => advancePhase(), 800);
      } else {
        setTimeout(() => bossCounterAttack(false), 1000);
      }
    });
  };

  const bossCounterAttack = (isHeavyHit = false) => {
    playSound(140, 'sawtooth', 0.25);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);

    // Dynamic Kinematic Boss Movement
    animateBossLungeAttack(() => {
      // In-World Quick Defenses Spawn on Screen Directly!
      if (phase >= 4 && Math.random() < 0.6) {
        spawnQuickDefense('parry');
        return;
      }
      if (phase >= 3 && Math.random() < 0.55) {
        spawnQuickDefense('slide');
        return;
      }

      const damage = isHeavyHit ? currentBoss.damage + 8 : currentBoss.damage;
      const remainingHp = Math.max(0, playerHp - damage);
      setPlayerHp(remainingHp);
      addFloatingText(`-${damage} HP`, 35, 140, '#ef4444');

      if (remainingHp <= 0) {
        playSound(100, 'sawtooth', 0.5);
        setBattleLog("💀 Team HP hit 0! You were defeated...");
        setTimeout(() => setGameState('gameover'), 700);
      } else if (remainingHp <= 55) {
        openCapsuleHeal();
      } else {
        setBattleLog(`⚠️ ${currentBoss.name} struck back for -${damage} HP!`);
        setIsTurnLocked(false);
      }
    });
  };

  const advancePhase = () => {
    if (phase < 5) {
      const nextPhase = phase + 1;
      setPhase(nextPhase);
      setPlayerHp(p => Math.min(100, p + 35));
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
    setBossMaxHp(100);
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
    setShowCapsuleHeal(false);
    setShowTriviaModal(false);
    setQuickDefense(null);
    setAttackWarning("");
    setIsTurnLocked(false);

    if (toMainMenu) {
      setGameState('landing');
    } else {
      setGameState('battle');
      setBattleLog("Stage 1: The Stubborn Ego Monster appears!");
    }
  };

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

        {/* ================= SCREEN 1: TITLE SCREEN ================= */}
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
                  123 Days of Love • 5 Scaled Trials
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
              <button onClick={() => setGameState('landing')} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200 my-auto py-3 leading-relaxed">
              <div className="bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/60">
                <p className="font-bold text-pink-300 text-[11px] mb-0.5">⚔️ DYNAMIC ATTACK CHARGES</p>
                <p className="text-[11px]">Cerce rushes up with crescent slashes and Ray lunges with dual thunder blades!</p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                <p>⚡ <b>In-World Quick Parry:</b> Sudden reflex shield icon pops on the arena—tap it immediately!</p>
                <p>💨 <b>Slide Evade:</b> Slide the glowing evasion bar right to duck under heavy claw sweeps!</p>
                <p>💊 <b>Starlight Capsule Heal:</b> Pump the charging vial to restore full team health via trivia!</p>
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
                  onClick={() => { initAudio(); setIsMuted(!isMuted); }}
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
                  <span className="text-[7px] text-slate-300">{bossHp}/{bossMaxHp}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
                    style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
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

              {/* IN-WORLD SUDDEN DEFENSE TRIGGER: QUICK PARRY BUTTON */}
              {quickDefense && quickDefense.type === 'parry' && (
                <div className={`absolute ${quickDefense.pos} z-50 animate-bounce`}>
                  <button
                    onClick={() => handleDefenseSuccess('parry')}
                    className="relative w-16 h-16 rounded-full bg-cyan-500 border-4 border-white shadow-[0_0_20px_#22d3ee] flex flex-col items-center justify-center text-slate-950 font-pixel text-[8px] active:scale-90 transition-transform"
                  >
                    <Shield size={20} className="animate-spin" />
                    <span>PARRY!</span>
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-yellow-300 pointer-events-none"
                      style={{ transform: `scale(${1 + (quickDefense.progress / 100) * 0.5})` }}
                    />
                  </button>
                </div>
              )}

              {/* IN-WORLD SUDDEN DEFENSE TRIGGER: SLIDE EVADE SECTION */}
              {quickDefense && quickDefense.type === 'slide' && (
                <div className="absolute bottom-20 left-6 right-6 z-50 bg-black/85 border-2 border-emerald-400 p-2.5 rounded-2xl shadow-[0_0_20px_#34d399] flex flex-col items-center animate-fade-in">
                  <div className="flex items-center justify-between w-full font-pixel text-[7.5px] text-emerald-300 mb-1">
                    <span className="flex items-center gap-1"><Wind size={11} /> SLIDE TO DODGE!</span>
                    <span>{Math.round(quickDefense.progress)}%</span>
                  </div>
                  <div 
                    onTouchStart={e => setSlideStartX(e.touches[0].clientX)}
                    onTouchMove={e => {
                      if (slideStartX === null) return;
                      const diff = e.touches[0].clientX - slideStartX;
                      if (diff > 0) {
                        const prog = Math.min(100, (diff / 160) * 100);
                        setSlideProgress(prog);
                        if (prog >= 95) handleDefenseSuccess('slide');
                      }
                    }}
                    onMouseDown={e => setSlideStartX(e.clientX)}
                    onMouseMove={e => {
                      if (slideStartX === null) return;
                      const diff = e.clientX - slideStartX;
                      if (diff > 0) {
                        const prog = Math.min(100, (diff / 160) * 100);
                        setSlideProgress(prog);
                        if (prog >= 95) handleDefenseSuccess('slide');
                      }
                    }}
                    onMouseUp={() => setSlideStartX(null)}
                    className="relative w-full h-8 bg-slate-900 border border-slate-700 rounded-full overflow-hidden flex items-center px-1 cursor-grab"
                  >
                    <div 
                      className="h-full bg-emerald-500/40 rounded-full transition-all"
                      style={{ width: `${slideProgress}%` }}
                    />
                    <div 
                      className="absolute w-7 h-7 rounded-full bg-emerald-400 border border-white flex items-center justify-center text-slate-950 font-bold shadow-md transition-none"
                      style={{ left: `calc(${slideProgress}% * 0.75 + 4px)` }}
                    >
                      ➔
                    </div>
                  </div>
                </div>
              )}

              {/* STARLIGHT CAPSULE CHARGING HEAL */}
              {showCapsuleHeal && (
                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
                  <div className="bg-slate-950 border-2 border-pink-500 rounded-2xl p-4 flex flex-col items-center max-w-[280px] w-full text-center shadow-[0_0_25px_rgba(244,114,182,0.7)]">
                    <span className="font-pixel text-[8px] text-pink-300 bg-pink-950 border border-pink-700 px-2.5 py-0.5 rounded-full mb-1 flex items-center gap-1">
                      <Sparkles size={11} className="text-yellow-300 animate-spin" /> STARLIGHT CAPSULE!
                    </span>
                    <p className="text-xs text-white font-bold mb-2">
                      Tap rapidly to pump love energy!
                    </p>

                    <div className="relative w-16 h-36 bg-slate-900 border-2 border-pink-400 rounded-full overflow-hidden my-2 flex items-center justify-center p-1 shadow-inner">
                      <div 
                        className="absolute bottom-1 left-1 right-1 bg-gradient-to-t from-pink-600 via-rose-500 to-amber-300 rounded-full transition-all duration-100"
                        style={{ height: `${capsuleCharge}%` }}
                      />
                      <span className="relative z-10 font-pixel text-xs text-white drop-shadow">
                        {capsuleCharge}%
                      </span>
                    </div>

                    <button
                      onClick={handlePumpCapsule}
                      className="w-full mt-2 font-pixel text-[10px] bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-slate-950 font-bold py-3 rounded-xl shadow-lg active:scale-90 transition-all tracking-wider"
                    >
                      PUMP CAPSULE! 💊
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
                      style={{ width: '48px', height: '48px', transform: `scale(${qteScale})` }}
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
                      <div className="bg-amber-400 h-full transition-all duration-75" style={{ width: `${mashTimer}%` }} />
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
                      {requiredSwipe === 'LEFT' ? '1/3: Cerce Starlight Crescent' : requiredSwipe === 'RIGHT' ? '2/3: Ray Thunder Cross-Slash' : '3/3: Synchronized Starlight Burst!'}
                    </p>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                      <div className="bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400 h-full transition-all duration-75" style={{ width: `${swipeTimer}%` }} />
                    </div>
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
                    <p className="text-[9.5px] text-pink-300/80 mb-2.5">Answer correctly to heal +55 HP!</p>

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
                  disabled={synergy < 100 || isTurnLocked || qteStep || showTriviaModal || showCapsuleHeal || quickDefense}
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

              {/* 4-Button Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  disabled={isTurnLocked || qteStep || showTriviaModal || showCapsuleHeal || quickDefense}
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
                  disabled={isTurnLocked || qteStep || showTriviaModal || showCapsuleHeal || quickDefense}
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
                  disabled={isTurnLocked || qteStep || showTriviaModal || showCapsuleHeal || quickDefense}
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
                  disabled={isTurnLocked || qteStep || showTriviaModal || showCapsuleHeal || quickDefense}
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
                The storm broke your defense! Watch for the sudden in-world Parry icons and slide evades!
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
                setActivePolaroid(prev => (prev + 1) % polaroids.length);
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