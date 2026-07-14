import { motion } from "framer-motion";

export function SplashScreen() {
  return (
    <motion.div
      className="app-gradient-bg flex h-screen w-screen flex-col items-center justify-center gap-4 rounded-2xl border border-[color:var(--panel-border)]"
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[color:var(--panel-border-strong)] bg-gradient-to-br from-white/10 to-transparent shadow-glow"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 via-pink-400 to-amber-300" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-sm font-medium tracking-tight text-white/70"
      >
        ColorFlow
      </motion.p>
    </motion.div>
  );
}
