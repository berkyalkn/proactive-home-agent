"use client";

import { useState, useEffect, useRef } from "react";
import { Users, UserPlus, Trash2, X, Mic, Loader2, CheckCircle, ShieldCheck, UserCheck, Camera, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, User } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const [faces, setFaces] = useState<{front: Blob | null, left: Blob | null, right: Blob | null, up: Blob | null, down: Blob | null}>({
    front: null, left: null, right: null, up: null, down: null
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const currentFaceStep = !faces.front ? "front" 
                        : !faces.left ? "left" 
                        : !faces.right ? "right" 
                        : !faces.up ? "up" 
                        : !faces.down ? "down" 
                        : "done";

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
    setFaces({ front: null, left: null, right: null, up: null, down: null });
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
                setFaces(prev => {
                    const newFaces = { ...prev };
                    if (!prev.front) newFaces.front = blob;
                    else if (!prev.left) newFaces.left = blob;
                    else if (!prev.right) newFaces.right = blob;
                    else if (!prev.up) newFaces.up = blob;
                    else if (!prev.down) {
                        newFaces.down = blob;
                        stopCamera(); 
                    }
                    return newFaces;
                });
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
    if (!name || currentFaceStep !== "done") {
        alert("Please enter a name and complete all 5 face angles.");
        return;
    }
    
    setStatus("uploading");

    try {
      const form1 = new FormData();
      form1.append("name", name.trim());
      form1.append("image_file", faces.front as Blob, "front.jpg");
      if (audioBlob) form1.append("audio_file", audioBlob, "voice_sample.webm");
      let res = await fetch(`${API_URL}/users/register`, { method: "POST", body: form1 });
      if (!res.ok) throw new Error("Registration failed on front face");

      const form2 = new FormData();
      form2.append("name", name.trim());
      form2.append("image_file", faces.left as Blob, "left.jpg");
      await fetch(`${API_URL}/users/register`, { method: "POST", body: form2 });

      const form3 = new FormData();
      form3.append("name", name.trim());
      form3.append("image_file", faces.right as Blob, "right.jpg");
      await fetch(`${API_URL}/users/register`, { method: "POST", body: form3 });

      const form4 = new FormData();
      form4.append("name", name.trim());
      form4.append("image_file", faces.up as Blob, "up.jpg");
      await fetch(`${API_URL}/users/register`, { method: "POST", body: form4 });

      const form5 = new FormData();
      form5.append("name", name.trim());
      form5.append("image_file", faces.down as Blob, "down.jpg");
      await fetch(`${API_URL}/users/register`, { method: "POST", body: form5 });

      setStatus("success");
      setTimeout(() => {
          setStatus("idle");
          setName("");
          setAudioBlob(null);
          setFaces({ front: null, left: null, right: null, up: null, down: null });
          setActiveTab("list");
          fetchUsers();
      }, 1500);

    } catch (e) { 
        console.error(e); 
        alert("An error occurred during multi-angle registration.");
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
        <Card className="absolute top-14 left-0 w-[400px] bg-black/95 backdrop-blur-xl border-zinc-800 shadow-2xl p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-left rounded-xl">
            
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-indigo-400"/>
                    </div>
                    <span className="text-base font-semibold text-zinc-100">Identity & Access Management</span>
                </div>
            </div>

            <div className="flex p-1.5 mx-5 mt-5 bg-zinc-900 rounded-lg border border-zinc-800">
                <button 
                    onClick={() => setActiveTab("list")}
                    className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${activeTab === "list" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Authorized Users
                </button>
                <button 
                    onClick={() => setActiveTab("add")}
                    className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${activeTab === "add" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Enroll New Identity
                </button>
            </div>

            <div className="p-5 min-h-[300px]">
                {activeTab === "list" && (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                                <UserCheck className="w-12 h-12 text-zinc-700 mx-auto mb-3"/>
                                <p className="text-sm text-zinc-500">No users found in the database.</p>
                            </div>
                        ) : (
                            users.map((user) => (
                                <div key={user} className="flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-xl border border-zinc-800/50 group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg shadow-indigo-900/20">
                                            {user.substring(0,2)}
                                        </div>
                                        <div>
                                            <div className="text-base font-medium text-zinc-200">{user}</div>
                                            <div className="text-xs text-zinc-500">Multi-Angle FaceID & Voice Auth</div>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDelete(user)}>
                                        <Trash2 className="w-5 h-5"/>
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "add" && (
                    <div className="space-y-5 animate-in slide-in-from-right-2 duration-300 max-h-[500px] overflow-y-auto scrollbar-hide pb-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wider">Full Name</label>
                            <Input placeholder="e.g. Berkay Alkan" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900/80 border-zinc-800 h-11 text-base focus:ring-1 focus:ring-indigo-500 text-white"/>
                        </div>

                        <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-4 transition-colors ${isCameraActive ? "border-blue-500/30 bg-blue-500/5" : currentFaceStep === "done" ? "border-green-500/30 bg-green-500/5" : "border-zinc-800 bg-zinc-900/30"}`}>
                            {currentFaceStep === "done" ? (
                                <div className="text-green-400 flex flex-col items-center gap-3 animate-in zoom-in duration-300 w-full py-4">
                                    <div className="flex gap-2 justify-center items-center">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500 opacity-60"><img src={URL.createObjectURL(faces.left!)} className="w-full h-full object-cover" /></div>
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500 opacity-80 -ml-3"><img src={URL.createObjectURL(faces.up!)} className="w-full h-full object-cover" /></div>
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-400 z-10 -ml-3 shadow-lg shadow-green-500/20"><img src={URL.createObjectURL(faces.front!)} className="w-full h-full object-cover" /></div>
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500 opacity-80 -ml-3"><img src={URL.createObjectURL(faces.down!)} className="w-full h-full object-cover" /></div>
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500 opacity-60 -ml-3"><img src={URL.createObjectURL(faces.right!)} className="w-full h-full object-cover" /></div>
                                    </div>
                                    <span className="text-sm font-medium flex items-center gap-1.5 mt-2"><CheckCircle className="w-4 h-4"/> 5-Point 3D Face Profile Complete</span>
                                    <Button variant="ghost" size="sm" onClick={() => setFaces({front: null, left: null, right: null, up: null, down: null})} className="h-8 text-xs text-zinc-500 hover:text-red-400">Retake All</Button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-full relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[180px]">
                                        <video 
                                            ref={videoRef} 
                                            autoPlay 
                                            playsInline 
                                            muted
                                            className={`w-full max-h-[200px] object-cover transform scale-x-[-1] ${isCameraActive ? "block" : "hidden"}`} 
                                        />
                                        
                                        {!isCameraActive && (
                                            <div className="flex flex-col items-center opacity-50 py-8">
                                                <Camera className="w-8 h-8 mb-3 text-zinc-500" />
                                                <span className="text-xs text-zinc-400">5-Point Multi-Angle Face ID (Required)</span>
                                            </div>
                                        )}

                                        {isCameraActive && (
                                            <div className="absolute bottom-3 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-2">
                                                <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 font-medium border border-white/20 shadow-xl">
                                                    {currentFaceStep === "front" && <><User className="w-4 h-4 text-blue-400 animate-pulse"/> Look Straight at Camera</>}
                                                    {currentFaceStep === "left" && <><ArrowLeft className="w-4 h-4 text-blue-400 animate-pulse"/> Turn Head Slightly Left</>}
                                                    {currentFaceStep === "right" && <><ArrowRight className="w-4 h-4 text-blue-400 animate-pulse"/> Turn Head Slightly Right</>}
                                                    {currentFaceStep === "up" && <><ArrowUp className="w-4 h-4 text-blue-400 animate-pulse"/> Tilt Head Slightly Up</>}
                                                    {currentFaceStep === "down" && <><ArrowDown className="w-4 h-4 text-blue-400 animate-pulse"/> Tilt Head Slightly Down</>}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-1.5 w-full px-2">
                                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.front ? "bg-green-500" : isCameraActive && currentFaceStep === "front" ? "bg-blue-500 animate-pulse" : "bg-zinc-800"}`} />
                                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.left ? "bg-green-500" : isCameraActive && currentFaceStep === "left" ? "bg-blue-500 animate-pulse" : "bg-zinc-800"}`} />
                                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.right ? "bg-green-500" : isCameraActive && currentFaceStep === "right" ? "bg-blue-500 animate-pulse" : "bg-zinc-800"}`} />
                                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.up ? "bg-green-500" : isCameraActive && currentFaceStep === "up" ? "bg-blue-500 animate-pulse" : "bg-zinc-800"}`} />
                                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.down ? "bg-green-500" : isCameraActive && currentFaceStep === "down" ? "bg-blue-500 animate-pulse" : "bg-zinc-800"}`} />
                                    </div>

                                    <Button 
                                        onClick={isCameraActive ? capturePhoto : startCamera} 
                                        variant="secondary" 
                                        className={`w-full text-sm h-10 font-medium ${isCameraActive ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}
                                    >
                                        {isCameraActive ? "Capture This Angle" : "Start Face Registration"}
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors ${isRecording ? "border-red-500/30 bg-red-500/5" : "border-zinc-800 bg-zinc-900/30"}`}>
                            {audioBlob ? (
                                <div className="text-green-400 flex flex-col items-center gap-2 animate-in zoom-in duration-300 py-3">
                                    <CheckCircle className="w-6 h-6"/> <span className="text-sm font-medium">Voice Signature Captured</span>
                                    <Button variant="ghost" size="sm" onClick={() => setAudioBlob(null)} className="h-8 text-xs text-zinc-500 hover:text-red-400 mt-1">Retake Audio</Button>
                                </div>
                            ) : (
                                <>
                                    <div className={`p-3 rounded-full ${isRecording ? "bg-red-500/20 animate-pulse" : "bg-zinc-800"}`}>
                                        <Mic className={`w-5 h-5 ${isRecording ? "text-red-400" : "text-zinc-500"}`}/>
                                    </div>
                                    <p className="text-xs text-zinc-500 text-center">{isRecording ? "Recording your voice..." : "Voice Biometric ID (Optional)"}</p>
                                    <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "secondary"} className={`w-full mt-2 text-sm h-10 font-medium ${isRecording ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}>
                                        {isRecording ? "Stop Recording" : "Record Voice Sample"}
                                    </Button>
                                </>
                            )}
                        </div>

                        <Button onClick={handleSave} disabled={currentFaceStep !== "done" || !name || status === "uploading"} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold text-white mt-4 shadow-xl shadow-indigo-600/20">
                            {status === "uploading" ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <UserPlus className="w-5 h-5 mr-2"/>}
                            {status === "uploading" ? "Encrypting & Saving Profile..." : "Enroll Identity"}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
      )}
    </div>
  );
}