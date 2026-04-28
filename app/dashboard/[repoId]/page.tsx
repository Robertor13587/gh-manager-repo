'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ProjectFile {
  id: string
  filename: string
  content: string | null
}

interface Repository {
  id: string
  name: string
  fullName: string
  description: string | null
  url: string
  status: string
  lastSyncedAt: string | null
  files: ProjectFile[]
}

interface ChecklistItem {
  text: string
  done: boolean
}

interface ChangelogEntry {
  version: string
  items: string[]
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .trim()
}

function parseMvpChecklist(content: string): ChecklistItem[] {
  const items: ChecklistItem[] = []
  for (const line of content.split('\n')) {
    const t = line.trim()
    const done = /^[-*]\s+\[x\]/i.test(t)
    const open = /^[-*]\s+\[ \]/.test(t)
    if (done || open) {
      const text = stripMarkdown(t.replace(/^[-*]\s+\[[x ]\]\s*/i, ''))
      if (text) items.push({ text, done })
    }
  }
  return items
}

function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []
  let current: ChangelogEntry | null = null
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    const match = line.match(/^#{1,3}\s+(.+)/)
    if (match) {
      if (current) entries.push(current)
      current = { version: match[1].replace(/^v/i, ''), items: [] }
    } else if (current && /^[-*]/.test(line)) {
      const text = stripMarkdown(line.replace(/^[-*]\s+/, ''))
      if (text) current.items.push(text)
    }
  }
  if (current) entries.push(current)
  return entries.slice(0, 6)
}

function extractReadmeSummary(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
  return stripMarkdown(lines.slice(0, 3).join(' ')).slice(0, 400)
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  COMPLETED: { label: 'Completed', bg: 'bg-green-500', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  MVP:       { label: 'MVP',       bg: 'bg-yellow-400', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
}

export default function ProjectDetails() {
  const { repoId } = useParams() as { repoId: string }
  const { status } = useSession()
  const router = useRouter()
  const [repository, setRepository] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch(`/api/repos/${repoId}`)
        .then((r) => r.ok ? r.json() : null)
        .then(setRepository)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [status, repoId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex gap-2 items-center text-gray-400">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading…
        </div>
      </div>
    )
  }

  if (!repository) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 gap-3">
        <p className="text-gray-500">Repository not found</p>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  const fileMap = Object.fromEntries(repository.files.map((f) => [f.filename.toLowerCase(), f.content ?? '']))

  const mvpContent      = fileMap['mvp.md'] ?? ''
  const changelogContent = fileMap['changelog.md'] ?? ''
  const readmeContent   = fileMap['readme.md'] ?? ''

  const checklist   = parseMvpChecklist(mvpContent)
  const changelog   = parseChangelog(changelogContent)
  const summary     = extractReadmeSummary(readmeContent)

  const doneItems   = checklist.filter((i) => i.done)
  const todoItems   = checklist.filter((i) => !i.done)
  const pct         = checklist.length > 0 ? Math.round((doneItems.length / checklist.length) * 100) : null

  const cfg = STATUS_CONFIG[repository.status] ?? STATUS_CONFIG.IN_PROGRESS

  const otherFiles = repository.files.filter(
    (f) => !['mvp.md', 'changelog.md', 'readme.md'].includes(f.filename.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="w-full px-6 py-4">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            ← Dashboard
          </Link>

          <div className="flex items-center justify-between mt-2 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">{repository.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{repository.fullName}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.text} bg-opacity-10 border ${cfg.border}`}>
                {cfg.label}
              </span>
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                </svg>
                GitHub ↗
              </a>
            </div>
          </div>

          {repository.lastSyncedAt && (
            <p className="text-xs text-gray-400 mt-2">
              Synced {new Date(Number(repository.lastSyncedAt) * 1000).toLocaleString()}
            </p>
          )}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left col: MVP ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Summary */}
          {summary && (
            <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 px-6 py-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* MVP Progress card */}
          {checklist.length > 0 ? (
            <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 px-6 py-5 space-y-5">

              {/* Title + stats */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-black dark:text-white">MVP Progress</h2>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">{doneItems.length}/{checklist.length} done</span>
                  <span className={`font-bold text-lg ${pct === 100 ? 'text-green-500' : pct! >= 50 ? 'text-yellow-500' : 'text-blue-500'}`}>
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    pct === 100 ? 'bg-green-500' : pct! >= 50 ? 'bg-yellow-400' : 'bg-blue-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Todo items */}
              {todoItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">To do — {todoItems.length}</p>
                  {todoItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-1">
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Done items (collapsible) */}
              {doneItems.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <button
                    onClick={() => setShowDone((v) => !v)}
                    className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className={`w-3 h-3 transition-transform ${showDone ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Completed — {doneItems.length}
                  </button>
                  {showDone && doneItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-1">
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded bg-green-500 flex items-center justify-center text-white text-[10px]">✓</span>
                      <span className="text-sm text-gray-400 line-through">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-black rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-6 py-8 text-center">
              <p className="text-sm text-gray-400 mb-3">No <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">MVP.md</code> found</p>
              <pre className="text-xs text-left inline-block bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-gray-500 border border-gray-200 dark:border-gray-800">
{`- [x] Database setup
- [x] Auth system
- [ ] Core feature A
- [ ] Core feature B`}
              </pre>
            </div>
          )}

          {/* Other files */}
          {otherFiles.length > 0 && (
            <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              <p className="px-6 py-4 text-sm font-semibold text-black dark:text-white">Other files</p>
              {otherFiles.map((file) => (
                <details key={file.id} className="group">
                  <summary className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 list-none">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{file.filename}</span>
                    <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  {file.content && (
                    <pre className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-64 bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap">
                      {file.content}
                    </pre>
                  )}
                </details>
              ))}
            </div>
          )}
        </div>

        {/* ── Right col: Changelog ───────────────────────────────── */}
        <div className="space-y-6">
          {changelog.length > 0 ? (
            <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 px-6 py-5">
              <h2 className="font-semibold text-black dark:text-white mb-5">Changelog</h2>
              <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-6 ml-1">
                {changelog.map((entry, i) => (
                  <li key={i} className="pl-5 relative">
                    <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-black ${i === 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <p className="text-sm font-semibold text-black dark:text-white">{entry.version}</p>
                    {entry.items.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {entry.items.map((item, j) => (
                          <li key={j} className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex-shrink-0 mt-1 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="bg-white dark:bg-black rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-6 py-8 text-center">
              <p className="text-sm text-gray-400">No <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">CHANGELOG.md</code></p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
