'use client'

import { useEffect, useState } from 'react'
import { Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import type { ParsedQuery, ParseQueryResponse } from '@/types/query'

// Register Chart.js components
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

interface CorrelationData {
  ticker: string
  metricX: string
  metricY: string
  correlation: number
  dataPoints: number
  data: Array<{ date: string; x: number; y: number }>
}

const EXAMPLE_QUERIES = [
  'Show correlation between job postings and price for AAPL',
  'Compare Reddit sentiment vs stock price for TSLA',
  'Does Twitter engagement predict NVDA stock movement?',
  'Show me employment signals vs price for META since 2024'
]

export default function CorrelationChart() {
  const [data, setData] = useState<CorrelationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [isParsingQuery, setIsParsingQuery] = useState(false)
  const [currentQuery, setCurrentQuery] = useState<ParsedQuery | null>(null)

  // Fetch correlation data based on current query parameters
  const fetchCorrelationData = async (params: ParsedQuery) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch correlation data')
      }

      const result = await response.json()
      setData(result)
      setCurrentQuery(params)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Load default data on mount
  useEffect(() => {
    fetchCorrelationData({
      ticker: 'AAPL',
      metricX: 'job_posts',
      metricY: 'price',
      startDate: '2024-01-01'
    })
  }, [])

  // Handle natural language query submission
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    try {
      setIsParsingQuery(true)
      setError(null)

      // Parse the query using Anthropic
      const parseResponse = await fetch('/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      })

      const parseResult: ParseQueryResponse = await parseResponse.json()

      if (!parseResult.success || !parseResult.parsed) {
        throw new Error(parseResult.error || 'Failed to parse query')
      }

      // Fetch correlation data with parsed parameters
      await fetchCorrelationData(parseResult.parsed)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process query')
    } finally {
      setIsParsingQuery(false)
    }
  }

  // Handle example query click
  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery)
    // Auto-submit the example query
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }
    }, 100)
  }

  // Render search interface
  const renderSearchInterface = () => (
    <div className="mb-6 space-y-4">
      <form onSubmit={handleQuerySubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question in natural language..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          disabled={isParsingQuery || loading}
        />
        <button
          type="submit"
          disabled={isParsingQuery || loading || !query.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isParsingQuery ? 'Analyzing...' : 'Search'}
        </button>
      </form>

      {/* Example queries */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 font-medium">Try:</span>
        {EXAMPLE_QUERIES.map((example, idx) => (
          <button
            key={idx}
            onClick={() => handleExampleClick(example)}
            disabled={isParsingQuery || loading}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Current query display */}
      {currentQuery && (
        <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
          <span className="font-medium">Current query:</span> {currentQuery.ticker} | {' '}
          {currentQuery.metricX} vs {currentQuery.metricY}
          {currentQuery.startDate && ` | Since ${currentQuery.startDate}`}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )

  if (loading && !data) {
    return (
      <div className="w-full">
        {renderSearchInterface()}
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading correlation analysis...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full">
        {renderSearchInterface()}
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">No data to display</div>
        </div>
      </div>
    )
  }

  const chartData = {
    datasets: [
      {
        label: `${data.ticker}: ${data.metricX} vs ${data.metricY}`,
        data: data.data.map(point => ({ x: point.x, y: point.y })),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = data.data[context.dataIndex]
            return `${point.date}: (${point.x}, ${point.y})`
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: data.metricX.replace(/_/g, ' ').toUpperCase(),
        },
      },
      y: {
        title: {
          display: true,
          text: data.metricY.replace(/_/g, ' ').toUpperCase(),
        },
      },
    },
  }

  return (
    <div className="w-full">
      {renderSearchInterface()}
      
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{data.ticker} Alternative Data Analysis</h2>
        <p className="text-gray-600 mt-2">
          Correlation: <span className="font-semibold">{data.correlation}</span> | Data Points: {data.dataPoints}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {data.correlation > 0.7 ? '🟢 Strong positive correlation' :
           data.correlation > 0.3 ? '🟡 Moderate positive correlation' :
           data.correlation > -0.3 ? '⚪ Weak/no correlation' :
           data.correlation > -0.7 ? '🟡 Moderate negative correlation' :
           '🔴 Strong negative correlation'}
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-lg text-gray-600">Updating chart...</div>
        </div>
      ) : (
        <div className="h-96">
          <Scatter data={chartData} options={options} />
        </div>
      )}
    </div>
  )
}