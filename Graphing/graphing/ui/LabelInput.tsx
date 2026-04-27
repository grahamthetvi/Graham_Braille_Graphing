"use client";

type LabelInputProps = {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
};

export function LabelInput({ label, value, onChange }: LabelInputProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs shrink-0">{label}</span>
      <input
        type="number"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-md border px-2 py-1 bg-muted"
      />
    </div>
  );
}
