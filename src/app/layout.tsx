import type { Metadata } from 'next'
import { QueryProvider } from '@/components/providers/QueryProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Casa del Adulto Mayor - Molina',
  description: 'Aplicación con autenticación segura',
}

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
