const path = require('path')
const xlsx = require('xlsx')
const { createClient } = require('@libsql/client/sqlite3')

const EXCEL_PATH = path.join(process.cwd(), 'docs', 'assets', 'Viana Transporte Financeiro.xlsx')
const DB_PATH = path.join(process.cwd(), 'dev.db')

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

function toUnixSeconds(date) {
  return Math.floor(date.getTime() / 1000)
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

  const companyName = String(receiptRows[2]?.[1] ?? 'Viana Transporte e Terraplenagem').trim()
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
        description: entrada,
        date: entradaDate,
        amount: entradaAmount,
      })
    }

    const saida = row[4] ? String(row[4]).trim() : ''
    const saidaDate = parseExcelDate(row[5])
    const saidaAmount = parseAmount(row[6])
    const saidaRaw = row[6] ? String(row[6]).trim() : ''

    if (saida && saidaDate && typeof saidaAmount === 'number' && saidaAmount > 0) {
      costs.push({
        description: saidaRaw ? `${saida} - ${saidaRaw}` : saida,
        date: saidaDate,
        amount: saidaAmount,
      })
    }
  }

  for (let index = 1; index < legacyRows.length; index += 1) {
    const row = legacyRows[index] || []
    const description = row[0] ? String(row[0]).trim() : ''
    const date = parseExcelDate(row[1])
    const amount = parseAmount(row[2])

    if (description && date && typeof amount === 'number' && amount > 0) {
      revenues.push({ description, date, amount })
    }
  }

  return { companyName, projectName, revenues, costs }
}

async function run() {
  const { companyName, projectName, revenues, costs } = parseWorkbook()
  const now = Math.floor(Date.now() / 1000)

  const db = createClient({ url: `file:${DB_PATH}` })

  await db.execute('PRAGMA foreign_keys = OFF')
  await db.execute('BEGIN')

  try {
    await db.execute('DELETE FROM daily_logs')
    await db.execute('DELETE FROM project_costs')
    await db.execute('DELETE FROM project_revenues')
    await db.execute('DELETE FROM projects')
    await db.execute('DELETE FROM clients')
    await db.execute('DELETE FROM machines')
    await db.execute('DELETE FROM operators')
    await db.execute("DELETE FROM sqlite_sequence WHERE name IN ('daily_logs','project_costs','project_revenues','projects','clients','machines','operators')")

    const clientInsert = await db.execute({
      sql: 'INSERT INTO clients (name, document, phone, email, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      args: [companyName, null, null, null, 'Importado do Excel financeiro.', now, now],
    })
    const clientId = Number(clientInsert.rows[0].id)

    const projectInsert = await db.execute({
      sql: 'INSERT INTO projects (client_id, name, location, start_date, end_date, status, contract_amount, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      args: [
        clientId,
        projectName,
        null,
        null,
        null,
        'active',
        null,
        'Projeto financeiro carregado do arquivo Viana Transporte Financeiro.xlsx',
        now,
        now,
      ],
    })
    const projectId = Number(projectInsert.rows[0].id)

    for (const revenue of revenues) {
      await db.execute({
        sql: 'INSERT INTO project_revenues (date, project_id, description, amount, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          toUnixSeconds(revenue.date),
          projectId,
          revenue.description,
          revenue.amount,
          'received',
          'Importado do Excel financeiro.',
          now,
          now,
        ],
      })
    }

    for (const cost of costs) {
      await db.execute({
        sql: 'INSERT INTO project_costs (date, project_id, machine_id, operator_id, category, description, amount, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          toUnixSeconds(cost.date),
          projectId,
          null,
          null,
          inferCostCategory(cost.description),
          cost.description,
          cost.amount,
          'Importado do Excel financeiro.',
          now,
          now,
        ],
      })
    }

    await db.execute('COMMIT')
    await db.execute('PRAGMA foreign_keys = ON')

    console.log('Sincronização concluída com sucesso:')
    console.log(`- Cliente: ${companyName}`)
    console.log(`- Projeto: ${projectName}`)
    console.log(`- Receitas importadas: ${revenues.length}`)
    console.log(`- Custos importados: ${costs.length}`)
    console.log(`- Banco sincronizado: ${DB_PATH}`)
  } catch (error) {
    await db.execute('ROLLBACK')
    await db.execute('PRAGMA foreign_keys = ON')
    throw error
  }
}

run().catch((error) => {
  console.error('Falha ao sincronizar banco a partir do Excel.')
  console.error(error)
  process.exit(1)
})
