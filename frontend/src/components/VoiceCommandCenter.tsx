"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Sparkles, Loader2, WifiOff, RefreshCw } from "lucide-react";
import { useChat } from "@/context/ChatContext"; 

export function VoiceCommandCenter() {
  const { 
    socketRef, 
    audioQueueRef, 
    isConnected, 
    agentStatus, 
    setAgentStatus, 
    setIsOpen,
    forceMicTrigger,
    forceMicDuration
  } = useChat();
  
  const [displayMessage, setDisplayMessage] = useState("How can I help you?");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isPlayingRef = useRef(false); 
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); 
  const isRecordingRef = useRef(false);

  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      if (agentStatus === "speaking") {
          setAgentStatus("idle");
          setDisplayMessage("How can I help you?");
      }
      return;
    }

    isPlayingRef.current = true;
    setAgentStatus("speaking");
    setDisplayMessage("Speaking...");

    const nextAudioBase64 = audioQueueRef.current.shift(); 
    if (!nextAudioBase64) return;

    const audio = new Audio(`data:audio/mp3;base64,${nextAudioBase64}`);
    currentAudioRef.current = audio;

    audio.onended = () => playNextAudio();
    audio.onerror = () => playNextAudio();
    audio.play().catch(e => {
        console.error("Auto-play prevented:", e);
        playNextAudio();
    });
  }, [agentStatus, setAgentStatus, audioQueueRef]);

  useEffect(() => {
      if (audioQueueRef.current.length > 0 && !isPlayingRef.current) {
          playNextAudio();
      }
      
      if (agentStatus === "processing") setDisplayMessage("Thinking...");
      if (agentStatus === "listening") setDisplayMessage("Listening...");
      if (agentStatus === "speaking") setDisplayMessage("Speaking...");
      if (agentStatus === "idle" && !isPlayingRef.current) setDisplayMessage("How can I help you?");
      
  }, [agentStatus, playNextAudio, audioQueueRef]);


  const startRecording = useCallback(async () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
    }
    audioQueueRef.current = []; 
    isPlayingRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = mediaRecorder;
      isRecordingRef.current = true; 

      socketRef.current.send(JSON.stringify({ type: "start_recording" }));

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN && isRecordingRef.current) {
            event.data.arrayBuffer().then(buffer => {
                if (isRecordingRef.current) {
                   socketRef.current?.send(buffer);
                }
            });
        }
      };

      mediaRecorder.start(250); 
      setAgentStatus("listening");
      setDisplayMessage("Listening...");
      
    } catch (error) {
      console.error("Mic Error:", error);
      setDisplayMessage("Mic Access Denied");
    }
  }, [socketRef, setAgentStatus, audioQueueRef]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      isRecordingRef.current = false; 
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        setTimeout(() => {
            socketRef.current?.send(JSON.stringify({ type: "stop_recording" }));
        }, 100);
      }
      setAgentStatus("processing");
      setDisplayMessage("Thinking...");
    }
  }, [socketRef, setAgentStatus]);

  useEffect(() => {
    if (forceMicTrigger > 0) {
      console.log(`Auto-starting microphone for ${forceMicDuration} seconds...`);
      startRecording();
      
      const timer = setTimeout(() => {
        console.log("Auto-stopping microphone.");
        stopRecording();
      }, forceMicDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [forceMicTrigger, forceMicDuration, startRecording, stopRecording]);

  const handleToggle = () => {
    if (!isConnected) return; 
    agentStatus === "listening" ? stopRecording() : startRecording();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className={`absolute -inset-1 rounded-full blur-2xl transition-opacity duration-700 ${agentStatus === "listening" ? "bg-primary/40 opacity-100" : agentStatus === "speaking" ? "bg-green-500/30 opacity-100" : "opacity-0"}`} />
      
      <div className={`relative flex items-center justify-between px-6 py-4 rounded-full border transition-all duration-500 ${agentStatus === "listening" ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-[1.02]" : "bg-card/40 border-border/40 backdrop-blur-md shadow-sm hover:border-primary/30"}`}>
        
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 
            ${!isConnected ? "bg-red-500/20 text-red-400 animate-pulse" : 
              agentStatus === "listening" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : 
              agentStatus === "speaking" ? "bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20 animate-pulse" :
              agentStatus === "processing" ? "bg-indigo-500/20 text-indigo-400" : 
              "bg-primary/10 text-primary"}`}>
            
            {!isConnected ? <WifiOff className="h-5 w-5" /> : 
             agentStatus === "listening" ? (
                <div className="flex items-center gap-[3px] h-4">
                    <span className="w-1 bg-current h-2 animate-[bounce_1s_infinite]"></span>
                    <span className="w-1 bg-current h-5 animate-[bounce_1.2s_infinite]"></span>
                    <span className="w-1 bg-current h-2 animate-[bounce_0.8s_infinite]"></span>
                </div>
             ) : 
             agentStatus === "processing" ? <Loader2 className="h-5 w-5 animate-spin" /> : 
             agentStatus === "speaking" ? <div className="flex gap-1"><span className="w-1 h-3 bg-current animate-pulse"></span><span className="w-1 h-5 bg-current animate-pulse delay-75"></span><span className="w-1 h-3 bg-current animate-pulse delay-150"></span></div> :
             <Sparkles className="h-5 w-5" />}
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <span className={`text-lg font-medium truncate transition-colors duration-300 
                ${agentStatus === "listening" ? "text-primary" : 
                  agentStatus === "speaking" ? "text-green-400" : 
                  "text-foreground"}`}>
                {displayMessage}
            </span>
          </div>
        </div>

        <button onClick={handleToggle} disabled={agentStatus === "processing"} className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 outline-none ${agentStatus === "listening" ? "bg-background border-2 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]" : agentStatus === "processing" ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : !isConnected ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-md"}`}>
          {!isConnected ? <RefreshCw className="h-5 w-5" /> : agentStatus === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}