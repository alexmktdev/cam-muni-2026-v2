// Placeholder menu trigger; drawer / actions se implementan después.

'use client'

export function MobileMenuButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      className={`-ml-1 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 ${className}`}
      aria-label="Abrir menú"
      aria-expanded={false}
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}
