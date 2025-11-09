'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function ApprovalBanner() {
  const { isApproved, loading } = useAuth()

  if (loading || isApproved) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b border-amber-100/50 px-6 py-3 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex-shrink-0">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Account pending approval</span>
          <span className="text-gray-600 mx-2">•</span>
          <span className="text-gray-600">You&apos;ll receive an email when approved</span>
        </p>
      </div>
    </div>
  )
}
