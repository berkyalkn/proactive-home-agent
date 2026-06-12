"use client";

import { useState, useEffect } from "react";
import { Brain, BookOpen, Trash2, X, Loader2, FileText, UploadCloud, Type, Network, AlertTriangle, Settings, Info, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = "http://localhost:8000";

interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  category: string;
}

interface KnowledgeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onKnowledgeCountChange?: (count: number) => void;
}

/* ─── Inline styles for Info Boxes ───────────────────────────── */

const infoBoxStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: '14px',
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(168, 85, 247, 0.12)',
  marginBottom: '20px',
  transition: 'all 0.3s ease',
};

const infoIconWrapperStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  background: 'rgba(168, 85, 247, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: '1px',
};

const infoTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.65',
  color: 'rgba(200, 210, 225, 0.75)',
};

export function KnowledgeManager({ isOpen, onClose, onKnowledgeCountChange }: KnowledgeManagerProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [addMethod, setAddMethod] = useState<"text" | "file">("text");
  
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("rule");
  const [content, setContent] = useState("");

  const fetchKnowledge = async () => {
    setLoading(true);
    const token = localStorage.getItem('token'); 
    try {
      const res = await fetch(`${API_URL}/knowledge/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.knowledge_base || [];
      setKnowledgeList(list);
      onKnowledgeCountChange?.(list.length);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) fetchKnowledge(); }, [isOpen]);

  const handleDelete = async (id: number, title: string) => {
    if(!confirm(`Delete knowledge "${title}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/knowledge/${id}`, { 
          method: "DELETE",
          headers: { 'Authorization': `Bearer ${token}` } 
      });
      fetchKnowledge(); 
    } catch (e) { console.error("Delete failed", e); }
  };

  const handleSaveText = async () => {
    if (!title || !content) {
        alert("Please provide both a title and content.");
        return;
    }
    
    setStatus("saving");
    const token = localStorage.getItem('token'); 

    try {
      const params = new URLSearchParams({
          title: title.trim(),
          content: content.trim(),
          category: category
      });

      const res = await fetch(`${API_URL}/knowledge/add?${params.toString()}`, { 
          method: "POST", 
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to save knowledge");

      setStatus("success");
      setTimeout(() => {
          setStatus("idle");
          setTitle("");
          setContent("");
          setCategory("rule");
          setActiveTab("list");
          fetchKnowledge();
      }, 1500);

    } catch (e) { 
        console.error(e); 
        alert("An error occurred while saving to Vector DB.");
        setStatus("idle");
    }
  };

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'wifi': return <Network className="w-5 h-5 text-blue-400" />;
          case 'appliance': return <Settings className="w-5 h-5 text-emerald-400" />;
          case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-400" />;
          default: return <BookOpen className="w-5 h-5 text-indigo-400" />;
      }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div className="custom-scrollbar" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, width: 480, maxWidth: 'calc(100vw - 20px)', background: 'linear-gradient(135deg, rgba(20, 22, 28, 0.7) 0%, rgba(20, 22, 28, 0.4) 100%)', backdropFilter: 'blur(40px)', borderRight: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: 'inset 1px 0 0 rgba(255, 255, 255, 0.05), 8px 0 40px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between shrink-0" style={{ paddingLeft: '28px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(168, 85, 247, 0.05)' }}>
              <div className="flex items-center gap-3">
                  <div style={{ padding: '8px', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '10px' }}>
                      <Brain className="w-5 h-5" style={{ color: '#a855f7' }}/>
                  </div>
                  <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(233, 213, 255, 0.95)', lineHeight: '1.2' }}>Home Knowledge</h3>
                      <p style={{ fontSize: '13px', color: 'rgba(168, 85, 247, 0.6)', marginTop: '2px' }}>Teach rules and details to the AI</p>
                  </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
          </div>

          {/* ── Tabs ─────────────────────────────────────────── */}
          <div className="flex p-1 bg-white/[0.03] rounded-full border border-white/[0.04] backdrop-blur-md" style={{ marginLeft: '28px', marginRight: '20px', marginTop: '20px', marginBottom: '24px' }}>
              <button 
                  onClick={() => setActiveTab("list")}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-all border ${activeTab === "list" ? "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-300 border-purple-500/30 shadow-inner" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
              >
                  Saved Knowledge
              </button>
              <button 
                  onClick={() => setActiveTab("add")}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-all border ${activeTab === "add" ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md border-purple-500/35" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
              >
                  Add New Rule
              </button>
          </div>

          <div className="py-2 min-h-[300px]" style={{ paddingLeft: '28px', paddingRight: '20px' }}>
              
              {/* --- LIST TAB --- */}
              {activeTab === "list" && (
                  <div className="animate-in fade-in duration-300">
                      {/* Info Box for List */}
                      <div style={infoBoxStyle}>
                          <div style={infoIconWrapperStyle}>
                            <Info style={{ width: '14px', height: '14px', color: 'rgba(192, 132, 252, 0.9)' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(233, 213, 255, 0.85)', marginBottom: '4px' }}>How it works</p>
                            <p style={infoTextStyle}>
                                This acts as the AI&apos;s <strong>long-term memory</strong>. The assistant retrieves these facts and rules dynamically when executing voice commands or answering questions.<br/>
                                <span className="text-purple-400/80 italic mt-1.5 block">Example: &quot;Hey Homiee, what is the guest Wi-Fi password?&quot;</span>
                            </p>
                          </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-hide pb-4">
                          {loading ? (
                              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
                          ) : knowledgeList.length === 0 ? (
                              <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                                  <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-3 opacity-50"/>
                                  <p className="text-sm text-zinc-400 font-medium">Assistant has no static knowledge yet.</p>
                                  <p className="text-xs text-zinc-600 mt-1">Teach it Wi-Fi passwords, rules, or manuals.</p>
                              </div>
                          ) : (
                              knowledgeList.map((item) => (
                                  <div key={item.id} className="flex items-start justify-between p-4 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl border border-white/[0.03] hover:border-white/[0.06] group transition-all duration-300">
                                      <div className="flex items-start gap-4 overflow-hidden">
                                          <div className="mt-1">
                                              {getCategoryIcon(item.category)}
                                          </div>
                                          <div className="overflow-hidden">
                                              <div className="flex items-center gap-2">
                                                  <div className="text-sm font-semibold text-zinc-200 truncate">{item.title}</div>
                                                  <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                                                      {item.category}
                                                  </span>
                                              </div>
                                              <div className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                  {item.content}
                                              </div>
                                          </div>
                                      </div>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2" onClick={() => handleDelete(item.id, item.title)}>
                                          <Trash2 className="w-4 h-4"/>
                                      </Button>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              )}

              {/* --- ADD TAB --- */}
              {activeTab === "add" && (
                  <div className="animate-in slide-in-from-right-2 duration-300 max-h-[calc(100vh-210px)] overflow-y-auto overflow-x-hidden scrollbar-hide pb-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Info Box for Add */}
                      <div style={infoBoxStyle}>
                          <div style={infoIconWrapperStyle}>
                            <Lightbulb style={{ width: '14px', height: '14px', color: 'rgba(192, 132, 252, 0.9)' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(233, 213, 255, 0.85)', marginBottom: '4px' }}>Teaching Guide</p>
                            <p style={infoTextStyle}>
                                Write clear and direct statements. The AI converts this text into a <strong>semantic vector</strong> to understand the context of future house interactions.<br/>
                                <span className="text-purple-400/80 italic mt-1.5 block">Example: &quot;Rule: Never turn on the living room lights past midnight unless there is an emergency.&quot;</span>
                            </p>
                          </div>
                      </div>

                      <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                          <button onClick={() => setAddMethod("text")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-md transition-all ${addMethod === "text" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                              <Type className="w-3.5 h-3.5"/> Manual Text
                          </button>
                          <button onClick={() => setAddMethod("file")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-md transition-all ${addMethod === "file" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                              <FileText className="w-3.5 h-3.5"/> PDF Upload
                          </button>
                      </div>

                      {addMethod === "text" ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Rule Name (e.g. Guest Wi-Fi)</label>
                                  <Input 
                                      placeholder="What is this about?" 
                                      value={title} 
                                      onChange={(e) => setTitle(e.target.value)} 
                                      className="bg-white/[0.02] border-white/[0.05] rounded-xl focus:border-purple-500/40 focus:bg-purple-950/5 text-sm text-white h-11"
                                  />
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Category</label>
                                  <select 
                                      value={category} 
                                      onChange={(e) => setCategory(e.target.value)}
                                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-white h-11 px-3 outline-none focus:border-purple-500/40 transition-colors appearance-none cursor-pointer"
                                  >
                                      <option value="rule" className="bg-zinc-900">House Rule</option>
                                      <option value="wifi" className="bg-zinc-900">Network / Wi-Fi</option>
                                      <option value="appliance" className="bg-zinc-900">Appliance Manual</option>
                                      <option value="emergency" className="bg-zinc-900">Emergency Protocol</option>
                                      <option value="general" className="bg-zinc-900">General Fact</option>
                                  </select>
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">What should the AI memorize?</label>
                                  <textarea 
                                      placeholder="Write the exact information..." 
                                      value={content} 
                                      onChange={(e) => setContent(e.target.value)} 
                                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl focus:border-purple-500/40 focus:bg-purple-950/5 text-sm text-white p-3 min-h-[120px] outline-none transition-all resize-none custom-scrollbar"
                                  />
                              </div>

                              <Button 
                                  onClick={handleSaveText} 
                                  disabled={!title || !content || status === "saving"} 
                                  className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 h-12 text-sm font-bold text-white shadow-lg shadow-purple-600/20 rounded-xl transition-all disabled:opacity-50"
                              >
                                  {status === "saving" ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Brain className="w-4 h-4 mr-2"/>}
                                  {status === "saving" ? "Vectorizing & Saving..." : "Save to AI Memory"}
                              </Button>
                          </div>
                      ) : (
                          <div className="border-2 border-dashed border-white/[0.08] bg-white/[0.01] rounded-2xl flex flex-col items-center justify-center p-8 min-h-[280px] text-center">
                              <div className="p-4 bg-purple-500/10 rounded-full mb-4">
                                  <UploadCloud className="w-8 h-8 text-purple-400" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-200 mb-2">Upload Device Manuals</h4>
                              <p className="text-xs text-zinc-500 mb-6 max-w-[200px] leading-relaxed">
                                  Drag and drop PDF manuals here. The backend text-extraction pipeline will be implemented in the next phase.
                              </p>
                              <Button disabled variant="outline" className="h-9 text-xs border-white/[0.05] bg-white/[0.02] text-zinc-500">
                                  Coming Soon
                              </Button>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </>
  );
}