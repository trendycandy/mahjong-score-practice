import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Answer, Cell, CellFilter, Explanation, Seat, TableGrade, TableInput, WinType } from '../engine/scoreTable'
import {
  FU_LIST,
  STAGES,
  STAGE_GROUPS,
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

// 자/친·론/쯔모 토글. 마지막 하나는 끌 수 없음(범위가 비지 않게).
function toggleKeepOne<T>(arr: T[], v: T): T[] {
  if (!arr.includes(v)) return [...arr, v]
  return arr.length > 1 ? arr.filter((x) => x !== v) : arr
}

export type DrillVariant = 'practice' | 'exam'

const EXAM_STAGE = STAGES[STAGES.length - 1] // 전체 무작위

export default function TableDrill({
  variant,
  onResult,
  onBack,
}: {
  variant: DrillVariant
  onResult: (correct: boolean) => void
  onBack: () => void
}) {
  const isExam = variant === 'exam'
  const initial = isExam ? EXAM_STAGE : STAGES[0]
  // 연습은 바둑판(단계 선택)에서 시작, 실전은 바로 문제
  const [view, setView] = useState<'pick' | 'drill'>(isExam ? 'drill' : 'pick')
  const [stageId, setStageId] = useState<string | null>(initial.id)
  const [filter, setFilter] = useState<CellFilter>(initial.filter)
  const [showHint, setShowHint] = useState(false)
  const misses = useRef(new Map<string, number>())
  const [cell, setCell] = useState<Cell | null>(() => pickCell(cellsFor(initial.filter), new Map()))
  const [result, setResult] = useState<Result | null>(null)

  const cells = cellsFor(filter)
  const stage = STAGES.find((s) => s.id === stageId) ?? null

  const nextFrom = useCallback((f: CellFilter, prev: Cell | null) => {
    const pool = cellsFor(f)
    setCell(pool.length ? pickCell(pool, misses.current, prev ? cellKey(prev) : undefined) : null)
    setResult(null)
    setShowHint(false)
  }, [])

  const applyStage = (id: string) => {
    const s = STAGES.find((x) => x.id === id)
    if (!s) return
    setStageId(id)
    setFilter(s.filter)
    nextFrom(s.filter, cell)
    setView('drill')
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
  const hintTips = cell && showHint ? explain(cell, computeAnswer(cell)).tips : []

  // ── 연습: 단계 선택 바둑판 ──
  if (view === 'pick') {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-ivory/50">
          <span className="font-medium text-ivory/80">단계를 고르세요</span>
          <button onClick={onBack} className="underline decoration-ivory/30 hover:text-ivory/80">
            모드 바꾸기
          </button>
        </div>
        {STAGE_GROUPS.map((g) => (
          <div key={g}>
            <div className="mb-1.5 text-xs font-medium text-ivory/60">{g}</div>
            <div className="grid grid-cols-2 gap-2 landscape:grid-cols-3">
              {STAGES.filter((s) => s.group === g).map((s) => {
                const n = cellsFor(s.filter).length
                const on = s.id === stageId
                return (
                  <button
                    key={s.id}
                    onClick={() => applyStage(s.id)}
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

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* 단계 소개 + 단계/모드 바꾸기 */}
      <div className="flex items-start justify-between gap-2 text-xs text-ivory/50">
        <div>
          <span className="font-medium text-ivory/80">{isExam ? '실전' : stage ? stage.title : '자유 선택'}</span>
          {isExam ? <span> · 전체 무작위 · 힌트 없음</span> : stage && <span> · {stage.hint}</span>}
          <span> · {cells.length}칸</span>
        </div>
        <div className="flex shrink-0 gap-2">
          {!isExam && (
            <button onClick={() => setView('pick')} className="underline decoration-ivory/30 hover:text-ivory/80">
              단계 바꾸기
            </button>
          )}
          <button onClick={onBack} className="underline decoration-ivory/30 hover:text-ivory/80">
            모드 바꾸기
          </button>
        </div>
      </div>

      {/* 범위 조정 — 연습 모드에서 항상 표시 */}
      {!isExam && (
        <div className="space-y-2 rounded-lg bg-felt/60 p-3 ring-1 ring-ivory/10">
          <div className="flex flex-wrap gap-1.5">
            {(['ko', 'oya'] as Seat[]).map((s) => (
              <Chip key={s} on={filter.seats.includes(s)} onClick={() => updateFilter({ seats: toggleKeepOne(filter.seats, s) })}>
                {s === 'ko' ? '자' : '친'}
              </Chip>
            ))}
            <span className="w-2" />
            {(['ron', 'tsumo'] as WinType[]).map((w) => (
              <Chip key={w} on={filter.wins.includes(w)} onClick={() => updateFilter({ wins: toggleKeepOne(filter.wins, w) })}>
                {w === 'ron' ? '론' : '쯔모'}
              </Chip>
            ))}
          </div>
          {/* 부수는 라디오: 누른 것 하나만 선택(단계 프리셋은 여러 개일 수 있음). 「만관 이상」도 같은 줄의 선택지. */}
          <div className="flex flex-wrap gap-1.5">
            {FU_LIST.map((f) => (
              <Chip key={f} on={filter.fus.includes(f)} onClick={() => updateFilter({ fus: [f], limits: false })}>
                {f}부
              </Chip>
            ))}
            <Chip on={filter.limits} onClick={() => updateFilter({ fus: [], limits: true })}>
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
