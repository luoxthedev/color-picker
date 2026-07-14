import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Switch({ checked, onCheckedChange, disabled, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "relative h-6 w-10 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 focus-ring",
        checked ? "bg-[color:var(--text-primary)] border-[color:var(--text-primary)]" : "bg-[color:var(--panel-bg)] border-[color:var(--panel-border-strong)]",
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block h-4 w-4 rounded-full shadow-sm transition-transform duration-200 will-change-transform translate-x-1",
          checked ? "translate-x-[19px] bg-[color:var(--app-bg-from)]" : "translate-x-1 bg-[color:var(--text-primary)]/80",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
