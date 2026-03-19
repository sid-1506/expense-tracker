import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  LayoutGroup,
} from "framer-motion";
import { supabase } from "./supabaseClient";
import AuthPage from "./AuthPage";
import ToastContainer from "./components/ToastContainer.jsx";
import DeleteConfirmModal from "./components/DeleteConfirmModal.jsx";

// ── Data & Logic Constants ──────────────────────────────────────────────────
const initialWallets = [
  { id: "amazon", name: "Amazon Pay", icon: "A" },
  { id: "wallet", name: "Wallet", icon: "W" },
  { id: "instant", name: "Instant", icon: "I" },
  { id: "safe", name: "Safe", icon: "S" },
];

const CATEGORY_MAP = {
  food: ["pani puri","dinner","lunch","cafe","starbucks","burger","pizza","swiggy","zomato"],
  groceries: ["milk","eggs","mart","blinkit","zepto"],
  transport: ["uber","ola","auto","petrol","fuel","train"],
  entertainment: ["netflix","movie","prime","spotify","gaming"],
  shopping: ["amazon","myntra","clothes","shoes"],
};

const getCategory = (name) => {
  const n = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((k) => n.includes(k))) return cat;
  }
  return "other";
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function computeBalances(transactions, topUps, walletDefaults) {
  const spent = {};
  transactions.forEach((t) => {
    spent[t.wallet] = (spent[t.wallet] || 0) + t.amount;
  });

  return initialWallets.map((w) => ({
    ...w,
    balance:
      (walletDefaults[w.id] || 0) + (topUps[w.id] || 0) - (spent[w.id] || 0),
  }));
}

// ── Animated Counter Hook ─────────────────────────────────────────────────────
function useAnimatedNumber(target, duration = 800) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf = useRef(null);

  useEffect(() => {
    const from = prev.current;
    const to = target;
    if (from === to) return;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) raf.current = requestAnimationFrame(step);
      else prev.current = to;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

function AnimatedBalance({ value, className, prefix = "₹" }) {
  const animated = useAnimatedNumber(value);
  return (
    <span className={className}>
      {prefix}
      {animated.toLocaleString("en-IN")}
    </span>
  );
}

// ── Toast Hook ────────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
}

