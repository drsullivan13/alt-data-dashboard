'use client'

import { useEffect, useState } from 'react'
import { Scatter, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  CategoryScale,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import type { ParsedQuery, ParseQueryResponse, CompareResponse } from '@/types/query'
import { useAuth } from '@/contexts/AuthContext'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface CorrelationData {
  ticker: string
  metricX: string
  metricY: string
  correlation: number
  dataPoints: number
  data: Array<{ date: string; x: number; y: number }>
}

// Chart colors for multi-stock comparison (scatter plot)
const CHART_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.5)', border: 'rgba(59, 130, 246, 1)' },    // Blue
  { bg: 'rgba(239, 68, 68, 0.5)', border: 'rgba(239, 68, 68, 1)' },      // Red
  { bg: 'rgba(34, 197, 94, 0.5)', border: 'rgba(34, 197, 94, 1)' },      // Green
]

// Colors for time-series lines
const PRICE_COLORS = [
  { line: 'rgba(59, 130, 246, 1)', fill: 'rgba(59, 130, 246, 0.1)' },    // Blue
  { line: 'rgba(239, 68, 68, 1)', fill: 'rgba(239, 68, 68, 0.1)' },      // Red
  { line: 'rgba(168, 85, 247, 1)', fill: 'rgba(168, 85, 247, 0.1)' },    // Purple
]

const METRIC_COLORS = [
  { line: 'rgba(34, 197, 94, 1)', fill: 'rgba(34, 197, 94, 0.1)' },      // Green
  { line: 'rgba(234, 179, 8, 1)', fill: 'rgba(234, 179, 8, 0.1)' },      // Yellow
  { line: 'rgba(20, 184, 166, 1)', fill: 'rgba(20, 184, 166, 0.1)' },    // Teal
]

const EXAMPLE_QUERIES = [
  'Show correlation between job postings and price for AAPL',
  'Compare TSLA vs NVDA Reddit sentiment',
  'Compare AAPL, MSFT, and GOOGL job postings vs price',
  'Show me employment signals vs price for META since 2024'
]

