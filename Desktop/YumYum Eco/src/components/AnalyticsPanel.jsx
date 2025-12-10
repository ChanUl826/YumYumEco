import React, { useMemo, useRef, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { CONFIG } from '../config'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const CHART_UPDATE_THROTTLE = 500

export default function AnalyticsPanel({ graphData, isOpen, onClose }) {
  const [throttledGraphData, setThrottledGraphData] = useState(graphData)
  const lastChartUpdateRef = useRef(Date.now())
  const pendingUpdateRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const now = Date.now()
    const timeSinceLastUpdate = now - lastChartUpdateRef.current

    if (timeSinceLastUpdate >= CHART_UPDATE_THROTTLE) {

      lastChartUpdateRef.current = now
      setThrottledGraphData(graphData)
    } else {

      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current)
      }
      pendingUpdateRef.current = setTimeout(() => {
        setThrottledGraphData(graphData)
        lastChartUpdateRef.current = Date.now()
        pendingUpdateRef.current = null
      }, CHART_UPDATE_THROTTLE - timeSinceLastUpdate)
    }

    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current)
      }
    }
  }, [graphData, isOpen])

  const populationData = useMemo(() => {
    if (!isOpen || !throttledGraphData || throttledGraphData.length === 0) return null

    const labels = throttledGraphData.map((_, index) => index)
    const grassData = throttledGraphData.map(d => d.counts[0])
    const bugData = throttledGraphData.map(d => d.counts[1])
    const frogData = throttledGraphData.map(d => d.counts[2])
    const snakeData = throttledGraphData.map(d => d.counts[3])
    const eagleData = throttledGraphData.map(d => d.counts[4])

    return {
      labels,
      datasets: [
        {
          label: '🌱 풀',
          data: grassData,
          borderColor: CONFIG.TYPE_PROPERTIES[0].color || '#4CAF50',
          backgroundColor: (CONFIG.TYPE_PROPERTIES[0].color || '#4CAF50') + '40',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3
        },
        {
          label: '🐛 벌레',
          data: bugData,
          borderColor: CONFIG.TYPE_PROPERTIES[1].color || '#8BC34A',
          backgroundColor: (CONFIG.TYPE_PROPERTIES[1].color || '#8BC34A') + '40',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3
        },
        {
          label: '🐸 개구리',
          data: frogData,
          borderColor: CONFIG.TYPE_PROPERTIES[2].color || '#4CAF50',
          backgroundColor: (CONFIG.TYPE_PROPERTIES[2].color || '#4CAF50') + '40',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3
        },
        {
          label: '🐍 뱀',
          data: snakeData,
          borderColor: CONFIG.TYPE_PROPERTIES[3].color || '#795548',
          backgroundColor: (CONFIG.TYPE_PROPERTIES[3].color || '#795548') + '40',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3
        },
        {
          label: '🦅 독수리',
          data: eagleData,
          borderColor: CONFIG.TYPE_PROPERTIES[4].color || '#607D8B',
          backgroundColor: (CONFIG.TYPE_PROPERTIES[4].color || '#607D8B') + '40',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3
        }
      ]
    }
  }, [throttledGraphData, isOpen])

  const energyData = useMemo(() => {
    if (!isOpen || !throttledGraphData || throttledGraphData.length === 0) return null

    const labels = throttledGraphData.map((_, index) => index)
    const energyData = throttledGraphData.map(d => d.averageEnergy)

    return {
      labels,
      datasets: [
        {
          label: '⚡ 평균 에너지',
          data: energyData,
          borderColor: '#FFD700',
          backgroundColor: '#FFD70040',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3
        }
      ]
    }
  }, [throttledGraphData, isOpen])

  const reproductionData = useMemo(() => {
    if (!isOpen || !throttledGraphData || throttledGraphData.length === 0) return null

    const labels = throttledGraphData.map((_, index) => index)
    const reproductionData = throttledGraphData.map(d => d.totalReproductions)

    return {
      labels,
      datasets: [
        {
          label: '❤️ 총 번식 횟수',
          data: reproductionData,
          borderColor: '#FF6B9D',
          backgroundColor: '#FF6B9D40',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3
        }
      ]
    }
  }, [throttledGraphData, isOpen])

  if (!isOpen) return null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 13,
            weight: '600',
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          color: '#333',
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 6
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
          lineWidth: 1,
          drawBorder: true,
          borderColor: 'rgba(0, 0, 0, 0.2)'
        },
        ticks: {
          font: {
            size: 11,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          color: '#666',
          padding: 8
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
          lineWidth: 1,
          drawBorder: true,
          borderColor: 'rgba(0, 0, 0, 0.2)'
        },
        ticks: {
          font: {
            size: 11,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          color: '#666',
          padding: 8
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
        hoverBorderWidth: 2,
        borderWidth: 2
      },
      line: {
        borderWidth: 3,
        tension: 0.4,
        fill: true
      }
    }
  }

  return (
    <div className="analytics-panel">
      <div className="analytics-header">
        <h3>📊 생태계 분석</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="analytics-content">
        {populationData && (
          <div className="chart-container">
            <h4>개체 수 변화</h4>
            <Line data={populationData} options={chartOptions} />
          </div>
        )}

        {energyData && (
          <div className="chart-container">
            <h4>평균 에너지 변화</h4>
            <Line data={energyData} options={chartOptions} />
          </div>
        )}

        {reproductionData && (
          <div className="chart-container">
            <h4>총 번식 횟수</h4>
            <Line data={reproductionData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  )
}
