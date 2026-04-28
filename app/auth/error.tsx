'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black items-center justify-center">
      <div className="max-w-md text-center px-6">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error ? `Error: ${error}` : 'Something went wrong during authentication'}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  )
}
