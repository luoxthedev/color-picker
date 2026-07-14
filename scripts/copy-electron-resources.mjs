import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "dist-electron", "electron", "resources");

mkdirSync(dest, { recursive: true });
cpSync(join(root, "electron", "resources"), dest, { recursive: true });
