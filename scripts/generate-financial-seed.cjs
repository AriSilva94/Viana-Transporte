const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')

const EXCEL_PATH = path.join(process.cwd(), 'docs', 'assets', 'Viana Transporte Financeiro.xlsx')
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'main', 'db', 'seeds', 'financial-seed.json')

function parseExcelDate(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    const parsed = xlsx.SSF.parse_date_code(value)
    if (!parsed) {
      return null
    }
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, 12, 0, 0))
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
    if (ddmmyyyy) {
      const day = Number(ddmmyyyy[1])
      const month = Number(ddmmyyyy[2]) - 1
      const year = Number(ddmmyyyy[3])
      return new Date(Date.UTC(year, month, day, 12, 0, 0))
    }

    const parsedDate = new Date(trimmed)
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate
    }
  }

  return null
}

function parseAmount(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const matches = value.match(/-?\d+(?:[.,]\d+)?/g)
    if (!matches || matches.length === 0) {
      return null
    }

    const last = matches[matches.length - 1]
    if (!last) {
      return null
    }

    if (last.includes(',') && last.includes('.')) {
      const normalized = last.replace(/\./g, '').replace(',', '.')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : null
    }

    const normalized = last.replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function inferCostCategory(description) {
  const normalized = description.toLowerCase()
  if (
    normalized.includes('abastec') ||
    normalized.includes('litro') ||
    normalized.includes('combust')
  ) {
    return 'fuel'
  }
  return 'miscellaneous'
}

function parseWorkbook() {
  const workbook = xlsx.readFile(EXCEL_PATH, { cellDates: false })
  const receiptSheet = workbook.Sheets['Recibo de vendas']
  const legacySheet = workbook.Sheets['Sheet1']

  if (!receiptSheet) {
    throw new Error('Planilha "Recibo de vendas" não encontrada no arquivo Excel.')
  }

  const receiptRows = xlsx.utils.sheet_to_json(receiptSheet, { header: 1, raw: true, defval: null })
  const legacyRows = legacySheet
    ? xlsx.utils.sheet_to_json(legacySheet, { header: 1, raw: true, defval: null })
    : []

  const clientName = String(receiptRows[2]?.[1] ?? 'Viana Transporte e Terraplenagem').trim()
  const projectName = String(receiptRows[1]?.[3] ?? 'Financeiro').trim() || 'Financeiro'

  const revenues = []
  const costs = []

  for (let index = 5; index < receiptRows.length; index += 1) {
    const row = receiptRows[index] || []
    const entrada = row[1] ? String(row[1]).trim() : ''
    const entradaDate = parseExcelDate(row[2])
    const entradaAmount = parseAmount(row[3])

    if (entrada && entradaDate && typeof entradaAmount === 'number' && entradaAmount > 0) {
      revenues.push({
        dateIso: entradaDate.toISOString(),
        description: entrada,
        amount: entradaAmount,
        status: 'received',
        notes: 'Importado do Excel financeiro.',
      })
    }

    const saida = row[4] ? String(row[4]).trim() : ''
    const saidaDate = parseExcelDate(row[5])
    const saidaAmount = parseAmount(row[6])
    const saidaRaw = row[6] ? String(row[6]).trim() : ''

    if (saida && saidaDate && typeof saidaAmount === 'number' && saidaAmount > 0) {
      const description = saidaRaw ? `${saida} - ${saidaRaw}` : saida
      costs.push({
        dateIso: saidaDate.toISOString(),
        category: inferCostCategory(description),
        description,
        amount: saidaAmount,
        notes: 'Importado do Excel financeiro.',
      })
    }
  }

  for (let index = 1; index < legacyRows.length; index += 1) {
    const row = legacyRows[index] || []
    const description = row[0] ? String(row[0]).trim() : ''
    const date = parseExcelDate(row[1])
    const amount = parseAmount(row[2])

    if (description && date && typeof amount === 'number' && amount > 0) {
      revenues.push({
        dateIso: date.toISOString(),
        description,
        amount,
        status: 'received',
        notes: 'Importado do Excel financeiro.',
      })
    }
  }

  return {
    sourceFile: 'docs/assets/Viana Transporte Financeiro.xlsx',
    generatedAtIso: new Date().toISOString(),
    client: {
      name: clientName,
      notes: 'Importado do Excel financeiro.',
    },
    project: {
      name: projectName,
      status: 'active',
      description: 'Projeto financeiro carregado do arquivo Viana Transporte Financeiro.xlsx',
    },
    revenues,
    costs,
  }
}

function run() {
  const seed = parseWorkbook()
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(seed, null, 2), 'utf-8')
  console.log(`Seed gerado em: ${OUTPUT_PATH}`)
  console.log(`Receitas: ${seed.revenues.length}`)
  console.log(`Custos: ${seed.costs.length}`)
}

run()
