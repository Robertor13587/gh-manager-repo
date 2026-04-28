'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

export default function ProjectDetails({ params }: { params: { repoId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repository, setRepository] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedFile, setExpandedFile] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRepository()
    }
  }, [status])

  const fetchRepository = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/repos/${params.repoId}`)
      if (res.ok) {
        const data = await res.json()
        setRepository(data)
      }
    } catch (error) {
      console.error('Failed to fetch repository:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-black">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!repository) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-black">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Repository not found</p>
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                {repository.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{repository.fullName}</p>
            </div>
            <span
              className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(repository.status)}`}
            >
              {repository.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {repository.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-2">Description</h2>
            <p className="text-gray-600 dark:text-gray-400">{repository.description}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-2">Information</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Last Synced:</strong>{' '}
              {repository.lastSyncedAt
                ? new Date(repository.lastSyncedAt).toLocaleString()
                : 'Never'}
            </p>
            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View on GitHub →
            </a>
          </div>
        </div>

        {repository.files.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Files</h2>
            <div className="space-y-2">
              {repository.files.map((file) => (
                <div
                  key={file.id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg"
                >
                  <button
                    onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <span className="font-medium text-black dark:text-white">{file.filename}</span>
                    <span className="text-gray-400">{expandedFile === file.id ? '−' : '+'}</span>
                  </button>

                  {expandedFile === file.id && file.content && (
                    <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-900">
                      <pre className="text-xs overflow-auto max-h-96 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {file.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {repository.files.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No files tracked for this repository yet</p>
          </div>
        )}
      </main>
    </div>
  )
}
