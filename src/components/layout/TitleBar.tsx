import { Minus, Maximize2, Search, Square, X } from "lucide-react";
import { motion } from "framer-motion";
import { isElectron } from "@/lib/utils";
import { useUiStore } from "@/state/uiStore";
import { useI18n } from "@/hooks/useI18n";
import { useAnimationsEnabled } from "@/hooks/useAnimations";
import { useWindowState } from "@/hooks/useWindowState";
import { Kbd } from "@/components/ui/Kbd";

export function TitleBar() {
  const openSearch = useUiStore((s) => s.openSearch);
  const setWindowTransition = useUiStore((s) => s.setWindowTransition);
  const t = useI18n();
  const animationsEnabled = useAnimationsEnabled();
  const { isMaximized } = useWindowState();

  const runWindowAction = (transition: "minimize" | "maximize", action: () => void) => {
    if (!animationsEnabled) {
      action();
      return;
    }
    setWindowTransition(transition);
    window.setTimeout(() => {
      action();
      setWindowTransition(null);
    }, transition === "minimize" ? 180 : 140);
  };

  return (
    <div className="drag-region flex h-11 shrink-0 items-center justify-between border-b border-[color:var(--panel-border)] px-3">
      <div className="flex items-center gap-2 pl-1">
        <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-400 via-pink-400 to-amber-300" />
        <span className="text-[13px] font-semibold tracking-tight text-[color:var(--text-primary)]">
          {t.appName}
        </span>
      </div>

      <button
        onClick={openSearch}
        className="no-drag flex h-7 w-[280px] items-center gap-2 rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-2.5 text-xs text-secondary transition hover:bg-[color:var(--panel-bg-strong)] focus-ring"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">{t.searchPlaceholder}</span>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </button>

      {isElectron() ? (
        <div className="no-drag flex items-center gap-0.5">
          <motion.button
            whileTap={animationsEnabled ? { scale: 0.9 } : undefined}
            whileHover={animationsEnabled ? { scale: 1.05 } : undefined}
            onClick={() =>
              runWindowAction("minimize", () => window.colorflow.window.minimize())
            }
            className="flex h-7 w-9 items-center justify-center rounded-md text-secondary transition hover:bg-[color:var(--panel-bg-strong)] hover:text-[color:var(--text-primary)]"
            aria-label={t.window.minimize}
          >
            <Minus className="h-3.5 w-3.5" />
          </motion.button>
          <motion.button
            whileTap={animationsEnabled ? { scale: 0.9 } : undefined}
            whileHover={animationsEnabled ? { scale: 1.05 } : undefined}
            onClick={() =>
              runWindowAction("maximize", () => window.colorflow.window.toggleMaximize())
            }
            className="flex h-7 w-9 items-center justify-center rounded-md text-secondary transition hover:bg-[color:var(--panel-bg-strong)] hover:text-[color:var(--text-primary)]"
            aria-label={isMaximized ? t.window.restore : t.window.maximize}
          >
            {isMaximized ? <Maximize2 className="h-3 w-3" /> : <Square className="h-3 w-3" />}
          </motion.button>
          <motion.button
            whileTap={animationsEnabled ? { scale: 0.9 } : undefined}
            whileHover={animationsEnabled ? { scale: 1.05 } : undefined}
            onClick={() => window.colorflow.window.close()}
            className="flex h-7 w-9 items-center justify-center rounded-md text-secondary transition hover:bg-red-500/80 hover:text-white"
            aria-label={t.window.close}
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      ) : (
        <div className="w-[108px]" />
      )}
    </div>
  );
}
