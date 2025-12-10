import React from 'react'
import { CONFIG } from '../config'

function AddControlsBar({ selectedType, clearMode, gameMode, onSelectType, onToggleClearMode }) {

  const allTypes = [
    { type: CONFIG.TYPES.GRASS, emoji: '🌱', name: '풀', color: '#4CAF50' },
    { type: CONFIG.TYPES.BUG, emoji: '🐛', name: '벌레', color: '#8BC34A' },
    { type: CONFIG.TYPES.FROG, emoji: '🐸', name: '개구리', color: '#4CAF50' },
    { type: CONFIG.TYPES.SNAKE, emoji: '🐍', name: '뱀', color: '#795548' },
    { type: CONFIG.TYPES.EAGLE, emoji: '🦅', name: '독수리', color: '#607D8B' }
  ]

  const types = gameMode === 'RPS' 
    ? allTypes.filter(t => 
        t.type === CONFIG.TYPES.FROG || 
        t.type === CONFIG.TYPES.SNAKE || 
        t.type === CONFIG.TYPES.EAGLE
      )
    : allTypes

  return (
    <div id="add-controls" className="add-controls-bar">
      {types.map(({ type, emoji, name, color }) => (
        <button
          key={type}
          className={`type-btn ${selectedType === type && !clearMode ? 'active' : ''}`}
          onClick={() => onSelectType(type)}
          style={{ 
            backgroundColor: selectedType === type && !clearMode ? color : '#33333399',
            fontSize: '24px'
          }}
          title={name}
        >
          {emoji}
        </button>
      ))}
      <button
        id="clearModeBtn"
        className={`type-btn ${clearMode ? 'active' : ''}`}
        onClick={onToggleClearMode}
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  )
}

export default AddControlsBar
