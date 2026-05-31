import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportPayload } from './types'

export function generatePdf(payload: ExportPayload): Uint8Array {
  const orientation = payload.orientation ?? 'portrait'
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 14

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Viana Transportes', margin, y)
  y += 8

  doc.setFontSize(13)
  doc.text(payload.title, margin, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const now = new Date().toLocaleString('pt-BR')
  doc.text(`Gerado em: ${now}`, margin, y)
  y += 8

  if (payload.filters && payload.filters.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('FILTROS APLICADOS', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    for (const f of payload.filters) {
      doc.text(`${f.label}: ${f.value}`, margin, y)
      y += 5
    }
    y += 3
  }

  if (payload.summary && payload.summary.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('RESUMO', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    for (const row of payload.summary) {
      doc.text(`${row.label}: ${row.value}`, margin, y)
      y += 5
    }
    y += 3
  }

  function addTable(
    columns: ExportPayload['columns'],
    rows: ExportPayload['rows'],
    subtitle?: string,
  ): void {
    const lastY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY

    if (subtitle) {
      const subtitleY = lastY ? lastY + 8 : y
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(subtitle, margin, subtitleY)
    }

    autoTable(doc, {
      startY: subtitle ? undefined : y,
      head: [columns.map((c) => c.label)],
      body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ''))),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const val = data.cell.raw as string
          if (typeof val === 'string' && val.startsWith('-')) {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
    })

    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
    y = (finalY ?? y) + 8
  }

  if (payload.sections && payload.sections.length > 0) {
    for (const section of payload.sections) {
      addTable(section.columns, section.rows, section.subtitle)
    }
  } else {
    addTable(payload.columns, payload.rows)
  }

  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' },
    )
  }

  const buf = doc.output('arraybuffer')
  return new Uint8Array(buf)
}
