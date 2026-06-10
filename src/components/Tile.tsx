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
}: {
  index: number
  size?: 'sm' | 'md'
  highlight?: boolean
  ura?: boolean
  dim?: boolean
  rotated?: boolean
}) {
  const { w, h } = DIM[size]
  const face = `${TILE_DIR}${tileFaceFile(index)}.svg`

  const card = (
    <div
      className={[
        'relative overflow-hidden rounded-[5px] shadow-sm',
        ura ? 'ring-2 ring-sky-400' : highlight ? 'ring-2 ring-dora' : '',
        dim ? 'opacity-50' : '',
      ].join(' ')}
      style={{ width: w, height: h }}
    >
      <img src={FRONT} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
      <img src={face} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
    </div>
  )

  if (!rotated) return <span className="inline-flex shrink-0 align-bottom">{card}</span>

  // 꺾어서 표시: 바깥 박스는 가로/세로 교체, 안쪽 카드를 90° 회전해 중앙 정렬
  return (
    <span className="relative inline-flex shrink-0 align-bottom" style={{ width: h, height: w }}>
      <span className="absolute inset-0 m-auto rotate-90" style={{ width: w, height: h }}>
        {card}
      </span>
    </span>
  )
}
