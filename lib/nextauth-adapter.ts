// @ts-nocheck
import { type Adapter } from 'next-auth/adapters'
import * as dbUtils from './db-utils'
import { getDb } from './db'

export function pgAdapter(): Adapter {
  return {
    createUser: async (user) => {
      console.log('[Adapter] Creating user:', user.email)
      const created = await dbUtils.createUser({
        email: user.email,
        name: user.name,
        image: user.image,
        githubId: (user as any).id?.toString() ?? user.email,
      })
      console.log('[Adapter] User created:', created.id)
      return created as any
    },

    getUser: async (id) => {
      const user = await dbUtils.getUserById(id)
      return (user ?? null) as any
    },

    getUserByEmail: async (email) => {
      const user = await dbUtils.getUserByEmail(email)
      return (user ?? null) as any
    },

    getUserByAccount: async ({ provider, providerAccountId }) => {
      const user = await dbUtils.getUserByAccount(provider, providerAccountId)
      return (user ?? null) as any
    },

    updateUser: async (user) => {
      await dbUtils.updateUser(user.id!, {
        name: user.name,
        image: user.image,
      })
      return (await dbUtils.getUserById(user.id!)) as any
    },

    deleteUser: async (userId) => {
      const sql = getDb()
      await sql`DELETE FROM users WHERE id = ${userId}`
    },

    linkAccount: async (account) => {
      console.log('[Adapter] Linking account for user:', account.userId)
      await dbUtils.createAccount({
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
      })
      console.log('[Adapter] Account linked')
      return account as any
    },

    unlinkAccount: async ({ provider, providerAccountId }) => {
      const sql = getDb()
      await sql`DELETE FROM accounts WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}`
    },

    createSession: async (session) => {
      console.log('[Adapter] Creating session for user:', session.userId)
      await dbUtils.createSession({
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: Math.floor(new Date(session.expires).getTime() / 1000),
      })
      console.log('[Adapter] Session created')
      return session as any
    },

    getSessionAndUser: async (sessionToken) => {
      const session = await dbUtils.getSessionByToken(sessionToken)
      if (!session) return null

      const user = await dbUtils.getUserById(session.userId)
      if (!user) return null

      return {
        session: {
          userId: user.id,
          sessionToken,
          expires: new Date(session.expires * 1000),
        },
        user: user as any,
      }
    },

    updateSession: async (session) => {
      const sql = getDb()
      await sql`
        UPDATE sessions
        SET expires = ${Math.floor(new Date(session.expires!).getTime() / 1000)}
        WHERE session_token = ${session.sessionToken}
      `
      return session as any
    },

    deleteSession: async (sessionToken) => {
      await dbUtils.deleteSession(sessionToken)
    },
  }
}
