import { CONFIG } from '../../config'

const CELL_SIZE = 120

export const getCellKey = (x, y) => {
  const cellX = Math.floor(x / CELL_SIZE)
  const cellY = Math.floor(y / CELL_SIZE)
  return `${cellX},${cellY}`
}

export const buildSpatialGrid = (entities) => {
  const grid = new Map()
  for (const entity of entities) {
    if (entity.removing) continue
    const key = getCellKey(entity.x, entity.y)
    if (!grid.has(key)) {
      grid.set(key, [])
    }
    grid.get(key).push(entity)
  }
  return grid
}

export const getNearbyEntities = (x, y, grid, radius = 1) => {
  const cellX = Math.floor(x / CELL_SIZE)
  const cellY = Math.floor(y / CELL_SIZE)
  const nearby = []
  const processedIds = new Set()

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const key = `${cellX + dx},${cellY + dy}`
      const cellEntities = grid.get(key)
      if (cellEntities) {
        for (const entity of cellEntities) {

          if (!processedIds.has(entity.id)) {
            nearby.push(entity)
            processedIds.add(entity.id)
          }
        }
      }
    }
  }
  return nearby
}

export const getPreyTypes = (entityType, mode = 'ECO') => {
  if (mode === 'RPS') {
    return CONFIG.RPS_CHAIN[entityType] || null
  } else {
    return CONFIG.FOOD_CHAIN[entityType] || null
  }
}

const getDistanceSquared = (e1, e2) => {
  const dx = e1.x - e2.x
  const dy = e1.y - e2.y
  return dx * dx + dy * dy
}

const getDistance = (e1, e2) => {
  return Math.sqrt(getDistanceSquared(e1, e2))
}

const isPredator = (potentialPredator, entity, mode = 'ECO') => {
  if (potentialPredator.type === CONFIG.TYPES.GRASS) return false
  if (potentialPredator.type === entity.type) return false

  if (mode === 'ECO') {
    const predatorPreyTypes = getPreyTypes(potentialPredator.type, mode)
    return predatorPreyTypes && Array.isArray(predatorPreyTypes) && predatorPreyTypes.includes(entity.type)
  }

  if (mode === 'RPS') {
    const predatorPreyTypes = getPreyTypes(potentialPredator.type, mode)
    return predatorPreyTypes && Array.isArray(predatorPreyTypes) && predatorPreyTypes.includes(entity.type)
  }

  return false
}

export const findNearestFood = (entity, spatialGrid, mode = 'ECO', allEntities = []) => {

  const preyTypes = getPreyTypes(entity.type, mode)

  if (!preyTypes || !Array.isArray(preyTypes) || preyTypes.length === 0) {
    return null
  }

  const props = CONFIG.TYPE_PROPERTIES[entity.type]
  const sightRange = props.sightRange || CONFIG.ENTITY.SIGHT_RANGE
  const sightRangeSquared = sightRange * sightRange

  const speed = props.speed || CONFIG.ENTITY.SPEED
  const searchRadius = speed >= 1.0 ? 2 : 1

  const nearbyEntities = getNearbyEntities(entity.x, entity.y, spatialGrid, searchRadius)

  const targetedByCount = new Map()
  if (allEntities.length > 0) {
    for (const otherEntity of allEntities) {
      if (otherEntity.target && !otherEntity.removing) {
        const targetId = otherEntity.target.id || otherEntity.target
        targetedByCount.set(targetId, (targetedByCount.get(targetId) || 0) + 1)
      }
    }
  }

  let bestFood = null
  let bestScore = -Infinity

  for (const other of nearbyEntities) {

    if (!other || other.removing || other.invincible) continue
    if (other.id === entity.id) continue
    if (!preyTypes.includes(other.type)) continue

    const distSquared = getDistanceSquared(entity, other)
    if (distSquared >= sightRangeSquared) continue

    const targetedBy = targetedByCount.get(other.id) || 0
    const distance = Math.sqrt(distSquared)

    const distanceScore = sightRange - distance
    const competitionPenalty = targetedBy * 30
    const score = distanceScore - competitionPenalty

    if (score > bestScore) {
      bestScore = score
      bestFood = other
    }
  }

  return bestFood
}

