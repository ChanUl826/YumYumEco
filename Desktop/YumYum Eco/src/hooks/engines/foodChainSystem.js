import { CONFIG } from '../../config'
import { getPreyTypes, getNearbyEntities } from './movementEngine'

export const processCollisions = (entities, spatialGrid, currentTime, gameMode) => {
  const collisionUpdates = new Map()
  const entitiesToRemove = new Set()
  const eatingEvents = []
  const processedPairs = new Set()

  for (let i = 0; i < entities.length; i++) {
    const entity1 = entities[i]
    if (entity1.removing || entity1.invincible) continue
    if (entity1.type === CONFIG.TYPES.GRASS) continue

    const allNearbyEntities = getNearbyEntities(entity1.x, entity1.y, spatialGrid, 1)

    for (const entity2 of allNearbyEntities) {
      if (entity2.id === entity1.id) continue
      if (entity2.removing || entity2.invincible) continue

      const pairId = entity1.id < entity2.id ? `${entity1.id}-${entity2.id}` : `${entity2.id}-${entity1.id}`
      if (processedPairs.has(pairId)) continue
      processedPairs.add(pairId)

      const dx = entity2.x - entity1.x
      const dy = entity2.y - entity1.y
      const distSquared = dx * dx + dy * dy
      const combinedRadius = (entity1.size + entity2.size) / 2

      const collisionDistSquared = (combinedRadius * 1.1) * (combinedRadius * 1.1)

      if (distSquared < collisionDistSquared) {
        const distance = Math.sqrt(distSquared)

        if (entity1.type === entity2.type) {
          const angle = Math.atan2(entity2.y - entity1.y, entity2.x - entity1.x)
          const pushDistance = (combinedRadius - distance) / 3
          const pushSpeed = 0.3

          if (!collisionUpdates.has(entity1.id)) {
            collisionUpdates.set(entity1.id, {
              ...entity1,
              x: entity1.x - Math.cos(angle) * pushDistance,
              y: entity1.y - Math.sin(angle) * pushDistance,
              vx: entity1.vx - Math.cos(angle) * pushSpeed,
              vy: entity1.vy - Math.sin(angle) * pushSpeed
            })
          } else {
            const existing = collisionUpdates.get(entity1.id)
            collisionUpdates.set(entity1.id, {
              ...existing,
              x: existing.x - Math.cos(angle) * pushDistance,
              y: existing.y - Math.sin(angle) * pushDistance,
              vx: existing.vx - Math.cos(angle) * pushSpeed,
              vy: existing.vy - Math.sin(angle) * pushSpeed
            })
          }

          if (!collisionUpdates.has(entity2.id)) {
            collisionUpdates.set(entity2.id, {
              ...entity2,
              x: entity2.x + Math.cos(angle) * pushDistance,
              y: entity2.y + Math.sin(angle) * pushDistance,
              vx: entity2.vx + Math.cos(angle) * pushSpeed,
              vy: entity2.vy + Math.sin(angle) * pushSpeed
            })
          } else {
            const existing = collisionUpdates.get(entity2.id)
            collisionUpdates.set(entity2.id, {
              ...existing,
              x: existing.x + Math.cos(angle) * pushDistance,
              y: existing.y + Math.sin(angle) * pushDistance,
              vx: existing.vx + Math.cos(angle) * pushSpeed,
              vy: existing.vy + Math.sin(angle) * pushSpeed
            })
          }
          continue
        }

        if (gameMode === 'RPS') {

          const rpsChain1 = getPreyTypes(entity1.type, gameMode)
          const rpsChain2 = getPreyTypes(entity2.type, gameMode)

          if (rpsChain1 && Array.isArray(rpsChain1) && rpsChain1.includes(entity2.type)) {
            const timeSinceLastEat = currentTime - (entity1.lastEatTime || 0)
            if (timeSinceLastEat >= CONFIG.EFFECTS.EAT_COOLDOWN) {

              collisionUpdates.set(entity2.id, {
                ...entity2,
                type: entity1.type,
                eatingUntil: currentTime + CONFIG.EFFECTS.EAT_EFFECT_TIME,
                lastEatTime: currentTime,
                invincibleUntil: currentTime + 200,
                createdAt: Date.now()
              })
              collisionUpdates.set(entity1.id, {
                ...entity1,
                lastEatTime: currentTime,
                eatingUntil: currentTime + CONFIG.EFFECTS.EAT_EFFECT_TIME
              })
              break
            }
          }

          if (rpsChain2 && Array.isArray(rpsChain2) && rpsChain2.includes(entity1.type)) {
            const timeSinceLastEat2 = currentTime - (entity2.lastEatTime || 0)
            if (timeSinceLastEat2 >= CONFIG.EFFECTS.EAT_COOLDOWN) {

              collisionUpdates.set(entity1.id, {
                ...entity1,
                type: entity2.type,
                eatingUntil: currentTime + CONFIG.EFFECTS.EAT_EFFECT_TIME,
                lastEatTime: currentTime,
                invincibleUntil: currentTime + 200,
                createdAt: Date.now()
              })
              collisionUpdates.set(entity2.id, {
                ...entity2,
                lastEatTime: currentTime,
                eatingUntil: currentTime + CONFIG.EFFECTS.EAT_EFFECT_TIME
              })
              break
            }
          }
        } else {

          const foodTypes1 = getPreyTypes(entity1.type, gameMode)
          if (foodTypes1 && Array.isArray(foodTypes1) && foodTypes1.includes(entity2.type)) {
            const lastEatTime = entity1.lastEatTime || entity1.createdAt || 0
            const timeSinceLastEat = currentTime - lastEatTime

            const effectiveCooldown = CONFIG.EFFECTS.EAT_COOLDOWN * 0.3
            if (timeSinceLastEat >= effectiveCooldown) {
              eatingEvents.push({ predator: entity1, prey: entity2, distanceSquared: distSquared })

              continue
            }
          }

          const foodTypes2 = getPreyTypes(entity2.type, gameMode)
          if (foodTypes2 && Array.isArray(foodTypes2) && foodTypes2.includes(entity1.type)) {
            const lastEatTime2 = entity2.lastEatTime || entity2.createdAt || 0
            const timeSinceLastEat2 = currentTime - lastEatTime2

            const effectiveCooldown2 = CONFIG.EFFECTS.EAT_COOLDOWN * 0.3
            if (timeSinceLastEat2 >= effectiveCooldown2) {
              eatingEvents.push({ predator: entity2, prey: entity1, distanceSquared: distSquared })

              continue
            }
          }
        }
      }
    }
  }

  return { collisionUpdates, eatingEvents }
}

