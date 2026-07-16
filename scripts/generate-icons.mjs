import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceLogo = join(root, "logo.png");
const buildDir = join(root, "build");
const resourcesDir = join(root, "electron", "resources");
const assetsDir = join(root, "src", "assets");

mkdirSync(buildDir, { recursive: true });
mkdirSync(resourcesDir, { recursive: true });
mkdirSync(assetsDir, { recursive: true });

/**
 * Retire le fond noir/sombre, recadre sur le sujet et produit un PNG carré transparent.
 */
async function prepareLogo() {
  const { data, info } = await sharp(sourceLogo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const a = data[i + 3] ?? 0;
      const lum = (r + g + b) / 3;

      // Fond noir opaque → transparent
      if (a > 0 && lum <= 18) {
        data[i + 3] = 0;
        continue;
      }

      if (a > 20 && lum > 18) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    throw new Error("Impossible de détecter le contenu du logo dans logo.png");
  }

  // Marge ~6 % autour du sujet pour éviter un crop trop serré
  const padX = Math.round((maxX - minX + 1) * 0.06);
  const padY = Math.round((maxY - minY + 1) * 0.06);
  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  const right = Math.min(width - 1, maxX + padX);
  const bottom = Math.min(height - 1, maxY + padY);

  const cropped = await sharp(data, {
    raw: { width, height, channels },
  })
    .extract({
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1,
    })
    .png()
    .toBuffer();

  // Carré transparent : le logo remplit bien le cadre
  return sharp(cropped)
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function resizePng(source, size) {
  return sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const cleanedLogo = await prepareLogo();

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffers = await Promise.all(icoSizes.map((size) => resizePng(cleanedLogo, size)));

writeFileSync(join(buildDir, "icon.ico"), await pngToIco(icoBuffers));
writeFileSync(join(buildDir, "icon.png"), await resizePng(cleanedLogo, 512));
writeFileSync(join(assetsDir, "logo.png"), await resizePng(cleanedLogo, 256));
writeFileSync(join(resourcesDir, "logo.png"), await resizePng(cleanedLogo, 256));

const outputs = [
  ["app-icon-256.png", 256],
  ["tray-icon-16.png", 16],
  ["tray-icon-16@2x.png", 32],
  ["tray-icon-32.png", 32],
  ["tray-icon-32@2x.png", 64],
];

for (const [filename, size] of outputs) {
  writeFileSync(join(resourcesDir, filename), await resizePng(cleanedLogo, size));
}

console.log("Icônes générées depuis logo.png (fond retiré, zoomé).");
