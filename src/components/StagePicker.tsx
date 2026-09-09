import { STAGES, STAGE_GROUPS, cellsFor } from '../engine/scoreTable'

// 연습 단계 선택 바둑판. 그룹(자 론 · 자 쯔모 · 친 론 · 친 쯔모 · 기타)별 2열(가로 3열).
export default function StagePicker({ current, onPick }: { current: string | null; onPick: (id: string) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="text-xs font-medium text-ivory/80">단계를 고르세요</div>
      {STAGE_GROUPS.map((g) => (
        <div key={g}>
          <div className="mb-1.5 text-xs font-medium text-ivory/60">{g}</div>
          <div className="grid grid-cols-2 gap-2 landscape:grid-cols-3">
            {STAGES.filter((s) => s.group === g).map((s) => {
              const n = cellsFor(s.filter).length
              const on = s.id === current
              return (
                <button
                  key={s.id}
                  onClick={() => onPick(s.id)}
                  className={`rounded-lg border p-2.5 text-left transition active:scale-[.98] ${
                    on ? 'border-jade bg-jade/15' : 'border-ivory/15 bg-felt/40 hover:border-ivory/40'
                  }`}
                >
                  <div className={`text-sm font-bold ${on ? 'text-jade' : 'text-ivory'}`}>{s.title}</div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ivory/50">
                    {s.hint} · {n}칸
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
