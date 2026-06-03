"use client";

import { useState, useEffect, useRef } from "react";
import { Users, UserPlus, Trash2, X, Mic, Loader2, CheckCircle, ShieldCheck, UserCheck, Camera, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, User, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const API_URL = "http://localhost:8000";

interface UserManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCountChange?: (count: number) => void;
}

export function UserManager({ isOpen, onClose, onUserCountChange }: UserManagerProps) {
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

  const currentFaceStep = !faces.front ? "front" 
                        : !faces.left ? "left" 
                        : !faces.right ? "right" 
                        : !faces.up ? "up" 
                        : !faces.down ? "down" 
                        : "done";

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('token'); 
    try {
      const res = await fetch(`${API_URL}/users/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const userList = data.users || [];
      setUsers(userList);
      onUserCountChange?.(userList.length);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) fetchUsers(); }, [isOpen]);

  const handleDelete = async (username: string) => {
    // TODO(security): Replace native confirm with a framework modal component
    if(!confirm(`Delete user "${username}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/users/${encodeURIComponent(username)}`, { 
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
        // TODO(security): Replace native alert with a framework modal component
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
      
      const res = await fetch(`${API_URL}/users/add-guest`, { 
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
        // TODO(security): Replace native alert with a framework modal component
        alert("An error occurred during multi-angle registration.");
        setStatus("idle");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => { stopCamera(); onClose(); }} />
      
      <div className="custom-scrollbar" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, width: 460, maxWidth: 'calc(100vw - 20px)', background: 'linear-gradient(135deg, rgba(20, 22, 28, 0.7) 0%, rgba(20, 22, 28, 0.4) 100%)', backdropFilter: 'blur(40px)', borderRight: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: 'inset 1px 0 0 rgba(255, 255, 255, 0.05), 8px 0 40px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          
          <div className="flex items-center justify-between border-b border-white/[0.04] bg-white/[0.01]" style={{ paddingLeft: '28px', paddingRight: '20px', paddingTop: '24px', paddingBottom: '24px' }}>
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Fingerprint className="w-5 h-5 text-indigo-400"/>
                  </div>
                  <div>
                      <h3 className="text-base font-semibold text-zinc-100 leading-tight">Identity Management</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Biometric Enrollment & Access</p>
                  </div>
              </div>
              <button onClick={() => { stopCamera(); onClose(); }} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
          </div>

          <div className="flex p-1 bg-white/[0.03] rounded-full border border-white/[0.04] backdrop-blur-md" style={{ marginLeft: '28px', marginRight: '20px', marginTop: '20px', marginBottom: '24px' }}>
              <button 
                  onClick={() => setActiveTab("list")}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-all border ${activeTab === "list" ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 border-indigo-500/30 shadow-inner" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
              >
                  Authorized Users
              </button>
              <button 
                  onClick={() => setActiveTab("add")}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-all border ${activeTab === "add" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md border-indigo-500/35" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
              >
                  Enroll New Profile
              </button>
          </div>

          <div className="py-4 min-h-[300px]" style={{ paddingLeft: activeTab === 'list' ? '12px' : '28px', paddingRight: '20px' }}>
              {activeTab === "list" && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="max-h-[calc(100vh-210px)] overflow-y-auto scrollbar-hide">
                      {loading ? (
                          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
                      ) : users.length === 0 ? (
                          <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                              <UserCheck className="w-12 h-12 text-zinc-700 mx-auto mb-3"/>
                              <p className="text-sm text-zinc-500">No users found in the database.</p>
                          </div>
                      ) : (
                          users.map((user) => (
                              <div key={user} className="flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl border border-white/[0.03] hover:border-white/[0.06] group transition-all duration-300">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg shadow-indigo-900/20">
                                          {user.substring(0,2)}
                                      </div>
                                      <div>
                                          <div className="text-base font-semibold text-zinc-200">{user}</div>
                                          <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">Multi-Angle FaceID & Voice Auth</div>
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
                  <div className="animate-in slide-in-from-right-2 duration-300 max-h-[calc(100vh-210px)] overflow-y-auto overflow-x-hidden scrollbar-hide pb-2 px-1" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                              <span className="bg-indigo-600 text-white text-[11px] font-extrabold rounded-full tracking-wider shadow-md" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 14px' }}>STEP 1</span>
                              <h4 className="text-sm font-bold text-zinc-200">Basic Identity</h4>
                          </div>
                          <Input 
                            placeholder="Enter Full Name (e.g. Berkay Alkan)" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="bg-white/[0.02] border-white/[0.05] rounded-xl hover:bg-white/[0.04] hover:border-white/[0.08] focus:border-indigo-500/40 focus:bg-indigo-950/5 focus:ring-0 h-11 text-sm text-white transition-all duration-300"
                            style={{ minWidth: 0, boxSizing: 'border-box', maxWidth: '100%', paddingLeft: '16px' }}
                          />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                              <span className="bg-indigo-600 text-white text-[11px] font-extrabold rounded-full tracking-wider shadow-md" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 14px' }}>STEP 2</span>
                              <h4 className="text-sm font-bold text-zinc-200">Visual Biometrics</h4>
                          </div>
                          
                          <div className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${isCameraActive ? "border-blue-500/40 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : currentFaceStep === "done" ? "border-green-500/40 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08]"}`}>
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
                                      <Button variant="outline" size="sm" onClick={() => setFaces({front: null, left: null, right: null, up: null, down: null})} className="h-8 text-xs bg-transparent border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Retake Photos</Button>
                                  </div>
                              ) : (
                                  <>
                                      <div className="w-full relative rounded-xl overflow-hidden bg-black/60 flex items-center justify-center min-h-[180px] border border-white/[0.05]">
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
                                                  <span className="bg-black/85 text-white text-[13px] px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 font-medium border border-blue-500/30 shadow-lg shadow-black/50">
                                                      {currentFaceStep === "front" && <><User className="w-4 h-4 text-blue-400 animate-pulse"/> 1. Look Straight</>}
                                                      {currentFaceStep === "left" && <><ArrowLeft className="w-4 h-4 text-blue-400 animate-pulse"/> 2. Turn Head Left</>}
                                                      {currentFaceStep === "right" && <><ArrowRight className="w-4 h-4 text-blue-400 animate-pulse"/> 3. Turn Head Right</>}
                                                      {currentFaceStep === "up" && <><ArrowUp className="w-4 h-4 text-blue-400 animate-pulse"/> 4. Tilt Head Up</>}
                                                      {currentFaceStep === "down" && <><ArrowDown className="w-4 h-4 text-blue-400 animate-pulse"/> 5. Tilt Head Down</>}
                                                  </span>
                                              </div>
                                          )}
                                      </div>
 
                                      <div className="flex gap-1.5 w-full px-1">
                                          <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.front ? "bg-green-500" : isCameraActive && currentFaceStep === "front" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/[0.04]"}`} />
                                          <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.left ? "bg-green-500" : isCameraActive && currentFaceStep === "left" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/[0.04]"}`} />
                                          <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.right ? "bg-green-500" : isCameraActive && currentFaceStep === "right" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/[0.04]"}`} />
                                          <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.up ? "bg-green-500" : isCameraActive && currentFaceStep === "up" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/[0.04]"}`} />
                                          <div className={`h-1.5 flex-1 rounded-full transition-colors ${faces.down ? "bg-green-500" : isCameraActive && currentFaceStep === "down" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/[0.04]"}`} />
                                      </div>
 
                                      <Button 
                                          onClick={isCameraActive ? capturePhoto : startCamera} 
                                          variant="secondary" 
                                          className={`w-full text-sm h-11 font-semibold transition-all duration-300 rounded-xl ${isCameraActive ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"}`}
                                      >
                                          {isCameraActive ? "Capture This Angle" : "Start Face Registration"}
                                      </Button>
                                  </>
                              )}
                          </div>
                      </div>
 
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                              <span className="bg-indigo-600 text-white text-[11px] font-extrabold rounded-full tracking-wider shadow-md" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 14px' }}>STEP 3</span>
                              <h4 className="text-sm font-bold text-zinc-200">Voice Signature <span className="text-zinc-500 font-normal text-xs ml-1">(Optional)</span></h4>
                          </div>
                          
                          <div className={`border rounded-xl p-5 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${isRecording ? "border-red-500/40 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08]"}`}>
                              {audioBlob ? (
                                  <div className="text-green-400 flex flex-col items-center gap-2 py-2">
                                      <CheckCircle className="w-8 h-8 mb-1"/> 
                                      <span className="text-sm font-bold">Voice Profile Secured</span>
                                      <Button variant="outline" size="sm" onClick={() => setAudioBlob(null)} className="h-8 mt-2 text-xs bg-transparent border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Retake Audio</Button>
                                  </div>
                              ) : (
                                  <>
                                      <div className={`p-4 rounded-full transition-all duration-300 ${isRecording ? "bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-white/5"}`}>
                                          <Mic className={`w-6 h-6 ${isRecording ? "text-red-500 animate-pulse" : "text-zinc-500"}`}/>
                                      </div>
                                      
                                      <div className="text-center space-y-2 w-full flex flex-col items-center">
                                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                              {isRecording ? "Reading in progress..." : "Please read the text below"}
                                          </p>
                                          <div className={`p-10 rounded-2xl my-10 mx-8 w-full max-w-[540px] transition-all border relative overflow-hidden ${isRecording ? 'border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.08)]' : 'bg-white/5 border-white/10'}`}>
                                              {isRecording && <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />}
                                              <p className="text-indigo-200 font-semibold leading-relaxed text-lg text-center italic relative z-10" style={{ fontFamily: 'var(--font), sans-serif' }}>
                                                  &quot;Hello Homiee, this is my voice signature. Please authorize my access to the secure home network.&quot;
                                              </p>
                                          </div>
                                      </div>
 
                                      <Button 
                                          onClick={isRecording ? stopRecording : startRecording} 
                                          className={`w-full mt-1 text-sm h-11 font-semibold transition-all duration-300 rounded-xl ${isRecording ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"}`}
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
                              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 h-14 text-base font-bold text-white shadow-xl shadow-indigo-600/20 transition-all rounded-xl disabled:opacity-50 disabled:grayscale"
                          >
                              {status === "uploading" ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <ShieldCheck className="w-5 h-5 mr-2"/>}
                              {status === "uploading" ? "Encrypting Biometrics..." : "Complete Enrollment"}
                          </Button>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </>
  );
}