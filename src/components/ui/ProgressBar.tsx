import { clsx } from 'clsx';
import type { Rarity } from '@/types';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  color?: 'gold' | 'purple' | 'blue' | 'green' | 'red' | 'flame';
  size?: 'sm' | 'md' | 'lg';
  rarity?: Rarity;
  className?: string;
}

const colorMap = {
  gold: 'bg-gradient-to-r from-amber-600 via-magic-gold to-amber-500',
  purple: 'bg-gradient-to-r from-purple-700 via-magic-purple to-purple-500',
  blue: 'bg-gradient-to-r from-sky-700 via-magic-blue to-sky-400',
  green: 'bg-gradient-to-r from-emerald-700 via-green-500 to-emerald-400',
  red: 'bg-gradient-to-r from-red-800 via-magic-blood to-red-500',
  flame: 'bg-gradient-to-r from-orange-700 via-magic-flame to-yellow-500',
};

const rarityColors: Record<Rarity, string> = {
  common: 'bg-gradient-to-r from-gray-600 to-gray-400',
  uncommon: 'bg-gradient-to-r from-green-700 to-green-400',
  rare: 'bg-gradient-to-r from-blue-700 to-blue-400',
  epic: 'bg-gradient-to-r from-purple-700 to-purple-400',
  legendary: 'bg-gradient-to-r from-amber-600 via-magic-gold to-yellow-400',
};

export default function ProgressBar({
  value, max, label, showValue = true, color = 'gold', size = 'md', rarity, className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeClasses = {
    sm: '!h-1.5',
    md: '!h-3',
    lg: '!h-4',
  };
  const barColor = rarity ? rarityColors[rarity] : colorMap[color];

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-gray-400 font-medium">{label}</span>}
          {showValue && (
            <span className="text-xs font-mono font-bold text-magic-goldLight">
              {value.toLocaleString()} / {max.toLocaleString()} ({Math.round(percent)}%)
            </span>
          )}
        </div>
      )}
      <div className={clsx('progress-bar-bg', sizeClasses[size])}>
        <div
          className={clsx('progress-bar-fill', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
