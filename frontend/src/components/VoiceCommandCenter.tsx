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

    const audio = new Audio(`data:audio/wav;base64,${nextAudioBase64}`);
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
      startRecording();

      const timer = setTimeout(() => {
        stopRecording();
      }, forceMicDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [forceMicTrigger, forceMicDuration, startRecording, stopRecording]);

  const handleToggle = () => {
    if (!isConnected) return;
    agentStatus === "listening" ? stopRecording() : startRecording();
  };

  // Determine accent colors for status
  const getGlowStyle = () => {
    if (agentStatus === "listening") return { background: 'rgba(196, 168, 224, 0.25)' };
    if (agentStatus === "speaking") return { background: 'rgba(52, 211, 153, 0.2)' };
    return {};
  };

  const getBarStyle = () => {
    if (agentStatus === "listening") return "border-[rgba(196,168,224,0.4)] bg-[rgba(196,168,224,0.08)] shadow-[0_0_20px_rgba(196,168,224,0.15)]";
    return "border-[rgba(255,255,255,0.06)] bg-[rgba(40,44,53,0.6)] backdrop-blur-md hover:border-[rgba(196,168,224,0.15)]";
  };

  return (
    <div style={{ width: '100%', maxWidth: 672, margin: '0 auto', position: 'relative', zIndex: 20 }}>
      {/* Glow behind */}
      <div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: 9999,
          filter: 'blur(24px)',
          opacity: (agentStatus === "listening" || agentStatus === "speaking") ? 1 : 0,
          transition: 'opacity 0.7s ease',
          ...getGlowStyle()
        }}
      />

      <div
        className={`relative flex items-center justify-between pr-6 py-4 rounded-full border transition-all duration-500 ${getBarStyle()}`}
        style={{
          transform: agentStatus === "listening" ? "scale(1.02)" : "scale(1)",
          paddingLeft: '8px'
        }}
      >
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 
              ${!isConnected ? "bg-red-500/20 text-red-400 animate-pulse" :
                agentStatus === "listening" ? "bg-[rgba(196,168,224,0.2)] text-[#c4a8e0] shadow-lg shadow-[rgba(196,168,224,0.15)]" :
                  agentStatus === "speaking" ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/15 animate-pulse" :
                    agentStatus === "processing" ? "bg-indigo-500/20 text-indigo-400" :
                      "bg-[rgba(196,168,224,0.1)] text-[#c4a8e0]"}`}
          >
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
                ${agentStatus === "listening" ? "text-[#c4a8e0]" :
                agentStatus === "speaking" ? "text-emerald-400" :
                  "text-[#f0f0f2]"}`}
            >
              {displayMessage}
            </span>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={agentStatus === "processing"}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 outline-none 
            ${agentStatus === "listening"
              ? "bg-[rgba(26,29,36,0.9)] border-2 border-[#c4a8e0] text-[#c4a8e0] shadow-[0_0_12px_rgba(196,168,224,0.2)]"
              : agentStatus === "processing"
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : !isConnected
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 hover:scale-105 shadow-md"
            }`}
        >
          {!isConnected ? <RefreshCw className="h-5 w-5" /> : agentStatus === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}