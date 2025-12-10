import { CONFIG } from '../../config'
import { getNearbyEntities } from './movementEngine'

export const findSafeSpawnPosition = (entitiesList, spatialGrid, canvasSize, minDistance = 60, maxAttempts = 10, centerX = null, centerY = null) => {
  const spawnMargin = 50
  const minX = spawnMargin
  const maxX = canvasSize.width - spawnMargin
  const minY = spawnMargin
  const maxY = canvasSize.height - spawnMargin

  const baseX = centerX !== null ? Math.max(minX, Math.min(maxX, centerX)) : minX + Math.random() * (maxX - minX)
  const baseY = centerY !== null ? Math.max(minY, Math.min(maxY, centerY)) : minY + Math.random() * (maxY - minY)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const offsetRange = 30 + (attempt * 20)
    const x = Math.max(minX, Math.min(maxX, baseX + (Math.random() - 0.5) * offsetRange))
    const y = Math.max(minY, Math.min(maxY, baseY + (Math.random() - 0.5) * offsetRange))

    let isSafe = true
    const minDistSquared = minDistance * minDistance

    const nearbyEntities = getNearbyEntities(x, y, spatialGrid, 1)
    for (const entity of nearbyEntities) {
      if (entity.removing) continue
      const dx = entity.x - x
      const dy = entity.y - y
      const distSquared = dx * dx + dy * dy

      if (distSquared < minDistSquared) {
        isSafe = false
        break
      }
    }

    if (isSafe) {
      return { x, y }
    }
  }

  const finalMargin = 50
  return {
    x: Math.max(finalMargin, Math.min(canvasSize.width - finalMargin, Math.random() * canvasSize.width)),
    y: Math.max(finalMargin, Math.min(canvasSize.height - finalMargin, Math.random() * canvasSize.height))
  }
}

export const spawnGrass = (entities, spatialGrid, canvasSize, createEntity, findSafeSpawnPosition, currentTime, grassSpawnRef, growthRate, timeScale, autoBalance, gameMode) => {
  if (autoBalance || gameMode !== 'ECO') {
    return entities
  }

  const currentGrassCount = entities.filter(e => 
    e.type === CONFIG.TYPES.GRASS && !e.removing
  ).length

  const baseIntervalMs = (CONFIG.SIMULATION.GRASS_GROWTH_INTERVAL / growthRate) * (1000 / 60)
  const minIntervalMs = baseIntervalMs * Math.max(1, timeScale) * 2
  const timeSinceLastAuto = currentTime - grassSpawnRef.current.lastAutoSpawn

  if (timeSinceLastAuto >= minIntervalMs && currentGrassCount < CONFIG.SIMULATION.MAX_GRASS) {
    const growthRateValue = CONFIG.SIMULATION.GRASS_GROWTH_RATE * growthRate * 0.3

    if (Math.random() < growthRateValue) {
      const safePos = findSafeSpawnPosition(entities, spatialGrid, canvasSize, 50)
      const newGrass = createEntity(CONFIG.TYPES.GRASS, safePos.x, safePos.y)
      grassSpawnRef.current.lastAutoSpawn = currentTime
      return [...entities, newGrass]
    } else {
      grassSpawnRef.current.lastAutoSpawn = currentTime - (minIntervalMs * 0.3)
    }
  }

  return entities
}

