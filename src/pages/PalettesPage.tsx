import { useMemo } from "react";
import { motion } from "framer-motion";
import type { GeneratedPalette } from "@shared/types";
import { useAppStore } from "@/state/appStore";
import { generateAllPalettes } from "@/lib/color/palette";
import { PaletteCard } from "@/components/color/PaletteCard";
import { renderPaletteToPngDataUrl } from "@/lib/export/paletteExport";
import { savePngFile } from "@/lib/export/fileSave";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export function PalettesPage() {
  const activeColorHex = useAppStore((s) => s.activeColorHex);
  const notify = useAppStore((s) => s.notify);
  const palettes = useMemo(() => generateAllPalettes(activeColorHex), [activeColorHex]);

  const handleExportPng = async (palette: GeneratedPalette) => {
    try {
      const dataUrl = await renderPaletteToPngDataUrl(palette);
      const saved = await savePngFile(`colorflow-${palette.harmony}.png`, dataUrl);
      if (saved) notify("Palette exportée en PNG", "success");
    } catch {
      notify("Export PNG impossible", "warning");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl border border-[color:var(--panel-border-strong)] shadow-glass"
          style={{ backgroundColor: activeColorHex }}
        />
        <div>
          <h2 className="text-[15px] font-semibold text-[color:var(--text-primary)]">Palettes générées</h2>
          <p className="mono-tabular text-[12px] text-tertiary">
            à partir de {activeColorHex.toUpperCase()}
          </p>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4"
      >
        {palettes.map((palette) => (
          <PaletteCard key={palette.harmony} palette={palette} onExportPng={handleExportPng} />
        ))}
      </motion.div>
    </div>
  );
}
