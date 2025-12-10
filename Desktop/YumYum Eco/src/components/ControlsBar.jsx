import React from 'react'

function ControlsBar({
  isRunning,
  onToggleSimulation,
  onReset
}) {
  return (
    <div id="controls" className="controls-bar">
      <button className={`controls-btn ${isRunning ? 'running' : ''}`} onClick={onToggleSimulation}>
        <i className={isRunning ? 'fa-solid fa-pause' : 'fa-solid fa-play'}></i>
      </button>
      <div className="line">|</div>
      <button className="controls-btn" id="resetBtn" onClick={onReset}>
        <i className="fa-solid fa-rotate-right"></i>
      </button>
    </div>
  )
}

export default ControlsBar
