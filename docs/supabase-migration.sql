-- GitHub Project Manager — Supabase Migration
-- Run this in the Supabase SQL Editor before the first deploy

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  github_id TEXT UNIQUE NOT NULL,
  github_token TEXT,
  created_at INTEGER DEFAULT extract(epoch from now())::int,
  updated_at INTEGER DEFAULT extract(epoch from now())::int
);

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
);

CREATE TABLE IF NOT EXISTS project_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  last_updated INTEGER DEFAULT extract(epoch from now())::int,
  UNIQUE(repository_id, filename)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL,
  created_at INTEGER DEFAULT extract(epoch from now())::int
);

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
);

CREATE INDEX IF NOT EXISTS idx_repos_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_files_repo_id ON project_files(repository_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
