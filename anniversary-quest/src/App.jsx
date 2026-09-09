import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, Sparkles, HelpCircle, X, ArrowRight, 
  ShieldCheck, Zap, RefreshCw, Award, AlertTriangle, Skull, HeartPulse
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState('landing');
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Combat System
  const [phase, setPhase] = useState(1);
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [synergy, setSynergy] = useState(0);
  const [battleLog, setBattleLog] = useState("Stage 1: The Stubborn Ego Monster appears!");
  const [isTurnLocked, setIsTurnLocked] = useState(false);
  const [attackWarning, setAttackWarning] = useState("");

  // Dramatic Level 3 Boss Entrance
  const [finalBossIntro, setFinalBossIntro] = useState(false);

  // Multi-tier QTE Attack Sequence States
  const [qteStep, setQteStep] = useState(null);
  const [qteScale, setQteScale] = useState(2.3);
  const [mashCount, setMashCount] = useState(0);
  const [mashTimer, setMashTimer] = useState(100);
  const [swipeCount, setSwipeCount] = useState(0);
  const [swipeTimer, setSwipeTimer] = useState(100);
  const [pendingAction, setPendingAction] = useState(null);
  const [lastTouchX, setLastTouchX] = useState(null);

  // Critical Health Mini-Game & Trivia States
  const [showNeedleMinigame, setShowNeedleMinigame] = useState(false);
  const [needlePos, setNeedlePos] = useState(50);
  const [hasTriggeredReviveThisPhase, setHasTriggeredReviveThisPhase] = useState(false);
  const [showTriviaModal, setShowTriviaModal] = useState(false);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);

  // VFX
  const [screenShake, setScreenShake] = useState(false);
  const [bossFlash, setBossFlash] = useState(false);
  const [activePolaroid, setActivePolaroid] = useState(0);
  const [ticketScratched, setTicketScratched] = useState(false);

  const animRef = useRef({
    p1Offset: { x: 0, y: 0 },
    p2Offset: { x: 0, y: 0 },
    bossOffset: { x: 0, y: 0 },
    floatingTexts: []
  });

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const qteTimerRef = useRef(null);
  const subQteTimerRef = useRef(null);
  const needleAnimRef = useRef(null);

  const bosses = [
    {
      name: "EGO MONSTER",
      title: "STAGE 1: THE EGO MONSTER",
      weakness: "comm",
      hint: "Communicate openly with pure love!"
    },
    {
      name: "HANGRY GOBLIN",
      title: "STAGE 2: THE HANGRY GOBLIN",
      weakness: "food",
      hint: "Feed it a delicious burger & milk tea!"
    },
    {
      name: "OVERTHINK PHANTOM",
      title: "FINAL STAGE: OVERTHINK PHANTOM",
      weakness: "hug",
      hint: "Shower it with reassurance and warm hugs!"
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

  const playSound = (freq, type = 'square', dur = 0.08, ramp = 0.001) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
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

  const playFanfare = () => {
    const notes = [261.6, 329.6, 392.0, 523.2, 659.2];
    notes.forEach((n, i) => setTimeout(() => playSound(n, 'sine', 0.25), i * 110));
  };

  const addFloatingText = (text, x, y, color = '#facc15') => {
    animRef.current.floatingTexts.push({ text, x, y, color, life: 40 });
  };

  useEffect(() => {
    if (!showNeedleMinigame) return;
    let pos = 50;
    let dir = 1.6;

    const loop = () => {
      pos += dir * 2.8;
      if (pos >= 96) {
        pos = 96;
        dir = -1.6;
      } else if (pos <= 4) {
        pos = 4;
        dir = 1.6;
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
    const duration = 420;

    const animInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 0.45) {
        const t = progress / 0.45;
        if (attacker === 'p1' || attacker === 'both') {
          animRef.current.p1Offset = { x: targetX * t, y: targetY * t };
        }
        if (attacker === 'p2' || attacker === 'both') {
          animRef.current.p2Offset = { x: (targetX - 10) * t, y: targetY * t };
        }
      } else if (progress < 0.65) {
        if (attacker === 'p1' || attacker === 'both') {
          animRef.current.p1Offset = { x: targetX, y: targetY };
        }
        if (attacker === 'p2' || attacker === 'both') {
          animRef.current.p2Offset = { x: targetX - 10, y: targetY };
        }
      } else if (progress < 1) {
        const t = (progress - 0.65) / 0.35;
        if (attacker === 'p1' || attacker === 'both') {
          animRef.current.p1Offset = { x: targetX * (1 - t), y: targetY * (1 - t) };
        }
        if (attacker === 'p2' || attacker === 'both') {
          animRef.current.p2Offset = { x: (targetX - 10) * (1 - t), y: targetY * (1 - t) };
        }
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
    const duration = 460;

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

  const drawPineTree = (ctx, x, y, scale = 1) => {
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(x + 5 * scale, y + 24 * scale, 4 * scale, 8 * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 7 * scale, y + 32 * scale, 8 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14532d';
    ctx.fillRect(x + 1 * scale, y + 16 * scale, 12 * scale, 9 * scale);
    ctx.fillStyle = '#166534';
    ctx.fillRect(x + 2 * scale, y + 17 * scale, 10 * scale, 6 * scale);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x + 3 * scale, y + 9 * scale, 8 * scale, 8 * scale);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 4 * scale, y + 10 * scale, 6 * scale, 5 * scale);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x + 5 * scale, y + 2 * scale, 4 * scale, 8 * scale);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x + 6 * scale, y + 1 * scale, 2 * scale, 3 * scale);
  };

  const drawMossyRock = (ctx, x, y, w = 16, h = 10) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 1, w / 2 + 1, h / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 2);
    ctx.fillRect(x, y + 4, w, h - 4);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + w - 4, y + 3, 4, h - 3);
    ctx.fillRect(x + 2, y + h - 2, w - 4, 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 2, y + 2, w - 6, 2);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 3, y + 1, 6, 3);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x + 5, y + 3, 3, 2);
  };

  const drawFlowerTuft = (ctx, x, y, flowerColor = '#f43f5e') => {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x, y + 2, 2, 4);
    ctx.fillRect(x + 3, y + 1, 2, 5);
    ctx.fillStyle = flowerColor;
    ctx.fillRect(x - 1, y, 3, 3);
    ctx.fillRect(x + 3, y - 1, 3, 3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x, y + 1, 1, 1);
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
    ctx.fillStyle = '#fda4af';
    ctx.fillRect(x + 2, y + 4, 2, 2);

    ctx.fillStyle = '#ffd7ba';
    ctx.fillRect(x + 5, y + 5, 11, 9);

    ctx.fillStyle = '#2b1408';
    ctx.fillRect(x + 7, y + 8, 3, 4);
    ctx.fillRect(x + 12, y + 8, 3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 7, y + 8, 1, 2);
    ctx.fillRect(x + 12, y + 8, 1, 2);
    ctx.fillRect(x + 9, y + 10, 1, 1);
    ctx.fillRect(x + 14, y + 10, 1, 1);

    ctx.fillStyle = 'rgba(244, 63, 94, 0.65)';
    ctx.fillRect(x + 5, y + 11, 2, 2);
    ctx.fillRect(x + 14, y + 11, 2, 2);

    ctx.fillStyle = '#4a2818';
    ctx.fillRect(x + 4, y + 2, 13, 4);
    ctx.fillRect(x + 5, y + 5, 3, 2);
    ctx.fillRect(x + 13, y + 5, 3, 2);
    ctx.fillStyle = '#6b3e24';
    ctx.fillRect(x + 6, y + 3, 7, 1);

    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x + 5, y + 14, 11, 10);
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(x + 7, y + 15, 7, 8);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 5, y + 23, 11, 2);
    ctx.fillRect(x + 9, y + 15, 3, 3);

    ctx.fillStyle = '#831843';
    ctx.fillRect(x + 6, y + 25, 4, 4);
    ctx.fillRect(x + 11, y + 25, 4, 4);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 18, y + 7, 2, 21);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 16, y + 9, 6, 2);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(x + 16, y + 3, 6, 5);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x + 17, y + 4, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 17, y + 4, 1, 1);
  };

  const drawCuteRay = (ctx, x, y) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 30, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#171717';
    ctx.fillRect(x + 4, y + 2, 13, 5);
    ctx.fillRect(x + 3, y + 4, 15, 4);
    ctx.fillStyle = '#383838';
    ctx.fillRect(x + 6, y + 2, 4, 2);
    ctx.fillRect(x + 12, y + 3, 3, 2);

    ctx.fillStyle = '#ffd7ba';
    ctx.fillRect(x + 5, y + 6, 11, 8);

    ctx.fillStyle = '#171717';
    ctx.fillRect(x + 7, y + 9, 2, 3);
    ctx.fillRect(x + 12, y + 9, 2, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 7, y + 9, 1, 1);
    ctx.fillRect(x + 12, y + 9, 1, 1);

    ctx.fillStyle = '#e11d48';
    ctx.fillRect(x + 9, y + 12, 3, 1);

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(x + 4, y + 14, 13, 10);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x + 6, y + 15, 9, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 2, y + 15, 3, 11);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 3, y + 14, 4, 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 4, y + 17, 3, 1);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 5, y + 21, 11, 2);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 9, y + 21, 3, 2);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 6, y + 25, 4, 4);
    ctx.fillRect(x + 11, y + 25, 4, 4);

    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 17, y + 15, 5, 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 19, y + 17, 1, 4);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 19, y + 5, 2, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 19, y + 5, 1, 9);
  };

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
        ['#4c0519', '#881337'],
      ];
      const curSky = skyGradients[phase - 1] || skyGradients[0];
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 100);
      skyGrad.addColorStop(0, curSky[0]);
      skyGrad.addColorStop(1, curSky[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 160, 240);

      drawPineTree(ctx, 4, 42, 0.9);
      drawPineTree(ctx, 22, 38, 1.1);
      drawPineTree(ctx, 60, 36, 1.0);
      drawPineTree(ctx, 134, 40, 0.95);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-10, 85);
      ctx.lineTo(40, 60);
      ctx.lineTo(90, 78);
      ctx.lineTo(170, 52);
      ctx.lineTo(170, 95);
      ctx.lineTo(-10, 95);
      ctx.fill();

      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.moveTo(0, 95);
      ctx.lineTo(160, 65);
      ctx.lineTo(160, 240);
      ctx.lineTo(0, 240);
      ctx.fill();

      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(0, 96);
      ctx.lineTo(160, 66);
      ctx.lineTo(160, 235);
      ctx.lineTo(0, 235);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(20, 120);
      ctx.lineTo(145, 90);
      ctx.lineTo(135, 215);
      ctx.lineTo(10, 215);
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = -60; i < 220; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 90);
        ctx.lineTo(i + 70, 220);
        ctx.stroke();
      }

      drawMossyRock(ctx, 6, 98, 18, 11);
      drawMossyRock(ctx, 136, 175, 16, 9);
      drawFlowerTuft(ctx, 12, 145, '#f43f5e');
      drawFlowerTuft(ctx, 138, 115, '#fbbf24');
      drawFlowerTuft(ctx, 128, 205, '#ec4899');
      drawFlowerTuft(ctx, 22, 220, '#60a5fa');

      const bob = Math.sin(tick * 0.08) * 2;
      const bX = 96 + animRef.current.bossOffset.x;
      const bY = 34 + animRef.current.bossOffset.y + bob;

      if (bossFlash) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bX - 2, bY - 2, 44, 42);
      } else {
        if (phase === 1) {
          ctx.fillStyle = '#4c1d95';
          ctx.fillRect(bX + 2, bY + 6, 36, 30);
          ctx.fillRect(bX + 8, bY, 24, 38);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(bX + 2, bY - 4, 36, 5);
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
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(bX + 13, bY + 24, 4, 4);
          ctx.fillRect(bX + 21, bY + 24, 4, 4);
        } else {
          ctx.fillStyle = '#9d174d';
          ctx.fillRect(bX + 2, bY + 4, 36, 32);
          ctx.fillStyle = '#be185d';
          ctx.fillRect(bX + 6, bY, 28, 36);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(bX + 10, bY + 11, 7, 4);
          ctx.fillRect(bX + 23, bY + 11, 7, 4);
          ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
          ctx.fillRect(bX + 4, bY + 34, 32, 7);
        }
      }

      const p2X = 64 + animRef.current.p2Offset.x;
      const p2Y = 152 + animRef.current.p2Offset.y;
      drawCuteRay(ctx, p2X, p2Y);

      const p1X = 22 + animRef.current.p1Offset.x;
      const p1Y = 138 + animRef.current.p1Offset.y;
      drawCuteCharisse(ctx, p1X, p1Y);

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

  // QTE System
  const initiateAttack = (actionKey) => {
    if (isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || finalBossIntro) return;
    setAttackWarning("");
    setPendingAction(actionKey);
    setQteScale(2.3);
    setQteStep('timed');

    const start = Date.now();
    const duration = 1100;

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
        startSwipeStep();
      }
    }
  };

  const startSwipeStep = () => {
    setQteStep('swipe');
    setSwipeCount(0);
    setSwipeTimer(100);
    setLastTouchX(null);

    const startTime = Date.now();
    const duration = 2400;

    if (subQteTimerRef.current) clearInterval(subQteTimerRef.current);

    subQteTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setSwipeTimer(remainingPct);

      if (remainingPct <= 0) {
        clearInterval(subQteTimerRef.current);
        handleQTEFailed("NOT ENOUGH SWIPES!");
      }
    }, 20);
  };

  const handleSwipeMove = (clientX) => {
    if (qteStep !== 'swipe') return;
    if (lastTouchX === null) {
      setLastTouchX(clientX);
      return;
    }

    const diff = Math.abs(clientX - lastTouchX);
    if (diff > 45) {
      playSound(700, 'sine', 0.05);
      setLastTouchX(clientX);
      const nextSwipe = swipeCount + 1;
      setSwipeCount(nextSwipe);

      if (nextSwipe >= 5) {
        if (subQteTimerRef.current) clearInterval(subQteTimerRef.current);
        playSound(900, 'triangle', 0.2);
        setQteStep(null);
        resolveTurn(pendingAction, true);
      }
    }
  };

  const handleQTEFailed = (reason) => {
    setQteStep(null);
    playSound(150, 'sawtooth', 0.25);
    addFloatingText("MISS!", 40, 140, '#94a3b8');
    setAttackWarning(`❌ ${reason} Attack failed!`);
    setBattleLog("Charisse lost momentum! The monster charges forward!");
    setIsTurnLocked(true);
    setTimeout(() => bossCounterAttack(true), 700);
  };

  const resolveTurn = (actionKey, isCrit) => {
    setIsTurnLocked(true);
    const isEffective = actionKey === currentBoss.weakness;

    animatePlayerAttack('p1', () => {
      if (!isEffective) {
        playSound(200, 'sawtooth', 0.15);
        addFloatingText("BLOCKED!", 100, 35, '#94a3b8');
        setAttackWarning(`INEFFECTIVE! That won't work on this monster!`);
        setBattleLog(`That won't work on this monster! (${currentBoss.hint})`);
        setTimeout(() => bossCounterAttack(false), 600);
        return;
      }

      setBossFlash(true);
      setTimeout(() => setBossFlash(false), 120);

      const baseDmg = isCrit ? 50 : 35;
      playSound(isCrit ? 700 : 500, 'triangle', 0.15);
      addFloatingText(isCrit ? `CRIT! -${baseDmg}` : `-${baseDmg}`, 95, 30, isCrit ? '#f43f5e' : '#facc15');

      let hitMsg = "";
      if (actionKey === 'comm') {
        hitMsg = isCrit ? "💥 CRITICAL LOVE! Honest communication shattered the Ego!" : "💌 Heartfelt words struck home!";
      } else if (actionKey === 'food') {
        hitMsg = isCrit ? "💥 CRITICAL FEAST! Stuffed the Goblin with juicy burgers & milk tea!" : "🍔 Fed burger & milk tea! Goblin is happy & docile!";
      } else if (actionKey === 'hug') {
        hitMsg = isCrit ? "💥 CRITICAL REASSURANCE! Overthinking completely melted!" : "🫂 Warm hugs dissolved the anxious spiral!";
      }

      const nextBossHp = Math.max(0, bossHp - baseDmg);
      setBossHp(nextBossHp);
      setSynergy((prev) => Math.min(100, prev + (isCrit ? 40 : 25)));
      setBattleLog(hitMsg);

      if (nextBossHp <= 0) {
        setTimeout(() => advancePhase(), 800);
      } else {
        setTimeout(() => bossCounterAttack(false), 900);
      }
    });
  };

  const executeHeal = () => {
    if (isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || finalBossIntro) return;
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
    if (synergy < 100 || isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || finalBossIntro) return;
    setIsTurnLocked(true);
    setAttackWarning("");
    setSynergy(0);

    animatePlayerAttack('both', () => {
      playSound(400, 'square', 0.1);
      setTimeout(() => playSound(600, 'square', 0.15), 100);
      setTimeout(() => playSound(800, 'triangle', 0.3), 200);

      setBossFlash(true);
      setScreenShake(true);
      addFloatingText("DUO STRIKE! -85", 85, 25, '#ec4899');
      setTimeout(() => {
        setBossFlash(false);
        setScreenShake(false);
      }, 400);

      const nextBossHp = Math.max(0, bossHp - 85);
      setBossHp(nextBossHp);
      setBattleLog("🌟 DUO ULTIMATE: 'May 9th Starlight Strike' breaks through all defenses!");

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

      const damage = (isHeavyHit ? 28 : 18) + (phase * 5);
      const remainingHp = Math.max(0, playerHp - damage);
      setPlayerHp(remainingHp);
      addFloatingText(`-${damage} HP`, 35, 140, '#ef4444');

      if (remainingHp <= 0) {
        playSound(100, 'sawtooth', 0.5);
        setBattleLog("💀 Team HP hit 0! You were defeated...");
        setTimeout(() => setGameState('gameover'), 700);
      } else if (remainingHp <= 30 && !hasTriggeredReviveThisPhase) {
        setHasTriggeredReviveThisPhase(true);
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

    const isSuccess = needlePos >= 38 && needlePos <= 62;

    if (isSuccess) {
      playSound(660, 'sine', 0.2);
      addFloatingText("SWEET SPOT!", 40, 110, '#34d399');
      setCurrentTriviaIndex(Math.floor(Math.random() * triviaQuestions.length));
      setShowTriviaModal(true);
    } else {
      playSound(180, 'sawtooth', 0.3);
      addFloatingText("FAILED!", 40, 110, '#ef4444');
      setBattleLog("⚠️ Emergency needle missed! Stay strong and keep fighting!");
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
      setBattleLog("❌ Oops, that wasn't quite right! No healing this time!");
    }
    setIsTurnLocked(false);
  };

  const advancePhase = () => {
    if (phase < 3) {
      const nextPhase = phase + 1;
      setPhase(nextPhase);
      setBossHp(100);
      setPlayerHp((p) => Math.min(100, p + 25));
      setHasTriggeredReviveThisPhase(false);
      setAttackWarning("");

      if (nextPhase === 3) {
        setIsTurnLocked(true);
        setFinalBossIntro(true);
        playSound(100, 'sawtooth', 0.4);
        setTimeout(() => playSound(120, 'sawtooth', 0.4), 200);
        setTimeout(() => playSound(180, 'sawtooth', 0.5), 400);

        setTimeout(() => {
          setFinalBossIntro(false);
          setBattleLog("⚠️ FINAL STAGE: The Overthinking Phantom has awakened!");
          setIsTurnLocked(false);
        }, 1600);
      } else {
        playSound(660, 'sine', 0.2);
        setBattleLog(`🔥 BOSS DOWN! Warning: ${bosses[phase].title}!`);
        setIsTurnLocked(false);
      }
    } else {
      setIsTurnLocked(true);
      playFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => setGameState('victory'), 900);
    }
  };

  const resetCampaign = (toMainMenu = false) => {
    setPhase(1);
    setBossHp(100);
    setPlayerHp(100);
    setSynergy(0);
    setQteStep(null);
    setFinalBossIntro(false);
    setHasTriggeredReviveThisPhase(false);
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
      note: "Dating you since May 9 has been the happiest 4 months of my life. Thank you for being the sweetest partner and the best gamer ever. I love you so, so much Charisse! ❤️",
      emoji: "🎮"
    }
  ];

  return (
    <div className="w-full h-full flex items-center justify-center font-cozy text-white select-none bg-black">
      <div className={`w-full max-w-[420px] h-full flex flex-col justify-between relative bg-slate-950 border-x border-slate-800 shadow-2xl overflow-hidden ${screenShake ? 'animate-shake' : ''}`}>

        {/* ================= SCREEN 1: LANDING & BRIEFING ================= */}
        {gameState === 'landing' && (
          <div className="w-full h-full flex flex-col items-center justify-between p-6 text-center">
            <div className="w-full flex justify-between items-center pt-2">
              <span className="font-pixel text-[9px] text-pink-400 bg-pink-950/70 border border-pink-700/60 px-3 py-1 rounded-full">
                MAY 9, 2026 ➔ TODAY ❤️
              </span>
              <button 
                onClick={() => { playSound(500, 'sine', 0.05); setShowInstructions(true); }}
                className="flex items-center gap-1 text-xs text-pink-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md"
              >
                <HelpCircle size={14} /> Rules
              </button>
            </div>

            <div className="flex flex-col items-center my-auto gap-3 w-full">
              <div className="relative">
                <div className="text-6xl animate-bounce">👾💖</div>
                <Sparkles className="absolute -top-2 -right-2 text-yellow-300 animate-spin" size={24} />
              </div>

              <div>
                <h1 className="font-pixel text-base text-pink-200 tracking-wider leading-relaxed">
                  HAPPY 4 MONTHS!<br />OUR ANNIVERSARY QUEST
                </h1>
                <p className="text-xs text-pink-300/80 mt-1">
                  Dating Since May 9, 2026 • 123 Days of Love
                </p>
              </div>

              {/* Redesigned 2-Row Stacked Quest Intel Card */}
              <div className="bg-purple-950/80 border-2 border-purple-800 rounded-2xl p-4 w-full max-w-[340px] text-left shadow-2xl backdrop-blur-md space-y-2.5">
                <div className="font-pixel text-[8px] text-yellow-300 border-b border-purple-800/80 pb-2 flex items-center justify-between tracking-wider">
                  <span>QUEST COMBOS</span>
                  <span className="text-pink-300">INPUT SEQUENCE</span>
                </div>

                {/* Level 1 */}
                <div className="bg-purple-900/40 p-2.5 rounded-xl border border-purple-700/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-pink-100 font-bold">Ego Monster</span>
                    <span className="font-pixel text-[8px] text-pink-400">LV.1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-[8px] text-pink-300 bg-pink-950 border border-pink-700/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ⚡ TAP
                    </span>
                  </div>
                </div>

                {/* Level 2 */}
                <div className="bg-purple-900/40 p-2.5 rounded-xl border border-purple-700/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-pink-100 font-bold">Hangry Goblin</span>
                    <span className="font-pixel text-[8px] text-emerald-400">LV.2</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-[8px] text-pink-300 bg-pink-950 border border-pink-700/70 px-2 py-0.5 rounded-md">
                      ⚡ TAP
                    </span>
                    <span className="text-xs text-purple-400 font-bold">+</span>
                    <span className="font-pixel text-[8px] text-emerald-300 bg-emerald-950 border border-emerald-700/70 px-2 py-0.5 rounded-md">
                      💓 MASH
                    </span>
                  </div>
                </div>

                {/* Level 3 */}
                <div className="bg-purple-900/40 p-2.5 rounded-xl border border-purple-700/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-pink-100 font-bold">Overthink Phantom</span>
                    <span className="font-pixel text-[8px] text-purple-400">LV.3</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-[8px] text-pink-300 bg-pink-950 border border-pink-700/70 px-1.5 py-0.5 rounded-md">
                      ⚡ TAP
                    </span>
                    <span className="text-xs text-purple-400 font-bold">+</span>
                    <span className="font-pixel text-[8px] text-emerald-300 bg-emerald-950 border border-emerald-700/70 px-1.5 py-0.5 rounded-md">
                      💓 MASH
                    </span>
                    <span className="text-xs text-purple-400 font-bold">+</span>
                    <span className="font-pixel text-[8px] text-purple-300 bg-purple-950 border border-purple-700/70 px-1.5 py-0.5 rounded-md">
                      🪄 SWIPE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playSound(440, 'triangle', 0.15);
                setGameState('battle');
              }}
              className="w-full font-pixel text-xs bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 py-4 rounded-xl shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 tracking-wider transform active:scale-95 transition-all"
            >
              START BATTLE <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ================= INSTRUCTIONS MODAL ================= */}
        {showInstructions && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-slate-900 border-2 border-pink-500/80 rounded-2xl p-5 max-w-[320px] w-full text-left relative shadow-2xl">
              <button 
                onClick={() => setShowInstructions(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-2 font-pixel text-xs text-pink-300 mb-3">
                <ShieldCheck size={18} className="text-pink-400" />
                <span>COMBO RULES</span>
              </div>
              
              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <p>🎯 <b>LEVEL 1:</b> Tap the circle fast before it closes!</p>
                <p>💓 <b>LEVEL 2:</b> Tap the circle + rapidly mash the button to fill the heart meter in time!</p>
                <p>🪄 <b>LEVEL 3:</b> Circle tap + Mash heart + rapidly swipe left and right to unleash the final strike!</p>
                <p>⚠️ Missing any step fails your attack and the monster attacks back!</p>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full mt-4 font-pixel text-[10px] bg-pink-600 hover:bg-pink-700 py-2.5 rounded-lg text-center"
              >
                GOT IT!
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: BATTLE ARENA ================= */}
        {gameState === 'battle' && (
          <div className="w-full h-full flex flex-col justify-between relative">
            
            <div className="relative flex-1 w-full bg-slate-900">
              <canvas
                ref={canvasRef}
                width={160}
                height={240}
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />

              <div className="absolute top-3 left-3 bg-black/80 border border-slate-700 px-2.5 py-1 rounded-md font-pixel text-[8px] text-yellow-300">
                STAGE {phase}/3
              </div>

              <div className="absolute top-3 right-3 bg-black/85 border border-slate-700 p-2 rounded-lg w-44 shadow-lg">
                <div className="flex justify-between font-pixel text-[8px] text-pink-300 mb-1">
                  <span>{currentBoss.name}</span>
                  <span>{bossHp}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
                    style={{ width: `${bossHp}%` }}
                  />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 bg-black/85 border border-slate-700 p-2 rounded-lg w-44 shadow-lg">
                <div className="flex justify-between font-pixel text-[8px] text-emerald-400 mb-1">
                  <span className="flex items-center gap-1">
                    <HeartPulse size={10} className={playerHp <= 30 ? 'text-red-400 animate-spin' : ''} />
                    OUR TEAM HP
                  </span>
                  <span className={playerHp <= 30 ? 'text-red-400 animate-pulse font-bold' : ''}>{playerHp}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${playerHp <= 30 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${playerHp}%` }}
                  />
                </div>
              </div>

              {/* Dramatic Level 3 Flash Intro */}
              {finalBossIntro && (
                <div className="absolute inset-0 z-50 bg-red-950 flex flex-col items-center justify-center animate-pulse text-center p-6">
                  <div className="absolute inset-0 bg-red-600/30 animate-ping" />
                  <span className="font-pixel text-[9px] text-yellow-400 bg-black/80 px-3 py-1 rounded-full border border-yellow-500 mb-3 animate-bounce">
                    ⚠️ WARNING: FINAL TRIAL ⚠️
                  </span>
                  <h2 className="font-pixel text-base text-white tracking-widest leading-relaxed drop-shadow-[0_4px_10px_rgba(239,68,68,0.8)]">
                    OVERTHINK PHANTOM<br />AWAKENED!
                  </h2>
                  <p className="text-xs text-pink-200 mt-2 font-bold animate-pulse">
                    Max combo sequence required!
                  </p>
                </div>
              )}

              {/* Step 1: Timed Circle */}
              {qteStep === 'timed' && (
                <div 
                  onClick={handleQTETimedTap}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[1px] cursor-pointer"
                >
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-4 border-yellow-400 animate-pulse flex items-center justify-center font-pixel text-[9px] text-yellow-300">
                      TAP!
                    </div>
                    <div 
                      className="absolute rounded-full border-4 border-pink-400 pointer-events-none"
                      style={{
                        width: '56px',
                        height: '56px',
                        transform: `scale(${qteScale})`,
                      }}
                    />
                  </div>
                  <span className="font-pixel text-[8px] text-pink-200 mt-2 bg-black/80 px-3 py-1 rounded border border-pink-500/50">
                    TAP FAST BEFORE IT CLOSES!
                  </span>
                </div>
              )}

              {/* Step 2: Rapid Mash Heart */}
              {qteStep === 'mash' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[1px] p-4">
                  <div className="bg-slate-900 border-2 border-pink-500 rounded-2xl p-4 flex flex-col items-center max-w-[260px] w-full text-center shadow-2xl">
                    <span className="font-pixel text-[8px] text-yellow-300 mb-1">STEP 2: RAPID MASH!</span>
                    <p className="text-xs text-pink-200 mb-3 font-semibold">Tap repeatedly to fill the heart!</p>

                    <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                      <div 
                        className="w-16 h-16 rounded-full bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center overflow-hidden transition-all"
                        style={{ transform: `scale(${1 + (mashCount / 8) * 0.2})` }}
                      >
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-pink-600 to-rose-400 transition-all duration-75"
                          style={{ height: `${(mashCount / 8) * 100}%` }}
                        />
                        <span className="relative z-10 text-2xl animate-pulse">💖</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                      <div 
                        className="bg-amber-400 h-full transition-all duration-75"
                        style={{ width: `${mashTimer}%` }}
                      />
                    </div>

                    <button
                      onClick={handleMashTap}
                      className="w-full font-pixel text-[9px] bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 py-3 rounded-xl shadow-lg shadow-pink-500/30 active:scale-90 transition-transform"
                    >
                      TAP! TAP! ({mashCount}/8) 💓
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Rapid Swipe */}
              {qteStep === 'swipe' && (
                <div 
                  onTouchMove={(e) => handleSwipeMove(e.touches[0].clientX)}
                  onMouseMove={(e) => handleSwipeMove(e.clientX)}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] p-4 cursor-ew-resize"
                >
                  <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl p-4 flex flex-col items-center max-w-[270px] w-full text-center shadow-2xl pointer-events-none">
                    <span className="font-pixel text-[8px] text-yellow-300 mb-1">FINAL STEP: SWIPE SLASH!</span>
                    <p className="text-xs text-purple-200 mb-2 font-semibold">Swipe left & right rapidly!</p>

                    <div className="text-4xl my-2 animate-pulse">🪄✨</div>

                    <div className="flex gap-2 my-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div 
                          key={s} 
                          className={`w-5 h-5 rounded-full border border-purple-400 flex items-center justify-center text-[10px] ${
                            swipeCount >= s ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          ✓
                        </div>
                      ))}
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                      <div 
                        className="bg-amber-400 h-full transition-all duration-75"
                        style={{ width: `${swipeTimer}%` }}
                      />
                    </div>
                    <span className="font-pixel text-[7.5px] text-purple-300/80 mt-2">SWIPE SCREEN NOW! ➔ ⬅️</span>
                  </div>
                </div>
              )}

              {/* Critical Health: Needle Mini-game */}
              {showNeedleMinigame && (
                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
                  <div className="bg-slate-900 border-2 border-red-500/90 rounded-2xl p-5 w-full max-w-[280px] flex flex-col items-center text-center shadow-2xl">
                    <span className="font-pixel text-[9px] text-red-400 flex items-center gap-1 bg-red-950/80 px-2.5 py-1 rounded-full border border-red-500/50 mb-2">
                      <AlertTriangle size={12} /> CRITICAL HEALTH ALERT!
                    </span>
                    <p className="text-xs text-pink-100 font-semibold mb-3">
                      Stop the needle in the green center to trigger an emergency heal!
                    </p>

                    <div className="relative w-14 h-48 bg-slate-950 border-2 border-slate-700 rounded-full overflow-hidden my-2 flex items-center justify-center shadow-inner">
                      <div className="absolute top-[38%] h-[24%] w-full bg-emerald-500/30 border-y-2 border-emerald-400 flex items-center justify-center">
                        <span className="font-pixel text-[7px] text-emerald-300">HEAL</span>
                      </div>

                      <div 
                        className="absolute left-1 right-1 h-3 bg-rose-500 border border-white rounded-full shadow-lg shadow-rose-500/80 transition-none"
                        style={{ top: `${needlePos}%` }}
                      />
                    </div>

                    <button
                      onClick={handleStopNeedle}
                      className="w-full mt-3 font-pixel text-[10px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-xl shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                    >
                      STOP NEEDLE! 🎯
                    </button>
                  </div>
                </div>
              )}

              {/* Critical Health: Trivia Modal */}
              {showTriviaModal && (
                <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-slate-900 border-2 border-pink-500 rounded-2xl p-5 w-full max-w-[310px] text-center shadow-2xl">
                    <div className="font-pixel text-[9px] text-pink-400 bg-pink-950/80 px-3 py-1 rounded-full inline-flex items-center gap-1 mb-2 border border-pink-600/50">
                      <Sparkles size={12} className="text-yellow-300" /> RAY'S LOVE TRIVIA
                    </div>
                    <h3 className="text-sm font-bold text-pink-100 mb-1 leading-snug">
                      {triviaQuestions[currentTriviaIndex].q}
                    </h3>
                    <p className="text-[10px] text-pink-300/80 mb-3">Answer correctly to heal +50 HP!</p>

                    <div className="grid grid-cols-1 gap-2">
                      {triviaQuestions[currentTriviaIndex].options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTriviaAnswer(opt)}
                          className="w-full bg-purple-950/70 hover:bg-pink-600 border border-purple-700/70 hover:border-pink-400 py-2.5 px-3 rounded-xl text-xs text-white font-semibold active:scale-95 transition-all text-left flex items-center justify-between"
                        >
                          <span>{opt}</span>
                          <span className="font-pixel text-[8px] text-pink-300/60">[{idx + 1}]</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Ineffective / Missed Attack Alert */}
            {attackWarning && (
              <div className="absolute top-14 left-3 right-3 z-30 bg-red-600/95 text-white font-pixel text-[7.5px] leading-tight px-3 py-2 rounded-xl border border-red-300 flex items-center justify-center gap-2 text-center shadow-2xl animate-bounce">
                <AlertTriangle size={14} className="shrink-0 text-yellow-300" />
                <span>{attackWarning}</span>
              </div>
            )}

            {/* Bottom Tactical Deck */}
            <div className="h-[46%] bg-gradient-to-b from-slate-900 via-slate-950 to-black border-t-2 border-slate-700 p-3 flex flex-col justify-between">
              
              <div className="bg-black/80 border border-slate-800 rounded-xl p-2 min-h-[42px] flex items-center justify-center text-center">
                <p className="text-xs text-pink-100 font-semibold leading-snug">
                  {battleLog}
                </p>
              </div>

              {/* Synergy Meter */}
              <div className="flex items-center gap-2 px-1">
                <span className="font-pixel text-[8px] text-amber-300 flex items-center gap-1">
                  <Zap size={10} /> SYNERGY:
                </span>
                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-300"
                    style={{ width: `${synergy}%` }}
                  />
                </div>
                <button
                  disabled={synergy < 100 || isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || finalBossIntro}
                  onClick={executeUltimate}
                  className={`font-pixel text-[8px] px-2.5 py-1 rounded-md transition-all ${
                    synergy >= 100 
                      ? 'bg-amber-400 text-slate-950 font-bold animate-bounce shadow-lg shadow-amber-400/50 cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                  }`}
                >
                  ULTIMATE!
                </button>
              </div>

              {/* 4-Button Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || finalBossIntro}
                  onClick={() => initiateAttack('comm')}
                  className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 py-2.5 px-2 rounded-xl flex items-center justify-start gap-2 active:scale-95 transition-all shadow-md shadow-pink-600/30 text-left"
                >
                  <span className="text-xl">💌</span>
                  <div>
                    <div className="font-pixel text-[8px]">COMMUNICATE</div>
                    <div className="text-[10px] text-pink-200/80">Power of Love</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || finalBossIntro}
                  onClick={() => initiateAttack('food')}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 py-2.5 px-2 rounded-xl flex items-center justify-start gap-2 active:scale-95 transition-all shadow-md shadow-emerald-600/30 text-left"
                >
                  <span className="text-xl">🍔</span>
                  <div>
                    <div className="font-pixel text-[8px]">BURGER & TEA</div>
                    <div className="text-[10px] text-emerald-200/80">Snack Attack</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || finalBossIntro}
                  onClick={() => initiateAttack('hug')}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 py-2.5 px-2 rounded-xl flex items-center justify-start gap-2 active:scale-95 transition-all shadow-md shadow-purple-600/30 text-left"
                >
                  <span className="text-xl">🫂</span>
                  <div>
                    <div className="font-pixel text-[8px]">WARM HUG</div>
                    <div className="text-[10px] text-purple-200/80">Reassurance</div>
                  </div>
                </button>

                <button
                  disabled={isTurnLocked || qteStep || showNeedleMinigame || showTriviaModal || finalBossIntro}
                  onClick={executeHeal}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 py-2.5 px-2 rounded-xl flex items-center justify-start gap-2 active:scale-95 transition-all shadow-md shadow-sky-600/30 text-left"
                >
                  <span className="text-xl">🧋</span>
                  <div>
                    <div className="font-pixel text-[8px]">WARM MILK TEA</div>
                    <div className="text-[10px] text-sky-200/80">+35 Team HP</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= SCREEN 3: GAME OVER ================= */}
        {gameState === 'gameover' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-black/95 animate-fade-in gap-5">
            <Skull size={48} className="text-red-500 animate-bounce" />
            <div>
              <h2 className="font-pixel text-lg text-red-500 tracking-wider">GAME OVER</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-[260px] leading-relaxed">
                The monster overwhelmed you! Remember to match its weakness and complete the attack combo in time!
              </p>
            </div>

            <div className="w-full max-w-[280px] flex flex-col gap-3">
              <button
                onClick={() => resetCampaign(false)}
                className="w-full font-pixel text-xs bg-red-600 hover:bg-red-500 py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> TRY AGAIN RIGHT AWAY
              </button>

              <button
                onClick={() => resetCampaign(true)}
                className="w-full font-pixel text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <HelpCircle size={14} /> MAIN MENU & READ RULES
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 4: VICTORY & REWARD ================= */}
        {gameState === 'victory' && (
          <div className="w-full h-full flex flex-col items-center justify-between p-5 text-center overflow-y-auto">
            
            <div className="w-full flex flex-col items-center pt-1">
              <span className="font-pixel text-[9px] text-yellow-300 bg-yellow-950/70 border border-yellow-600/60 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <Trophy size={12} /> CAMPAIGN CLEARED!
              </span>
              <h2 className="font-pixel text-sm text-pink-200 mt-2">LEVEL 4 ACQUIRED</h2>
              <p className="text-xs text-pink-300/80 mt-0.5">Happy 4-Month Anniversary, Charisse! ❤️</p>
            </div>

            <div 
              onClick={() => setActivePolaroid((prev) => (prev + 1) % polaroids.length)}
              className="bg-white p-3 pt-3 pb-4 rounded-xl text-slate-800 shadow-2xl max-w-[280px] w-full my-2 transform hover:rotate-1 transition-all cursor-pointer border border-slate-200"
            >
              <div className="w-full h-40 bg-pink-100 rounded-lg flex flex-col items-center justify-center p-4 border border-slate-200 text-center">
                <span className="text-4xl mb-2">{polaroids[activePolaroid].emoji}</span>
                <p className="text-xs text-slate-700 font-semibold italic leading-relaxed">
                  "{polaroids[activePolaroid].note}"
                </p>
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs font-bold text-slate-800">{polaroids[activePolaroid].caption}</span>
                <span className="text-[10px] text-slate-400 font-pixel">[{activePolaroid + 1}/3] ➔</span>
              </div>
            </div>

            <div className="w-full max-w-[300px] bg-slate-900 border-2 border-amber-400/80 rounded-2xl p-3.5 text-left relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between text-amber-300 font-pixel text-[9px] mb-1.5">
                <span className="flex items-center gap-1"><Award size={12} /> ANNIVERSARY PASS</span>
                <span>SINCE MAY 9, 2026</span>
              </div>

              {!ticketScratched ? (
                <div 
                  onClick={() => {
                    setTicketScratched(true);
                    playSound(523, 'sine', 0.2);
                    confetti({ particleCount: 70, spread: 60 });
                  }}
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-xl p-4 text-center cursor-pointer active:scale-95 transition-all shadow-inner"
                >
                  <p className="font-pixel text-[10px] text-slate-950 font-bold">✨ TAP TO SCRATCH OFF ✨</p>
                  <p className="text-[10px] text-slate-900/80 mt-1 font-semibold">Reveal Tonight's Date Plan</p>
                </div>
              ) : (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs font-bold text-pink-300">🎟️ ALL-INCLUSIVE DATE NIGHT</p>
                  <p className="text-xs text-slate-300 mt-1">Burgers + Milk Tea + Her Favorite Treat</p>
                  <p className="text-[10px] text-emerald-400 font-pixel mt-2">I LOVE YOU SO MUCH, CHARISSE! ❤️</p>
                </div>
              )}
            </div>

            <button
              onClick={() => resetCampaign(false)}
              className="text-[10px] text-pink-300/70 hover:text-white flex items-center gap-1 py-1"
            >
              <RefreshCw size={12} /> Play Quest Again
            </button>

          </div>
        )}

      </div>
    </div>
  );
}