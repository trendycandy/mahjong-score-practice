import { tileFaceFile } from '../engine/tiles'

// public/tiles 의 SVG 경로 (GitHub Pages base 경로 자동 반영)
const TILE_DIR = `${import.meta.env.BASE_URL}tiles/`
const FRONT = `${TILE_DIR}Front.svg`

// 타일 본체 비율 3:4 (원본 300x400)
const DIM = {
  sm: { w: 33, h: 44 },
  md: { w: 42, h: 56 },
} as const

export default function Tile({
  index,
  size = 'md',
  highlight = false,
  ura = false,
  dim = false,
  rotated = false,
  fluid = false,
}: {
  index: number
  size?: 'sm' | 'md'
  highlight?: boolean
  ura?: boolean
  dim?: boolean
  rotated?: boolean
  fluid?: boolean
}) {
  const face = `${TILE_DIR}${tileFaceFile(index)}.svg`

  const cardCls = [
    'relative overflow-hidden rounded-[5px] shadow-sm',
    ura ? 'ring-2 ring-sky-400' : highlight ? 'ring-2 ring-dora' : '',
    dim ? 'opacity-50' : '',
  ].join(' ')

  // 카드 본체. fluid면 부모(슬롯)를 꽉 채움, 아니면 고정 px.
  const card = (
    <div
      className={[cardCls, fluid ? 'h-full w-full' : ''].join(' ')}
      style={fluid ? undefined : { width: DIM[size].w, height: DIM[size].h }}
    >
      <img src={FRONT} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
      <img src={face} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
    </div>
  )

  if (fluid) {
    // 폭은 부모 행이 주입한 --u 기준. 똑바른 패: 폭 u, 높이 aspect-[3/4].
    if (!rotated) {
      return (
        <span className="block aspect-[3/4]" style={{ width: 'var(--u)' }}>
          {card}
        </span>
      )
    }
    // 회전 패: 슬롯 폭 u*4/3 · 높이 u. 내부 카드(u × u*4/3)를 90° 회전해 중앙 정렬.
    return (
      <span
        className="relative block"
        style={{ width: 'calc(var(--u) * 4 / 3)', height: 'var(--u)' }}
      >
        <span
          className="absolute inset-0 m-auto rotate-90"
          style={{ width: 'var(--u)', height: 'calc(var(--u) * 4 / 3)' }}
        >
          {card}
        </span>
      </span>
    )
  }

  // ── 기존 고정 px 모드 (도라/뒷도라 표시패) ──
  if (!rotated) return <span className="inline-flex shrink-0 align-bottom">{card}</span>

  const { w, h } = DIM[size]
  return (
    <span className="relative inline-flex shrink-0 align-bottom" style={{ width: h, height: w }}>
      <span className="absolute inset-0 m-auto rotate-90" style={{ width: w, height: h }}>
        {card}
      </span>
    </span>
  )
}
