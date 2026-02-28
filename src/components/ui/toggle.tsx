"use client";

interface ToggleProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  description?: string;
}

export function Toggle({ label, enabled, onChange, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-white">{label}</span>
        {description && <p className="text-xs text-zinc-400">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-red-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
