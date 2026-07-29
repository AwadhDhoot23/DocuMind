import { UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadBox({
  isDragging
}) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/30 bg-[#18181B] p-12 shadow-2xl transition-all"
          >
            <div className="mb-6 rounded-full bg-white/5 p-6">
              <UploadCloud className="h-12 w-12 text-zinc-300" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-zinc-100">Drop PDF to Upload</h2>
            <p className="text-sm text-zinc-500">Release to securely process document</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
