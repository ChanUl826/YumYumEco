import React, { useMemo } from 'react'
import '../style.css'

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function FieldEffect({ effect }) {
  if (!effect) return null

  if (effect === 'rain') {

    const rainDrops = useMemo(() => {
      const seed = Date.now()
      const largeDrops = Array.from({ length: 50 }).map((_, i) => {
        const dropSeed = hashString(`${seed}-large-${i}`)
        const delay = seededRandom(dropSeed + 1) * 1
        const duration = 0.3 + seededRandom(dropSeed + 2) * 0.3
        const windOffset = (seededRandom(dropSeed + 3) - 0.5) * 25
        const left = seededRandom(dropSeed + 4) * 100

        return {
          key: `rain-large-${dropSeed}`,
          style: {
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            '--wind-offset': `${windOffset}px`
          }
        }
      })

      const mediumDrops = Array.from({ length: 60 }).map((_, i) => {
        const dropSeed = hashString(`${seed}-medium-${i}`)
        const delay = seededRandom(dropSeed + 1) * 1
        const duration = 0.35 + seededRandom(dropSeed + 2) * 0.35
        const windOffset = (seededRandom(dropSeed + 3) - 0.5) * 20
        const left = seededRandom(dropSeed + 4) * 100

        return {
          key: `rain-medium-${dropSeed}`,
          style: {
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            '--wind-offset': `${windOffset}px`
          }
        }
      })

      return { largeDrops, mediumDrops }
    }, [effect])

    return (
      <div className="field-effect rain-effect">
        <div className="rain-drops">

          {rainDrops.largeDrops.map((drop) => (
            <div
              key={drop.key}
              className="rain-drop rain-drop-large"
              style={drop.style}
            />
          ))}

          {rainDrops.mediumDrops.map((drop) => (
            <div
              key={drop.key}
              className="rain-drop rain-drop-medium"
              style={drop.style}
            />
          ))}
        </div>

        <div className="rain-overlay"></div>
      </div>
    )
  }

  if (effect && effect.type === 'meteor') {
    return (
      <div className="field-effect meteor-effect">
        <div
          className="meteor-explosion"
          style={{
            left: `${effect.x}px`,
            top: `${effect.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="meteor-core"></div>
          <div className="meteor-ring ring-1"></div>
          <div className="meteor-ring ring-2"></div>
          <div className="meteor-ring ring-3"></div>
        </div>
      </div>
    )
  }

  if (effect === 'plague') {

    const plagueParticles = useMemo(() => {
      const seed = Date.now()
      return Array.from({ length: 50 }).map((_, i) => {
        const particleSeed = hashString(`${seed}-plague-${i}`)
        const left = seededRandom(particleSeed + 1) * 100
        const top = seededRandom(particleSeed + 2) * 100
        const animationDelay = seededRandom(particleSeed + 3) * 2
        const animationDuration = 1 + seededRandom(particleSeed + 4) * 1

        return {
          key: `plague-${particleSeed}`,
          style: {
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${animationDelay}s`,
            animationDuration: `${animationDuration}s`
          }
        }
      })
    }, [effect])

    return (
      <div className="field-effect plague-effect">
        <div className="plague-particles">

          {plagueParticles.map((particle) => (
            <div
              key={particle.key}
              className="plague-particle"
              style={particle.style}
            />
          ))}
        </div>
      </div>
    )
  }

  return null
}

export default FieldEffect
