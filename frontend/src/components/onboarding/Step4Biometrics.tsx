import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, Mic, CheckCircle2, ChevronRight, Camera, StopCircle, User, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Step4Biometrics() {
  const router = useRouter();
  
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
      alert("Camera access denied. Skipping FaceID.");
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
              setTimeout(() => setMode('voice'), 1000); 
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

      setTimeout(() => { router.push('/dashboard'); }, 1500);

    } catch (error) {
      console.error(error);
      alert("An error occurred during secure registration.");
      router.push('/dashboard');
    }
  };

  const handleSkip = () => {
    stopMediaTracks();
    router.push('/dashboard');
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 p-10 rounded-3xl shadow-xl shadow-slate-200/50 text-center min-h-[450px] flex flex-col items-center justify-center">
      
      <AnimatePresence mode="wait">
        
        {mode === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full">
            <div className="flex justify-center gap-4 mb-6">
              <div className="p-4 bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-600"><ScanFace className="w-8 h-8" /></div>
              <div className="p-4 bg-blue-100 border border-blue-200 rounded-2xl text-blue-600"><Mic className="w-8 h-8" /></div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Biometric Identity</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Your identity is securely linked to this session. Calibrate FaceID and Voice Print to gain proactive system access.
            </p>
            
            <div className="space-y-4 w-full">
              <button onClick={startFaceSetup} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Initialize Biometrics
              </button>
              <button onClick={handleSkip} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl border border-slate-200 transition-all">
                Skip for Now
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'face' && (
          <motion.div key="face" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col items-center w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Spatial Face Print</h3>
            <p className="text-sm text-slate-500 mb-6">Follow the prompts to capture a 3D map.</p>
            
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] mb-6">
              {currentFaceStep !== "done" ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] scale-125" />
              ) : (
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-24 h-24 text-emerald-500" />
                </div>
              )}
            </div>

            <div className="h-8 mb-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={currentFaceStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                  {currentFaceStep === "front" && <><User className="w-4 h-4"/> 1/5: Look Straight Ahead</>}
                  {currentFaceStep === "left" && <><ArrowLeft className="w-4 h-4"/> 2/5: Turn Slightly Left</>}
                  {currentFaceStep === "right" && <><ArrowRight className="w-4 h-4"/> 3/5: Turn Slightly Right</>}
                  {currentFaceStep === "up" && <><ArrowUp className="w-4 h-4"/> 4/5: Tilt Head Up</>}
                  {currentFaceStep === "down" && <><ArrowDown className="w-4 h-4"/> 5/5: Tilt Head Down</>}
                  {currentFaceStep === "done" && <><CheckCircle2 className="w-4 h-4"/> Face Print Secured</>}
                </motion.div>
              </AnimatePresence>
            </div>

            {currentFaceStep !== "done" && (
              <button onClick={capturePhoto} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2">
                <Camera className="w-5 h-5" /> Capture Frame
              </button>
            )}
          </motion.div>
        )}

        {mode === 'voice' && (
          <motion.div key="voice" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col items-center w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Voice Signature</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">Read the phrase below clearly and naturally. Press finish when done.</p>
            
            <div className={`bg-slate-50 border p-5 rounded-xl mb-8 w-full transition-all ${isRecording ? 'border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-slate-200'}`}>
              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">{isRecording ? "Recording..." : "Read Aloud:"}</p>
              <p className="font-mono text-indigo-700 font-semibold leading-relaxed">
                "Hello Homify. I am speaking to set up my voice profile. Please listen to my voice, remember how I sound, and give me access to control our smart home."
              </p>
            </div>

            {isRecording ? (
              <button onClick={stopVoiceRecording} className="px-8 py-4 font-bold rounded-full shadow-lg transition-all flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white animate-pulse">
                <StopCircle className="w-5 h-5" /> Finish & Save
              </button>
            ) : (
              <button onClick={startVoiceRecording} className="px-8 py-4 font-bold rounded-full shadow-lg transition-all flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Mic className="w-5 h-5" /> Start Recording
              </button>
            )}
          </motion.div>
        )}

        {mode === 'saving' && (
          <motion.div key="saving" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center w-full">
            <div className="relative w-24 h-24 mb-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-full rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <ShieldCheck className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Finalizing Protocol</h3>
            <p className="text-sm text-slate-500">Encrypting biometrics and launching your Smart Dashboard...</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}