import { motion } from "framer-motion";

export default function DeleteConfirmModal({ transaction, onConfirm, onCancel, isDeleting }) {
  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white rounded-[28px] p-8 shadow-2xl w-full max-w-xs border border-[#E5E5E7]"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8E8E93] mb-2"
          style={{ fontFamily: "system-ui" }}>
          Confirm
        </p>
        <h3 className="text-xl font-normal tracking-tight text-[#1C1C1E] mb-2">
          Delete <em className="italic text-[#8E8E93]">Entry?</em>
        </h3>
        <p className="text-[12px] text-[#AEAEB2] mb-7 leading-relaxed"
          style={{ fontFamily: "system-ui" }}>
          "{transaction?.name}" — ₹{transaction?.amount?.toLocaleString()} will be permanently removed.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3.5 rounded-2xl text-[10px] font-sans tracking-widest uppercase text-[#636366] bg-[#F5F5F7] hover:bg-[#E5E5E7] transition-colors"
            style={{ fontFamily: "system-ui" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3.5 rounded-2xl text-[10px] font-sans tracking-widest uppercase text-white bg-[#1C1C1E] hover:bg-black transition-colors disabled:bg-[#AEAEB2]"
            style={{ fontFamily: "system-ui", cursor: isDeleting ? "not-allowed" : "pointer" }}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}