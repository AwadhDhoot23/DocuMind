import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Trash2 } from 'lucide-react';
import { cn } from '../utils';

export default function CommandPalette({
  isOpen,
  setIsOpen,
  documents,
  currentNamespace,
  setCurrentNamespace,
  handleDelete
}) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  const filteredDocs = documents.filter(doc => doc.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 m-auto mt-[15vh] h-fit w-full max-w-xl rounded-2xl border border-white/10 bg-[#09090B]/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 px-2">
              <Search className="h-5 w-5 text-zinc-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search documents or jump to..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <div className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">ESC</div>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1 pb-2">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Your Library
              </h3>
              
              {filteredDocs.length === 0 ? (
                <div className="px-2 py-8 text-center text-sm text-zinc-500">
                  {documents.length === 0 ? "No documents uploaded yet." : "No documents found."}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredDocs.map((doc) => {
                    const isActive = currentNamespace === doc;
                    return (
                      <div
                        key={doc}
                        onClick={() => {
                          setCurrentNamespace(doc);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "group flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 transition-colors",
                          isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        )}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className={cn("h-4 w-4 shrink-0", isActive ? "text-zinc-100" : "text-zinc-500")} />
                          <span className="truncate text-sm">{doc}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="shrink-0 text-xs text-emerald-400/80">Active</span>
                          )}
                          <button
                            onClick={(e) => handleDelete(doc, e)}
                            className="opacity-0 shrink-0 text-zinc-500 hover:text-red-400 group-hover:opacity-100 transition-all focus:outline-none px-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
