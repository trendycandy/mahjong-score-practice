import { useState } from 'react'
import { generateQuestion } from './engine/generate'
import type { Generated } from './engine/generate'
import { grade } from './engine/score'
import type { Guess } from './types'
import HandDisplay from './components/HandDisplay'
import AnswerForm from './components/AnswerForm'
import ResultPanel from './components/ResultPanel'

export default function App() {
  const [q, setQ] = useState<Generated>(() => generateQuestion(true))
  const [guess, setGuess] = useState<Guess | null>(null)
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 })
  const [showScore, setShowScore] = useState(false)

  const onAnswer = (g: Guess) => {
    setGuess(g)
    const ok = grade(q.scored, g).correct
    setStats((p) => ({
      correct: p.correct + (ok ? 1 : 0),
      total: p.total + 1,
      streak: ok ? p.streak + 1 : 0,
    }))
  }

  const next = () => {
    setQ(generateQuestion(true))
    setGuess(null)
  }

  const scoreTableSrc = `${import.meta.env.BASE_URL}score.png`

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] landscape:max-w-2xl">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-base font-bold tracking-tight">
          리치마작 점수계산 <span className="text-jade">연습</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-right font-num text-xs text-ivory/50">
            <div>정답 {stats.correct}/{stats.total}</div>
            {stats.streak > 1 && <div className="text-dora">연속 {stats.streak}</div>}
          </div>
          <button
            onClick={() => setShowScore(true)}
            className="rounded-md border border-ivory/20 px-3 py-1.5 text-sm font-medium text-ivory/80 transition hover:border-jade hover:text-jade active:scale-95"
          >
            점수표
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 rounded-2xl bg-surface p-4 ring-1 ring-ivory/5">
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
      </main>

      <footer className="mt-4 text-center text-xs text-ivory/30">
        채점 엔진: riichi-ts
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
