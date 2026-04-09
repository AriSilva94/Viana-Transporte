const ISO_DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseLocalDate(value: Date | string | number): Date {
  if (typeof value === 'string') {
    const match = ISO_DATE_ONLY_PATTERN.exec(value)

    if (match) {
      const year = Number(match[1])
      const month = Number(match[2])
      const day = Number(match[3])
      return new Date(year, month - 1, day)
    }
  }

  const date = new Date(value)

  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatLocalDate(value: Date | string | number): string {
  const date = parseLocalDate(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function endOfLocalDay(value: Date | string | number): Date {
  const date = parseLocalDate(value)
  date.setHours(23, 59, 59, 999)
  return date
}

export function isLocalDateWithinInclusiveRange(
  value: Date | string | number,
  from?: Date | string | number,
  to?: Date | string | number
): boolean {
  const current = parseLocalDate(value).getTime()
  const start = from === undefined ? undefined : parseLocalDate(from).getTime()
  const end = to === undefined ? undefined : parseLocalDate(to).getTime()

  if (start !== undefined && current < start) {
    return false
  }

  if (end !== undefined && current > end) {
    return false
  }

  return true
}
