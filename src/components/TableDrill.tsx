import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Answer, Cell, CellFilter, Explanation, TableGrade, TableInput } from '../engine/scoreTable'
import { STAGES, cellKey, cellLabel, cellsFor, computeAnswer, explain, gradeAnswer, inputFields, pickCell } from '../engine/scoreTable'
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

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  const base = 'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95'
  const cls = on ? 'border-ivory/60 bg-ivory/15 text-ivory' : 'border-ivory/15 text-ivory/60 hover:border-ivory/40'
  return (
    <button onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  )
}

export type DrillVariant = 'practice' | 'exam'

const EXAM_STAGE = STAGES[STAGES.length - 1] // 전체 무작위

// 단계에 실제로 있는 판수(유효 칸 기준). 예: 25부 론 = 2·3·4
function stageHans(f: CellFilter): number[] {
  const hans = cellsFor({ ...f, hans: undefined })
    .filter((c) => !c.limit)
    .map((c) => c.han as number)
  return Array.from(new Set(hans)).sort()
}

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
  const availableHans = stageHans(stage.filter)
  const hasLimits = stage.filter.limits

  // 판수 선택(연습): 기본 전부. 만관 이상 포함 단계는 「만관 이상」 칩도 토글. 마지막 하나는 끌 수 없음.
  const [hans, setHans] = useState<number[]>(availableHans)
  const [limitsOn, setLimitsOn] = useState(hasLimits)
  const [showHint, setShowHint] = useState(false)
  const misses = useRef(new Map<string, number>())

  const filter: CellFilter = { ...stage.filter, hans, limits: hasLimits && limitsOn }
  const cells = cellsFor(filter)

  const [cell, setCell] = useState<Cell | null>(() => pickCell(cellsFor(filter), new Map()))
  const [result, setResult] = useState<Result | null>(null)

  const nextFrom = useCallback((f: CellFilter, prev: Cell | null) => {
    const pool = cellsFor(f)
    setCell(pool.length ? pickCell(pool, misses.current, prev ? cellKey(prev) : undefined) : null)
    setResult(null)
    setShowHint(false)
  }, [])

  const selectedCount = hans.length + (limitsOn ? 1 : 0)

  const toggleHan = (h: number) => {
    const on = hans.includes(h)
    if (on && selectedCount <= 1) return // 마지막 하나는 유지
    const nextHans = on ? hans.filter((x) => x !== h) : [...hans, h].sort()
    setHans(nextHans)
    nextFrom({ ...filter, hans: nextHans }, cell)
  }
  const toggleLimits = () => {
    if (limitsOn && selectedCount <= 1) return
    const on = !limitsOn
    setLimitsOn(on)
    nextFrom({ ...filter, limits: on }, cell)
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

      {/* 판수 선택 — 연습 모드에서 항상 표시 */}
      {!isExam && availableHans.length + (hasLimits ? 1 : 0) > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-felt/60 p-3 ring-1 ring-ivory/10">
          <span className="mr-1 text-xs text-ivory/50">판수</span>
          {availableHans.map((h) => (
            <Chip key={h} on={hans.includes(h)} onClick={() => toggleHan(h)}>
              {h}판
            </Chip>
          ))}
          {hasLimits && (
            <Chip on={limitsOn} onClick={toggleLimits}>
              만관 이상
            </Chip>
          )}
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
          선택한 범위에 칸이 없습니다. 판수를 조정하세요.
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
