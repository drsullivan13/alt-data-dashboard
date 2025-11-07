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

export default function CorrelationChart() {
  const [data, setData] = useState<CorrelationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch('/api/correlation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: 'AAPL',
            metricX: 'job_posts',
            metricY: 'price',
            startDate: '2024-01-01'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch correlation data')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading correlation analysis...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!data) {
    return null
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
      <div className="h-96">
        <Scatter data={chartData} options={options} />
      </div>
    </div>
  )
}