"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Sparkles, Loader2, Check, WifiOff, RefreshCw } from "lucide-react";
import { useChat } from "@/context/ChatContext"; 

const WS_URL = "ws://localhost:8000/chat/ws";

export function VoiceCommandCenter() {
  const { addMessage, streamMessage, setIsOpen } = useChat(); 
  
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "speaking" | "success" | "error">("idle");
  const [displayMessage, setDisplayMessage] = useState("How can I help you?");
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const audioQueueRef = useRef<string[]>([]); 
  const isPlayingRef = useRef(false); 
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); 
  const isRecordingRef = useRef(false);

  const isStreamFinishedRef = useRef(false);

  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;

      if (isStreamFinishedRef.current) {
          setStatus("idle");
          setDisplayMessage("How can I help you?");
      }
      return;
    }

    isPlayingRef.current = true;
    setStatus("speaking"); 
    setDisplayMessage("Speaking..."); 

    const nextAudioBase64 = audioQueueRef.current.shift(); 
    if (!nextAudioBase64) return;

    const audio = new Audio(`data:audio/mp3;base64,${nextAudioBase64}`);
    currentAudioRef.current = audio;

    audio.onended = () => {
      playNextAudio(); 
    };

    audio.onerror = (e) => {
      console.error("Audio Play Error:", e);
      playNextAudio(); 
    };

    audio.play().catch(e => {
      console.error("Play failed:", e);
      playNextAudio();
    });
  }, []);

  const handleServerMessage = (data: any) => {
    
    if (data.status === "processing") {
      setStatus("processing");
      setDisplayMessage("Thinking...");
      isStreamFinishedRef.current = false;
    }

    if (data.status === "transcription") {
      addMessage("user", `🎤 ${data.text}`);
    }

    if (data.status === "text_chunk") {
      streamMessage(data.chunk); 
    }

    if (data.status === "audio_chunk" && data.audio) {
      audioQueueRef.current.push(data.audio);
      
      if (!isPlayingRef.current) {
        playNextAudio();
      }
    }

    if (data.status === "stream_finished") {
      console.log("Stream finished from Backend");
      setIsOpen(true);

      isStreamFinishedRef.current = true;

      if (!isPlayingRef.current) {
          setStatus("idle");
          setDisplayMessage("How can I help you?");
      }
    }

    if (data.status === "error") {
        setStatus("error");
        setDisplayMessage("Error!");
        addMessage("assistant", `Error: ${data.message}`);
        setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return;

    console.log("[Voice] Connecting...");
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("[Voice] Connected");
      setIsConnected(true);
      setStatus("idle");
      setDisplayMessage("How can I help you?");
      if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
      }
    };

    socket.onclose = () => {
      console.log("[Voice] Disconnected. Reconnecting...");
      setIsConnected(false);
      setStatus("error");
      setDisplayMessage("Reconnecting...");
      socketRef.current = null;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (e) {
        console.error("Parse Error:", event.data);
      }
    };

    socketRef.current = socket;
  }, [playNextAudio]); 

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
          socketRef.current.onclose = null; 
          socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectWebSocket]);

  const startRecording = async () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    isStreamFinishedRef.current = false; 

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
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
      setIsListening(true);
      setStatus("listening");
      setDisplayMessage("Listening...");
    } catch (error) {
      console.error("Mic Error:", error);
      setStatus("error");
      setDisplayMessage("Mic Access Denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      isRecordingRef.current = false; 

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsListening(false);
      
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        setTimeout(() => {
            socketRef.current?.send(JSON.stringify({ type: "stop_recording" }));
        }, 100);
      }
    }
  };

  const handleToggle = () => {
    if (!isConnected) { connectWebSocket(); return; }
    isListening ? stopRecording() : startRecording();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className={`absolute -inset-1 rounded-full blur-2xl transition-opacity duration-700 ${isListening ? "bg-primary/40 opacity-100" : status === "speaking" ? "bg-green-500/30 opacity-100" : "opacity-0"}`} />
      
      <div className={`relative flex items-center justify-between px-6 py-4 rounded-full border transition-all duration-500 ${isListening ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-[1.02]" : "bg-card/40 border-border/40 backdrop-blur-md shadow-sm hover:border-primary/30"}`}>
        
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 
            ${!isConnected ? "bg-red-500/20 text-red-400 animate-pulse" : 
              isListening ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : 
              status === "speaking" ? "bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20 animate-pulse" :
              status === "processing" ? "bg-indigo-500/20 text-indigo-400" : 
              "bg-primary/10 text-primary"}`}>
            
            {!isConnected ? <WifiOff className="h-5 w-5" /> : 
             status === "listening" ? (
                <div className="flex items-center gap-[3px] h-4">
                    <span className="w-1 bg-current h-2 animate-[bounce_1s_infinite]"></span>
                    <span className="w-1 bg-current h-5 animate-[bounce_1.2s_infinite]"></span>
                    <span className="w-1 bg-current h-2 animate-[bounce_0.8s_infinite]"></span>
                </div>
             ) : 
             status === "processing" ? <Loader2 className="h-5 w-5 animate-spin" /> : 
             status === "speaking" ? <div className="flex gap-1"><span className="w-1 h-3 bg-current animate-pulse"></span><span className="w-1 h-5 bg-current animate-pulse delay-75"></span><span className="w-1 h-3 bg-current animate-pulse delay-150"></span></div> :
             <Sparkles className="h-5 w-5" />}
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <span className={`text-lg font-medium truncate transition-colors duration-300 
                ${status === "listening" ? "text-primary" : 
                  status === "speaking" ? "text-green-400" : 
                  "text-foreground"}`}>
                {displayMessage}
            </span>
          </div>
        </div>

        <button onClick={handleToggle} disabled={status === "processing"} className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 outline-none ${status === "listening" ? "bg-background border-2 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]" : status === "processing" ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : !isConnected ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-md"}`}>
          {!isConnected ? <RefreshCw className="h-5 w-5" /> : status === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}