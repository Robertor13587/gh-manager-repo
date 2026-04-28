'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white dark:bg-black min-h-screen">
      <main className="flex flex-col items-center justify-center gap-8 text-center max-w-md px-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-black dark:text-white">GitHub Project Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your GitHub projects. Monitor MVP and completed status automatically.
          </p>
        </div>

        <button
          onClick={() => signIn('github', { redirect: false })}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.191.092-.929.35-1.544.636-1.9-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          Sign in with GitHub
        </button>

        <div className="text-sm text-gray-500 dark:text-gray-500">
          We only access your public repositories and profile information.
        </div>
      </main>
    </div>
  )
}
