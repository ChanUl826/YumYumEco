import React from 'react'
import { CONFIG } from '../config'

function StatsBox({ stats }) {
  const types = [
    { type: CONFIG.TYPES.GRASS, name: '풀', emoji: '🌱', color: '#4CAF50' },
    { type: CONFIG.TYPES.BUG, name: '벌레', emoji: '🐛', color: '#8BC34A' },
    { type: CONFIG.TYPES.FROG, name: '개구리', emoji: '🐸', color: '#4CAF50' },
    { type: CONFIG.TYPES.SNAKE, name: '뱀', emoji: '🐍', color: '#795548' },
    { type: CONFIG.TYPES.EAGLE, name: '독수리', emoji: '🦅', color: '#607D8B' }
  ]

  const totalCount = stats.counts?.reduce((sum, count) => sum + count, 0) || 0

  return (
    <div id="stats" className="stats-box">
      {types.map(({ type, name, emoji, color }) => {
        const count = stats.counts?.[type] || 0
        const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
        return (
          <div key={type} title={`${name}: ${count}마리 (${percentage}%)`}>
            <div 
              className="type-tag" 
              style={{ backgroundColor: color }}
            >
              <span style={{ fontSize: '14px' }}>{emoji}</span>
            </div>
            <span>{count}</span>
          </div>
        )
      })}
      {stats.averageEnergy !== undefined && (
        <div className="stats-extra" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#aaa' }}>
          <div>평균 에너지: {stats.averageEnergy}</div>
          {stats.totalReproductions !== undefined && (
            <div>총 번식: {stats.totalReproductions}회</div>
          )}
        </div>
      )}
    </div>
  )
}

export default StatsBox
