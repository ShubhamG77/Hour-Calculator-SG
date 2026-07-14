import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  delay = 0,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay } 
    }
  };

  const interactiveProps = onClick ? {
    whileTap: { scale: 0.98 },
    onClick,
    style: { cursor: 'pointer' }
  } : {};

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover={hoverEffect && onClick ? { scale: 1.01, translateY: -2 } : hoverEffect ? { translateY: -1 } : {}}
      variants={cardVariants}
      {...interactiveProps}
      className={`
        relative overflow-hidden 
        bg-white/10 dark:bg-slate-900/40 
        backdrop-blur-md 
        border border-white/20 dark:border-white/5 
        shadow-xl shadow-slate-950/10 dark:shadow-slate-950/30 
        rounded-2xl 
        transition-all duration-300
        ${className}
      `}
    >
      {/* Decorative inner glow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10 dark:via-white/0 dark:to-white/5" />
      {children}
    </motion.div>
  );
};
