// 부수(符) 내역 해설 생성기.
//
// riichi-ts 는 합계 부수만 돌려주고 내역을 주지 않으므로, 여기서 표준 규칙으로 내역을 재구성한다.
// 핵심 안전장치: 여러 해석(멘쯔 분해 × 대기/머리 해석)을 모두 계산해, **올림 합계가 riichi-ts 의
// 권위 있는 scored.fu 와 일치하는 해석**만 채택한다. 따라서 화면에 뜨는 내역은 항상 정답 부수와 합이 맞는다.
// 일치하는 해석이 없으면 null(해설 생략) — 합이 틀린 내역을 보여주는 일은 없다.

import type { Hand, Scored } from '../types'
import { isTerminalOrHonor } from './tiles'

export interface FuComponent {
  label: string
  fu: number
}
export interface FuDetail {
  components: FuComponent[]
  raw: number   // 올림 전 합
  total: number // 올림 후(= scored.fu)
}

interface Meld {
  kind: 'seq' | 'trip'
  tile: number // seq=시작 타일, trip=커쯔 타일
}
interface Decomp {
  melds: Meld[]
  pair: number
}

// 닫힌 타일들을 nMelds 개의 멘쯔 + 머리 1조로 분해 (표준형). 칠대자/국사는 대상 아님.
function decompose(tiles: number[], nMelds: number): Decomp[] {
  const counts = new Array(34).fill(0)
  tiles.forEach((t) => counts[t]++)
  const out: Decomp[] = []
  function rec(melds: Meld[], pair: number, pairSet: boolean) {
    let i = 0
    while (i < 34 && counts[i] === 0) i++
    if (i === 34) {
      if (melds.length === nMelds && pairSet) out.push({ melds: melds.map((m) => ({ ...m })), pair })
      return
    }
    if (!pairSet && counts[i] >= 2) {
      counts[i] -= 2
      rec(melds, i, true)
      counts[i] += 2
    }
    if (counts[i] >= 3 && melds.length < nMelds) {
      counts[i] -= 3
      melds.push({ kind: 'trip', tile: i })
      rec(melds, pair, pairSet)
      melds.pop()
      counts[i] += 3
    }
    if (i < 27 && i % 9 <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0 && melds.length < nMelds) {
      counts[i]--
      counts[i + 1]--
      counts[i + 2]--
      melds.push({ kind: 'seq', tile: i })
      rec(melds, pair, pairSet)
      melds.pop()
      counts[i]++
      counts[i + 1]++
      counts[i + 2]++
    }
  }
  rec([], -1, false)
  return out
}

// 커쯔 부수: closed=안커, open=명각
function koutsuFu(tileIdx: number, closed: boolean): number {
  const th = isTerminalOrHonor(tileIdx)
  if (closed) return th ? 8 : 4
  return th ? 4 : 2
}
function koutsuLabel(tileIdx: number, closed: boolean): string {
  const th = isTerminalOrHonor(tileIdx)
  return `${closed ? '안커' : '밍커'}(${th ? '요구패' : '중장패'})`
}

// 후로(공개 멘쯔) 부수
function openMeldFuLabel(tiles: number[], open: boolean): { fu: number; label: string } | null {
  const isTriplet = tiles.every((t) => t === tiles[0])
  if (!isTriplet) return null // 치(슌쯔) = 0부
  const t = tiles[0]
  const th = isTerminalOrHonor(t)
  if (tiles.length === 4) {
    const fu = open ? (th ? 16 : 8) : th ? 32 : 16
    return { fu, label: `${open ? '밍깡' : '안깡'}(${th ? '요구패' : '중장패'})` }
  }
  const fu = th ? 4 : 2
  return { fu, label: `밍커(${th ? '요구패' : '중장패'})` }
}

interface Cand {
  components: FuComponent[]
  raw: number
  rounded: number
}

const ceil10 = (n: number) => Math.ceil(n / 10) * 10

