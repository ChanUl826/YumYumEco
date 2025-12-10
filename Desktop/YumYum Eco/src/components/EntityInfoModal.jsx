import React from 'react'
import { createPortal } from 'react-dom'
import { CONFIG } from '../config'

export default function EntityInfoModal({ entity, onClose, gameMode = 'ECO' }) {
  if (!entity) return null

  const handleBackdropClick = (e) => {

    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <>

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 1999,
          cursor: 'pointer'
        }}
        onClick={handleBackdropClick}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          padding: '20px',
          borderRadius: '12px',
          zIndex: 2000,
          minWidth: '250px',
          border: '2px solid #4CAF50',
          cursor: 'default'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            {CONFIG.VISUALS.EMOJIS[entity.type]} {CONFIG.VISUALS.NAMES[entity.type]}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            ×
          </button>
        </div>
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          {gameMode === 'ECO' && (
            <div>에너지: {Math.round(entity.energy)}/{entity.maxEnergy} ({Math.round((entity.energy / entity.maxEnergy) * 100)}%)</div>
          )}
          <div>나이: {Math.round((Date.now() - entity.createdAt) / 1000)}초</div>
          {gameMode === 'ECO' && (
            <div>번식 횟수: {entity.reproductionCount || 0}회</div>
          )}
          <div>크기: {entity.size}px</div>
          <div>속도: {CONFIG.TYPE_PROPERTIES[entity.type]?.speed || 0}</div>
          <div>시야 범위: {entity.sightRange || CONFIG.ENTITY.SIGHT_RANGE}px</div>
          {entity.target && (
            <div>타겟: {CONFIG.VISUALS.EMOJIS[entity.target.type]} {CONFIG.VISUALS.NAMES[entity.target.type]}</div>
          )}
          {entity.invincible && (
            <div style={{ color: '#4CAF50' }}>🛡️ 무적 상태</div>
          )}
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}