export const validateTarget = (entity, allEntities) => {
  if (!entity.target) return null

  const targetEntity = allEntities.find(e => e.id === entity.target.id)

  if (!targetEntity || targetEntity.removing || targetEntity.invincible) {
    return null
  }

  return targetEntity
}

export const updateMovement = (entity, canvasSize, timeScale, animationState, speedMultiplier) => {
  const props = CONFIG.TYPE_PROPERTIES[entity.type]

  if (entity.type === CONFIG.TYPES.GRASS) {
    return entity
  }

  let updatedEntity = {
    ...entity,
    x: entity.x + entity.vx * animationState * timeScale,
    y: entity.y + entity.vy * animationState * timeScale
  }

  const minX = updatedEntity.size / 2
  const maxX = canvasSize.width - updatedEntity.size / 2
  const minY = updatedEntity.size / 2
  const maxY = canvasSize.height - updatedEntity.size / 2

  let hitWall = false
  let wallHitX = false
  let wallHitY = false

  if (updatedEntity.x < minX) {
    updatedEntity.vx *= -1
    updatedEntity.x = minX
    hitWall = true
    wallHitX = true
  } else if (updatedEntity.x > maxX) {
    updatedEntity.vx *= -1
    updatedEntity.x = maxX
    hitWall = true
    wallHitX = true
  }

  if (updatedEntity.y < minY) {
    updatedEntity.vy *= -1
    updatedEntity.y = minY
    hitWall = true
    wallHitY = true
  } else if (updatedEntity.y > maxY) {
    updatedEntity.vy *= -1
    updatedEntity.y = maxY
    hitWall = true
    wallHitY = true
  }

  // 벽구석에서 멈추지 않도록 처리
  if (wallHitX && wallHitY) {
    // 구석에 닿았을 때 랜덤한 방향으로 튕기기
    const angle = Math.random() * Math.PI * 2
    const speed = Math.sqrt(updatedEntity.vx * updatedEntity.vx + updatedEntity.vy * updatedEntity.vy)
    updatedEntity.vx = Math.cos(angle) * speed
    updatedEntity.vy = Math.sin(angle) * speed
    // 타겟 초기화하여 새로운 타겟을 찾도록 함
    updatedEntity.target = null
  } else if (hitWall) {
    // 벽에 닿았을 때 타겟이 벽 방향이면 타겟 초기화
    if (updatedEntity.target) {
      const target = updatedEntity.target
      const dx = target.x - updatedEntity.x
      const dy = target.y - updatedEntity.y
      
      // 타겟이 벽 너머에 있으면 타겟 초기화
      if ((wallHitX && Math.abs(dx) < Math.abs(dy)) || (wallHitY && Math.abs(dy) < Math.abs(dx))) {
        // 타겟이 벽 방향이지만, 벽에 가로막혀 있으면 초기화
        const distToWallX = wallHitX ? (updatedEntity.x < canvasSize.width / 2 ? updatedEntity.x - minX : maxX - updatedEntity.x) : Infinity
        const distToWallY = wallHitY ? (updatedEntity.y < canvasSize.height / 2 ? updatedEntity.y - minY : maxY - updatedEntity.y) : Infinity
        
        if (distToWallX < 50 || distToWallY < 50) {
          updatedEntity.target = null
        }
      }
    }
    
    // 벽에 닿았을 때 약간의 랜덤 방향 추가하여 멈추지 않도록 함
    const randomAngle = (Math.random() - 0.5) * 0.3
    const currentAngle = Math.atan2(updatedEntity.vy, updatedEntity.vx)
    const newAngle = currentAngle + randomAngle
    const speed = Math.sqrt(updatedEntity.vx * updatedEntity.vx + updatedEntity.vy * updatedEntity.vy)
    updatedEntity.vx = Math.cos(newAngle) * speed
    updatedEntity.vy = Math.sin(newAngle) * speed
  }

  updatedEntity.x = Math.max(minX, Math.min(maxX, updatedEntity.x))
  updatedEntity.y = Math.max(minY, Math.min(maxY, updatedEntity.y))

  return updatedEntity
}

