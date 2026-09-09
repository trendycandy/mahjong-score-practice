// 점수표 연습용 순수 모듈 (UI·riichi-ts 비의존).
// 기준: public/score.png — 표준 공식, 절상만관 없음(30부 4판 7700/11600, 60부 3판 7700/11600).

export type Seat = 'ko' | 'oya'          // 자 / 친
export type WinType = 'ron' | 'tsumo'
export type Limit = 'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'yakuman'

export interface Cell {
  seat: Seat
  win: WinType
  han: number | null      // 1..4 (limit 칸이면 null)
  fu: number | null       // 20..110 (limit 칸이면 null)
  limit: Limit | null     // 5판 이상 칸
}

export interface Answer {
  total: number           // 론: 방총자 지불 / 쯔모: 합계
  ko?: number             // 자 쯔모: 자 1인 지불
  oya?: number            // 자 쯔모: 친 지불 / 친 쯔모: ALL(1인 지불)
}

export type InputField = 'total' | 'ko' | 'oya'

export const FU_LIST = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110]
export const LIMITS: Limit[] = ['mangan', 'haneman', 'baiman', 'sanbaiman', 'yakuman']
export const LIMIT_KO: Record<Limit, string> = {
  mangan: '만관',
  haneman: '하네만',
  baiman: '배만',
  sanbaiman: '삼배만',
  yakuman: '역만',
}
export const LIMIT_HAN_KO: Record<Limit, string> = {
  mangan: '5판 (또는 4판 40부 이상 · 3판 70부 이상)',
  haneman: '6~7판',
  baiman: '8~10판',
  sanbaiman: '11~12판',
  yakuman: '13판 이상',
}
const LIMIT_BASE: Record<Limit, number> = {
  mangan: 2000,
  haneman: 3000,
  baiman: 4000,
  sanbaiman: 6000,
  yakuman: 8000,
}
export const SEAT_KO: Record<Seat, string> = { ko: '자', oya: '친' }
export const WIN_KO: Record<WinType, string> = { ron: '론', tsumo: '쯔모' }

export const ceil100 = (x: number) => Math.ceil(x / 100) * 100

export function basePoints(cell: Cell): number {
  if (cell.limit) return LIMIT_BASE[cell.limit]
  return (cell.fu ?? 0) * 2 ** ((cell.han ?? 0) + 2)
}

export function computeAnswer(cell: Cell): Answer {
  const base = basePoints(cell)
  if (cell.win === 'ron') return { total: ceil100(base * (cell.seat === 'oya' ? 6 : 4)) }
  if (cell.seat === 'ko') {
    const ko = ceil100(base)
    const oya = ceil100(base * 2)
    return { total: ko * 2 + oya, ko, oya }
  }
  const oya = ceil100(base * 2)
  return { total: oya * 3, oya }
}

// 첨부 점수표의 빈칸과 일치하는 유효 칸 판정
export function isValidCell(cell: Cell): boolean {
  if (cell.limit) return cell.han === null && cell.fu === null && LIMITS.includes(cell.limit)
  const { han, fu, win } = cell
  if (han === null || fu === null) return false
  if (han < 1 || han > 4 || !FU_LIST.includes(fu)) return false
  if (fu === 20 && (win === 'ron' || han < 2)) return false          // 핑후 쯔모 전용
  if (fu === 25 && han < (win === 'ron' ? 2 : 3)) return false        // 치또이 2판(+멘젠쯔모)
  if (fu === 110 && win === 'tsumo' && han < 2) return false
  return fu * 2 ** (han + 2) <= 2000                                   // 초과분은 만관 영역(표 빈칸)
}

export function allCells(): Cell[] {
  const out: Cell[] = []
  for (const seat of ['ko', 'oya'] as Seat[]) {
    for (const win of ['ron', 'tsumo'] as WinType[]) {
      for (const fu of FU_LIST) {
        for (let han = 1; han <= 4; han++) {
          const c: Cell = { seat, win, han, fu, limit: null }
          if (isValidCell(c)) out.push(c)
        }
      }
      for (const limit of LIMITS) out.push({ seat, win, han: null, fu: null, limit })
    }
  }
  return out
}

