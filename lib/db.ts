import postgres from 'postgres'

// Global singleton to reuse connection across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _pgSql: ReturnType<typeof postgres> | undefined
}

export function getDb() {
  if (!global._pgSql) {
    global._pgSql = postgres(process.env.DATABASE_URL!, {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      transform: postgres.camel, // auto-converts snake_case columns → camelCase
    })
  }
  return global._pgSql
}

export async function initializeDb() {
  const sql = getDb()

  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      github_id TEXT UNIQUE NOT NULL,
      github_token TEXT,
      created_at INTEGER DEFAULT extract(epoch from now())::int,
      updated_at INTEGER DEFAULT extract(epoch from now())::int
    )
  `

  // Repositories table
  await sql`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      description TEXT,
      url TEXT,
      status TEXT DEFAULT 'IN_PROGRESS',
      last_synced_at INTEGER,
      mvp_files TEXT DEFAULT '["MVP.md","0.x.md"]',
      release_files TEXT DEFAULT '["RELEASE.md","COMPLETED.md","1.0.0.md"]',
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER DEFAULT extract(epoch from now())::int,
      updated_at INTEGER DEFAULT extract(epoch from now())::int,
      UNIQUE(user_id, full_name)
    )
  `

  // ProjectFiles table
  await sql`
    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      content TEXT,
      repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
      last_updated INTEGER DEFAULT extract(epoch from now())::int,
      UNIQUE(repository_id, filename)
    )
  `

  // Sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL,
      created_at INTEGER DEFAULT extract(epoch from now())::int
    )
  `

  // Accounts table (OAuth)
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      created_at INTEGER DEFAULT extract(epoch from now())::int,
      UNIQUE(provider, provider_account_id)
    )
  `

  // Add mvp progress columns if they don't exist yet
  await sql`ALTER TABLE repositories ADD COLUMN IF NOT EXISTS mvp_done INTEGER DEFAULT 0`
  await sql`ALTER TABLE repositories ADD COLUMN IF NOT EXISTS mvp_total INTEGER DEFAULT 0`

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_repos_user_id ON repositories(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_files_repo_id ON project_files(repository_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)`

  console.log('Database initialized')
}
