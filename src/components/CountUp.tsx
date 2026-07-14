import React, { useEffect, useState } from 'react';
import { formatMinutes } from '../utils/timeUtils';

interface CountUpProps {
  end: number;
  duration?: number; // in ms
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1000,
  suffix = '',
  prefix = '',
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);
      
      setCount(easedProgress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};

interface CountUpMinutesProps {
  endMinutes: number;
  duration?: number;
}

export const CountUpMinutes: React.FC<CountUpMinutesProps> = ({
  endMinutes,
  duration = 1000,
}) => {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress);
      
      setMinutes(Math.round(easedProgress * endMinutes));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setMinutes(endMinutes);
      }
    };
    window.requestAnimationFrame(step);
  }, [endMinutes, duration]);

  return <span>{formatMinutes(minutes)}</span>;
};
