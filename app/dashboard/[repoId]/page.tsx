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

function parseMvpChecklist(content: string): ChecklistItem[] {
  const items: ChecklistItem[] = []
  for (const line of content.split('\n')) {
    const done = /^[-*]\s+\[x\]/i.test(line.trim())
    const open = /^[-*]\s+\[ \]/.test(line.trim())
    if (done || open) {
      const text = line.replace(/^[-*]\s+\[[x ]\]\s*/i, '').trim()
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
    const versionMatch = line.match(/^#{1,3}\s+(?:v?(\d+\.\d+[\.\d]*)|(.+))/)
    if (versionMatch) {
      if (current) entries.push(current)
      current = { version: versionMatch[1] ?? versionMatch[2], items: [] }
    } else if (current && /^[-*]/.test(line)) {
      const text = line.replace(/^[-*]\s+/, '').trim()
      if (text) current.items.push(text)
    }
  }
  if (current) entries.push(current)
  return entries.slice(0, 5)
}

function extractReadmeSummary(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
  return lines.slice(0, 3).join(' ').slice(0, 300)
}

export default function ProjectDetails() {
  const { repoId } = useParams() as { repoId: string }
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repository, setRepository] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchRepository()
  }, [status])

  const fetchRepository = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/repos/${repoId}`)
      if (res.ok) setRepository(await res.json())
    } catch (e) {
      console.error('Failed to fetch repository:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!repository) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black gap-4">
        <p className="text-gray-600 dark:text-gray-400">Repository not found</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  const fileMap = Object.fromEntries(repository.files.map((f) => [f.filename, f.content ?? '']))

  const mvpContent = fileMap['MVP.md'] ?? fileMap['mvp.md'] ?? ''
  const changelogContent = fileMap['CHANGELOG.md'] ?? fileMap['changelog.md'] ?? ''
  const readmeContent = fileMap['README.md'] ?? fileMap['readme.md'] ?? ''

  const checklist = parseMvpChecklist(mvpContent)
  const changelog = parseChangelog(changelogContent)
  const readmeSummary = extractReadmeSummary(readmeContent)

  const done = checklist.filter((i) => i.done).length
  const total = checklist.length
  const pct = total > 0 ? Math.round((done / total) * 100) : null

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    MVP: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">{repository.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{repository.fullName}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[repository.status] ?? statusColors.IN_PROGRESS}`}>
                {repository.status}
              </span>
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
              >
                GitHub ↗
              </a>
            </div>
          </div>
          {repository.lastSyncedAt && (
            <p className="text-xs text-gray-400 mt-2">
              Last synced: {new Date(Number(repository.lastSyncedAt) * 1000).toLocaleString()}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* README summary */}
        {readmeSummary && (
          <section>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{readmeSummary}</p>
          </section>
        )}

        {/* MVP Progress */}
        {checklist.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-black dark:text-white">MVP Progress</h2>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {done}/{total} ({pct}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs ${
                    item.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {item.done ? '✓' : ''}
                  </span>
                  <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No MVP file fallback */}
        {checklist.length === 0 && (
          <section className="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No <code className="font-mono">MVP.md</code> found — add one with checkboxes to track progress:
            </p>
            <pre className="mt-3 text-xs text-left inline-block bg-gray-50 dark:bg-gray-900 rounded p-3 text-gray-600 dark:text-gray-400">
{`- [ ] User authentication
- [ ] Core feature A
- [x] Database setup`}
            </pre>
          </section>
        )}

        {/* Changelog */}
        {changelog.length > 0 && (
          <section>
            <h2 className="font-semibold text-black dark:text-white mb-3">Changelog</h2>
            <div className="space-y-4">
              {changelog.map((entry, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    {i < changelog.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <span className="text-sm font-medium text-black dark:text-white">{entry.version}</span>
                    {entry.items.length > 0 && (
                      <ul className="mt-1 space-y-1">
                        {entry.items.map((item, j) => (
                          <li key={j} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                            <span className="text-gray-400">·</span>{item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Other tracked files */}
        {repository.files.filter(f => !['MVP.md','mvp.md','CHANGELOG.md','changelog.md','README.md','readme.md'].includes(f.filename)).length > 0 && (
          <section>
            <h2 className="font-semibold text-black dark:text-white mb-3">Other Files</h2>
            <div className="space-y-2">
              {repository.files
                .filter(f => !['MVP.md','mvp.md','CHANGELOG.md','changelog.md','README.md','readme.md'].includes(f.filename))
                .map((file) => (
                  <details key={file.id} className="border border-gray-200 dark:border-gray-800 rounded-lg">
                    <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg">
                      {file.filename}
                    </summary>
                    {file.content && (
                      <pre className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-64 border-t border-gray-200 dark:border-gray-800 whitespace-pre-wrap">
                        {file.content}
                      </pre>
                    )}
                  </details>
                ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
