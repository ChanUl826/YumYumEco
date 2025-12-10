import { CONFIG } from '../../config'

export const updateGrassGrowth = (entity, currentTime) => {
  if (entity.type !== CONFIG.TYPES.GRASS) {
    return entity
  }

  if (entity.energy < entity.maxEnergy) {

    const lastUpdateTime = entity.lastUpdateTime || currentTime
    const dt = (currentTime - lastUpdateTime) / 1000
    const props = CONFIG.TYPE_PROPERTIES[entity.type]

    return {
      ...entity,
      energy: Math.min(
        entity.maxEnergy,
        entity.energy + props.autoGrowRate * dt
      ),
      lastUpdateTime: currentTime
    }
  }

  return entity
}

export const updateEnergyDecay = (entity, speedMultiplier, animationState, metabolism, gameMode = 'ECO') => {
  if (entity.type === CONFIG.TYPES.GRASS) {
    return entity
  }

  if (gameMode === 'RPS') {
    return entity
  }

  const props = CONFIG.TYPE_PROPERTIES[entity.type]
  const baseEnergyDecay = entity.energyDecayRate !== undefined && entity.energyDecayRate !== null 
    ? entity.energyDecayRate 
    : props.energyDecay
  const energyDecay = baseEnergyDecay * speedMultiplier * animationState * metabolism

  const newEnergy = Math.max(0, entity.energy - energyDecay)

  if (newEnergy <= 0) {
    return null
  }

  return {
    ...entity,
    energy: newEnergy
  }
}
