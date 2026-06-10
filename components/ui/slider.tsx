"use client";

type SliderProps = {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: number;
};

export function Slider({
  label,
  max,
  min,
  onChange,
  step = 1,
  suffix = "",
  value,
}: SliderProps) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="vr-data text-base font-semibold text-ink">
          {value.toLocaleString()}
          {suffix}
        </span>
      </span>
      <input
        className="mt-3 w-full accent-ink"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}
