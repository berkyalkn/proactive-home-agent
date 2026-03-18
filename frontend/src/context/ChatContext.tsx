"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

type AgentStatus = "idle" | "listening" | "processing" | "speaking";

interface ChatContextType {
  messages: Message[];
  addMessage: (role: "user" | "assistant", content: string) => void;
  isConnected: boolean;
  agentStatus: AgentStatus;
  setAgentStatus: (status: AgentStatus) => void;
  socketRef: React.MutableRefObject<WebSocket | null>;
  audioQueueRef: React.MutableRefObject<string[]>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  latestSensorData: Record<string, any>;
  latestDeviceData: Record<string, any>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/chat/ws";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your AI Home Agent. Ready for commands." }
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [latestSensorData, setLatestSensorData] = useState<Record<string, any>>({});
  const [latestDeviceData, setLatestDeviceData] = useState<Record<string, any>>({});

  const socketRef = useRef<WebSocket | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isStreamFinishedRef = useRef(false);
  const isReceivingStreamRef = useRef(false);

  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      
      if (isStreamFinishedRef.current) {
        setAgentStatus("idle");
      }
      return;
    }

    isPlayingRef.current = true;
    setAgentStatus("speaking"); 

    const nextAudioBase64 = audioQueueRef.current.shift();
    if (!nextAudioBase64) {
        playNextAudio(); 
        return;
    }

    const audio = new Audio(`data:audio/mp3;base64,${nextAudioBase64}`);
    currentAudioRef.current = audio;

    audio.onended = () => {
        playNextAudio();
    };

    audio.onerror = (e) => {
        console.error("Audio Error:", e);
        playNextAudio();
    };

    audio.play().catch(e => {
        console.error("Autoplay Blocked or Error:", e);
        playNextAudio(); 
    });

  }, []); 

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    setMessages(prev => [...prev, { role, content }]);
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("Global WS Connected");
      setIsConnected(true);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };

    socket.onclose = () => {
      console.log("Global WS Disconnected");
      setIsConnected(false);
      socketRef.current = null;
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.status === "sensor_update") {
              setLatestSensorData((prev) => ({
                  ...prev,
                  [data.device_id]: data.data
              }));
            }
             else if (data.status === "device_update") {
              setLatestDeviceData((prev) => ({
                  ...prev, 
                  [data.device_id]: data.data 
              }));
          }

          if (data.status === "text_chunk") {
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (isReceivingStreamRef.current && lastMsg && lastMsg.role === "assistant") {
                    return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + data.chunk }];
                } else {
                    isReceivingStreamRef.current = true;
                    return [...prev, { role: "assistant", content: data.chunk }];
                }
            });
        }
            
            else if (data.status === "audio_chunk" && data.audio) {
                audioQueueRef.current.push(data.audio);
                if (!isPlayingRef.current) {
                    playNextAudio();
                }
            }
            
            else if (data.status === "transcription") {
                addMessage("user", `🎤 ${data.text}`);
            }
            
            else if (data.status === "processing") {
                setAgentStatus("processing");
                isStreamFinishedRef.current = false; 
            }
            
            else if (data.status === "stream_finished") {
                isStreamFinishedRef.current = true; 
                isReceivingStreamRef.current = false;
                
                if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                    setAgentStatus("idle");
                }
            }
            
            else if (data.status === "error") {
                addMessage("assistant", `Error: ${data.message}`);
                setAgentStatus("idle");
                isStreamFinishedRef.current = true;
                isReceivingStreamRef.current = false;
                isPlayingRef.current = false;
                audioQueueRef.current = [];
            }

        } catch (e) {
            console.error("WS Parse Error", e);
        }
    };

    socketRef.current = socket;
  }, [addMessage, playNextAudio]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return (
    <ChatContext.Provider value={{ 
        messages, 
        addMessage, 
        isConnected, 
        agentStatus, 
        setAgentStatus, 
        socketRef, 
        audioQueueRef, 
        isOpen, 
        setIsOpen,
        latestSensorData,
        latestDeviceData
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}