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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRepositories()
    }
  }, [status])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/repos')
      if (res.ok) {
        const data = await res.json()
        setRepositories(data)
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const res = await fetch('/api/repos', { method: 'POST' })
      if (res.ok) {
        await fetchRepositories()
      }
    } catch (error) {
      console.error('Failed to sync repositories:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'MVP':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-white dark:bg-black">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-black dark:text-white">GitHub Project Manager</h1>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {repositories.length} projects
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => signOut({ redirect: true })}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {repositories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No repositories found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Click "Sync Now" to fetch your GitHub repositories
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repositories.map((repo) => (
              <Link
                key={repo.id}
                href={`/dashboard/${repo.id}`}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-lg transition-shadow hover:border-gray-300 dark:hover:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-black dark:text-white truncate">
                      {repo.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {repo.fullName}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(repo.status)}`}
                  >
                    {repo.status}
                  </span>
                </div>

                {repo.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {repo.description}
                  </p>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  {repo.lastSyncedAt ? (
                    <>Last synced: {new Date(repo.lastSyncedAt).toLocaleDateString()}</>
                  ) : (
                    <>Never synced</>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 dark:text-blue-400 hover:underline">
                    View details →
                  </span>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.preventDefault()}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
