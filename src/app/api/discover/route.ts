import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateCorrelation } from '@/lib/correlation'
import { VALID_METRICS } from '@/types/query'

interface DiscoveryResult {
  metric: string
  correlation: number
  dataPoints: number
  strength: 'strong' | 'moderate' | 'weak'
}

interface TopResultData {
  metric: string
  correlation: number
  data: Array<{ date: string; x: number; y: number }>
}

interface DiscoverResponse {
  success: boolean
  ticker: string
  results: DiscoveryResult[]
  topResult: TopResultData
  error?: string
}

function getCorrelationStrength(r: number): 'strong' | 'moderate' | 'weak' {
  const abs = Math.abs(r)
  if (abs >= 0.7) return 'strong'
  if (abs >= 0.4) return 'moderate'
  return 'weak'
}

async function calculateMetricCorrelation(
  ticker: string,
  metric: string,
  startDate?: string,
  endDate?: string
): Promise<DiscoveryResult | null> {
  try {
    let query = supabase
      .from('stock_metrics')
      .select(`date, ${metric}, price`)
      .eq('ticker', ticker)
      .order('date', { ascending: true })
    
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    
    const { data, error } = await query
    
    if (error || !data || data.length === 0) {
      return null
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validData = data.filter((row: any) => 
      row[metric] !== null && row.price !== null
    )
    
    if (validData.length < 2) {
      return null
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metricValues = validData.map((row: any) => Number(row[metric]))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priceValues = validData.map((row: any) => Number(row.price))
    
    const correlation = calculateCorrelation(metricValues, priceValues)
    
    return {
      metric,
      correlation: Number(correlation.toFixed(4)),
      dataPoints: validData.length,
      strength: getCorrelationStrength(correlation)
    }
  } catch (error) {
    console.error(`Error calculating correlation for ${metric}:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticker, startDate, endDate } = body
    
    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'ticker is required' },
        { status: 400 }
      )
    }
    
    const metricsToTest = VALID_METRICS.filter(m => m !== 'price')
    
    const correlationPromises = metricsToTest.map(metric => 
      calculateMetricCorrelation(ticker, metric, startDate, endDate)
    )
    
    const correlationResults = await Promise.all(correlationPromises)
    
    const validResults = correlationResults.filter(
      (result): result is DiscoveryResult => result !== null
    )
    
    if (validResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid correlations found' },
        { status: 404 }
      )
    }
    
    validResults.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    
    const topMetric = validResults[0].metric
    let query = supabase
      .from('stock_metrics')
      .select(`date, ${topMetric}, price`)
      .eq('ticker', ticker)
      .order('date', { ascending: true })
    
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    
    const { data: topData } = await query
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topResultData = topData
      ?.filter((row: any) => row[topMetric] !== null && row.price !== null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => ({
        date: row.date as string,
        x: Number(row[topMetric]),
        y: Number(row.price)
      })) || []
    
    const response: DiscoverResponse = {
      success: true,
      ticker,
      results: validResults,
      topResult: {
        metric: topMetric,
        correlation: validResults[0].correlation,
        data: topResultData
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        ticker: '',
        results: [],
        topResult: { metric: '', correlation: 0, data: [] }
      },
      { status: 500 }
    )
  }
}
