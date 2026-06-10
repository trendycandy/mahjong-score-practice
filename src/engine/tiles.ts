// riichi-ts 타일 인코딩 (검증됨)
//  만수 1m..9m = 0..8
//  통수 1p..9p = 9..17
//  삭수 1s..9s = 18..26
//  바람  동/남/서/북 = 27/28/29/30
//  삼원  백/발/중      = 31/32/33

export type Suit = 'm' | 'p' | 's' | 'z' // z = 자패(바람+삼원)

export interface TileInfo {
  index: number   // 0..33
  suit: Suit
  num: number     // 수패 1..9, 자패 1..7 (동남서북백발중)
}

export const N_TILES = 34

export function tile(index: number): TileInfo {
  if (index < 9) return { index, suit: 'm', num: index + 1 }
  if (index < 18) return { index, suit: 'p', num: index - 9 + 1 }
  if (index < 27) return { index, suit: 's', num: index - 18 + 1 }
  return { index, suit: 'z', num: index - 27 + 1 } // 1=동 ... 7=중
}

export const WINDS = { E: 27, S: 28, W: 29, N: 30 } as const
export const DRAGONS = { HAKU: 31, HATSU: 32, CHUN: 33 } as const

// 요구패(터미널+자패) 여부 — 부수/역 판정 참고용
export function isTerminalOrHonor(index: number): boolean {
  const t = tile(index)
  if (t.suit === 'z') return true
  return t.num === 1 || t.num === 9
}

// 도라 표시패 → 실제 도라 (참고용; 엔진이 내부 계산하므로 표시용)
export function doraFromIndicator(indicator: number): number {
  const t = tile(indicator)
  if (t.suit === 'z') {
    if (indicator <= WINDS.N) return ((indicator - WINDS.E + 1) % 4) + WINDS.E // 동→남→서→북→동
    return ((indicator - DRAGONS.HAKU + 1) % 3) + DRAGONS.HAKU                 // 백→발→중→백
  }
  const base = t.suit === 'm' ? 0 : t.suit === 'p' ? 9 : 18
  return base + (t.num % 9) // 9 → 1 순환
}

// 한국어 짧은 라벨 (UI 뱃지용)
export const WIND_KO: Record<number, string> = { 27: '동', 28: '남', 29: '서', 30: '북' }
export const DRAGON_KO: Record<number, string> = { 31: '백', 32: '발', 33: '중' }

// 타일 면에 그리는 한자 (자패)
export const WIND_KANJI: Record<number, string> = { 27: '東', 28: '南', 29: '西', 30: '北' }
export const DRAGON_KANJI: Record<number, string> = { 31: '白', 32: '發', 33: '中' }

export function tileLabel(index: number): string {
  const t = tile(index)
  if (t.suit === 'z') return (WIND_KO[index] ?? DRAGON_KO[index])
  return `${t.num}${t.suit}`
}

// FluffyStuff 타일셋(CC0) 파일명 매핑. face SVG 는 Front.svg(본체) 위에 겹쳐 렌더한다.
const HONOR_FILE: Record<number, string> = {
  27: 'Ton',   // 東
  28: 'Nan',   // 南
  29: 'Shaa',  // 西
  30: 'Pei',   // 北
  31: 'Haku',  // 白
  32: 'Hatsu', // 發
  33: 'Chun',  // 中
}
export function tileFaceFile(index: number): string {
  const t = tile(index)
  if (t.suit === 'm') return `Man${t.num}`
  if (t.suit === 'p') return `Pin${t.num}`
  if (t.suit === 's') return `Sou${t.num}`
  return HONOR_FILE[index]
}
