"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, Loader2, Mic } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useChat } from "@/context/ChatContext"; 

const API_URL = "http://100.105.136.5:8000"; 

export function ChatWidget() {
  const { messages, addMessage, isOpen, setIsOpen } = useChat();
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    
    addMessage("user", userMessage);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, thread_id: "1" }),
      });

      const data = await response.json();
      addMessage("assistant", data.response);

    } catch (error) {
      addMessage("assistant", "Sorry, I cannot reach the server right now.");
    } finally {
      setIsLoading(false);
    }
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
                <span className="flex items-center gap-1.5 text-[10px] text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
                    Online
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
                  className={`max-w-[80%] p-3 text-sm rounded-2xl ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-zinc-800/80 text-zinc-200 border border-white/5 rounded-bl-sm"
                  }`}
                >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-zinc-800/50 px-4 py-3 rounded-2xl flex gap-1 items-center">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
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
                    placeholder="Type a message..."
                    className="pr-10 bg-black/20 border-white/10 text-white"
                    disabled={isLoading}
                />
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1 h-8 w-8 hover:bg-indigo-500/20"
                    onClick={sendMessage}
                    disabled={isLoading}
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${isOpen ? 'bg-zinc-800 rotate-90' : 'bg-indigo-600 hover:scale-110'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </Button>

    </div>
  );
}