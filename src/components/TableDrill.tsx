import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Answer, Cell, CellFilter, Explanation, Seat, TableGrade, TableInput, WinType } from '../engine/scoreTable'
import {
  FU_LIST,
  STAGES,
  cellKey,
  cellLabel,
  cellsFor,
  computeAnswer,
  explain,
  gradeAnswer,
  inputFields,
  pickCell,
} from '../engine/scoreTable'
import TableAnswerForm from './TableAnswerForm'
import TableResult from './TableResult'

interface Result {
  expected: Answer
  input: TableInput
  grade: TableGrade
  explanation: Explanation
}

const PROMPT: Record<string, string> = {
  total: '방총자가 내는 점수를 입력',
  ko: '자 1인 · 친이 내는 점수를 각각 입력',
  oya: '3명이 각각 내는 점수(ALL)를 입력',
}

function Chip({
  on,
  onClick,
  children,
  tone = 'plain',
}: {
  on: boolean
  onClick: () => void
  children: ReactNode
  tone?: 'plain' | 'stage'
}) {
  const base = 'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95'
  const cls = on
    ? tone === 'stage'
      ? 'border-jade bg-jade/20 text-jade'
      : 'border-ivory/60 bg-ivory/15 text-ivory'
    : 'border-ivory/15 text-ivory/60 hover:border-ivory/40'
  return (
    <button onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  )
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

export default function TableDrill({ onResult }: { onResult: (correct: boolean) => void }) {
  const [stageId, setStageId] = useState<string | null>(STAGES[0].id)
  const [filter, setFilter] = useState<CellFilter>(STAGES[0].filter)
  const [showFilter, setShowFilter] = useState(false)
  const misses = useRef(new Map<string, number>())
  const [cell, setCell] = useState<Cell | null>(() => pickCell(cellsFor(STAGES[0].filter), new Map()))
  const [result, setResult] = useState<Result | null>(null)

  const cells = cellsFor(filter)
  const stage = STAGES.find((s) => s.id === stageId) ?? null

  const nextFrom = useCallback((f: CellFilter, prev: Cell | null) => {
    const pool = cellsFor(f)
    setCell(pool.length ? pickCell(pool, misses.current, prev ? cellKey(prev) : undefined) : null)
    setResult(null)
  }, [])

  const applyStage = (id: string) => {
    const s = STAGES.find((x) => x.id === id)
    if (!s) return
    setStageId(id)
    setFilter(s.filter)
    nextFrom(s.filter, cell)
  }

  const updateFilter = (patch: Partial<CellFilter>) => {
    const f = { ...filter, ...patch }
    setStageId(null) // 자유 선택
    setFilter(f)
    nextFrom(f, cell)
  }

  const onSubmit = (input: TableInput) => {
    if (!cell) return
    const expected = computeAnswer(cell)
    const grade = gradeAnswer(cell, expected, input)
    const k = cellKey(cell)
    if (grade.correct) misses.current.delete(k)
    else misses.current.set(k, (misses.current.get(k) ?? 0) + 1)
    setResult({ expected, input, grade, explanation: explain(cell, expected) })
    onResult(grade.correct)
  }

  const next = useCallback(() => nextFrom(filter, cell), [nextFrom, filter, cell])

  const promptKey = cell ? (inputFields(cell).length === 2 ? 'ko' : inputFields(cell)[0]) : 'total'

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* 단계 칩 (가로 스크롤) */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {STAGES.map((s, i) => (
          <Chip key={s.id} on={s.id === stageId} onClick={() => applyStage(s.id)} tone="stage">
            {i + 1}. {s.title}
          </Chip>
        ))}
      </div>

      {/* 단계 소개 + 범위 조정 토글 */}
      <div className="flex items-start justify-between gap-2 text-xs text-ivory/50">
        <div>
          <span className="font-medium text-ivory/80">{stage ? stage.title : '자유 선택'}</span>
          {stage && <span> · {stage.hint}</span>}
          <span> · {cells.length}칸</span>
        </div>
        <button
          onClick={() => setShowFilter((v) => !v)}
          className="shrink-0 underline decoration-ivory/30 hover:text-ivory/80"
        >
          {showFilter ? '접기' : '범위 조정'}
        </button>
      </div>

      {showFilter && (
        <div className="space-y-2 rounded-lg bg-felt/60 p-3 ring-1 ring-ivory/10">
          <div className="flex flex-wrap gap-1.5">
            {(['ko', 'oya'] as Seat[]).map((s) => (
              <Chip key={s} on={filter.seats.includes(s)} onClick={() => updateFilter({ seats: toggle(filter.seats, s) })}>
                {s === 'ko' ? '자' : '친'}
              </Chip>
            ))}
            <span className="w-2" />
            {(['ron', 'tsumo'] as WinType[]).map((w) => (
              <Chip key={w} on={filter.wins.includes(w)} onClick={() => updateFilter({ wins: toggle(filter.wins, w) })}>
                {w === 'ron' ? '론' : '쯔모'}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FU_LIST.map((f) => (
              <Chip key={f} on={filter.fus.includes(f)} onClick={() => updateFilter({ fus: toggle(filter.fus, f) })}>
                {f}부
              </Chip>
            ))}
            <Chip on={filter.limits} onClick={() => updateFilter({ limits: !filter.limits })}>
              만관 이상
            </Chip>
          </div>
        </div>
      )}

      {/* 문제 카드 */}
      {cell ? (
        <div className="rounded-xl bg-felt/60 p-4 text-center ring-1 ring-ivory/10">
          <div className="text-xs text-ivory/50">이 칸의 점수는?</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-ivory">{cellLabel(cell)}</div>
          <div className="mt-1 text-xs text-ivory/50">{PROMPT[promptKey]}</div>
        </div>
      ) : (
        <div className="rounded-xl bg-felt/60 p-4 text-center text-sm text-ivory/50 ring-1 ring-ivory/10">
          선택한 범위에 칸이 없습니다. 범위를 조정하세요.
        </div>
      )}

      <section className="mt-auto">
        {cell && result ? (
          <TableResult
            cell={cell}
            expected={result.expected}
            input={result.input}
            grade={result.grade}
            explanation={result.explanation}
            onNext={next}
          />
        ) : cell ? (
          <TableAnswerForm cell={cell} onSubmit={onSubmit} />
        ) : null}
      </section>
    </div>
  )
}
