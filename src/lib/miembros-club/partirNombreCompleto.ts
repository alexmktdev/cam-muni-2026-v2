// Divide «nombre completo» de planilla en nombres + apellidos para Firestore.

export function partirNombreCompletoCsv(full: string): { nombre: string; apellidos: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { nombre: '', apellidos: '' }
  }
  if (parts.length === 1) {
    return { nombre: parts[0]!, apellidos: '—' }
  }
  return { nombre: parts[0]!, apellidos: parts.slice(1).join(' ') }
}
