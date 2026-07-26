import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

function App() {
  const API_URL= import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState("")
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [chatLog, setChatLog] = useState(() => {
    const savedChats = localStorage.getItem("documind_chats");
    return savedChats ? JSON.parse(savedChats) : {};
  });
  const [uploadStatus, setUploadStatus] = useState("");
  const [documents, setDocuments] = useState(() => {
    const savedDocs = localStorage.getItem("documind_docs");
    return savedDocs ? JSON.parse(savedDocs) : [];
  });
  const [currentNamespace, setCurrentNamespace] = useState("");

  useEffect(() => {
    localStorage.setItem("documind_chats", JSON.stringify(chatLog));
    localStorage.setItem("documind_docs", JSON.stringify(documents));
  }, [chatLog, documents]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file first!");
      return;
    }
    if (isUploading) return; // Block double-clicks!
    setIsUploading(true);
    setUploadStatus("Uploading and processing...(this might take few seconds)")
    const formData = new FormData();
    formData.append("pdfDocument", file);
    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.error) {
        setUploadStatus(`Error: ${data.error}`);
        return;
      }
      setUploadStatus(`Processed! ${data.stats.words} words across ${data.stats.chunks} chunks in ${data.stats.time}s.`);
      setCurrentNamespace(data.fileName);
      setFile(null); // Reset file picker after success
      setDocuments(prevDocs => {
        if (!prevDocs.includes(data.fileName)) {
          return [...prevDocs, data.fileName];
        }
        return prevDocs;
      })
    } catch (error) {
      setUploadStatus("Error Uploading PDF");
    } finally {
      setIsUploading(false);
    }
  }

  const handleAsk = async () => {
    if (!question) {
      return;
    }
    if (!currentNamespace) {
      alert("Please select or upload a document first!");
      return;
    }
    const currentQuestion = question;
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
      setChatLog(prev => ({
        ...prev,
        [currentNamespace]: [...(prev[currentNamespace] || []), { role: "ai", text: data.answer, sources: data.sources }]
      }));

    } catch (error) {
      console.error("Frontend Error: ", error);
      setChatLog(prev => ({
        ...prev,
        [currentNamespace]: [...(prev[currentNamespace] || []), { role: "ai", text: "Error getting answer from AI" }]
      }));
    }
    finally {
      setIsTyping(false);
    }
  }

  const handleDelete = async (fileNameToDelete, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ${fileNameToDelete}?`)) return;
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
      if (currentNamespace === fileNameToDelete) {
        setCurrentNamespace("");
      }
    } catch (error) {
      console.error("Failed to delete document");
    }
  }
  const name = currentNamespace ? currentNamespace.split(".")[0] : "";

  const currentChat = chatLog[currentNamespace] || [];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar
        documents={documents}
        currentNamespace={currentNamespace}
        setCurrentNamespace={setCurrentNamespace}
        handleDelete={handleDelete}
        isDragging={isDragging}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        file={file}
        setFile={setFile}
        handleUpload={handleUpload}
        uploadStatus={uploadStatus}
        isUploading={isUploading}
      />
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
  )
}
export default App