export const findSafeSpawnPositionWithExclusions = (entitiesList, spatialGrid, canvasSize, minDistance, maxAttempts, centerX, centerY, exclusionPositions = []) => {
  const spawnMargin = 50
  const minX = spawnMargin
  const maxX = canvasSize.width - spawnMargin
  const minY = spawnMargin
  const maxY = canvasSize.height - spawnMargin

  let baseX, baseY
  
  if (centerX !== null && centerY !== null) {
    baseX = Math.max(minX, Math.min(maxX, centerX))
    baseY = Math.max(minY, Math.min(maxY, centerY))
  } else {
    baseX = minX + Math.random() * (maxX - minX)
    baseY = minY + Math.random() * (maxY - minY)
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const offsetRange = 30 + (attempt * 20)
    const x = Math.max(minX, Math.min(maxX, baseX + (Math.random() - 0.5) * offsetRange))
    const y = Math.max(minY, Math.min(maxY, baseY + (Math.random() - 0.5) * offsetRange))

    let isSafe = true
    const minDistSquared = minDistance * minDistance

    const nearbyEntities = getNearbyEntities(x, y, spatialGrid, 1)
    for (const entity of nearbyEntities) {
      if (entity.removing) continue
      const dx = entity.x - x
      const dy = entity.y - y
      const distSquared = dx * dx + dy * dy

      if (distSquared < minDistSquared) {
        isSafe = false
        break
      }
    }

    if (isSafe) {
      for (const exclPos of exclusionPositions) {
        const dx = exclPos.x - x
        const dy = exclPos.y - y
        const distSquared = dx * dx + dy * dy
        if (distSquared < minDistSquared) {
          isSafe = false
          break
        }
      }
    }

    if (isSafe) {
      return { x, y }
    }
  }

  const finalMargin = 50
  return {
    x: Math.max(finalMargin, Math.min(canvasSize.width - finalMargin, Math.random() * canvasSize.width)),
    y: Math.max(finalMargin, Math.min(canvasSize.height - finalMargin, Math.random() * canvasSize.height))
  }
}

export const findDistributedSpawnPositions = (entitiesList, spatialGrid, canvasSize, count, minDistance, exclusionPositions = []) => {
  const spawnMargin = 50
  const minX = spawnMargin
  const maxX = canvasSize.width - spawnMargin
  const minY = spawnMargin
  const maxY = canvasSize.height - spawnMargin
  
  const positions = []
  
  if (count <= 0) return positions
  
  const gridCols = Math.ceil(Math.sqrt(count * 2))
  const gridRows = Math.ceil(count / gridCols)
  const cellWidth = (maxX - minX) / gridCols
  const cellHeight = (maxY - minY) / gridRows
  
  const usedCells = new Set()
  
  for (let i = 0; i < count; i++) {
    let bestPos = null
    let bestScore = -1
    let attempts = 0
    const maxAttempts = 20
    
    while (attempts < maxAttempts && bestPos === null) {
      let cellX, cellY, cellKey
      
      if (attempts < gridCols * gridRows) {
        cellX = attempts % gridCols
        cellY = Math.floor(attempts / gridCols)
        cellKey = `${cellX},${cellY}`
        
        if (usedCells.has(cellKey)) {
          attempts++
          continue
        }
      } else {
        cellX = Math.floor(Math.random() * gridCols)
        cellY = Math.floor(Math.random() * gridRows)
        cellKey = `${cellX},${cellY}`
      }
      
      const centerX = minX + (cellX + 0.5) * cellWidth
      const centerY = minY + (cellY + 0.5) * cellHeight
      
      const offsetX = (Math.random() - 0.5) * cellWidth * 0.6
      const offsetY = (Math.random() - 0.5) * cellHeight * 0.6
      
      const candidateX = Math.max(minX, Math.min(maxX, centerX + offsetX))
      const candidateY = Math.max(minY, Math.min(maxY, centerY + offsetY))
      
      let isSafe = true
      const minDistSquared = minDistance * minDistance
      
      const nearbyEntities = getNearbyEntities(candidateX, candidateY, spatialGrid, 1)
      for (const entity of nearbyEntities) {
        if (entity.removing) continue
        const dx = entity.x - candidateX
        const dy = entity.y - candidateY
        const distSquared = dx * dx + dy * dy
        
        if (distSquared < minDistSquared) {
          isSafe = false
          break
        }
      }
      
      if (isSafe) {
        for (const exclPos of exclusionPositions) {
          const dx = exclPos.x - candidateX
          const dy = exclPos.y - candidateY
          const distSquared = dx * dx + dy * dy
          if (distSquared < minDistSquared) {
            isSafe = false
            break
          }
        }
      }
      
      if (isSafe) {
        for (const pos of positions) {
          const dx = pos.x - candidateX
          const dy = pos.y - candidateY
          const distSquared = dx * dx + dy * dy
          if (distSquared < minDistSquared) {
            isSafe = false
            break
          }
        }
      }
      
      if (isSafe) {
        bestPos = { x: candidateX, y: candidateY }
        usedCells.add(cellKey)
        break
      }
      
      attempts++
    }
    
    if (bestPos) {
      positions.push(bestPos)
    } else {
      const allExclusions = [...exclusionPositions, ...positions]
      const fallbackPos = findSafeSpawnPositionWithExclusions(entitiesList, spatialGrid, canvasSize, minDistance, 10, null, null, allExclusions)
      if (fallbackPos) {
        positions.push(fallbackPos)
      }
    }
  }
  
  return positions
}