export function cellKey(c: Cell): string {
  return c.limit ? `${c.seat}/${c.win}/limit/${c.limit}` : `${c.seat}/${c.win}/${c.fu}/${c.han}`
}

export function cellLabel(c: Cell): string {
  const tail = c.limit ? LIMIT_KO[c.limit] : `${c.fu}부 ${c.han}판`
  return `${SEAT_KO[c.seat]} · ${WIN_KO[c.win]} · ${tail}`
}

// 입력해야 하는 칸: 론=총점 1칸, 자 쯔모=자 몫·친 몫 2칸, 친 쯔모=ALL 1칸(oya)
export function inputFields(c: Cell): InputField[] {
  if (c.win === 'ron') return ['total']
  return c.seat === 'ko' ? ['ko', 'oya'] : ['oya']
}

export function formatAnswer(c: Cell, a: Answer): string {
  if (c.win === 'ron') return `${a.total}`
  if (c.seat === 'ko') return `${a.ko} / ${a.oya} (계 ${a.total})`
  return `${a.oya} ALL (계 ${a.total})`
}

// ───────────────────────── 단계 · 필터 ─────────────────────────

export interface CellFilter {
  seats: Seat[]
  wins: WinType[]
  fus: number[]        // 명시 목록(빈 배열=1~4판 칸 없음)
  limits: boolean      // 만관 이상 칸 포함
  hans?: number[]      // 판수 제한(1~4). 생략=전부. limit 칸엔 적용 안 함
}

export interface Stage {
  id: string
  group: string         // 바둑판 화면의 묶음 제목 ('자 론' · '자 쯔모' · '친 론' · '친 쯔모' · '기타')
  title: string
  hint: string          // 단계 소개 한 줄(문제 카드 위)
  filter: CellFilter
}

const F = (seats: Seat[], wins: WinType[], fus: number[], limits = false): CellFilter => ({ seats, wins, fus, limits })

// 부수 계열: 자/친 × 론/쯔모 공통. 20부는 쯔모 전용이라 론 계열에는 없음.
interface FuFamily {
  key: string
  fus: number[]
  label: string
  hint: (seat: Seat, win: WinType) => string
}
const FAMILIES: FuFamily[] = [
  { key: '30', fus: [30], label: '30부', hint: (s, w) => (s === 'ko' && w === 'ron' ? '기준이 되는 열. 1000·2000·3900(장쿠)·7700(치치이)' : w === 'tsumo' && s === 'ko' ? '친 몫 = 한 판 낮춘 론, 자 몫 = 두 판 낮춘 론' : s === 'oya' && w === 'ron' ? '자 론의 1.5배. 1500·2900·5800·11600' : '자 쯔모 때 친이 내는 몫을 3명 전원에게. 500·1000·2000·3900 ALL') },
  { key: '50', fus: [50], label: '50부', hint: () => '올림 없이 2배씩' },
  { key: '25', fus: [25], label: '25부', hint: () => '치또이 전용. 한 판 내려 50부로 = 50부 열 그대로' },
  { key: '40', fus: [40], label: '40부', hint: () => '30부와 50부 사이' },
  { key: '20', fus: [20], label: '20부', hint: () => '핑후 쯔모 전용. 한 판 내려 40부로' },
  { key: 'derived', fus: [60, 80, 100], label: '60/80/100부', hint: () => '한 판 올려 30/40/50부로 계산' },
  { key: 'rest', fus: [70, 90, 110], label: '70/90/110부', hint: () => '유도 규칙 없음 — 그대로 외우기' },
]

function familyStages(seat: Seat, win: WinType): Stage[] {
  const group = `${SEAT_KO[seat]} ${WIN_KO[win]}`
  return FAMILIES.filter((f) => !(f.key === '20' && win === 'ron')).map((f) => ({
    id: `${seat}-${win}-${f.key}`,
    group,
    title: `${group} ${f.label}`,
    hint: f.hint(seat, win),
    filter: F([seat], [win], f.fus),
  }))
}

