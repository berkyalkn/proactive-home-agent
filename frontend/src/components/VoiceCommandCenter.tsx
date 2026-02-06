"use client";

import { useState, useRef, useEffect, useCallback} from "react";
import { Mic, MicOff, Sparkles, Loader2, Check, WifiOff, RefreshCw } from "lucide-react";
import { useChat } from "@/context/ChatContext"; 

const WS_URL = "ws://localhost:8000/chat/ws";

export function VoiceCommandCenter() {
  const { addMessage, setIsOpen } = useChat(); 
  
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
  const [displayMessage, setDisplayMessage] = useState("How can I help you?");
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      console.log("[Voice] It disconnected. Trying again...");
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
  }, []);

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

  const handleServerMessage = (data: any) => {
    if (data.status === "processing") {
      setStatus("processing");
      setDisplayMessage("Processing...");
    }
    
    if (data.status === "success") {
      setStatus("success");
      setDisplayMessage("Done!");
      
      if (data.transcription) addMessage("user", `🎤 ${data.transcription}`);
      if (data.message) addMessage("assistant", `${data.message}`);
      
      setIsOpen(true); 
      
      setTimeout(() => {
        setStatus("idle");
        setDisplayMessage("How can I help you?");
      }, 3000);
    }

    if (data.status === "audio_ready" && data.audio) {
        console.log("Audio is playing...");
        try {
            const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
            audio.play().catch(e => console.error("Audio Play Error:", e));
        } catch (e) {
            console.error("Audio Error:", e);
        }
    }

    if (data.status === "error") {
        setStatus("error");
        setDisplayMessage("Error!");
        addMessage("assistant", `Error: ${data.message}`);
        setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const startRecording = async () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      socketRef.current.send(JSON.stringify({ type: "start_recording" }));

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(event.data);
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
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsListening(false);
      setStatus("processing"); 
      
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "stop_recording" }));
      }
    }
  };

  const handleToggle = () => {
    if (!isConnected) { connectWebSocket(); return; }
    isListening ? stopRecording() : startRecording();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className={`absolute -inset-1 rounded-full blur-2xl transition-opacity duration-700 ${isListening ? "bg-primary/40 opacity-100" : "opacity-0"}`} />
      <div className={`relative flex items-center justify-between px-6 py-4 rounded-full border transition-all duration-500 ${isListening ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-[1.02]" : "bg-card/40 border-border/40 backdrop-blur-md shadow-sm hover:border-primary/30"}`}>
        
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${!isConnected ? "bg-red-500/20 text-red-400 animate-pulse" : isListening ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : status === "success" ? "bg-green-500/20 text-green-400" : status === "processing" ? "bg-indigo-500/20 text-indigo-400" : "bg-primary/10 text-primary"}`}>
            {!isConnected ? <WifiOff className="h-5 w-5" /> : status === "listening" ? <div className="flex items-center gap-[3px] h-4"><span className="w-1 bg-current h-2 animate-[bounce_1s_infinite]"></span><span className="w-1 bg-current h-5 animate-[bounce_1.2s_infinite]"></span><span className="w-1 bg-current h-2 animate-[bounce_0.8s_infinite]"></span></div> : status === "processing" ? <Loader2 className="h-5 w-5 animate-spin" /> : status === "success" ? <Check className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className={`text-lg font-medium truncate transition-colors duration-300 ${status === "listening" ? "text-primary" : status === "success" ? "text-green-400" : "text-foreground"}`}>{displayMessage}</span>
          </div>
        </div>

        <button onClick={handleToggle} disabled={status === "processing"} className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 outline-none ${status === "listening" ? "bg-background border-2 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]" : status === "processing" ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : !isConnected ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-md"}`}>
          {!isConnected ? <RefreshCw className="h-5 w-5" /> : status === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}