const normalize = (dx, dy) => {
  const distSquared = dx * dx + dy * dy
  if (distSquared === 0) return { nx: 0, ny: 0, dist: 0 }
  const dist = Math.sqrt(distSquared)
  return { nx: dx / dist, ny: dy / dist, dist }
}

export const updateAI = (entity, nearestFood, speedMultiplier, animationState, allEntities = null, spatialGrid = null, mode = 'ECO') => {
  const props = CONFIG.TYPE_PROPERTIES[entity.type]

  const baseSpeed = mode === 'RPS' ? CONFIG.RPS_MODE.UNIFIED_SPEED : props.speed
  const speed = baseSpeed * speedMultiplier * animationState
  const sightRange = props.sightRange || CONFIG.ENTITY.SIGHT_RANGE

  let validTarget = null

  if (nearestFood && !nearestFood.removing && !nearestFood.invincible) {
    validTarget = nearestFood
  } else if (entity.target && allEntities) {

    const validatedTarget = validateTarget(entity, allEntities)
    if (validatedTarget) {
      validTarget = validatedTarget
    }
  }

  let moveX = 0
  let moveY = 0

  if (validTarget) {
    const seekWeight = 1.0
    moveX += (validTarget.x - entity.x) * seekWeight
    moveY += (validTarget.y - entity.y) * seekWeight
  }

  if (spatialGrid && allEntities) {
    const nearbyEntities = getNearbyEntities(entity.x, entity.y, spatialGrid, 1)
    const predators = nearbyEntities.filter(e => 
      e && !e.removing && e.id !== entity.id && isPredator(e, entity, mode)
    )

    predators.forEach(predator => {
      const dist = getDistance(entity, predator)
      if (dist < sightRange && dist > 0) {

        const fleeWeight = 5.0 * (1 - dist / sightRange)
        const dx = predator.x - entity.x
        const dy = predator.y - entity.y
        moveX -= dx * fleeWeight
        moveY -= dy * fleeWeight
      }
    })
  }

  if (spatialGrid && allEntities) {
    const nearbyEntities = getNearbyEntities(entity.x, entity.y, spatialGrid, 0)
    const neighbors = nearbyEntities.filter(e => 
      e && !e.removing && e.id !== entity.id && e.type === entity.type
    )

    neighbors.forEach(neighbor => {
      const dist = getDistance(entity, neighbor)
      const separationDistance = entity.size * 1.5

      if (dist < separationDistance && dist > 0) {

        const pushFactor = 2.0 * (1 - dist / separationDistance)
        const dx = neighbor.x - entity.x
        const dy = neighbor.y - entity.y
        moveX -= dx * pushFactor
        moveY -= dy * pushFactor
      }
    })
  }

  const { nx, ny, dist } = normalize(moveX, moveY)

  if (dist > 0.01) {

    return {
      ...entity,
      target: validTarget,
      vx: nx * speed,
      vy: ny * speed
    }
  } else {

    if (Math.random() < 0.015) {
      const currentAngle = Math.atan2(entity.vy || 0, entity.vx || 0)
      const newAngle = currentAngle + (Math.random() - 0.5) * 0.5
      return {
        ...entity,
        target: validTarget,
        vx: Math.cos(newAngle) * speed,
        vy: Math.sin(newAngle) * speed
      }
    }

    return {
      ...entity,
      target: validTarget,
      vx: entity.vx || Math.cos(Math.random() * Math.PI * 2) * speed,
      vy: entity.vy || Math.sin(Math.random() * Math.PI * 2) * speed
    }
  }
}
