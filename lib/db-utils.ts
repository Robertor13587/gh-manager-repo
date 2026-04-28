import { getDb } from './db'
import { randomUUID } from 'crypto'

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  githubId: string
  githubToken: string | null
}

export interface Repository {
  id: string
  owner: string
  name: string
  fullName: string
  description: string | null
  url: string
  status: string
  lastSyncedAt: number | null
  mvpFiles: string[]
  releaseFiles: string[]
  mvpDone: number
  mvpTotal: number
  userId: string
}

export interface ProjectFile {
  id: string
  filename: string
  content: string | null
  repositoryId: string
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`
  return rows[0] as User | undefined
}

export async function getUserById(id: string): Promise<User | undefined> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`
  return rows[0] as User | undefined
}

export async function createUser(data: {
  email: string
  githubId: string
  name?: string | null
  image?: string | null
  githubToken?: string | null
}): Promise<User> {
  const sql = getDb()
  const id = randomUUID()
  await sql`
    INSERT INTO users (id, email, name, image, github_id, github_token)
    VALUES (${id}, ${data.email}, ${data.name ?? null}, ${data.image ?? null}, ${data.githubId}, ${data.githubToken ?? null})
  `
  return (await getUserById(id))!
}

export async function updateUser(
  id: string,
  data: { name?: string | null; image?: string | null; githubToken?: string | null }
): Promise<void> {
  const sql = getDb()
  const updates: Record<string, unknown> = {
    updated_at: Math.floor(Date.now() / 1000),
  }
  if (data.name !== undefined) updates.name = data.name
  if (data.image !== undefined) updates.image = data.image
  if (data.githubToken !== undefined) updates.github_token = data.githubToken

  await sql`UPDATE users SET ${sql(updates)} WHERE id = ${id}`
}

// ─── Repositories ─────────────────────────────────────────────────────────────

function parseRepo(r: Record<string, unknown>): Repository {
  return {
    ...(r as any),
    mvpFiles: JSON.parse((r.mvpFiles as string) || '[]'),
    releaseFiles: JSON.parse((r.releaseFiles as string) || '[]'),
  }
}

export async function deleteRepositoriesNotIn(userId: string, fullNames: string[]): Promise<number> {
  if (fullNames.length === 0) return 0
  const sql = getDb()
  const result = await sql`
    DELETE FROM repositories
    WHERE user_id = ${userId}
      AND full_name NOT IN ${sql(fullNames)}
  `
  return result.count
}

export async function getRepositoriesByUserId(userId: string): Promise<Repository[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM repositories
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `
  return rows.map((r) => parseRepo(r as Record<string, unknown>))
}

export async function getRepositoryById(
  id: string,
  userId: string
): Promise<(Repository & { files: ProjectFile[] }) | undefined> {
  const sql = getDb()
  const repos = await sql`SELECT * FROM repositories WHERE id = ${id} AND user_id = ${userId}`
  if (!repos[0]) return undefined

  const files = await sql`SELECT * FROM project_files WHERE repository_id = ${id}`

  return {
    ...parseRepo(repos[0] as Record<string, unknown>),
    files: files as unknown as ProjectFile[],
  }
}

export async function upsertRepository(data: {
  owner: string
  name: string
  fullName: string
  description: string | null
  url: string
  userId: string
}): Promise<Repository> {
  const sql = getDb()
  const existing = await sql`
    SELECT id FROM repositories WHERE full_name = ${data.fullName} AND user_id = ${data.userId}
  `

  if (existing[0]) {
    const repoId = existing[0].id as string
    await sql`
      UPDATE repositories
      SET description = ${data.description}, url = ${data.url}, updated_at = ${Math.floor(Date.now() / 1000)}
      WHERE id = ${repoId}
    `
    return (await getRepositoryById(repoId, data.userId))!
  }

  const id = randomUUID()
  await sql`
    INSERT INTO repositories (id, owner, name, full_name, description, url, user_id)
    VALUES (${id}, ${data.owner}, ${data.name}, ${data.fullName}, ${data.description}, ${data.url}, ${data.userId})
  `
  return (await getRepositoryById(id, data.userId))!
}

export async function updateRepositoryStatus(
  id: string,
  status: string,
  lastSyncedAt: number = Date.now(),
  mvpDone = 0,
  mvpTotal = 0,
): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE repositories
    SET status = ${status},
        last_synced_at = ${Math.floor(lastSyncedAt / 1000)},
        updated_at = ${Math.floor(Date.now() / 1000)},
        mvp_done = ${mvpDone},
        mvp_total = ${mvpTotal}
    WHERE id = ${id}
  `
}

