import { BrowserWindow, clipboard, dialog, ipcMain, app } from "electron";
import fs from "node:fs/promises";
import { IpcChannels, type StoreKey, type StoreSchema, type WindowStatePayload } from "../shared/types.js";
import { store } from "./store.js";
import { cancelPicker, confirmPicker, getPickerInitForWebContents, startPicker } from "./windows/pickerWindows.js";
import { registerPickerShortcut } from "./shortcuts.js";
import { setAutostart, getAutostart } from "./autostart.js";
import { getMainWindow } from "./windows/mainWindow.js";

function broadcastStoreChange<K extends StoreKey>(key: K, value: StoreSchema[K]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IpcChannels.StoreOnChanged, { key, value });
  }
}

/** Enregistre tous les handlers IPC. Doit être appelé une seule fois au démarrage. */
export function registerIpcHandlers(): void {
  // Fenêtre principale (contrôles de la barre de titre custom)
  ipcMain.on(IpcChannels.WindowMinimize, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.on(IpcChannels.WindowToggleMaximize, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.on(IpcChannels.WindowClose, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle(IpcChannels.WindowGetState, (event): WindowStatePayload => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return {
      isMaximized: win?.isMaximized() ?? false,
      isMinimized: win?.isMinimized() ?? false,
    };
  });

  // Pipette système
  ipcMain.handle(IpcChannels.PickerStart, () => startPicker());
  ipcMain.handle(IpcChannels.PickerRequestInit, (event) =>
    getPickerInitForWebContents(event.sender.id),
  );
  ipcMain.on(IpcChannels.PickerCancel, () => cancelPicker());
  ipcMain.on(IpcChannels.PickerConfirm, (_event, hex: string) => confirmPicker(hex));

  // Presse-papiers
  ipcMain.on(IpcChannels.ClipboardWriteText, (_event, text: string) => {
    clipboard.writeText(text);
  });

  // Stockage local typé (settings / history / favorites / collections)
  ipcMain.handle(IpcChannels.StoreGet, (_event, key: StoreKey) => {
    return store.get(key);
  });

  ipcMain.handle(IpcChannels.StoreSet, (_event, key: StoreKey, value: unknown) => {
    store.set(key, value as never);

    if (key === "settings") {
      const settings = value as StoreSchema["settings"];
      registerPickerShortcut(settings.pickerShortcut);
      setAutostart(settings.launchAtStartup);
    }

    broadcastStoreChange(key, value as never);
    return true;
  });

  // Raccourci global
  ipcMain.handle(IpcChannels.ShortcutUpdate, (_event, accelerator: string) => {
    return registerPickerShortcut(accelerator);
  });

  // Démarrage automatique avec Windows
  ipcMain.handle(IpcChannels.AutostartGet, () => getAutostart());
  ipcMain.handle(IpcChannels.AutostartSet, (_event, enabled: boolean) => {
    setAutostart(enabled);
    return getAutostart();
  });

  // Export de fichiers (JSON / CSS / SCSS / Tailwind / PNG)
  ipcMain.handle(
    IpcChannels.ExportSaveFile,
    async (_event, payload: { defaultName: string; content: string; filters: { name: string; extensions: string[] }[] }) => {
      const win = getMainWindow();
      const dialogOptions = { defaultPath: payload.defaultName, filters: payload.filters };
      const { canceled, filePath } = win
        ? await dialog.showSaveDialog(win, dialogOptions)
        : await dialog.showSaveDialog(dialogOptions);
      if (canceled || !filePath) return { success: false as const };
      await fs.writeFile(filePath, payload.content, "utf-8");
      return { success: true as const, filePath };
    },
  );

  ipcMain.handle(
    IpcChannels.ExportSavePng,
    async (_event, payload: { defaultName: string; dataUrl: string }) => {
      const win = getMainWindow();
      const dialogOptions = {
        defaultPath: payload.defaultName,
        filters: [{ name: "Image PNG", extensions: ["png"] }],
      };
      const { canceled, filePath } = win
        ? await dialog.showSaveDialog(win, dialogOptions)
        : await dialog.showSaveDialog(dialogOptions);
      if (canceled || !filePath) return { success: false as const };
      const base64 = payload.dataUrl.replace(/^data:image\/png;base64,/, "");
      await fs.writeFile(filePath, Buffer.from(base64, "base64"));
      return { success: true as const, filePath };
    },
  );

  // Cycle de vie
  ipcMain.handle(IpcChannels.AppGetVersion, () => app.getVersion());
  ipcMain.on(IpcChannels.AppQuit, () => app.quit());
}
