"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Sparkles, RefreshCw, WifiOff } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useChat } from "@/context/ChatContext"; 

const WS_URL = "ws://localhost:8000/chat/ws";

export function ChatWidget() {
  const { messages, addMessage, streamMessage, isTyping, setIsTyping, isOpen, setIsOpen } = useChat();
  
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
        return;
    }

    console.log("[Chat] Connecting...");
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("[Chat] Connected!");
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.status === "text_chunk") {
           streamMessage(data.chunk);
        }

        else if (data.status === "error") {
            setIsTyping(false);
            addMessage("assistant", `Error: ${data.message}`);
        }
        
        else if (data.status === "stream_finished") {
            setIsTyping(false);
        }

      } catch (e) {
        console.error("Message Error:", e);
      }
    };

    socket.onclose = () => {
      console.log("[Chat] Disconnected. Reconnecting...");
      setIsConnected(false);
      socketRef.current = null;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
    };

    socketRef.current = socket;
  }, [addMessage, streamMessage, setIsTyping]); 

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const sendMessage = () => {
    if (!input.trim()) return;
    
    if (!isConnected || socketRef.current?.readyState !== WebSocket.OPEN) {
        connectWebSocket();
        return;
    }
    
    const userMessage = input.trim();
    setInput("");
    
    addMessage("user", userMessage);
    
    socketRef.current.send(userMessage);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      
      {isOpen && (
        <Card className="w-[350px] h-[500px] flex flex-col shadow-2xl border-white/10 bg-black/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-10 duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                 <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Home Agent</h3>
                <span className="flex items-center gap-1.5 text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}/>
                    {isConnected ? "Online" : "Offline"}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 text-sm rounded-2xl ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm shadow-md"
                      : "bg-zinc-800/80 text-zinc-200 border border-white/5 rounded-bl-sm"
                  }`}
                >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="bg-zinc-800/80 border border-white/5 p-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/10 bg-white/5">
            <div className="relative flex items-center gap-2">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={isConnected ? "Type a message..." : "Connecting..."}
                    className="pr-10 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-indigo-500"
                    disabled={!isConnected}
                />
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1 h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20"
                    onClick={sendMessage}
                    disabled={!isConnected}
                >
                   {isConnected ? <Send className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin"/>}
                </Button>
            </div>
          </div>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${isOpen ? 'bg-zinc-800 rotate-90' : 'bg-indigo-600 hover:scale-110 hover:shadow-indigo-500/25'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </Button>

    </div>
  );
}