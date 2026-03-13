"use client";

import { useState, useEffect, useRef } from "react";
import { Users, UserPlus, Trash2, X, Mic, Loader2, CheckCircle, ShieldCheck, UserCheck, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const API_URL = "http://localhost:8000";

export function UserManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        stopCamera(); 
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/list`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) fetchUsers(); }, [isOpen]);

  const handleDelete = async (username: string) => {
    if(!confirm(`Delete user "${username}"?`)) return;
    try {
      await fetch(`${API_URL}/users/${username}`, { method: "DELETE" });
      fetchUsers(); 
    } catch (e) { console.error("Delete failed", e); }
  };

  const startRecording = async () => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { console.error("Mic error", err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraActive(true);
        }
    } catch (err) { console.error("Camera error", err); }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(videoRef.current, 0, 0);
        
        canvas.toBlob((blob) => {
            if (blob) {
                setImageBlob(blob);
                stopCamera();
            }
        }, "image/jpeg", 0.9);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        setIsCameraActive(false);
    }
  };

  const handleSave = async () => {
    if (!name || (!audioBlob && !imageBlob)) return;
    
    setStatus("uploading");
    const formData = new FormData();
    formData.append("name", name.trim());
    
    if (audioBlob) formData.append("audio_file", audioBlob, "voice_sample.webm");
    if (imageBlob) formData.append("image_file", imageBlob, "face_sample.jpg");

    try {
      const res = await fetch(`${API_URL}/users/register`, { method: "POST", body: formData });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
            setStatus("idle");
            setName("");
            setAudioBlob(null);
            setImageBlob(null);
            setActiveTab("list");
            fetchUsers();
        }, 1500);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail}`);
        setStatus("idle");
      }
    } catch (e) { 
        console.error(e); 
        setStatus("idle");
    }
  };

  return (
    <div ref={containerRef} className="relative z-50">
      
      <Button 
          onClick={() => setIsOpen(!isOpen)}
          variant="outline" 
          className={`h-11 px-4 flex items-center gap-3 transition-all duration-300 border-zinc-800 ${
            isOpen 
            ? "bg-zinc-800 text-white border-zinc-700 shadow-lg shadow-indigo-500/10" 
            : "bg-black/40 backdrop-blur text-zinc-100 hover:bg-zinc-900 hover:border-zinc-700" 
          }`}
      >
          {isOpen ? <X className="w-5 h-5"/> : <ShieldCheck className="w-5 h-5 text-indigo-400" />}
          <span className="hidden md:inline font-medium text-sm">Access Control</span>
          {!isOpen && users.length > 0 && (
             <span className="ml-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-zinc-800 px-2 text-xs font-bold text-zinc-300">
                {users.length}
             </span>
          )}
      </Button>

      {isOpen && (
        <Card className="absolute top-14 left-0 w-[340px] bg-black/90 backdrop-blur-xl border-zinc-800 shadow-2xl p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-left rounded-xl">
            
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                        <Users className="w-4 h-4 text-indigo-400"/>
                    </div>
                    <span className="text-sm font-semibold text-zinc-100">Authorized Users</span>
                </div>
            </div>

            <div className="flex p-1 mx-4 mt-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <button 
                    onClick={() => setActiveTab("list")}
                    className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${activeTab === "list" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Users List
                </button>
                <button 
                    onClick={() => setActiveTab("add")}
                    className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${activeTab === "add" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Add New
                </button>
            </div>

            <div className="p-4 min-h-[220px]">
                {activeTab === "list" && (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-hide">
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                                <UserCheck className="w-10 h-10 text-zinc-700 mx-auto mb-3"/>
                                <p className="text-sm text-zinc-500">No users found.</p>
                            </div>
                        ) : (
                            users.map((user) => (
                                <div key={user} className="flex items-center justify-between p-3 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-lg border border-zinc-800/50 group transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-xs font-bold text-white uppercase shadow-lg shadow-indigo-900/20">
                                            {user.substring(0,2)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-zinc-200">{user}</div>
                                            <div className="text-[10px] text-zinc-500">Full Access</div>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDelete(user)}>
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "add" && (
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300 max-h-[400px] overflow-y-auto scrollbar-hide pb-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-zinc-500 ml-1 uppercase tracking-wider">Name</label>
                            <Input placeholder="e.g. Berkay" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900/80 border-zinc-800 h-9 text-sm focus:ring-1 focus:ring-indigo-500 text-white"/>
                        </div>

                        <div className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center gap-3 transition-colors ${isCameraActive ? "border-blue-500/30 bg-blue-500/5" : "border-zinc-800 bg-zinc-900/30"}`}>
                            {imageBlob ? (
                                <div className="text-green-400 flex flex-col items-center gap-2 animate-in zoom-in duration-300 w-full py-2">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-500">
                                        <img src={URL.createObjectURL(imageBlob)} alt="Captured face" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Face Captured</span>
                                    <Button variant="ghost" size="sm" onClick={() => setImageBlob(null)} className="h-6 text-xs text-zinc-500 hover:text-red-400">Retake</Button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-full relative rounded-lg overflow-hidden bg-black flex items-center justify-center min-h-[100px]">
                                        <video 
                                            ref={videoRef} 
                                            autoPlay 
                                            playsInline 
                                            muted
                                            className={`w-full max-h-[140px] object-cover ${isCameraActive ? "block" : "hidden"}`} 
                                        />
                                        
                                        {!isCameraActive && (
                                            <div className="flex flex-col items-center opacity-50 py-4">
                                                <Camera className="w-6 h-6 mb-2 text-zinc-500" />
                                                <span className="text-[10px] text-zinc-500">Face ID (Required)</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button 
                                        onClick={isCameraActive ? capturePhoto : startCamera} 
                                        variant="secondary" size="sm" 
                                        className={`w-full text-xs h-8 ${isCameraActive ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}
                                    >
                                        {isCameraActive ? "Capture Face" : "Start Camera"}
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-colors ${isRecording ? "border-red-500/30 bg-red-500/5" : "border-zinc-800 bg-zinc-900/30"}`}>
                            {audioBlob ? (
                                <div className="text-green-400 flex flex-col items-center gap-1 animate-in zoom-in duration-300 py-2">
                                    <CheckCircle className="w-5 h-5"/> <span className="text-xs font-medium">Voice Captured</span>
                                    <Button variant="ghost" size="sm" onClick={() => setAudioBlob(null)} className="h-6 text-xs text-zinc-500 hover:text-red-400 mt-1">Retake</Button>
                                </div>
                            ) : (
                                <>
                                    <div className={`p-2 rounded-full ${isRecording ? "bg-red-500/20 animate-pulse" : "bg-zinc-800"}`}>
                                        <Mic className={`w-4 h-4 ${isRecording ? "text-red-400" : "text-zinc-500"}`}/>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 text-center">{isRecording ? "Recording..." : "Voice ID (Optional)"}</p>
                                    <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "secondary"} size="sm" className={`w-full mt-1 text-xs h-8 ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}>
                                        {isRecording ? "Stop" : "Record"}
                                    </Button>
                                </>
                            )}
                        </div>

                        <Button onClick={handleSave} disabled={(!audioBlob && !imageBlob) || !name || status === "uploading"} className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 text-sm font-medium text-white mt-2">
                            {status === "uploading" ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <UserPlus className="w-4 h-4 mr-2"/>}
                            {status === "uploading" ? "Saving Profile..." : "Create User Profile"}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
      )}
    </div>
  );
}