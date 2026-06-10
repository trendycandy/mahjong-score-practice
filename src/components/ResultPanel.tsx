import type { Hand, Scored, Guess } from '../types'
import { grade } from '../engine/score'
import { fuBreakdown } from '../engine/fu'
import { yakuKo, LIMIT_KO } from '../engine/yakuNames'

function fmtPoints(hand: Hand, s: Scored): string {
  const isOya = hand.jikaze === 27 // 자풍 동 = 친(부모)
  if (!hand.isTsumo) return `론 ${s.ten.toLocaleString()}점 (방총자 지불)`
  if (s.payments) {
    // 엔진 payments: oya=친 몫(base×2), ko=자 몫(base×1)
    if (isOya) return `쯔모 ${s.payments.oya.toLocaleString()} ALL (합 ${s.ten.toLocaleString()})`
    return `쯔모 ${s.payments.ko.toLocaleString()}/${s.payments.oya.toLocaleString()} (합 ${s.ten.toLocaleString()})`
  }
  return `${s.ten.toLocaleString()}점`
}

function Mark({ ok }: { ok: boolean }) {
  return <span className={ok ? 'text-jade' : 'text-miss'}>{ok ? '✓' : '✗'}</span>
}

function Row({ label, ok, your, answer }: { label: string; ok: boolean; your: string; answer: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-ivory/5 px-3 py-2 text-sm">
      <span className="text-ivory/60">{label}</span>
      <span className="flex items-center gap-2 font-num">
        <span className={ok ? 'text-ivory/90' : 'text-miss line-through'}>{your}</span>
        {!ok && <span className="text-jade">{answer}</span>}
        <Mark ok={ok} />
      </span>
    </div>
  )
}

export default function ResultPanel({
  hand,
  scored,
  guess,
  onNext,
}: {
  hand: Hand
  scored: Scored
  guess: Guess
  onNext: () => void
}) {
  const g = grade(scored, guess)
  const limitKo = scored.limitName ? LIMIT_KO[scored.limitName] ?? scored.limitName : ''
  const yakuList = Object.entries(scored.yaku)
  const fuDetail = g.fuApplies ? fuBreakdown(hand, scored) : null

  return (
    <div className="reveal space-y-4">
      <div
        className={`rounded-lg border px-4 py-3 text-center text-lg font-bold ${
          g.correct ? 'border-jade/50 bg-jade/10 text-jade' : 'border-miss/50 bg-miss/10 text-miss'
        }`}
      >
        {g.correct ? '정답' : '오답'}
      </div>

      {scored.canWin ? (
        <div className="space-y-3">
          {/* 정답 요약 */}
          <div className="flex items-baseline justify-between rounded-lg bg-ivory/5 px-4 py-3">
            <div className="font-num text-2xl font-bold text-ivory">
              {scored.isYakuman ? '역만' : `${scored.han}판`}
              {g.fuApplies && <span className="ml-2 text-base text-ivory/60">{scored.fu}부</span>}
            </div>
            <div className="text-right">
              {limitKo && <div className="text-sm font-medium text-dora">{limitKo}</div>}
              <div className="font-num text-lg font-bold text-jade">{fmtPoints(hand, scored)}</div>
            </div>
          </div>

          {/* 내 답안 항목별 정오 (역 없음으로 답한 경우는 제외) */}
          {!guess.noYaku && (
            <div className="space-y-1">
              <Row
                label="판"
                ok={g.hanOk}
                your={`${guess.han ?? '-'}판`}
                answer={scored.isYakuman ? '역만' : `${scored.han}판`}
              />
              {g.fuApplies && (
                <Row label="부" ok={g.fuOk} your={`${guess.fu ?? '-'}부`} answer={`${scored.fu}부`} />
              )}
              <Row
                label="점수"
                ok={g.pointsOk}
                your={`${(guess.points ?? 0).toLocaleString()}`}
                answer={`${scored.ten.toLocaleString()}`}
              />
            </div>
          )}
          {guess.noYaku && (
            <div className="rounded bg-miss/10 px-3 py-2 text-sm text-miss">
              '역 없음'으로 답했지만 이 손패는 화료할 수 있습니다.
            </div>
          )}

          {/* 부수 해설 */}
          {fuDetail && (
            <div>
              <div className="mb-1.5 text-xs text-ivory/50">부수 해설</div>
              <div className="rounded bg-ivory/5 px-3 py-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-num text-ivory/80">
                  {fuDetail.components.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-ivory/30">+</span>}
                      <span className="text-ivory/60">{c.label}</span>
                      <span className="font-bold">{c.fu}부</span>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1.5 border-t border-ivory/10 pt-2 font-num">
                  {fuDetail.raw !== fuDetail.total ? (
                    <>
                      <span className="text-ivory/60">합 {fuDetail.raw}부</span>
                      <span className="text-ivory/30">→ 올림</span>
                      <span className="font-bold text-jade">{fuDetail.total}부</span>
                    </>
                  ) : (
                    <span className="font-bold text-jade">총 {fuDetail.total}부</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 역 구성 */}
          <div>
            <div className="mb-1.5 text-xs text-ivory/50">역 구성</div>
            <div className="space-y-1">
              {yakuList.map(([k, v]) => (
                <div key={k} className="flex justify-between rounded bg-ivory/5 px-3 py-1.5 text-sm">
                  <span className="text-ivory/90">{yakuKo(k)}</span>
                  <span className="font-num font-bold text-ivory/70">{scored.isYakuman ? '역만' : `${v}판`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-ivory/5 px-4 py-3 text-sm text-ivory/70">
          형태는 완성됐지만 <span className="font-bold text-dora">성립하는 역이 없어</span> 화료할 수 없습니다.
          도라만으로는 날 수 없다는 점에 주의.
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full rounded-lg bg-jade py-3 font-bold text-felt transition active:scale-[.98]"
      >
        다음 문제
      </button>
    </div>
  )
}
