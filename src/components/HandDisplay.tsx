import Tile from './Tile'
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

  return (
    <div className="space-y-4">
      {/* 상황 뱃지 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>장풍 {WIND_KO[hand.bakaze]}</Badge>
        <Badge>자풍 {WIND_KO[hand.jikaze]}</Badge>
        <Badge tone="win">{hand.isTsumo ? '쯔모' : '론'}</Badge>
        {hand.isMenzen ? <Badge>멘젠</Badge> : <Badge>후로</Badge>}
        {hand.riichi && <Badge tone="riichi">리치</Badge>}
        {hand.ippatsu && <Badge tone="riichi">일발</Badge>}
      </div>

      {/* 도라 / 뒷도라 표시패 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ivory/50">도라 표시패</span>
          <div className="flex gap-1">
            {hand.doraIndicators.map((d, i) => (
              <Tile key={i} index={d} size="sm" />
            ))}
          </div>
        </div>
        {hand.riichi && hand.uraIndicators.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-sky-400/70">뒷도라 표시패</span>
            <div className="flex gap-1">
              {hand.uraIndicators.map((d, i) => (
                <Tile key={i} index={d} size="sm" ura />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 손패 */}
      <div className="flex flex-wrap items-end gap-1">
        {sortedClosed.map((t, i) => (
          <Tile key={`c${i}`} index={t} />
        ))}
        {/* 화료패 */}
        <div className="ml-1.5 flex flex-col items-center">
          <Tile index={hand.winningTile} highlight />
        </div>
        {/* 후로 */}
        {hand.openMelds.map((m, mi) => (
          <div key={`m${mi}`} className="ml-2 flex items-end gap-0.5 rounded-md bg-ivory/5 p-1">
            {m.tiles.map((t, ti) => (
              <Tile
                key={ti}
                index={t}
                size="sm"
                dim={!m.open}
                rotated={m.open && ti === m.rotatedIndex}
              />
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
