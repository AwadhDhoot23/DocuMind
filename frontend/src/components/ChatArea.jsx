import ReactMarkdown from 'react-markdown';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
export default function ChatArea({
  name,
  currentNamespace,
  currentChat,
  setChatLog,
  isTyping,
  question,
  setQuestion,
  handleAsk
}) {
  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      <h1 className="text-3xl font-extrabold text-neutral-400 mx-8 mt-4 mb-6 flex items-center gap-3">
        <div className='flex items-center gap-2 bg-neutral-400 text-black px-4 pr-5 py-2 rounded-md'>
          <ChatIcon fontSize='large'/>Chat
        </div>
      </h1>

      <div className="m-10 bg-neutral-900/80 rounded-xl border border-indigo-100 flex flex-col flex-1 min-h-0">
        {!currentNamespace ? (
          <div className="flex flex-col h-full items-center justify-center text-center">
            <CloseIcon color="error" fontSize='large'/>
            <h2 className="text-2xl font-bold text-neutral-500 mb-2">No Document Selected</h2>
            <p className="text-slate-400 max-w-md">
              Please upload a new PDF or select an existing document from the sidebar to start asking questions.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-lg font-semibold text-neutral-400 m-4 bg-linear-to-r from-neutral-800 to-neutral-700 px-3 py-1 rounded-full border border-neutral-500"> Chat with {name}</h3>
              {currentChat.length > 0 && (
                <button
                  onClick={() => setChatLog(prev => ({ ...prev, [currentNamespace]: [] }))}
                  className="text-sm text-red-500 mr-6 hover:text-red-700 font-medium cursor-pointer"
                >
                  Clear Chat
                </button>
              )}
            </div>

            <div className="flex-1 gap-5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-y-auto mb-6 pr-2 flex flex-col gap-4">
              {currentChat.length === 0 ? (
                <div className="flex  h-full items-center justify-center text-slate-400 italic">
                  Ask a question to start the conversation...
                </div>
              ) : (
                currentChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl mr-2  border shadow-sm ${
                      msg.role === "user"
                        ? "bg-black/70 border-neutral-500 ml-15"
                        : "bg-black/70 border-indigo-100 ml-4 mr-15"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xl">{msg.role === "user" ? "👤" : "🤖"}</span>
                      <strong className={msg.role === "user" ? "text-neutral-400" : "text-neutral-500"}>
                        {msg.role === "user" ? "You" : "DocuMind AI"}
                      </strong>
                    </div>

                    {msg.role === "user" ? (
                      <p className="text-white">{msg.text}</p>
                    ) : (
                      <div>
                        <div className="prose prose-invert  text-white max-w-none mt-4">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        {msg.sources && msg.sources.length > 0 && (
                          <details className="mt-6 pt-4 border-t border-indigo-100/50 cursor-pointer">
                            <summary className="text-xs font-bold text-slate-400 mb-2 tracking-wider hover:text-indigo-600 transition-colors">
                              VIEW SOURCES USED
                            </summary>
                            <div className="flex flex-col gap-3 mt-3 cursor-default">
                              {msg.sources.map((source, idx) => (
                                <div key={idx} className="text-xs text-neutral-400 bg-neutral-800/70 p-3 rounded-md border border-indigo-50">
                                  "...{source}..."
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {isTyping && (
                <div className="p-5 mx-12 bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-600 animate-pulse font-medium">
                  🤖 AI is searching the document...
                </div>
              )}
            </div>

            <div className="flex flex-row gap-4 shrink-0 mt-auto pt-4 border-t border-indigo-100">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="E.g. What is this document about?"
                className="ml-4 mb-4 w-245 text-white  px-4 py-3 placeholder-white rounded-lg border border-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAsk}
                disabled={isTyping}
                className={`mr-4 mb-4 border border-neutral-600 cursor-pointer w-20 px-6 py-3 font-semibold rounded-lg transition-colors shadow-sm ${
                  isTyping ? "bg-slate-800 text-neutral-400" : "bg-blue-700 text-white hover:bg-slate-800"
                }`}
              >
                Ask AI
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
