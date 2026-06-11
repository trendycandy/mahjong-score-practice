import type { Hand, OpenMeld } from '../types'
import { N_TILES, tile } from './tiles'
import { scoreHand } from './score'
import type { Scored } from '../types'

function ri(n: number) {
  return Math.floor(Math.random() * n)
}
function pick<T>(arr: T[]): T {
  return arr[ri(arr.length)]
}

// 타일 풀: 각 타일 최대 4장. 사용 시 차감.
class Pool {
  count = new Array<number>(N_TILES).fill(4)
  take(idx: number, n: number): boolean {
    if (this.count[idx] < n) return false
    this.count[idx] -= n
    return true
  }
  avail(idx: number): number {
    return this.count[idx]
  }
}

// 순서패(슌쯔) 후보: 같은 수트 연속 3개 (만/통/삭)
function tryMakeSequence(pool: Pool): number[] | null {
  const starts: number[] = []
  for (const base of [0, 9, 18]) {
    for (let n = 0; n <= 6; n++) {
      const a = base + n
      if (pool.avail(a) > 0 && pool.avail(a + 1) > 0 && pool.avail(a + 2) > 0) {
        starts.push(a)
      }
    }
  }
  if (starts.length === 0) return null
  const a = pick(starts)
  pool.take(a, 1)
  pool.take(a + 1, 1)
  pool.take(a + 2, 1)
  return [a, a + 1, a + 2]
}

// 커쯔(각자) 후보: 같은 타일 3개
function tryMakeTriplet(pool: Pool): number[] | null {
  const cands: number[] = []
  for (let i = 0; i < N_TILES; i++) if (pool.avail(i) >= 3) cands.push(i)
  if (cands.length === 0) return null
  const t = pick(cands)
  pool.take(t, 3)
  return [t, t, t]
}

function makeMeld(pool: Pool, preferSeq: boolean): number[] | null {
  const order = preferSeq ? [tryMakeSequence, tryMakeTriplet] : [tryMakeTriplet, tryMakeSequence]
  for (const fn of order) {
    const m = fn(pool)
    if (m) return m
  }
  return null
}

function makePair(pool: Pool): number[] | null {
  const cands: number[] = []
  for (let i = 0; i < N_TILES; i++) if (pool.avail(i) >= 2) cands.push(i)
  if (cands.length === 0) return null
  const t = pick(cands)
  pool.take(t, 2)
  return [t, t]
}

interface RawHand {
  melds: number[][]   // 4 멘쯔
  pair: number[]      // 머리
  openCount: number
}

// 구조적으로 유효한 4멘쯔+머리를 생성 (재시도 포함)
function buildRawHand(): RawHand | null {
  const pool = new Pool()
  const melds: number[][] = []
  // 후로 개수: 0(60%) 1(25%) 2(15%)
  const r = Math.random()
  const openCount = r < 0.6 ? 0 : r < 0.85 ? 1 : 2
  for (let i = 0; i < 4; i++) {
    const m = makeMeld(pool, Math.random() < 0.6)
    if (!m) return null
    melds.push(m)
  }
  const pair = makePair(pool)
  if (!pair) return null
  return { melds, pair, openCount }
}

export interface Generated {
  hand: Hand
  scored: Scored
}

// 한 문제 생성. allowNoYaku=true 면 '역 없음(화료 불가)' 문제도 채택.
export function generateQuestion(allowNoYaku = true): Generated {
  for (let attempt = 0; attempt < 200; attempt++) {
    const raw = buildRawHand()
    if (!raw) continue

    // 멘쯔 중 일부를 후로로. 슌쯔는 치(open), 커쯔는 퐁(open).
    // 화료패는 "닫힌" 멘쯔 또는 머리에서 골라야 자연스러움.
    const meldIdx = [0, 1, 2, 3]
    // 섞기
    for (let i = meldIdx.length - 1; i > 0; i--) {
      const j = ri(i + 1)
      ;[meldIdx[i], meldIdx[j]] = [meldIdx[j], meldIdx[i]]
    }
    const openMeldIdx = new Set(meldIdx.slice(0, raw.openCount))
    const openMelds: OpenMeld[] = []
    const concealedTiles: number[] = [...raw.pair]
    raw.melds.forEach((m, i) => {
      if (openMeldIdx.has(i)) {
        const isTriplet = m[0] === m[1] // 퐁(커쯔) 여부
        // 치(슌쯔): 맨 왼쪽 패를 꺾음 / 퐁(커쯔): 랜덤 위치
        const rotatedIndex = isTriplet ? ri(3) : 0
        openMelds.push({ open: true, tiles: m, rotatedIndex })
      } else {
        concealedTiles.push(...m)
      }
    })

    const isMenzen = raw.openCount === 0

    // 화료패: 닫힌 타일 중 하나
    const winningTile = pick(concealedTiles)
    const isTsumo = Math.random() < 0.5

    // closed 구성: 쯔모면 14장(화료패 마지막), 론이면 화료패 1장 제외
    let closed: number[]
    if (isTsumo) {
      const rest = [...concealedTiles]
      rest.splice(rest.indexOf(winningTile), 1)
      closed = [...rest, winningTile]
    } else {
      const rest = [...concealedTiles]
      rest.splice(rest.indexOf(winningTile), 1)
      closed = rest
    }

    // 풍패
    const bakaze = Math.random() < 0.7 ? 27 : 28 // 동/남장
    const jikaze = pick([27, 28, 29, 30])

    // 도라 표시패 1개 (깡 미구현 → 추가 표시패 없음)
    const doraIndicators: number[] = [ri(N_TILES)]

    // 리치: 멘젠일 때만, 60%. 리치 시 12% 일발.
    const riichi = isMenzen && Math.random() < 0.6
    const ippatsu = riichi && Math.random() < 0.12
    // 뒷도라 표시패: 리치일 때만 1개
    const uraIndicators: number[] = riichi ? [ri(N_TILES)] : []

    const hand: Hand = {
      closed,
      openMelds,
      winningTile,
      isTsumo,
      bakaze,
      jikaze,
      doraIndicators,
      uraIndicators,
      riichi,
      ippatsu,
      isMenzen,
    }

    const scored = scoreHand(hand)

    if (scored.canWin) return { hand, scored }
    // 역 없음(화료 불가) → 학습용으로 약 12%만 채택, 나머지 재시도
    if (allowNoYaku && Math.random() < 0.12) return { hand, scored }
    // 그 외엔 재시도
  }
  // 폴백: 보장된 간단한 핑후형
  return forcedFallback()
}

function forcedFallback(): Generated {
  const hand: Hand = {
    closed: [1, 2, 4, 5, 6, 10, 11, 12, 13, 14, 15, 19, 19, 3],
    openMelds: [],
    winningTile: 3,
    isTsumo: true,
    bakaze: 27,
    jikaze: 28,
    doraIndicators: [],
    uraIndicators: [],
    riichi: false,
    ippatsu: false,
    isMenzen: true,
  }
  return { hand, scored: scoreHand(hand) }
}

export { tile }
