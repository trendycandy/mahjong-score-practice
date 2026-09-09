import { useState } from 'react'
import { generateQuestion } from './engine/generate'
import type { Generated } from './engine/generate'
import { grade } from './engine/score'
import type { Guess } from './types'
import HandDisplay from './components/HandDisplay'
import AnswerForm from './components/AnswerForm'
import ResultPanel from './components/ResultPanel'
import TableDrill from './components/TableDrill'
import type { DrillVariant } from './components/TableDrill'

// hand: 손패 연습 / table-select: 연습·실전 선택 화면 / practice·exam: 점수표 연습 모드
type Mode = 'hand' | 'table-select' | DrillVariant
interface Stats {
  correct: number
  total: number
  streak: number
}
const ZERO: Stats = { correct: 0, total: 0, streak: 0 }
const bump = (p: Stats, ok: boolean): Stats => ({
  correct: p.correct + (ok ? 1 : 0),
  total: p.total + 1,
  streak: ok ? p.streak + 1 : 0,
})

export default function App() {
  const [mode, setMode] = useState<Mode>('hand')
  const [q, setQ] = useState<Generated>(() => generateQuestion(true))
  const [guess, setGuess] = useState<Guess | null>(null)
  const [stats, setStats] = useState<Stats>(ZERO)
  const [practiceStats, setPracticeStats] = useState<Stats>(ZERO)
  const [examStats, setExamStats] = useState<Stats>(ZERO)
  const [showScore, setShowScore] = useState(false)

  const onAnswer = (g: Guess) => {
    setGuess(g)
    setStats((p) => bump(p, grade(q.scored, g).correct))
  }

  const next = () => {
    setQ(generateQuestion(true))
    setGuess(null)
  }

  const scoreTableSrc = `${import.meta.env.BASE_URL}score.png`
  const shown = mode === 'hand' ? stats : mode === 'exam' ? examStats : practiceStats
  const titleMain = mode === 'hand' ? '리치마작 점수계산' : '점수표'
  const titleTag = mode === 'exam' ? '실전' : '연습'

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] landscape:max-w-2xl">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-base font-bold tracking-tight">
          {titleMain} <span className="text-jade">{titleTag}</span>
        </h1>
        <div className="flex items-center gap-2">
          {mode !== 'table-select' && (
            <div className="text-right font-num text-xs text-ivory/50">
              <div>정답 {shown.correct}/{shown.total}</div>
              {shown.streak > 1 && <div className="text-dora">연속 {shown.streak}</div>}
            </div>
          )}
          <button
            onClick={() => setMode(mode === 'hand' ? 'table-select' : 'hand')}
            className="rounded-md border border-jade/40 px-3 py-1.5 text-sm font-medium text-jade transition hover:border-jade active:scale-95"
          >
            {mode === 'hand' ? '점수표 연습' : '손패 연습'}
          </button>
          <button
            onClick={() => setShowScore(true)}
            className="rounded-md border border-ivory/20 px-3 py-1.5 text-sm font-medium text-ivory/80 transition hover:border-jade hover:text-jade active:scale-95"
          >
            점수표
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 rounded-2xl bg-surface p-4 ring-1 ring-ivory/5">
        {mode === 'hand' ? (
          <>
            <section>
              <div className="mb-3 text-sm font-medium text-ivory/70">이 화료의 점수는?</div>
              <HandDisplay hand={q.hand} />
            </section>
            <section className="mt-auto">
              {guess ? (
                <ResultPanel hand={q.hand} scored={q.scored} guess={guess} onNext={next} />
              ) : (
                <AnswerForm onAnswer={onAnswer} />
              )}
            </section>
          </>
        ) : mode === 'table-select' ? (
          <section className="flex flex-1 flex-col justify-center gap-3">
            <div className="mb-1 text-center text-sm font-medium text-ivory/70">어떻게 연습할까요?</div>
            <button
              onClick={() => setMode('practice')}
              className="rounded-xl border border-jade/40 bg-jade/10 p-4 text-left transition hover:border-jade active:scale-[.99]"
            >
              <div className="text-lg font-bold text-jade">연습</div>
              <div className="mt-1 text-xs text-ivory/60">단계별 출제 · 범위 조정 · 힌트 보기 · 채점 후 해설</div>
            </button>
            <button
              onClick={() => setMode('exam')}
              className="rounded-xl border border-dora/40 bg-dora/10 p-4 text-left transition hover:border-dora active:scale-[.99]"
            >
              <div className="text-lg font-bold text-dora">실전</div>
              <div className="mt-1 text-xs text-ivory/60">점수표 전 칸 무작위 · 힌트 없음 · 채점 후 해설</div>
            </button>
          </section>
        ) : (
          <TableDrill
            key={mode}
            variant={mode}
            onResult={(ok) => (mode === 'practice' ? setPracticeStats : setExamStats)((p) => bump(p, ok))}
            onBack={() => setMode('table-select')}
          />
        )}
      </main>

      <footer className="mt-4 text-center text-xs text-ivory/30">
        {mode === 'hand' ? '채점 엔진: riichi-ts' : '기준: 첨부 점수표 (끼리아게 없음)'}
      </footer>

      {/* 점수표 팝업 */}
      {showScore && (
        <div
          onClick={() => setShowScore(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-3xl overflow-auto rounded-xl bg-surface p-2 ring-1 ring-ivory/10"
          >
            <button
              onClick={() => setShowScore(false)}
              aria-label="닫기"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-felt/80 text-ivory/80 ring-1 ring-ivory/15 transition hover:text-jade active:scale-95"
            >
              ✕
            </button>
            <img src={scoreTableSrc} alt="점수표" className="block h-auto w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}
