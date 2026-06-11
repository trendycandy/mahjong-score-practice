// 후로(공개 멘쯔) 한 벌
export interface OpenMeld {
  open: boolean      // true=공개(치/퐁/대명깡/가깡), false=안깡
  tiles: number[]    // 타일 인덱스 배열 (3 또는 4장=깡)
  rotatedIndex?: number // 꺾어서 표시할 타일 위치. 안깡(open=false)이면 없음
  added?: boolean    // 가깡(소명깡): 꺾인 패 위에 4번째 타일 스택
}

// 한 문제의 상황(出題)
export interface Hand {
  closed: number[]        // 닫힌패. 쯔모면 화료패가 마지막에 포함된 14장 형태,
                          // 론이면 화료패 제외 형태. (score 어댑터가 처리)
  openMelds: OpenMeld[]
  winningTile: number     // 화료패 인덱스
  isTsumo: boolean
  bakaze: number          // 장풍 (27=동, 28=남)
  jikaze: number          // 자풍 (27..30)
  doraIndicators: number[]// 도라 표시패
  uraIndicators: number[] // 뒷도라 표시패 (리치일 때만 의미 있음)
  riichi: boolean
  ippatsu: boolean
  isMenzen: boolean       // 후로 없음
}

// 채점 결과(정답)
export interface Scored {
  isAgari: boolean              // 형태 완성 여부 (역 유무와 무관)
  canWin: boolean              // 실제 화료 가능 (역 1개 이상 → ten>0)
  yaku: Record<string, number>  // 역 키 → 판수
  han: number
  fu: number
  ten: number                   // 총 득점 (론: 방총자 지불 / 쯔모: 합계)
  payments?: { oya: number; ko: number } // 쯔모 시 1인당 지불
  limitName: string             // 'mangan' 등 (없으면 '')
  isYakuman: boolean
}

// 사용자 답안
export interface Guess {
  noYaku: boolean
  han: number | null
  fu: number | null
  points: number | null
}

// 채점 결과(항목별)
export interface GradeResult {
  correct: boolean
  hanOk: boolean
  fuOk: boolean      // 5판 이상/역만이면 부수 무관 → true 취급
  pointsOk: boolean
  fuApplies: boolean // 부수 채점이 의미 있는지(5판 미만 & 역만 아님)
}
