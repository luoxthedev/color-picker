import { create } from "zustand";

export type PageId = "home" | "palettes" | "history" | "favorites" | "settings";
export type WindowTransition = "minimize" | "maximize" | null;

interface UiState {
  activePage: PageId;
  isSearchOpen: boolean;
  windowTransition: WindowTransition;
  setActivePage: (page: PageId) => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  setWindowTransition: (transition: WindowTransition) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  activePage: "home",
  isSearchOpen: false,
  windowTransition: null,
  setActivePage: (page) => set({ activePage: page, isSearchOpen: false }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set({ isSearchOpen: !get().isSearchOpen }),
  setWindowTransition: (windowTransition) => set({ windowTransition }),
}));
