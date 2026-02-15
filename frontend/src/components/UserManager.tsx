"use client";

import { useState, useEffect, useRef } from "react";
import { Users, UserPlus, Trash2, X, Mic, Square, Loader2, CheckCircle, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const API_URL = "http://localhost:8000";

export function UserManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [name, setName] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  const handleSave = async () => {
    if (!audioBlob || !name) return;
    setStatus("uploading");
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("file", audioBlob, "voice_sample.webm");

    try {
      const res = await fetch(`${API_URL}/users/register`, { method: "POST", body: formData });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
            setStatus("idle");
            setName("");
            setAudioBlob(null);
            setActiveTab("list");
            fetchUsers();
        }, 1500);
      }
    } catch (e) { console.error(e); }
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
                                <p className="text-xs text-zinc-600 mt-1">Add a user to enable voice ID.</p>
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
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-zinc-500 ml-1 uppercase tracking-wider">Name</label>
                            <Input placeholder="e.g. Berkay" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900/80 border-zinc-800 h-9 text-sm focus:ring-1 focus:ring-indigo-500 text-white"/>
                        </div>

                        <div className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-3 transition-colors ${isRecording ? "border-red-500/30 bg-red-500/5" : "border-zinc-800 bg-zinc-900/30"}`}>
                            {audioBlob ? (
                                <div className="text-green-400 flex flex-col items-center gap-1 animate-in zoom-in duration-300">
                                    <CheckCircle className="w-6 h-6"/> <span className="text-sm font-medium">Voice Captured</span>
                                </div>
                            ) : (
                                <>
                                    <div className={`p-2.5 rounded-full ${isRecording ? "bg-red-500/20 animate-pulse" : "bg-zinc-800"}`}>
                                        <Mic className={`w-5 h-5 ${isRecording ? "text-red-400" : "text-zinc-500"}`}/>
                                    </div>
                                    <p className="text-xs text-zinc-500 text-center">{isRecording ? "Recording... Say something." : "Tap below to record (5s)"}</p>
                                </>
                            )}
                            <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "secondary"} size="sm" className={`w-full mt-1 text-xs h-9 ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}>
                                {isRecording ? "Stop Recording" : "Start Recording"}
                            </Button>
                        </div>
                        <Button onClick={handleSave} disabled={!audioBlob || !name || status === "uploading"} className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 text-sm font-medium text-white">
                            {status === "uploading" ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <UserPlus className="w-4 h-4 mr-2"/>}
                            {status === "uploading" ? "Saving..." : "Create User Profile"}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
      )}
    </div>
  );
}