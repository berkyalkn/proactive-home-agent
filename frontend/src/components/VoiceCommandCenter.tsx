"use client";

import { useState } from "react";
import { Mic, MicOff, Sparkles, MoveRight } from "lucide-react";

export function VoiceCommandCenter() {
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState("How can I help you?");

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setMessage("Listening...");
    } else {
      setMessage("Processing...");
      setTimeout(() => setMessage("How can I help you?"), 1500);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20">
      
      <div 
        className={`absolute -inset-1 rounded-full blur-2xl transition-opacity duration-700
        ${isListening ? "bg-primary/30 opacity-100" : "opacity-0"}`} 
      />

      <div className={`
        relative flex items-center justify-between px-6 py-4 rounded-full border transition-all duration-500
        ${isListening 
          ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-105" 
          : "bg-card/40 border-border/40 backdrop-blur-md shadow-sm hover:border-primary/30"}
      `}>
        
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300
            ${isListening ? "bg-primary text-primary-foreground animate-pulse shadow-lg shadow-primary/20" : "bg-primary/10 text-primary"}
          `}>
            {isListening ? (
              <div className="flex items-center gap-[3px] h-4">
                 <span className="w-1 bg-current h-2 animate-[bounce_1s_infinite]"></span>
                 <span className="w-1 bg-current h-5 animate-[bounce_1.2s_infinite]"></span>
                 <span className="w-1 bg-current h-2 animate-[bounce_0.8s_infinite]"></span>
              </div>
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>

          <div className="flex flex-col justify-center">
            <span className={`text-lg font-medium transition-colors duration-300 ${isListening ? "text-primary" : "text-foreground"}`}>
              {message}
            </span>
          </div>
        </div>

        <button
          onClick={toggleListening}
          className={`
            group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 outline-none
            ${isListening 
              ? "bg-background border-2 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-md"}
          `}
        >
          {isListening ? (
             <MicOff className="h-5 w-5" />
          ) : (
             <Mic className="h-5 w-5" />
          )}
          
          {!isListening && (
            <span className="absolute inset-0 rounded-full border border-primary/30 scale-100 group-hover:scale-125 transition-transform duration-500" />
          )}
        </button>

      </div>
    </div>
  );
}