'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, Mic, CheckCircle2, Camera, StopCircle, User, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  onNext: () => void;
  onPrev?: () => void;
}

export default function Step3Biometrics({ onNext, onPrev }: Props) {
  const [mode, setMode] = useState<'intro' | 'face' | 'voice' | 'saving'>('intro');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [faces, setFaces] = useState<{front: Blob | null, left: Blob | null, right: Blob | null, up: Blob | null, down: Blob | null}>({
    front: null, left: null, right: null, up: null, down: null
  });

  const [savingText, setSavingText] = useState("Securing your data...");

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
      setIsCameraActive(false);
    }
  }, [stream]);

  useEffect(() => {
    return () => stopMediaTracks();
  }, [stopMediaTracks]);

  const startFaceSetup = async () => {
    setMode('face');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsCameraActive(true);
      }
    } catch (err) {
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
      
    } catch (err) {
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
    setMode('saving');
    
    const loadingSteps = [
      "Processing your face scans...", 
      "Analyzing voice patterns...", 
      "Securing your personal profile..."
    ];
    loadingSteps.forEach((text, i) => setTimeout(() => setSavingText(text), (i + 1) * 1200));

    const token = localStorage.getItem('token'); 

    try {
      const form1 = new FormData();
      form1.append("image_file", faces.front as Blob, "front.jpg");
      if (recordedAudio) form1.append("audio_file", recordedAudio, "voice_sample.webm");
      
      let res = await fetch(`${API_URL}/users/register`, { 
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
          const form = new FormData();
          form.append("image_file", angle.file, angle.name);
          await fetch(`${API_URL}/users/register`, { 
            method: "POST", 
            body: form,
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }

      setTimeout(() => { 
        setSavingText("All set! Profile secured.");
        setTimeout(() => onNext(), 1000); 
      }, loadingSteps.length * 1200 + 500);

    } catch (error) {
      console.error(error);
      setTimeout(() => onNext(), 2000);
    }
  };

  const handleSkip = () => {
    stopMediaTracks();
    onNext(); 
  };

  return (
    <div className="bg-white border border-slate-200 p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 text-center min-h-[500px] flex flex-col items-center justify-center transform-gpu relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-white pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {mode === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full relative z-10 flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex justify-center gap-4 mb-6">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shadow-sm"><ScanFace className="w-8 h-8" /></div>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shadow-sm"><Mic className="w-8 h-8" /></div>
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Personalize Your Assistant</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                Teach your smart home to recognize your face and voice so it can proactively adapt to your needs and keep your home secure.
                </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 shrink-0 w-full max-w-xs mx-auto">
                <button onClick={startFaceSetup} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 order-1">
                    <Sparkles className="w-5 h-5" /> Let's Get Started
                </button>
                <div className="flex gap-3 order-2">
                    {onPrev && (
                        <button onClick={onPrev} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">
                            Back
                        </button>
                    )}
                    <button onClick={handleSkip} className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-all">
                        Skip All
                    </button>
                </div>
            </div>
          </motion.div>
        )}

        {mode === 'face' && (
          <motion.div key="face" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center w-full relative z-10 h-full">
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Face Recognition</h3>
                <p className="text-sm text-slate-500 mb-8 font-medium">Look at the camera and follow the simple steps below.</p>
                
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-indigo-100 shadow-xl mb-8 bg-slate-50 flex items-center justify-center">
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
                    <motion.div key={currentFaceStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-indigo-700 font-bold bg-indigo-50 px-5 py-2.5 rounded-full border border-indigo-100 shadow-sm text-sm">
                    {currentFaceStep === "front" && <><User className="w-4 h-4"/> 1/5: Look straight ahead</>}
                    {currentFaceStep === "left" && <><ArrowLeft className="w-4 h-4"/> 2/5: Turn slightly left</>}
                    {currentFaceStep === "right" && <><ArrowRight className="w-4 h-4"/> 3/5: Turn slightly right</>}
                    {currentFaceStep === "up" && <><ArrowUp className="w-4 h-4"/> 4/5: Tilt head up</>}
                    {currentFaceStep === "down" && <><ArrowDown className="w-4 h-4"/> 5/5: Tilt head down</>}
                    {currentFaceStep === "done" && <><CheckCircle2 className="w-4 h-4 text-emerald-600"/> Perfect! Face saved.</>}
                    </motion.div>
                </AnimatePresence>
                </div>
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100 flex gap-3 shrink-0 w-full">
                <button 
                    onClick={() => { stopMediaTracks(); setMode('voice'); }} 
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                >
                    Skip Face
                </button>
                <button 
                    onClick={capturePhoto} 
                    disabled={currentFaceStep === "done"} 
                    className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Camera className="w-5 h-5" /> Capture Photo
                </button>
            </div>
          </motion.div>
        )}

        {mode === 'voice' && (
          <motion.div key="voice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center w-full relative z-10 h-full">
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Voice Recognition</h3>
                <p className="text-sm text-slate-500 mb-8 max-w-xs font-medium">Read the phrase below in your normal voice. Press finish when you're done.</p>
                
                <div className={`bg-slate-50 p-6 rounded-2xl mb-8 w-full max-w-sm transition-all border ${isRecording ? 'border-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-slate-200'}`}>
                <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center justify-center gap-1">
                    {isRecording ? <><Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> Recording Now...</> : "Read Aloud:"}
                </p>
                <p className="text-indigo-900 font-semibold leading-relaxed text-lg italic">
                    "Hey Homify, it's me. I'm setting up my voice so you can recognize me and help manage our home."
                </p>
                </div>
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100 flex gap-3 shrink-0 w-full">
                <button onClick={() => executeFinalSave(null)} className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">
                    Skip Voice
                </button>
                
                {isRecording ? (
                <button onClick={stopVoiceRecording} className="flex-1 py-3.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse">
                    <StopCircle className="w-5 h-5" /> Finish & Save
                </button>
                ) : (
                <button onClick={startVoiceRecording} className="flex-1 py-3.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white">
                    <Mic className="w-5 h-5" /> Start Recording
                </button>
                )}
            </div>
          </motion.div>
        )}

        {mode === 'saving' && (
          <motion.div key="saving" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center w-full relative z-10 h-64">
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-600" />
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Securing Your Profile</h3>
            <AnimatePresence mode="wait">
              <motion.p 
                key={savingText} 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }} 
                className="text-sm font-medium text-slate-500"
              >
                {savingText}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}