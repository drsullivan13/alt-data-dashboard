// app/api/correlation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateCorrelation } from '@/lib/correlation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticker, metricX, metricY, startDate, endDate } = body
    
    // Validate inputs
    if (!ticker || !metricX || !metricY) {
      return NextResponse.json(
        { error: 'Missing required fields: ticker, metricX, metricY' },
        { status: 400 }
      )
    }
    
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
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      )
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified parameters' },
        { status: 404 }
      )
    }
    
    // Filter out null values and prepare data for correlation
    const validData = data.filter(row => 
      row[metricX] !== null && row[metricY] !== null
    )
    
    if (validData.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient data points for correlation analysis' },
        { status: 400 }
      )
    }
    
    const xValues = validData.map(row => Number(row[metricX]))
    const yValues = validData.map(row => Number(row[metricY]))
    
    // Calculate correlation
    const correlation = calculateCorrelation(xValues, yValues)
    
    // Prepare chart data
    const chartData = validData.map((row: any) => ({
      date: row.date,
      x: Number(row[metricX]),
      y: Number(row[metricY])
    }))
    
    return NextResponse.json({
      success: true,
      ticker,
      metricX,
      metricY,
      correlation: Number(correlation.toFixed(4)),
      dataPoints: chartData.length,
      data: chartData
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}