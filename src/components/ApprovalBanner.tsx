'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function ApprovalBanner() {
  const { isApproved, loading } = useAuth()

  if (loading || isApproved) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
        <span className="text-yellow-800">⚠️</span>
        <p className="text-sm text-yellow-800">
          <strong>Account pending approval.</strong> You&apos;ll receive an email when your account is approved and features are unlocked.
        </p>
      </div>
    </div>
  )
}
