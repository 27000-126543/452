import { clsx } from 'clsx';
import type { Rarity, RankTier } from '@/types';
import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  rarity?: Rarity;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', rarity, size = 'sm', children, className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-700 text-gray-200 border-gray-600',
    success: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
    warning: 'bg-amber-900/60 text-amber-300 border-amber-700',
    danger: 'bg-red-900/60 text-red-300 border-red-700',
    info: 'bg-sky-900/60 text-sky-300 border-sky-700',
  };
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const rarityClass = rarity ? `badge-rarity rarity-${rarity}` : '';
  return (
    <span className={clsx(
      'inline-flex items-center rounded font-semibold tracking-wide border',
      !rarity && variantClasses[variant],
      rarityClass,
      sizeClasses,
      className
    )}>
      {children}
    </span>
  );
}

const rankInfo: Record<RankTier, { name: string; color: string; bg: string; icon: string }> = {
  bronze:   { name: '青铜',  color: 'text-orange-300', bg: 'from-orange-900 to-orange-700', icon: '🥉' },
  silver:   { name: '白银',  color: 'text-gray-200',  bg: 'from-gray-700 to-gray-500',     icon: '🥈' },
  gold:     { name: '黄金',  color: 'text-amber-300', bg: 'from-amber-700 to-amber-500',    icon: '🥇' },
  platinum: { name: '铂金',  color: 'text-cyan-200',  bg: 'from-cyan-800 to-cyan-500',      icon: '💠' },
  diamond:  { name: '钻石',  color: 'text-sky-300',   bg: 'from-sky-800 to-sky-400',        icon: '💎' },
  master:   { name: '大师',  color: 'text-fuchsia-300', bg: 'from-fuchsia-800 to-purple-500', icon: '👑' },
};

export function RankBadge({ tier, size = 'md' }: { tier: RankTier; size?: 'sm' | 'md' | 'lg' }) {
  const info = rankInfo[tier];
  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };
  return (
    <span className={clsx(
      'inline-flex items-center rounded-lg font-display font-bold uppercase tracking-wider border',
      'bg-gradient-to-r', info.bg, info.color, 'border-white/20 shadow-inner-magic',
      sizes[size]
    )}>
      <span>{info.icon}</span>
      <span>{info.name}</span>
    </span>
  );
}

export function RarityBadge({ rarity, children }: { rarity: Rarity; children?: ReactNode }) {
  return <Badge rarity={rarity}>{children || rarity.toUpperCase()}</Badge>;
}
