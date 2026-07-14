import { motion } from "framer-motion";
import {
  Heart,
  History as HistoryIcon,
  Home,
  Palette,
  Pipette,
  Settings as SettingsIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useUiStore, type PageId } from "@/state/uiStore";
import { useAppStore } from "@/state/appStore";
import { startPicker } from "@/hooks/usePickerBridge";
import { useI18n } from "@/hooks/useI18n";
import { cn, isElectron } from "@/lib/utils";
import { formatAccelerator } from "@/lib/i18n";
import { Kbd } from "@/components/ui/Kbd";
import { Tooltip } from "@/components/ui/Tooltip";

const NAV_ICONS: Record<PageId, typeof Home> = {
  home: Home,
  palettes: Palette,
  history: HistoryIcon,
  favorites: Heart,
  settings: SettingsIcon,
};

export function Sidebar() {
  const activePage = useUiStore((s) => s.activePage);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const pickerShortcut = useAppStore((s) => s.settings.pickerShortcut);
  const t = useI18n();
  const [version, setVersion] = useState(__APP_VERSION__);

  useEffect(() => {
    if (isElectron()) void window.colorflow.app.getVersion().then(setVersion);
  }, []);

  const navItems: { id: PageId; label: string }[] = [
    { id: "home", label: t.nav.home },
    { id: "palettes", label: t.nav.palettes },
    { id: "history", label: t.nav.history },
    { id: "favorites", label: t.nav.favorites },
    { id: "settings", label: t.nav.settings },
  ];

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[color:var(--panel-border)] px-3 py-4">
      <Tooltip
        content={isElectron() ? <span>{t.picker.shortcutHint}</span> : t.picker.inAppOnly}
        side="right"
      >
        <button
          onClick={startPicker}
          className="group relative mb-5 flex h-16 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border border-[color:var(--panel-border)] bg-gradient-to-br from-[color:var(--cta-from)] to-[color:var(--cta-to)] text-[color:var(--text-primary)] shadow-glow transition hover:from-[color:var(--panel-bg-strong)] focus-ring"
        >
          <Pipette className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6" />
          <span className="text-[11px] font-medium">{t.picker.launch}</span>
        </button>
      </Tooltip>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = NAV_ICONS[item.id];
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors focus-ring",
                isActive ? "text-[color:var(--text-primary)]" : "text-secondary hover:text-[color:var(--text-primary)]",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl glass-panel-strong"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-between px-1 pt-4 text-[11px] text-tertiary">
        <span>
          {t.appName} v{version}
        </span>
        <Kbd>{formatAccelerator(pickerShortcut)}</Kbd>
      </div>
    </aside>
  );
}
