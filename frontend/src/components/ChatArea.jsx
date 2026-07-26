import ReactMarkdown from 'react-markdown';

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
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8 flex items-center gap-3">
        <span className="text-4xl">📄</span> DocuMind Chat
      </h1>

      <div className="p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col h-[600px]">
        {!currentNamespace ? (
          <div className="flex flex-col h-full items-center justify-center text-center">
            <span className="text-6xl mb-4">👈</span>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">No Document Selected</h2>
            <p className="text-slate-500 max-w-md">
              Please upload a new PDF or select an existing document from the sidebar to start asking questions.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-lg font-semibold text-slate-700"> Chat with {name}</h3>
              {currentChat.length > 0 && (
                <button
                  onClick={() => setChatLog(prev => ({ ...prev, [currentNamespace]: [] }))}
                  className="text-sm text-red-500 hover:text-red-700 font-medium cursor-pointer"
                >
                  Clear Chat
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto mb-6 pr-2 flex flex-col gap-4">
              {currentChat.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-400 italic">
                  Ask a question to start the conversation...
                </div>
              ) : (
                currentChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl border shadow-sm ${
                      msg.role === "user"
                        ? "bg-white border-slate-200 ml-12"
                        : "bg-white border-indigo-100 mr-12"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{msg.role === "user" ? "👤" : "🤖"}</span>
                      <strong className={msg.role === "user" ? "text-slate-800" : "text-indigo-900"}>
                        {msg.role === "user" ? "You" : "DocuMind AI"}
                      </strong>
                    </div>

                    {msg.role === "user" ? (
                      <p className="text-slate-700">{msg.text}</p>
                    ) : (
                      <div>
                        <div className="prose prose-slate max-w-none mt-4">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        {msg.sources && msg.sources.length > 0 && (
                          <details className="mt-6 pt-4 border-t border-indigo-100/50 cursor-pointer">
                            <summary className="text-xs font-bold text-slate-400 mb-2 tracking-wider hover:text-indigo-600 transition-colors">
                              VIEW SOURCES USED
                            </summary>
                            <div className="flex flex-col gap-2 mt-3 cursor-default">
                              {msg.sources.map((source, idx) => (
                                <div key={idx} className="text-xs text-slate-500 bg-indigo-50/30 p-3 rounded-md border border-indigo-50">
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
                <div className="p-5 mr-12 bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-600 animate-pulse font-medium">
                  🤖 AI is searching the document...
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 shrink-0 mt-auto pt-4 border-t border-indigo-100">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="E.g., What is this document about?"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAsk}
                disabled={isTyping}
                className={`cursor-pointer w-full px-6 py-3 font-semibold rounded-lg transition-colors shadow-sm ${
                  isTyping ? "bg-slate-400 text-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
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
