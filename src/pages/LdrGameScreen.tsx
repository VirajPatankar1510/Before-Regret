import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Sparkles, Mic, MicOff, Wind, Share2, Copy, Check, ArrowLeft, 
  Smile, Trophy, Users, Volume2, VolumeX, Download, RefreshCw, Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

interface LdrGameScreenProps {
  sessionId?: string;
  setScreen: (screen: { type: string; slug?: string }) => void;
  currentUser: any;
  showToast: (message: string) => void;
}

// Relatable stress-relief/delulu messages
const RELATABLE_BUBBLE_MESSAGES = [
  "I miss you so much I'm talking to your hoodie.",
  "Your sweater is technically my sweater now.",
  "In my head, we're already eating ramen together.",
  "99% delulu, 1% waiting for your text.",
  "Distance means nothing when you're this rent-free in my mind.",
  "My bed is too big without you.",
  "Currently hugging my pillow thinking it's you.",
  "Blow a kiss back!",
  "Sending a virtual forehead kiss.",
  "We are 100% truelulu.",
  "Who needs a physical hug when you have this bubble?",
  "Warning: This bubble contains high doses of affection.",
  "Let's be delulu together forever.",
  "I checked our compatibility and we are 120% compatible.",
  "Currently planning our future house in detail.",
  "My love for you is as infinite as our screen time.",
  "Counting down the days like it's a launch mission.",
  "You're my favorite notification.",
  "I'm 98% sure we're soulmates, 2% sure we're just both crazy.",
  "My camera roll is 90% screenshots of our video calls."
];

interface FloatingBubble {
  id: string;
  text: string;
  sender: string;
  x: number; // percentage width
  size: number; // size in px
  color: string;
  delay: number;
}

interface FloatingHeart {
  id: string;
  x: number;
  size: number;
  rotation: number;
  color: string;
}

interface FloatingPopText {
  id: string;
  x: string;
  text: string;
}

// Mood Ring Sky configurations
const MOODS_DATA = [
  { id: 'calm', name: '🌌 Calm Lavender', classes: 'from-[#0F172A] via-[#1E1B4B] to-[#3B0764]' },
  { id: 'romantic', name: '💖 Romantic Rose', classes: 'from-[#4C0519] via-[#881337] to-[#1E1B4B]' },
  { id: 'playful', name: '👾 Playful Neon', classes: 'from-[#172554] via-[#3B0764] to-[#1E1B4B]' },
  { id: 'cozy', name: '🌅 Cozy Sunset', classes: 'from-[#451A03] via-[#78350F] to-[#1E1B4B]' },
  { id: 'cosmic', name: '☄️ Cosmic Stardust', classes: 'from-[#030712] via-[#1F2937] to-[#111827]' },
];

