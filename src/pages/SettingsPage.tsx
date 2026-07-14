import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ShortcutRecorder } from "@/components/settings/ShortcutRecorder";
import { useAppStore } from "@/state/appStore";
import { useI18n } from "@/hooks/useI18n";
import { isElectron } from "@/lib/utils";
import type { ReactNode } from "react";

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <p className="text-[13px] font-medium text-[color:var(--text-primary)]">{title}</p>
        {description && <p className="mt-0.5 text-[12px] text-tertiary">{description}</p>}
      </div>
      {control}
    </div>
  );
}

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const notify = useAppStore((s) => s.notify);
  const t = useI18n();
  const [version, setVersion] = useState(__APP_VERSION__);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    if (isElectron()) void window.colorflow.app.getVersion().then(setVersion);
  }, []);

  const handleCheckUpdates = async () => {
    if (!isElectron()) return;
    setCheckingUpdate(true);
    try {
      const result = await window.colorflow.updater.check();
      if (result.status === "upToDate") {
        notify(t.updater.upToDate, "success");
      } else if (result.status === "error") {
        notify(result.message, "warning");
      }
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <h2 className="text-[15px] font-semibold text-[color:var(--text-primary)]">{t.settings.title}</h2>

      <GlassCard className="p-4">
        <h3 className="mb-1 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.settings.picker}</h3>
        <div className="divide-y divide-[color:var(--panel-border)]">
          <SettingRow
            title={t.settings.globalShortcut}
            description={t.settings.globalShortcutDesc}
            control={
              <ShortcutRecorder
                value={settings.pickerShortcut}
                onChange={(accelerator) => {
                  void updateSettings({ pickerShortcut: accelerator });
                  notify(t.settings.shortcutUpdated, "success", accelerator);
                }}
              />
            }
          />
          <SettingRow
            title={t.settings.magnifierZoom}
            description={t.settings.magnifierZoomDesc}
            control={
              <input
                type="range"
                min={2}
                max={16}
                step={1}
                value={settings.magnifierZoom}
                onChange={(e) => void updateSettings({ magnifierZoom: Number(e.target.value) })}
                className="w-40 accent-[color:var(--text-primary)]"
              />
            }
          />
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="mb-1 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.settings.behavior}</h3>
        <div className="divide-y divide-[color:var(--panel-border)]">
          <SettingRow
            title={t.settings.launchAtStartup}
            description={t.settings.launchAtStartupDesc}
            control={
              <Switch
                checked={settings.launchAtStartup}
                onCheckedChange={(checked) => void updateSettings({ launchAtStartup: checked })}
                disabled={!isElectron()}
              />
            }
          />
          <SettingRow
            title={t.settings.closeToTray}
            description={t.settings.closeToTrayDesc}
            control={
              <Switch
                checked={settings.closeToTray}
                onCheckedChange={(checked) => void updateSettings({ closeToTray: checked })}
              />
            }
          />
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="mb-1 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.settings.appearance}</h3>
        <div className="divide-y divide-[color:var(--panel-border)]">
          <SettingRow
            title={t.settings.theme}
            control={
              <Select
                value={settings.theme}
                onValueChange={(v) => void updateSettings({ theme: v as typeof settings.theme })}
                options={[
                  { value: "dark", label: t.settings.themeDark },
                  { value: "light", label: t.settings.themeLight },
                  { value: "system", label: t.settings.themeSystem },
                ]}
              />
            }
          />
          <SettingRow
            title={t.settings.animations}
            description={t.settings.animationsDesc}
            control={
              <Switch
                checked={settings.animationsEnabled}
                onCheckedChange={(checked) => void updateSettings({ animationsEnabled: checked })}
              />
            }
          />
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="mb-1 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.settings.general}</h3>
        <div className="divide-y divide-[color:var(--panel-border)]">
          <SettingRow
            title={t.settings.defaultCopyFormat}
            control={
              <Select
                value={settings.defaultCopyFormat}
                onValueChange={(v) =>
                  void updateSettings({ defaultCopyFormat: v as typeof settings.defaultCopyFormat })
                }
                options={[
                  { value: "hex", label: "HEX" },
                  { value: "rgb", label: "RGB" },
                  { value: "rgba", label: "RGBA" },
                  { value: "hsl", label: "HSL" },
                  { value: "hsv", label: "HSV" },
                  { value: "cmyk", label: "CMYK" },
                  { value: "lab", label: "LAB" },
                  { value: "oklch", label: "OKLCH" },
                ]}
              />
            }
          />
          <SettingRow
            title={t.settings.language}
            control={
              <Select
                value={settings.language}
                onValueChange={(v) => void updateSettings({ language: v as typeof settings.language })}
                options={[
                  { value: "fr", label: "Français" },
                  { value: "en", label: "English" },
                ]}
              />
            }
          />
        </div>
      </GlassCard>

      {isElectron() && (
        <GlassCard className="p-4">
          <h3 className="mb-1 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.updater.updates}</h3>
          <div className="divide-y divide-[color:var(--panel-border)]">
            <SettingRow
              title={t.updater.currentVersion}
              description={`v${version}`}
              control={
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={checkingUpdate}
                  onClick={() => void handleCheckUpdates()}
                >
                  {checkingUpdate ? t.updater.checkingManual : t.updater.checkForUpdates}
                </Button>
              }
            />
          </div>
        </GlassCard>
      )}
    </div>
  );
}
