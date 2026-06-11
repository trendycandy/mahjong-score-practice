// 리치봉(리치 막대): 아이보리 막대 + 중앙 빨간 점. 크기는 손패 --u 연동.
export default function RiichiStick() {
  return (
    <span
      className="inline-block shrink-0"
      style={{ width: 'calc(var(--u) * 2.6)', height: 'calc(var(--u) * 0.6)' }}
      aria-label="리치봉"
      title="리치 선언"
    >
      <svg viewBox="0 0 130 30" className="h-full w-full">
        <rect
          x="2"
          y="2"
          width="126"
          height="26"
          rx="13"
          className="fill-ivory stroke-black/10"
          strokeWidth="2"
        />
        <circle cx="65" cy="15" r="6" className="fill-dora" />
      </svg>
    </span>
  )
}
