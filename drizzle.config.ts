import type { Config } from 'drizzle-kit'

export default {
  schema: './src/main/db/schema.ts',
  out: './src/main/db/migrations',
  driver: 'libsql',
  dbCredentials: {
    url: 'file:./dev.db',
  },
} satisfies Config
