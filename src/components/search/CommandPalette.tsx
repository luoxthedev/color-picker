import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Search, Tag } from "lucide-react";
import { useUiStore } from "@/state/uiStore";
import { useAppStore } from "@/state/appStore";
import { isValidHex, normalizeHex } from "@/lib/color/convert";
import { searchColorNames } from "@/lib/color/names";
import { formatRelativeDate } from "@/lib/utils";

interface ResultItem {
  id: string;
  label: string;
  sublabel: string;
  hex: string;
  kind: "hex" | "name" | "history";
}

export function CommandPalette() {
  const isOpen = useUiStore((s) => s.isSearchOpen);
  const close = useUiStore((s) => s.closeSearch);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const history = useAppStore((s) => s.history);
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUiStore.getState().toggleSearch();
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [close]);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim();
    if (!q) {
      return history.slice(0, 6).map((entry) => ({
        id: entry.id,
        label: entry.hex.toUpperCase(),
        sublabel: formatRelativeDate(entry.createdAt),
        hex: entry.hex,
        kind: "history",
      }));
    }

    const items: ResultItem[] = [];

    if (isValidHex(q)) {
      const hex = normalizeHex(q);
      items.push({ id: `hex-${hex}`, label: hex.toUpperCase(), sublabel: "Couleur HEX", hex, kind: "hex" });
    }

    for (const match of searchColorNames(q)) {
      items.push({
        id: `name-${match.name}`,
        label: match.name,
        sublabel: match.hex.toUpperCase(),
        hex: match.hex,
        kind: "name",
      });
    }

    const historyMatches = history
      .filter((entry) => entry.hex.includes(q.toLowerCase().replace(/^#/, "")))
      .slice(0, 6)
      .map((entry) => ({
        id: entry.id,
        label: entry.hex.toUpperCase(),
        sublabel: `Historique — ${formatRelativeDate(entry.createdAt)}`,
        hex: entry.hex,
        kind: "history" as const,
      }));

    return [...items, ...historyMatches].slice(0, 8);
  }, [query, history]);

  const select = (item: ResultItem) => {
    setActiveColor(item.hex, "manual");
    setActivePage("home");
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-start justify-center bg-black/50 pt-[14vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
            className="glass-panel-strong w-[520px] overflow-hidden rounded-2xl shadow-glass-lg"
          >
            <div className="flex items-center gap-2.5 border-b border-[color:var(--panel-border)] px-4 py-3">
              <Search className="h-4 w-4 text-secondary" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un HEX, un nom de couleur, l'historique…"
                className="w-full bg-transparent text-sm text-[color:var(--text-primary)] placeholder:text-tertiary focus:outline-none"
              />
            </div>

            <div className="max-h-[340px] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-tertiary">Aucun résultat</p>
              ) : (
                results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => select(item)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.08] focus-ring"
                  >
                    <div
                      className="h-8 w-8 shrink-0 rounded-lg border border-[color:var(--panel-border-strong)] shadow-inner"
                      style={{ backgroundColor: item.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">{item.label}</p>
                      <p className="truncate text-[11px] text-tertiary">{item.sublabel}</p>
                    </div>
                    {item.kind === "history" ? (
                      <Clock className="h-3.5 w-3.5 shrink-0 text-tertiary" />
                    ) : (
                      <Tag className="h-3.5 w-3.5 shrink-0 text-tertiary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
