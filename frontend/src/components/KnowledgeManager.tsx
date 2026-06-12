"use client";

import { useState, useEffect } from "react";
import { Brain, BookOpen, Trash2, X, Loader2, CheckCircle, FileText, UploadCloud, Type, Network, AlertTriangle, Settings } from "lucide-react";
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
      // FastAPI expects query parameters for this endpoint based on current backend design
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
          
          <div className="flex items-center justify-between border-b border-white/[0.04] bg-white/[0.01]" style={{ paddingLeft: '28px', paddingRight: '20px', paddingTop: '24px', paddingBottom: '24px' }}>
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                      <Brain className="w-5 h-5 text-indigo-400"/>
                  </div>
                  <div>
                      <h3 className="text-base font-semibold text-zinc-100 leading-tight">Semantic Brain</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Manage House Rules & Knowledge</p>
                  </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
          </div>

          <div className="flex p-1 bg-white/[0.03] rounded-full border border-white/[0.04] backdrop-blur-md" style={{ marginLeft: '28px', marginRight: '20px', marginTop: '20px', marginBottom: '24px' }}>
              <button 
                  onClick={() => setActiveTab("list")}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-all border ${activeTab === "list" ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 border-indigo-500/30 shadow-inner" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
              >
                  Learned Facts
              </button>
              <button 
                  onClick={() => setActiveTab("add")}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-all border ${activeTab === "add" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md border-indigo-500/35" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
              >
                  Teach Assistant
              </button>
          </div>

          <div className="py-4 min-h-[300px]" style={{ paddingLeft: activeTab === 'list' ? '12px' : '28px', paddingRight: '20px' }}>
              
              {/* --- LIST TAB --- */}
              {activeTab === "list" && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="max-h-[calc(100vh-210px)] overflow-y-auto scrollbar-hide">
                      {loading ? (
                          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
                      ) : knowledgeList.length === 0 ? (
                          <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                              <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-3 opacity-50"/>
                              <p className="text-sm text-zinc-400 font-medium">Assistant has no static knowledge yet.</p>
                              <p className="text-xs text-zinc-600 mt-1">Teach it Wi-Fi passwords, rules, or appliance manuals.</p>
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
              )}

              {/* --- ADD TAB --- */}
              {activeTab === "add" && (
                  <div className="animate-in slide-in-from-right-2 duration-300 max-h-[calc(100vh-210px)] overflow-y-auto overflow-x-hidden scrollbar-hide pb-2 px-1" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
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
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Title / Subject</label>
                                  <Input 
                                      placeholder="e.g. Guest Wi-Fi Password" 
                                      value={title} 
                                      onChange={(e) => setTitle(e.target.value)} 
                                      className="bg-white/[0.02] border-white/[0.05] rounded-xl focus:border-indigo-500/40 focus:bg-indigo-950/5 text-sm text-white h-11"
                                  />
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Category</label>
                                  <select 
                                      value={category} 
                                      onChange={(e) => setCategory(e.target.value)}
                                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-white h-11 px-3 outline-none focus:border-indigo-500/40 transition-colors appearance-none"
                                  >
                                      <option value="rule" className="bg-zinc-900">House Rule</option>
                                      <option value="wifi" className="bg-zinc-900">Network / Wi-Fi</option>
                                      <option value="appliance" className="bg-zinc-900">Appliance Manual</option>
                                      <option value="emergency" className="bg-zinc-900">Emergency Protocol</option>
                                      <option value="general" className="bg-zinc-900">General Fact</option>
                                  </select>
                              </div>

                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Information Content</label>
                                  <textarea 
                                      placeholder="Write the exact information you want the AI to memorize..." 
                                      value={content} 
                                      onChange={(e) => setContent(e.target.value)} 
                                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl focus:border-indigo-500/40 focus:bg-indigo-950/5 text-sm text-white p-3 min-h-[120px] outline-none transition-all resize-none custom-scrollbar"
                                  />
                              </div>

                              <Button 
                                  onClick={handleSaveText} 
                                  disabled={!title || !content || status === "saving"} 
                                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 h-12 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 rounded-xl transition-all disabled:opacity-50"
                              >
                                  {status === "saving" ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Brain className="w-4 h-4 mr-2"/>}
                                  {status === "saving" ? "Vectorizing & Saving..." : "Inject into AI Brain"}
                              </Button>
                          </div>
                      ) : (
                          <div className="border-2 border-dashed border-white/[0.08] bg-white/[0.01] rounded-2xl flex flex-col items-center justify-center p-8 min-h-[280px] text-center">
                              <div className="p-4 bg-indigo-500/10 rounded-full mb-4">
                                  <UploadCloud className="w-8 h-8 text-indigo-400" />
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