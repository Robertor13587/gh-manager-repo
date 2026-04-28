import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import { pgAdapter } from '@/lib/nextauth-adapter'
import { initializeDb } from '@/lib/db'

// Create tables on first run (idempotent — safe to run on every cold start)
if (process.env.DATABASE_URL) {
  initializeDb().catch((err) => console.error('[DB] initializeDb failed:', err))
}

const handler = NextAuth({
  adapter: pgAdapter(),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
