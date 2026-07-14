import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { useUiStore } from "@/state/uiStore";
import { useAnimationsEnabled } from "@/hooks/useAnimations";
import { useWindowState } from "@/hooks/useWindowState";
import { HomePage } from "@/pages/HomePage";
import { PalettesPage } from "@/pages/PalettesPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { CaptureFlashOverlay } from "@/components/color/CaptureFlashOverlay";
import { CommandPalette } from "@/components/search/CommandPalette";
import { cn } from "@/lib/utils";

const PAGES = {
  home: HomePage,
  palettes: PalettesPage,
  history: HistoryPage,
  favorites: FavoritesPage,
  settings: SettingsPage,
};

export function AppShell() {
  const activePage = useUiStore((s) => s.activePage);
  const windowTransition = useUiStore((s) => s.windowTransition);
  const animationsEnabled = useAnimationsEnabled();
  const { isMaximized } = useWindowState();
  const ActivePageComponent = PAGES[activePage];

  const pageTransition = animationsEnabled
    ? { duration: 0.18, ease: "easeOut" as const }
    : { duration: 0 };

  return (
    <MotionConfig reducedMotion={animationsEnabled ? undefined : "always"}>
      <motion.div
        layout={animationsEnabled}
        animate={{
          borderRadius: isMaximized ? 0 : 16,
          scale: windowTransition === "minimize" ? 0.96 : 1,
          opacity: windowTransition === "minimize" ? 0.82 : 1,
        }}
        transition={{
          duration: animationsEnabled ? 0.22 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "app-gradient-bg flex h-screen w-screen flex-col overflow-hidden border text-[color:var(--text-primary)]",
          isMaximized ? "rounded-none border-transparent" : "rounded-2xl border-[color:var(--panel-border)]",
        )}
      >
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={animationsEnabled ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={animationsEnabled ? { opacity: 0, y: -6 } : undefined}
                transition={pageTransition}
              >
                <ActivePageComponent />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <NotificationCenter />
        <CaptureFlashOverlay />
        <CommandPalette />
      </motion.div>
    </MotionConfig>
  );
}
