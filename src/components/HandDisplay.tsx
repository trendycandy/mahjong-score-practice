import Tile from './Tile'
import RiichiStick from './RiichiStick'
import type { Hand } from '../types'
import { WIND_KO } from '../engine/tiles'

function Badge({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'riichi' | 'win' }) {
  const cls =
    tone === 'riichi'
      ? 'bg-dora/15 text-dora border-dora/40'
      : tone === 'win'
      ? 'bg-jade/15 text-jade border-jade/40'
      : 'bg-ivory/5 text-ivory/70 border-ivory/15'
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>{children}</span>
}

export default function HandDisplay({ hand }: { hand: Hand }) {
  // 닫힌패 정렬 (화료패는 쯔모면 마지막, 론이면 별도 표시)
  const closedSansWin = hand.isTsumo ? hand.closed.slice(0, -1) : hand.closed
  const sortedClosed = [...closedSansWin].sort((a, b) => a - b)

  // ── 단일 행 사이징(간격까지 u 단위 분수로 접어 overflow 불가) ──
  const TILE_GAP = 0.1
  const WIN_GAP = 0.45
  const MELD_GAP = 0.55
  const MELD_INNER = 0.06
  const CAP = 46 // px

  const nClosed = sortedClosed.length
  let slotWidthSum = nClosed + 1 // 닫힌패 + 화료패
  let gapFractionSum = (nClosed - 1) * TILE_GAP + WIN_GAP
  for (const m of hand.openMelds) {
    const rotated = m.open && m.rotatedIndex != null ? 1 : 0
    const upright = m.tiles.length - rotated
    slotWidthSum += upright + rotated * (4 / 3)
    gapFractionSum += MELD_GAP + (m.tiles.length - 1) * MELD_INNER
  }
  const denom = slotWidthSum + gapFractionSum

  // 래퍼를 container query 컨테이너로 → 도라 행/손패 행이 같은 --u 공유
  const wrapperStyle = {
    containerType: 'inline-size',
    ['--u' as string]: `min(calc(100cqw / ${denom}), ${CAP}px)`,
  } as React.CSSProperties

  return (
    <div className="space-y-4" style={wrapperStyle}>
      {/* 상황 뱃지 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>장풍 {WIND_KO[hand.bakaze]}</Badge>
        <Badge>자풍 {WIND_KO[hand.jikaze]}</Badge>
        <Badge tone="win">{hand.isTsumo ? '쯔모' : '론'}</Badge>
        {hand.isMenzen ? <Badge>멘젠</Badge> : <Badge>후로</Badge>}
        {hand.riichi && <Badge tone="riichi">리치</Badge>}
        {hand.ippatsu && <Badge tone="riichi">일발</Badge>}
      </div>

      {/* 도라 표시패(+뒷도라, 라벨 하나) + 리치봉 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ivory/50">도라 표시패</span>
          <div className="flex items-end" style={{ gap: `calc(var(--u) * ${TILE_GAP})` }}>
            {hand.doraIndicators.map((d, i) => (
              <Tile key={`d${i}`} index={d} fluid />
            ))}
            {hand.riichi &&
              hand.uraIndicators.map((d, i) => (
                <Tile key={`u${i}`} index={d} fluid ura />
              ))}
          </div>
        </div>
        {hand.riichi && <RiichiStick />}
      </div>

      {/* 손패 — 단일 행 (깡 렌더는 Task 7) */}
      <div className="flex flex-nowrap items-end">
        {/* 닫힌패 그룹 */}
        <div className="flex items-end" style={{ gap: `calc(var(--u) * ${TILE_GAP})` }}>
          {sortedClosed.map((t, i) => (
            <Tile key={`c${i}`} index={t} fluid />
          ))}
        </div>
        {/* 화료패 (우측 분리) */}
        <span className="flex items-end" style={{ marginLeft: `calc(var(--u) * ${WIN_GAP})` }}>
          <Tile index={hand.winningTile} fluid highlight />
        </span>
        {/* 후로 그룹들 */}
        {hand.openMelds.map((m, mi) => (
          <div
            key={`m${mi}`}
            className="flex items-end"
            style={{
              marginLeft: `calc(var(--u) * ${MELD_GAP})`,
              gap: `calc(var(--u) * ${MELD_INNER})`,
            }}
          >
            {m.tiles.map((t, ti) => (
              <Tile key={ti} index={t} fluid rotated={m.open && ti === m.rotatedIndex} />
            ))}
          </div>
        ))}
      </div>

      <p className="text-xs text-ivory/40">
        붉은 테두리 = 화료패 ({hand.isTsumo ? '쯔모' : '론'}) · 꺾인 패 = 후로
        {hand.riichi && hand.uraIndicators.length > 0 && ' · 파란 테두리 = 뒷도라'}
      </p>
    </div>
  )
}
