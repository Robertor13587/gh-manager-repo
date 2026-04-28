'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Repository {
  id: string
  name: string
  fullName: string
  description: string | null
  url: string
  status: string
  lastSyncedAt: string | null
}

const SECTIONS: { key: string; label: string; accent: string; badge: string }[] = [
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    accent: 'border-blue-400 dark:border-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  {
    key: 'MVP',
    label: 'MVP',
    accent: 'border-yellow-400 dark:border-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  {
    key: 'COMPLETED',
    label: 'Completed',
    accent: 'border-green-400 dark:border-green-500',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
]

function RepoCard({ repo, badge }: { repo: Repository; badge: string }) {
  return (
    <Link
      href={`/dashboard/${repo.id}`}
      className="group flex flex-col gap-2 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all bg-white dark:bg-black"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-black dark:text-white truncate">{repo.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{repo.fullName}</p>
        </div>
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mt-0.5"
          title="Open on GitHub"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {repo.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{repo.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {repo.lastSyncedAt
            ? new Date(Number(repo.lastSyncedAt) * 1000).toLocaleDateString()
            : 'Never synced'}
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:underline">
          Details →
        </span>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchRepositories()
  }, [status])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/repos')
      if (res.ok) setRepositories(await res.json())
    } catch (e) {
      console.error('Failed to fetch repositories:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const res = await fetch('/api/repos', { method: 'POST' })
      if (res.ok) await fetchRepositories()
    } catch (e) {
      console.error('Failed to sync repositories:', e)
    } finally {
      setSyncing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const grouped = Object.fromEntries(
    SECTIONS.map((s) => [s.key, repositories.filter((r) => r.status === s.key)])
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-black dark:text-white">GitHub Project Manager</h1>
            <span className="text-sm text-gray-400">{repositories.length} projects</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => signOut({ redirect: true })}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="w-full px-6 py-8">
        {repositories.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 mb-2">No repositories found</p>
            <p className="text-sm text-gray-400">Click "Sync Now" to import your GitHub repositories</p>
          </div>
        ) : (
          <div className="space-y-10">
            {SECTIONS.map((section) => {
              const repos = grouped[section.key]
              if (repos.length === 0) return null
              return (
                <section key={section.key}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${section.badge}`}>
                      {section.label}
                    </span>
                    <span className="text-sm text-gray-400">{repos.length}</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  </div>

                  {/* Grid */}
                  <div className={`border-l-2 ${section.accent} pl-4`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {repos.map((repo) => (
                        <RepoCard key={repo.id} repo={repo} badge={section.badge} />
                      ))}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
