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

// 출제 빈도 (튜닝 가능)
const CHIITOI = 0.03   // 치또이츠 핸드 확률
const KAN_HAND = 0.1   // 깡 슬롯 시도율(canWin 필터로 줄어들어 출제율 ≈ 7%)
const KAN2 = 0.1       // 깡 핸드 중 2깡
const KAN3 = 0.001     // 깡 핸드 중 3깡

function rollKanCount(): number {
  if (Math.random() >= KAN_HAND) return 0
  const r = Math.random()
  return r < KAN3 ? 3 : r < KAN2 ? 2 : 1
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

// 깡(칸) 후보: 같은 타일 4개
function tryMakeKan(pool: Pool): number[] | null {
  const cands: number[] = []
  for (let i = 0; i < N_TILES; i++) if (pool.avail(i) >= 4) cands.push(i)
  if (cands.length === 0) return null
  const t = pick(cands)
  pool.take(t, 4)
  return [t, t, t, t]
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

interface RawMeld {
  tiles: number[]
  isKan: boolean
}
interface RawHand {
  melds: RawMeld[]   // 4 멘쯔 (깡은 4장)
  pair: number[]     // 머리
  openCount: number  // 비깡 멘쯔 중 후로(치/퐁) 수
}

// 구조적으로 유효한 4멘쯔(+깡)+머리를 생성 (재시도 포함)
function buildRawHand(): RawHand | null {
  const pool = new Pool()
  const nKans = rollKanCount()
  const melds: RawMeld[] = []
  for (let i = 0; i < 4; i++) {
    if (i < nKans) {
      const k = tryMakeKan(pool)
      if (!k) return null
      melds.push({ tiles: k, isKan: true })
    } else {
      const m = makeMeld(pool, Math.random() < 0.6)
      if (!m) return null
      melds.push({ tiles: m, isKan: false })
    }
  }
  const pair = makePair(pool)
  if (!pair) return null
  // 비깡 멘쯔 중 후로 수: 0(60%) 1(25%) 2(15%), 가용 슬롯으로 캡
  const normalCount = 4 - nKans
  const r = Math.random()
  let openCount = r < 0.6 ? 0 : r < 0.85 ? 1 : 2
  if (openCount > normalCount) openCount = normalCount
  return { melds, pair, openCount }
}

// 상황(풍패·리치·일발·도라) 생성. 깡 수만큼 도라 표시패 추가.
function rollSituation(isMenzen: boolean, nKans: number) {
  const bakaze = Math.random() < 0.7 ? 27 : 28
  const jikaze = pick([27, 28, 29, 30])
  const riichi = isMenzen && Math.random() < 0.6
  const ippatsu = riichi && Math.random() < 0.12
  const k = 1 + nKans // 도라 표시패 수 = 1 + 깡수
  const doraIndicators = Array.from({ length: k }, () => ri(N_TILES))
  const uraIndicators = riichi ? Array.from({ length: k }, () => ri(N_TILES)) : []
  return { bakaze, jikaze, riichi, ippatsu, doraIndicators, uraIndicators }
}

// 치또이츠(칠대자): 서로 다른 7쌍. 멘젠 전용.
function buildChiitoitsu(): { closed: number[]; winningTile: number; isTsumo: boolean } | null {
  const used = new Set<number>()
  const idxs: number[] = []
  let guard = 0
  while (idxs.length < 7 && guard++ < 200) {
    const t = ri(N_TILES)
    if (!used.has(t)) {
      used.add(t)
      idxs.push(t)
    }
  }
  if (idxs.length < 7) return null
  const all = idxs.flatMap((t) => [t, t]) // 14장
  const winningTile = pick(idxs)
  const isTsumo = Math.random() < 0.5
  const rest = [...all]
  rest.splice(rest.indexOf(winningTile), 1) // 13장 (화료패 1장 빠진 단기형)
  const closed = isTsumo ? [...rest, winningTile] : rest
  return { closed, winningTile, isTsumo }
}

export interface Generated {
  hand: Hand
  scored: Scored
}

// 한 문제 생성. allowNoYaku=true 면 '역 없음(화료 불가)' 문제도 채택.
export function generateQuestion(allowNoYaku = true): Generated {
  // 핸드 종류를 문제당 1회 결정 → 재시도 루프가 빈도를 왜곡하지 않게 함(치또이 출제율 ≈ CHIITOI)
  const wantChiitoi = Math.random() < CHIITOI
  for (let attempt = 0; attempt < 300; attempt++) {
    // ── 치또이츠 경로 (표준형과 배타) ──
    if (wantChiitoi) {
      const base = buildChiitoitsu()
      if (!base) continue
      const s = rollSituation(true, 0)
      const hand: Hand = {
        closed: base.closed,
        openMelds: [],
        winningTile: base.winningTile,
        isTsumo: base.isTsumo,
        bakaze: s.bakaze,
        jikaze: s.jikaze,
        doraIndicators: s.doraIndicators,
        uraIndicators: s.uraIndicators,
        riichi: s.riichi,
        ippatsu: s.ippatsu,
        isMenzen: true,
      }
      const scored = scoreHand(hand)
      // 엔진이 치또이츠로 채점할 때만 채택(량페코면 재시도 → 중첩 회피)
      if (scored.canWin && scored.yaku.chiitoitsu) return { hand, scored }
      continue
    }

    // ── 표준형(+깡) 경로 ──
    const raw = buildRawHand()
    if (!raw) continue

    // 후로 대상은 "비깡 멘쯔" 중에서만 선정
    const normalIdx = raw.melds.map((m, i) => ({ m, i })).filter((x) => !x.m.isKan).map((x) => x.i)
    for (let i = normalIdx.length - 1; i > 0; i--) {
      const j = ri(i + 1)
      ;[normalIdx[i], normalIdx[j]] = [normalIdx[j], normalIdx[i]]
    }
    const openNormal = new Set(normalIdx.slice(0, raw.openCount))

    const openMelds: OpenMeld[] = []
    const concealedTiles: number[] = [...raw.pair]
    raw.melds.forEach((rm, i) => {
      if (rm.isKan) {
        const kt = ri(3) // 0=안깡 1=대명깡 2=가깡
        if (kt === 0) openMelds.push({ open: false, tiles: rm.tiles })
        else if (kt === 1) openMelds.push({ open: true, tiles: rm.tiles, rotatedIndex: ri(4) })
        else openMelds.push({ open: true, tiles: rm.tiles, rotatedIndex: ri(3), added: true })
      } else if (openNormal.has(i)) {
        const isTriplet = rm.tiles[0] === rm.tiles[1] // 퐁(커쯔) 여부
        const rotatedIndex = isTriplet ? ri(3) : 0
        openMelds.push({ open: true, tiles: rm.tiles, rotatedIndex })
      } else {
        concealedTiles.push(...rm.tiles)
      }
    })

    // 멘젠 = 열린 멘쯔(open:true) 없음 → 안깡만 있으면 멘젠 유지
    const isMenzen = openMelds.every((m) => !m.open)
    const nKans = raw.melds.filter((m) => m.isKan).length

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

    const s = rollSituation(isMenzen, nKans)
    const hand: Hand = {
      closed,
      openMelds,
      winningTile,
      isTsumo,
      bakaze: s.bakaze,
      jikaze: s.jikaze,
      doraIndicators: s.doraIndicators,
      uraIndicators: s.uraIndicators,
      riichi: s.riichi,
      ippatsu: s.ippatsu,
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
