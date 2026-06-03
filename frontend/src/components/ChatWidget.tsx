"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation"; 
import { X, Send, Sparkles, RefreshCw } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useChat } from "@/context/ChatContext"; 

export function ChatWidget() {
  const pathname = usePathname();
  const { messages, addMessage, isConnected, socketRef, isOpen, setIsOpen, agentStatus } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = () => {
    if (!input.trim() || !isConnected || socketRef.current?.readyState !== WebSocket.OPEN) return;
    const userMessage = input.trim();
    setInput("");
    addMessage("user", userMessage);
    socketRef.current.send(userMessage);
  };

  const isTyping = agentStatus === "processing";

  const hiddenRoutes = ["/", "/story", "/login", "/register", "/onboarding"];
  if (hiddenRoutes.includes(pathname)) {
    return null; 
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      
      {isOpen && (
        <Card 
          className="w-[350px] h-[500px] flex flex-col shadow-2xl border-[rgba(255,255,255,0.08)] animate-in fade-in slide-in-from-bottom-10 duration-300"
          style={{ backgroundColor: '#262633' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5" style={{ backgroundColor: '#262633' }}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-[#c4a8e0]/20 to-[#d4a0c0]/20 rounded-lg flex items-center justify-center">
                 <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
                  <circle cx="8" cy="8" r="3.2" fill="#d4a0c0" />
                  <circle cx="16" cy="5" r="2.8" fill="#d4a0c0" />
                  <circle cx="23" cy="8" r="3.2" fill="#d4a0c0" />
                  <circle cx="6" cy="16" r="2.8" fill="#d4a0c0" />
                  <circle cx="25" cy="16" r="2.8" fill="#d4a0c0" />
                  <circle cx="8" cy="23" r="3.2" fill="#d4a0c0" />
                  <circle cx="16" cy="26" r="2.8" fill="#d4a0c0" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#EAEAEA]">AI Home Agent</h3>
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}/>
                    {isConnected ? "Online" : "Offline"}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:bg-[#343446] hover:text-[#EAEAEA]" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
 
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-transparent">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 text-sm rounded-2xl ${
                    msg.role === "user"
                      ? "text-[#EAEAEA] font-medium rounded-br-sm shadow-sm"
                      : "text-[#EAEAEA] shadow-sm rounded-bl-sm"
                  }`}
                  style={
                    msg.role === "user"
                      ? { backgroundColor: '#7E57C2' }
                      : { backgroundColor: '#343446' }
                  }
                >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
 
            {isTyping && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="p-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center shadow-sm" style={{ backgroundColor: '#343446' }}>
                  <span className="w-1.5 h-1.5 bg-[#7E57C2] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#7E57C2] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#7E57C2] rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
 
          <div className="p-3 border-t border-white/5" style={{ backgroundColor: '#262633' }}>
            <div className="relative flex items-center gap-2">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={isConnected ? "Type a message..." : "Connecting..."}
                    className="pr-10 border-none text-[#EAEAEA] placeholder:text-[#8F8FA3] focus-visible:ring-1 focus-visible:ring-[#7E57C2] focus-visible:ring-offset-0"
                    style={{ backgroundColor: '#343446' }}
                    disabled={!isConnected}
                />
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1 h-8 w-8 text-[#7E57C2] hover:text-[#906AD4] hover:bg-[#262633]/50"
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
        className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${
          isOpen 
            ? 'bg-[#343446] rotate-90 text-white hover:bg-[#262633]' 
            : 'bg-gradient-to-br from-[#c4a8e0] to-[#d4a0c0] text-[#1a1d24] hover:scale-110 hover:shadow-[0_4px_20px_rgba(196,168,224,0.4)]'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </Button>

    </div>
  );
}