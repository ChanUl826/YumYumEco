import React, { useRef, useEffect, useCallback } from 'react'
import { CONFIG } from '../config'

export default function EntityCanvas({ 
  entitiesRef: externalEntitiesRef,
  camera, 
  canvasSize,
  onEntityClick,
  selectedEntityId,
  watchedEntityIds,
  gameMode = 'ECO'
}) {
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const cameraRef = useRef(camera)
  const selectedEntityIdRef = useRef(selectedEntityId)
  const watchedEntityIdsRef = useRef(watchedEntityIds)
  const gameModeRef = useRef(gameMode)

  useEffect(() => {
    cameraRef.current = camera
    selectedEntityIdRef.current = selectedEntityId
    watchedEntityIdsRef.current = watchedEntityIds
    gameModeRef.current = gameMode
  }, [camera, selectedEntityId, watchedEntityIds, gameMode])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true
    })

    const currentEntities = externalEntitiesRef?.current || []
    const currentCamera = cameraRef.current
    const currentSelectedId = selectedEntityIdRef.current
    const currentWatchedIds = watchedEntityIdsRef.current
    const currentGameMode = gameModeRef.current

    ctx.imageSmoothingEnabled = false

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(currentCamera.x, currentCamera.y)

    currentEntities.forEach(entity => {
      if (entity.removing) return

      const x = entity.x
      const y = entity.y
      const size = entity.size
      const energyPercent = (entity.energy / entity.maxEnergy) * 100

      const opacity = 1.0

      const isSelected = currentSelectedId === entity.id
      const isWatched = currentWatchedIds.includes(entity.id)

      if (isSelected || isWatched || entity.invincible) {
        ctx.beginPath()
        ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2)
        if (entity.invincible) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.lineWidth = 3
        } else if (isSelected) {
          ctx.strokeStyle = '#4CAF50'
          ctx.lineWidth = 3
          ctx.shadowBlur = 10
          ctx.shadowColor = '#4CAF50'
        } else if (isWatched) {
          ctx.strokeStyle = '#2196F3'
          ctx.lineWidth = 2
          ctx.shadowBlur = 8
          ctx.shadowColor = '#2196F3'
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      ctx.save()
      ctx.globalAlpha = opacity

      const scale = entity.eating ? 1.3 : entity.reproducing ? 1.2 : 1
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      const fontSize = Math.max(32, Math.min(72, size * 1.2))

      ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      ctx.fillStyle = '#000000'
      ctx.fillText(CONFIG.VISUALS.EMOJIS[entity.type], 0, 0)

      ctx.restore()

      if (entity.type !== CONFIG.TYPES.GRASS && currentGameMode === 'ECO') {
        const barY = y + size / 2 + 8
        const barWidth = size
        const barHeight = 3

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight)

        const energyWidth = (barWidth * energyPercent) / 100
        ctx.fillStyle = energyPercent > 70 ? '#4CAF50' : energyPercent > 30 ? '#FFC107' : '#F44336'
        ctx.fillRect(x - barWidth / 2, barY, energyWidth, barHeight)
      }
    })

    ctx.restore()

    animationFrameRef.current = requestAnimationFrame(render)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr

    canvas.style.width = canvasSize.width + 'px'
    canvas.style.height = canvasSize.height + 'px'

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false
    })

    if (ctx) {

      ctx.scale(dpr, dpr)

      ctx.imageSmoothingEnabled = false
    }

    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [canvasSize, render])

  const handleCanvasClick = useCallback((event) => {
    const canvas = canvasRef.current
    if (!canvas || !onEntityClick) return

    const rect = canvas.getBoundingClientRect()

    const clickX = event.clientX - rect.left - camera.x
    const clickY = event.clientY - rect.top - camera.y

    let closestEntity = null
    let closestDistSquared = Infinity

    const currentEntities = externalEntitiesRef?.current || []
    currentEntities.forEach(entity => {
      if (entity.removing) return

      const dx = entity.x - clickX
      const dy = entity.y - clickY
      const distSquared = dx * dx + dy * dy
      const radiusSquared = (entity.size / 2) * (entity.size / 2)

      if (distSquared < radiusSquared && distSquared < closestDistSquared) {
        closestDistSquared = distSquared
        closestEntity = entity
      }
    })

    if (closestEntity) {
      onEntityClick(closestEntity)
    }
  }, [externalEntitiesRef, camera, onEntityClick])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 1
      }}
    />
  )
}
