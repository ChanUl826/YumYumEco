import React from 'react'
import '../style.css'
import { BASE_URL } from '../config'

function TitleScreen({ onStart }) {
  return (
    <div className="title-screen">

      <img 
        src={`${BASE_URL}TITLE.jpg`}
        alt="냠냠 생태계 타이틀" 
        className="title-bg"
      />

      <button 
        className="start-button" 
        onClick={onStart} 
        aria-label="게임 시작"
      >
        <span className="start-button-text">시작하기</span>
        <i className="fa-solid fa-play"></i>
      </button>
    </div>
  )
}

export default TitleScreen
