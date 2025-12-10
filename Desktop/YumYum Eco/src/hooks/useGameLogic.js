import { useState, useEffect, useRef, useCallback } from 'react'
import { CONFIG } from '../config'

import { 
  buildSpatialGrid, 
  findNearestFood, 
  updateMovement, 
  updateAI
} from './engines/movementEngine'
import { 
  updateGrassGrowth, 
  updateEnergyDecay
} from './engines/energySystem'
import { 
  checkReproductionCondition, 
  handleReproduction as handleReproductionEngine 
} from './engines/reproductionSystem'
import { 
  processCollisions, 
  processEatingEvents 
} from './engines/foodChainSystem'
import { 
  findSafeSpawnPosition, 
  spawnGrass, 
  processAutoBalance 
} from './engines/cleanupSystem'

let entityIdCounter = 0

export function useGameLogic(containerRef, canvasSize) {
  const [entities, setEntities] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedType, setSelectedType] = useState(CONFIG.TYPES.GRASS)
  const [clearMode, setClearMode] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [stats, setStats] = useState({
    counts: [0, 0, 0, 0, 0],
    totalEntities: 0,
    averageEnergy: 0,
    totalReproductions: 0
  })

  const totalReproductionsRef = useRef(0)

  const [fps, setFps] = useState(0)
  const lastFpsUpdateRef = useRef(Date.now())

  const [timeScale, setTimeScale] = useState(1.0)
  const [metabolism, setMetabolism] = useState(1.0)
  const [growthRate, setGrowthRate] = useState(1.0)
  const [meteorMode, setMeteorMode] = useState(false)
  const [autoBalance, setAutoBalance] = useState(CONFIG.AUTO_BALANCE.ENABLED)

  const [minCounts, setMinCounts] = useState([...CONFIG.AUTO_BALANCE.MIN_COUNTS])

  const [gameMode, setGameMode] = useState('ECO')

  const [fieldEffect, setFieldEffect] = useState(null)

  const [graphData, setGraphData] = useState([])
  const graphDataRef = useRef([])
  const statsRef = useRef(stats)
  const GRAPH_UPDATE_INTERVAL = 200

  useEffect(() => {
    statsRef.current = stats
  }, [stats])

  const fpsFrameCountRef = useRef(0)

  const nextFrameAdditionsRef = useRef([])

  const lastBalanceCheckRef = useRef(Date.now())
  const lastReproductionCheckRef = useRef(Date.now())
  const reproductionsThisSecondRef = useRef(0)

  const grassSpawnRef = useRef({
    lastAutoSpawn: Date.now(),
    lastBalanceSpawn: Date.now(),
    lastCount: 0
  })

  const lastMeteorTimeRef = useRef(0)

  const fieldEffectTimerRef = useRef(null)

  const speedOptions = [0.25, 0.5, 1, 1.5, 2, 4, 8, 16]
  const currentSpeedIndexRef = useRef(2)
  const animationStateRef = useRef(1)
  const targetAnimationStateRef = useRef(1)
  const transitionSpeed = 0.05
  const isMouseDownRef = useRef(false)
  const lastAddTimeRef = useRef(0)
  const entitiesRef = useRef([])
  const animationFrameRef = useRef(null)

  useEffect(() => {
    entitiesRef.current = entities
  }, [entities])

  const frameCountRef = useRef(0)
  const UI_UPDATE_INTERVAL = 10

  const createEntity = useCallback((type, x, y) => {
    const props = CONFIG.TYPE_PROPERTIES[type]
    const angle = Math.random() * Math.PI * 2
    const speed = props.speed || CONFIG.ENTITY.SPEED
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed

    const variance = 0.9 + Math.random() * 0.2
    const energyDecayRate = props.energyDecay ? props.energyDecay * variance : null

    return {
      id: entityIdCounter++,
      type,
      x,
      y,
      vx,
      vy,
      energy: type === CONFIG.TYPES.GRASS 
        ? props.maxEnergy 
        : CONFIG.ENTITY.INITIAL_ENERGY,
      maxEnergy: props.maxEnergy || CONFIG.ENTITY.MAX_ENERGY,
      size: props.size || CONFIG.ENTITY.SIZE,
      sightRange: props.sightRange || CONFIG.ENTITY.SIGHT_RANGE,
      energyDecayRate: energyDecayRate,
      invincible: true,
      createdAt: Date.now(),
      removing: false,
      target: null,
      lastReproduction: Date.now(),
      lastEatTime: 0,
      eatingUntil: 0,
      reproductionCount: 0,
      reproducingUntil: 0
    }
  }, [])

  const updateStats = useCallback((entitiesList) => {
    const counts = [0, 0, 0, 0, 0]
    let totalEnergy = 0
    let energyCount = 0

    for (const entity of entitiesList) {
      if (!entity.removing) {
        counts[entity.type]++
        if (entity.type !== CONFIG.TYPES.GRASS) {
          totalEnergy += entity.energy
          energyCount++
        }
      }
    }

    const totalEntities = counts.reduce((sum, count) => sum + count, 0)
    const averageEnergy = energyCount > 0 ? Math.round(totalEnergy / energyCount) : 0

    const newStats = { 
      counts,
      totalEntities,
      averageEnergy,
      totalReproductions: totalReproductionsRef.current
    }
    setStats(newStats)

  }, [])

  useEffect(() => {
    if (!isRunning) return

    const intervalId = setInterval(() => {
      const currentTime = Date.now()

      graphDataRef.current.push({
        ...statsRef.current,
        timestamp: currentTime
      })

      if (graphDataRef.current.length > 100) {
        graphDataRef.current.shift()
      }

      setGraphData([...graphDataRef.current])
    }, GRAPH_UPDATE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [isRunning])

  const findSafeSpawnPositionWrapper = useCallback((entitiesList, spatialGrid, minDistance = 60, maxAttempts = 10, centerX = null, centerY = null) => {
    return findSafeSpawnPosition(entitiesList, spatialGrid, canvasSize, minDistance, maxAttempts, centerX, centerY)
  }, [canvasSize])

  useEffect(() => {
    if (!isRunning && animationFrameRef.current === null) return

    const update = () => {

      fpsFrameCountRef.current++
      const now = Date.now()
      if (now - lastFpsUpdateRef.current >= 1000) {
        setFps(fpsFrameCountRef.current)
        fpsFrameCountRef.current = 0
        lastFpsUpdateRef.current = now
      }

      if (animationStateRef.current !== targetAnimationStateRef.current) {
        if (animationStateRef.current < targetAnimationStateRef.current) {
          animationStateRef.current = Math.min(
            animationStateRef.current + transitionSpeed,
            targetAnimationStateRef.current
          )
        } else {
          animationStateRef.current = Math.max(
            animationStateRef.current - transitionSpeed,
            targetAnimationStateRef.current
          )
        }
      }

      if (animationStateRef.current > 0) {

        const currentTime = Date.now()
        let currentEntities = entitiesRef.current.filter(e => !e.removing)

          let newEntities = currentEntities.map(entity => {

            const eating = entity.eatingUntil ? currentTime < entity.eatingUntil : false
            const reproducing = entity.reproducingUntil ? currentTime < entity.reproducingUntil : false
            const invincibleFromUntil = entity.invincibleUntil ? currentTime < entity.invincibleUntil : false
            const invincibleFromCreated = entity.invincible && (currentTime - entity.createdAt < CONFIG.ENTITY.INVINCIBILITY_TIME)
            const invincible = invincibleFromUntil || invincibleFromCreated

            let updatedEntity = { 
              ...entity,
              eating,
              reproducing,
              invincible
            }

            if (updatedEntity.type === CONFIG.TYPES.GRASS) {
              if (gameMode === 'ECO') {
                updatedEntity = updateGrassGrowth(updatedEntity, currentTime)
              }
            } else {

              updatedEntity = updateEnergyDecay(updatedEntity, speedMultiplier, animationStateRef.current, metabolism, gameMode)

              if (gameMode === 'ECO' && updatedEntity === null) {
                return null
              }

              updatedEntity = updateMovement(updatedEntity, canvasSize, timeScale, animationStateRef.current)
            }

            if (updatedEntity && updatedEntity.type !== CONFIG.TYPES.GRASS && gameMode === 'ECO') {
              if (checkReproductionCondition(updatedEntity, currentTime, gameMode)) {
                updatedEntity.shouldReproduce = true
              }
            }

            return updatedEntity
          }).filter(entity => entity !== null)

          const spatialGrid = buildSpatialGrid(newEntities)

          newEntities = newEntities.map(updatedEntity => {
            if (updatedEntity.type === CONFIG.TYPES.GRASS) {
              return updatedEntity
            }

            const nearestFood = findNearestFood(updatedEntity, spatialGrid, gameMode, newEntities)

            return updateAI(updatedEntity, nearestFood, speedMultiplier, animationStateRef.current, newEntities, spatialGrid, gameMode)
          })

          const reproductionUpdates = new Map()
          let reproductionCount = 0

          const MAX_REPRODUCTIONS_PER_FRAME = 2
          const MAX_REPRODUCTIONS_PER_SECOND = 5
          let reproductionsThisFrame = 0
          
          const currentTimeForRepro = Date.now()
          if (currentTimeForRepro - lastReproductionCheckRef.current >= 1000) {
            lastReproductionCheckRef.current = currentTimeForRepro
            reproductionsThisSecondRef.current = 0
          }

          const candidatesForReproduction = newEntities
            .filter(entity => 
              entity.shouldReproduce && 
              !entity.removing && 
              entity.type !== CONFIG.TYPES.GRASS && 
              gameMode === 'ECO'
            )
            .sort((a, b) => {

              const energyDiff = b.energy - a.energy
              return energyDiff !== 0 ? energyDiff : b.id - a.id
            })

          for (const entity of candidatesForReproduction) {
            if (reproductionsThisFrame >= MAX_REPRODUCTIONS_PER_FRAME || 
                reproductionsThisSecondRef.current >= MAX_REPRODUCTIONS_PER_SECOND) {
              reproductionUpdates.set(entity.id, { ...entity, shouldReproduce: false })
              continue
            }

            const children = handleReproductionEngine(entity, newEntities, spatialGrid, createEntity, canvasSize)
            if (children.length > 1) {
              nextFrameAdditionsRef.current.push(...children.slice(1))
              reproductionCount++
              reproductionsThisFrame++
              reproductionsThisSecondRef.current++
              reproductionUpdates.set(entity.id, { 
                ...children[0], 
                shouldReproduce: false,
                reproductionCount: (children[0].reproductionCount || 0) + 1,
                reproducingUntil: currentTime + 500,
                lastReproduction: currentTime
              })
            } else {
              reproductionUpdates.set(entity.id, { ...entity, shouldReproduce: false })
            }
          }

          for (const entity of newEntities) {
            if (entity.shouldReproduce && !reproductionUpdates.has(entity.id)) {
              reproductionUpdates.set(entity.id, { ...entity, shouldReproduce: false })
            }
          }

          if (nextFrameAdditionsRef.current.length > 0) {
            newEntities.push(...nextFrameAdditionsRef.current)
            nextFrameAdditionsRef.current = []
          }

          const updatedSpatialGrid = buildSpatialGrid(newEntities)

          if (reproductionCount > 0) {
            totalReproductionsRef.current += reproductionCount
          }

          if (reproductionUpdates.size > 0) {
            newEntities = newEntities.map(entity => 
              reproductionUpdates.has(entity.id) ? reproductionUpdates.get(entity.id) : entity
            )
          }

          if (animationStateRef.current > 0.7) {
            const { collisionUpdates, eatingEvents } = processCollisions(newEntities, updatedSpatialGrid, currentTime, gameMode)

            if (collisionUpdates.size > 0) {
              newEntities = newEntities.map(entity => {
                if (collisionUpdates.has(entity.id)) {
                  return collisionUpdates.get(entity.id)
                }
                return entity
              })
            }

            const removedPreyIds = new Set()
            if (eatingEvents.length > 0) {
              const { preyIdsToRemove, collisionUpdates: updatedCollisionUpdates } = processEatingEvents(eatingEvents, newEntities, collisionUpdates, currentTime)

              preyIdsToRemove.forEach(id => removedPreyIds.add(id))

              newEntities = newEntities
                .filter(e => !preyIdsToRemove.has(e.id))
                .map(entity => updatedCollisionUpdates.has(entity.id) ? updatedCollisionUpdates.get(entity.id) : entity)
            }

            if (removedPreyIds.size > 0) {
              newEntities = newEntities.map(entity => {
                if (entity.target && removedPreyIds.has(entity.target.id)) {
                  return {
                    ...entity,
                    target: null
                  }
                }
                return entity
              })
            }
          }

          const finalSpatialGrid = buildSpatialGrid(newEntities)
          newEntities = spawnGrass(
            newEntities, 
            finalSpatialGrid,
            canvasSize, 
            createEntity, 
            findSafeSpawnPosition, 
            currentTime, 
            grassSpawnRef, 
            growthRate, 
            timeScale, 
            autoBalance, 
            gameMode
          )

          const removedEntityIds = new Set()
          let filteredEntities = newEntities.filter(e => {
            if (e.removing) {
              removedEntityIds.add(e.id)
              return false
            }
            return true
          })

          if (removedEntityIds.size > 0) {
            filteredEntities = filteredEntities.map(entity => {
              if (entity.target && removedEntityIds.has(entity.target.id)) {
                return {
                  ...entity,
                  target: null
                }
              }
              return entity
            })
          }

          entitiesRef.current = filteredEntities

          frameCountRef.current++
          if (frameCountRef.current >= UI_UPDATE_INTERVAL) {
            frameCountRef.current = 0
            setEntities([...filteredEntities])
            updateStats(filteredEntities)
          } else {

            updateStats(filteredEntities)
          }
        }

      animationFrameRef.current = requestAnimationFrame(update)
    }

    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(update)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      if (fieldEffectTimerRef.current) {
        clearTimeout(fieldEffectTimerRef.current)
        fieldEffectTimerRef.current = null
      }
    }
  }, [isRunning, speedMultiplier, timeScale, metabolism, growthRate, autoBalance, gameMode, minCounts, canvasSize, createEntity, updateStats, findSafeSpawnPositionWrapper])

  const handleRain = useCallback(() => {

    if (fieldEffectTimerRef.current) {
      clearTimeout(fieldEffectTimerRef.current)
    }

    setFieldEffect('rain')
    fieldEffectTimerRef.current = setTimeout(() => {
      setFieldEffect(null)
      fieldEffectTimerRef.current = null
    }, 2000)

    const spawnType = gameMode === 'RPS' ? CONFIG.TYPES.FROG : CONFIG.TYPES.GRASS
    const spawnCount = gameMode === 'RPS' ? 20 : 50

    const newEntities = [...entitiesRef.current]

    const spatialGrid = buildSpatialGrid(newEntities)
    for (let i = 0; i < spawnCount; i++) {

      const safePos = findSafeSpawnPositionWrapper(newEntities, spatialGrid, 40)
      newEntities.push(createEntity(spawnType, safePos.x, safePos.y))

    }
    entitiesRef.current = newEntities
    updateStats(newEntities)
    setEntities([...newEntities])
  }, [canvasSize, createEntity, updateStats, findSafeSpawnPositionWrapper, gameMode])

  const handleMeteor = useCallback((x, y) => {
    const radius = 100

    lastMeteorTimeRef.current = Date.now()

    if (fieldEffectTimerRef.current) {
      clearTimeout(fieldEffectTimerRef.current)
    }

    setFieldEffect({ type: 'meteor', x, y })
    fieldEffectTimerRef.current = setTimeout(() => {
      setFieldEffect(null)
      fieldEffectTimerRef.current = null
    }, 1000)

    const radiusSquared = radius * radius
    const updated = entitiesRef.current.filter(entity => {
      const dx = entity.x - x
      const dy = entity.y - y
      const distSquared = dx * dx + dy * dy
      return distSquared >= radiusSquared
    })

    entitiesRef.current = updated
    updateStats(updated)
    setEntities([...updated])
  }, [updateStats])

  const handleMouseDown = useCallback((event) => {
    if (event.target.closest('#controls') || 
        event.target.closest('#stats') || 
        event.target.closest('#add-controls') ||
        event.target.closest('#sidebar')) {
      return
    }

    isMouseDownRef.current = true

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const worldX = event.clientX - rect.left
    const worldY = event.clientY - rect.top

    if (meteorMode) {
      handleMeteor(worldX, worldY)
      return
    }

    if (clearMode) {

      const maxDistSquared = CONFIG.ENTITY.SIZE * CONFIG.ENTITY.SIZE
      let closestDistSquared = maxDistSquared
      let closestEntity = null

      entitiesRef.current.forEach(entity => {
        if (entity.removing) return
        const dx = entity.x - worldX
        const dy = entity.y - worldY
        const distSquared = dx * dx + dy * dy

        if (distSquared < closestDistSquared) {
          closestDistSquared = distSquared
          closestEntity = entity
        }
      })

      if (closestEntity && containerRef.current) {
        const selectEvent = new CustomEvent('entitySelect', { detail: { entity: closestEntity } })
        containerRef.current.dispatchEvent(selectEvent)
      }
    } else {
      addEntityAtPosition(selectedType, worldX, worldY)
      lastAddTimeRef.current = Date.now()
    }
  }, [clearMode, selectedType, meteorMode, handleMeteor, containerRef])

  useEffect(() => {
    if (!autoBalance || gameMode !== 'ECO' || !isRunning) return

    const intervalId = setInterval(() => {
      const currentTime = Date.now()

      const meteorCooldown = 2000
      const timeSinceMeteor = currentTime - lastMeteorTimeRef.current
      const isMeteorCooldownActive = timeSinceMeteor < meteorCooldown

      if (isMeteorCooldownActive) return

      const checkIntervalMs = CONFIG.AUTO_BALANCE.CHECK_INTERVAL * (1000 / 60)
      const adjustedIntervalMs = Math.max(100, checkIntervalMs)
      const timeSinceLastCheck = currentTime - lastBalanceCheckRef.current

      if (timeSinceLastCheck >= adjustedIntervalMs) {
        lastBalanceCheckRef.current = currentTime

        const prevEntities = entitiesRef.current

        const spatialGrid = buildSpatialGrid(prevEntities)

        const newEntities = processAutoBalance(
          prevEntities,
          spatialGrid,
          canvasSize,
          minCounts,
          createEntity,
          findSafeSpawnPosition,
          currentTime,
          lastMeteorTimeRef.current
        )

        if (newEntities.length !== prevEntities.length) {
          entitiesRef.current = newEntities
          updateStats(newEntities)
          setEntities([...newEntities])
        }
      }
    }, 2000)

    return () => clearInterval(intervalId)
  }, [autoBalance, gameMode, isRunning, minCounts, createEntity, findSafeSpawnPosition, updateStats, canvasSize])

  const handleMouseMove = useCallback((event) => {
    if (!isMouseDownRef.current) return
    if (!containerRef.current) return

    if (clearMode) {
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const worldX = event.clientX - rect.left
    const worldY = event.clientY - rect.top

    if (Date.now() - lastAddTimeRef.current > CONFIG.SIMULATION.ADD_COOLDOWN) {
      addEntityAtPosition(selectedType, worldX, worldY)
      lastAddTimeRef.current = Date.now()
    }
  }, [clearMode, selectedType, containerRef])

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false
  }, [])

  const addEntityAtPosition = useCallback((type, worldX, worldY) => {

    const prev = entitiesRef.current

    const spatialGrid = buildSpatialGrid(prev)

    const safePos = findSafeSpawnPositionWrapper(prev, spatialGrid, 50, 5, worldX, worldY)

    const newEntity = createEntity(type, safePos.x, safePos.y)
    const updated = [...prev, newEntity]
    entitiesRef.current = updated
    updateStats(updated)
    setEntities([...updated])
  }, [createEntity, updateStats, findSafeSpawnPositionWrapper])

  const toggleSimulation = useCallback(() => {
    targetAnimationStateRef.current = isRunning ? 0 : 1
    setIsRunning(prev => !prev)
  }, [isRunning])

  const toggleSpeed = useCallback(() => {
    currentSpeedIndexRef.current = (currentSpeedIndexRef.current + 1) % speedOptions.length
    setSpeedMultiplier(speedOptions[currentSpeedIndexRef.current])
  }, [speedOptions])

  const setSpeedMultiplierDirect = useCallback((value) => {
    setSpeedMultiplier(value)

    const closestIndex = speedOptions.reduce((closest, option, index) => {
      return Math.abs(option - value) < Math.abs(speedOptions[closest] - value) ? index : closest
    }, 0)
    currentSpeedIndexRef.current = closestIndex
  }, [speedOptions])

  const toggleClearMode = useCallback(() => {
    setClearMode(prev => !prev)
  }, [])

  const selectType = useCallback((type) => {
    setSelectedType(type)
    setClearMode(false)
  }, [])

  const toggleGameMode = useCallback(() => {
    setGameMode(prev => {
      const newMode = prev === 'ECO' ? 'RPS' : 'ECO'

      totalReproductionsRef.current = 0
      graphDataRef.current = []
      setGraphData([])
      setStats({
        counts: [0, 0, 0, 0, 0],
        totalEntities: 0,
        averageEnergy: 0,
        totalReproductions: 0
      })

      entitiesRef.current = []
      setEntities([])
      animationStateRef.current = isRunning ? 1 : 0
      targetAnimationStateRef.current = animationStateRef.current
      grassSpawnRef.current = {
        lastAutoSpawn: Date.now(),
        lastBalanceSpawn: Date.now(),
        lastCount: 0
      }
      lastMeteorTimeRef.current = 0

      updateStats([])

      return newMode
    })
  }, [isRunning, updateStats])

  const resetSimulation = useCallback(() => {

    totalReproductionsRef.current = 0
    graphDataRef.current = []
    setGraphData([])
    setStats({
      counts: [0, 0, 0, 0, 0],
      totalEntities: 0,
      averageEnergy: 0,
      totalReproductions: 0
    })

    entitiesRef.current = []
    setEntities([])
    animationStateRef.current = isRunning ? 1 : 0
    targetAnimationStateRef.current = animationStateRef.current
    grassSpawnRef.current = {
      lastAutoSpawn: Date.now(),
      lastBalanceSpawn: Date.now(),
      lastCount: 0
    }
    lastMeteorTimeRef.current = 0

    updateStats([])
  }, [isRunning, updateStats])

  const toggleMeteorMode = useCallback(() => {
    setMeteorMode(prev => {
      const newMode = !prev

      if (newMode) {
        document.body.classList.add('meteor-mode')
      } else {
        document.body.classList.remove('meteor-mode')
      }
      return newMode
    })
  }, [])

  const handlePlague = useCallback(() => {

    if (fieldEffectTimerRef.current) {
      clearTimeout(fieldEffectTimerRef.current)
    }

    setFieldEffect('plague')
    fieldEffectTimerRef.current = setTimeout(() => {
      setFieldEffect(null)
      fieldEffectTimerRef.current = null
    }, 2500)

    const prev = entitiesRef.current
    const animals = prev.filter(e => 
      e.type !== CONFIG.TYPES.GRASS && !e.removing
    )
    const infectedCount = Math.floor(animals.length * 0.3)
    const shuffled = [...animals].sort(() => Math.random() - 0.5)

    const updated = prev.map(entity => {
      if (shuffled.slice(0, infectedCount).some(e => e.id === entity.id)) {
        return { ...entity, energy: Math.max(0, entity.energy / 2) }
      }
      return entity
    })
    entitiesRef.current = updated
    updateStats(updated)
    setEntities([...updated])
  }, [updateStats])

  return {
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
    setSpeedMultiplier: setSpeedMultiplierDirect,
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
  }
}
