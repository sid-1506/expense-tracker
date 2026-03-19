import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";

const WORDS = ["expenses.", "wallets.", "spending.", "future."];

function AnimatedHeadline() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="text-left"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      <p
        className="text-[11px] tracking-[0.45em] uppercase mb-8"
        style={{ color: "#8E8E93", fontFamily: "'system-ui', sans-serif" }}
      >
        Personal Ledger
      </p>
      <h1
        className="text-5xl md:text-6xl font-normal tracking-tight leading-[1.08] mb-6"
        style={{ color: "#1C1C1E" }}
      >
        Track your
      </h1>
      <div className="h-[72px] md:h-[80px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.h1
            key={wordIndex}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-6xl font-normal tracking-tight leading-[1.08]"
            style={{ color: "#8E8E93", fontStyle: "italic" }}
          >
            {WORDS[wordIndex]}
          </motion.h1>
        </AnimatePresence>
      </div>
      <p
        className="mt-10 text-sm leading-relaxed max-w-xs"
        style={{ color: "#AEAEB2", fontFamily: "'system-ui', sans-serif" }}
      >
        Login to see your Wallet Flow — a quiet, personal record of where
        your money goes.
      </p>

      <div className="mt-16 flex items-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full"
            style={{ backgroundColor: i === wordIndex % 4 ? "#1C1C1E" : "#E5E5E7" }}
            animate={{ width: i === wordIndex % 4 ? 28 : 8 }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data?.user) {
          setSuccess("Account created! You're being signed in…");
          onAuth(data.user);
        } else {
          setSuccess("Check your email to confirm your account.");
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (data?.user) onAuth(data.user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#F5F5F7", fontFamily: "'Georgia', serif" }}
    >
      {/* LEFT — decorative panel, hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] px-20 py-16 relative overflow-hidden"
        style={{ backgroundColor: "#FAFAFA", borderRight: "1px solid #E5E5E7" }}
      >
        {/* subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#E5E5E7 1px, transparent 1px), linear-gradient(90deg, #E5E5E7 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.35,
          }}
        />

        {/* logo mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: "#1C1C1E", fontFamily: "system-ui" }}
          >
            W
          </div>
          <span
            className="text-sm tracking-widest uppercase"
            style={{ color: "#8E8E93", fontFamily: "system-ui" }}
          >
            Wallet Flow
          </span>
        </div>

        {/* headline */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatedHeadline />
        </motion.div>

        {/* bottom tagline */}
        <p
          className="relative z-10 text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#C7C7CC", fontFamily: "system-ui" }}
        >
          Quiet clarity for your finances
        </p>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: "#1C1C1E", fontFamily: "system-ui" }}
            >
              W
            </div>
            <span
              className="text-sm tracking-widest uppercase"
              style={{ color: "#8E8E93", fontFamily: "system-ui" }}
            >
              Wallet Flow
            </span>
          </div>

          {/* Mode title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-10"
            >
              <p
                className="text-[10px] tracking-[0.4em] uppercase mb-2"
                style={{ color: "#8E8E93", fontFamily: "system-ui" }}
              >
                {mode === "login" ? "sid" : "Get started"}
              </p>
              <h2
                className="text-4xl font-normal tracking-tight"
                style={{ color: "#1C1C1E" }}
              >
                {mode === "login" ? (
                  <>Welcomes <em className="text-[#8E8E93] italic">You</em></>
                ) : (
                  <>Create <em className="text-[#8E8E93] italic">Account</em></>
                )}
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-[9px] tracking-[0.3em] uppercase mb-2"
                style={{ color: "#8E8E93", fontFamily: "system-ui" }}
              >
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl px-5 py-4 text-sm outline-none border transition-all"
                style={{
                  backgroundColor: "#F5F5F7",
                  borderColor: "transparent",
                  fontFamily: "system-ui",
                  color: "#1C1C1E",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#D1D1D6")}
                onBlur={(e) => (e.target.style.borderColor = "transparent")}
              />
            </div>
            <div>
              <label
                className="block text-[9px] tracking-[0.3em] uppercase mb-2"
                style={{ color: "#8E8E93", fontFamily: "system-ui" }}
              >
                Password
              </label>
              <input
                type="password"
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl px-5 py-4 text-sm outline-none border transition-all"
                style={{
                  backgroundColor: "#F5F5F7",
                  borderColor: "transparent",
                  fontFamily: "system-ui",
                  color: "#1C1C1E",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#D1D1D6")}
                onBlur={(e) => (e.target.style.borderColor = "transparent")}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] px-1"
                  style={{ color: "#ef4444", fontFamily: "system-ui" }}
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] px-1"
                  style={{ color: "#22c55e", fontFamily: "system-ui" }}
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 rounded-2xl text-white text-[10px] tracking-[0.2em] uppercase transition-colors"
              style={{
                backgroundColor: loading ? "#AEAEB2" : "#1C1C1E",
                fontFamily: "system-ui",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Login" : "Sign Up"}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setSuccess("");
              }}
              className="text-[11px] transition-colors"
              style={{ color: "#8E8E93", fontFamily: "system-ui" }}
              onMouseEnter={(e) => (e.target.style.color = "#1C1C1E")}
              onMouseLeave={(e) => (e.target.style.color = "#8E8E93")}
            >
              {mode === "login"
                ? "New here? Create account →"
                : "Already have an account? Login →"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}