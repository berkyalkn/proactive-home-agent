"use client";

import { useState, useEffect, useRef } from "react";
import { Users, UserPlus, Trash2, X, Mic, Loader2, CheckCircle, ShieldCheck, UserCheck, Camera, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, User, Fingerprint } from "lucide-react";
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
    const token = localStorage.getItem('token'); 
    try {
      const res = await fetch(`${API_URL}/users/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []); 
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) fetchUsers(); }, [isOpen]);

  const handleDelete = async (username: string) => {
    if(!confirm(`Delete user "${username}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/users/${username}`, { 
          method: "DELETE",
          headers: { 'Authorization': `Bearer ${token}` } 
      });
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
    const token = localStorage.getItem('token'); 

    try {
      const form1 = new FormData();
      form1.append("name", name.trim());
      form1.append("image_file", faces.front as Blob, "front.jpg");
      if (audioBlob) form1.append("audio_file", audioBlob, "voice_sample.webm");
      
      let res = await fetch(`${API_URL}/users/add-guest`, { 
          method: "POST", 
          body: form1,
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Registration failed on front face");

      const angles = [
        { file: faces.left, name: "left.jpg" },
        { file: faces.right, name: "right.jpg" },
        { file: faces.up, name: "up.jpg" },
        { file: faces.down, name: "down.jpg" }
      ];

      for (const angle of angles) {
        if (angle.file) {
          const form = new FormData();
          form.append("name", name.trim());
          form.append("image_file", angle.file, angle.name);
          await fetch(`${API_URL}/users/add-guest`, { 
            method: "POST", 
            body: form,
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }

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
        <Card className="absolute top-14 left-0 w-[420px] bg-black/95 backdrop-blur-xl border-zinc-800 shadow-2xl p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-left rounded-xl">
            
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Fingerprint className="w-5 h-5 text-indigo-400"/>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-zinc-100 leading-tight">Identity Management</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Biometric Enrollment & Access</p>
                    </div>
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
                    Enroll New Profile
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
                    <div className="space-y-6 animate-in slide-in-from-right-2 duration-300 max-h-[500px] overflow-y-auto scrollbar-hide pb-2 px-1">
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">STEP 1</span>
                                <h4 className="text-sm font-semibold text-zinc-300">Basic Identity</h4>
                            </div>
                            <Input placeholder="Enter Full Name (e.g. Berkay Alkan)" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900 border-zinc-800 h-11 text-sm focus:ring-1 focus:ring-indigo-500 text-white"/>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">STEP 2</span>
                                <h4 className="text-sm font-semibold text-zinc-300">Visual Biometrics</h4>
                            </div>
                            
                            <div className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-4 transition-colors ${isCameraActive ? "border-blue-500/40 bg-blue-500/5" : currentFaceStep === "done" ? "border-green-500/40 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "border-zinc-800 bg-zinc-900/40"}`}>
                                {currentFaceStep === "done" ? (
                                    <div className="text-green-400 flex flex-col items-center gap-4 w-full py-2">
                                        <div className="flex justify-center items-center">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500 opacity-50 transition-transform hover:scale-110"><img src={URL.createObjectURL(faces.left!)} className="w-full h-full object-cover" /></div>
                                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-500 opacity-80 -ml-4 transition-transform hover:scale-110"><img src={URL.createObjectURL(faces.up!)} className="w-full h-full object-cover" /></div>
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-green-400 z-10 -ml-4 shadow-xl shadow-green-500/20 transition-transform hover:scale-110"><img src={URL.createObjectURL(faces.front!)} className="w-full h-full object-cover" /></div>
                                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-500 opacity-80 -ml-4 transition-transform hover:scale-110"><img src={URL.createObjectURL(faces.down!)} className="w-full h-full object-cover" /></div>
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500 opacity-50 -ml-4 transition-transform hover:scale-110"><img src={URL.createObjectURL(faces.right!)} className="w-full h-full object-cover" /></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold flex items-center gap-1.5"><CheckCircle className="w-4 h-4"/> Face Profile Secured</span>
                                            <span className="text-xs text-green-500/70 mt-1">5 unique angles captured</span>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setFaces({front: null, left: null, right: null, up: null, down: null})} className="h-8 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800">Retake Photos</Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-full relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[180px] border border-zinc-800">
                                            <video 
                                                ref={videoRef} 
                                                autoPlay 
                                                playsInline 
                                                muted
                                                className={`w-full h-[200px] object-cover transform scale-x-[-1] ${isCameraActive ? "block" : "hidden"}`} 
                                            />
                                            
                                            {!isCameraActive && (
                                                <div className="flex flex-col items-center opacity-50 py-8">
                                                    <Camera className="w-8 h-8 mb-3 text-zinc-500" />
                                                    <span className="text-xs text-zinc-400">Camera is off</span>
                                                </div>
                                            )}

                                            {isCameraActive && (
                                                <div className="absolute bottom-3 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-2">
                                                    <span className="bg-black/80 text-white text-[13px] px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 font-medium border border-blue-500/30 shadow-lg shadow-black/50">
                                                        {currentFaceStep === "front" && <><User className="w-4 h-4 text-blue-400 animate-pulse"/> 1. Look Straight at Camera</>}
                                                        {currentFaceStep === "left" && <><ArrowLeft className="w-4 h-4 text-blue-400 animate-pulse"/> 2. Turn Head Slightly Left</>}
                                                        {currentFaceStep === "right" && <><ArrowRight className="w-4 h-4 text-blue-400 animate-pulse"/> 3. Turn Head Slightly Right</>}
                                                        {currentFaceStep === "up" && <><ArrowUp className="w-4 h-4 text-blue-400 animate-pulse"/> 4. Tilt Head Slightly Up</>}
                                                        {currentFaceStep === "down" && <><ArrowDown className="w-4 h-4 text-blue-400 animate-pulse"/> 5. Tilt Head Slightly Down</>}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-1.5 w-full px-1">
                                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.front ? "bg-green-500" : isCameraActive && currentFaceStep === "front" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-zinc-800"}`} />
                                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.left ? "bg-green-500" : isCameraActive && currentFaceStep === "left" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-zinc-800"}`} />
                                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.right ? "bg-green-500" : isCameraActive && currentFaceStep === "right" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-zinc-800"}`} />
                                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.up ? "bg-green-500" : isCameraActive && currentFaceStep === "up" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-zinc-800"}`} />
                                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.down ? "bg-green-500" : isCameraActive && currentFaceStep === "down" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-zinc-800"}`} />
                                        </div>

                                        <Button 
                                            onClick={isCameraActive ? capturePhoto : startCamera} 
                                            variant="secondary" 
                                            className={`w-full text-sm h-11 font-semibold transition-all ${isCameraActive ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}
                                        >
                                            {isCameraActive ? "Capture This Angle" : "Start Face Registration"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-zinc-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">STEP 3</span>
                                <h4 className="text-sm font-semibold text-zinc-300">Voice Signature <span className="text-zinc-500 font-normal text-xs ml-1">(Optional)</span></h4>
                            </div>
                            
                            <div className={`border rounded-xl p-5 flex flex-col items-center justify-center gap-4 transition-colors ${isRecording ? "border-red-500/40 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-zinc-800 bg-zinc-900/40"}`}>
                                {audioBlob ? (
                                    <div className="text-green-400 flex flex-col items-center gap-2 py-2">
                                        <CheckCircle className="w-8 h-8 mb-1"/> 
                                        <span className="text-sm font-bold">Voice Profile Secured</span>
                                        <Button variant="outline" size="sm" onClick={() => setAudioBlob(null)} className="h-8 mt-2 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800">Retake Audio</Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`p-4 rounded-full transition-all ${isRecording ? "bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-zinc-800"}`}>
                                            <Mic className={`w-6 h-6 ${isRecording ? "text-red-500 animate-pulse" : "text-zinc-500"}`}/>
                                        </div>
                                        
                                        <div className="text-center space-y-2 w-full">
                                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                {isRecording ? "Reading in progress..." : "Please read the text below"}
                                            </p>
                                            <div className="bg-black/50 border border-zinc-800 p-3 rounded-lg w-full relative overflow-hidden">
                                                {isRecording && <div className="absolute inset-0 bg-red-500/10 animate-pulse" />}
                                                <p className="text-sm text-indigo-300 font-medium italic relative z-10">
                                                    "Hello Homify, this is my voice signature. Please authorize my access to the secure home network."
                                                </p>
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={isRecording ? stopRecording : startRecording} 
                                            className={`w-full mt-1 text-sm h-11 font-semibold transition-all ${isRecording ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}
                                        >
                                            {isRecording ? "Stop Recording" : "Start Voice Capture"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button 
                                onClick={handleSave} 
                                disabled={currentFaceStep !== "done" || !name || status === "uploading"} 
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 h-14 text-base font-bold text-white shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                {status === "uploading" ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <ShieldCheck className="w-5 h-5 mr-2"/>}
                                {status === "uploading" ? "Encrypting Biometrics..." : "Complete Enrollment"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
      )}
    </div>
  );
}