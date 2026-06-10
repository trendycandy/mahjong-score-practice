import { useState } from 'react'
import type { Guess } from '../types'

const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110]
const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

export default function AnswerForm({ onAnswer }: { onAnswer: (g: Guess) => void }) {
  const [han, setHan] = useState<number | null>(null)
  const [fu, setFu] = useState<number | null>(null)
  const [points, setPoints] = useState('')

  const fuApplies = han !== null && han < 5
  const pointsNum = points.trim() === '' ? null : Number(points.replace(/[^0-9]/g, ''))
  const canSubmit =
    han !== null && (!fuApplies || fu !== null) && pointsNum !== null && pointsNum > 0

  const submit = () => {
    if (!canSubmit) return
    onAnswer({ noYaku: false, han, fu: fuApplies ? fu : null, points: pointsNum })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 text-xs text-ivory/50">판 (飜)</div>
        <div className="flex flex-wrap gap-1.5">
          {HAN_OPTIONS.map((h) => (
            <button
              key={h}
              onClick={() => setHan(h)}
              className={`h-9 w-9 rounded-md border text-sm font-num font-bold transition ${
                han === h ? 'border-jade bg-jade/20 text-jade' : 'border-ivory/15 text-ivory/70 hover:border-ivory/40'
              }`}
            >
              {h >= 13 ? '13+' : h}
            </button>
          ))}
        </div>
      </div>

      <div className={han !== null && !fuApplies ? 'opacity-40' : ''}>
        <div className="mb-1.5 text-xs text-ivory/50">
          부 (符) {han !== null && !fuApplies && '· 5판 이상은 부수 무관'}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FU_OPTIONS.map((f) => (
            <button
              key={f}
              disabled={han !== null && !fuApplies}
              onClick={() => setFu(f)}
              className={`h-9 w-11 rounded-md border text-sm font-num font-bold transition ${
                fu === f && fuApplies ? 'border-jade bg-jade/20 text-jade' : 'border-ivory/15 text-ivory/70 hover:border-ivory/40'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs text-ivory/50">점수 (총점)</div>
        <input
          type="text"
          inputMode="numeric"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="예: 7700"
          className="w-full rounded-md border border-ivory/15 bg-felt px-3 py-2.5 font-num text-lg text-ivory placeholder:text-ivory/25 focus:border-jade focus:outline-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="flex-1 rounded-lg bg-jade py-3 font-bold text-felt transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-30"
        >
          채점
        </button>
        <button
          onClick={() => onAnswer({ noYaku: true, han: null, fu: null, points: null })}
          className="rounded-lg border border-dora/50 px-4 py-3 font-medium text-dora transition active:scale-[.98]"
        >
          역 없음
        </button>
      </div>
    </div>
  )
}
