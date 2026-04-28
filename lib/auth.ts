import GitHubProvider from 'next-auth/providers/github'
import { pgAdapter } from '@/lib/nextauth-adapter'
import * as dbUtils from '@/lib/db-utils'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  adapter: pgAdapter(),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: { scope: 'read:user user:email repo' },
      },
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
    async signIn({ user, account }) {
      if (account?.access_token && user.id) {
        await dbUtils.updateAccount(user.id, account.provider, {
          access_token: account.access_token,
          refresh_token: account.refresh_token ?? undefined,
          expires_at: account.expires_at ?? undefined,
        }).catch((e) => console.error('[Auth] updateAccount failed:', e))
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id
      }
      return session
    },
  },
}
