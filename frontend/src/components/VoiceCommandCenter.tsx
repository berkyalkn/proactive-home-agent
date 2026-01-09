"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Sparkles, Loader2, Check } from "lucide-react";
import { useChat } from "@/context/ChatContext"; 

const API_URL = "http://100.105.136.5:8000";

export function VoiceCommandCenter() {
  
  const { addMessage, setIsOpen } = useChat(); 
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("How can I help you?");
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioPlayerRef.current = new Audio();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToBackend(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setStatus("listening");
      setMessage("Listening...");
      
    } catch (error) {
      console.error("Mic Error:", error);
      setStatus("error");
      setMessage("Mic Access Denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setStatus("processing");
    setMessage("Processing command...");

    const formData = new FormData();
    formData.append("file", audioBlob, "voice_command.webm");
    formData.append("thread_id", "voice_1");

    try {
      const response = await fetch(`${API_URL}/chat/voice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();

      addMessage("user", `🎤 ${data.transcription}`);
      const prefix = data.audio ? "🔊 " : ""; 
      addMessage("assistant", `${prefix}${data.response}`);

      if (data.audio && audioPlayerRef.current) {
        audioPlayerRef.current.src = `data:audio/mp3;base64,${data.audio}`;
        audioPlayerRef.current.play().catch(e => {
            console.error("Audio play error:", e);
            setMessage("Auto-play blocked by browser.");
        });
      }

      setIsOpen(true);

      setStatus("success");
      setMessage("Command executed!"); 

    } catch (error) {
      setStatus("error");
      setMessage("Failed to reach agent.");
      addMessage("assistant", "⚠️ I encountered an error processing your voice command.");
    } finally {
      setIsProcessing(false);
      
      setTimeout(() => {
        setStatus("idle");
        setMessage("How can I help you?");
      }, 3000);
    }
  };

  const handleToggle = () => {
    if (isProcessing) return;
    isListening ? stopRecording() : startRecording();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20 animate-in fade-in slide-in-from-top-4 duration-700">
      
      <div className={`absolute -inset-1 rounded-full blur-2xl transition-opacity duration-700
        ${isListening ? "bg-primary/40 opacity-100" : "opacity-0"}`} 
      />

      <div className={`
        relative flex items-center justify-between px-6 py-4 rounded-full border transition-all duration-500
        ${isListening 
          ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-[1.02]" 
          : "bg-card/40 border-border/40 backdrop-blur-md shadow-sm hover:border-primary/30"}
      `}>
        
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500
            ${isListening ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : 
              status === "success" ? "bg-green-500/20 text-green-400" :
              status === "processing" ? "bg-indigo-500/20 text-indigo-400" :
              "bg-primary/10 text-primary"}
          `}>
            {status === "listening" ? (
               <div className="flex items-center gap-[3px] h-4">
                 <span className="w-1 bg-current h-2 animate-[bounce_1s_infinite]"></span>
                 <span className="w-1 bg-current h-5 animate-[bounce_1.2s_infinite]"></span>
                 <span className="w-1 bg-current h-2 animate-[bounce_0.8s_infinite]"></span>
              </div>
            ) : status === "processing" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : status === "success" ? (
              <Check className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <span className={`text-lg font-medium truncate transition-colors duration-300 
              ${status === "listening" ? "text-primary" : 
                status === "success" ? "text-green-400" : "text-foreground"}`}>
              {message}
            </span>
          </div>
        </div>

     
        <button
          onClick={handleToggle}
          disabled={status === "processing"}
          className={`
            group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 outline-none
            ${status === "listening"
              ? "bg-background border-2 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]"
              : status === "processing"
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-md"}
          `}
        >
          {status === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          
          {!isListening && !isProcessing && (
            <span className="absolute inset-0 rounded-full border border-primary/30 scale-100 group-hover:scale-125 transition-transform duration-500" />
          )}
        </button>

      </div>
    </div>
  );
}