import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera() {
  const [camera, setCamera] = useState({
    x: 0,
    y: 0
  })

  const [spectatorMode, setSpectatorMode] = useState(false)
  const [watchedEntities, setWatchedEntities] = useState([])

  const lastCameraUpdateRef = useRef(0)
  const pendingCameraUpdateRef = useRef(null)
  const CAMERA_UPDATE_THROTTLE = 16

  const updateSpectatorMode = useCallback((entities) => {
    if (!spectatorMode || watchedEntities.length === 0) {

      const now = Date.now()
      if (now - lastCameraUpdateRef.current >= CAMERA_UPDATE_THROTTLE) {
        lastCameraUpdateRef.current = now
        setCamera(prev => {

          if (prev.x === 0 && prev.y === 0) return prev
          return { x: 0, y: 0 }
        })
      } else {

        if (!pendingCameraUpdateRef.current) {
          pendingCameraUpdateRef.current = setTimeout(() => {
            setCamera(prev => {
              if (prev.x === 0 && prev.y === 0) return prev
              return { x: 0, y: 0 }
            })
            lastCameraUpdateRef.current = Date.now()
            pendingCameraUpdateRef.current = null
          }, CAMERA_UPDATE_THROTTLE - (now - lastCameraUpdateRef.current))
        }
      }
      return
    }

    const watched = entities.filter(e => watchedEntities.includes(e.id))
    if (watched.length === 0) return

    const avgX = watched.reduce((sum, e) => sum + e.x, 0) / watched.length
    const avgY = watched.reduce((sum, e) => sum + e.y, 0) / watched.length

    const targetX = -avgX + window.innerWidth / 2
    const targetY = -avgY + window.innerHeight / 2

    const now = Date.now()
    if (now - lastCameraUpdateRef.current >= CAMERA_UPDATE_THROTTLE) {
      lastCameraUpdateRef.current = now

      setCamera(prev => {

        const dx = targetX - prev.x
        const dy = targetY - prev.y
        const distSquared = dx * dx + dy * dy

        if (distSquared < 1) {
          return { x: targetX, y: targetY }
        }

        return {
          x: prev.x * 0.8 + targetX * 0.2,
          y: prev.y * 0.8 + targetY * 0.2
        }
      })
    } else {

      if (!pendingCameraUpdateRef.current) {
        const delay = CAMERA_UPDATE_THROTTLE - (now - lastCameraUpdateRef.current)
        pendingCameraUpdateRef.current = setTimeout(() => {
          setCamera(prev => {
            const dx = targetX - prev.x
            const dy = targetY - prev.y
            const distSquared = dx * dx + dy * dy

            if (distSquared < 1) {
              return { x: targetX, y: targetY }
            }

            return {
              x: prev.x * 0.8 + targetX * 0.2,
              y: prev.y * 0.8 + targetY * 0.2
            }
          })
          lastCameraUpdateRef.current = Date.now()
          pendingCameraUpdateRef.current = null
        }, delay)
      }
    }
  }, [spectatorMode, watchedEntities])

  const toggleSpectatorMode = useCallback((entityId) => {
    setWatchedEntities(prev => {
      if (prev.includes(entityId)) {
        const newList = prev.filter(id => id !== entityId)
        if (newList.length === 0) {
          setSpectatorMode(false)
        }
        return newList
      } else {
        setSpectatorMode(true)
        return [...prev, entityId]
      }
    })
  }, [])

  const clearSpectatorMode = useCallback(() => {
    setSpectatorMode(false)
    setWatchedEntities([])

    const now = Date.now()
    if (now - lastCameraUpdateRef.current >= CAMERA_UPDATE_THROTTLE) {
      lastCameraUpdateRef.current = now
      setCamera({ x: 0, y: 0 })
    } else {
      if (pendingCameraUpdateRef.current) {
        clearTimeout(pendingCameraUpdateRef.current)
      }
      pendingCameraUpdateRef.current = setTimeout(() => {
        setCamera({ x: 0, y: 0 })
        lastCameraUpdateRef.current = Date.now()
        pendingCameraUpdateRef.current = null
      }, CAMERA_UPDATE_THROTTLE - (now - lastCameraUpdateRef.current))
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pendingCameraUpdateRef.current) {
        clearTimeout(pendingCameraUpdateRef.current)
        pendingCameraUpdateRef.current = null
      }
    }
  }, [])

  return {
    camera,
    spectatorMode,
    watchedEntities,
    updateSpectatorMode,
    toggleSpectatorMode,
    clearSpectatorMode
  }
}
