import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RadarTarget } from '@/lib/geo';

interface RadarDisplayProps {
  isScanning: boolean;
  /** Real tower targets projected to bearing + distance from the user. */
  targets?: RadarTarget[];
  /** Pixel size of the radar (square). Defaults to 224. */
  size?: number;
  /** Override the outer-ring range in metres. Auto-derived if omitted. */
  maxRangeM?: number;
}

const PLOT_RADIUS = 82; // SVG units (viewBox 0..200)

const formatRange = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`);

export const RadarDisplay = ({ isScanning, targets = [], size = 224, maxRangeM }: RadarDisplayProps) => {
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    if (!isScanning) return;
    let raf: number;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (start === null) start = ts;
      setSweepAngle((((ts - start) / 3000) * 360) % 360);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isScanning]);

  // Derive the outer range from the furthest detected tower (nice round number).
  const range = useMemo(() => {
    if (maxRangeM && maxRangeM > 0) return maxRangeM;
    const max = targets.reduce((m, t) => Math.max(m, t.distance), 0);
    if (max <= 0) return 1000;
    const steps = [500, 1000, 2000, 3000, 5000, 8000, 12000, 20000];
    return steps.find((s) => s >= max) ?? Math.ceil(max / 1000) * 1000;
  }, [targets, maxRangeM]);

  const suspiciousCount = useMemo(() => targets.filter((t) => t.suspicious).length, [targets]);

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Tactical radar showing ${targets.length} towers, ${suspiciousCount} suspicious, range ${formatRange(range)}`}
    >
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="100" cy="100" r="88" fill="url(#radarBg)" />

        {/* Range rings with real distance labels */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <g key={frac}>
            <circle
              cx="100"
              cy="100"
              r={PLOT_RADIUS * frac}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              opacity="0.4"
            />
            <text
              x="101"
              y={100 - PLOT_RADIUS * frac + 4}
              fill="hsl(var(--muted-foreground))"
              fontSize="5"
              opacity="0.6"
            >
              {formatRange(range * frac)}
            </text>
          </g>
        ))}

        {/* Crosshairs + diagonals */}
        <line x1="100" y1="14" x2="100" y2="186" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.25" />
        <line x1="14" y1="100" x2="186" y2="100" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.25" />
        <line x1="43" y1="43" x2="157" y2="157" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.15" />
        <line x1="157" y1="43" x2="43" y2="157" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.15" />

        {/* Compass labels */}
        <text x="100" y="11" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="6" fontWeight="bold">N</text>
        <text x="100" y="197" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="6">S</text>
        <text x="194" y="103" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="6">E</text>
        <text x="6" y="103" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="6">W</text>

        {/* Sweep */}
        {isScanning && (
          <>
            <path
              d={`M 100 100 L ${100 + PLOT_RADIUS * Math.sin((sweepAngle * Math.PI) / 180)} ${100 - PLOT_RADIUS * Math.cos((sweepAngle * Math.PI) / 180)} A ${PLOT_RADIUS} ${PLOT_RADIUS} 0 0 0 ${100 + PLOT_RADIUS * Math.sin(((sweepAngle - 45) * Math.PI) / 180)} ${100 - PLOT_RADIUS * Math.cos(((sweepAngle - 45) * Math.PI) / 180)} Z`}
              fill="hsl(var(--primary))"
              opacity="0.12"
            />
            <line
              x1="100"
              y1="100"
              x2={100 + PLOT_RADIUS * Math.sin((sweepAngle * Math.PI) / 180)}
              y2={100 - PLOT_RADIUS * Math.cos((sweepAngle * Math.PI) / 180)}
              stroke="hsl(var(--primary))"
              strokeWidth="1.2"
              opacity="0.8"
            />
          </>
        )}

        {/* Real tower blips positioned by true bearing + distance */}
        <AnimatePresence>
          {targets.map((t) => {
            const rad = (t.bearing * Math.PI) / 180;
            const r = Math.min(PLOT_RADIUS, (t.distance / range) * PLOT_RADIUS);
            const x = 100 + r * Math.sin(rad);
            const y = 100 - r * Math.cos(rad);
            const color = t.suspicious ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
            return (
              <g key={t.id}>
                {t.suspicious && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={7}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.6"
                    initial={{ opacity: 0.8, scale: 0.5 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  />
                )}
                <circle cx={x} cy={y} r={t.suspicious ? 3 : 2.2} fill={color} opacity={0.4 + t.strength * 0.6} />
              </g>
            );
          })}
        </AnimatePresence>

        {/* Center (user) */}
        <circle cx="100" cy="100" r="3" fill="hsl(var(--primary))" opacity="0.9" />
        <circle cx="100" cy="100" r="5.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.5" />
      </svg>

      {/* Center info overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center" aria-live="polite">
          <div className="text-2xl font-bold text-primary font-mono leading-none">{targets.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Towers</div>
          {suspiciousCount > 0 && (
            <div className="text-[9px] text-destructive font-mono mt-0.5">{suspiciousCount} suspicious</div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
        <span className="text-[10px] text-muted-foreground font-mono">{isScanning ? 'ACTIVE' : 'IDLE'}</span>
      </div>
    </div>
  );
};
