import type { AppLanguage } from "@shared/types";

const messages = {
  fr: {
    appName: "ColorFlow",
    searchPlaceholder: "Rechercher une couleur…",
    nav: {
      home: "Espace couleur",
      palettes: "Palettes",
      history: "Historique",
      favorites: "Favoris",
      settings: "Paramètres",
    },
    picker: {
      launch: "Lancer la pipette",
      shortcutHint: "Raccourci global configurable",
      inAppOnly: "Disponible dans l'app",
    },
    settings: {
      title: "Paramètres",
      picker: "Pipette",
      globalShortcut: "Raccourci global",
      globalShortcutDesc: "Fonctionne même si ColorFlow est en arrière-plan",
      magnifierZoom: "Zoom de la loupe",
      magnifierZoomDesc: "Facteur d'agrandissement autour du curseur",
      behavior: "Comportement",
      launchAtStartup: "Démarrer avec Windows",
      launchAtStartupDesc: "Lance ColorFlow en arrière-plan à l'ouverture de session",
      closeToTray: "Fermer dans la barre système",
      closeToTrayDesc: "Le bouton fermer masque l'app au lieu de quitter",
      appearance: "Apparence",
      theme: "Thème",
      themeDark: "Sombre",
      themeLight: "Clair",
      themeSystem: "Système",
      animations: "Animations",
      animationsDesc: "Désactiver pour un rendu plus statique",
      general: "Général",
      defaultCopyFormat: "Format de copie par défaut",
      language: "Langue",
      shortcutUpdated: "Raccourci mis à jour",
    },
    copy: {
      copied: "Copié dans le presse-papiers",
      failed: "Impossible de copier la valeur",
    },
    window: {
      minimize: "Réduire",
      maximize: "Agrandir",
      restore: "Restaurer",
      close: "Fermer",
    },
  },
  en: {
    appName: "ColorFlow",
    searchPlaceholder: "Search a color…",
    nav: {
      home: "Color space",
      palettes: "Palettes",
      history: "History",
      favorites: "Favorites",
      settings: "Settings",
    },
    picker: {
      launch: "Launch eyedropper",
      shortcutHint: "Configurable global shortcut",
      inAppOnly: "Available in the app",
    },
    settings: {
      title: "Settings",
      picker: "Eyedropper",
      globalShortcut: "Global shortcut",
      globalShortcutDesc: "Works even when ColorFlow is in the background",
      magnifierZoom: "Magnifier zoom",
      magnifierZoomDesc: "Zoom factor around the cursor",
      behavior: "Behavior",
      launchAtStartup: "Launch at Windows startup",
      launchAtStartupDesc: "Starts ColorFlow in the background when you sign in",
      closeToTray: "Close to system tray",
      closeToTrayDesc: "The close button hides the app instead of quitting",
      appearance: "Appearance",
      theme: "Theme",
      themeDark: "Dark",
      themeLight: "Light",
      themeSystem: "System",
      animations: "Animations",
      animationsDesc: "Disable for a more static UI",
      general: "General",
      defaultCopyFormat: "Default copy format",
      language: "Language",
      shortcutUpdated: "Shortcut updated",
    },
    copy: {
      copied: "Copied to clipboard",
      failed: "Unable to copy value",
    },
    window: {
      minimize: "Minimize",
      maximize: "Maximize",
      restore: "Restore",
      close: "Close",
    },
  },
} as const;

export type I18nMessages = (typeof messages)[AppLanguage];

export function getMessages(language: AppLanguage): I18nMessages {
  return messages[language] ?? messages.fr;
}

export function formatAccelerator(accelerator: string): string {
  return accelerator
    .replace(/CommandOrControl/gi, "Ctrl")
    .replace(/Command/gi, "Cmd")
    .replace(/\+/g, "+");
}