export default function CorrelationChart() {
  const { isApproved } = useAuth()
  const [data, setData] = useState<CorrelationData | null>(null)
  const [compareData, setCompareData] = useState<CompareResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [isParsingQuery, setIsParsingQuery] = useState(false)
  const [currentQuery, setCurrentQuery] = useState<ParsedQuery | null>(null)
  const [viewMode, setViewMode] = useState<'correlation' | 'trend'>('correlation')

  // Fetch correlation data based on current query parameters
  const fetchCorrelationData = async (params: ParsedQuery) => {
    try {
      setLoading(true)
      setError(null)
      setCompareData(null) // Clear compare data when fetching single stock
      
      // Check if this is a multi-stock comparison
      const isMultiStock = params.tickers && params.tickers.length > 1
      
      if (isMultiStock) {
        // Use compare API for multiple stocks
        const response = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tickers: params.tickers,
            metricX: params.metricX,
            metricY: params.metricY,
            startDate: params.startDate,
            endDate: params.endDate
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch comparison data')
        }

        const result: CompareResponse = await response.json()
        setData(null) // Clear single stock data
        setCompareData(result)
        setCurrentQuery(params)
      } else {
        // Use existing correlation API for single stock (backwards compatible)
        const ticker = params.ticker || (params.tickers && params.tickers[0])
        if (!ticker) {
          throw new Error('No ticker specified')
        }
        
        const response = await fetch('/api/correlation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker,
            metricX: params.metricX,
            metricY: params.metricY,
            startDate: params.startDate,
            endDate: params.endDate
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch correlation data')
        }

        const result = await response.json()
        setData(result)
        setCompareData(null) // Clear compare data
        setCurrentQuery(params)
      }
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

  // Check if price is one of the metrics (required for trend view)
  const hasPriceMetric = (metricX: string, metricY: string): boolean => {
    return metricX === 'price' || metricY === 'price'
  }

  // Check if trend view is available
  const isTrendViewAvailable = (): boolean => {
    if (data) {
      return hasPriceMetric(data.metricX, data.metricY)
    }
    if (compareData) {
      return hasPriceMetric(compareData.metricX, compareData.metricY)
    }
    return false
  }

  // Render search interface
  const renderSearchInterface = () => (
    <div className="mb-6 space-y-4">
      <form onSubmit={handleQuerySubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isApproved ? "Ask a question in natural language..." : "Available after account approval"}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${!isApproved ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            disabled={!isApproved || isParsingQuery || loading}
            title={!isApproved ? "Available after account approval" : ""}
          />
        </div>
        <button
          type="submit"
          disabled={!isApproved || isParsingQuery || loading || !query.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          title={!isApproved ? "Available after account approval" : ""}
        >
          {isParsingQuery ? 'Analyzing...' : 'Search'}
        </button>
      </form>

      {/* Hint text */}
      <div className="text-sm text-gray-500">
        💡 Compare up to 3 stocks at once for best readability
      </div>

      {/* Example queries */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 font-medium">Try:</span>
        {EXAMPLE_QUERIES.map((example, idx) => (
          <button
            key={idx}
            onClick={() => handleExampleClick(example)}
            disabled={!isApproved || isParsingQuery || loading}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${!isApproved ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
            title={!isApproved ? "Available after account approval" : ""}
          >
            {example}
          </button>
        ))}
      </div>

      {/* Current query display */}
      {currentQuery && (
        <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
          <span className="font-medium">Current query:</span>{' '}
          {currentQuery.ticker || (currentQuery.tickers && currentQuery.tickers.join(', '))} | {' '}
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

  // Render view toggle buttons
  const renderViewToggle = () => {
    const trendAvailable = isTrendViewAvailable()
    
    return (
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('correlation')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'correlation'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Correlation View
        </button>
        <button
          onClick={() => {
            if (trendAvailable) {
              setViewMode('trend')
            }
          }}
          disabled={!trendAvailable}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'trend'
              ? 'bg-blue-600 text-white'
              : trendAvailable
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={!trendAvailable ? 'Trend view requires price as one of the metrics' : ''}
        >
          Trend View
        </button>
        {!trendAvailable && (
          <span className="text-sm text-gray-500 self-center ml-2">
            💡 Trend view requires price as one of the metrics
          </span>
        )}
      </div>
    )
  }

  if (loading && !data && !compareData) {
    return (
      <div className="w-full">
        {renderSearchInterface()}
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading correlation analysis...</div>
        </div>
      </div>
    )
  }

  if (!data && !compareData) {
    return (
      <div className="w-full">
        {renderSearchInterface()}
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">No data to display</div>
        </div>
      </div>
    )
  }

  // Render multi-stock comparison
  if (compareData) {
    // Prepare data for trend view
    const isPriceMetricX = compareData.metricX === 'price'
    const otherMetric = isPriceMetricX ? compareData.metricY : compareData.metricX

    // Correlation view (scatter plot)
    const correlationChartData = {
      datasets: compareData.results.map((result, idx) => ({
        label: `${result.ticker}: ${compareData.metricX} vs ${compareData.metricY} (r=${result.correlation})`,
        data: result.data.map(point => ({ x: point.x, y: point.y })),
        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length].bg,
        borderColor: CHART_COLORS[idx % CHART_COLORS.length].border,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      })),
    }

    const correlationOptions: ChartOptions<'scatter'> = {
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
              const result = compareData.results[context.datasetIndex]
              const point = result.data[context.dataIndex]
              return `${result.ticker} - ${point.date}: (${point.x}, ${point.y})`
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: compareData.metricX.replace(/_/g, ' ').toUpperCase(),
          },
        },
        y: {
          title: {
            display: true,
            text: compareData.metricY.replace(/_/g, ' ').toUpperCase(),
          },
        },
      },
    }

    // Trend view (time-series with dual Y-axes)
    // Collect all unique dates from all stocks
    const allDates = Array.from(
      new Set(
        compareData.results.flatMap(result => 
          result.data.map(point => point.date)
        )
      )
    ).sort()

    // Create datasets for trend view - organized alphabetically by ticker
    const trendDatasets: any[] = []
    
    // Add both price and metric lines for each stock (grouped by ticker)
    compareData.results.forEach((result, idx) => {
      const priceData = allDates.map(date => {
        const point = result.data.find(p => p.date === date)
        if (!point) return null
        return isPriceMetricX ? point.x : point.y
      })
      
      const metricData = allDates.map(date => {
        const point = result.data.find(p => p.date === date)
        if (!point) return null
        return isPriceMetricX ? point.y : point.x
      })
      
      // Add price line for this ticker
      trendDatasets.push({
        label: `${result.ticker} Price`,
        data: priceData,
        borderColor: PRICE_COLORS[idx % PRICE_COLORS.length].line,
        backgroundColor: PRICE_COLORS[idx % PRICE_COLORS.length].fill,
        yAxisID: 'y-left',
        tension: 0.1,
        fill: false,
        ticker: result.ticker, // For sorting
      })
      
      // Add metric line for this ticker (immediately after price)
      trendDatasets.push({
        label: `${result.ticker} ${otherMetric.replace(/_/g, ' ')}`,
        data: metricData,
        borderColor: METRIC_COLORS[idx % METRIC_COLORS.length].line,
        backgroundColor: METRIC_COLORS[idx % METRIC_COLORS.length].fill,
        yAxisID: 'y-right',
        tension: 0.1,
        fill: false,
        ticker: result.ticker, // For sorting
      })
    })

    const trendChartData = {
      labels: allDates,
      datasets: trendDatasets,
    }

    const trendOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        },
        tooltip: {
          callbacks: {
            title: (context) => {
              return `Date: ${context[0].label}`
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
          },
        },
        'y-left': {
          type: 'linear' as const,
          position: 'left' as const,
          title: {
            display: true,
            text: 'Price ($)',
          },
        },
        'y-right': {
          type: 'linear' as const,
          position: 'right' as const,
          title: {
            display: true,
            text: otherMetric.replace(/_/g, ' ').toUpperCase(),
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    }

    return (
      <div className="w-full">
        {renderSearchInterface()}
        
        {renderViewToggle()}
        
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Multi-Stock Comparison</h2>
          <p className="text-gray-600 mt-2">
            Comparing: <span className="font-semibold">{compareData.results.map(r => r.ticker).join(', ')}</span>
          </p>
          <div className="mt-2 space-y-1">
            {compareData.results.map((result) => {
              const corrValue = result.correlation
              const interpretation = 
                corrValue > 0.7 ? '🟢 Strong positive' :
                corrValue > 0.3 ? '🟡 Moderate positive' :
                corrValue > -0.3 ? '⚪ Weak/no' :
                corrValue > -0.7 ? '🟡 Moderate negative' :
                '🔴 Strong negative'
              
              return (
                <p key={result.ticker} className="text-sm text-gray-600">
                  <span className="font-semibold">{result.ticker}:</span> r={result.correlation} ({interpretation} correlation) | {result.dataPoints} data points
                </p>
              )
            })}
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-lg text-gray-600">Updating chart...</div>
          </div>
        ) : viewMode === 'correlation' ? (
          <div className="h-96">
            <Scatter data={correlationChartData} options={correlationOptions} />
          </div>
        ) : (
          <div className="h-96">
            <Line data={trendChartData} options={trendOptions} />
          </div>
        )}
      </div>
    )
  }

  // Render single-stock view (backwards compatible)
  if (data) {
    // Prepare data for trend view
    const isPriceMetricX = data.metricX === 'price'
    const otherMetric = isPriceMetricX ? data.metricY : data.metricX

    // Correlation view (scatter plot)
    const correlationChartData = {
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

    const correlationOptions: ChartOptions<'scatter'> = {
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

    // Trend view (time-series with dual Y-axes)
    const dates = data.data.map(point => point.date)
    const priceData = data.data.map(point => isPriceMetricX ? point.x : point.y)
    const metricData = data.data.map(point => isPriceMetricX ? point.y : point.x)

    const trendChartData = {
      labels: dates,
      datasets: [
        {
          label: 'Price',
          data: priceData,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y-left',
          tension: 0.1,
          fill: false,
        },
        {
          label: otherMetric.replace(/_/g, ' ').toUpperCase(),
          data: metricData,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          yAxisID: 'y-right',
          tension: 0.1,
          fill: false,
        },
      ],
    }

    const trendOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        },
        tooltip: {
          callbacks: {
            title: (context) => {
              return `Date: ${context[0].label}`
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
          },
        },
        'y-left': {
          type: 'linear' as const,
          position: 'left' as const,
          title: {
            display: true,
            text: 'Price ($)',
          },
        },
        'y-right': {
          type: 'linear' as const,
          position: 'right' as const,
          title: {
            display: true,
            text: otherMetric.replace(/_/g, ' ').toUpperCase(),
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    }

    return (
      <div className="w-full">
        {renderSearchInterface()}
        
        {renderViewToggle()}
        
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
        ) : viewMode === 'correlation' ? (
          <div className="h-96">
            <Scatter data={correlationChartData} options={correlationOptions} />
          </div>
        ) : (
          <div className="h-96">
            <Line data={trendChartData} options={trendOptions} />
          </div>
        )}
      </div>
    )
  }

  return null
}