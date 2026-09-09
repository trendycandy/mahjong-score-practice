import { useEffect } from 'react'
import type { Answer, Cell, Explanation, TableGrade, TableInput } from '../engine/scoreTable'
import { cellLabel, formatAnswer, inputFields, SEAT_KO, WIN_KO } from '../engine/scoreTable'

function formatInput(cell: Cell, input: TableInput): string {
  const f = inputFields(cell)
  if (f.length === 2) return `${input.ko ?? '-'} / ${input.oya ?? '-'}`
  if (f[0] === 'oya') return `${input.oya ?? '-'} ALL`
  return `${input.total ?? '-'}`
}

export default function TableResult({
  cell,
  expected,
  input,
  grade,
  explanation,
  onNext,
}: {
  cell: Cell
  expected: Answer
  input: TableInput
  grade: TableGrade
  explanation: Explanation
  onNext: () => void
}) {
  // Enter 로 다음 문제
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onNext()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onNext])

  const twoFields = inputFields(cell).length === 2

  return (
    <div className="space-y-4">
      {/* 판정 + 값 비교 */}
      <div className={`rounded-lg border p-3 ${grade.correct ? 'border-jade/40 bg-jade/10' : 'border-dora/40 bg-dora/10'}`}>
        <div className={`text-sm font-bold ${grade.correct ? 'text-jade' : 'text-dora'}`}>
          {grade.correct ? '정답' : '오답'} · {cellLabel(cell)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-ivory/50">내 답</div>
            <div className="font-num text-ivory/80">{formatInput(cell, input)}</div>
            {twoFields && !grade.correct && (
              <div className="mt-0.5 text-xs text-ivory/50">
                자 몫 {grade.koOk ? '○' : '✕'} · 친 몫 {grade.oyaOk ? '○' : '✕'}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-ivory/50">정답</div>
            <div className="font-num text-lg font-bold text-jade">{formatAnswer(cell, expected)}</div>
          </div>
        </div>
      </div>

      {/* 팁 */}
      <ul className="space-y-1.5 text-sm text-ivory/80">
        {explanation.tips.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-dora">▸</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>

      {/* 같은 열(부수) 미니 표 */}
      <div>
        <div className="mb-1.5 text-xs text-ivory/50">
          {cell.limit ? '만관 이상' : `${cell.fu}부`} · {SEAT_KO[cell.seat]} {WIN_KO[cell.win]}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {explanation.column.map((r) => (
                <tr key={r.label} className={r.current ? 'bg-jade/15 text-jade' : 'text-ivory/70'}>
                  <td className="py-1 pl-2 pr-3 font-medium">{r.label}</td>
                  <td className="py-1 pr-2 text-right font-num">{formatAnswer(cell, r.answer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 같은 점수 칸 */}
      {explanation.sameValue.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs text-ivory/50">같은 점수인 칸</div>
          <div className="flex flex-wrap gap-1.5">
            {explanation.sameValue.map((c) => (
              <span key={cellLabel(c)} className="rounded-full border border-ivory/15 bg-ivory/5 px-2.5 py-1 text-xs text-ivory/70">
                {cellLabel(c)}
              </span>
            ))}
          </div>
        </div>
      )}

      <button onClick={onNext} className="w-full rounded-lg bg-jade py-3 font-bold text-felt transition active:scale-[.98]">
        다음 문제
      </button>
    </div>
  )
}
