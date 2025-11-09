import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import CorrelationChart from './components/CorrelationChart'
import UserMenu from './components/UserMenu'
import ApprovalBanner from '@/components/ApprovalBanner'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <ApprovalBanner />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <UserMenu />
          
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent mb-3 tracking-tight">
              Financial Data Intelligence
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover hidden correlations between financial data signals and stock performance
            </p>
          </header>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
            <CorrelationChart />
          </div>
        </div>
      </main>
    </>
  )
}