// 한 분해 + 화료패 해석에 대한 부수 후보 생성
function evalDecomp(hand: Hand, dec: Decomp, pairFuOptions: number[], pairLabel: string): Cand[] {
  const cands: Cand[] = []
  const w = hand.winningTile
  const menzenRon = hand.isMenzen && !hand.isTsumo

  // 고정 성분(후로 + 기본/멘젠론/쯔모)
  const fixed: FuComponent[] = [{ label: '기본 부수', fu: 20 }]
  if (menzenRon) fixed.push({ label: '멘젠 론', fu: 10 })
  if (hand.isTsumo) fixed.push({ label: '쯔모', fu: 2 })
  const openComps: FuComponent[] = []
  for (const m of hand.openMelds) {
    const r = openMeldFuLabel(m.tiles, m.open)
    if (r && r.fu > 0) openComps.push({ label: r.label, fu: r.fu })
  }

  // 화료패가 속할 수 있는 위치(멘쯔/머리)를 열거 → 대기·명각 해석 분기
  type Assign = { waitFu: number; waitLabel: string; ronTripIdx: number | null }
  const assigns: Assign[] = []
  if (dec.pair === w) assigns.push({ waitFu: 2, waitLabel: '단기 대기', ronTripIdx: null })
  dec.melds.forEach((m, idx) => {
    if (m.kind === 'trip' && m.tile === w) {
      assigns.push({ waitFu: 0, waitLabel: '', ronTripIdx: idx }) // 쌍퐁 대기(부수 0), 론이면 해당 커쯔=명각
    } else if (m.kind === 'seq' && w >= m.tile && w <= m.tile + 2) {
      const s = m.tile
      if (w === s + 1) assigns.push({ waitFu: 2, waitLabel: '간짱 대기', ronTripIdx: null })
      else if ((s % 9 === 0 && w === s + 2) || (s % 9 === 6 && w === s))
        assigns.push({ waitFu: 2, waitLabel: '변짱 대기', ronTripIdx: null })
      else assigns.push({ waitFu: 0, waitLabel: '', ronTripIdx: null }) // 양면 대기
    }
  })
  if (assigns.length === 0) return cands

  for (const pf of pairFuOptions) {
    for (const a of assigns) {
      const meldComps: FuComponent[] = []
      dec.melds.forEach((m, idx) => {
        if (m.kind !== 'trip') return
        const closed = !(a.ronTripIdx === idx && !hand.isTsumo) // 론으로 완성된 커쯔는 명각
        meldComps.push({ label: koutsuLabel(m.tile, closed), fu: koutsuFu(m.tile, closed) })
      })
      const comps: FuComponent[] = [...fixed]
      if (a.waitFu > 0) comps.push({ label: a.waitLabel, fu: a.waitFu })
      if (pf > 0) comps.push({ label: pairLabel, fu: pf })
      comps.push(...meldComps, ...openComps)
      const raw = comps.reduce((s, c) => s + c.fu, 0)
      cands.push({ components: comps, raw, rounded: ceil10(raw) })
    }
  }
  return cands
}

// 머리 부수 옵션과 라벨(연풍패는 +2/+4 두 해석을 모두 시도해 엔진과 일치시킴)
function pairFuInfo(pair: number, bakaze: number, jikaze: number): { options: number[]; label: string } {
  if (pair >= 31) return { options: [2], label: '역패 머리(삼원패)' }
  const isBa = pair === bakaze
  const isJi = pair === jikaze
  if (isBa && isJi) return { options: [4, 2], label: '연풍 머리(장풍+자풍)' }
  if (isBa) return { options: [2], label: '역패 머리(장풍)' }
  if (isJi) return { options: [2], label: '역패 머리(자풍)' }
  return { options: [0], label: '' }
}

// 같은 (label, fu) 성분을 ×N 으로 묶어 표시
function groupComponents(comps: FuComponent[]): FuComponent[] {
  const order: string[] = []
  const map = new Map<string, { fu: number; n: number }>()
  for (const c of comps) {
    const key = `${c.label}|${c.fu}`
    if (!map.has(key)) {
      map.set(key, { fu: c.fu, n: 0 })
      order.push(key)
    }
    map.get(key)!.n++
  }
  return order.map((key) => {
    const { fu, n } = map.get(key)!
    const label = key.split('|')[0]
    return n > 1 ? { label: `${label} ×${n}`, fu: fu * n } : { label, fu }
  })
}

/**
 * 화료 손패의 부수 내역을 계산한다. fuApplies(5판 미만·역만 아님) 인 경우에만 의미가 있다.
 * 합이 scored.fu 와 맞지 않으면 null 을 반환(해설 생략).
 */
export function fuBreakdown(hand: Hand, scored: Scored): FuDetail | null {
  if (!scored.canWin || scored.isYakuman) return null

  // 특수형: 칠대자 / 핑후
  if (scored.yaku.chiitoitsu) {
    return { components: [{ label: '칠대자 고정', fu: 25 }], raw: 25, total: 25 }
  }
  if (scored.yaku.pinfu) {
    if (hand.isTsumo) return { components: [{ label: '핑후 쯔모(고정)', fu: 20 }], raw: 20, total: 20 }
    return {
      components: [
        { label: '기본 부수', fu: 20 },
        { label: '멘젠 론', fu: 10 },
      ],
      raw: 30,
      total: 30,
    }
  }

  // 일반형: 닫힌 타일 전체(쯔모는 화료패 포함, 론은 화료패 더해 14장형) 분해
  const concealed = hand.isTsumo ? [...hand.closed] : [...hand.closed, hand.winningTile]
  const nMelds = 4 - hand.openMelds.length
  const decs = decompose(concealed, nMelds)
  if (decs.length === 0) return null

  const allCands: Cand[] = []
  for (const dec of decs) {
    const pi = pairFuInfo(dec.pair, hand.bakaze, hand.jikaze)
    allCands.push(...evalDecomp(hand, dec, pi.options, pi.label))
  }
  if (allCands.length === 0) return null

  // scored.fu 와 올림 합이 일치하는 후보 중, 표준(고점) 규칙대로 raw 가 가장 큰 것 채택
  let matches = allCands.filter((c) => c.rounded === scored.fu)
  // 구이핑후(후로 + 양면 + 비역패 머리 론) 보정: raw 20 → 엔진은 30 으로 올림
  let kuiPinfu = false
  if (matches.length === 0 && scored.fu === 30 && !hand.isMenzen && !hand.isTsumo) {
    matches = allCands.filter((c) => c.rounded === 20)
    kuiPinfu = matches.length > 0
  }
  if (matches.length === 0) return null

  matches.sort((a, b) => b.raw - a.raw)
  const best = matches[0]
  const components = groupComponents(best.components)
  if (kuiPinfu) components.push({ label: '구이핑후 보정(올림)', fu: 0 })
  return { components, raw: best.raw, total: scored.fu }
}
