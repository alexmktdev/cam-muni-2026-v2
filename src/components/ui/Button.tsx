// Reusable button with optional loading state and variants.

import type { ReactNode } from 'react'

export interface ButtonProps {
  label?: string
  children?: ReactNode
  buttonType?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  loadingLabel?: ReactNode
  loading?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'emerald' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  label,
  children,
  buttonType = 'button',
  disabled = false,
  onClick,
  loadingLabel,
  loading = false,
  className = '',
  variant = 'primary',
  size = 'md',
}: ButtonProps) {
  const blocked = disabled || loading

  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:scale-95',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-sm',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }

  const variantStyle = variants[variant] || variants.primary
  const sizeStyle = sizes[size] || sizes.md

  return (
    <button
      type={buttonType}
      disabled={blocked}
      onClick={onClick}
      className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className}`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingLabel || label || children}
        </div>
      ) : (
        label || children
      )}
    </button>
  )
}
