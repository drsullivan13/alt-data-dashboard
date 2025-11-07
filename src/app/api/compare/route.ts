// app/api/compare/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { CompareRequest, CompareResult, CompareResponse } from '@/types/query'

// Helper function to calculate Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0 || n !== y.length) return 0
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0)
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0)
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  return denominator === 0 ? 0 : numerator / denominator
}

// Fetch correlation data for a single ticker
async function fetchTickerData(
  ticker: string,
  metricX: string,
  metricY: string,
  startDate?: string,
  endDate?: string
): Promise<CompareResult> {
  // Build query
  let query = supabase
    .from('stock_metrics')
    .select(`date, ${metricX}, ${metricY}`)
    .eq('ticker', ticker)
    .order('date', { ascending: true })
  
  // Add date filters if provided
  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Database query failed for ${ticker}: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    throw new Error(`No data found for ${ticker}`)
  }
  
  // Filter out null values and prepare data for correlation
  const validData = data.filter((row: any) => 
    row[metricX] !== null && row[metricY] !== null
  )
  
  if (validData.length < 2) {
    throw new Error(`Insufficient data points for ${ticker}`)
  }
  
  const xValues = validData.map((row: any) => Number(row[metricX]))
  const yValues = validData.map((row: any) => Number(row[metricY]))
  
  // Calculate correlation
  const correlation = calculateCorrelation(xValues, yValues)
  
  // Prepare chart data
  const chartData = validData.map((row: any) => ({
    date: row.date,
    x: Number(row[metricX]),
    y: Number(row[metricY])
  }))
  
  return {
    ticker,
    correlation: Number(correlation.toFixed(4)),
    dataPoints: chartData.length,
    data: chartData
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json()
    const { tickers, metricX, metricY, startDate, endDate } = body
    
    // Validate inputs
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'tickers array is required and must not be empty' },
        { status: 400 }
      )
    }
    
    if (!metricX || !metricY) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: metricX, metricY' },
        { status: 400 }
      )
    }
    
    // Fetch data for all tickers in parallel
    const results = await Promise.all(
      tickers.map(ticker => 
        fetchTickerData(ticker, metricX, metricY, startDate, endDate)
      )
    )
    
    // Sort results alphabetically by ticker
    results.sort((a, b) => a.ticker.localeCompare(b.ticker))
    
    const response: CompareResponse = {
      success: true,
      metricX,
      metricY,
      results
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        metricX: '',
        metricY: '',
        results: []
      },
      { status: 500 }
    )
  }
}
