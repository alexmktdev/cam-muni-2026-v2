// Parser CSV mínimo (coma, punto y coma o tabulador); comillas dobles opcionales.

function parseLineaCsv(linea: string, delim: ',' | ';' | '\t'): string[] {
  const celdas: string[] = []
  let actual = ''
  let entreComillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]!
    if (c === '"') {
      entreComillas = !entreComillas
      continue
    }
    if (!entreComillas && c === delim) {
      celdas.push(actual.trim())
      actual = ''
      continue
    }
    actual += c
  }
  celdas.push(actual.trim())
  return celdas
}

export type CsvParseResultado = {
  filas: string[][]
  delimitador: ',' | ';' | '\t'
}

/** Primera línea no vacía define el delimitador (tab, ; o ,) según cuál domine el conteo. */
export function parsearCsvTexto(texto: string, maxLineas: number): CsvParseResultado {
  const sinBom = texto.replace(/^\uFEFF/, '')
  const lineas = sinBom.split(/\r?\n/).map((l) => l.trim())
  const noVacias = lineas.filter((l) => l.length > 0).slice(0, maxLineas)
  if (noVacias.length === 0) {
    return { filas: [], delimitador: ',' }
  }
  const primera = noVacias[0]!
  const tabs = (primera.match(/\t/g) ?? []).length
  const semis = (primera.match(/;/g) ?? []).length
  const commas = (primera.match(/,/g) ?? []).length
  const delimitador: ',' | ';' | '\t' =
    tabs > commas && tabs > semis ? '\t' : semis > commas ? ';' : ','
  const filas = noVacias.map((l) => parseLineaCsv(l, delimitador))
  return { filas, delimitador }
}