export const processAutoBalance = (entities, spatialGrid, canvasSize, minCounts, createEntity, findSafeSpawnPosition, currentTime, lastMeteorTime) => {

  const meteorCooldown = 2000
  const timeSinceMeteor = currentTime - lastMeteorTime
  if (timeSinceMeteor < meteorCooldown) {
    return entities
  }

  const currentCounts = [0, 0, 0, 0, 0]
  entities.forEach(e => {
    if (!e.removing) {
      currentCounts[e.type]++
    }
  })

  const safeMinCounts = Array.isArray(minCounts) ? minCounts : CONFIG.AUTO_BALANCE.MIN_COUNTS
  const currentTotalCount = entities.filter(e => !e.removing).length
  
  if (currentTotalCount >= CONFIG.SIMULATION.MAX_TOTAL_ENTITIES) {
    return entities
  }
  
  let newEntities = [...entities]
  let totalSpawned = 0
  const maxSpawnPerCheck = 5
  const recentlySpawnedPositions = []

  for (let type = 0; type < 5; type++) {
    if (totalSpawned >= maxSpawnPerCheck) break

    const minNeeded = safeMinCounts[type] || 0
    const currentCount = currentCounts[type]

    if (minNeeded === 0 || minNeeded === undefined || minNeeded === null) {
      continue
    }

    if (type === CONFIG.TYPES.GRASS) {
      if (currentCount >= CONFIG.AUTO_BALANCE.MAX_GRASS_FOR_BALANCE) {
        continue
      }

      if (currentCount < minNeeded) {
        const needed = minNeeded - currentCount
        const canSpawn = Math.min(Math.min(2, needed), maxSpawnPerCheck - totalSpawned)
        const remainingCapacity = CONFIG.SIMULATION.MAX_TOTAL_ENTITIES - newEntities.filter(e => !e.removing).length
        const actualSpawn = Math.min(canSpawn, remainingCapacity)
        if (actualSpawn > 0) {
          const spawnPositions = findDistributedSpawnPositions(newEntities, spatialGrid, canvasSize, actualSpawn, 100, recentlySpawnedPositions)
          for (const pos of spawnPositions) {
            recentlySpawnedPositions.push(pos)
            newEntities.push(createEntity(type, pos.x, pos.y))
          }
          totalSpawned += spawnPositions.length
        }
      }
      continue
    }

    if (currentCount < minNeeded) {
      const needed = minNeeded - currentCount
      const canSpawn = Math.min(Math.min(1, needed), maxSpawnPerCheck - totalSpawned)
      const remainingCapacity = CONFIG.SIMULATION.MAX_TOTAL_ENTITIES - newEntities.filter(e => !e.removing).length
      const actualSpawn = Math.min(canSpawn, remainingCapacity)
      if (actualSpawn > 0) {
        const spawnPositions = findDistributedSpawnPositions(newEntities, spatialGrid, canvasSize, actualSpawn, 120, recentlySpawnedPositions)
        for (const pos of spawnPositions) {
          recentlySpawnedPositions.push(pos)
          newEntities.push(createEntity(type, pos.x, pos.y))
        }
        totalSpawned += spawnPositions.length
      }
    }
  }

  return newEntities
}
