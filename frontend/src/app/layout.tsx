import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext"; 
import { ChatWidget } from "@/components/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HOMIEE - Proactive Smart Home Agent",
  description: "A home that finally looks out for you. Proactive intelligence, life-saving safety, and absolute privacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ChatProvider>
          {children}
          <ChatWidget /> 
        </ChatProvider>
      </body>
    </html>
  );
}