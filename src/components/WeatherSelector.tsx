import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { CircleSlash, CloudRain, Wind, Snowflake } from 'lucide-react';
import type { WeatherType } from './WeatherEffect';

interface WeatherSelectorProps {
  value: WeatherType;
  onChange: (type: WeatherType) => void;
  /** `compact` hides the labels and renders icon-only pills. */
  variant?: 'full' | 'compact';
}

const OPTIONS: { id: WeatherType; label: string; icon: React.ElementType; tint: string }[] = [
  { id: 'default', label: 'None', icon: CircleSlash, tint: 'text-slate-200' },
  { id: 'rain', label: 'Rain', icon: CloudRain, tint: 'text-sky-300' },
  { id: 'wind', label: 'Wind', icon: Wind, tint: 'text-teal-300' },
  { id: 'snow', label: 'Snow', icon: Snowflake, tint: 'text-indigo-300' },
];

export const WeatherSelector: React.FC<WeatherSelectorProps> = ({
  value,
  onChange,
  variant = 'full',
}) => {
  const compact = variant === 'compact';
  // Scopes the shared-layout pill to this instance so multiple selectors don't fight over it.
  const pillId = useId();

  return (
    <div
      role="radiogroup"
      aria-label="Ambient weather effect"
      className="relative flex items-center gap-1 p-1 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_24px_-14px_rgba(2,6,23,0.75)] overflow-hidden"
    >
      {/* Top-edge sheen, the way frosted iOS controls catch light */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent"
      />

      {OPTIONS.map(({ id, label, icon: Icon, tint }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => onChange(id)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors duration-300 ${
              compact ? 'px-2.5 py-1.5' : 'flex-1 px-3 py-2 text-xs'
            } ${active ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {active && (
              <motion.span
                layoutId={`weather-pill-${pillId}`}
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-xl border border-white/25 bg-white/20 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_-6px_rgba(2,6,23,0.7)]"
                transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.7 }}
              />
            )}
            <Icon
              className={`w-4 h-4 transition-transform duration-300 ${active ? `${tint} scale-110` : ''}`}
            />
            {!compact && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default WeatherSelector;
