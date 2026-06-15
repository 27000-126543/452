import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

type Variant = 'default' | 'primary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'default',
  size = 'md',
  icon,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'rune-btn inline-flex items-center justify-center gap-2';
  const variantClasses: Record<Variant, string> = {
    default: '',
    primary: 'rune-btn-primary',
    danger: 'rune-btn-danger',
    ghost: '!bg-transparent !border-transparent hover:!bg-magic-card hover:!border-magic-border',
  };
  const sizeClasses: Record<Size, string> = {
    sm: '!px-3 !py-1.5 !text-xs',
    md: '',
    lg: '!px-8 !py-3.5 !text-base',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
