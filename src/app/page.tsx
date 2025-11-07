import CorrelationChart from './components/CorrelationChart'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Alternative Data Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Analyze correlations between alternative data signals and stock performance
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <CorrelationChart />
        </div>
      </div>
    </main>
  )
}