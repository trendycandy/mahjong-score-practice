import { Riichi } from 'riichi-ts'
import type { Hand, Scored, Guess, GradeResult } from '../types'
import { doraFromIndicator } from './tiles'

// riichi-ts 호출 규약(컨테이너에서 검증):
//  - 생성자: new Riichi(closedPart, openMelds, options, ronTile?, firstTake, riichi, ippatsu, doubleRiichi, lastTile, afterKan, akaCount, allowAka, allowKuitan, withKiriage)
//  - 쯔모: closedPart 에 화료패를 "마지막"에 둔 14장, ronTile = undefined
//  - 론  : closedPart = 13장, ronTile = 화료패
//  - dora 옵션에는 "표시패"를 넣으면 엔진이 실제 도라를 계산
//  - 주의: options.riichi/ippatsu 는 무시됨 → 반드시 positional 인자로 전달

export function scoreHand(hand: Hand): Scored {
  // riichi-ts 의 dora 인자는 "표시패"가 아니라 "실제 도라패"를 받는다 → indicator 를 직접 변환해 전달.
  // 뒷도라는 리치일 때만 유효하며, riichi-ts 엔진에 뒷도라 개념이 없으므로 실제 도라패에 합쳐 가산한다.
  const doraTiles = hand.doraIndicators.map(doraFromIndicator)
  const uraTiles = hand.riichi ? hand.uraIndicators.map(doraFromIndicator) : []
  const options = {
    bakaze: hand.bakaze,
    jikaze: hand.jikaze,
    dora: [...doraTiles, ...uraTiles],
  }
  const ronTile = hand.isTsumo ? undefined : hand.winningTile

  const r = new Riichi(
    // riichi-ts 는 closed 배열에 ronTile 을 push 하여 원본을 변형함 → 반드시 복사본 전달
    [...hand.closed],
    hand.openMelds.map((m) => ({ open: m.open, tiles: [...m.tiles] })),
    options,
    ronTile,
    false,            // firstTake
    hand.riichi,      // riichi (positional!)
    hand.ippatsu,     // ippatsu (positional!)
  )
  const res = r.calc()

  const isAgari = res.isAgari ?? false
  const ten = res.ten ?? 0
  const isYakuman = (res.yakuman ?? 0) > 0
  return {
    isAgari,
    canWin: isAgari && (ten > 0 || isYakuman),
    yaku: res.yaku ?? {},
    han: res.han ?? 0,
    fu: res.fu ?? 0,
    ten,
    payments: res.outgoingTen,
    limitName: res.name ?? '',
    isYakuman,
  }
}

// 답안 채점. 판/부/점수 항목별 정오 + 전체 정답 여부.
export function grade(scored: Scored, g: Guess): GradeResult {
  const fuApplies = scored.canWin && !scored.isYakuman && scored.han < 5

  if (!scored.canWin) {
    // 역 없음이 정답 → '역 없음' 버튼을 눌러야 정답
    return { correct: g.noYaku, hanOk: false, fuOk: false, pointsOk: false, fuApplies: false }
  }
  if (g.noYaku) {
    return { correct: false, hanOk: false, fuOk: false, pointsOk: false, fuApplies }
  }

  const hanOk = scored.isYakuman ? (g.han ?? 0) >= 13 : g.han === scored.han
  const fuOk = !fuApplies ? true : g.fu === scored.fu
  const pointsOk = g.points === scored.ten
  return { correct: hanOk && fuOk && pointsOk, hanOk, fuOk, pointsOk, fuApplies }
}
