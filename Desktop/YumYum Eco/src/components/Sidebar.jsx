import React, { useState } from 'react'

function Sidebar({
  timeScale,
  speedMultiplier,
  metabolism,
  growthRate,
  autoBalance,
  gameMode,
  minCounts,
  onTimeScaleChange,
  onSpeedChange,
  onMetabolismChange,
  onGrowthRateChange,
  onAutoBalanceChange,
  onRain,
  onMeteorToggle,
  meteorMode,
  onPlague,
  onToggleGameMode,
  onMinCountChange,
  onReset
}) {
  const [collapsed, setCollapsed] = useState(false)

  const growthRateLabels = ['낮음', '보통', '높음', '매우 높음']
  const growthRateLabel = growthRateLabels[Math.floor(growthRate / 0.5)] || '보통'

  return (
    <>

      {collapsed && (
        <div className="sidebar-toggle-floating">
          <button 
            className="sidebar-toggle"
            onClick={() => setCollapsed(false)}
            aria-label="사이드바 열기"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      )}

      <div id="sidebar" className={`sidebar-panel ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h3>⚡ 신의 권능</h3>
          <button 
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="사이드바 닫기"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        </div>

      <div className="sidebar-content">

        <div className="control-group mode-switch-group">
          <h4>🎮 게임 모드</h4>
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${gameMode === 'ECO' ? 'active' : ''}`}
              onClick={() => gameMode !== 'ECO' && onToggleGameMode()}
            >
              🌱 생태계
            </button>
            <button 
              className={`mode-btn ${gameMode === 'RPS' ? 'active' : ''}`}
              onClick={() => gameMode !== 'RPS' && onToggleGameMode()}
            >
              ♻️ 꼬리잡기
            </button>
          </div>
          <p className="control-hint">
            {gameMode === 'ECO' 
              ? '5단계 먹이사슬 생태계 시뮬레이션' 
              : '독수리→뱀→개구리→독수리 순환 전투'}
          </p>
        </div>

        <div className="control-group">
          <h4>🎚️ 환경 변수</h4>

          <div className="slider-control">
            <label>
              <span>시뮬레이션 속도</span>
              <span id="speedValue">×{speedMultiplier.toFixed(2)}</span>
            </label>
            <input 
              type="range" 
              id="speedSlider" 
              min="0.25" 
              max="16" 
              step="0.25" 
              value={speedMultiplier}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            />
          </div>

          <div className="slider-control">
            <label>
              <span>배고픔 속도</span>
              <span id="metabolismValue">{metabolism.toFixed(1)}</span>
            </label>
            <input 
              type="range" 
              id="metabolismSlider" 
              min="0" 
              max="2.0" 
              step="0.1" 
              value={metabolism}
              onChange={(e) => onMetabolismChange(parseFloat(e.target.value))}
            />
          </div>

          <div className="slider-control">
            <label>
              <span>식물 성장률</span>
              <span id="growthRateValue">{growthRateLabel}</span>
            </label>
            <input 
              type="range" 
              id="growthRateSlider" 
              min="0" 
              max="2" 
              step="0.5" 
              value={growthRate}
              onChange={(e) => onGrowthRateChange(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="control-group">
          <h4>🔄 자동 설정</h4>

          <div className="checkbox-control">
            <label>
              <input 
                type="checkbox" 
                checked={autoBalance}
                onChange={(e) => onAutoBalanceChange(e.target.checked)}
                disabled={gameMode === 'RPS'}
              />
              <span>생태계 자동 복구</span>
              {gameMode === 'RPS' && <span style={{ color: '#999', fontSize: '11px', marginLeft: '8px' }}>(꼬리잡기 모드에서는 비활성화)</span>}
            </label>
            <p className="control-hint">
              {gameMode === 'RPS' ? '꼬리잡기 모드에서는 자동 복구가 비활성화됩니다' : '멸종 위기 동물을 자동으로 생성합니다'}
            </p>
          </div>

          {autoBalance && (
            <div className="min-counts-controls">
              <h5 style={{ margin: '12px 0 8px 0', fontSize: '13px', color: '#666' }}>
                최소 개체 수 설정
              </h5>

              {['🌱 풀', '🐛 벌레', '🐸 개구리', '🐍 뱀', '🦅 독수리'].map((name, index) => (
                <div key={index} className="slider-control" style={{ marginBottom: '12px' }}>
                  <label>
                    <span>{name}</span>
                    <span className="min-count-value">{minCounts[index]}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={minCounts[index]}
                    onChange={(e) => {
                      const newCounts = [...minCounts]
                      newCounts[index] = parseInt(e.target.value)
                      onMinCountChange(newCounts)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="control-group">
          <h4>⚡ 액션 버튼</h4>

          <button 
            id="rainBtn" 
            className="action-btn rain-btn"
            onClick={onRain}
          >
            <i className="fa-solid fa-cloud-rain"></i>
            <span>단비</span>
          </button>

          <button 
            id="meteorBtn" 
            className={`action-btn meteor-btn ${meteorMode ? 'active' : ''}`}
            onClick={onMeteorToggle}
          >
            <i className="fa-solid fa-meteor"></i>
            <span>메테오</span>
          </button>

          <button 
            id="plagueBtn" 
            className="action-btn plague-btn"
            onClick={onPlague}
          >
            <i className="fa-solid fa-virus"></i>
            <span>전염병</span>
          </button>
        </div>

        <div className="control-group">
          <h4>🔄 초기화</h4>
          <button 
            id="resetBtn" 
            className="action-btn reset-btn"
            onClick={onReset}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            <i className="fa-solid fa-rotate-right" style={{ marginRight: '8px' }}></i>
            <span>시뮬레이션 초기화</span>
          </button>
          <p className="control-hint" style={{ marginTop: '8px', fontSize: '12px' }}>
            모든 엔티티를 제거하고 초기 상태로 되돌립니다
          </p>
        </div>
      </div>
      </div>
    </>
  )
}

export default Sidebar
