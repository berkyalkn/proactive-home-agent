'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, Mic, CheckCircle2, Camera, StopCircle, User, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Sparkles, Loader2 } from 'lucide-react';
import s from '@/components/auth/auth.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  onNext: () => void;
  onPrev?: () => void;
}

export default function Step3Biometrics({ onNext, onPrev }: Props) {
  const [mode, setMode] = useState<'intro' | 'face' | 'voice' | 'saving'>('intro');
  const [savingStep, setSavingStep] = useState(0); // 0: off, 1: face scan, 2: voice analysis, 3: vault locking, 4: complete
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [faces, setFaces] = useState<{front: Blob | null, left: Blob | null, right: Blob | null, up: Blob | null, down: Blob | null}>({
    front: null, left: null, right: null, up: null, down: null
  });

  const [savingText, setSavingText] = useState("Securing your data...");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const currentFaceStep = !faces.front ? "front" 
                        : !faces.left ? "left" 
                        : !faces.right ? "right" 
                        : !faces.up ? "up" 
                        : !faces.down ? "down" 
                        : "done";

  const stopMediaTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopMediaTracks();
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [stopMediaTracks]);

  const startFaceSetup = async () => {
    setMode('face');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      alert("Camera access denied. We'll skip Face Recognition for now.");
      setMode('voice');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setFaces(prev => {
            const newFaces = { ...prev };
            if (!prev.front) newFaces.front = blob;
            else if (!prev.left) newFaces.left = blob;
            else if (!prev.right) newFaces.right = blob;
            else if (!prev.up) newFaces.up = blob;
            else if (!prev.down) {
              newFaces.down = blob;
              stopMediaTracks(); 
              setTimeout(() => setMode('voice'), 1500); 
            }
            return newFaces;
          });
        }
      }, "image/jpeg", 0.9);
    }
  };

  const startVoiceRecording = async () => {
    chunksRef.current = [];
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(mediaStream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        mediaStream.getTracks().forEach(t => t.stop());
        const finalAudioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        executeFinalSave(finalAudioBlob); 
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch {
      alert("Microphone access denied. Finishing setup.");
      executeFinalSave(null);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsRecording(false);
      mediaRecorderRef.current.stop(); 
    }
  };

  const executeFinalSave = async (recordedAudio: Blob | null) => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setMode('saving');
    setSavingStep(1);
    setSavingText("Opening the front door...");
    
    const loadingSteps = [
      { text: "Warming up the living room lights...", step: 2 },
      { text: "Calibrating sensors to your voice...", step: 3 },
      { text: "Securing your personal profile...", step: 3 }
    ];
    loadingSteps.forEach((item, i) => {
      const t = setTimeout(() => {
        setSavingText(item.text);
        setSavingStep(item.step);
      }, (i + 1) * 1200);
      timeoutsRef.current.push(t);
    });

    const token = localStorage.getItem('token'); 

    try {
      const form1 = new FormData();
      form1.append("image_file", faces.front as Blob, "front.jpg");
      if (recordedAudio) form1.append("audio_file", recordedAudio, "voice_sample.webm");
      
      const res = await fetch(`${API_URL}/users/register`, { 
        method: "POST", 
        body: form1,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Registration failed on primary biometrics");

      const angles = [
        { file: faces.left, name: "left.jpg" },
        { file: faces.right, name: "right.jpg" },
        { file: faces.up, name: "up.jpg" },
        { file: faces.down, name: "down.jpg" }
      ];

      for (const angle of angles) {
        if (angle.file) {
          try {
            const form = new FormData();
            form.append("image_file", angle.file, angle.name);
            await fetch(`${API_URL}/users/register`, { 
              method: "POST", 
              body: form,
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (e) {
            console.warn("Angle sync failed", e);
          }
        }
      }

      const tFinal = setTimeout(() => { 
        setSavingText("Welcome home! Everything is ready.");
        setSavingStep(4);
        const tNext = setTimeout(() => onNext(), 1500);
        timeoutsRef.current.push(tNext);
      }, loadingSteps.length * 1200 + 600);
      timeoutsRef.current.push(tFinal);

    } catch (error) {
      console.error("Biometrics registration error:", error);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      alert("Registration failed. Please make sure the Raspberry Pi is online and try again.");
      setMode('voice');
    }
  };

  const handleSkip = () => {
    stopMediaTracks();
    onNext(); 
  };

  return (
    <div className={s.cardWide} style={{ minHeight: 500, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
      <AnimatePresence mode="wait">
        
        {mode === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full relative z-10 flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex justify-center gap-4 mb-6">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white shadow-sm"><ScanFace className="w-8 h-8" fill="#FFFFFF" /></div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white shadow-sm"><Mic className="w-8 h-8" fill="#FFFFFF" /></div>
              </div>

              <h2 className={s.title}>Personalize Your Assistant</h2>
              <p className={s.subtitle} style={{ maxWidth: 440, margin: '8px auto 0' }}>
                Teach your smart home to recognize your face and voice so it can proactively adapt to your needs and keep your home secure.
              </p>
            </div>
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
              <button onClick={startFaceSetup} className={s.btnPrimary} style={{ width: '100%' }}>
                <Sparkles className="w-5 h-5" /> Let&apos;s Get Started
              </button>
              <div className={s.actionRow}>
                {onPrev && (
                  <button onClick={onPrev} className={s.btnSecondary} style={{ flex: 1, maxWidth: 180 }}>
                    Back
                  </button>
                )}
                <button onClick={handleSkip} className={s.btnSecondary} style={{ flex: 1 }}>
                  Skip All
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'face' && (
          <motion.div key="face" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center w-full relative z-10 h-full">
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <h3 className={s.title}>Face Recognition</h3>
              <p className={s.subtitle} style={{ marginBottom: 24 }}>Look at the camera and follow the simple steps below.</p>
              
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-indigo-500/20 shadow-2xl mb-8 bg-white/5 flex items-center justify-center">
                {currentFaceStep !== "done" ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                ) : (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                    <CheckCircle2 className="w-24 h-24 text-emerald-500" />
                  </motion.div>
                )}
              </div>

              <div className="h-10 mb-2 flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFaceStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={currentFaceStep === "done"
                      ? "flex items-center gap-2 text-emerald-400 font-semibold bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20 shadow-sm text-sm"
                      : "flex items-center gap-2 text-indigo-300 font-semibold bg-indigo-500/10 px-5 py-2.5 rounded-full border border-indigo-500/20 shadow-sm text-sm"
                    }
                  >
                    {currentFaceStep === "front" && <><User className="w-4 h-4"/> 1/5: Look straight ahead</>}
                    {currentFaceStep === "left" && <><ArrowLeft className="w-4 h-4"/> 2/5: Turn slightly left</>}
                    {currentFaceStep === "right" && <><ArrowRight className="w-4 h-4"/> 3/5: Turn slightly right</>}
                    {currentFaceStep === "up" && <><ArrowUp className="w-4 h-4"/> 4/5: Tilt head up</>}
                    {currentFaceStep === "down" && <><ArrowDown className="w-4 h-4"/> 5/5: Tilt head down</>}
                    {currentFaceStep === "done" && <><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Perfect! Face saved.</>}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className={`${s.actionRow} w-full`}>
              <button 
                onClick={() => { stopMediaTracks(); setMode('voice'); }} 
                className={s.btnSecondary}
                style={{ flex: 1, maxWidth: 180 }}
              >
                Skip Face
              </button>
              <button 
                onClick={capturePhoto} 
                disabled={currentFaceStep === "done"} 
                className={s.btnPrimary}
                style={{ flex: 2 }}
              >
                <Camera className="w-5 h-5" /> Capture Photo
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'voice' && (
          <motion.div key="voice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center w-full relative z-10 h-full">
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <h3 className={s.title}>Voice Recognition</h3>
              <p className={s.subtitle} style={{ marginBottom: 24 }}>Read the phrase below in your normal voice. Press finish when you&apos;re done.</p>
              
              <div className={`p-10 rounded-2xl my-10 mx-8 w-full max-w-[540px] transition-all border ${isRecording ? 'border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.08)]' : 'bg-white/5 border-white/10'}`}>
                <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center justify-center gap-1">
                  {isRecording ? <><Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Recording Now...</> : "Read Aloud:"}
                </p>
                <p className="text-indigo-200 font-semibold leading-relaxed text-lg text-center italic" style={{ fontFamily: 'var(--font), sans-serif' }}>
                  &ldquo;Hey Homiee, it&apos;s me. I&apos;m setting up my voice so you can recognize me and help manage our home.&rdquo;
                </p>
              </div>
            </div>

            <div className={`${s.actionRow} w-full`}>
              <button 
                onClick={() => executeFinalSave(null)} 
                className={s.btnSecondary}
                style={{ flex: 1, maxWidth: 180 }}
              >
                Skip Voice
              </button>
              
              {isRecording ? (
                <button 
                  onClick={stopVoiceRecording} 
                  className={`${s.btnPrimary} animate-pulse`}
                  style={{ flex: 2 }}
                >
                  <StopCircle className="w-5 h-5" /> Finish & Save
                </button>
              ) : (
                <button 
                  onClick={startVoiceRecording} 
                  className={s.btnPrimary}
                  style={{ flex: 2 }}
                >
                  <Mic className="w-5 h-5" /> Start Recording
                </button>
              )}
            </div>
          </motion.div>
        )}

        {mode === 'saving' && (
          <motion.div 
            key="saving" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="flex flex-col items-center justify-center w-full relative z-10 py-6"
          >
            <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
              {/* Radial background glow that breathes */}
              <motion.div 
                animate={savingStep === 4 ? { scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] } : { scale: [1, 1.05, 1], opacity: [0.05, 0.12, 0.05] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-44 h-44 bg-radial from-[#c4a8e0] to-transparent blur-2xl pointer-events-none rounded-full" 
              />
              
              <svg viewBox="0 0 120 120" className="w-28 h-28 relative z-10 text-slate-200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="warmGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c4a8e0" />
                    <stop offset="100%" stopColor="#d4a0c0" />
                  </linearGradient>
                </defs>

                {/* Chimney */}
                <path d="M82 32 V18 H92 V38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Chimney Sparkles / Smoke Orbs */}
                {savingStep >= 3 && (
                  <g className="transition-opacity duration-700" style={{ opacity: savingStep >= 3 ? 1 : 0 }}>
                    <motion.circle 
                      cx="87" 
                      cy="10" 
                      r="2" 
                      fill="url(#warmGlow)" 
                      animate={{ y: [-2, -15], x: [87, 85, 88], opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    />
                    <motion.circle 
                      cx="90" 
                      cy="6" 
                      r="1.5" 
                      fill="url(#warmGlow)" 
                      animate={{ y: [-2, -22], x: [90, 93, 89], opacity: [0, 1, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
                    />
                  </g>
                )}

                {/* Left Side (Living Room) Interior Glow */}
                <rect 
                  x="28" 
                  y="48" 
                  width="30" 
                  height="49" 
                  rx="2" 
                  fill="url(#warmGlow)" 
                  className="transition-opacity duration-1000"
                  style={{ opacity: savingStep >= 1 ? 0.85 : 0.03 }} 
                />

                {/* Right Side (Bedroom) Interior Glow */}
                <rect 
                  x="62" 
                  y="48" 
                  width="30" 
                  height="49" 
                  rx="2" 
                  fill="url(#warmGlow)" 
                  className="transition-opacity duration-1000"
                  style={{ opacity: savingStep >= 2 ? 0.85 : 0.03 }} 
                />

                {/* Roof */}
                <polygon points="12,45 60,12 108,45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Main House Frame */}
                <rect x="25" y="45" width="70" height="55" rx="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Front Door */}
                <rect 
                  x="48" 
                  y="68" 
                  width="24" 
                  height="32" 
                  rx="2" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill={savingStep >= 3 ? "url(#warmGlow)" : "transparent"}
                  className="transition-all duration-700"
                  style={{ fillOpacity: savingStep >= 3 ? 0.3 : 0 }}
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                
                {/* Door Knob */}
                <circle cx="66" cy="84" r="1.5" fill="currentColor" />

                {/* Left Room Window */}
                <rect x="34" y="53" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="43" y1="53" x2="43" y2="71" stroke="currentColor" strokeWidth="1.5" />
                <line x1="34" y1="62" x2="52" y2="62" stroke="currentColor" strokeWidth="1.5" />

                {/* Right Room Window */}
                <rect x="68" y="53" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="77" y1="53" x2="77" y2="71" stroke="currentColor" strokeWidth="1.5" />
                <line x1="68" y1="62" x2="86" y2="62" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>

            <h3 className={s.title}>
              {savingStep === 4 ? "Profile Secured" : "Securing Your Profile"}
            </h3>
            
            <div className="h-8 flex items-center justify-center mt-3">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={savingText} 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -5 }} 
                  className={s.subtitle}
                  style={{ marginTop: 0 }}
                >
                  {savingText}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}