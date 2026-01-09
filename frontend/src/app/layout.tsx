import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// IMPORT ET:
import { ChatProvider } from "@/context/ChatContext"; 
import { ChatWidget } from "@/components/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Homify - AI Smart Home",
  description: "Proactive Smart Home Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        {/* PROVIDER İLE SAR */}
        <ChatProvider>
          {children}
          {/* ChatWidget'ı buraya koyarsan her sayfada görünür */}
          <ChatWidget /> 
        </ChatProvider>
      </body>
    </html>
  );
}