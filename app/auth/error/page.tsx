'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    OAuthSignin: 'Error constructing GitHub OAuth URL',
    OAuthCallback: 'Error handling GitHub callback',
    OAuthCreateAccount: 'Could not create account via GitHub',
    Callback: 'Error in authentication callback',
    Default: 'An unknown authentication error occurred',
  }

  const message = error ? (errorMessages[error] ?? `Error: ${error}`) : errorMessages.Default

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black items-center justify-center">
      <div className="max-w-md text-center px-6">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
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

export default function AuthError() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
