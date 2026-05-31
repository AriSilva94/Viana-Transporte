import * as XLSX from 'xlsx'
import type { ExportPayload } from './types'

export function generateExcel(payload: ExportPayload): Uint8Array {
  const wb = XLSX.utils.book_new()
  const sheetData: (string | number)[][] = []

  const now = new Date().toLocaleString('pt-BR')

  sheetData.push([payload.title])
  sheetData.push([`Gerado em: ${now}`])
  sheetData.push([])

  if (payload.summary && payload.summary.length > 0) {
    sheetData.push(['RESUMO'])
    for (const row of payload.summary) {
      sheetData.push([row.label, row.value])
    }
    sheetData.push([])
  }

  function addTable(
    columns: ExportPayload['columns'],
    rows: ExportPayload['rows'],
    subtitle?: string,
  ): void {
    if (subtitle) {
      sheetData.push([subtitle])
    }
    sheetData.push(['DADOS'])
    sheetData.push(columns.map((c) => c.label))
    for (const row of rows) {
      sheetData.push(columns.map((c) => row[c.key] ?? ''))
    }
    sheetData.push([])
  }

  if (payload.sections && payload.sections.length > 0) {
    for (const section of payload.sections) {
      addTable(section.columns, section.rows, section.subtitle)
    }
  } else {
    addTable(payload.columns, payload.rows)
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  if (!ws['!merges']) ws['!merges'] = []
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(payload.columns.length - 1, 1) } })

  XLSX.utils.book_append_sheet(wb, ws, 'Relatório')

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Uint8Array(buf)
}