export const STAGES: Stage[] = [
  ...familyStages('ko', 'ron'),
  ...familyStages('ko', 'tsumo'),
  ...familyStages('oya', 'ron'),
  ...familyStages('oya', 'tsumo'),
  { id: 'limits', group: '기타', title: '만관 이상', hint: '만관 8000/12000 · 하네만 · 배만 · 삼배만 · 역만', filter: F(['ko', 'oya'], ['ron', 'tsumo'], [], true) },
  { id: 'all', group: '기타', title: '전체 무작위', hint: '점수표 전 칸', filter: F(['ko', 'oya'], ['ron', 'tsumo'], FU_LIST, true) },
]

export const STAGE_GROUPS: string[] = Array.from(new Set(STAGES.map((s) => s.group)))

export function cellsFor(f: CellFilter): Cell[] {
  return allCells().filter((c) => {
    if (!f.seats.includes(c.seat) || !f.wins.includes(c.win)) return false
    if (c.limit) return f.limits
    if (f.hans && !f.hans.includes(c.han as number)) return false
    return f.fus.includes(c.fu as number)
  })
}

// ───────────────────────── 출제 ─────────────────────────

// 가중 무작위: 기본 1, 이번 세션에서 틀린 칸(misses>0)은 3. 직전 칸은 2칸 이상일 때 제외.
export function pickCell(
  cells: Cell[],
  misses: Map<string, number>,
  prevKey?: string,
  rand: () => number = Math.random,
): Cell {
  const pool = cells.length > 1 && prevKey ? cells.filter((c) => cellKey(c) !== prevKey) : cells
  const weights = pool.map((c) => ((misses.get(cellKey(c)) ?? 0) > 0 ? 3 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rand() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r < 0) return pool[i]
  }
  return pool[pool.length - 1]
}

// ───────────────────────── 채점 ─────────────────────────

export interface TableInput {
  total: number | null
  ko: number | null
  oya: number | null
}
export interface TableGrade {
  correct: boolean
  totalOk: boolean
  koOk: boolean
  oyaOk: boolean
}

export function gradeAnswer(cell: Cell, expected: Answer, input: TableInput): TableGrade {
  if (cell.win === 'ron') {
    const ok = input.total === expected.total
    return { correct: ok, totalOk: ok, koOk: true, oyaOk: true }
  }
  if (cell.seat === 'ko') {
    const koOk = input.ko === expected.ko
    const oyaOk = input.oya === expected.oya
    const ok = koOk && oyaOk
    return { correct: ok, totalOk: ok, koOk, oyaOk }
  }
  const oyaOk = input.oya === expected.oya
  return { correct: oyaOk, totalOk: oyaOk, koOk: true, oyaOk }
}

// ───────────────────────── 해설 ─────────────────────────

export interface ExplainRow {
  label: string
  answer: Answer
  current: boolean
}
export interface Explanation {
  tips: string[]
  column: ExplainRow[]   // 같은 seat·win·fu 의 1~4판(유효 칸만) / limit 칸이면 5단계
  sameValue: Cell[]      // 값이 완전히 같은 다른 칸(최대 4)
}

export function answersEqual(a: Answer, b: Answer): boolean {
  return a.total === b.total && a.ko === b.ko && a.oya === b.oya
}

const seq = (c: Cell, hans: number[]) => hans.map((h) => computeAnswer({ ...c, han: h }).total).join('·')
const koRon = (fu: number): Cell => ({ seat: 'ko', win: 'ron', han: 1, fu, limit: null })

