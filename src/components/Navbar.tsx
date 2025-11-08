'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, isApproved, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Alternative Data Dashboard
          </h2>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600">{user.email}</span>
              {!isApproved && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