// ── Modals ────────────────────────────────────────────────────────────────────
function AddMoneyModal({ wallet, onClose, onConfirm }) {
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleConfirm = (e) => {
    if (e) e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSuccess(true);
    onConfirm(wallet.id, amt);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative bg-white rounded-[28px] p-8 shadow-2xl w-full max-w-sm border border-[#E5E5E7]"
      >
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8E8E93] mb-2">
          Deposit to
        </p>
        <h3 className="text-2xl mb-6">{wallet.name}</h3>
        {success ? (
          <div className="py-6 text-center text-[#22c55e] font-sans text-sm">
            Transfer Complete
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <input
              ref={inputRef}
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-4 font-sans text-lg outline-none border border-transparent focus:border-[#D1D1D6]"
            />
            <button
              type="submit"
              className="w-full bg-[#1C1C1E] text-white py-4 rounded-2xl font-sans text-[11px] tracking-widest uppercase hover:bg-black transition-colors"
            >
              Confirm
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function BudgetModal({ currentBudget, onClose, onSave }) {
  const [val, setVal] = useState(currentBudget);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(val);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative bg-white rounded-[28px] p-8 shadow-2xl w-full max-w-sm border border-[#E5E5E7]"
      >
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8E8E93] mb-2">
          Adjust Limit
        </p>
        <h3 className="text-2xl mb-6 font-serif italic">Monthly Budget</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-4 font-sans text-lg outline-none mb-4"
          />
          <button
            type="submit"
            className="w-full bg-[#1C1C1E] text-white py-4 rounded-2xl font-sans text-[11px] tracking-widest uppercase hover:bg-black transition-colors"
          >
            Save Budget
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Command Palette ───────────────────────────────────────────────────────────
function CommandPalette({ isOpen, onClose, actions }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.98, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: -10 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-[#E5E5E7] overflow-hidden"
          >
            <div className="flex items-center px-5 border-b border-[#F5F5F7]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onKeyDown={handleKeyDown}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command..."
                className="w-full h-14 bg-transparent outline-none px-4 font-sans text-sm"
              />
              <div className="bg-[#F5F5F7] px-2 py-1 rounded text-[9px] font-sans text-[#8E8E93]">
                ESC
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filtered.map((action, i) => (
                <button
                  key={i}
                  onClick={() => { action.run(); onClose(); }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between group ${selectedIndex === i ? "bg-[#F5F5F7]" : "hover:bg-[#F5F5F7]"}`}
                >
                  <span className="font-sans text-sm text-[#1C1C1E]">{action.label}</span>
                  <span className={`text-[10px] font-sans text-[#8E8E93] uppercase tracking-widest ${selectedIndex === i ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    Execute
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-[#8E8E93] font-sans text-xs">
                  No commands found
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.8">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p
        className="text-[11px] text-[#1C1C1E] mb-1 tracking-tight font-sans"
        style={{ fontFamily: "system-ui" }}
      >
        No expenses yet
      </p>
      <p className="text-[11px] text-[#AEAEB2]" style={{ fontFamily: "system-ui" }}>
        Start tracking your spending
      </p>
    </motion.div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [walletDefaults, setWalletDefaults] = useState({});
  const [topUps, setTopUps] = useState(() =>
    JSON.parse(localStorage.getItem("et_tu") || "{}"),
  );
  const [monthlyBudget, setMonthlyBudget] = useState(() =>
    JSON.parse(localStorage.getItem("et_bg") || "10000"),
  );

  const [form, setForm] = useState({ name: "", amount: "", wallet: "amazon", id: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [addMoneyWallet, setAddMoneyWallet] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const { toasts, addToast, removeToast } = useToasts();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // ── Auth bootstrap ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Fetch user-scoped expenses + wallet init ────────────────────────────────
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setWalletDefaults({});
      return;
    }

    const fetchData = async () => {
      setIsLoadingData(true);

      // ── Wallet row fetch ────────────────────────────────────────────────
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        // Unexpected query error — fall back to zeros, do not attempt insert
        console.error("Wallet fetch error:", error);
        setWalletDefaults({ amazon: 0, wallet: 0, instant: 0, safe: 0 });
      } else if (data) {
        // CASE A — Existing user: hydrate from DB
        setWalletDefaults({
          amazon: data.amazon || 0,
          wallet: data.wallet || 0,
          instant: data.instant || 0,
          safe: data.safe || 0,
        });
      } else {
        // CASE B — New user: no row found, insert with all zeros
        const { data: newWallet, error: insertError } = await supabase
          .from("wallets")
          .insert([{
            user_id: user.id,
            amazon: 0,
            wallet: 0,
            instant: 0,
            safe: 0,
          }])
          .select()
          .single();

        if (insertError) {
          console.error("Wallet insert error:", insertError);
          // Graceful fallback — keep UI functional with zeros
          setWalletDefaults({ amazon: 0, wallet: 0, instant: 0, safe: 0 });
        } else {
          setWalletDefaults({
            amazon: newWallet.amazon || 0,
            wallet: newWallet.wallet || 0,
            instant: newWallet.instant || 0,
            safe: newWallet.safe || 0,
          });
        }
      }

      // ── Expenses fetch ──────────────────────────────────────────────────
      const { data: expenseData, error: expenseError } = await supabase
        .from("Expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!expenseError && expenseData) {
        const mapped = expenseData.map((row) => ({
          id: row.id,
          name: row.name,
          amount: row.amount,
          wallet: row.wallet,
          category: row.category,
          date: row.created_at,
        }));
        setTransactions(mapped);
      }

      setIsLoadingData(false);
    };

    fetchData();
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTransactions([]);
    setWalletDefaults({});
  };

  const expenseInputRef = useRef(null);
  const historySearchRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("et_tu", JSON.stringify(topUps));
    localStorage.setItem("et_bg", JSON.stringify(monthlyBudget));
  }, [topUps, monthlyBudget]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (
        e.key.toLowerCase() === "n" &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA" &&
        e.target.tagName !== "SELECT"
      ) {
        e.preventDefault();
        expenseInputRef.current?.focus();
        window.scrollTo({ top: 400, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const wallets = useMemo(
    () => computeBalances(transactions, topUps, walletDefaults),
    [transactions, topUps, walletDefaults],
  );
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);

  const selectedWalletBalance = wallets.find((w) => w.id === form.wallet)?.balance || 0;
  const isInsufficient = parseFloat(form.amount) > selectedWalletBalance;

  // ── Add / Update Expense ────────────────────────────────────────────────────
  const addExpenseToDB = async (expense) => {
    try {
      const { data, error } = await supabase
        .from("Expenses")
        .insert([{
          user_id: user ? user.id : null,
          name: expense.name,
          amount: expense.amount,
          wallet: expense.wallet,
          category: expense.category,
        }])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
      } else if (data?.[0]) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === expense.id
              ? { ...t, id: data[0].id, date: data[0].created_at }
              : t,
          ),
        );
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const handleAddOrUpdate = async (e) => {
    if (e) e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.name || !amt || isInsufficient) return;

    setIsSaving(true);

    if (isEditing) {
      const { error } = await supabase
        .from("Expenses")
        .update({ name: form.name, amount: amt, wallet: form.wallet })
        .eq("id", form.id);

      if (!error) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === form.id ? { ...t, ...form, amount: amt } : t)),
        );
        addToast("Expense updated");
      }
      setIsEditing(false);
    } else {
      const tempId = Date.now();
      const newExpense = {
        ...form,
        amount: amt,
        category: getCategory(form.name),
        id: tempId,
        date: new Date().toISOString(),
      };

      setTransactions((prev) => [newExpense, ...prev]);
      await addExpenseToDB(newExpense);
      addToast("Expense added");
    }

    setForm({ name: "", amount: "", wallet: "amazon", id: null });
    setIsSaving(false);
  };

  // ── Delete with confirmation ────────────────────────────────────────────────
  const requestDelete = (transaction) => {
    setDeleteTarget(transaction);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from("Expenses")
      .delete()
      .eq("id", deleteTarget.id);

    if (!error) {
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      addToast("Expense deleted");
    } else {
      console.error("Delete failed:", error);
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    if (!isDeleting) setDeleteTarget(null);
  };

  const startEdit = (t) => {
    setForm(t);
    setIsEditing(true);
    window.scrollTo({ top: 400, behavior: "smooth" });
    setTimeout(() => expenseInputRef.current?.focus(), 100);
  };

  const exportCSV = () => {
    const headers = ["Date", "Name", "Amount", "Wallet", "Category"];
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.name,
      t.amount,
      t.wallet,
      getCategory(t.name),
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "expense_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analytics = useMemo(() => {
    const modeTotals = {};
    initialWallets.forEach((w) => (modeTotals[w.id] = 0));
    transactions.forEach((t) => {
      modeTotals[t.wallet] = (modeTotals[t.wallet] || 0) + t.amount;
    });

    const paymentData = initialWallets.map((w) => ({
      name: w.name,
      id: w.id,
      amount: modeTotals[w.id],
    }));

    const colors = { amazon: "#1C1C1E", wallet: "#636366", instant: "#AEAEB2", safe: "#D1D1D6" };

    if (!transactions.length)
      return { insights: ["No data yet."], paymentData, colors, avgDailySpend: 0 };

    const cats = {};
    transactions.forEach((t) => {
      const c = getCategory(t.name);
      cats[c] = (cats[c] || 0) + t.amount;
    });
    const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);

    const uniqueDays = new Set(transactions.map((t) => t.date.split("T")[0])).size;
    const avgDailySpend = totalSpent / Math.max(1, uniqueDays);

    const daysLeft = Math.max(0, Math.floor((monthlyBudget - totalSpent) / avgDailySpend));
    const topWallet = wallets.reduce((prev, current) =>
      prev.balance > current.balance ? prev : current,
    );

    return {
      insights: [
        `Spending focus: ${sortedCats[0] ? sortedCats[0][0].toUpperCase() : "N/A"}`,
        daysLeft < 5
          ? `Urgent: Budget deplete in ~${daysLeft} days.`
          : `Forecast: Budget will last ${daysLeft} more days.`,
        `Average daily spend: ₹${Math.round(avgDailySpend)}`,
        `Strongest reserve: ${topWallet.name}`,
      ],
      paymentData,
      colors,
      avgDailySpend,
    };
  }, [transactions, totalSpent, monthlyBudget, wallets]);

  const commandActions = [
    {
      label: "Add Expense",
      run: () => {
        window.scrollTo({ top: 400, behavior: "smooth" });
        setTimeout(() => expenseInputRef.current?.focus(), 500);
      },
    },
    {
      label: "Search Transactions",
      run: () => {
        window.scrollTo({ top: 400, behavior: "smooth" });
        setTimeout(() => historySearchRef.current?.focus(), 500);
      },
    },
    {
      label: "Open Analytics",
      run: () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
    },
    { label: "Export CSV", run: () => exportCSV() },
    { label: "Set Monthly Budget", run: () => setIsBudgetOpen(true) },
    { label: "Logout", run: () => logout() },
  ];

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  // ── Render: loading ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F5F7" }}>
        <div className="text-[10px] tracking-[0.4em] uppercase" style={{ color: "#8E8E93", fontFamily: "system-ui" }}>
          Loading…
        </div>
      </div>
    );
  }

  // ── Render: auth gate ───────────────────────────────────────────────────────
  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

  // ── Render: main dashboard ──────────────────────────────────────────────────
  const filteredTransactions = transactions.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const showFundHint = wallets.every((w) => w.balance === 0) && transactions.length === 0;

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1C1C1E] selection:bg-black selection:text-white"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      {/* ── Toast Notifications ─────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={commandActions}
      />

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            transaction={deleteTarget}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addMoneyWallet && (
          <AddMoneyModal
            wallet={addMoneyWallet}
            onClose={() => setAddMoneyWallet(null)}
            onConfirm={(id, amt) =>
              setTopUps((prev) => ({ ...prev, [id]: (prev[id] || 0) + amt }))
            }
          />
        )}
        {isBudgetOpen && (
          <BudgetModal
            currentBudget={monthlyBudget}
            onClose={() => setIsBudgetOpen(false)}
            onSave={setMonthlyBudget}
          />
        )}
      </AnimatePresence>

      {/* Top-right user badge */}
      <div className="fixed top-5 right-6 z-50 flex items-center gap-3">
        <span className="hidden sm:block text-[9px] font-sans tracking-widest uppercase text-[#AEAEB2]">
          {user.email}
        </span>
        <button
          onClick={logout}
          className="bg-white border border-[#E5E5E7] rounded-xl px-4 py-2 text-[9px] font-sans tracking-widest uppercase text-[#636366] hover:bg-[#1C1C1E] hover:text-white transition-all shadow-sm"
        >
          Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-32 flex flex-col">
        {/* Hero Section */}
        <motion.section
          style={{ opacity: heroOpacity }}
          className="order-1 flex flex-col items-center justify-center pt-32 pb-20 text-center"
        >
          <p className="text-[10px] font-sans tracking-[0.5em] text-[#8E8E93] uppercase mb-8">
            Personal Ledger
          </p>
          <h1 className="text-7xl md:text-8xl mb-12 font-normal tracking-tight">
            Wallet <em className="text-[#8E8E93] serif italic">Flow</em>
          </h1>
          <div className="bg-white border border-[#E5E5E7] rounded-[32px] px-16 py-10 shadow-sm">
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#8E8E93] mb-3">
              Available Liquidity
            </p>
            <AnimatedBalance
              value={totalBalance}
              className="text-5xl font-normal tracking-tighter"
            />
          </div>
        </motion.section>

        {/* Wallet Grid */}
        <div className="order-2 grid grid-cols-2 md:grid-cols-4 gap-5 mb-20">
          {wallets.map((w) => (
            <motion.div
              key={w.id}
              whileHover={{ y: -4 }}
              className="relative bg-white border border-[#E5E5E7] rounded-[24px] p-6 shadow-sm group transition-all"
            >
              <button
                tabIndex="0"
                onClick={() => setAddMoneyWallet(w)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F5F7] text-[#8E8E93] hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              >
                +
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-xs font-sans font-bold text-[#636366] mb-5">
                {w.icon}
              </div>
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-[#8E8E93] mb-1">
                {w.name}
              </p>
              <AnimatedBalance value={w.balance} className="text-xl font-medium" />
            </motion.div>
          ))}
        </div>

        {/* First-time user hint */}
        {showFundHint && (
          <p
            className="text-center -mt-14 mb-14 text-[#8E8E93]"
            style={{ fontFamily: "system-ui", fontSize: "11px" }}
          >
            Add funds to start tracking
          </p>
        )}

        {/* Form and History */}
        <div className="order-3 grid lg:grid-cols-[360px_1fr] gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8E8E93] ml-2">
              {isEditing ? "Modify Entry" : "New Entry"}
            </h2>
            <div className="bg-white border border-[#E5E5E7] rounded-[28px] p-8 shadow-sm space-y-4">
              <form onSubmit={handleAddOrUpdate} className="space-y-4">
                <input
                  ref={expenseInputRef}
                  placeholder="Transaction name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-4 font-sans text-sm outline-none border border-transparent focus:border-[#D1D1D6] transition-all"
                />
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={`w-full bg-[#F5F5F7] rounded-2xl px-5 py-4 font-sans text-sm outline-none border transition-all ${isInsufficient ? "border-red-200 focus:border-red-300" : "border-transparent focus:border-[#D1D1D6]"}`}
                  />
                  <AnimatePresence>
                    {isInsufficient && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] text-red-500 font-sans mt-2 ml-1"
                      >
                        Not enough balance in this wallet.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <select
                  value={form.wallet}
                  onChange={(e) => setForm({ ...form, wallet: e.target.value })}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-4 font-sans text-sm outline-none appearance-none cursor-pointer"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (₹{w.balance})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isInsufficient || isSaving}
                  className={`w-full text-white font-sans text-[10px] tracking-[0.2em] uppercase py-5 rounded-2xl transition-all ${isInsufficient || isSaving ? "bg-[#D1D1D6] cursor-not-allowed" : "bg-[#1C1C1E] hover:bg-black active:scale-[0.98]"}`}
                >
                  {isSaving
                    ? "Saving…"
                    : isEditing
                    ? "Update Transaction"
                    : "Record Expense"}
                </button>
              </form>
              {isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setForm({ name: "", amount: "", wallet: "amazon" });
                  }}
                  className="w-full text-[10px] font-sans text-[#8E8E93] uppercase tracking-widest pt-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8E8E93]">
                  History
                </h2>
                <button
                  onClick={exportCSV}
                  className="text-[9px] font-sans uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                >
                  Export CSV
                </button>
              </div>
              <input
                ref={historySearchRef}
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-b border-[#E5E5E7] font-sans text-[11px] py-1 outline-none focus:border-black transition-colors w-32"
              />
            </div>
            <div className="bg-white border border-[#E5E5E7] rounded-[28px] overflow-hidden shadow-sm">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#AEAEB2]"
                    style={{ fontFamily: "system-ui" }}>
                    Loading…
                  </p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="max-h-[460px] overflow-y-auto">
                  <LayoutGroup>
                    <AnimatePresence initial={false}>
                      {filteredTransactions.map((t) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={t.id}
                          className="group relative flex items-center px-8 py-5 border-b border-[#F5F5F7] last:border-0 hover:bg-[#FAFAFA] transition-colors"
                        >
                          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10 bg-[#FAFAFA]/90 px-3 py-1 rounded-full shadow-sm border border-[#E5E5E7]">
                            <button
                              onClick={() => startEdit(t)}
                              className="p-1.5 hover:bg-[#E5E5E7] rounded-full transition-colors"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => requestDelete(t)}
                              className="p-1.5 hover:bg-[#fee2e2] hover:text-[#ef4444] rounded-full transition-colors"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex-1">
                            <p className="font-sans text-[10px] tracking-[0.1em] uppercase font-semibold text-[#1C1C1E]">
                              {t.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-sans text-[#8E8E93] uppercase tracking-wider">
                                {t.wallet}
                              </span>
                              <span className="text-[9px] font-sans text-[#C7C7CC]">•</span>
                              <span className="text-[9px] font-sans text-[#8E8E93] uppercase tracking-wider">
                                {getCategory(t.name)}
                              </span>
                            </div>
                          </div>
                          <p className="font-sans text-sm font-semibold ml-4">
                            ₹{t.amount.toLocaleString()}
                          </p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </LayoutGroup>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="order-4 space-y-8">
          <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8E8E93] ml-2">
            Advanced Analytics
          </h2>
          <div className="bg-white border border-[#E5E5E7] rounded-[32px] p-10 shadow-sm">
            <div className="grid md:grid-cols-2 gap-16 items-start">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="relative w-40 h-40 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {analytics.paymentData.map((data, i) => {
                      const total = analytics.paymentData.reduce((acc, curr) => acc + curr.amount, 0);
                      if (total === 0) return null;
                      const offset = analytics.paymentData
                        .slice(0, i)
                        .reduce((acc, curr) => acc + (curr.amount / total) * 100, 0);
                      const percentage = (data.amount / total) * 100;
                      return (
                        <circle
                          key={data.id}
                          cx="50" cy="50" r="40"
                          fill="transparent"
                          stroke={analytics.colors[data.id]}
                          strokeWidth="12"
                          strokeDasharray={`${percentage} ${100 - percentage}`}
                          strokeDashoffset={-offset}
                        />
                      );
                    })}
                    <circle cx="50" cy="50" r="28" fill="white" />
                  </svg>
                </div>

                <div className="space-y-3 w-full md:w-auto">
                  {analytics.paymentData.map((data) => (
                    <div key={data.id} className="flex items-center justify-between md:justify-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: analytics.colors[data.id] }} />
                        <span className="text-xs font-sans text-[#1C1C1E]">{data.name}</span>
                      </div>
                      <span className="text-xs font-sans text-[#8E8E93]">₹{data.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Forecast Column */}
              <div className="bg-[#F5F5F7] rounded-[24px] p-8 space-y-6">
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#8E8E93]">
                  Predictive Forecast
                </p>
                <div className="grid gap-4">
                  <div className="bg-white/70 p-5 rounded-xl border border-white/50">
                    <p className="text-[10px] font-sans text-[#8E8E93] uppercase mb-2">7 Day Projection</p>
                    <div className="flex items-end justify-between">
                      <AnimatedBalance
                        value={totalBalance - analytics.avgDailySpend * 7}
                        className={`text-xl font-normal ${totalBalance - analytics.avgDailySpend * 7 < 0 ? "text-red-500" : ""}`}
                      />
                      {totalBalance - analytics.avgDailySpend * 7 < 0 && (
                        <span className="text-[8px] font-sans uppercase text-red-500 font-bold border border-red-200 px-2 py-0.5 rounded">
                          ⚠ Deficit
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/70 p-5 rounded-xl border border-white/50">
                    <p className="text-[10px] font-sans text-[#8E8E93] uppercase mb-2">30 Day Projection</p>
                    <div className="flex items-end justify-between">
                      <AnimatedBalance
                        value={totalBalance - analytics.avgDailySpend * 30}
                        className={`text-xl font-normal ${totalBalance - analytics.avgDailySpend * 30 < 0 ? "text-red-500" : ""}`}
                      />
                      {totalBalance - analytics.avgDailySpend * 30 < 0 && (
                        <span className="text-[8px] font-sans uppercase text-red-500 font-bold border border-red-200 px-2 py-0.5 rounded">
                          ⚠ Deficit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[9px] font-sans text-[#8E8E93] italic">
                    Based on daily burn rate of ₹{Math.round(analytics.avgDailySpend)}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Utilization */}
            <div className="mt-16 pt-10 border-t border-[#F5F5F7]">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#8E8E93]">
                      Monthly Budget
                    </p>
                    <button
                      onClick={() => setIsBudgetOpen(true)}
                      className="p-1 hover:bg-[#F5F5F7] rounded-md transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-3xl font-normal tracking-tight">
                    ₹{Number(monthlyBudget).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#8E8E93] mb-1">
                    Utilization
                  </p>
                  <p className="text-2xl font-normal">
                    {Math.round((totalSpent / monthlyBudget) * 100)}%
                  </p>
                </div>
              </div>
              <div className="h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.min(100, (totalSpent / monthlyBudget) * 100)}%` }}
                  className={`h-full ${totalSpent > monthlyBudget ? "bg-red-500" : "bg-[#1C1C1E]"}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}