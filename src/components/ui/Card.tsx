import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  title?: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: boolean;
  goldBorder?: boolean;
}

export default function Card({
  title, subtitle, icon, actions, children, className, glow, goldBorder,
}: CardProps) {
  return (
    <div className={clsx(
      'magic-card page-enter',
      glow && 'shadow-purple-glow border-magic-gold/40',
      goldBorder && 'gold-border',
      className
    )}>
      {(title || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-magic-purple/40 to-magic-gold/20 border border-magic-gold/30 flex items-center justify-center text-magic-gold">
                {icon}
              </div>
            )}
            <div>
              {typeof title === 'string' ? (
                <h3 className="font-display text-lg font-bold text-magic-gold">{title}</h3>
              ) : title}
              {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
