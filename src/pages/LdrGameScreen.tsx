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
        setPresenceActive(!!data.partnerAName && !!data.partnerBName);

        // Synchronized Event Dispatcher
        const lastEvent = data.lastEvent;
        if (lastEvent && lastEvent.timestamp > prevEventTime.current) {
          prevEventTime.current = lastEvent.timestamp;

          // Trigger local animation only if event is fresh
          if (lastEvent.type === 'blow') {
            triggerFloatingBubble(lastEvent.text, lastEvent.sender, lastEvent.senderUid === currentUser?.uid);
          } else if (lastEvent.type === 'heart') {
            triggerHeartExplosion(lastEvent.senderUid === currentUser?.uid);
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
  const triggerFloatingBubble = (text: string, sender: string, isLocal: boolean) => {
    if (!isLocal) {
      playSynthSound('blow');
    }
    const newBubble: FloatingBubble = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      sender,
      x: 15 + Math.random() * 70, // Keep within safety range
      size: 130 + Math.random() * 80,
      color: getRandomPastelColor(),
      delay: Math.random() * 0.2
    };

    setBubbles(prev => [...prev, newBubble]);
  };

  // Heart burst cascade trigger
  const triggerHeartExplosion = (isLocal: boolean) => {
    if (!isLocal) {
      playSynthSound('heart');
    }
    const newHearts: FloatingHeart[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `heart_${Math.random().toString(36).substring(2, 9)}_${i}`,
      x: 20 + Math.random() * 60,
      size: 20 + Math.random() * 25,
      rotation: -30 + Math.random() * 60,
      color: ['#EC4899', '#F43F5E', '#D946EF', '#F472B6', '#FF85A1'][Math.floor(Math.random() * 5)]
    }));

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
  const handlePopBubble = (bubbleId: string) => {
    playSynthSound('pop');
    setBubbles(prev => prev.filter(b => b.id !== bubbleId));

    // Spawn mini heart cluster at bubble pop location
    const popHearts = Array.from({ length: 4 }).map((_, i) => ({
      id: `pop_heart_${Math.random().toString(36).substring(2, 9)}_${i}`,
      x: Math.min(100, Math.max(0, 15 + Math.random() * 70)),
      size: 15 + Math.random() * 10,
      rotation: -20 + Math.random() * 40,
      color: '#EC4899'
    }));
    setHearts(prev => [...prev, ...popHearts]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !popHearts.some(nh => nh.id === h.id)));
    }, 2500);
  };

  // Blow bubble action (writes to Firestore)
  const handleReleaseBubble = async (textToUse?: string) => {
    if (!sessionId || !sessionData) return;

    let text = textToUse || customText.trim();
    if (!text) {
      // Pick random viral delulu text
      text = RELATABLE_BUBBLE_MESSAGES[Math.floor(Math.random() * RELATABLE_BUBBLE_MESSAGES.length)];
    }

    playSynthSound('blow');
    const sender = myName || 'Partner';
    const currentStress = sessionData.stressLevel || 100;
    const currentHearts = sessionData.collectiveHearts || 0;
    const nextStress = Math.max(0, currentStress - 5);

    try {
      const docRef = doc(db, 'ldr-sessions', sessionId);
      await updateDoc(docRef, {
        stressLevel: nextStress,
        collectiveHearts: currentHearts + 1,
        lastEvent: {
          type: 'blow',
          sender,
          senderUid: currentUser?.uid || 'anonymous',
          text,
          timestamp: Date.now()
        }
      });
      setCustomText('');
      if (nextStress === 0 && currentStress > 0) {
        // Just reached 0% stress! Triumphant arpeggio
        playSynthSound('success');
      }
    } catch (err) {
      console.error("Error releasing bubble to Firestore:", err);
    }
  };

  useEffect(() => {
    handleReleaseBubbleRef.current = handleReleaseBubble;
  }, [handleReleaseBubble]);

  // Send pure heart cascade (writes to Firestore)
  const handleSendHeartSpark = async () => {
    if (!sessionId || !sessionData) return;
    playSynthSound('heart');
    const sender = myName || 'Partner';
    const currentHearts = sessionData.collectiveHearts || 0;
    try {
      const docRef = doc(db, 'ldr-sessions', sessionId);
      await updateDoc(docRef, {
        collectiveHearts: currentHearts + 1,
        lastEvent: {
          type: 'heart',
          sender,
          senderUid: currentUser?.uid || 'anonymous',
          text: '',
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error("Error sending heart to Firestore:", err);
    }
  };

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
        stressLevel: 100,
        lastEvent: {
          type: 'join',
          sender: myName || 'Partner',
          senderUid: currentUser?.uid || 'anonymous',
          text: '🔄 Stress chamber recalibrated! Reset to 100%.',
          timestamp: Date.now()
        }
      });
      playSynthSound('success');
      showToast("🔄 Couple Stress Chamber Reset successfully!");
    } catch (err) {
      console.error(err);
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
              Long distance wearing you down? Create an interactive stress-relief **Couple Breath Chamber**. Blow near your mic (or tap) to launch real-time text bubble messages and hearts onto your partner's screen!
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
              {sessionData.partnerAName} has invited you to a real-time stress relief session. Type your name below to connect and start blowing bubbles!
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

  const stress = sessionData?.stressLevel ?? 100;
  const heartsCount = sessionData?.collectiveHearts ?? 0;
  const partnerName = role === 'A' ? (sessionData?.partnerBName || 'Waiting...') : (sessionData?.partnerAName || 'Partner');

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 animate-fadeIn text-zinc-900 font-sans relative">
      
      {/* Top Controller Bar */}
      <div className="flex items-center justify-between gap-4 bg-white border border-zinc-200 px-4 py-3 rounded-2xl shadow-sm mb-4">
        <button
          onClick={() => {
            stopMic();
            setScreen({ type: 'home' });
          }}
          className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Exit Chamber
        </button>

        <div className="flex items-center gap-2">
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
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Copy & Share link with partner:</span>
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
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700">
                <Users className="h-4 w-4 text-emerald-500 shrink-0 animate-pulse" />
                <span>Both of you are fully connected! Start blowing into your microphone.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Breath Area Canvas / Stage */}
      <div className="relative h-[480px] bg-gradient-to-b from-[#0F172A] to-[#1E1B4B] rounded-3xl border-2 border-zinc-800 shadow-2xl overflow-hidden mb-4">
        
        {/* Background breathing glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(236,72,153,0.15),transparent_60%)] animate-pulse pointer-events-none" />

        {/* Float instructions layer */}
        {bubbles.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 select-none pointer-events-none z-0">
            <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 animate-bounce">
              <Wind className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-white font-extrabold text-sm sm:text-base">Couple Breath Stage</h4>
              <p className="text-xs text-[#AAB2C0]/75 leading-relaxed">
                Your bubbles and hearts will float across this live-synced sky in real-time. Turn on your microphone or use the controllers below to blow.
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
                onClick={() => handlePopBubble(b.id)}
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
        </div>

        {/* Inflation Visualizer for mic detector */}
        {isInflating && (
          <div className="absolute bottom-10 inset-x-0 flex items-center justify-center z-20 pointer-events-none">
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.8 }}
              className="w-16 h-16 rounded-full bg-pink-500/40 border-2 border-white flex items-center justify-center text-white"
            >
              <Wind className="h-6 w-6 animate-pulse" />
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
        
        {/* Core Control Buttons - microphone button shown only if not allowed/granted */}
        {(!micActive && !micPermissionGranted) && (
          <div className="flex flex-col items-stretch gap-2.5">
            {/* Microphone Blow Detector activation */}
            <button
              onClick={toggleMicDetection}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-900 bg-zinc-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <Mic className="h-4 w-4 text-pink-500 shrink-0" />
              <span>Enable Mic Blow Detector 🎙️</span>
            </button>
            
            <p className="text-[10px] text-zinc-500 text-center leading-normal">
              🎙️ Please grant microphone permissions to use your voice or breath to blow bubbles automatically!
            </p>
          </div>
        )}
        
        {/* Custom Message Field */}
        <div className="pt-2 border-t border-zinc-100 space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Write a Custom Bubble Message (Optional):</span>
          <div className="space-y-2">
            <input 
              type="text"
              maxLength={80}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="E.g., Maya's sweater is technically Liam's sweater now..."
              className="w-full bg-[#FAF8F2] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-800 placeholder:text-[10px] sm:placeholder:text-[11px] placeholder-zinc-400 focus:outline-none focus:border-pink-500"
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
        <div className="space-y-1.5">
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

      {/* Triumphed Distance Defeated Overlay Modal */}
      {stress === 0 && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn text-zinc-900">
          <div className="w-full max-w-xl bg-white border-2 border-pink-500/30 shadow-2xl rounded-3xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600" />
            
            <div className="mx-auto w-14 h-14 bg-pink-50 border border-pink-300 rounded-2xl flex items-center justify-center text-pink-500 mb-4 animate-bounce">
              <Trophy className="h-6 w-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight">
              Distance Defeated! 🎉
            </h2>
            <p className="text-xs text-zinc-500 mt-1 mb-6 leading-relaxed font-semibold max-w-sm mx-auto">
              You both blew away all LDR stress! Download your customized official certificate below to share on TikTok/Instagram and let everyone know you are **100% Truelulu**!
            </p>

            {/* DOWNLOADABLE CERTIFICATE CONTAINER CARD */}
            <div 
              id="exemption-certificate-download"
              className="p-6 sm:p-8 border-4 border-double border-zinc-200 rounded-2xl bg-gradient-to-br from-[#FAF8F2] to-white text-center relative shadow-sm mb-6 max-w-md mx-auto select-none"
            >
              {/* Seal details */}
              <div className="absolute top-4 right-4 text-right flex flex-col items-end">
                <span className="text-[6px] font-bold text-zinc-400 font-mono">CERTIFICATE ID</span>
                <span className="text-[7px] font-mono text-zinc-500 font-bold">#BR-LDR-{sessionId.toUpperCase()}</span>
              </div>

              {/* Certificate header */}
              <div className="space-y-1 mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-pink-500 font-mono block">OFFICIAL EXEMPTION FROM DISTANCE</span>
                <h3 className="text-base font-black text-zinc-900 tracking-tight uppercase border-b border-zinc-200 pb-2">BeforeRegret Truelulu Certificate</h3>
              </div>

              {/* Declared names */}
              <div className="space-y-4 mb-6">
                <p className="text-[10px] text-zinc-400 italic">This document certifies that the couple:</p>
                <div className="text-base sm:text-lg font-black text-zinc-900 tracking-wide font-sans">
                  {sessionData?.partnerAName} & {sessionData?.partnerBName || 'Liam'}
                </div>
                <p className="text-[9px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Have successfully completed the synchronized LDR stress-relief challenge, cleared their couple stress index, and have officially been declared:
                </p>
                <div className="inline-block bg-pink-100 border border-pink-200 text-pink-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                  🏆 100% Truelulu Soulmates
                </div>
              </div>

              {/* Statistics details */}
              <div className="grid grid-cols-2 gap-2 border-t border-zinc-150 pt-4 text-left">
                <div>
                  <span className="text-[7px] font-black text-zinc-400 font-mono uppercase block">CHALLENGE TIME</span>
                  <span className="text-[9px] font-bold text-zinc-700 font-mono">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="text-right">
                  <span className="text-[7px] font-black text-zinc-400 font-mono uppercase block">COLLECTIVE HEARTS SENT</span>
                  <span className="text-[9px] font-bold text-pink-600 font-mono flex items-center justify-end gap-0.5">
                    {heartsCount} <Heart className="h-2.5 w-2.5 fill-pink-500 text-pink-500 inline" />
                  </span>
                </div>
              </div>

              {/* Watermark badge */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[8px] text-zinc-400">
                <Sparkle className="h-3 w-3 text-pink-400" />
                <span>Verified in the BeforeRegret Relationship Court</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleDownloadCertificate}
                disabled={certificateGenerating}
                className="w-full flex items-center justify-center gap-1.5 py-3 border border-pink-200 hover:bg-pink-50 disabled:bg-zinc-100 text-pink-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {certificateGenerating ? (
                  <>
                    <div className="h-3 w-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <span>Saving Certificate...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Save Certificate (PNG)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetChamber}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-xs font-black text-white transition-all uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Play Again (Reset Gauge)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
