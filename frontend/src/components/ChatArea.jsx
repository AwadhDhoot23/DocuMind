import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Bot, User, CornerDownRight } from 'lucide-react';
import { cn } from '../utils';

export default function ChatArea({
  currentChat,
  isTyping,
  question,
  setQuestion,
  handleAsk
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat, isTyping]);

  return (
    <div className="flex h-full flex-col bg-transparent relative z-10">
      {/* Header handled by parent now */}

      <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-6">
        {currentChat.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Send a message to start exploring the document.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {currentChat.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  {msg.role === "user" ? (
                    <>
                      <span className="text-xs font-medium text-zinc-400">You</span>
                      <User className="h-3.5 w-3.5 text-zinc-500" />
                    </>
                  ) : (
                    <>
                      <Bot className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="text-xs font-medium text-zinc-400">DocuMind</span>
                    </>
                  )}
                </div>

                <div
                  className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-white/10 text-zinc-100 rounded-tr-sm"
                      : "bg-transparent border border-white/10 text-zinc-300 rounded-tl-sm shadow-sm"
                  )}
                >
                  {msg.role === "user" ? (
                    <p>{msg.text}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border-white/10">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                  <details className="mt-2 text-xs group cursor-pointer ml-1 max-w-full">
                    <summary className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors font-medium">
                      <CornerDownRight className="h-3 w-3" />
                      View {msg.sources.length} sources
                    </summary>
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 flex flex-col gap-2 pl-4 border-l-2 border-white/20"
                    >
                      {msg.sources.map((source, idx) => (
                        <div key={idx} className="bg-black/20 p-2.5 rounded-lg text-zinc-400 font-mono text-[10px] leading-relaxed break-words whitespace-pre-wrap">
                          {source}
                        </div>
                      ))}
                    </motion.div>
                  </details>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col max-w-[85%] items-start mr-auto"
          >
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <Bot className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs font-medium text-zinc-400">DocuMind is thinking</span>
            </div>
            <div className="px-5 py-4 rounded-2xl bg-transparent border border-white/5 shadow-sm rounded-tl-sm flex items-center gap-2 text-sm">
              <span className="flex gap-1.5 items-center">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-zinc-500" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0}} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-zinc-500" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.15}} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-zinc-500" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.3}} />
              </span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-transparent border-t border-white/5">
        <div className="relative flex items-center bg-[#18181B] rounded-2xl border border-white/10 shadow-inner focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-all">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Message Document..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 px-5 py-3.5 focus:outline-none"
          />
          <button
            onClick={handleAsk}
            disabled={isTyping || !question.trim()}
            className="absolute right-2 p-1.5 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:bg-white/10 disabled:text-zinc-500 transition-colors"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center mt-2 text-[10px] text-zinc-600">
          DocuMind answers strictly from the provided context.
        </div>
      </div>
    </div>
  );
}