export const processEatingEvents = (eatingEvents, entities, collisionUpdates, currentTime) => {

  eatingEvents.forEach(event => {
    if (!event.distanceSquared) {
      const dx = event.prey.x - event.predator.x
      const dy = event.prey.y - event.predator.y
      event.distanceSquared = dx * dx + dy * dy
    }
  })

  eatingEvents.sort((a, b) => {

    const distDiff = a.distanceSquared - b.distanceSquared
    if (Math.abs(distDiff) > 50) {
      return distDiff
    }

    const typeDiff = b.predator.type - a.predator.type
    if (typeDiff !== 0) return typeDiff

    return b.predator.id - a.predator.id
  })

  const preyIdsToRemove = new Set()
  const processedPredators = new Set()

  for (const { predator, prey } of eatingEvents) {

    if (preyIdsToRemove.has(prey.id) || processedPredators.has(predator.id)) {
      continue
    }

    preyIdsToRemove.add(prey.id)
    processedPredators.add(predator.id)

    const baseEnergyGain = CONFIG.SIMULATION.ENERGY_GAIN + (prey.type * 4)

    let predatorEntity = collisionUpdates.has(predator.id) 
      ? collisionUpdates.get(predator.id)
      : entities.find(e => e.id === predator.id)

    if (!predatorEntity) continue

    const newEnergy = Math.min(
      predatorEntity.maxEnergy,
      predatorEntity.energy + baseEnergyGain
    )

    if (collisionUpdates.has(predator.id)) {
      const existing = collisionUpdates.get(predator.id)
      collisionUpdates.set(predator.id, {
        ...existing,
        energy: newEnergy,
        target: null,
        lastEatTime: currentTime,
        eatingUntil: currentTime + CONFIG.EFFECTS.EAT_EFFECT_TIME
      })
    } else {
      collisionUpdates.set(predator.id, {
        ...predatorEntity,
        energy: newEnergy,
        target: null,
        lastEatTime: currentTime,
        eatingUntil: currentTime + CONFIG.EFFECTS.EAT_EFFECT_TIME
      })
    }
  }

  return { preyIdsToRemove, collisionUpdates }
}
