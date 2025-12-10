# GitHub Pages 배포 가이드

## 배포 방법

### 방법 1: GitHub Actions (권장)
1. GitHub 리포지토리에 코드를 푸시합니다
2. 리포지토리 Settings > Pages로 이동
3. Source를 "GitHub Actions"로 선택
4. `main` 또는 `master` 브랜치에 푸시하면 자동으로 배포됩니다

### 방법 2: 수동 배포 (gh-pages)
1. `npm install` 실행하여 gh-pages 패키지 설치
2. `npm run deploy` 실행
3. GitHub 리포지토리 Settings > Pages에서 gh-pages 브랜치를 선택

## 중요: base 경로 설정

`vite.config.js`의 `base` 경로를 리포지토리 이름에 맞게 수정하세요:

- 리포지토리 이름이 `yumyum-eco`인 경우: `base: '/yumyum-eco/'`
- 사용자/조직 페이지인 경우: `base: '/'`

현재 설정된 기본값은 `/yumyum-eco/`입니다. 리포지토리 이름이 다르다면 수정이 필요합니다.

