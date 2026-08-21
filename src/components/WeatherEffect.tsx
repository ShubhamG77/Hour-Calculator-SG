import React, { useMemo, useSyncExternalStore } from 'react';
import './WeatherEffect.css';

export type WeatherType = 'default' | 'rain' | 'wind' | 'snow';

interface WeatherEffectProps {
  /** Active weather mode. `default` renders nothing at all. */
  type: WeatherType;
}

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.round(rand(min, max));

/** Builds `count` particles, each described by a CSS custom-property bag. */
function buildParticles(
  count: number,
  make: (index: number) => Record<string, string>
): React.CSSProperties[] {
  return Array.from({ length: count }, (_, i) => make(i) as unknown as React.CSSProperties);
}

/* --- prefers-reduced-motion (subscribed once, no per-frame state) --- */

const reducedMotionQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

function subscribeReducedMotion(onChange: () => void) {
  const mq = reducedMotionQuery();
  mq?.addEventListener('change', onChange);
  return () => mq?.removeEventListener('change', onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => reducedMotionQuery()?.matches ?? false,
    () => false
  );
}

/* ------------------------------------------------------------------
   Rain — fine streaks + droplets clinging to / sliding down the glass
   ------------------------------------------------------------------ */

const RainLayer: React.FC = () => {
  const streaks = useMemo(
    () =>
      buildParticles(44, () => {
        const tilt = rand(3, 7);
        return {
          '--x': `${rand(-4, 102)}vw`,
          '--len': `${randInt(28, 74)}px`,
          '--dur': `${rand(0.55, 1.05).toFixed(2)}s`,
          '--delay': `${(-rand(0, 1.2)).toFixed(2)}s`,
          '--tilt': `${tilt.toFixed(1)}deg`,
          '--drift': `${randInt(14, 34)}px`,
          '--o': `${rand(0.18, 0.45).toFixed(2)}`,
        };
      }),
    []
  );

  const drops = useMemo(
    () =>
      buildParticles(26, () => ({
        '--x': `${rand(1, 98)}vw`,
        '--y': `${rand(1, 96)}vh`,
        '--size': `${rand(2.5, 6.5).toFixed(1)}px`,
        '--o': `${rand(0.3, 0.6).toFixed(2)}`,
        '--dur': `${rand(6, 13).toFixed(1)}s`,
        '--delay': `${(-rand(0, 8)).toFixed(1)}s`,
      })),
    []
  );

  const sliders = useMemo(
    () =>
      buildParticles(7, () => ({
        '--x': `${rand(4, 95)}vw`,
        '--y': `${rand(-2, 35)}vh`,
        '--size': `${rand(4, 7).toFixed(1)}px`,
        '--fall': `${randInt(45, 95)}vh`,
        '--wobble': `${randInt(-8, 10)}px`,
        '--trail': `${randInt(40, 110)}px`,
        '--o': `${rand(0.4, 0.7).toFixed(2)}`,
        '--dur': `${rand(6, 12).toFixed(1)}s`,
        '--delay': `${(-rand(0, 10)).toFixed(1)}s`,
      })),
    []
  );

  return (
    <>
      <div className="we-rain__glass" />
      <div className="we-group">
        {streaks.map((style, i) => (
          <span key={i} className="we-particle we-rain__streak" style={style} />
        ))}
      </div>
      <div className="we-group">
        {drops.map((style, i) => (
          <span key={i} className="we-particle we-rain__drop" style={style} />
        ))}
      </div>
      <div className="we-group">
        {sliders.map((style, i) => (
          <span key={i} className="we-particle we-rain__slider" style={style} />
        ))}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------
   Wind — zigzag gusts, swirling rings, motes and flying debris
   ------------------------------------------------------------------ */

type DebrisKind = 'paper' | 'poly' | 'leaf';

const WindLayer: React.FC = () => {
  const gusts = useMemo(
    () =>
      buildParticles(11, () => ({
        '--y': `${rand(4, 96)}vh`,
        '--len': `${randInt(80, 220)}px`,
        '--thickness': `${rand(1.2, 2.2).toFixed(1)}px`,
        '--zig': `${randInt(14, 40)}px`,
        '--rise': `${randInt(-14, 14)}px`,
        '--dur': `${rand(4.5, 10).toFixed(1)}s`,
        '--delay': `${(-rand(0, 10)).toFixed(1)}s`,
        '--o': `${rand(0.28, 0.6).toFixed(2)}`,
      })),
    []
  );

  // Flattened, slowly spinning rings that read as swirling air currents.
  const rings = useMemo(
    () =>
      buildParticles(9, () => ({
        '--y': `${rand(2, 92)}vh`,
        '--size': `${randInt(60, 190)}px`,
        '--thickness': `${rand(1.2, 2).toFixed(1)}px`,
        '--flat': `${rand(0.24, 0.5).toFixed(2)}`,
        '--spin': `${randInt(0, 360)}deg`,
        '--turn': `${randInt(-200, 200)}deg`,
        '--arc': `${randInt(-40, -10)}px`,
        '--rise': `${randInt(-20, 20)}px`,
        '--dur': `${rand(9, 19).toFixed(1)}s`,
        '--delay': `${(-rand(0, 16)).toFixed(1)}s`,
        '--o': `${rand(0.22, 0.45).toFixed(2)}`,
      })),
    []
  );

  const motes = useMemo(
    () =>
      buildParticles(14, () => ({
        '--y': `${rand(2, 98)}vh`,
        '--size': `${rand(1.5, 3).toFixed(1)}px`,
        '--sway': `${randInt(12, 36)}px`,
        '--dur': `${rand(7, 15).toFixed(1)}s`,
        '--delay': `${(-rand(0, 14)).toFixed(1)}s`,
        '--o': `${rand(0.25, 0.5).toFixed(2)}`,
      })),
    []
  );

  const debris = useMemo(() => {
    const kinds: DebrisKind[] = ['paper', 'leaf', 'poly', 'paper', 'leaf'];
    const cycle = 45; // seconds for a full loop
    const gap = cycle / kinds.length; // keeps items from flying back to back

    return kinds.map((kind, i) => {
      const w = kind === 'poly' ? rand(26, 40) : rand(16, 27);
      return {
        kind,
        style: {
          '--y': `${rand(12, 88)}vh`,
          '--w': `${w.toFixed(1)}px`,
          '--h': `${(w * rand(0.55, 0.85)).toFixed(1)}px`,
          '--zig': `${randInt(30, 70)}px`,
          '--tumble': `${rand(1.1, 2.6).toFixed(2)}s`,
          '--dur': `${cycle}s`,
          '--delay': `${-(i * gap + rand(0, 1.5)).toFixed(1)}s`,
          '--o': `${rand(0.5, 0.8).toFixed(2)}`,
        } as unknown as React.CSSProperties,
      };
    });
  }, []);

  return (
    <>
      <div className="we-group">
        {rings.map((style, i) => (
          <span key={i} className="we-particle we-wind__ring" style={style} />
        ))}
      </div>
      <div className="we-group">
        {gusts.map((style, i) => (
          <span key={i} className="we-particle we-wind__streak" style={style} />
        ))}
      </div>
      <div className="we-group">
        {motes.map((style, i) => (
          <span key={i} className="we-particle we-wind__mote" style={style} />
        ))}
      </div>
      <div className="we-group">
        {debris.map(({ kind, style }, i) => (
          <span key={i} className="we-particle we-wind__debris" style={style}>
            <span className={`we-wind__debris-body we-wind__debris-body--${kind}`} />
          </span>
        ))}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------
   Snow — falling wrapper + drifting flake (separate transforms)
   ------------------------------------------------------------------ */

const SnowLayer: React.FC = () => {
  const flakes = useMemo(
    () =>
      buildParticles(42, () => {
        const size = rand(2, 5.5);
        return {
          '--x': `${rand(-2, 100)}vw`,
          '--size': `${size.toFixed(1)}px`,
          '--o': `${rand(0.35, 0.85).toFixed(2)}`,
          '--soft': `${(size < 3 ? 0.4 : 0.15).toFixed(2)}px`,
          '--sway': `${randInt(8, 30)}px`,
          '--sway-dur': `${rand(3, 7).toFixed(1)}s`,
          '--dur': `${rand(9, 20).toFixed(1)}s`,
          '--delay': `${(-rand(0, 18)).toFixed(1)}s`,
        };
      }),
    []
  );

  return (
    <div className="we-group">
      {flakes.map((style, i) => (
        <span key={i} className="we-particle we-snow__fall" style={style}>
          <span className="we-snow__flake" style={style} />
        </span>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------
   Public component
   ------------------------------------------------------------------ */

/**
 * Fixed, click-through ambient weather overlay.
 * Switching `type` unmounts the previous layer entirely (keyed remount),
 * so no stray animations survive a mode change.
 */
export const WeatherEffect: React.FC<WeatherEffectProps> = ({ type }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (type === 'default') return null;

  // Reduced motion: keep only the static "wet glass" hint for rain,
  // and nothing at all for the purely motion-based modes.
  if (prefersReducedMotion && type !== 'rain') return null;

  return (
    <div key={type} className="we-layer" aria-hidden="true" role="presentation">
      {type === 'rain' && <RainLayer />}
      {type === 'wind' && <WindLayer />}
      {type === 'snow' && <SnowLayer />}
    </div>
  );
};

export default WeatherEffect;