// ─── Project Files ────────────────────────────────────────────────────────────

export async function upsertProjectFile(data: {
  filename: string
  content: string | null
  repositoryId: string
}): Promise<ProjectFile> {
  const sql = getDb()
  const existing = await sql`
    SELECT id FROM project_files WHERE filename = ${data.filename} AND repository_id = ${data.repositoryId}
  `

  if (existing[0]) {
    const fileId = existing[0].id as string
    await sql`
      UPDATE project_files
      SET content = ${data.content}, last_updated = ${Math.floor(Date.now() / 1000)}
      WHERE id = ${fileId}
    `
    const rows = await sql`SELECT * FROM project_files WHERE id = ${fileId}`
    return rows[0] as unknown as ProjectFile
  }

  const id = randomUUID()
  await sql`
    INSERT INTO project_files (id, filename, content, repository_id)
    VALUES (${id}, ${data.filename}, ${data.content}, ${data.repositoryId})
  `
  const rows = await sql`SELECT * FROM project_files WHERE id = ${id}`
  return rows[0] as unknown as ProjectFile
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(data: {
  userId: string
  sessionToken: string
  expires: number
}): Promise<void> {
  const sql = getDb()
  const id = randomUUID()
  await sql`
    INSERT INTO sessions (id, session_token, user_id, expires)
    VALUES (${id}, ${data.sessionToken}, ${data.userId}, ${data.expires})
  `
}

export async function getSessionByToken(
  sessionToken: string
): Promise<{ userId: string; expires: number } | undefined> {
  const sql = getDb()
  const rows = await sql`SELECT user_id, expires FROM sessions WHERE session_token = ${sessionToken}`
  return rows[0] as unknown as { userId: string; expires: number } | undefined
}

export async function deleteSession(sessionToken: string): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function createAccount(data: {
  userId: string
  type: string
  provider: string
  providerAccountId: string
  access_token?: string | null
  refresh_token?: string | null
  expires_at?: number | null
  token_type?: string | null
  scope?: string | null
}): Promise<void> {
  const sql = getDb()
  const id = randomUUID()
  await sql`
    INSERT INTO accounts (id, user_id, type, provider, provider_account_id, access_token, refresh_token, expires_at, token_type, scope)
    VALUES (
      ${id}, ${data.userId}, ${data.type}, ${data.provider}, ${data.providerAccountId},
      ${data.access_token ?? null}, ${data.refresh_token ?? null}, ${data.expires_at ?? null},
      ${data.token_type ?? null}, ${data.scope ?? null}
    )
  `
}

export async function getAccountByProvider(userId: string, provider: string): Promise<Record<string, unknown> | undefined> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM accounts WHERE user_id = ${userId} AND provider = ${provider}`
  return rows[0] as Record<string, unknown> | undefined
}

export async function updateAccount(
  userId: string,
  provider: string,
  data: { access_token?: string; refresh_token?: string; expires_at?: number }
): Promise<void> {
  const sql = getDb()
  const updates: Record<string, unknown> = {}
  if (data.access_token !== undefined) updates.access_token = data.access_token
  if (data.refresh_token !== undefined) updates.refresh_token = data.refresh_token
  if (data.expires_at !== undefined) updates.expires_at = data.expires_at
  if (Object.keys(updates).length === 0) return

  await sql`UPDATE accounts SET ${sql(updates)} WHERE user_id = ${userId} AND provider = ${provider}`
}

export async function getUserByAccount(
  provider: string,
  providerAccountId: string
): Promise<User | undefined> {
  const sql = getDb()
  const rows = await sql`
    SELECT user_id FROM accounts WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
  `
  if (!rows[0]) return undefined
  return getUserById((rows[0] as any).userId)
}
