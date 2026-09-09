import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Answer, Cell, CellFilter, Explanation, Limit, TableGrade, TableInput } from '../engine/scoreTable'
import {
  LIMITS,
  LIMIT_KO,
  STAGES,
  cellKey,
  cellLabel,
  cellsFor,
  computeAnswer,
  explain,
  gradeAnswer,
  inputFields,
  isValidCell,
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
  disabled = false,
  onClick,
  children,
}: {
  on: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  const base = 'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30'
  const cls = on ? 'border-jade bg-jade/20 text-jade' : 'border-ivory/15 text-ivory/60 hover:border-ivory/40'
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${cls}`}>
      {children}
    </button>
  )
}

export type DrillVariant = 'practice' | 'exam'

const EXAM_STAGE = STAGES[STAGES.length - 1] // 전체 무작위

export default function TableDrill({
  variant,
  initialStageId,
  onResult,
}: {
  variant: DrillVariant
  initialStageId?: string   // 연습: 바둑판(StagePicker)에서 고른 단계. 실전은 무시(전체 무작위).
  onResult: (correct: boolean) => void
}) {
  const isExam = variant === 'exam'
  const stage = isExam ? EXAM_STAGE : (STAGES.find((s) => s.id === initialStageId) ?? STAGES[0])
  const [showHint, setShowHint] = useState(false)
  const misses = useRef(new Map<string, number>())

  const filter: CellFilter = stage.filter
  const cells = cellsFor(filter)

  const [cell, setCell] = useState<Cell | null>(() => pickCell(cellsFor(filter), new Map()))
  const [result, setResult] = useState<Result | null>(null)

  const nextFrom = useCallback((f: CellFilter, prev: Cell | null) => {
    const pool = cellsFor(f)
    setCell(pool.length ? pickCell(pool, misses.current, prev ? cellKey(prev) : undefined) : null)
    setResult(null)
    setShowHint(false)
  }, [])

  // 판수 라디오(연습): 현재 문제를 같은 자/친·론/쯔모·부수의 다른 판으로 바꿈. 만관 이상 칸이면 만관~역만 라디오.
  const switchTo = (c: Cell) => {
    setCell(c)
    setResult(null)
    setShowHint(false)
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
  const hintTips = cell && showHint ? explain(cell, computeAnswer(cell)).tips : []

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* 단계 소개 (층 이동은 헤더의 「이전」「홈」) */}
      <div className="text-xs text-ivory/50">
        <span className="font-medium text-ivory/80">{isExam ? '실전' : stage.title}</span>
        {isExam ? <span> · 전체 무작위 · 힌트 없음</span> : <span> · {stage.hint}</span>}
        <span> · {cells.length}칸</span>
      </div>

      {/* 판수 라디오 — 연습 모드. 현재 문제의 판을 가리키며, 누르면 그 판 문제로 바뀜 */}
      {!isExam && cell && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-felt/60 p-3 ring-1 ring-ivory/10">
          <span className="mr-1 text-xs text-ivory/50">{cell.limit ? '등급' : '판수'}</span>
          {cell.limit
            ? LIMITS.map((l: Limit) => (
                <Chip key={l} on={cell.limit === l} onClick={() => switchTo({ ...cell, limit: l })}>
                  {LIMIT_KO[l]}
                </Chip>
              ))
            : [1, 2, 3, 4].map((h) => {
                const target: Cell = { ...cell, han: h }
                return (
                  <Chip key={h} on={cell.han === h} disabled={!isValidCell(target)} onClick={() => switchTo(target)}>
                    {h}판
                  </Chip>
                )
              })}
        </div>
      )}

      {/* 문제 카드 */}
      {cell ? (
        <div className="rounded-xl bg-felt/60 p-4 text-center ring-1 ring-ivory/10">
          <div className="text-xs text-ivory/50">이 칸의 점수는?</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-ivory">{cellLabel(cell)}</div>
          <div className="mt-1 text-xs text-ivory/50">{PROMPT[promptKey]}</div>
          {!isExam && !result && (
            <div className="mt-3">
              {showHint ? (
                <ul className="space-y-1 text-left text-xs text-ivory/70">
                  {hintTips.map((t, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-dora">▸</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="rounded-full border border-dora/40 px-3 py-1 text-xs font-medium text-dora transition hover:bg-dora/10 active:scale-95"
                >
                  힌트 보기
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-felt/60 p-4 text-center text-sm text-ivory/50 ring-1 ring-ivory/10">
          선택한 범위에 칸이 없습니다.
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
