import { useAppStore } from "@/state/appStore";
import { useColorSnapshot } from "@/hooks/useColorSnapshot";
import { ColorHero } from "@/components/color/ColorHero";
import { ColorFormatsList } from "@/components/color/ColorFormatsList";
import { DevFormatsList } from "@/components/color/DevFormatsList";
import { ContrastPanel } from "@/components/color/ContrastPanel";

export function HomePage() {
  const activeColorHex = useAppStore((s) => s.activeColorHex);
  const color = useColorSnapshot(activeColorHex);

  if (!color) return null;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <ColorHero color={color} />

      <div className="grid grid-cols-[1.1fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <ColorFormatsList color={color} />
          <ContrastPanel color={color} />
        </div>
        <DevFormatsList color={color} />
      </div>
    </div>
  );
}
