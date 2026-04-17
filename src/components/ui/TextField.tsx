// Text input with accessible label.

import type { InputHTMLAttributes } from 'react'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  fieldId: string
}

export function TextField({ label, fieldId, className = '', ...rest }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={fieldId}
        className={`rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${className}`}
        {...rest}
      />
    </div>
  )
}
