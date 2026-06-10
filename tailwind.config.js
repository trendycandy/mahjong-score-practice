/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: '#0f1714',      // 어두운 자탁(雀卓) 배경
        surface: '#18211d',
        ivory: '#f4efe2',     // 패 본체(아이보리)
        ivshade: '#d9d2c0',
        man: '#1d1d1f',       // 만수 흑
        manred: '#b3261e',    // 만수/중 적색
        pin: '#1b5fa6',       // 통수 청
        souz: '#1f7a4d',      // 삭수/發 녹
        dora: '#e0533d',      // 도라/적 강조
        jade: '#3fae7a',      // 정답
        miss: '#d98a3d',      // 오답
      },
      fontFamily: {
        num: ['"Roboto Condensed"', 'system-ui', 'sans-serif'],
        body: ['system-ui', '"Apple SD Gothic Neo"', '"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
