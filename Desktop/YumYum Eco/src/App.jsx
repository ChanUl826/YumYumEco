import React, { useState, useEffect, useRef, useCallback } from 'react'
import ControlsBar from './components/ControlsBar'
import StatsBox from './components/StatsBox'
import AddControlsBar from './components/AddControlsBar'
import Sidebar from './components/Sidebar'
import EntityCanvas from './components/EntityCanvas'
import TitleScreen from './components/TitleScreen'
import FieldEffect from './components/FieldEffect'
import AnalyticsPanel from './components/AnalyticsPanel'
import EntityInfoModal from './components/EntityInfoModal'
import { CONFIG } from './config'
import { useGameLogic } from './hooks/useGameLogic'
import { useCamera } from './hooks/useCamera'

function App() {
  const containerRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [gameStarted, setGameStarted] = useState(false)

  const {
    entities,
    entitiesRef,
    isRunning,
    selectedType,
    clearMode,
    speedMultiplier,
    stats,
    fps,
    timeScale,
    metabolism,
    growthRate,
    meteorMode,
    autoBalance,
    toggleSimulation,
    resetSimulation,
    toggleSpeed,
    setSpeedMultiplier,
    toggleClearMode,
    selectType,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setTimeScale,
    setMetabolism,
    setGrowthRate,
    setAutoBalance,
    handleRain,
    toggleMeteorMode,
    handleMeteor,
    handlePlague,
    gameMode,
    toggleGameMode,
    fieldEffect,
    minCounts,
    setMinCounts,
    graphData
  } = useGameLogic(containerRef, canvasSize)

  const [selectedEntity, setSelectedEntity] = useState(null)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)

  const {
    camera,
    spectatorMode,
    watchedEntities,
    updateSpectatorMode,
    toggleSpectatorMode,
    clearSpectatorMode
  } = useCamera()

  useEffect(() => {
    if (!spectatorMode || entities.length === 0) {

      updateSpectatorMode([])
      return
    }

    let animationFrameId = null

    const update = () => {
      updateSpectatorMode(entities)
      animationFrameId = requestAnimationFrame(update)
    }

    animationFrameId = requestAnimationFrame(update)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [entities, spectatorMode, updateSpectatorMode])

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleCameraMouseDown = useCallback((event) => {
    handleMouseDown(event)
  }, [handleMouseDown])

  const handleCameraMouseMove = useCallback((event) => {
    handleMouseMove(event)
  }, [handleMouseMove])

  const handleCameraMouseUp = useCallback((event) => {
    handleMouseUp()
  }, [handleMouseUp])

  const handleEntityClick = useCallback((entity) => {
    setSelectedEntity(entity)
    toggleSpectatorMode(entity.id)
  }, [toggleSpectatorMode])

  useEffect(() => {
    if (!containerRef.current || !gameStarted) return

    const handleEntitySelect = (event) => {
      const entity = event.detail.entity
      if (entity) {
        handleEntityClick(entity)
      }
    }

    containerRef.current.addEventListener('entitySelect', handleEntitySelect)

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('entitySelect', handleEntitySelect)
      }
    }
  }, [gameStarted, handleEntityClick])

  if (!gameStarted) {
    return <TitleScreen onStart={() => setGameStarted(true)} />
  }

  return (
    <div 
      ref={containerRef}
      id="simulation-container"
      onMouseDown={handleCameraMouseDown}
      onMouseMove={handleCameraMouseMove}
      onMouseUp={handleCameraMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        position: 'relative', 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden'
      }}
    >
      <ControlsBar
        isRunning={isRunning}
        onToggleSimulation={toggleSimulation}
        onReset={resetSimulation}
      />

      <StatsBox stats={stats} />

      <AddControlsBar
        selectedType={selectedType}
        clearMode={clearMode}
        gameMode={gameMode}
        onSelectType={selectType}
        onToggleClearMode={toggleClearMode}
      />

      <Sidebar
        timeScale={timeScale}
        speedMultiplier={speedMultiplier}
        metabolism={metabolism}
        growthRate={growthRate}
        autoBalance={autoBalance}
        gameMode={gameMode}
        minCounts={minCounts}
        onTimeScaleChange={setTimeScale}
        onSpeedChange={setSpeedMultiplier}
        onMetabolismChange={setMetabolism}
        onGrowthRateChange={setGrowthRate}
        onAutoBalanceChange={setAutoBalance}
        onRain={handleRain}
        onMeteorToggle={toggleMeteorMode}
        meteorMode={meteorMode}
        onPlague={handlePlague}
        onToggleGameMode={toggleGameMode}
        onMinCountChange={setMinCounts}
        onReset={resetSimulation}
      />

      <EntityCanvas
        entitiesRef={entitiesRef}
        camera={camera}
        canvasSize={canvasSize}
        onEntityClick={handleEntityClick}
        selectedEntityId={selectedEntity?.id || null}
        watchedEntityIds={watchedEntities}
        gameMode={gameMode}
      />

      <button
        onClick={() => setAnalyticsOpen(!analyticsOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 1000,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        📊 분석 패널
      </button>

      <AnalyticsPanel 
        graphData={graphData}
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />

      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1000,
        fontFamily: 'monospace'
      }}>
        FPS: {fps}
      </div>

      {spectatorMode && (
        <div style={{
          position: 'fixed',
          top: '50px',
          right: '10px',
          backgroundColor: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          zIndex: 1000,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          minWidth: '200px'
        }}>
          <span style={{ fontSize: '16px' }}>👁️</span>
          <span style={{ flex: 1 }}>
            관찰 모드 ({watchedEntities.length}개체)
          </span>
          <button
            onClick={clearSpectatorMode}
            style={{
              padding: '6px 14px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
          >
            종료
          </button>
        </div>
      )}

      <EntityInfoModal
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        gameMode={gameMode}
      />

      <FieldEffect effect={fieldEffect} />
    </div>
  )
}

export default App
