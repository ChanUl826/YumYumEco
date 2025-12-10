import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 배포를 위한 base 경로 설정
// 리포지토리 이름에 맞게 수정하세요 (예: '/yumyum-eco/')
// 만약 사용자/조직 페이지라면 '/'로 설정하세요
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_REPOSITORY 
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/YumYumEco/', // 리포지토리 이름: YumYumEco
})
