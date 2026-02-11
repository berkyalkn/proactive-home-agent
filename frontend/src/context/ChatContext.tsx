"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void; 
  addMessage: (role: "user" | "assistant", content: string) => void;
  streamMessage: (textChunk: string) => void; 
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your AI Home Agent. How can I help you today?" }
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
    if (role === "user") setIsTyping(true); 
  };

  const streamMessage = (textChunk: string) => {
    setIsTyping(false); 
    setMessages((prev) => {
      if (prev.length === 0) {
        return [{ role: "assistant", content: textChunk }];
      }

      const lastIndex = prev.length - 1;
      const lastMessage = prev[lastIndex];

      if (lastMessage.role === "assistant") {
        const updatedLastMessage = {
          ...lastMessage,
          content: lastMessage.content + textChunk
        };
        return [...prev.slice(0, lastIndex), updatedLastMessage];
      } else {
        return [...prev, { role: "assistant", content: textChunk }];
      }
    });
  };

  return (
    <ChatContext.Provider value={{ messages, isTyping, setIsTyping, addMessage, streamMessage, isOpen, setIsOpen }}>
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