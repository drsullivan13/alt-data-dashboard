'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function UserMenu() {
  const { user, isApproved, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="absolute top-8 right-8">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/60 backdrop-blur-md border border-gray-200/60 hover:bg-white/80 hover:border-gray-300/80 transition-all shadow-sm"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-gray-700">{user.email}</div>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-xl z-20 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-900">{user.email}</div>
                {!isApproved ? (
                  <div className="mt-1 inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    ⏳ Pending approval
                  </div>
                ) : (
                  <div className="mt-1 inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    ✓ Approved
                  </div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