function fuTips(c: Cell): string[] {
  const fu = c.fu as number
  const han = c.han as number
  const tips: string[] = []
  switch (fu) {
    case 30:
      tips.push(`30부가 기준 열. 자 론 ${seq(koRon(30), [1, 2, 3, 4])} — 판마다 약 2배. 3900은 「장쿠」, 7700은 「치치이」.`)
      break
    case 25:
    case 50:
      tips.push(`25부는 50부에서 한 판 내린 값. 올림이 없어 2의 배수로 깔끔: 자 론 ${seq(koRon(25), [2, 3, 4])} (50부 1~3판과 동일).`)
      break
    case 40:
      tips.push(`40부는 30부와 50부 사이: 자 론 ${seq(koRon(40), [1, 2, 3])} — 정확히 2배씩.`)
      break
    case 20:
      tips.push('20부(핑후 쯔모)는 한 판 내려 40부로 계산. 20부 3판 쯔모 700/1300 = 40부 2판 쯔모.')
      break
    case 60:
      tips.push('60부는 한 판 올려 30부로 계산. 60부 2판 = 30부 3판 = 3900(자 론).')
      break
    case 80:
      tips.push('80부는 한 판 올려 40부로 계산. 80부 1판 = 40부 2판 = 2600(자 론).')
      break
    case 100:
      tips.push('100부는 한 판 올려 50부로 계산. 100부 1판 = 50부 2판 = 3200(자 론).')
      break
    default:
      tips.push(`${fu}부는 유도 규칙이 없어 그대로 외운다.`)
  }
  if ((fu === 30 && han === 4) || (fu === 60 && han === 3)) {
    tips.push(`만관으로 치는 룰도 있지만 이 표는 ${c.seat === 'oya' ? '11600' : '7700'} (절상만관 없음).`)
  }
  return tips
}

function situationTips(c: Cell, expected: Answer): string[] {
  const tips: string[] = []
  const han = c.han as number
  if (c.win === 'tsumo' && c.seat === 'ko') {
    const r1: Cell = { ...c, win: 'ron', han: han - 1 }
    const r2: Cell = { ...c, win: 'ron', han: han - 2 }
    if (han >= 2 && isValidCell(r1)) tips.push(`친 몫 ${expected.oya} = 한 판 낮춘 론(${c.fu}부 ${han - 1}판) 점수.`)
    if (han >= 3 && isValidCell(r2))
      tips.push(`자 몫 ${expected.ko} = 두 판 낮춘 론(${c.fu}부 ${han - 2}판) 점수. 친 몫의 절반에 가깝다.`)
    if (tips.length === 0)
      tips.push(`자 몫 ${expected.ko}, 친 몫 ${expected.oya}. 친 몫은 자 몫의 약 2배(올림 때문에 딱 2배가 아닐 수 있음).`)
  } else if (c.win === 'tsumo' && c.seat === 'oya') {
    const koT = computeAnswer({ ...c, seat: 'ko' })
    tips.push(`친 쯔모 ALL ${expected.oya} = 자 쯔모 때 친이 내는 몫(${koT.oya})을 3명 전원에게.`)
  } else if (c.win === 'ron' && c.seat === 'oya') {
    const koR = computeAnswer({ ...c, seat: 'ko' })
    tips.push(`친 론은 자 론의 1.5배: 자 ${koR.total} × 1.5 = ${koR.total * 1.5} → 올림 ${expected.total}.`)
  }
  return tips
}

function limitTips(c: Cell): string[] {
  const l = c.limit as Limit
  const koC: Cell = { ...c, seat: 'ko' }
  const oyaC: Cell = { ...c, seat: 'oya' }
  const tips = [`${LIMIT_KO[l]} = ${LIMIT_HAN_KO[l]}. 자 ${formatAnswer(koC, computeAnswer(koC))} / 친 ${formatAnswer(oyaC, computeAnswer(oyaC))}.`]
  if (l === 'mangan') tips.push('만관부터는 부수 무관. 만관 → 하네만 → 배만 → 삼배만 → 역만 = 8000 → 12000 → 16000 → 24000 → 32000 (자 론).')
  return tips
}

export function explain(cell: Cell, expected: Answer): Explanation {
  const tips = cell.limit ? limitTips(cell) : [...fuTips(cell), ...situationTips(cell, expected)]

  const column: ExplainRow[] = cell.limit
    ? LIMITS.map((limit) => {
        const c: Cell = { ...cell, limit }
        return { label: LIMIT_KO[limit], answer: computeAnswer(c), current: limit === cell.limit }
      })
    : [1, 2, 3, 4]
        .map((han) => ({ ...cell, han }))
        .filter(isValidCell)
        .map((c) => ({ label: `${c.han}판`, answer: computeAnswer(c), current: c.han === cell.han }))

  const me = cellKey(cell)
  const sameValue = allCells()
    .filter((c) => cellKey(c) !== me && answersEqual(computeAnswer(c), expected))
    .slice(0, 4)

  return { tips, column, sameValue }
}
