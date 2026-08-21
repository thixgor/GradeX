/**
 * Exportação em CSV das tabelas do painel.
 *
 * Usa ponto-e-vírgula e BOM porque o destino real é o Excel em pt-BR: com
 * vírgula, ele joga a linha inteira numa célula só; sem BOM, come os acentos.
 */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return

  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))))
  const escape = (value: unknown): string => {
    if (value == null) return ''
    const text = String(value)
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const csv = [
    headers.join(';'),
    ...rows.map(row => headers.map(h => escape(row[h])).join(';')),
  ].join('\r\n')

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
