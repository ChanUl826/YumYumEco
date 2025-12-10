import { CONFIG } from '../../config'
import { getNearbyEntities } from './movementEngine'

export const checkReproductionCondition = (entity, currentTime, gameMode) => {
  if (entity.type === CONFIG.TYPES.GRASS || gameMode !== 'ECO') {
    return false
  }

  const lastReproduction = entity.lastReproduction || 0
  const timeSinceLastReproduction = currentTime - lastReproduction
  if (timeSinceLastReproduction < CONFIG.EFFECTS.REPRODUCTION_COOLDOWN) {
    return false
  }

  const energyRatio = entity.energy / entity.maxEnergy

  return energyRatio >= CONFIG.SIMULATION.REPRODUCTION_THRESHOLD
}

export const handleReproduction = (entity, allEntities, spatialGrid, createEntity, canvasSize) => {
  const newEntities = []

  const sameTypeCount = allEntities.filter(e => 
    e.type === entity.type && !e.removing
  ).length

  const totalCount = allEntities.filter(e => !e.removing).length

  if (sameTypeCount >= CONFIG.SIMULATION.MAX_ENTITIES_PER_TYPE) {
    return [entity]
  }

  if (totalCount >= CONFIG.SIMULATION.MAX_TOTAL_ENTITIES) {
    return [entity]
  }

  const newEnergy = entity.maxEnergy * 0.35

  const randomDelay = Math.random() * 2000

  const updatedEntity = {
    ...entity,
    energy: newEnergy,
    lastReproduction: Date.now() + randomDelay
  }

  let newX = entity.x
  let newY = entity.y
  let attempts = 0
  const maxAttempts = 10
  const minDistance = 50

  while (attempts < maxAttempts) {
    const offsetX = (Math.random() - 0.5) * 100
    const offsetY = (Math.random() - 0.5) * 100

    const reproMargin = 30
    const candidateX = Math.max(reproMargin, Math.min(canvasSize.width - reproMargin, entity.x + offsetX))
    const candidateY = Math.max(reproMargin, Math.min(canvasSize.height - reproMargin, entity.y + offsetY))

    let isSafe = true
    const minDistSquared = minDistance * minDistance
    const nearbyEntities = getNearbyEntities(candidateX, candidateY, spatialGrid, 1)

    for (const other of nearbyEntities) {
      if (other.removing || other.id === entity.id) continue
      const dx = other.x - candidateX
      const dy = other.y - candidateY
      const distSquared = dx * dx + dy * dy

      if (distSquared < minDistSquared) {
        isSafe = false
        break
      }
    }

    if (isSafe) {
      newX = candidateX
      newY = candidateY
      break
    }

    attempts++
  }

  const newEntity = createEntity(entity.type, newX, newY)
  newEntity.energy = newEnergy
  const childRandomDelay = Math.random() * 2000
  newEntity.lastReproduction = Date.now() + childRandomDelay
  
  if (entity.energyDecayRate !== undefined && entity.energyDecayRate !== null) {
    const childVariance = 0.95 + Math.random() * 0.1
    newEntity.energyDecayRate = entity.energyDecayRate * childVariance
  }

  newEntities.push(updatedEntity, newEntity)
  return newEntities
}
