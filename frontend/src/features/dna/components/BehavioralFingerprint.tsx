import React from "react";
import { Dna } from "lucide-react";

interface BehavioralFingerprintProps {
  methodPriors: Record<string, number>;
  sampleSize: number;
}

export const BehavioralFingerprint: React.FC<BehavioralFingerprintProps> = ({
  methodPriors,
  sampleSize,
}) => {
  const methodColors: Record<string, string> = {
    upi: "#06B6D4",        // Cyan
    card: "#6366F1",       // Indigo
    netbanking: "#F59E0B", // Amber
    wallet: "#10B981",     // Emerald
    emi: "#EC4899",        // Pink
  };

  const entries = Object.entries(methodPriors).sort((a, b) => b[1] - a[1]);

  // Concentric ring radii for each method
  // Center is (180, 180), base radii from 55 to 150
  const radii = [140, 115, 90, 68, 48];

  return (
    <div className="relative rounded-xl border border-twin-border/80 bg-[#080B12]/95 backdrop-blur-md p-6 space-y-4 shadow-2xl flex flex-col justify-between">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-twin-border/60 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-twin-white font-bold">
          <Dna className="w-4 h-4 text-twin-cyan animate-pulse" />
          <span>BEHAVIORAL FINGERPRINT</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-twin-card border border-twin-border text-twin-cyan font-semibold">
          EMPIRICAL PRIOR MATRIX
        </span>
      </div>

      {/* SVG Radial Fingerprint Visualization */}
      <div className="relative flex items-center justify-center py-2">
        <svg
          viewBox="0 0 360 360"
          className="w-72 h-72 sm:w-80 sm:h-80 drop-shadow-[0_0_25px_rgba(6,182,212,0.1)]"
        >
          <defs>
            {/* Ambient Radial Gradient for Hub */}
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#080D1A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#05070D" stopOpacity="1" />
            </radialGradient>
            
            {/* Glow filters for arcs */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background grid concentric track guides */}
          {[48, 68, 90, 115, 140, 162].map((r, idx) => (
            <circle
              key={idx}
              cx="180"
              cy="180"
              r={r}
              fill="none"
              stroke="#1E293B"
              strokeWidth="1"
              strokeDasharray={idx % 2 === 0 ? "3 3" : "none"}
              opacity={0.5}
            />
          ))}

          {/* Radial axis crosshairs */}
          <line x1="180" y1="12" x2="180" y2="348" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" opacity={0.4} />
          <line x1="12" y1="180" x2="348" y2="180" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" opacity={0.4} />
          <line x1="60" y1="60" x2="300" y2="300" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 6" opacity={0.25} />
          <line x1="60" y1="300" x2="300" y2="60" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 6" opacity={0.25} />

          {/* Segmented Concentric Arcs for each Payment Method */}
          {entries.map(([method, prob], idx) => {
            const r = radii[idx] || 40;
            const circumference = 2 * Math.PI * r;
            // Arc length proportional to empirical probability (max 330 deg for breathing room)
            const arcLength = (prob * circumference) * 0.92;
            const dashArray = `${arcLength} ${circumference - arcLength}`;
            const color = methodColors[method.toLowerCase()] || "#94A3B8";
            // Stagger start angles
            const rotationOffset = -90 + (idx * 28);

            return (
              <g key={method}>
                {/* Background track */}
                <circle
                  cx="180"
                  cy="180"
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth="5"
                  opacity={0.12}
                />
                {/* Active proportional arc */}
                <circle
                  cx="180"
                  cy="180"
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={dashArray}
                  transform={`rotate(${rotationOffset} 180 180)`}
                  filter={idx === 0 ? "url(#cyanGlow)" : undefined}
                  className="transition-all duration-700 ease-out"
                />
                {/* Terminal marker dot */}
                <circle
                  cx={180 + r * Math.cos(((rotationOffset + (prob * 360 * 0.92)) * Math.PI) / 180)}
                  cy={180 + r * Math.sin(((rotationOffset + (prob * 360 * 0.92)) * Math.PI) / 180)}
                  r="3.5"
                  fill="#FFFFFF"
                  stroke={color}
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Central Hub Disc */}
          <circle cx="180" cy="180" r="38" fill="url(#hubGlow)" stroke="#06B6D4" strokeWidth="1.5" opacity={0.9} />
          
          {/* Hub Icon & Text */}
          <g transform="translate(180, 180)" textAnchor="middle" dominantBaseline="middle">
            <text y="-8" fill="#06B6D4" fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
              PAYMENT
            </text>
            <text y="6" fill="#FFFFFF" fontSize="13" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
              DNA
            </text>
            <text y="19" fill="#94A3B8" fontSize="7.5" fontFamily="monospace" letterSpacing="0.5">
              FINGERPRINT
            </text>
          </g>
        </svg>

        {/* Ambient decorative glow around visual */}
        <div className="absolute inset-0 bg-twin-cyan/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Method telemetry legend strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-twin-border/60 text-xs font-mono">
        {entries.slice(0, 4).map(([method, prob]) => {
          const color = methodColors[method.toLowerCase()] || "#94A3B8";
          return (
            <div key={method} className="p-2 rounded bg-twin-card/50 border border-twin-border/70 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-twin-slate">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="uppercase font-semibold">{method}</span>
              </div>
              <div className="text-sm font-bold text-twin-white">
                {(prob * 100).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical Caption Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-twin-slate/85 pt-1">
        <span className="tracking-widest uppercase">EMPIRICAL METHOD PRIOR: P(method | merchant)</span>
        <span className="text-twin-cyan font-semibold">N = {sampleSize.toLocaleString()}</span>
      </div>
    </div>
  );
};
