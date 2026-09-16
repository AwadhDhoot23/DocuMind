import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { Search, Plus, FileText, UploadCloud, Home, Zap, Brain, Shield, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatArea from './components/ChatArea';
import UploadBox from './components/UploadBox';
import { cn } from './utils';

function App() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [question, setQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [chatLog, setChatLog] = useState(() => {
    const savedChats = localStorage.getItem("documind_chats");
    return savedChats ? JSON.parse(savedChats) : {};
  });
  
  const [documents, setDocuments] = useState(() => {
    const savedDocs = localStorage.getItem("documind_docs");
    return savedDocs ? JSON.parse(savedDocs) : [];
  });
  
  const [documentStats, setDocumentStats] = useState(() => {
    const savedStats = localStorage.getItem("documind_stats");
    return savedStats ? JSON.parse(savedStats) : {};
  });
  
  const [currentNamespace, setCurrentNamespace] = useState("");
  
  const dragCount = useRef(0);

  useEffect(() => {
    localStorage.setItem("documind_chats", JSON.stringify(chatLog));
    localStorage.setItem("documind_docs", JSON.stringify(documents));
    localStorage.setItem("documind_stats", JSON.stringify(documentStats));
  }, [chatLog, documents, documentStats]);

  // Handle Drag & Drop globally
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCount.current += 1;
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCount.current -= 1;
      if (dragCount.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      dragCount.current = 0;
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile.type !== 'application/pdf') {
          toast.error('Only PDF files are supported.');
          return;
        }
        await processUpload(droppedFile);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processUpload = async (fileToUpload) => {
    if (isUploading) return;
    setIsUploading(true);
    
    const toastId = toast.loading('Uploading and processing document...');
    
    const formData = new FormData();
    formData.append("pdfDocument", fileToUpload);
    
    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      
      if (data.error) {
        toast.error(`Upload Failed: ${data.error}`, { id: toastId });
        return;
      }
      
      toast.success(`Processed ${data.stats.words} words in ${data.stats.time}s.`, { id: toastId });
      setCurrentNamespace(data.fileName);
      
      setDocuments(prevDocs => {
        if (!prevDocs.includes(data.fileName)) {
          return [...prevDocs, data.fileName];
        }
        return prevDocs;
      });
      
      setDocumentStats(prev => ({
        ...prev,
        [data.fileName]: {
          words: data.stats.words,
          chunks: data.stats.chunks,
          time: data.stats.time
        }
      }));
    } catch {
      toast.error("Network error. Failed to upload PDF.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    if (!currentNamespace) {
      toast.error("Please open a document first (Cmd+K).");
      return;
    }

    const currentQuestion = question.trim();
    setChatLog(prev => ({
      ...prev,
      [currentNamespace]: [...(prev[currentNamespace] || []), { role: "user", text: currentQuestion }]
    }));
    setQuestion("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion, fileName: currentNamespace })
      });
      const data = await response.json();
      
      if (data.error) {
        toast.error(`Error: ${data.error}`);
      }

      setChatLog(prev => ({
        ...prev,
        [currentNamespace]: [...(prev[currentNamespace] || []), { role: "ai", text: data.answer, sources: data.sources }]
      }));
    } catch (error) {
      console.error("Frontend Error: ", error);
      toast.error("Failed to connect to the AI.");
      setChatLog(prev => ({
        ...prev,
        [currentNamespace]: [...(prev[currentNamespace] || []), { role: "ai", text: "Connection error. Could not fetch answer." }]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleDelete = async (fileNameToDelete) => {
    const toastId = toast.loading(`Deleting ${fileNameToDelete}...`);
    try {
      await fetch(`${API_URL}/document/${fileNameToDelete}`, {
        method: "DELETE"
      });
      setDocuments(prevDocs => prevDocs.filter(doc => doc !== fileNameToDelete));
      setChatLog(prevLogs => {
        const newLogs = { ...prevLogs };
        delete newLogs[fileNameToDelete];
        return newLogs;
      });
      setDocumentStats(prev => {
        const newStats = { ...prev };
        delete newStats[fileNameToDelete];
        return newStats;
      });
      if (currentNamespace === fileNameToDelete) {
        setCurrentNamespace("");
      }
      toast.success(`${fileNameToDelete} removed.`, { id: toastId });
    } catch {
      toast.error("Failed to delete document.", { id: toastId });
    }
  };

  const triggerDelete = (fileNameToDelete, e) => {
    e.stopPropagation();
    toast.error(`Delete ${fileNameToDelete}?`, {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: () => handleDelete(fileNameToDelete)
      },
      cancel: {
        label: 'Cancel'
      },
      duration: 5000,
    });
  };

  const triggerClear = () => {
    toast.error('Clear chat history?', {
      description: 'All messages for this document will be removed.',
      action: {
        label: 'Clear',
        onClick: () => setChatLog(prev => ({ ...prev, [currentNamespace]: [] }))
      },
      cancel: {
        label: 'Cancel'
      },
      duration: 5000,
    });
  };

  const name = currentNamespace ? currentNamespace.split(".")[0] : "";
  const currentChat = chatLog[currentNamespace] || [];

  return (
    <div className="flex h-screen flex-col bg-[#09090B] bg-dot-pattern text-zinc-100 font-sans overflow-hidden">
      <Toaster 
        theme="dark" 
        position="bottom-right" 
        toastOptions={{
          style: { background: '#18181B', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA' }
        }} 
      />

      {/* Global Drop Zone Overlay */}
      <UploadBox 
        isDragging={isDragging} 
      />

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 px-6 bg-[#09090B]/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setCurrentNamespace("")}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="font-semibold tracking-tight">DocuMind</span>
          </div>
          
          {currentNamespace && (
            <button 
              onClick={() => setCurrentNamespace("")}
              className="flex items-center gap-2 rounded-full bg-white/5 border border-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/10 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </button>
          )}
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center gap-3">
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <input 
              type="file" 
              accept=".pdf"
              className="hidden" 
              onChange={(e) => {
                if(e.target.files && e.target.files[0]) {
                  processUpload(e.target.files[0]);
                }
              }}
            />
            <Plus className="h-5 w-5 text-zinc-400" />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!currentNamespace ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center p-8"
            >
              <div className="flex flex-col items-center w-full max-w-4xl mx-auto h-full justify-center">
                <div className="flex flex-col items-center text-center max-w-md w-full mb-12 relative z-10">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="mb-8 rounded-full border border-white/5 bg-black/40 backdrop-blur-md p-6 shadow-2xl"
                  >
                    <UploadCloud className="h-12 w-12 text-zinc-400" />
                  </motion.div>
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="mb-4 text-3xl font-semibold tracking-tight text-zinc-100"
                  >
                    Your Workspace
                  </motion.h1>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                    className="text-sm text-zinc-500 mb-8 leading-relaxed"
                  >
                    Drop a PDF anywhere to begin, or search your library below.
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 items-center"
                  >
                    <label className="cursor-pointer rounded-full bg-black/60 backdrop-blur-md px-8 py-3 text-sm font-medium text-zinc-300 hover:bg-black/80 transition-colors border border-white/10 shadow-lg">
                      Upload Document
                      <input 
                        type="file" 
                        accept=".pdf"
                        className="hidden" 
                        onChange={(e) => {
                          if(e.target.files && e.target.files[0]) {
                            processUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </motion.div>
                </div>
                {documents.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full max-w-2xl mt-8 relative z-10"
                  >
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600 mb-4 px-2 text-center">Recent Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.slice(-2).reverse().map(doc => (
                        <div 
                          key={doc}
                          onClick={() => setCurrentNamespace(doc)}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/5 hover:bg-white/5 hover:border-white/10 cursor-pointer transition-all shadow-lg"
                        >
                          <div className="p-2.5 bg-black/50 rounded-xl border border-white/5">
                            <FileText className="h-5 w-5 text-zinc-400" />
                          </div>
                          <div className="flex flex-col truncate flex-1">
                            <span className="text-sm font-medium text-zinc-300 truncate">{doc}</span>
                            {documentStats[doc] && (
                              <span className="text-[10px] text-zinc-500">{documentStats[doc].words} words</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Features ALWAYS at the bottom */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
                  className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl pt-8 border-t border-white/5 relative z-10"
                >
                  <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5">
                    <div className="p-2.5 bg-white/5 rounded-full mb-3"><Zap className="h-4 w-4 text-zinc-400" /></div>
                    <h4 className="text-xs font-semibold text-zinc-300 mb-1">Lightning Fast</h4>
                    <p className="text-[10px] text-zinc-500">Vector-powered search for instant retrieval.</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5">
                    <div className="p-2.5 bg-white/5 rounded-full mb-3"><Brain className="h-4 w-4 text-zinc-400" /></div>
                    <h4 className="text-xs font-semibold text-zinc-300 mb-1">Context Aware</h4>
                    <p className="text-[10px] text-zinc-500">Understands the deep meaning of your documents.</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5">
                    <div className="p-2.5 bg-white/5 rounded-full mb-3"><Shield className="h-4 w-4 text-zinc-400" /></div>
                    <h4 className="text-xs font-semibold text-zinc-300 mb-1">Private & Secure</h4>
                    <p className="text-[10px] text-zinc-500">Documents are parsed locally and temporarily.</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full"
            >
              <div className="flex h-full w-full justify-center gap-6 px-4 relative max-w-[1400px] mx-auto">
                {/* Ambient glow in background for workspace */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-zinc-800/10 blur-[100px] rounded-full pointer-events-none" />
                
                {/* Left Sidebar (Desktop Only) */}
                <div className="hidden lg:flex w-64 h-[calc(100%-2rem)] my-4 flex-col gap-2 z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden pt-2">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 px-3 mb-2">Your Library</h3>
                  <div className="flex flex-col gap-1">
                    {documents.map(doc => {
                      const isActive = currentNamespace === doc;
                      return (
                        <button
                          key={doc}
                          onClick={() => setCurrentNamespace(doc)}
                          className={cn(
                            "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left group cursor-pointer",
                            isActive 
                              ? "bg-white/10 text-white font-medium border border-white/5" 
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <FileText className={cn("h-4 w-4 shrink-0", isActive ? "text-zinc-300" : "text-zinc-500")} />
                            <span className="truncate">{doc}</span>
                          </div>
                          <div
                            onClick={(e) => triggerDelete(doc, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1 rounded hover:bg-white/10 shrink-0"
                            title="Delete Document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Centered Chat Layout */}
                <div className="flex-1 max-w-4xl h-[calc(100%-2rem)] my-4 rounded-3xl flex flex-col z-10 bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="w-24"></div> {/* Spacer for centering mobile pill */}
                    
                    {/* Mobile: Interactive Pill, Desktop: Static Title */}
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={() => setIsCmdKOpen(true)}
                        className="flex lg:hidden items-center gap-3 px-4 py-2 rounded-full bg-black/40 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer shadow-lg group"
                      >
                        <FileText className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                        <span className="text-sm font-medium text-zinc-300">{name}</span>
                        <Search className="h-3.5 w-3.5 text-zinc-600 ml-2" />
                      </button>
                      <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-200">{name}</span>
                      </div>
                    </div>

                    <div className="w-24 flex justify-end">
                      {currentChat.length > 0 && (
                        <button
                          onClick={triggerClear}
                          className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <ChatArea 
                      name={name}
                      currentNamespace={currentNamespace}
                      currentChat={currentChat}
                      setChatLog={setChatLog}
                      isTyping={isTyping}
                      question={question}
                      setQuestion={setQuestion}
                      handleAsk={handleAsk}
                    />
                  </div>
                </div>

                {/* Right Sidebar - Stats (Desktop Only) */}
                <div className="hidden lg:flex w-64 h-[calc(100%-2rem)] my-4 flex-col gap-4 z-10 pt-2">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 px-1 mb-1">Insights</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
                      <FileText className="h-4 w-4 text-zinc-400 mb-1" />
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Chunks</span>
                      <span className="text-sm font-semibold text-zinc-200">{documentStats[currentNamespace]?.chunks || "~"}</span>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
                      <Brain className="h-4 w-4 text-zinc-400 mb-1" />
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Words</span>
                      <span className="text-sm font-semibold text-zinc-200 text-center">{documentStats[currentNamespace]?.words || "~"}</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-sm">
                    <h4 className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-zinc-400" />
                      Vector Status
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-zinc-400">Indexed & Ready</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-sm mt-auto mb-4">
                    <h4 className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-zinc-400" />
                      Processing Time
                    </h4>
                    <span className="text-xs font-semibold text-zinc-200">
                      {documentStats[currentNamespace]?.time ? `${documentStats[currentNamespace].time}s` : "~"}
                    </span>
                    <span className="text-[10px] text-zinc-500 leading-relaxed mt-1">
                      Vector chunking & embedding time.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
