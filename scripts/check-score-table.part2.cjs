// Part 2: stages / filter / pick / grade / explain. Loaded by check-score-table.cjs.
module.exports = function (T, eq) {
  const cell = (seat, win, han, fu) => ({ seat, win, han, fu, limit: null })

  // ── 단계 ──
  eq(T.STAGES.length, 13, '13 stages')
  eq(T.STAGES.map((s) => s.id), [
    'ko-ron-30', 'ko-ron-50', 'ko-ron-25', 'ko-ron-40', 'ko-ron-derived', 'ko-ron-rest',
    'ko-tsumo-30', 'ko-tsumo-core', 'ko-tsumo-rest', 'oya-ron', 'oya-tsumo', 'limits', 'all',
  ], 'stage ids')
  eq(T.cellsFor(T.STAGES[1].filter).map(T.cellKey), ['ko/ron/50/1', 'ko/ron/50/2', 'ko/ron/50/3'], 'stage 50 cells')
  eq(T.cellsFor(T.STAGES[2].filter).map(T.cellKey), ['ko/ron/25/2', 'ko/ron/25/3', 'ko/ron/25/4'], 'stage 25 cells')
  for (const s of T.STAGES) {
    const n = T.cellsFor(s.filter).length
    if (n === 0) eq(n, '>0', `stage ${s.id} has cells`)
  }
  eq(T.cellsFor(T.STAGES[0].filter).map(T.cellKey), ['ko/ron/30/1', 'ko/ron/30/2', 'ko/ron/30/3', 'ko/ron/30/4'], 'stage1 cells')
  eq(T.cellsFor(T.STAGES[11].filter).every((c) => c.limit !== null), true, 'limits stage only limit cells')
  eq(T.cellsFor(T.STAGES[11].filter).length, 20, 'limits stage 20 cells')
  eq(T.cellsFor(T.STAGES[12].filter).length, T.allCells().length, 'all stage = every cell')
  eq(T.cellsFor({ seats: ['ko'], wins: ['ron'], fus: [], limits: false }).length, 0, 'empty fus & no limits → 0')
  eq(T.cellsFor({ seats: ['oya'], wins: ['tsumo'], fus: [20], limits: false }).map(T.cellKey), ['oya/tsumo/20/2', 'oya/tsumo/20/3', 'oya/tsumo/20/4'], 'filter oya tsumo 20')

  // ── 출제 ──
  const cells = T.cellsFor(T.STAGES[0].filter) // 4칸
  const misses = new Map([['ko/ron/30/3', 3]])
  // rand 고정: 가중 합 = 1+1+3+1 = 6. r*6 < 2 → 1판·2판, 2..5 → 3판, 5..6 → 4판
  eq(T.cellKey(T.pickCell(cells, misses, undefined, () => 0.0)), 'ko/ron/30/1', 'pick weighted first')
  eq(T.cellKey(T.pickCell(cells, misses, undefined, () => 0.5)), 'ko/ron/30/3', 'pick weighted missed cell')
  eq(T.cellKey(T.pickCell(cells, misses, undefined, () => 0.99)), 'ko/ron/30/4', 'pick weighted last')
  // 직전 칸 제외: prev=1판, r=0 → 2판
  eq(T.cellKey(T.pickCell(cells, new Map(), 'ko/ron/30/1', () => 0.0)), 'ko/ron/30/2', 'pick excludes prev')
  // 1칸뿐이면 prev 제외 안 함
  eq(T.cellKey(T.pickCell([cells[0]], new Map(), 'ko/ron/30/1', () => 0.0)), 'ko/ron/30/1', 'single cell ignores prev')
  // 통계적: 틀린 칸이 약 3배 (5000회)
  let hit = 0
  for (let i = 0; i < 5000; i++) if (T.cellKey(T.pickCell(cells, misses)) === 'ko/ron/30/3') hit++
  if (hit < 2200 || hit > 2800) eq(hit, '~2500', 'missed cell weight ≈ 3/6')

  // ── 채점 ──
  const ronCell = cell('ko', 'ron', 3, 30)
  eq(T.gradeAnswer(ronCell, T.computeAnswer(ronCell), { total: 3900, ko: null, oya: null }),
    { correct: true, totalOk: true, koOk: true, oyaOk: true }, 'grade ron ok')
  eq(T.gradeAnswer(ronCell, T.computeAnswer(ronCell), { total: 4000, ko: null, oya: null }).correct, false, 'grade ron wrong')
  const kt = cell('ko', 'tsumo', 4, 30)
  eq(T.gradeAnswer(kt, T.computeAnswer(kt), { total: null, ko: 2000, oya: 3900 }).correct, true, 'grade ko tsumo ok')
  eq(T.gradeAnswer(kt, T.computeAnswer(kt), { total: null, ko: 2000, oya: 4000 }),
    { correct: false, totalOk: false, koOk: true, oyaOk: false }, 'grade ko tsumo partial')
  const ot = cell('oya', 'tsumo', 2, 30)
  eq(T.gradeAnswer(ot, T.computeAnswer(ot), { total: null, ko: null, oya: 1000 }).correct, true, 'grade oya tsumo ok')
  eq(T.gradeAnswer(ot, T.computeAnswer(ot), { total: null, ko: null, oya: 3000 }).correct, false, 'grade oya tsumo total≠ALL')
  // ── 해설 ──
  const ex1 = T.explain(cell('ko', 'ron', 3, 30), T.computeAnswer(cell('ko', 'ron', 3, 30)))
  eq(ex1.column.map((r) => r.label), ['1판', '2판', '3판', '4판'], 'column labels 30')
  eq(ex1.column.map((r) => r.answer.total), [1000, 2000, 3900, 7700], 'column values 30')
  eq(ex1.column.map((r) => r.current), [false, false, true, false], 'column current')
  eq(ex1.tips.some((t) => t.includes('장쿠')), true, 'tip mentions 장쿠')
  eq(ex1.sameValue.map(T.cellKey), ['ko/ron/60/2', 'oya/ron/40/2', 'oya/ron/80/1'], 'sameValue 3900 cells')

  const ex25 = T.explain(cell('ko', 'ron', 2, 25), T.computeAnswer(cell('ko', 'ron', 2, 25)))
  eq(ex25.column.map((r) => r.label), ['2판', '3판', '4판'], 'column skips invalid 25/1')
  eq(ex25.tips.some((t) => t.includes('50부')), true, 'tip 25 → 50부')

  const exKT = T.explain(cell('ko', 'tsumo', 4, 30), T.computeAnswer(cell('ko', 'tsumo', 4, 30)))
  eq(exKT.tips.some((t) => t.includes('3900') && t.includes('3판')), true, 'ko tsumo tip: oya share = ron han-1')
  eq(exKT.tips.some((t) => t.includes('2000') && t.includes('2판')), true, 'ko tsumo tip: ko share = ron han-2')

  const exOT = T.explain(cell('oya', 'tsumo', 3, 30), T.computeAnswer(cell('oya', 'tsumo', 3, 30)))
  eq(exOT.tips.some((t) => t.includes('2000') && t.includes('3명')), true, 'oya tsumo tip ALL = ko tsumo oya share')

  const exOR = T.explain(cell('oya', 'ron', 2, 40), T.computeAnswer(cell('oya', 'ron', 2, 40)))
  eq(exOR.tips.some((t) => t.includes('1.5배')), true, 'oya ron tip 1.5x')
  eq(exOR.sameValue.map(T.cellKey), ['ko/ron/30/3', 'ko/ron/60/2', 'oya/ron/80/1'], 'oya 40/2 same-value cells')

  const exStar = T.explain(cell('ko', 'ron', 4, 30), T.computeAnswer(cell('ko', 'ron', 4, 30)))
  eq(exStar.tips.some((t) => t.includes('만관으로')), true, 'starred cell tip')

  const limCell = { seat: 'oya', win: 'ron', han: null, fu: null, limit: 'haneman' }
  const exLim = T.explain(limCell, T.computeAnswer(limCell))
  eq(exLim.column.map((r) => r.label), ['만관', '하네만', '배만', '삼배만', '역만'], 'limit column')
  eq(exLim.column[1].current, true, 'limit current')
  eq(exLim.tips.some((t) => t.includes('6~7판')), true, 'limit tip han range')

  // ── 팁 항등식(전 칸) ──
  for (const c of T.allCells()) {
    if (c.limit) continue
    const a = T.computeAnswer(c)
    if (c.win === 'tsumo' && c.seat === 'ko') {
      const r1 = { ...c, win: 'ron', han: c.han - 1 }
      const r2 = { ...c, win: 'ron', han: c.han - 2 }
      if (c.han >= 2) eq(a.oya, T.computeAnswer(r1).total, `identity oya share = ron han-1 @${T.cellKey(c)}`)
      if (c.han >= 3) eq(a.ko, T.computeAnswer(r2).total, `identity ko share = ron han-2 @${T.cellKey(c)}`)
    }
    if (c.win === 'tsumo' && c.seat === 'oya') {
      eq(a.oya, T.computeAnswer({ ...c, seat: 'ko' }).oya, `identity oya ALL = ko tsumo oya @${T.cellKey(c)}`)
    }
  }
}
