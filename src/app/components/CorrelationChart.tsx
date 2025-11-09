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
import type { ParsedQuery, ParseQueryResponse, CompareResponse, DiscoverResponse, DiscoveryResult } from '@/types/query'
import { VALID_TICKERS, VALID_METRICS } from '@/types/query'
import { useAuth } from '@/contexts/AuthContext'
import { getStrengthEmoji, getStrengthLabel, formatMetricName } from '@/lib/discovery'
import { getDisplayName } from '@/lib/metricDisplay'

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
  'Compare TSLA vs NVDA Sentiment Alpha',
  'Compare AAPL, MSFT, and GOOGL job postings vs price',
  'Show me Hiring Momentum Score vs price for META since 2024'
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
  
  // Discovery mode state
  const [discoveryMode, setDiscoveryMode] = useState(false)
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResult[]>([])
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL')
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)
  const [isEditingTicker, setIsEditingTicker] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)

  // Editable pills state for search query display
  const [editingField, setEditingField] = useState<string | null>(null) // Format: 'ticker-0', 'metricX', 'metricY'

  // Tooltip state for disabled Trend button
  const [showTrendTooltip, setShowTrendTooltip] = useState(false)

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

  // Handle discovery mode
  const handleDiscover = async () => {
    try {
      setIsDiscovering(true)
      setLoading(true)
      setError(null)
      setShowAllResults(false)
      setSelectedResultIndex(0)
      
      // Use the current ticker from the active query, or fall back to selectedTicker
      const tickerToDiscover = currentQuery?.ticker 
        || (currentQuery?.tickers && currentQuery.tickers[0]) 
        || selectedTicker
      
      // Update selectedTicker to match current view
      setSelectedTicker(tickerToDiscover)
      
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: tickerToDiscover,
          startDate: currentQuery?.startDate,
          endDate: currentQuery?.endDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to discover predictors')
      }

      const result: DiscoverResponse = await response.json()
      
      setDiscoveryResults(result.results)
      
      // Set the top result data
      setData({
        ticker: result.ticker,
        metricX: result.topResult.metric,
        metricY: 'price',
        correlation: result.topResult.correlation,
        dataPoints: result.topResult.data.length,
        data: result.topResult.data
      })
      setCompareData(null)
      setCurrentQuery({
        ticker: result.ticker,
        metricX: result.topResult.metric,
        metricY: 'price',
        startDate: currentQuery?.startDate,
        endDate: currentQuery?.endDate
      })
      
      // Set discovery mode AFTER data is loaded to prevent layout shift
      setDiscoveryMode(true)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover predictors')
      setDiscoveryMode(false)
    } finally {
      setIsDiscovering(false)
      setLoading(false)
    }
  }

  // Handle clicking on a discovery result
  const handleDiscoveryResultClick = async (result: DiscoveryResult, index: number) => {
    try {
      setLoading(true)
      setSelectedResultIndex(index)
      
      const response = await fetch('/api/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedTicker,
          metricX: result.metric,
          metricY: 'price',
          startDate: currentQuery?.startDate,
          endDate: currentQuery?.endDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch correlation data')
      }

      const correlationData = await response.json()
      setData(correlationData)
      setCompareData(null)
      setCurrentQuery({
        ticker: selectedTicker,
        metricX: result.metric,
        metricY: 'price',
        startDate: currentQuery?.startDate,
        endDate: currentQuery?.endDate
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load correlation')
    } finally {
      setLoading(false)
    }
  }

  // Handle ticker change in discovery mode
  const handleTickerChange = async (newTicker: string) => {
    setSelectedTicker(newTicker)
    setIsEditingTicker(false)
    
    // Re-run discovery with new ticker
    setIsDiscovering(true)
    setLoading(true)
    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: newTicker,
          startDate: currentQuery?.startDate,
          endDate: currentQuery?.endDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to discover predictors')
      }

      const result: DiscoverResponse = await response.json()
      
      setDiscoveryResults(result.results)
      setSelectedResultIndex(0)
      
      setData({
        ticker: result.ticker,
        metricX: result.topResult.metric,
        metricY: 'price',
        correlation: result.topResult.correlation,
        dataPoints: result.topResult.data.length,
        data: result.topResult.data
      })
      setCurrentQuery({
        ticker: result.ticker,
        metricX: result.topResult.metric,
        metricY: 'price',
        startDate: currentQuery?.startDate,
        endDate: currentQuery?.endDate
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover predictors')
    } finally {
      setIsDiscovering(false)
      setLoading(false)
    }
  }

  // Clear discovery mode
  const clearDiscoveryMode = () => {
    setDiscoveryMode(false)
    setDiscoveryResults([])
    setShowAllResults(false)
    setSelectedResultIndex(0)
  }

  // Handle ticker change in editable pill
  const handlePillTickerChange = async (index: number, newTicker: string) => {
    if (!currentQuery) return

    setEditingField(null)

    // Update the ticker at the specified index
    let updatedQuery: ParsedQuery
    if (currentQuery.tickers && currentQuery.tickers.length > 1) {
      const newTickers = [...currentQuery.tickers]
      newTickers[index] = newTicker
      updatedQuery = { ...currentQuery, tickers: newTickers }
    } else {
      updatedQuery = { ...currentQuery, ticker: newTicker, tickers: [newTicker] }
    }

    // Re-fetch data with updated query
    await fetchCorrelationData(updatedQuery)
  }

  // Handle metricX change in editable pill
  const handlePillMetricXChange = async (newMetric: string) => {
    if (!currentQuery) return

    setEditingField(null)

    const updatedQuery: ParsedQuery = {
      ...currentQuery,
      metricX: newMetric
    }

    // Re-fetch data with updated query
    await fetchCorrelationData(updatedQuery)
  }

  // Handle metricY change in editable pill
  const handlePillMetricYChange = async (newMetric: string) => {
    if (!currentQuery) return

    setEditingField(null)

    const updatedQuery: ParsedQuery = {
      ...currentQuery,
      metricY: newMetric
    }

    // Re-fetch data with updated query
    await fetchCorrelationData(updatedQuery)
  }

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
      clearDiscoveryMode()

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
    <div className="mb-8 space-y-5">
      <form onSubmit={handleQuerySubmit} className="flex gap-3">
        <div className="flex-1 relative">
          {discoveryMode ? (
            // Discovery mode display
            <div className="w-full px-5 py-3.5 border-2 border-blue-100 rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 flex items-center gap-3 shadow-sm">
              {isEditingTicker ? (
                <select
                  value={selectedTicker}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  className="font-semibold text-blue-600 bg-transparent border-none outline-none cursor-pointer text-lg"
                  autoFocus
                  onBlur={() => setIsEditingTicker(false)}
                >
                  {VALID_TICKERS.map((ticker) => (
                    <option key={ticker} value={ticker}>{ticker}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setIsEditingTicker(true)}
                  className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer px-2 py-1 hover:bg-white/60 rounded-lg transition-all text-lg"
                >
                  {selectedTicker}
                </button>
              )}
              <span className="text-gray-700 font-medium">{isDiscovering ? 'discovering predictors...' : 'price predictors'}</span>
              <button
                onClick={clearDiscoveryMode}
                className="ml-auto text-gray-400 hover:text-gray-600 text-2xl leading-none hover:bg-white/60 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                type="button"
              >
                ×
              </button>
            </div>
          ) : currentQuery ? (
            // Active query display with beautiful pills INSIDE the box
            <div className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl bg-white shadow-md hover:shadow-lg transition-all flex items-center flex-wrap gap-2">
              {/* Render ticker pills */}
              {(() => {
                const tickers = currentQuery.tickers || (currentQuery.ticker ? [currentQuery.ticker] : [])
                return tickers.map((ticker, index) => {
                  const fieldId = `ticker-${index}`
                  const isEditing = editingField === fieldId

                  return (
                    <div key={fieldId} className="flex items-center gap-1.5">
                      {isEditing ? (
                        <select
                          value={ticker}
                          onChange={(e) => handlePillTickerChange(index, e.target.value)}
                          className="font-bold text-blue-700 bg-blue-50 border-2 border-blue-400 rounded-full px-3 py-1.5 text-sm outline-none cursor-pointer shadow-sm hover:shadow-md transition-all"
                          autoFocus
                          onBlur={() => setEditingField(null)}
                        >
                          {VALID_TICKERS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingField(fieldId)}
                          className="font-bold text-blue-700 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 px-3 py-1.5 text-sm rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer border border-blue-200 hover:border-blue-400"
                          title="Click to change ticker"
                        >
                          {ticker}
                        </button>
                      )}
                      {index < tickers.length - 1 && <span className="text-blue-300 font-bold">•</span>}
                    </div>
                  )
                })
              })()}

              <span className="text-blue-400 mx-1">•</span>

              {/* MetricX pill */}
              {editingField === 'metricX' ? (
                <select
                  value={currentQuery.metricX}
                  onChange={(e) => handlePillMetricXChange(e.target.value)}
                  className="text-gray-800 font-medium bg-gray-50 border-2 border-gray-400 rounded-full px-3 py-1.5 text-sm outline-none cursor-pointer shadow-sm hover:shadow-md transition-all"
                  autoFocus
                  onBlur={() => setEditingField(null)}
                >
                  {VALID_METRICS.map((metric) => (
                    <option key={metric} value={metric}>{formatMetricName(metric)}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setEditingField('metricX')}
                  className="text-gray-800 font-medium bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 px-3 py-1.5 text-sm rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer border border-gray-200 hover:border-gray-400"
                  title="Click to change metric"
                >
                  {formatMetricName(currentQuery.metricX)}
                </button>
              )}

              <span className="text-gray-400 font-medium text-sm">vs</span>

              {/* MetricY pill */}
              {editingField === 'metricY' ? (
                <select
                  value={currentQuery.metricY}
                  onChange={(e) => handlePillMetricYChange(e.target.value)}
                  className="text-gray-800 font-medium bg-gray-50 border-2 border-gray-400 rounded-full px-3 py-1.5 text-sm outline-none cursor-pointer shadow-sm hover:shadow-md transition-all"
                  autoFocus
                  onBlur={() => setEditingField(null)}
                >
                  {VALID_METRICS.map((metric) => (
                    <option key={metric} value={metric}>{formatMetricName(metric)}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setEditingField('metricY')}
                  className="text-gray-800 font-medium bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 px-3 py-1.5 text-sm rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer border border-gray-200 hover:border-gray-400"
                  title="Click to change metric"
                >
                  {formatMetricName(currentQuery.metricY)}
                </button>
              )}

              {/* Date range (if exists) */}
              {currentQuery.startDate && (
                <>
                  <span className="text-blue-400 mx-1">•</span>
                  <span className="text-gray-600 font-medium text-sm bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    Since {currentQuery.startDate}
                  </span>
                </>
              )}

              {/* Clear button */}
              <button
                onClick={() => {
                  setCurrentQuery(null)
                  setQuery('')
                  setData(null)
                  setCompareData(null)
                }}
                className="ml-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center transition-all text-lg font-bold"
                type="button"
                title="New search"
              >
                ×
              </button>
            </div>
          ) : (
            // Empty state - show search input
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isApproved ? "What would you like to discover?" : "Available after account approval"}
              className={`w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base transition-all text-gray-900 placeholder:text-gray-400 shadow-sm hover:shadow-md ${!isApproved ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-300'}`}
              disabled={!isApproved || isParsingQuery || loading}
              title={!isApproved ? "Available after account approval" : ""}
            />
          )}
        </div>
        {!discoveryMode && !currentQuery && (
          <button
            type="submit"
            disabled={!isApproved || isParsingQuery || loading || !query.trim()}
            className="px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
            title={!isApproved ? "Available after account approval" : ""}
          >
            {isParsingQuery ? 'Analyzing...' : 'Search'}
          </button>
        )}
        <button
          type="button"
          onClick={handleDiscover}
          disabled={!isApproved || isDiscovering || loading}
          className="px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
          title={!isApproved ? "Available after account approval" : ""}
        >
          <span className="text-xl">✨</span>
          {isDiscovering ? 'Discovering...' : 'Discover'}
        </button>
      </form>

      {!discoveryMode && !currentQuery && (
        <div className="flex flex-wrap gap-2.5 items-center">
          <span className="text-sm text-gray-600 font-semibold tracking-wide">Quick start:</span>
          {EXAMPLE_QUERIES.map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(example)}
              disabled={!isApproved || isParsingQuery || loading}
              className={`text-xs px-4 py-2.5 rounded-xl transition-all duration-200 font-medium ${!isApproved ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200/80 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-700 hover:shadow-lg hover:scale-[1.02]'} disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
              title={!isApproved ? "Available after account approval" : ""}
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl shadow-sm">
          <p className="font-semibold mb-1">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )

  // Render view toggle buttons
  const renderViewToggle = () => {
    const trendAvailable = isTrendViewAvailable()

    return (
      <div className="flex items-center gap-4 mb-6">
        <div className="inline-flex bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl p-1.5 shadow-lg border border-gray-200/50">
          <button
            onClick={() => setViewMode('correlation')}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
              viewMode === 'correlation'
                ? 'bg-white text-gray-900 shadow-md scale-[1.02]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
            }`}
          >
            Correlation
          </button>
          <div className="relative">
            <button
              onClick={() => {
                if (trendAvailable) {
                  setViewMode('trend')
                }
              }}
              onMouseEnter={() => !trendAvailable && setShowTrendTooltip(true)}
              onMouseLeave={() => setShowTrendTooltip(false)}
              disabled={!trendAvailable}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                viewMode === 'trend'
                  ? 'bg-white text-gray-900 shadow-md scale-[1.02]'
                  : trendAvailable
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              Trend
            </button>
            {showTrendTooltip && !trendAvailable && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Trend requires price metric</span>
                  </div>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </div>
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
        label: `${result.ticker}: ${getDisplayName(compareData.metricX)} vs ${getDisplayName(compareData.metricY)} (r=${result.correlation})`,
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
            text: getDisplayName(compareData.metricX).toUpperCase(),
          },
        },
        y: {
          title: {
            display: true,
            text: getDisplayName(compareData.metricY).toUpperCase(),
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
      // Create a lookup map for O(1) access instead of O(n) find()
      const dataByDate = new Map(result.data.map(point => [point.date, point]))
      
      // Single-pass extraction: O(n) instead of O(n*m + n*m)
      const priceData: (number | null)[] = []
      const metricData: (number | null)[] = []
      
      for (const date of allDates) {
        const point = dataByDate.get(date)
        priceData.push(point ? (isPriceMetricX ? point.x : point.y) : null)
        metricData.push(point ? (isPriceMetricX ? point.y : point.x) : null)
      }
      
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
        label: `${result.ticker} ${getDisplayName(otherMetric)}`,
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
            text: getDisplayName(otherMetric).toUpperCase(),
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

        <div className="mb-6 bg-gradient-to-br from-white via-gray-50/40 to-blue-50/40 rounded-2xl p-6 border border-gray-200/60 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Multi-Stock Comparison</h2>
          <p className="text-gray-700 mb-4 font-medium">
            Comparing: <span className="font-bold text-gray-900">{compareData.results.map(r => r.ticker).join(', ')}</span>
          </p>
          <div className="space-y-2.5">
            {compareData.results.map((result) => {
              const corrValue = result.correlation
              const interpretation =
                corrValue > 0.7 ? '🟢 Strong positive' :
                corrValue > 0.3 ? '🟡 Moderate positive' :
                corrValue > -0.3 ? '⚪ Weak/no' :
                corrValue > -0.7 ? '🟡 Moderate negative' :
                '🔴 Strong negative'

              return (
                <div key={result.ticker} className="flex items-center gap-4 text-sm bg-white/60 px-4 py-3 rounded-xl border border-gray-200/60">
                  <span className="font-bold text-gray-900 text-base">{result.ticker}</span>
                  <span className="text-blue-600 font-bold tracking-tight">r={result.correlation.toFixed(4)}</span>
                  <span className="text-gray-600">{interpretation}</span>
                  <span className="text-gray-500 ml-auto">{result.dataPoints} points</span>
                </div>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50/50 via-blue-50/20 to-indigo-50/30 rounded-2xl border border-gray-200/60 shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <div className="text-lg font-semibold text-gray-700 tracking-tight">Updating chart...</div>
          </div>
        ) : viewMode === 'correlation' ? (
          <div className="h-96 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <Scatter data={correlationChartData} options={correlationOptions} />
          </div>
        ) : (
          <div className="h-96 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
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
          label: `${data.ticker}: ${getDisplayName(data.metricX)} vs ${getDisplayName(data.metricY)}`,
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
            text: getDisplayName(data.metricX).toUpperCase(),
          },
        },
        y: {
          title: {
            display: true,
            text: getDisplayName(data.metricY).toUpperCase(),
          },
        },
      },
    }

    // Trend view (time-series with dual Y-axes)
    // Single-pass extraction: O(n) instead of O(3n)
    const dates: string[] = []
    const priceData: number[] = []
    const metricData: number[] = []
    
    for (const point of data.data) {
      dates.push(point.date)
      priceData.push(isPriceMetricX ? point.x : point.y)
      metricData.push(isPriceMetricX ? point.y : point.x)
    }

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
          label: getDisplayName(otherMetric).toUpperCase(),
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
            text: getDisplayName(otherMetric).toUpperCase(),
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
        
        <div className={`flex gap-6 ${discoveryMode ? '' : ''}`}>
          {discoveryMode && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20 rounded-2xl border border-gray-200/60 p-6 sticky top-4 shadow-xl">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Price Predictors</h3>
                </div>
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full">
                  {(showAllResults ? discoveryResults : discoveryResults.slice(0, 5)).map((result, idx) => (
                    <button
                      key={result.metric}
                      onClick={() => handleDiscoveryResultClick(result, idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        selectedResultIndex === idx
                          ? 'border-blue-400 bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50 shadow-lg scale-[1.02] ring-2 ring-blue-200/50'
                          : 'border-gray-200/80 hover:border-blue-300/60 hover:bg-gradient-to-br hover:from-blue-50/40 hover:to-indigo-50/30 hover:shadow-md hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">{getStrengthEmoji(result.strength)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate text-sm mb-1.5 tracking-tight">
                            {formatMetricName(result.metric)}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-blue-600 tracking-tight">
                              {result.correlation.toFixed(3)}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {getStrengthLabel(result.correlation)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {discoveryResults.length > 5 && (
                  <button
                    onClick={() => setShowAllResults(!showAllResults)}
                    className="w-full mt-4 px-4 py-2.5 text-sm bg-white border border-gray-200/80 text-blue-600 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {showAllResults ? '↑ Show less' : `↓ Show all ${discoveryResults.length} results`}
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div className={discoveryMode ? 'flex-1 min-w-0' : 'w-full'}>
            <div className="mb-6 bg-gradient-to-br from-white via-gray-50/40 to-blue-50/40 rounded-2xl p-6 border border-gray-200/60 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">{data.ticker}</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="text-gray-600 font-medium tracking-wide uppercase text-xs">Correlation</span>
                  <span className="text-2xl font-bold text-blue-600 tracking-tight">{data.correlation.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-gray-600 font-medium tracking-wide uppercase text-xs">Data Points</span>
                  <span className="text-lg font-semibold text-gray-900">{data.dataPoints}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {data.correlation > 0.7 ? <span className="text-lg">🟢</span> :
                   data.correlation > 0.4 ? <span className="text-lg">🟡</span> :
                   data.correlation > -0.4 ? <span className="text-lg">⚪</span> :
                   data.correlation > -0.7 ? <span className="text-lg">🟡</span> :
                   <span className="text-lg">🔴</span>}
                  <span className="text-gray-800 font-semibold">
                    {data.correlation > 0.7 ? 'Strong positive' :
                     data.correlation > 0.4 ? 'Moderate positive' :
                     data.correlation > -0.4 ? 'Weak' :
                     data.correlation > -0.7 ? 'Moderate negative' :
                     'Strong negative'}
                  </span>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50/50 via-blue-50/20 to-indigo-50/30 rounded-2xl border border-gray-200/60 shadow-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <div className="text-lg font-semibold text-gray-700 tracking-tight">Analyzing data...</div>
              </div>
            ) : viewMode === 'correlation' ? (
              <div className="h-96 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <Scatter data={correlationChartData} options={correlationOptions} />
              </div>
            ) : (
              <div className="h-96 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <Line data={trendChartData} options={trendOptions} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}