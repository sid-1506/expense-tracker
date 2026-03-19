import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Toast Item ────────────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 2800);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 bg-[#1C1C1E] text-white rounded-2xl px-5 py-3.5 shadow-lg"
      style={{ fontFamily: "system-ui", minWidth: "220px", maxWidth: "320px" }}
    >
      {/* Icon dot */}
      <div className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />

      {/* Message */}
      <p className="text-[11px] tracking-[0.15em] uppercase flex-1">{toast.message}</p>

      {/* Dismiss */}
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/40 hover:text-white/80 transition-colors text-xs ml-1"
      >
        ×
      </button>
    </motion.div>
  );
}

// ── Toast Container ────────────────────────────────────────────────────────────
export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}