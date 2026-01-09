"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ChatContextType {
  messages: Message[];
  addMessage: (role: "user" | "assistant", content: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your AI Home Agent. How can I help you today?" }
  ]);
  const [isOpen, setIsOpen] = useState(false); 

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, isOpen, setIsOpen }}>
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