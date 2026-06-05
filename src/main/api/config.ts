export function getApiBaseUrl(): string {
  const baseUrl = process.env.VIANA_API_BASE_URL?.trim()

  if (!baseUrl) {
    throw new Error('Missing VIANA_API_BASE_URL')
  }

  return baseUrl.replace(/\/+$/, '')
}