export default function LdrGameScreen({ sessionId, setScreen, currentUser, showToast }: LdrGameScreenProps) {
  // Setup state
  const [partnerAName, setPartnerAName] = useState('');
  const [partnerBName, setPartnerBName] = useState('');
  const [myName, setMyName] = useState('');
  const [role, setRole] = useState<'A' | 'B' | null>(null);

  // Gameplay state
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [presenceActive, setPresenceActive] = useState(false);

  // Interaction options
  const [customText, setCustomText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [micActive, setMicActive] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [isInflating, setIsInflating] = useState(false);
  const [inflationProgress, setInflationProgress] = useState(0);

  // Ref to always have the latest bubble blower function in requestAnimationFrame
  const handleReleaseBubbleRef = useRef<any>(null);

  // Floating elements arrays
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  // Popping Twist states
  const [poppedCount, setPoppedCount] = useState(0);
  const [popTexts, setPopTexts] = useState<FloatingPopText[]>([]);

  // Links and UI states
  const [copiedLink, setCopiedLink] = useState(false);
  const [certificateGenerating, setCertificateGenerating] = useState(false);

  // Refs for mic stream & detection loop
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micIntervalId = useRef<number | null>(null);
  const lastBlowTriggerTime = useRef<number>(0);
  const prevEventTime = useRef<number>(0);

  // Web Audio sound generator
  const playSynthSound = (type: 'blow' | 'pop' | 'heart' | 'success') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'blow') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.6);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'heart') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'success') {
        const chords = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        chords.forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, now + i * 0.08);
          g.gain.setValueAtTime(0.08, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.5);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.5);
        });
      }
    } catch (err) {
      console.error("Synthesizer audio error:", err);
    }
  };

  // Create a new session (Partner A)
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerAName.trim()) return;

    setLoading(true);
    const newSessionId = 'ldr_' + Math.random().toString(36).substring(2, 9);
    const finalMyName = partnerAName.trim();

    const initialData = {
      id: newSessionId,
      createdAt: new Date().toISOString(),
      partnerAName: finalMyName,
      partnerBName: '',
      stressLevel: 100,
      collectiveHearts: 0,
      lastEvent: {
        type: 'create',
        sender: finalMyName,
        senderUid: currentUser?.uid || 'anonymous_ldr_a',
        text: 'Couple Breath Chamber opened.',
        timestamp: Date.now()
      }
    };

    try {
      await setDoc(doc(db, 'ldr-sessions', newSessionId), initialData);
      setMyName(finalMyName);
      setRole('A');
      setScreen({ type: 'ldr_game', slug: newSessionId });
    } catch (err) {
      console.error("Error creating session in Firestore:", err);
      showToast("❌ Unable to provision Breath Chamber in the cloud database.");
    } finally {
      setLoading(false);
    }
  };

  // Join existing session as Partner B or recognize current role
  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerBName.trim() || !sessionId) return;

    setLoading(true);
    const finalPartnerB = partnerBName.trim();
    try {
      const docRef = doc(db, 'ldr-sessions', sessionId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, {
          partnerBName: finalPartnerB,
          lastEvent: {
            type: 'join',
            sender: finalPartnerB,
            senderUid: currentUser?.uid || 'anonymous_ldr_b',
            text: `${finalPartnerB} connected to the chamber! ⚡`,
            timestamp: Date.now()
          }
        });
        setMyName(finalPartnerB);
        setRole('B');
      }
    } catch (err) {
      console.error("Error joining session in Firestore:", err);
      showToast("❌ Unable to connect your avatar to this Breath Chamber.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time Firestore sync listener
  useEffect(() => {
    if (!sessionId) {
      setSessionActive(false);
      setSessionData(null);
      return;
    }

    const docRef = doc(db, 'ldr-sessions', sessionId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessionData(data);
        setSessionActive(true);

        // Determine client role if not set manually
        if (!role) {
          const guestUid = currentUser?.uid;
          if (data.lastEvent?.senderUid === guestUid) {
            setRole(data.partnerBName ? 'B' : 'A');
            setMyName(data.partnerBName ? data.partnerBName : data.partnerAName);
          } else if (data.partnerBName && guestUid) {
            // fallback guessing
            setRole('B');
            setMyName(data.partnerBName);
          }
        }

        // Presence awareness badge (are both names filled?)
        const bothNamesPresent = !!data.partnerAName && !!data.partnerBName;
        setPresenceActive(bothNamesPresent);

        // Check for auto-trigger of Blowing Battle Duel if both are online & blew in last 3.5s
        const battle = data.battleState;
        if (bothNamesPresent && (!battle || battle.status === 'idle') && role === 'A') {
          const lastA = data.lastBlowA || 0;
          const lastB = data.lastBlowB || 0;
          const blowDiff = Math.abs(lastA - lastB);
          if (lastA > 0 && lastB > 0 && blowDiff < 3500) {
            updateDoc(docRef, {
              battleState: {
                status: 'countdown',
                pAScore: 0,
                pBScore: 0,
                winner: null,
                startedAt: Date.now()
              }
            }).catch(console.error);
          }
        }

        // Synchronized Event Dispatcher
        const lastEvent = data.lastEvent;
        if (lastEvent && lastEvent.timestamp > prevEventTime.current) {
          prevEventTime.current = lastEvent.timestamp;

          // Trigger local animation only if event is fresh
          if (lastEvent.type === 'blow') {
            triggerFloatingBubble(
              lastEvent.text,
              lastEvent.sender,
              lastEvent.senderUid === currentUser?.uid,
              lastEvent.bubbleId,
              lastEvent.x,
              lastEvent.size,
              lastEvent.color
            );
          } else if (lastEvent.type === 'pop') {
            if (lastEvent.senderUid !== currentUser?.uid) {
              handlePopBubble(lastEvent.bubbleId, lastEvent.x, true);
            }
          } else if (lastEvent.type === 'heart') {
            triggerHeartExplosion(lastEvent.senderUid === currentUser?.uid);
          } else if (lastEvent.type === 'battle_blow') {
            const side = lastEvent.text; // 'A' or 'B'
            triggerHeartExplosion(lastEvent.senderUid === currentUser?.uid, side as 'A' | 'B');
          } else if (lastEvent.type === 'battle_win') {
            playSynthSound('success');
            showToast(`🏆 ${lastEvent.sender} won the Blowing Battle!`);
          } else if (lastEvent.type === 'join' && lastEvent.senderUid !== currentUser?.uid) {
            showToast(`💞 ${lastEvent.sender} has entered your Breath Chamber!`);
            playSynthSound('success');
          }
        }
      } else {
        setSessionActive(false);
        setSessionData(null);
      }
    }, (error) => {
      console.error("Firestore onSnapshot subscription error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, role, currentUser]);

  // Bubble floating trigger
  const triggerFloatingBubble = (
    text: string,
    sender: string,
    isLocal: boolean,
    bubbleId?: string,
    xPos?: number,
    sizeVal?: number,
    colorVal?: string
  ) => {
    if (!isLocal) {
      playSynthSound('blow');
    }
    const newBubble: FloatingBubble = {
      id: bubbleId || Math.random().toString(36).substring(2, 9),
      text,
      sender,
      x: xPos !== undefined ? xPos : (15 + Math.random() * 70), // Keep within safety range
      size: sizeVal !== undefined ? sizeVal : (130 + Math.random() * 80),
      color: colorVal || getRandomPastelColor(),
      delay: Math.random() * 0.2
    };

    setBubbles(prev => [...prev, newBubble]);
  };

  // Heart burst cascade trigger (supports side-by-side bounding)
  const triggerHeartExplosion = (isLocal: boolean, side?: 'A' | 'B') => {
    if (!isLocal) {
      playSynthSound('heart');
    }
    const count = side ? 7 : 12;
    const newHearts: FloatingHeart[] = Array.from({ length: count }).map((_, i) => {
      let xPos = 20 + Math.random() * 60;
      if (side === 'A') {
        xPos = 5 + Math.random() * 40; // Restrict to Left half
      } else if (side === 'B') {
        xPos = 55 + Math.random() * 40; // Restrict to Right half
      }
      return {
        id: `heart_${Math.random().toString(36).substring(2, 9)}_${i}`,
        x: xPos,
        size: (side ? 16 : 20) + Math.random() * 20,
        rotation: -30 + Math.random() * 60,
        color: ['#EC4899', '#F43F5E', '#D946EF', '#F472B6', '#FF85A1'][Math.floor(Math.random() * 5)]
      };
    });

    setHearts(prev => [...prev, ...newHearts]);
    // Clean up hearts shortly after
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
    }, 4000);
  };

  // Helper for soap bubble hues
  const getRandomPastelColor = () => {
    const gradients = [
      'from-pink-300/40 via-purple-300/30 to-blue-300/40',
      'from-emerald-300/40 via-teal-300/30 to-blue-300/40',
      'from-indigo-300/40 via-pink-300/30 to-purple-300/40',
      'from-yellow-300/40 via-orange-300/30 to-pink-300/40',
      'from-violet-300/40 via-indigo-300/30 to-cyan-300/40'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  // Pop a bubble manually on click (very satisfying)
  const handlePopBubble = async (bubbleId: string, xPos: number, isFromPartner: boolean = false) => {
    playSynthSound('pop');
    setBubbles(prev => prev.filter(b => b.id !== bubbleId));
    setPoppedCount(prev => prev + 1);

    // Floating text label at pop site
    const popId = Math.random().toString(36).substring(2, 9);
    const popLabel = isFromPartner ? '💥 Partner Popped!' : '💥 Pop!';
    setPopTexts(prev => [...prev, { id: popId, x: `${xPos}%`, text: popLabel }]);
    setTimeout(() => {
      setPopTexts(prev => prev.filter(p => p.id !== popId));
    }, 1000);

    // Spawn mini heart cluster at bubble pop location
    const popHearts = Array.from({ length: 5 }).map((_, i) => ({
      id: `pop_heart_${Math.random().toString(36).substring(2, 9)}_${i}`,
      x: Math.min(100, Math.max(0, xPos - 6 + Math.random() * 12)),
      size: 15 + Math.random() * 10,
      rotation: -20 + Math.random() * 40,
      color: ['#EC4899', '#F43F5E', '#D946EF', '#FF85A1'][Math.floor(Math.random() * 4)]
    }));
    setHearts(prev => [...prev, ...popHearts]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !popHearts.some(nh => nh.id === h.id)));
    }, 2000);

    // Sync pop to Firestore if it was a local click action
    if (!isFromPartner && sessionId) {
      try {
        const docRef = doc(db, 'ldr-sessions', sessionId);
        await updateDoc(docRef, {
          lastEvent: {
            type: 'pop',
            sender: myName || 'Partner',
            senderUid: currentUser?.uid || 'anonymous',
            bubbleId,
            x: xPos,
            timestamp: Date.now()
          }
        });
      } catch (err) {
        console.error("Error syncing bubble pop to Firestore:", err);
      }
    }
  };

  // Register a competitive battle blow (Who Fills Fastest)
  const registerBattleBlow = async () => {
    if (!sessionId || !sessionData) return;
    const battle = sessionData.battleState;
    if (!battle || battle.status !== 'active' || !role) return;

    const currentScore = role === 'A' ? (battle.pAScore || 0) : (battle.pBScore || 0);
    const nextScore = currentScore + 1;
    const hasWon = nextScore >= 15;

    playSynthSound('heart');

    try {
      const docRef = doc(db, 'ldr-sessions', sessionId);
      const updates: any = {
        [`battleState.p${role}Score`]: nextScore,
        lastEvent: {
          type: 'battle_blow',
          sender: myName || 'Partner',
          senderUid: currentUser?.uid || 'anonymous',
          text: role, // 'A' or 'B'
          timestamp: Date.now()
        }
      };

      if (hasWon) {
        updates['battleState.status'] = 'ended';
        updates['battleState.winner'] = role;
        updates.lastEvent = {
          type: 'battle_win',
          sender: myName || 'Partner',
          senderUid: currentUser?.uid || 'anonymous',
          text: role, // 'A' or 'B' won
          timestamp: Date.now()
        };
      }

      await updateDoc(docRef, updates);
    } catch (err) {
      console.error("Error registering battle blow:", err);
    }
  };

  // Blow bubble action (writes to Firestore)
  const handleReleaseBubble = async (textToUse?: string) => {
    if (!sessionId || !sessionData) return;

    // Check if both partners are inside the chamber before blowing
    const bothNamesPresent = !!sessionData.partnerAName && !!sessionData.partnerBName;
    if (!bothNamesPresent) {
      showToast("⚠️ Waiting for your partner to enter the chamber before you can blow bubbles!");
      return;
    }

    // Check if the competitive battle duel is currently active
    const isBattleActive = sessionData?.battleState?.status === 'active';
    if (isBattleActive) {
      await registerBattleBlow();
      return;
    }

    let text = textToUse || customText.trim();
    if (!text) {
      // Pick random viral delulu text
      text = RELATABLE_BUBBLE_MESSAGES[Math.floor(Math.random() * RELATABLE_BUBBLE_MESSAGES.length)];
    }

    playSynthSound('blow');
    const sender = myName || 'Partner';
    const fieldToUpdate = role === 'A' ? 'lastBlowA' : 'lastBlowB';

    // Pre-calculate synchronized properties
    const bubbleId = Math.random().toString(36).substring(2, 9);
    const x = 15 + Math.random() * 70;
    const size = 130 + Math.random() * 80;
    const color = getRandomPastelColor();

    try {
      const docRef = doc(db, 'ldr-sessions', sessionId);
      await updateDoc(docRef, {
        [fieldToUpdate]: Date.now(),
        lastEvent: {
          type: 'blow',
          sender,
          senderUid: currentUser?.uid || 'anonymous',
          text,
          bubbleId,
          x,
          size,
          color,
          timestamp: Date.now(),
          isDoubleBlow: false
        }
      });
      setCustomText('');
    } catch (err) {
      console.error("Error releasing bubble to Firestore:", err);
    }
  };

  useEffect(() => {
    handleReleaseBubbleRef.current = handleReleaseBubble;
  }, [handleReleaseBubble]);

  // Synchronized countdown step for battle
  useEffect(() => {
    if (!sessionId || role !== 'A' || !sessionData) return;
    const battle = sessionData.battleState;
    if (!battle || battle.status !== 'countdown') return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - (battle.startedAt || 0);
      if (elapsed >= 3000) {
        clearInterval(timer);
        const docRef = doc(db, 'ldr-sessions', sessionId);
        updateDoc(docRef, {
          'battleState.status': 'active'
        }).catch(console.error);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [sessionId, role, sessionData]);

  // Auto reset finished battle after 8 seconds
  useEffect(() => {
    if (!sessionId || role !== 'A' || !sessionData) return;
    const battle = sessionData.battleState;
    if (!battle || battle.status !== 'ended') return;

    const timeout = setTimeout(() => {
      const docRef = doc(db, 'ldr-sessions', sessionId);
      updateDoc(docRef, {
        'battleState.status': 'idle',
        'battleState.pAScore': 0,
        'battleState.pBScore': 0,
        'battleState.winner': null
      }).catch(console.error);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [sessionId, role, sessionData]);

  // Active mic level detection routine
  const toggleMicDetection = async () => {
    if (micActive) {
      // Turn off mic
      stopMic();
    } else {
      // Request mic permission and initialize Analyser Node
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        setMicActive(true);
        setMicPermissionGranted(true);
        setMicPermissionDenied(false);
        showToast("🎙️ Microphone blow detector calibrated! Blow near your mic.");

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Polling detection
        const checkLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Breathe/blow triggers peak energy at low frequencies (indices 0 to 8)
          let lowFreqSum = 0;
          for (let i = 0; i < 8; i++) {
            lowFreqSum += dataArray[i];
          }
          const avgLowFreq = lowFreqSum / 8;

          // If avg low frequency energy is above sound threshold
          if (avgLowFreq > 130) {
            const now = Date.now();
            // 1.5s Cooldown to avoid multi-triggering
            if (now - lastBlowTriggerTime.current > 1800) {
              lastBlowTriggerTime.current = now;
              setIsInflating(true);
              setInflationProgress(100);
              
              // Release a randomized cute bubble via the latest ref closure
              setTimeout(() => {
                if (handleReleaseBubbleRef.current) {
                  handleReleaseBubbleRef.current();
                }
                setIsInflating(false);
                setInflationProgress(0);
              }, 600);
            }
          }
          micIntervalId.current = requestAnimationFrame(checkLevel);
        };

        micIntervalId.current = requestAnimationFrame(checkLevel);

      } catch (err) {
        console.error("Microphone access denied or error:", err);
        showToast("⚠️ Microphone access declined. Please enable microphone permissions in your browser settings!");
        setMicActive(false);
        setMicPermissionDenied(true);
        setMicPermissionGranted(false);
      }
    }
  };

  const stopMic = () => {
    if (micIntervalId.current) {
      cancelAnimationFrame(micIntervalId.current);
      micIntervalId.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setMicActive(false);
  };

  // Automatically trigger microphone pop-up on mounting/active session
  useEffect(() => {
    if (sessionId && role && !micActive && !micPermissionGranted && !micPermissionDenied) {
      const timer = setTimeout(() => {
        toggleMicDetection();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [sessionId, role, micActive, micPermissionGranted, micPermissionDenied]);

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  // Copy chamber link helper
  const handleCopyLink = () => {
    const chamberLink = `${window.location.origin}/ldr-game/${sessionId}`;
    navigator.clipboard.writeText(chamberLink);
    setCopiedLink(true);
    showToast("📋 Breath Chamber Link Copied to Clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Download distance exemption certificate
  const handleDownloadCertificate = async () => {
    const element = document.getElementById('exemption-certificate-download');
    if (!element) return;
    try {
      setCertificateGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(element, {
        pixelRatio: 2.0,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          margin: '0',
          borderRadius: '24px'
        }
      });
      const link = document.createElement('a');
      link.download = `LDR_Distance_Exemption_Certificate.png`;
      link.href = dataUrl;
      link.click();
      showToast("🏆 Distance Defeated Exemption Certificate Saved!");
    } catch (err) {
      console.error("Error generating certificate image:", err);
      showToast("❌ Unable to compile certificate screenshot.");
    } finally {
      setCertificateGenerating(false);
    }
  };

  // Reset/Re-inflate stress level to 100% to play again
  const handleResetChamber = async () => {
    if (!sessionId) return;
    try {
      await updateDoc(doc(db, 'ldr-sessions', sessionId), {
        lastEvent: {
          type: 'join',
          sender: myName || 'Partner',
          senderUid: currentUser?.uid || 'anonymous',
          text: '🔄 Stress chamber recalibrated!',
          timestamp: Date.now()
        }
      });
      playSynthSound('success');
      showToast("🔄 Couple Stress Chamber Reset successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeSkyMood = async (moodId: string) => {
    if (!sessionId) return;
    try {
      const docRef = doc(db, 'ldr-sessions', sessionId);
      await updateDoc(docRef, {
        skyMood: moodId
      });
    } catch (err) {
      console.error("Error setting sky mood:", err);
    }
  };

  // Render Setup/Form view if not in a room session
  if (!sessionId) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fadeIn text-zinc-950 font-sans">
        <button
          onClick={() => setScreen({ type: 'home' })}
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 font-bold text-xs uppercase tracking-wider mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </button>

        <div className="bg-white border border-zinc-200 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 to-indigo-500" />
          
          <div className="space-y-2 text-center">
            <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
              <Sparkles className="h-3.5 w-3.5" /> LDR TikTok-Viral Interactive Game
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Delulu Heartblower 💨
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
              Long distance wearing you down? Create an interactive **Couple Breath Chamber**. Blow near your mic to launch real-time text bubble messages and hearts onto your partner's screen!
            </p>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Your Nickname</label>
              <input 
                type="text" 
                required
                maxLength={18}
                value={partnerAName}
                onChange={(e) => setPartnerAName(e.target.value)}
                placeholder="Maya" 
                className="w-full bg-[#FAF8F2] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/10 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Couple's Breath Chamber 💖</span>
                </>
              )}
            </button>
          </form>

          <div className="border-t border-zinc-150 pt-4 text-center">
            <p className="text-[10px] text-zinc-400 leading-normal font-medium">
              ⚡ <strong>100% Free & Private.</strong> No signup required. Powered by Firestore live cloud synchronizations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render join screen if sessionId is set but the partner has not yet filled their name
  if (sessionActive && sessionData && !role && !sessionData.partnerBName) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fadeIn text-zinc-950 font-sans">
        <div className="bg-white border border-zinc-200 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 to-indigo-500" />
          
          <div className="space-y-2 text-center">
            <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
              ⚡ INVITATION RECEIVED
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Join <span className="text-pink-500">{sessionData.partnerAName}</span> in the Breath Chamber!
            </h1>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
              {sessionData.partnerAName} has invited you to a real-time session. Type your name below to connect and start blowing bubbles!
            </p>
          </div>

          <form onSubmit={handleJoinSession} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Your Nickname</label>
              <input 
                type="text" 
                required
                maxLength={18}
                value={partnerBName}
                onChange={(e) => setPartnerBName(e.target.value)}
                placeholder="Liam" 
                className="w-full bg-[#FAF8F2] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Join Chamber ⚡</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const partnerName = role === 'A' ? (sessionData?.partnerBName || 'Waiting...') : (sessionData?.partnerAName || 'Partner');
  const activeMoodId = sessionData?.skyMood || 'calm';
  const activeMood = MOODS_DATA.find(m => m.id === activeMoodId) || MOODS_DATA[0];
  const battleState = sessionData?.battleState;
  const isBattleActive = battleState?.status === 'countdown' || battleState?.status === 'active';

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 animate-fadeIn text-zinc-900 font-sans relative">
      
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-zinc-200 px-4 py-3 rounded-2xl shadow-sm mb-4">
        <button
          onClick={() => {
            stopMic();
            setScreen({ type: 'home' });
          }}
          className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Exit Chamber
        </button>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
          {/* Popped statistics */}
          <div className="bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1 select-none">
            🎈 Pops: <span className="text-xs font-mono font-black text-amber-600">{poppedCount}</span>
          </div>

          {/* Real-time Sky Mood Ring configuration dropdown */}
          <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-full px-2.5 py-1">
            <span className="text-[9px] font-black uppercase text-zinc-400">Sky Mood:</span>
            <select
              value={activeMoodId}
              onChange={(e) => handleChangeSkyMood(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-zinc-700 focus:outline-none cursor-pointer"
            >
              {MOODS_DATA.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Sound toggle button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
            title={soundEnabled ? "Disable Sounds" : "Enable Sounds"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-600" /> : <VolumeX className="h-4 w-4 text-zinc-400" />}
          </button>
          
          {/* Presence check */}
          {presenceActive ? (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Synchronized Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-500 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Waiting for Partner
            </span>
          )}
        </div>
      </div>

      {/* Session Details & Invitation Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[9px] font-mono font-bold tracking-wider text-pink-500 uppercase block">COUPLE SYNC CHAMBER</span>
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-1.5 mt-0.5">
              {role === 'A' ? myName : sessionData?.partnerAName} <span className="text-pink-400">❤️</span> {role === 'B' ? myName : (sessionData?.partnerBName || 'Liam')}
            </h2>
          </div>
          
          <div className="flex-1 max-w-md">
            {!presenceActive ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Copy & Share link with partner to connect:</span>
                <div className="flex items-center gap-1.5 bg-[#FAF8F2] border border-zinc-200 rounded-xl px-3 py-2">
                  <span className="text-[10px] sm:text-xs font-mono text-zinc-600 truncate flex-1 select-all">
                    {window.location.origin}/ldr-game/{sessionId}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="p-1 rounded-lg border border-zinc-300 hover:bg-zinc-100 text-pink-600 transition-colors shrink-0 cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 font-bold text-emerald-700">
                  <Users className="h-4 w-4 text-emerald-500 shrink-0 animate-pulse" />
                  <span>Both connected! Blow into your mic concurrently to trigger an automatic duel.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Breath Area Canvas / Stage */}
      <div className={`relative h-[480px] bg-gradient-to-b ${activeMood.classes} rounded-3xl border-2 border-zinc-800 shadow-2xl overflow-hidden mb-4 transition-all duration-1000`}>
        
        {/* Background breathing glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(236,72,153,0.15),transparent_60%)] animate-pulse pointer-events-none" />

        {/* Float instructions layer */}
        {bubbles.length === 0 && !isBattleActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 select-none pointer-events-none z-0">
            <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 animate-bounce">
              <Wind className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-white font-extrabold text-sm sm:text-base">Couple Breath Stage</h4>
              <p className="text-xs text-[#AAB2C0]/75 leading-relaxed">
                Your bubbles and hearts float across this live-synced sky. Turn on your microphone or type a custom message to blow.
              </p>
            </div>
          </div>
        )}

        {/* Real-Time Floating Bubbles Canvas */}
        <div className="absolute inset-0 z-10 overflow-hidden">
          <AnimatePresence>
            {bubbles.map(b => (
              <motion.div
                key={b.id}
                onClick={() => handlePopBubble(b.id, b.x)}
                initial={{ y: 520, x: `${b.x}%`, scale: 0.2, opacity: 0 }}
                animate={{ 
                  y: -150, 
                  scale: 1, 
                  opacity: 0.95,
                  x: [
                    `${b.x}%`, 
                    `${b.x + (b.x > 50 ? -12 : 12)}%`, 
                    `${b.x + (b.x > 50 ? -4 : 4)}%`, 
                    `${b.x}%`
                  ] 
                }}
                exit={{ scale: 1.4, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ 
                  y: { duration: 11, ease: "linear" }, 
                  scale: { duration: 0.6, ease: "easeOut" }, 
                  opacity: { duration: 0.4 },
                  x: { repeat: Infinity, duration: 6, ease: "easeInOut" }
                }}
                className={`absolute rounded-full cursor-pointer bg-gradient-to-tr ${b.color} shadow-[inset_0_4px_16px_rgba(255,255,255,0.4),0_8px_32px_rgba(236,72,153,0.15)] border border-white/20 backdrop-blur-[2px] flex items-center justify-center p-4 text-center group active:scale-95 select-none`}
                style={{
                  width: b.size,
                  height: b.size,
                }}
              >
                <div className="space-y-1 pointer-events-none px-2">
                  <p className="text-[10px] sm:text-[11px] font-extrabold text-white leading-normal drop-shadow-sm font-sans italic line-clamp-3">
                    💭 "{b.text}"
                  </p>
                  <span className="text-[8px] font-mono font-bold tracking-wider text-pink-300 block uppercase">
                    From {b.sender}
                  </span>
                </div>
                
                {/* Highlight node */}
                <div className="absolute top-3 left-3 w-4 h-2 bg-white/40 rounded-full transform -rotate-12" />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Real-time Floating Hearts Cascade */}
          {hearts.map(h => (
            <motion.div
              key={h.id}
              initial={{ y: 500, x: `${h.x}%`, scale: 0.2, opacity: 0, rotate: h.rotation }}
              animate={{ 
                y: -100, 
                scale: [0.2, 1.2, 1, 0.8], 
                opacity: [0, 1, 1, 0],
                x: `${h.x + (Math.sin(h.x) * 10)}%` 
              }}
              transition={{ duration: 3.5, ease: "easeOut" }}
              className="absolute pointer-events-none"
              style={{ fontSize: h.size }}
            >
              <Heart className="fill-current animate-pulse" style={{ color: h.color, width: h.size, height: h.size }} />
            </motion.div>
          ))}

          {/* Floating Pop Particles */}
          {popTexts.map(pt => (
            <motion.div
              key={pt.id}
              initial={{ y: 220, x: pt.x, scale: 0.5, opacity: 1 }}
              animate={{ y: 150, scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute text-sm font-black text-yellow-300 drop-shadow-[0_2px_8px_rgba(234,179,8,0.4)] pointer-events-none z-30"
            >
              {pt.text}
            </motion.div>
          ))}
        </div>

        {/* Divided Half Sides in Blowing Battle Duel */}
        {battleState && (battleState.status === 'active' || battleState.status === 'ended') && (
          <div className="absolute inset-0 z-20 flex pointer-events-none">
            {/* Left Half: Partner A */}
            <div className="w-1/2 h-full border-r border-dashed border-white/20 relative overflow-hidden flex flex-col items-center justify-between py-12">
              <motion.div 
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-pink-500/30 to-rose-400/20 w-full"
                animate={{ height: `${Math.min(100, ((battleState.pAScore || 0) / 15) * 100)}%` }}
                transition={{ type: 'spring', damping: 15 }}
              />
              <div className="relative z-10 text-center space-y-1">
                <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider block">
                  {sessionData?.partnerAName || 'Partner A'}
                </span>
                <span className="text-3xl font-black text-white drop-shadow-md">
                  {battleState.pAScore || 0} / 15
                </span>
              </div>
              <div className="relative z-10 text-[9px] text-pink-300/60 font-mono font-bold tracking-widest uppercase">
                {sessionData?.partnerAName || 'Partner A'}
              </div>
            </div>

            {/* Right Half: Partner B */}
            <div className="w-1/2 h-full relative overflow-hidden flex flex-col items-center justify-between py-12">
              <motion.div 
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-indigo-500/30 to-purple-400/20 w-full"
                animate={{ height: `${Math.min(100, ((battleState.pBScore || 0) / 15) * 100)}%` }}
                transition={{ type: 'spring', damping: 15 }}
              />
              <div className="relative z-10 text-center space-y-1">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider block">
                  {sessionData?.partnerBName || 'Partner B'}
                </span>
                <span className="text-3xl font-black text-white drop-shadow-md">
                  {battleState.pBScore || 0} / 15
                </span>
              </div>
              <div className="relative z-10 text-[9px] text-indigo-300/60 font-mono font-bold tracking-widest uppercase">
                {sessionData?.partnerBName || 'Partner B'}
              </div>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {battleState && battleState.status === 'countdown' && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-center space-y-4">
            <motion.div
              key={Math.floor((Date.now() - (battleState.startedAt || 0)) / 1000)}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 drop-shadow-xl"
            >
              {(() => {
                const elapsed = Date.now() - (battleState.startedAt || 0);
                if (elapsed < 1000) return "3";
                if (elapsed < 2000) return "2";
                if (elapsed < 3000) return "1";
                return "💨 GO!";
              })()}
            </motion.div>
            <p className="text-xs font-black text-white uppercase tracking-widest animate-pulse px-4">
              🔥 Quick Blow Battle Duel Triggered!
            </p>
            <p className="text-[10px] text-zinc-300 max-w-xs px-6 font-semibold">
              Blow near your microphone or type messages as fast as possible to fill your side of the screen with hearts! First to 15 wins!
            </p>
          </div>
        )}

        {/* Winner Announcement Overlay */}
        {battleState && battleState.status === 'ended' && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4 p-6">
            <motion.div
              initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center text-yellow-500"
            >
              <Trophy className="h-7 w-7 animate-bounce" />
            </motion.div>
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-indigo-400">
                {battleState.winner === 'A' ? (sessionData?.partnerAName || 'Partner A') : (sessionData?.partnerBName || 'Partner B')} Wins! 🏆
              </h3>
              <p className="text-[10px] text-zinc-300 font-extrabold uppercase tracking-widest font-sans">
                The Heartblower Champion!
              </p>
            </div>
            <p className="text-[9px] text-zinc-400 font-mono font-bold leading-relaxed animate-pulse max-w-xs">
              Recalibrating Breath Chamber & returning to interactive mode shortly...
            </p>
          </div>
        )}

        {/* Inflation Visualizer for mic detector */}
        {isInflating && (
          <div className="absolute bottom-10 inset-x-0 flex items-center justify-center z-20 pointer-events-none">
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.8 }}
              className="w-14 h-14 rounded-full bg-pink-500/40 border-2 border-white flex items-center justify-center text-white"
            >
              <Wind className="h-5 w-5 animate-pulse" />
            </motion.div>
          </div>
        )}

        {/* Chamber ID Stamp */}
        <div className="absolute top-4 left-4 bg-black/40 border border-white/10 px-3 py-1 rounded-xl text-[9px] text-slate-300 font-mono font-semibold z-10 backdrop-blur-xs select-none">
          Chamber Session ID: <span className="text-pink-400 font-bold">{sessionId}</span>
        </div>
      </div>

      {/* Blowing & Releasing Controllers Dashboard */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
        
        {/* Core Control Buttons - microphone status or manual toggle */}
        {micActive ? (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-950 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <div className="space-y-0.5">
                <span className="font-black text-[11px] text-emerald-800 uppercase tracking-wider block">🎙️ Mic Detector Active</span>
                <p className="text-[10px] text-zinc-600 leading-normal">Blow gently near your microphone to launch bubble messages in real-time!</p>
              </div>
            </div>
            <button
              onClick={stopMic}
              className="text-[10px] font-bold bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 rounded-xl cursor-pointer shrink-0 transition-colors shadow-2xs"
            >
              Disable
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-stretch gap-2.5">
            {micPermissionDenied ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3.5 rounded-2xl text-xs space-y-1 shadow-2xs">
                <span className="font-black text-[11px] text-amber-800 uppercase tracking-wider block">⚠️ Microphone Denied / Offline</span>
                <p className="text-[10px] text-zinc-600 leading-normal">
                  Your browser blocked mic access (often due to iframe sandboxing or security policies). Don't worry! You can fully play and win the battle using the manual buttons below.
                </p>
                <button
                  onClick={toggleMicDetection}
                  className="mt-1 text-[9px] font-bold text-amber-800 bg-white hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                >
                  Retry Mic Access
                </button>
              </div>
            ) : (
              <button
                onClick={toggleMicDetection}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-900 bg-zinc-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="h-4 w-4 text-pink-500 shrink-0 animate-pulse" />
                <span>Enable Mic Blow Detector 🎙️</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Tap Bubble Blow Button - always available as an ultra-satisfying fallback/primary action */}
        <button
          onClick={() => handleReleaseBubble()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <Wind className="h-4 w-4 text-pink-500 shrink-0" />
          <span>💨 Tap to Blow Bubble (Manual Blow)</span>
        </button>


        
        {/* Custom Message Field */}
        <div className="pt-2 border-t border-zinc-100 space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Write a Custom Bubble Message (Optional):</span>
          <div className="space-y-2">
            <input 
              type="text"
              maxLength={80}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="E.g., I miss you..."
              className="w-full bg-[#FAF8F2] border border-zinc-200 rounded-xl px-3 py-2 text-[10px] sm:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-pink-500 placeholder:text-[9px] sm:placeholder:text-[10px]"
            />
            <button
              onClick={() => handleReleaseBubble()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Wind className="h-4 w-4 text-pink-200" />
              <span>Blow Custom Message 💨</span>
            </button>
          </div>
        </div>
 
        {/* Trending Presets Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">Viral Delulu Presets:</span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {RELATABLE_BUBBLE_MESSAGES.slice(0, 10).map((msg, idx) => (
              <button
                key={idx}
                onClick={() => handleReleaseBubble(msg)}
                className="text-[10px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-pink-100 hover:text-pink-700 hover:border-pink-300 border border-zinc-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left line-clamp-1 truncate max-w-xs"
              >
                "{msg}"
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
