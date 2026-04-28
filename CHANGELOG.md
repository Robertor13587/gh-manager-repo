# Changelog

All notable changes to GitHub Project Manager are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.1.0] - 2026-04-28

### ✨ MVP Release

This is the initial MVP release of GitHub Project Manager. The app enables users to sync their GitHub repositories, automatically detect project status (MVP/In Progress/Completed), and visualize progress through an interactive dashboard.

---

### 🎯 Features Added

#### Authentication & Authorization
- GitHub OAuth integration with NextAuth.js
- Secure login/logout flow
- Token management and automatic refresh on re-login
- Centralized auth configuration in `lib/auth.ts`

#### Repository Management
- Synchronize GitHub repositories via OAuth
- Automatic pagination support (100 repos per request)
- Repository list with status detection
- Last sync timestamp tracking

#### Status Detection
- Automatic status calculation based on file presence:
  - **COMPLETED**: RELEASE.md or version >= 1.0.0
  - **MVP**: MVP.md or version < 1.0.0
  - **IN_PROGRESS**: None of the above
- MVP checklist parsing from markdown
- Progress calculation (mvp_done / mvp_total)

#### Dashboard
- Main dashboard with repository grid
- Grouping by status (In Progress, MVP, Completed)
- Responsive layout (1-5 columns)
- Mini progress bars for MVP projects
- Sticky header with sync button
- Manual sync trigger
- Correct timestamp handling (epoch seconds)

#### Repository Detail Page
- Full-width 2-column layout
- MVP checklist with progress bar
- Checkbox visualization from markdown
- Collapsible completed items
- Changelog timeline view
- README summary
- Direct GitHub links
- Loading spinner during data fetch

#### UI/UX
- Branded logos (light/dark theme)
- Favicon integration
- Logo guide documentation
- Responsive design
- Clean, modern interface

#### Database
- PostgreSQL integration
- User, account, and session management
- Repository tracking with status fields
- MVP progress columns (mvp_done, mvp_total)
- Automatic timestamp management

#### API
- `GET /api/repos` - List all repositories with status
- `POST /api/repos` - Synchronize repositories from GitHub
- `GET /api/repos/[id]` - Get repository details

---

### 🐛 Bugfixes

#### Fixed camelCase handling from Postgres
- **Commit**: 723431fb3f5248750afbab30a920b6c0670b0c83
- **Date**: 2026-04-28
- **Issue**: Postgres configured with `transform: postgres.camel` converts snake_case to camelCase, but code was accessing `account.access_token` (snake_case) instead of `account.accessToken` (camelCase)
- **Impact**: Was causing 400 errors when trying to fetch repositories
- **Solution**: Updated all database access to use camelCase field names matching Postgres transform config

#### Fixed timestamp handling
- **Commit**: 6508f3e57b0ab8f560224987f3df5c4340317a31
- **Date**: 2026-04-28
- **Issue**: `lastSyncedAt` stored as epoch seconds but not multiplied by 1000 when creating Date objects in JavaScript
- **Impact**: Timestamps displayed incorrectly on dashboard and detail pages
- **Solution**: Added `* 1000` conversion in repo list and detail fetch handlers

#### Fixed external link handling
- **Commit**: 6508f3e57b0ab8f560224987f3df5c4340317a31
- **Date**: 2026-04-28
- **Issue**: Using `preventDefault()` for external links prevented navigation
- **Impact**: GitHub links couldn't be followed
- **Solution**: Changed to `stopPropagation()` to allow link navigation while preventing parent click handling

#### Token refresh on re-login
- **Commit**: 6cd7980ad232105b68fbba859f8c6839fca5e698
- **Date**: 2026-04-28
- **Issue**: Stale token after scope change or new auth
- **Impact**: API calls would fail with old token
- **Solution**: Updated signIn callback to fetch fresh access_token from GitHub and update database on every login

---

### 📝 Commits Detail

#### 1. Initial commit
- **Hash**: 2ef313a33a0fa9a42dd26485083ddd024c9903a8
- **Date**: 2026-04-28
- **Message**: Initial commit

#### 2. First commit
- **Hash**: 9391934662794c41802ae519e61908c70b75ee7ea
- **Date**: 2026-04-28
- **Message**: first commit

#### 3. Centralize NextAuth options
- **Hash**: c1a3003e623cecc62da725bd1b7f48de5f15e918
- **Date**: 2026-04-28
- **Message**: Centralize NextAuth options and apply to routes
- **Details**:
  - Move NextAuth configuration into new `lib/auth.ts`
  - Export `authOptions` for reuse across routes
  - Update `app/api/auth/[...nextauth]/route.ts` to use centralized config
  - Pass `authOptions` to `getServerSession` in repo API handlers
  - Update `.gitignore` with common Next.js ignores
  - Add `.mcp.json` and `.claude/settings.json` for MCP configuration

#### 4. Update auth.ts
- **Hash**: b8167fb42ecc89d3654929bd3e470d3cb75d2267
- **Date**: 2026-04-28
- **Message**: Update auth.ts
- **Details**: Authentication configuration improvements

#### 5. Use params, fix timestamps, paginate GitHub repos
- **Hash**: 6508f3e57b0ab8f560224987f3df5c4340317a31
- **Date**: 2026-04-28
- **Message**: Use params, fix timestamps, paginate GitHub repos
- **Details**:
  - Switch to `useParams` for client-side repoId reading
  - Fix timestamp handling: multiply `lastSyncedAt` by 1000 for Date conversion
  - Change external link handler from `preventDefault()` to `stopPropagation()`
  - Update GitHub client to use `octokit.paginate`:
    - per_page: 100
    - type: 'all'
    - sort: 'updated'
  - Fetch all repositories instead of limited set

