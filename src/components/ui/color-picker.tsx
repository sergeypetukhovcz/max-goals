"use client";

const PRESET_COLORS = [
  "#cc0000", "#e53e3e", "#dd6b20", "#d69e2e",
  "#38a169", "#319795", "#3182ce", "#0044cc",
  "#5a67d8", "#805ad5", "#d53f8c", "#ffffff",
  "#a0aec0", "#4a5568", "#1a202c", "#000000",
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">{label}</label>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-8 w-8 rounded-full border-2 transition-transform ${
              value === color ? "border-white scale-110" : "border-zinc-700"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
        />
        <span className="text-xs text-zinc-500">{value}</span>
      </div>
    </div>
  );
}
