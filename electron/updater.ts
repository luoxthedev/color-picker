import { app, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { IpcChannels, type UpdateInfo, type UpdateProgress } from "../shared/types.js";
import { store } from "./store.js";
import { compareSemver, parseReleaseTag } from "./updaterUtils.js";
import { getMainWindow } from "./windows/mainWindow.js";

const GITHUB_OWNER = "luoxthedev";
const GITHUB_REPO = "color-picker";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const CHECK_DELAY_MS = 3000;

interface GitHubRelease {
  tag_name: string;
  body: string | null;
  html_url: string;
  assets: { name: string; browser_download_url: string; size: number }[];
}

let pendingUpdate: UpdateInfo | null = null;
let downloadedFilePath: string | null = null;
let checkTimer: ReturnType<typeof setTimeout> | null = null;

export function isPortableBuild(): boolean {
  return !!process.env.PORTABLE_EXECUTABLE_DIR;
}

function getUpdateDir(): string {
  return path.join(app.getPath("temp"), "colorflow-updates");
}

function sendToRenderer(channel: string, payload: unknown): void {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

function emitProgress(progress: UpdateProgress): void {
  sendToRenderer(IpcChannels.UpdaterOnProgress, progress);
}

function emitError(message: string): void {
  sendToRenderer(IpcChannels.UpdaterOnError, { message });
}

function getAssetName(version: string): string {
  return isPortableBuild()
    ? `ColorFlow-Portable-${version}.exe`
    : `ColorFlow-Setup-${version}.exe`;
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  const response = await fetch(GITHUB_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ColorFlow-Updater",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return (await response.json()) as GitHubRelease;
}

function findAsset(release: GitHubRelease, version: string) {
  const assetName = getAssetName(version);
  return release.assets.find((a) => a.name === assetName);
}

export async function checkForUpdates(manual = false): Promise<UpdateInfo | null> {
  if (process.env.NODE_ENV === "development") return null;

  const currentVersion = app.getVersion();
  const updateStore = store.get("update");
  const dismissedVersion = updateStore.dismissedVersion;

  emitProgress({ phase: "checking", percent: 0, message: "checking" });

  try {
    const release = await fetchLatestRelease();
    if (!release) return null;

    const version = parseReleaseTag(release.tag_name);
    if (compareSemver(version, currentVersion) <= 0) {
      if (manual) {
        emitProgress({ phase: "idle", percent: 0, message: "upToDate" });
      }
      store.set("update", { ...updateStore, lastCheckAt: Date.now() });
      return null;
    }

    if (!manual && dismissedVersion === version) {
      return null;
    }

    const asset = findAsset(release, version);
    if (!asset) {
      throw new Error(`Asset not found: ${getAssetName(version)}`);
    }

    const info: UpdateInfo = {
      version,
      currentVersion,
      releaseNotes: release.body ?? "",
      releaseUrl: release.html_url,
      downloadUrl: asset.browser_download_url,
      assetName: asset.name,
      assetSize: asset.size,
      isPortable: isPortableBuild(),
    };

    pendingUpdate = info;
    store.set("update", { ...updateStore, lastCheckAt: Date.now() });
    sendToRenderer(IpcChannels.UpdaterOnAvailable, info);
    return info;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[updater] Check failed:", message);
    if (manual) emitError(message);
    return null;
  }
}

function downloadFile(url: string, destPath: string, totalBytes: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let received = 0;

    const request = (downloadUrl: string) => {
      https
        .get(downloadUrl, { headers: { "User-Agent": "ColorFlow-Updater" } }, (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            request(response.headers.location);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Download failed: HTTP ${response.statusCode}`));
            return;
          }

          const contentLength = parseInt(response.headers["content-length"] ?? "0", 10) || totalBytes;

          response.on("data", (chunk: Buffer) => {
            received += chunk.length;
            const percent = contentLength > 0 ? Math.min(99, Math.round((received / contentLength) * 100)) : 0;
            emitProgress({
              phase: "downloading",
              percent,
              message: "downloading",
              bytesReceived: received,
              totalBytes: contentLength,
            });
          });

          response.pipe(file);

          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(destPath, () => reject(err));
        });
    };

    request(url);
    file.on("error", (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

export async function downloadUpdate(): Promise<string | null> {
  if (!pendingUpdate) return null;

  const { version, downloadUrl, assetName, assetSize } = pendingUpdate;

  emitProgress({ phase: "downloading", percent: 0, message: "connecting" });

  try {
    const updateDir = getUpdateDir();
    await fsPromises.mkdir(updateDir, { recursive: true });
    const destPath = path.join(updateDir, assetName);

    await downloadFile(downloadUrl, destPath, assetSize);

    downloadedFilePath = destPath;
    emitProgress({ phase: "ready", percent: 100, message: "ready", version });
    sendToRenderer(IpcChannels.UpdaterOnReady, { filePath: destPath, version, isPortable: pendingUpdate.isPortable });
    return destPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    emitError(message);
    return null;
  }
}

export async function installUpdate(): Promise<void> {
  if (!downloadedFilePath || !fs.existsSync(downloadedFilePath)) {
    emitError("Installer file not found");
    return;
  }

  if (isPortableBuild()) {
    await shell.openPath(downloadedFilePath);
    return;
  }

  spawn(downloadedFilePath, [], { detached: true, stdio: "ignore" }).unref();
  app.quit();
}

export function dismissUpdate(version: string): void {
  const updateStore = store.get("update");
  store.set("update", { ...updateStore, dismissedVersion: version });
  pendingUpdate = null;
}

export function openReleasePage(): void {
  if (pendingUpdate?.releaseUrl) {
    void shell.openExternal(pendingUpdate.releaseUrl);
  }
}

export function initUpdater(): void {
  if (process.env.NODE_ENV === "development") return;

  if (checkTimer) clearTimeout(checkTimer);
  checkTimer = setTimeout(() => {
    void checkForUpdates(false);
  }, CHECK_DELAY_MS);
}

export function getPendingUpdate(): UpdateInfo | null {
  return pendingUpdate;
}
