import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { initializeDb } from '@/lib/db'

// Create tables on first run (idempotent — safe to run on every cold start)
if (process.env.DATABASE_URL) {
  initializeDb().catch((err) => console.error('[DB] initializeDb failed:', err))
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