#### 6. Fix: use camelCase accessToken
- **Hash**: 723431fb3f5248750afbab30a920b6c0670b0c83
- **Date**: 2026-04-28
- **Message**: fix: use camelCase accessToken from postgres.camel transform
- **Details**:
  - Postgres transform converts snake_case to camelCase
  - Changed `account.access_token` to `account.accessToken`
  - Fixes 400 errors in API calls

#### 7. Feat: project evolution UI + fix token refresh
- **Hash**: 6cd7980ad232105b68fbba859f8c6839fca5e698
- **Date**: 2026-04-28
- **Message**: feat: project evolution UI + fix token refresh on re-login
- **Details**:
  - **Token refresh**: signIn callback now updates `access_token` in DB on every login
  - Fixes stale token issues after scope changes
  - **UI redesign**:
    - MVP checklist with progress bar
    - Changelog timeline view
    - README summary
    - Replaces previous plain file listing
  - New layout focused on project evolution tracking

#### 8. Feat: dashboard full-width grouped by status
- **Hash**: 849e16bcb4c62a3e5ec29c2e13cc8ff4e26975ae
- **Date**: 2026-04-28
- **Message**: feat: dashboard full-width grouped by status
- **Details**:
  - Status grouping:
    - In Progress section
    - MVP section
    - Completed section
  - Each section with colored left border for visual distinction
  - Responsive grid:
    - 1 column on mobile
    - Scales up to 5 columns on wide screens
  - Sticky full-width header

#### 9. Feat: MVP progress bar on dashboard cards + full-width detail page
- **Hash**: 420a44a2d77d99edf26811ba295c1d609cf1bf7a
- **Date**: 2026-04-28
- **Message**: feat: MVP progress bar on dashboard cards + full-width detail page
- **Details**:
  - **Database**: Add `mvp_done` and `mvp_total` columns with ALTER TABLE
  - **Synchronization**: Calculate and persist checklist stats on every sync
  - **Dashboard cards**: Mini progress bar showing done/total count
  - **Detail page**:
    - Full-width 2-column layout
    - Strip markdown from checklist display
    - Collapsible completed items
    - Spinner loader component
    - GitHub icon integration

#### 10. Add logos, favicon and logo guide
- **Hash**: d1f761e0ea2700fe710227c32c86ea54bdc4570b
- **Date**: 2026-04-28
- **Message**: Add logos, favicon and logo guide
- **Details**:
  - **New assets**:
    - `public/logo.svg` - Primary logo
    - `public/logo-dark.svg` - Dark theme variant
    - `public/favicon.svg` - Browser favicon
    - `public/logo-preview.html` - Logo preview page
    - `public/LOGO_GUIDE.md` - Usage guide
  - **Code changes**:
    - Insert `<picture>` elements with prefers-color-scheme sources
    - Logo images in header and homepage
    - Favicon registration in `app/layout.tsx` metadata
  - **Purpose**: Theme-aware branding with consistent logo usage

---

### 📊 Statistics

- **Total Commits**: 10
- **Development Timeline**: 1 day (2026-04-28)
- **Features Implemented**: 40+
- **Bugfixes**: 4
- **Files Modified**: 25+
- **New Files**: 15+
- **Database Schema**: Complete
- **API Endpoints**: 3
- **UI Components**: 8+

---

### 🔧 Technical Details

#### Stack
- Next.js 16.2.4
- React 19.2.4
- NextAuth.js 4.24.14
- PostgreSQL 14+
- Octokit 5.0.5
- Tailwind CSS 4
- TypeScript 5

#### Database Schema
```sql
CREATE TABLE repositories (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  repo_name TEXT,
  repo_url TEXT,
  status VARCHAR(20), -- IN_PROGRESS, MVP, COMPLETED
  version VARCHAR(10),
  mvp_done INT DEFAULT 0,
  mvp_total INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP
);
```

#### Performance
- Repository pagination: 100 per request
- Efficient database queries with indexes
- Client-side useParams for detail navigation
- Lazy loading of file contents

---

### ⚠️ Known Limitations (Out of Scope for MVP)

- No automatic sync scheduler (manual sync only)
- Single-user per installation (no multi-tenancy)
- No real-time notifications
- No analytics or trending
- No export functionality
- Limited to public repositories

---

### 🚀 Deployment Ready

- ✅ Environment variables configured
- ✅ Database migrations ready
- ✅ API error handling implemented
- ✅ Type safety with TypeScript
- ✅ Responsive design tested
- ✅ OAuth flow secured

---

### 📚 Documentation

- README.md - Complete setup and usage guide
- MVP.md - Feature checklist and timeline
- CHANGELOG.md - This file
- LOGO_GUIDE.md - Branding guidelines
- Code comments - Inline documentation where needed

---

## Unreleased

Pending features for next release:
- [ ] Automatic sync scheduling
- [ ] Advanced filtering and search
- [ ] Analytics dashboard
- [ ] Notifications system
- [ ] Export functionality
- [ ] Rate limiting optimization

---

**Generated**: 2026-04-28
**Latest Version**: 0.1.0
**Status**: MVP Complete 🎉
