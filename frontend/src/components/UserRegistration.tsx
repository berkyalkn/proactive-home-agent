"use client";

import { useState, useRef } from "react";
import { Mic, Square, Save, Loader2, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function UserRegistration() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setErrorMessage("");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error", err);
      setErrorMessage("Microphone access denied or not found.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleSave = async () => {
    if (!audioBlob || !name) return;
    setStatus("uploading");

    const formData = new FormData();
    formData.append("name", name.trim()); 
    formData.append("file", audioBlob, "voice_sample.webm");

    try {
      const res = await fetch("http://localhost:8000/users/register", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        setStatus("success");
        setName("");
        setAudioBlob(null);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.detail || "Upload failed");
        setStatus("error");
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Server connection failed");
      setStatus("error");
    }
  };

  return (
    <Card className="p-5 w-full bg-zinc-900/80 border-zinc-800 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
             <UserPlus className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
            <h2 className="text-base font-semibold text-white">Voice ID Enrollment</h2>
            <p className="text-[10px] text-zinc-400">Secure your home with voice biometrics</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 ml-1">User Name</label>
            <Input 
                placeholder="e.g. Berkay" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/40 border-zinc-700 text-white focus:ring-indigo-500 h-9 text-sm"
            />
        </div>

        <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 ml-1">Voice Sample (Speak for ~10s)</label>
            
            <div className="flex gap-2">
                <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "secondary"}
                    className={`w-full transition-all duration-300 ${isRecording ? 'animate-pulse ring-2 ring-red-500/20' : 'hover:bg-zinc-700'}`}
                >
                    {isRecording ? (
                        <><Square className="w-4 h-4 mr-2"/> Stop Recording</>
                    ) : (
                        <><Mic className="w-4 h-4 mr-2"/> Start Recording</>
                    )}
                </Button>
            </div>
        </div>

        {audioBlob && !isRecording && status !== "success" && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-400 bg-green-500/10 p-2 rounded-md border border-green-500/20">
            <CheckCircle className="w-3 h-3"/> 
            <span>Audio captured! Ready to save.</span>
          </div>
        )}

        {status === "error" && (
            <div className="flex items-center justify-center gap-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-md border border-red-500/20">
                <AlertCircle className="w-3 h-3"/> 
                <span>{errorMessage}</span>
            </div>
        )}

        {status === "success" && (
             <div className="flex items-center justify-center gap-2 text-xs text-green-400 bg-green-500/10 p-2 rounded-md border border-green-500/20 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle className="w-3 h-3"/> 
                <span>User registered successfully!</span>
            </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={!audioBlob || !name || status === "uploading"}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
        >
          {status === "uploading" ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Saving Profile...</>
          ) : (
            <><Save className="w-4 h-4 mr-2"/> Save User Profile</>
          )}
        </Button>
      </div>
    </Card>
  );
}