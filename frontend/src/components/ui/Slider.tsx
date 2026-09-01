import React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = "",
  className,
  disabled = false,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {(label || unit) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-twin-slate">{label}</span>}
          <span className="font-mono font-semibold text-twin-cyan">
            {value}
            {unit}
          </span>
        </div>
      )}
      <div className="relative flex items-center select-none touch-none w-full h-5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-twin-card rounded-lg appearance-none cursor-pointer accent-twin-cyan focus:outline-none focus:ring-1 focus:ring-twin-cyan disabled:opacity-40"
          style={{
            background: `linear-gradient(to right, #06B6D4 0%, #06B6D4 ${percentage}%, #1C2538 ${percentage}%, #1C2538 100%)`,
          }}
        />
      </div>
    </div>
  );
};
