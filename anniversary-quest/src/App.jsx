import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, Sparkles, HelpCircle, X, ArrowRight, 
  ShieldCheck, Zap, RefreshCw, Award, AlertTriangle, 
  Skull, HeartPulse, Volume2, VolumeX, Heart, ArrowLeft, ArrowUp, ArrowDown,
  Flame, Sun, CheckCircle2
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState('landing'); // 'landing' | 'battle' | 'clearing_cutscene' | 'victory' | 'gameover'
  const [showInstructions, setShowInstructions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Combat System (Now 5 Epic Stages)
  const [phase, setPhase] = useState(1);
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [synergy, setSynergy] = useState(0);
  const [dynamicWeakness, setDynamicWeakness] = useState('comm');
  const [battleLog, setBattleLog] = useState("Stage 1: The Stubborn Ego Monster appears!");
  const [isTurnLocked, setIsTurnLocked] = useState(false);
  const [attackWarning, setAttackWarning] = useState("");

  // Intros & Cutscenes
  const [bossIntro, setBossIntro] = useState(false);
  const [jumpscareActive, setJumpscareActive] = useState(false);
  const [cutsceneStep, setCutsceneStep] = useState(0);

  // QTE States
  const [qteStep, setQteStep] = useState(null); // 'timed' | 'mash' | 'swipe' | null
  const [qteScale, setQteScale] = useState(2.3);
  const [mashCount, setMashCount] = useState(0);
  const [mashTimer, setMashTimer] = useState(100);

  // Injustice-Style Directional Swipe Chain
  const [requiredSwipe, setRequiredSwipe] = useState('LEFT');
  const [swipeTimer, setSwipeTimer] = useState(100);
  const [touchStartPos, setTouchStartPos] = useState(null);

  // Balanced Friday the 13th Fatal Wheel (Stage 4)
  const [showFatalCircle, setShowFatalCircle] = useState(false);
  const [circleAngle, setCircleAngle] = useState(0);
  const [circleTargetAngle, setCircleTargetAngle] = useState(180);

  // Stage 5 Dual-Zone Parrying Mechanic
  const [showDualParry, setShowDualParry] = useState(false);
  const [parryPos, setParryPos] = useState(50);

  const [pendingAction, setPendingAction] = useState(null);

  // Recovery Needle & Trivia States
  const [showNeedleMinigame, setShowNeedleMinigame] = useState(false);
  const [needlePos, setNeedlePos] = useState(50);
  const [showTriviaModal, setShowTriviaModal] = useState(false);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);

  // VFX
  const [screenShake, setScreenShake] = useState(false);
  const [bossFlash, setBossFlash] = useState(false);
  const [activePolaroid, setActivePolaroid] = useState(0);

  // Animation Positions, Lightning & Weather
  const animRef = useRef({
    p1Offset: { x: 0, y: 0 },
    p2Offset: { x: 0, y: 0 },
    bossOffset: { x: 0, y: 0 },
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
  const needleAnimRef = useRef(null);
  const circleAnimRef = useRef(null);
  const circleAngleRef = useRef(0);
  const parryAnimRef = useRef(null);

  const bosses = [
    {
      name: "EGO MONSTER",
      title: "STAGE 1: THE EGO MONSTER",
      desc: "Shifts between Pride & Stubbornness"
    },
    {
      name: "HANGRY GOBLIN",
      title: "STAGE 2: THE HANGRY GOBLIN",
      desc: "Craves delicious food or warm hugs"
    },
    {
      name: "OVERTHINK PHANTOM",
      title: "STAGE 3: OVERTHINK PHANTOM",
      desc: "Spiral of doubt calmed by reassurance"
    },
    {
      name: "DREAD DEVOURER",
      title: "STAGE 4: DREAD DEVOURER",
      desc: "Fear beast that tests your instincts"
    },
    {
      name: "ABYSS VOID TITAN ⚡",
      title: "FINAL STAGE: THE APOCALYPSE TITAN",
      desc: "Ultimate darkness threatening the bond"
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

  // Set initial dynamic weakness per phase
  useEffect(() => {
    if (phase === 1) setDynamicWeakness('comm');
    if (phase === 2) setDynamicWeakness('food');
    if (phase === 3) setDynamicWeakness('hug');
    if (phase === 4) setDynamicWeakness('comm');
    if (phase === 5) setDynamicWeakness('hug');
  }, [phase]);

  // Rain and Petals initialization
  useEffect(() => {
    const drops = [];
    for (let i = 0; i < 70; i++) {
      drops.push({
        x: Math.random() * 160,
        y: Math.random() * 240,
        speed: 5 + Math.random() * 5,
        length: 8 + Math.random() * 6
      });
    }
    const petals = [];
    for (let i = 0; i < 40; i++) {
      petals.push({
        x: Math.random() * 160,
        y: Math.random() * 240,
        speedX: 0.5 - Math.random() * 1,
        speedY: 1 + Math.random() * 1.5,
        size: 2 + Math.random() * 2
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
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.9);
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
      osc1.frequency.setValueAtTime(140, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(850, ctx.currentTime + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.7);
      osc2.frequency.setValueAtTime(300, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.32, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.75);
      osc2.stop(ctx.currentTime + 0.75);
    } catch {
      // Audio safety
    }
  };

  const playFanfare = () => {
    if (isMuted) return;
    const notes = [261.6, 329.6, 392.0, 523.2, 659.2, 783.99, 1046.5];
    notes.forEach((n, i) => setTimeout(() => playSound(n, 'sine', 0.28), i * 90));
  };

  // Background Music Loop
  useEffect(() => {
    if (isMuted || gameState === 'landing' || gameState === 'gameover') {
      if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
      return;
    }

    const melodyBattle = [
      261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 261.63, 196.00,
      220.00, 261.63, 293.66, 329.63, 293.66, 261.63, 220.00, 196.00
    ];
    const melodyBoss3 = [
      130.81, 146.83, 155.56, 174.61, 155.56, 146.83, 130.81, 116.54,
      130.81, 155.56, 174.61, 196.00, 174.61, 155.56, 130.81, 98.00
    ];
    const melodyStage5Abyss = [
      55.00, 58.27, 49.00, 46.25, 73.42, 69.30, 55.00, 41.20,
      51.91, 46.25, 49.00, 55.00, 38.89, 41.20, 55.00, 32.70
    ];
    const melodyPeaceCutscene = [
      523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33,
      523.25, 659.25, 783.99, 1046.5, 880.00, 783.99, 659.25, 523.25
    ];

    let noteIndex = 0;
    let notes = melodyBattle;
    let tempo = 200;
    let waveType = 'triangle';

    if (gameState === 'clearing_cutscene' || gameState === 'victory') {
      notes = melodyPeaceCutscene;
      tempo = 160;
      waveType = 'sine';
    } else if (phase === 5) {
      notes = melodyStage5Abyss;
      tempo = 110;
      waveType = 'sawtooth';
    } else if (phase === 4 || phase === 3) {
      notes = melodyBoss3;
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

  // Slower, Fair Stage 4 Wheel Skill Check
  useEffect(() => {
    if (!showFatalCircle) return;
    circleAngleRef.current = 0;

    const loop = () => {
      circleAngleRef.current = (circleAngleRef.current + 3.8) % 360; // Fair, readable rotation speed
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
    const tolerance = 38; // Generous 76-degree window

    const diff = Math.abs(currentDeg - target);
    const isSuccess = diff <= tolerance || (360 - diff) <= tolerance;

    if (isSuccess) {
      playSound(880, 'triangle', 0.3);
      setBossFlash(true);
      setTimeout(() => setBossFlash(false), 200);
      addFloatingText("DEFLECTED!", 45, 110, '#34d399');
      setBattleLog("⚡ GREAT REFLEXES! Charisse parried the Devourer's ambush!");
      setIsTurnLocked(false);
    } else {
      playSound(120, 'sawtooth', 0.5);
      const hitDamage = 40;
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

  // Stage 5 Dual Parry Needle Oscillation
  useEffect(() => {
    if (!showDualParry) return;
    let pos = 50;
    let dir = 1.3;

    const loop = () => {
      pos += dir * 2.2;
      if (pos >= 92) {
        pos = 92;
        dir = -1.3;
      } else if (pos <= 8) {
        pos = 8;
        dir = 1.3;
      }
      setParryPos(pos);
      parryAnimRef.current = requestAnimationFrame(loop);
    };

    parryAnimRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(parryAnimRef.current);
  }, [showDualParry]);

  const triggerDualParry = () => {
    setIsTurnLocked(true);
    playThunderSound();
    setShowDualParry(true);
  };

  const handleStopDualParry = () => {
    if (parryAnimRef.current) cancelAnimationFrame(parryAnimRef.current);
    setShowDualParry(false);

    // Two sweet spots: 18%-38% (Ray) or 62%-82% (Charisse)
    const isSuccess = (parryPos >= 18 && parryPos <= 38) || (parryPos >= 62 && parryPos <= 82);

    if (isSuccess) {
      playSound(950, 'triangle', 0.3);
      setBossFlash(true);
      setScreenShake(true);
      setTimeout(() => {
        setBossFlash(false);
        setScreenShake(false);
      }, 300);
      addFloatingText("PERFECT PARRY! 🛡️", 35, 110, '#38bdf8');
      setBattleLog("✨ Ray and Charisse deflected the Titan's void beam!");
      setSynergy((prev) => Math.min(100, prev + 35));
      setIsTurnLocked(false);
    } else {
      playSound(100, 'sawtooth', 0.5);
      const hitDmg = 45;
      const remainingHp = Math.max(0, playerHp - hitDmg);
      setPlayerHp(remainingHp);
      addFloatingText(`-${hitDmg} HP!`, 35, 110, '#ef4444');
      setBattleLog("💥 The Void Beam shattered your barrier!");
      if (remainingHp <= 0) {
        setTimeout(() => setGameState('gameover'), 600);
      } else {
        setIsTurnLocked(false);
      }
    }
  };

  // Standard Critical Recovery Needle Loop
  useEffect(() => {
    if (!showNeedleMinigame) return;
    let pos = 50;
    let dir = 0.9;

    const loop = () => {
      pos += dir * 1.5;
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

  const animatePlayerAttack = (attacker = 'p1', callback) => {
    const targetX = 58;
    const targetY = -70;
    const startTime = Date.now();
    const duration = 380;

    const animInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 0.45) {
        const t = progress / 0.45;
        if (attacker === 'p1' || attacker === 'both') animRef.current.p1Offset = { x: targetX * t, y: targetY * t };
        if (attacker === 'p2' || attacker === 'both') animRef.current.p2Offset = { x: (targetX - 10) * t, y: targetY * t };
      } else if (progress < 0.65) {
        if (attacker === 'p1' || attacker === 'both') animRef.current.p1Offset = { x: targetX, y: targetY };
        if (attacker === 'p2' || attacker === 'both') animRef.current.p2Offset = { x: targetX - 10, y: targetY };
      } else if (progress < 1) {
        const t = (progress - 0.65) / 0.35;
        if (attacker === 'p1' || attacker === 'both') animRef.current.p1Offset = { x: targetX * (1 - t), y: targetY * (1 - t) };
        if (attacker === 'p2' || attacker === 'both') animRef.current.p2Offset = { x: (targetX - 10) * (1 - t), y: targetY * (1 - t) };
      } else {
        clearInterval(animInterval);
        animRef.current.p1Offset = { x: 0, y: 0 };
        animRef.current.p2Offset = { x: 0, y: 0 };
        if (callback) callback();
      }
    }, 16);
  };

  const animateBossAttack = (callback) => {
    const targetX = -45;
    const targetY = 70;
    const startTime = Date.now();
    const duration = 440;

    const animInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 0.4) {
        const t = progress / 0.4;
        animRef.current.bossOffset = { x: targetX * t, y: targetY * t };
      } else if (progress < 0.6) {
        animRef.current.bossOffset = { x: targetX, y: targetY };
      } else if (progress < 1) {
        const t = (progress - 0.6) / 0.4;
        animRef.current.bossOffset = { x: targetX * (1 - t), y: targetY * (1 - t) };
      } else {
        clearInterval(animInterval);
        animRef.current.bossOffset = { x: 0, y: 0 };
        if (callback) callback();
      }
    }, 16);
  };

  const drawPineTree = (ctx, x, y, scale = 1, isVoid = false) => {
    ctx.fillStyle = isVoid ? '#0a0005' : '#3e2723';
    ctx.fillRect(x + 5 * scale, y + 24 * scale, 4 * scale, 8 * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 7 * scale, y + 32 * scale, 8 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isVoid ? '#2d0612' : '#14532d';
    ctx.fillRect(x + 1 * scale, y + 16 * scale, 12 * scale, 9 * scale);
    ctx.fillStyle = isVoid ? '#4a041f' : '#166534';
    ctx.fillRect(x + 2 * scale, y + 17 * scale, 10 * scale, 6 * scale);
    ctx.fillStyle = isVoid ? '#70092b' : '#22c55e';
    ctx.fillRect(x + 4 * scale, y + 10 * scale, 6 * scale, 5 * scale);
  };

  const drawCuteCharisse = (ctx, x, y) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
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

  // Main Battle Render Loop
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
        ['#1e1b4b', '#312e81'],
        ['#064e3b', '#065f46'],
        ['#180521', '#3b0738'],
        ['#200000', '#0a0000'],
        ['#050009', '#1d001a'] // Stage 5: Cosmic Dark Abyss
      ];
      const curSky = skyGradients[phase - 1] || skyGradients[0];
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 100);
      skyGrad.addColorStop(0, curSky[0]);
      skyGrad.addColorStop(1, curSky[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 160, 240);

      const isVoid = phase >= 4;

      drawPineTree(ctx, 4, 42, 0.9, isVoid);
      drawPineTree(ctx, 22, 38, 1.1, isVoid);
      drawPineTree(ctx, 60, 36, 1.0, isVoid);
      drawPineTree(ctx, 134, 40, 0.95, isVoid);

      // Distorted Ground
      ctx.fillStyle = phase === 5 ? '#0c000d' : (phase === 4 ? '#1a0303' : (phase === 3 ? '#0a0512' : '#0f172a'));
      ctx.beginPath();
      ctx.moveTo(-10, 85);
      ctx.lineTo(40, 60);
      ctx.lineTo(90, 78);
      ctx.lineTo(170, 52);
      ctx.lineTo(170, 95);
      ctx.lineTo(-10, 95);
      ctx.fill();

      ctx.fillStyle = phase === 5 ? '#1a001a' : (phase === 4 ? '#2d0505' : (phase === 3 ? '#062817' : '#14532d'));
      ctx.beginPath();
      ctx.moveTo(0, 95);
      ctx.lineTo(160, 65);
      ctx.lineTo(160, 240);
      ctx.lineTo(0, 240);
      ctx.fill();

      // Pathway
      ctx.fillStyle = phase === 5 ? '#100014' : (phase === 4 ? '#180202' : (phase === 3 ? '#1e1b2e' : '#334155'));
      ctx.beginPath();
      ctx.moveTo(20, 120);
      ctx.lineTo(145, 90);
      ctx.lineTo(135, 215);
      ctx.lineTo(10, 215);
      ctx.fill();

      // Boss Sprite
      const bob = Math.sin(tick * (phase === 5 ? 0.22 : 0.08)) * (phase === 5 ? 5 : 2);
      const bX = 96 + animRef.current.bossOffset.x;
      const bY = 34 + animRef.current.bossOffset.y + bob;

      if (bossFlash) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bX - 6, bY - 6, 52, 52);
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
          // STAGE 5: ABYSS VOID TITAN (Giant shadow entity with 4 glowing eye slits)
          ctx.fillStyle = '#1e0024';
          ctx.fillRect(bX - 8, bY - 12, 56, 56);
          ctx.fillStyle = '#380042';
          ctx.fillRect(bX - 4, bY - 8, 48, 50);

          // Pulsing dark void core
          ctx.fillStyle = Math.sin(tick * 0.2) > 0 ? '#ff0055' : '#7700ff';
          ctx.fillRect(bX + 14, bY + 16, 12, 12);

          // 4 Ominous Glowing Eyes
          ctx.fillStyle = '#facc15';
          ctx.fillRect(bX + 2, bY, 6, 3);
          ctx.fillRect(bX + 32, bY, 6, 3);
          ctx.fillStyle = '#ff0033';
          ctx.fillRect(bX + 8, bY + 7, 8, 3);
          ctx.fillRect(bX + 24, bY + 7, 8, 3);

          // Void Wings / Tentacles
          ctx.fillStyle = '#220028';
          ctx.fillRect(bX - 14, bY + 8, 8, 22);
          ctx.fillRect(bX + 46, bY + 8, 8, 22);
        }
      }

      // Players
      const p2X = 64 + animRef.current.p2Offset.x;
      const p2Y = 152 + animRef.current.p2Offset.y;
      drawCuteRay(ctx, p2X, p2Y);

      const p1X = 22 + animRef.current.p1Offset.x;
      const p1Y = 138 + animRef.current.p1Offset.y;
      drawCuteCharisse(ctx, p1X, p1Y);

      // Rain / Thunder / Void Weather
      if (phase === 3 || phase === 4 || phase === 5) {
        ctx.strokeStyle = phase === 5 ? 'rgba(216, 70, 239, 0.7)' : (phase === 4 ? 'rgba(239, 68, 68, 0.65)' : 'rgba(186, 230, 253, 0.45)');
        ctx.lineWidth = phase >= 4 ? 1.5 : 1;
        animRef.current.rainDrops.forEach((drop) => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - (phase === 5 ? 4 : 2), drop.y + drop.length);
          ctx.stroke();

          drop.y += drop.speed * (phase === 5 ? 1.4 : 1);
          drop.x -= 0.8;
          if (drop.y > 240) {
            drop.y = -5;
            drop.x = Math.random() * 165;
          }
        });

        // Stage 5 Violent Lightning Flashes
        if (phase === 5 && Math.random() < 0.05) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(0, 0, 160, 240);
        }
      }

      // Floating battle text
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

  // Cinematic Epilogue Canvas Render (The Sun Comes Out, Petals, Freedom)
  useEffect(() => {
    if (gameState !== 'clearing_cutscene') return;
    const canvas = cutsceneCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let frameId;
    let tick = 0;

    const renderCutscene = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Bright Sunny Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 120);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 160, 240);

      // Radiant Warm Sun with Beams
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(80, 45, 18 + Math.sin(tick * 0.05) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Sunbeams
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = (tick * 0.01) + (i * (Math.PI / 4));
        ctx.beginPath();
        ctx.moveTo(80, 45);
        ctx.lineTo(80 + Math.cos(angle) * 70, 45 + Math.sin(angle) * 70);
        ctx.stroke();
      }

      // Beautiful Emerald Hills
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(0, 110);
      ctx.quadraticCurveTo(80, 90, 160, 115);
      ctx.lineTo(160, 240);
      ctx.lineTo(0, 240);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(0, 130);
      ctx.quadraticCurveTo(80, 115, 160, 135);
      ctx.lineTo(160, 240);
      ctx.lineTo(0, 240);
      ctx.fill();

      drawPineTree(ctx, 6, 75, 0.95, false);
      drawPineTree(ctx, 130, 80, 0.9, false);

      // Blooming Flower Meadow
      for (let f = 10; f < 155; f += 18) {
        ctx.fillStyle = f % 2 === 0 ? '#f43f5e' : '#ec4899';
        ctx.fillRect(f, 185 + (f % 6), 3, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(f + 1, 186 + (f % 6), 1, 1);
      }

      // Falling Cherry Blossom Petals
      ctx.fillStyle = 'rgba(244, 114, 182, 0.75)';
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

      // Charisse and Ray Standing Close in the Sun
      drawCuteCharisse(ctx, 50, 140);
      drawCuteRay(ctx, 84, 140);

      // Big Floating Heart Between Them
      ctx.fillStyle = '#f43f5e';
      ctx.font = '12px "Press Start 2P"';
      ctx.fillText("❤️", 73, 132 + Math.sin(tick * 0.1) * 3);

      frameId = requestAnimationFrame(renderCutscene);
    };

    renderCutscene();
    return () => cancelAnimationFrame(frameId);
  }, [gameState]);

  // QTE Attack System
  const initiateAttack = (actionKey) => {
    if (isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showFatalCircle || showDualParry || bossIntro || jumpscareActive) return;
    setAttackWarning("");
    setPendingAction(actionKey);
    setQteScale(2.3);
    setQteStep('timed');

    const start = Date.now();
    const duration = phase === 5 ? 850 : 1000;

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
    const duration = phase === 5 ? 2600 : 3000;

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
      setBattleLog("⚔️ Charisse lunges forward with a starlight strike!");
      
      animatePlayerAttack('p1', () => {
        setTimeout(() => startDirectionalSwipe('RIGHT'), 150);
      });
    } else if (currentDir === 'RIGHT') {
      playSound(780, 'triangle', 0.15);
      setBossFlash(true);
      setTimeout(() => setBossFlash(false), 120);
      addFloatingText("RAY CROSS-SLASH! 🔥", 55, 125, '#38bdf8');
      setBattleLog("⚡ Ray dashes in with a piercing cross-slash!");

      animatePlayerAttack('p2', () => {
        setTimeout(() => startDirectionalSwipe('UP_OR_DOWN'), 150);
      });
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

  const shiftBossStance = () => {
    const stances = ['comm', 'food', 'hug'];
    const currentIdx = stances.indexOf(dynamicWeakness);
    const nextStance = stances[(currentIdx + 1) % stances.length];
    setDynamicWeakness(nextStance);

    playSound(450, 'sine', 0.2);
    setBossFlash(true);
    setTimeout(() => setBossFlash(false), 200);

    const names = { comm: 'LOVE / COMMUNICATE 💌', food: 'FOOD / TREATS 🍔', hug: 'HUGS / REASSURANCE 🫂' };
    setBattleLog(`🛡️ SHIFT! ${currentBoss.name} changed shield to: ${names[nextStance]}!`);
  };

  const resolveTurn = (actionKey, isCrit) => {
    setIsTurnLocked(true);
    const isEffective = actionKey === dynamicWeakness;

    animatePlayerAttack('both', () => {
      if (!isEffective) {
        playSound(200, 'sawtooth', 0.15);
        addFloatingText("SHIELD BLOCKED!", 100, 35, '#94a3b8');
        setAttackWarning(`SHIELD ACTIVE! It is weak to ${dynamicWeakness.toUpperCase()} right now!`);
        setBattleLog(`Blocked! Monster changed stance! Check its weakness aura!`);
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
      setBattleLog("💥 Direct hit broke through the barrier!");

      if (nextBossHp <= 0) {
        setTimeout(() => advancePhase(), 800);
      } else {
        // Monster shifts weakness mid-fight!
        if (Math.random() < 0.65) {
          setTimeout(() => shiftBossStance(), 400);
        }
        setTimeout(() => bossCounterAttack(false), 900);
      }
    });
  };

  const executeHeal = () => {
    if (isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showFatalCircle || showDualParry || bossIntro || jumpscareActive) return;
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
    if (synergy < 100 || isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showFatalCircle || showDualParry || bossIntro || jumpscareActive) return;
    setIsTurnLocked(true);
    setAttackWarning("");
    setSynergy(0);

    animatePlayerAttack('both', () => {
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
    });
  };

  const bossCounterAttack = (isHeavyHit = false) => {
    animateBossAttack(() => {
      playSound(140, 'sawtooth', 0.25);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 300);

      const damage = (isHeavyHit ? 25 : 16) + (phase * 3);
      const remainingHp = Math.max(0, playerHp - damage);
      setPlayerHp(remainingHp);
      addFloatingText(`-${damage} HP`, 35, 140, '#ef4444');

      if (remainingHp <= 0) {
        playSound(100, 'sawtooth', 0.5);
        setBattleLog("💀 Team HP hit 0! You were defeated...");
        setTimeout(() => setGameState('gameover'), 700);
      } else if (phase === 5 && Math.random() < 0.6) {
        // Stage 5 Void Beam Dual Parry Check!
        setTimeout(() => triggerDualParry(), 500);
      } else if (phase === 4 && Math.random() < 0.5) {
        // Stage 4 Wheel Check
        setTimeout(() => triggerFatalCircle(), 500);
      } else if (remainingHp <= 35) {
        setIsTurnLocked(true);
        setTimeout(() => {
          playSound(440, 'sine', 0.2);
          setShowNeedleMinigame(true);
        }, 500);
      } else {
        setBattleLog(`⚠️ ${currentBoss.name} struck back for -${damage} HP!`);
        setIsTurnLocked(false);
      }
    });
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
        // FINAL STAGE 5 VOID TITAN ENTRANCE
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
        setBattleLog(`🔥 STAGE CLEARED! Warning: ${bosses[phase].title}!`);
        setIsTurnLocked(false);
      }
    } else {
      // ALL 5 STAGES DEFEATED: TRIGGER EPILOGUE CUTSCENE!
      setIsTurnLocked(true);
      playFanfare();
      confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });
      setGameState('clearing_cutscene');
      setCutsceneStep(1);
    }
  };

  const resetCampaign = (toMainMenu = false) => {
    setPhase(1);
    setBossHp(100);
    setPlayerHp(100);
    setSynergy(0);
    setDynamicWeakness('comm');
    setQteStep(null);
    setBossIntro(false);
    setJumpscareActive(false);
    setShowFatalCircle(false);
    setShowDualParry(false);
    setShowNeedleMinigame(false);
    setShowTriviaModal(false);
    setAttackWarning("");
    setIsTurnLocked(false);

    if (toMainMenu) {
      setGameState('landing');
      setShowInstructions(true);
    } else {
      setGameState('battle');
      setBattleLog("Stage 1: The Stubborn Ego Monster appears!");
    }
  };

  const polaroids = [
    {
      caption: "Thank You for Healing My Knee 🩹",
      note: "When I tore the ligament in my right knee, you stayed by my side, took care of me, and supported me every step until I was completely healed. Having you as my companion meant the entire world to me.",
      emoji: "❤️"
    },
    {
      caption: "My Biggest Supporter: Studies & Basketball 🏀",
      note: "Thank you for endlessly supporting me through all my studies, thesis research (Skripsi 1 & 2), and always cheering the loudest in my basketball tournaments. You are my true MVP.",
      emoji: "🏆"
    },
    {
      caption: "Happy 4-Month Anniversary, My Love! ✨",
      note: "Dating you since May 9 has been the happiest 4 months of my life. You conquered all 5 trials and proved our bond is unbreakable. I love you forever Charisse! ❤️",
      emoji: "🎮"
    }
  ];

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center font-cozy text-white select-none bg-black overflow-hidden p-0">
      <div className={`w-full max-w-[430px] h-full flex flex-col justify-between relative bg-slate-950 border-x border-slate-800 shadow-2xl overflow-hidden ${screenShake ? 'animate-shake' : ''}`}>

        {/* ================= SCREEN 1: LANDING ================= */}
        {gameState === 'landing' && (
          <div className="w-full h-full flex flex-col justify-between p-3.5 sm:p-5 text-center overflow-hidden">
            <div className="w-full flex justify-between items-center shrink-0 pt-0.5">
              <span className="font-pixel text-[8px] text-pink-400 bg-pink-950/80 border border-pink-700/60 px-2.5 py-1 rounded-full">
                MAY 9, 2026 ➔ TODAY ❤️
              </span>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { initAudio(); playSound(500, 'sine', 0.05); setShowInstructions(true); }}
                  className="flex items-center gap-1 text-[11px] text-pink-300 hover:text-white bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md"
                >
                  <HelpCircle size={12} /> Rules
                </button>
                <button
                  onClick={() => {
                    initAudio();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1 rounded-full bg-white/10 border border-slate-700 text-pink-300 hover:text-white backdrop-blur-md"
                  title={isMuted ? "Unmute Music" : "Mute Music"}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-yellow-300" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center my-auto gap-1.5 shrink-0 py-1">
              <div className="relative my-0.5">
                <div className="text-4xl sm:text-5xl animate-bounce">⚔️💖👹</div>
                <Sparkles className="absolute -top-1.5 -right-2 text-yellow-300 animate-spin" size={18} />
              </div>

              <div>
                <h1 className="font-pixel text-xs sm:text-sm text-pink-200 tracking-wider leading-snug">
                  4-MONTH ANNIVERSARY QUEST<br />
                  <span className="text-purple-400 font-bold tracking-widest text-[8.5px]">5 STAGES • DYNAMIC STANCES</span>
                </h1>
                <p className="text-[10px] text-pink-300/80 mt-0.5">
                  Dating Since May 9, 2026 • 123 Days of Love
                </p>
              </div>

              <div className="bg-purple-950/80 border border-purple-800 rounded-xl p-2.5 w-full max-w-[340px] text-left shadow-2xl backdrop-blur-md space-y-1 mt-0.5">
                <div className="font-pixel text-[7.5px] text-yellow-300 border-b border-purple-800/80 pb-0.5 flex items-center justify-between tracking-wider">
                  <span>COMBAT INTELLIGENCE</span>
                  <span className="text-pink-300">5 TRIALS</span>
                </div>

                <div className="text-[10px] text-pink-200 space-y-1">
                  <p>🛡️ <b>Dynamic Shields:</b> Monsters shift weaknesses mid-battle! Watch their aura.</p>
                  <p>🎡 <b>Stage 4:</b> Deflect the Devourer's ambush with the spinning dial!</p>
                  <p>⚡ <b>Stage 5:</b> Stop the parry needle in Ray or Charisse's defense zones to deflect the Void Titan!</p>
                </div>
              </div>
            </div>

            <div className="w-full shrink-0 pt-2 pb-1">
              <button
                onClick={() => {
                  initAudio();
                  playSound(440, 'triangle', 0.15);
                  setGameState('battle');
                }}
                className="w-full font-pixel text-xs bg-gradient-to-r from-pink-500 via-purple-600 to-rose-600 hover:from-pink-600 hover:to-rose-700 py-3.5 rounded-xl shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 tracking-wider transform active:scale-95 transition-all"
              >
                START BATTLE <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ================= INSTRUCTIONS MODAL ================= */}
        {showInstructions && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-purple-500/80 rounded-2xl p-4 max-w-[320px] w-full text-left relative shadow-2xl">
              <button 
                onClick={() => setShowInstructions(false)}
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-2 font-pixel text-xs text-purple-300 mb-2.5">
                <ShieldCheck size={16} />
                <span>COMBAT MECHANICS</span>
              </div>
              
              <div className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
                <p>🔄 <b>Dynamic Stances:</b> Monsters change weaknesses during combat. Look at the top banner to see if you should use <b>COMMUNICATE</b>, <b>BURGER</b>, or <b>HUG</b>!</p>
                <p>🎡 <b>Stage 4 Ambush:</b> Stop the needle in the white sector to deflect damage!</p>
                <p>⚡ <b>Stage 5 Void Beam:</b> Press <b>PARRY BEAM</b> in the blue (Ray) or pink (Charisse) sweet spot!</p>
                <p>☀️ Defeat Stage 5 to break the curse and unlock the peaceful ending meadow!</p>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full mt-3.5 font-pixel text-[9px] bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-center"
              >
                GOT IT!
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: BATTLE ARENA ================= */}
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
                  phase === 5 ? 'bg-purple-950/90 border-purple-500 text-purple-300 animate-pulse' : (phase === 4 ? 'bg-red-950/90 border-red-600 text-red-300' : 'bg-black/80 border-slate-700 text-yellow-300')
                }`}>
                  STAGE {phase}/5 {phase === 5 ? '⚡' : (phase === 4 ? '🩸' : (phase === 3 ? '🌧️' : ''))}
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

              {/* Top Right: Full Uncropped Boss Health Card */}
              <div className={`absolute top-2 right-2 border p-1.5 px-2 rounded-lg min-w-[150px] shadow-lg z-30 ${
                phase === 5 ? 'bg-purple-950/90 border-purple-500 shadow-purple-900/50' : (phase === 4 ? 'bg-red-950/90 border-red-600' : 'bg-black/85 border-slate-700')
              }`}>
                <div className="flex justify-between items-center gap-2 font-pixel text-[7.5px] text-pink-300 mb-0.5 whitespace-nowrap">
                  <span className="tracking-tight">{currentBoss.name}</span>
                  <span className="text-[7px] text-slate-300">{bossHp}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      phase === 5 ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-amber-300' : (phase === 4 ? 'bg-gradient-to-r from-red-600 via-rose-500 to-black' : 'bg-gradient-to-r from-rose-500 to-pink-500')
                    }`}
                    style={{ width: `${bossHp}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Weakness Indicator Badge */}
              <div className="absolute top-10 right-2 z-30 bg-black/80 border border-amber-400/80 px-2 py-0.5 rounded-full font-pixel text-[6.5px] text-amber-300 flex items-center gap-1 shadow-md">
                <span>WEAKNESS:</span>
                <span className="text-white font-bold">
                  {dynamicWeakness === 'comm' ? '💌 LOVE' : (dynamicWeakness === 'food' ? '🍔 FOOD' : '🫂 HUG')}
                </span>
              </div>

              {/* Team Health Bar */}
              <div className="absolute bottom-2 left-2 bg-black/85 border border-slate-700 p-1.5 rounded-lg w-38 shadow-lg">
                <div className="flex justify-between font-pixel text-[7.5px] text-emerald-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <HeartPulse size={9} className={playerHp <= 35 ? 'text-red-400 animate-spin' : ''} />
                    OUR TEAM HP
                  </span>
                  <span className={playerHp <= 35 ? 'text-red-400 animate-pulse font-bold' : ''}>{playerHp}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${playerHp <= 35 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${playerHp}%` }}
                  />
                </div>
              </div>

              {/* Jumpscare Overlay */}
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
                    {phase === 5 ? 'Thunder rumbles as the ultimate darkness rises!' : 'Do not fail the ambush check!'}
                  </p>
                </div>
              )}

              {/* STAGE 5 DUAL PARRY MINIGAME */}
              {showDualParry && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                  <div className="bg-slate-950 border-2 border-purple-500 rounded-2xl p-4 flex flex-col items-center max-w-[280px] w-full text-center shadow-[0_0_25px_rgba(168,85,247,0.7)] animate-shake">
                    <span className="font-pixel text-[8px] text-purple-300 bg-purple-950 border border-purple-700 px-2.5 py-0.5 rounded-full mb-1 flex items-center gap-1">
                      ⚡ DEFLECT VOID BEAM!
                    </span>
                    <p className="text-[11px] text-slate-200 font-semibold mb-2">
                      Stop in Blue (Ray) or Pink (Charisse) to parry!
                    </p>

                    <div className="relative w-12 h-44 bg-slate-950 border-2 border-slate-700 rounded-full overflow-hidden my-1 flex items-center justify-center shadow-inner">
                      {/* Ray Zone */}
                      <div className="absolute top-[18%] h-[20%] w-full bg-sky-500/40 border-y-2 border-sky-400 flex items-center justify-center">
                        <span className="font-pixel text-[6.5px] text-sky-300">RAY</span>
                      </div>

                      {/* Charisse Zone */}
                      <div className="absolute top-[62%] h-[20%] w-full bg-pink-500/40 border-y-2 border-pink-400 flex items-center justify-center">
                        <span className="font-pixel text-[6.5px] text-pink-300">CHARISSE</span>
                      </div>

                      {/* Moving Needle */}
                      <div 
                        className="absolute left-0.5 right-0.5 h-3 bg-yellow-400 border border-white rounded-full shadow-lg shadow-yellow-400/80 transition-none"
                        style={{ top: `${parryPos}%` }}
                      />
                    </div>

                    <button
                      onClick={handleStopDualParry}
                      className="w-full mt-2 font-pixel text-[9px] bg-gradient-to-r from-sky-500 via-purple-600 to-pink-500 hover:from-sky-600 hover:to-pink-600 text-white py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                      PARRY BEAM! 🛡️
                    </button>
                  </div>
                </div>
              )}

              {/* Balanced Stage 4 Wheel Dial */}
              {showFatalCircle && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                  <div className="bg-slate-950 border-2 border-red-600 rounded-2xl p-4 flex flex-col items-center max-w-[280px] w-full text-center shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-shake">
                    <span className="font-pixel text-[8px] text-red-400 bg-red-950 border border-red-700 px-2 py-0.5 rounded-full mb-1 flex items-center gap-1">
                      <Skull size={11} /> AMBUSH DEFENSE!
                    </span>
                    <p className="text-xs text-white font-bold mb-2">
                      STOP inside the white marker!
                    </p>

                    <div className="relative w-36 h-36 rounded-full border-4 border-slate-700 flex items-center justify-center overflow-hidden bg-slate-900 shadow-inner">
                      <div 
                        className="absolute w-full h-full pointer-events-none"
                        style={{
                          background: `conic-gradient(from ${circleTargetAngle - 20}deg, transparent 0deg, #ffffff 1deg, #ef4444 20deg, #ffffff 40deg, transparent 41deg)`
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

            {/* Bottom Deck */}
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
                  disabled={synergy < 100 || isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showFatalCircle || showDualParry || bossIntro || jumpscareActive}
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
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showFatalCircle || showDualParry || bossIntro || jumpscareActive}
                  onClick={() => initiateAttack('comm')}
                  className={`py-2 px-2 rounded-xl flex items-center justify-start gap-1.5 active:scale-95 transition-all shadow-md text-left ${
                    dynamicWeakness === 'comm' ? 'bg-pink-600 ring-2 ring-yellow-300 animate-pulse' : 'bg-pink-800/80 hover:bg-pink-700'
                  }`}
                >
                  <span className="text-base">💌</span>
                  <div>
                    <div className="font-pixel text-[7px]">COMMUNICATE</div>
                    <div className="text-[9px] text-pink-200/80">{dynamicWeakness === 'comm' ? '★ WEAKNESS' : 'Power of Love'}</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showFatalCircle || showDualParry || bossIntro || jumpscareActive}
                  onClick={() => initiateAttack('food')}
                  className={`py-2 px-2 rounded-xl flex items-center justify-start gap-1.5 active:scale-95 transition-all shadow-md text-left ${
                    dynamicWeakness === 'food' ? 'bg-emerald-600 ring-2 ring-yellow-300 animate-pulse' : 'bg-emerald-800/80 hover:bg-emerald-700'
                  }`}
                >
                  <span className="text-base">🍔</span>
                  <div>
                    <div className="font-pixel text-[7px]">BURGER & TEA</div>
                    <div className="text-[9px] text-emerald-200/80">{dynamicWeakness === 'food' ? '★ WEAKNESS' : 'Snack Attack'}</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showFatalCircle || showDualParry || bossIntro || jumpscareActive}
                  onClick={() => initiateAttack('hug')}
                  className={`py-2 px-2 rounded-xl flex items-center justify-start gap-1.5 active:scale-95 transition-all shadow-md text-left ${
                    dynamicWeakness === 'hug' ? 'bg-purple-600 ring-2 ring-yellow-300 animate-pulse' : 'bg-purple-800/80 hover:bg-purple-700'
                  }`}
                >
                  <span className="text-base">🫂</span>
                  <div>
                    <div className="font-pixel text-[7px]">WARM HUG</div>
                    <div className="text-[9px] text-purple-200/80">{dynamicWeakness === 'hug' ? '★ WEAKNESS' : 'Reassurance'}</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || showFatalCircle || showDualParry || bossIntro || jumpscareActive}
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

        {/* ================= SCREEN 3: CINEMATIC EPILOGUE (FREEDOM CUTSCENE) ================= */}
        {gameState === 'clearing_cutscene' && (
          <div className="w-full h-full flex flex-col justify-between relative overflow-hidden bg-sky-900 animate-fade-in">
            <div className="relative flex-1 w-full overflow-hidden">
              <canvas
                ref={cutsceneCanvasRef}
                width={160}
                height={240}
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />

              <div className="absolute top-3 left-3 right-3 flex justify-center">
                <span className="font-pixel text-[8px] text-yellow-300 bg-black/60 border border-yellow-400 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-bounce">
                  <Sun size={12} className="text-yellow-400" /> THE APOCALYPSE HAS ENDED!
                </span>
              </div>
            </div>

            {/* Narrative Dialogue Box */}
            <div className="bg-gradient-to-t from-slate-950 via-slate-900 to-transparent p-4 text-center shrink-0 border-t border-yellow-500/40">
              <h3 className="font-pixel text-xs text-pink-300 mb-1">✨ THE CURSE IS SHATTERED! ✨</h3>
              <p className="text-[11.5px] text-slate-100 font-medium leading-relaxed max-w-[320px] mx-auto mb-3">
                The dark blood sky parts as warm golden sunshine touches the valley. Cherry blossoms drift in the breeze. Ray and Charisse step together onto the flower meadow, hand in hand, free from all monsters!
              </p>

              <button
                onClick={() => {
                  initAudio();
                  playSound(700, 'sine', 0.1);
                  setGameState('victory');
                }}
                className="w-full font-pixel text-[10px] bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-pink-500/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                OPEN LOVE LETTERS & ENDING <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 4: GAME OVER ================= */}
        {gameState === 'gameover' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-black/95 animate-fade-in gap-3">
            <Skull size={42} className="text-red-500 animate-bounce" />
            <div>
              <h2 className="font-pixel text-base text-red-500 tracking-wider">OVERWHELMED BY DARKNESS</h2>
              <p className="text-[11px] text-slate-400 mt-1.5 max-w-[240px] leading-relaxed">
                The Void Titan overpowered your bond! Read the shifting weaknesses and execute the dual parries together!
              </p>
            </div>

            <div className="w-full max-w-[260px] flex flex-col gap-2 mt-1">
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
                <HelpCircle size={13} /> MAIN MENU & RULES
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 5: FINAL VICTORY & REWARDS ================= */}
        {gameState === 'victory' && (
          <div className="w-full h-full flex flex-col items-center justify-between p-3.5 text-center overflow-y-auto">
            <div className="w-full flex flex-col items-center pt-0.5">
              <span className="font-pixel text-[8px] text-yellow-300 bg-yellow-950/70 border border-yellow-600/60 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-md animate-bounce">
                <Trophy size={11} /> ALL 5 TRIALS CLEARED!
              </span>
              <h2 className="font-pixel text-xs text-pink-200 mt-1.5">TRUE LOVE SAVED THE WORLD ✨</h2>
              <p className="text-[10px] text-pink-300/80 mt-0.5">Happy 4-Month Anniversary, Charisse! ❤️</p>
            </div>

            {/* Interactive Memory Card */}
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

            {/* Official Commemorative Victory Scroll */}
            <div className="w-full max-w-[290px] bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 border-2 border-pink-500/80 rounded-2xl p-2.5 text-center relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between text-yellow-300 font-pixel text-[7.5px] mb-1 border-b border-pink-500/30 pb-1">
                <span className="flex items-center gap-1"><Award size={10} /> 123 DAYS OF LOVE</span>
                <span>SINCE MAY 9, 2026</span>
              </div>

              <div className="flex items-center justify-center gap-1 my-0.5 text-rose-400">
                <Heart size={14} fill="#f43f5e" />
                <span className="font-pixel text-[8px] text-pink-200">OFFICIAL SURVIVOR SCROLL</span>
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