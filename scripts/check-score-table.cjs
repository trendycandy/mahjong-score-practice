// Score-table engine checks (node). Bundles src/engine/scoreTable.ts via esbuild.
// Run: npm run test:engine   (or: node scripts/check-score-table.cjs)
const path = require('path')
const os = require('os')
const fs = require('fs')
const esbuild = require('esbuild')

const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'riichi-st-')), 'scoreTable.cjs')
esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', 'src', 'engine', 'scoreTable.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: out,
  logLevel: 'error',
})
const T = require(out)

let fails = 0
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    fails++
    console.error(`FAIL ${msg}\n  expected ${e}\n  actual   ${a}`)
  }
}
const cell = (seat, win, han, fu) => ({ seat, win, han, fu, limit: null })
const lim = (seat, win, limit) => ({ seat, win, han: null, fu: null, limit })

// ── 1. 첨부 점수표(public/score.png) 고정값 스팟체크 ──
const ron = (t) => ({ total: t })
const koT = (ko, oya) => ({ total: ko * 2 + oya, ko, oya })
const oyaT = (all) => ({ total: all * 3, oya: all })

// 자 론
eq(T.computeAnswer(cell('ko', 'ron', 1, 30)), ron(1000), 'ko ron 30/1')
eq(T.computeAnswer(cell('ko', 'ron', 2, 30)), ron(2000), 'ko ron 30/2')
eq(T.computeAnswer(cell('ko', 'ron', 3, 30)), ron(3900), 'ko ron 30/3')
eq(T.computeAnswer(cell('ko', 'ron', 4, 30)), ron(7700), 'ko ron 30/4')
eq(T.computeAnswer(cell('ko', 'ron', 1, 40)), ron(1300), 'ko ron 40/1')
eq(T.computeAnswer(cell('ko', 'ron', 2, 40)), ron(2600), 'ko ron 40/2')
eq(T.computeAnswer(cell('ko', 'ron', 3, 40)), ron(5200), 'ko ron 40/3')
eq(T.computeAnswer(cell('ko', 'ron', 2, 25)), ron(1600), 'ko ron 25/2')
eq(T.computeAnswer(cell('ko', 'ron', 3, 25)), ron(3200), 'ko ron 25/3')
eq(T.computeAnswer(cell('ko', 'ron', 4, 25)), ron(6400), 'ko ron 25/4')
eq(T.computeAnswer(cell('ko', 'ron', 1, 110)), ron(3600), 'ko ron 110/1')
eq(T.computeAnswer(cell('ko', 'ron', 2, 110)), ron(7100), 'ko ron 110/2')
eq(T.computeAnswer(cell('ko', 'ron', 3, 60)), ron(7700), 'ko ron 60/3')
eq(T.computeAnswer(cell('ko', 'ron', 1, 90)), ron(2900), 'ko ron 90/1')
eq(T.computeAnswer(cell('ko', 'ron', 2, 90)), ron(5800), 'ko ron 90/2')
// 자 쯔모
eq(T.computeAnswer(cell('ko', 'tsumo', 1, 30)), koT(300, 500), 'ko tsumo 30/1')
eq(T.computeAnswer(cell('ko', 'tsumo', 2, 30)), koT(500, 1000), 'ko tsumo 30/2')
eq(T.computeAnswer(cell('ko', 'tsumo', 3, 30)), koT(1000, 2000), 'ko tsumo 30/3')
eq(T.computeAnswer(cell('ko', 'tsumo', 4, 30)), koT(2000, 3900), 'ko tsumo 30/4')
eq(T.computeAnswer(cell('ko', 'tsumo', 1, 40)), koT(400, 700), 'ko tsumo 40/1')
eq(T.computeAnswer(cell('ko', 'tsumo', 2, 40)), koT(700, 1300), 'ko tsumo 40/2')
eq(T.computeAnswer(cell('ko', 'tsumo', 3, 40)), koT(1300, 2600), 'ko tsumo 40/3')
eq(T.computeAnswer(cell('ko', 'tsumo', 2, 20)), koT(400, 700), 'ko tsumo 20/2')
eq(T.computeAnswer(cell('ko', 'tsumo', 3, 20)), koT(700, 1300), 'ko tsumo 20/3')
eq(T.computeAnswer(cell('ko', 'tsumo', 4, 20)), koT(1300, 2600), 'ko tsumo 20/4')
eq(T.computeAnswer(cell('ko', 'tsumo', 3, 25)), koT(800, 1600), 'ko tsumo 25/3')
eq(T.computeAnswer(cell('ko', 'tsumo', 4, 25)), koT(1600, 3200), 'ko tsumo 25/4')
eq(T.computeAnswer(cell('ko', 'tsumo', 2, 110)), koT(1800, 3600), 'ko tsumo 110/2')
// 친 론 / 쯔모
eq(T.computeAnswer(cell('oya', 'ron', 1, 30)), ron(1500), 'oya ron 30/1')
eq(T.computeAnswer(cell('oya', 'ron', 2, 30)), ron(2900), 'oya ron 30/2')
eq(T.computeAnswer(cell('oya', 'ron', 3, 30)), ron(5800), 'oya ron 30/3')
eq(T.computeAnswer(cell('oya', 'ron', 4, 30)), ron(11600), 'oya ron 30/4')
eq(T.computeAnswer(cell('oya', 'tsumo', 1, 30)), oyaT(500), 'oya tsumo 30/1')
eq(T.computeAnswer(cell('oya', 'tsumo', 2, 30)), oyaT(1000), 'oya tsumo 30/2')
eq(T.computeAnswer(cell('oya', 'tsumo', 3, 30)), oyaT(2000), 'oya tsumo 30/3')
eq(T.computeAnswer(cell('oya', 'tsumo', 4, 30)), oyaT(3900), 'oya tsumo 30/4')
eq(T.computeAnswer(cell('oya', 'tsumo', 2, 20)), oyaT(700), 'oya tsumo 20/2')
eq(T.computeAnswer(cell('oya', 'tsumo', 3, 20)), oyaT(1300), 'oya tsumo 20/3')
eq(T.computeAnswer(cell('oya', 'tsumo', 4, 20)), oyaT(2600), 'oya tsumo 20/4')
eq(T.computeAnswer(cell('oya', 'ron', 2, 25)), ron(2400), 'oya ron 25/2')
eq(T.computeAnswer(cell('oya', 'ron', 3, 25)), ron(4800), 'oya ron 25/3')
eq(T.computeAnswer(cell('oya', 'ron', 4, 25)), ron(9600), 'oya ron 25/4')
eq(T.computeAnswer(cell('oya', 'tsumo', 3, 25)), oyaT(1600), 'oya tsumo 25/3')
eq(T.computeAnswer(cell('oya', 'tsumo', 4, 25)), oyaT(3200), 'oya tsumo 25/4')
eq(T.computeAnswer(cell('oya', 'ron', 1, 110)), ron(5300), 'oya ron 110/1')
eq(T.computeAnswer(cell('oya', 'tsumo', 1, 110)), oyaT(1800), 'oya tsumo 110/1 (formula only)')
eq(T.computeAnswer(cell('oya', 'ron', 2, 110)), ron(10600), 'oya ron 110/2')
eq(T.computeAnswer(cell('oya', 'tsumo', 2, 110)), oyaT(3600), 'oya tsumo 110/2')
// 만관 이상
eq(T.computeAnswer(lim('ko', 'ron', 'mangan')), ron(8000), 'ko mangan ron')
eq(T.computeAnswer(lim('ko', 'tsumo', 'mangan')), koT(2000, 4000), 'ko mangan tsumo')
eq(T.computeAnswer(lim('oya', 'ron', 'mangan')), ron(12000), 'oya mangan ron')
eq(T.computeAnswer(lim('oya', 'tsumo', 'mangan')), oyaT(4000), 'oya mangan tsumo')
eq(T.computeAnswer(lim('ko', 'ron', 'haneman')), ron(12000), 'ko haneman')
eq(T.computeAnswer(lim('oya', 'ron', 'haneman')), ron(18000), 'oya haneman')
eq(T.computeAnswer(lim('ko', 'ron', 'baiman')), ron(16000), 'ko baiman')
eq(T.computeAnswer(lim('oya', 'ron', 'baiman')), ron(24000), 'oya baiman')
eq(T.computeAnswer(lim('ko', 'ron', 'sanbaiman')), ron(24000), 'ko sanbaiman')
eq(T.computeAnswer(lim('oya', 'ron', 'sanbaiman')), ron(36000), 'oya sanbaiman')
eq(T.computeAnswer(lim('ko', 'ron', 'yakuman')), ron(32000), 'ko yakuman')
eq(T.computeAnswer(lim('oya', 'ron', 'yakuman')), ron(48000), 'oya yakuman')
eq(T.computeAnswer(lim('ko', 'tsumo', 'yakuman')), koT(8000, 16000), 'ko yakuman tsumo')
eq(T.computeAnswer(lim('oya', 'tsumo', 'yakuman')), oyaT(16000), 'oya yakuman tsumo')

// ── 2. 유효 칸 집합 = 표의 빈칸과 일치 ──
eq(T.isValidCell(cell('ko', 'ron', 1, 20)), false, '20 ron invalid')
eq(T.isValidCell(cell('ko', 'tsumo', 1, 20)), false, '20 tsumo 1han invalid')
eq(T.isValidCell(cell('ko', 'tsumo', 2, 20)), true, '20 tsumo 2han valid')
eq(T.isValidCell(cell('ko', 'ron', 1, 25)), false, '25 ron 1han invalid')
eq(T.isValidCell(cell('ko', 'ron', 2, 25)), true, '25 ron 2han valid')
eq(T.isValidCell(cell('ko', 'tsumo', 2, 25)), false, '25 tsumo 2han invalid')
eq(T.isValidCell(cell('ko', 'tsumo', 3, 25)), true, '25 tsumo 3han valid')
eq(T.isValidCell(cell('ko', 'tsumo', 1, 110)), false, '110 tsumo 1han invalid')
eq(T.isValidCell(cell('ko', 'ron', 1, 110)), true, '110 ron 1han valid')
eq(T.isValidCell(cell('ko', 'ron', 4, 40)), false, '40/4 invalid (mangan)')
eq(T.isValidCell(cell('ko', 'ron', 4, 60)), false, '60/4 invalid')
eq(T.isValidCell(cell('ko', 'ron', 3, 70)), false, '70/3 invalid')
eq(T.isValidCell(cell('ko', 'ron', 3, 110)), false, '110/3 invalid')
eq(T.isValidCell(cell('ko', 'ron', 4, 30)), true, '30/4 valid (7700)')
eq(T.isValidCell(cell('ko', 'ron', 3, 60)), true, '60/3 valid (7700)')
eq(T.isValidCell(cell('ko', 'ron', 4, 25)), true, '25/4 valid')
eq(T.isValidCell(cell('ko', 'tsumo', 4, 20)), true, '20/4 valid')
eq(T.isValidCell(cell('ko', 'ron', 0, 30)), false, 'han 0 invalid')
eq(T.isValidCell(cell('ko', 'ron', 5, 30)), false, 'han 5 invalid')
eq(T.isValidCell(lim('ko', 'ron', 'mangan')), true, 'limit cell valid')

const all = T.allCells()
eq(all.every(T.isValidCell), true, 'allCells are all valid')
eq(new Set(all.map(T.cellKey)).size, all.length, 'cellKey unique')
eq(all.filter((c) => c.limit).length, 20, '20 limit cells')
// 표 기준 유효 1~4판 칸 수: 자 론 26 · 자 쯔모 27 (친 동일)
const koRon = all.filter((c) => !c.limit && c.seat === 'ko' && c.win === 'ron').length
const koTsumo = all.filter((c) => !c.limit && c.seat === 'ko' && c.win === 'tsumo').length
eq(koRon, 26, 'ko ron cell count')
eq(koTsumo, 27, 'ko tsumo cell count')

// ── 3. 라벨/포맷 ──
eq(T.cellLabel(cell('ko', 'ron', 3, 30)), '자 · 론 · 30부 3판', 'cellLabel')
eq(T.cellLabel(lim('oya', 'tsumo', 'haneman')), '친 · 쯔모 · 하네만', 'cellLabel limit')
eq(T.cellKey(cell('ko', 'ron', 3, 30)), 'ko/ron/30/3', 'cellKey')
eq(T.cellKey(lim('oya', 'tsumo', 'haneman')), 'oya/tsumo/limit/haneman', 'cellKey limit')
eq(T.formatAnswer(cell('ko', 'ron', 3, 30), ron(3900)), '3900', 'formatAnswer ron')
eq(T.formatAnswer(cell('ko', 'tsumo', 4, 30), koT(2000, 3900)), '2000 / 3900 (계 7900)', 'formatAnswer ko tsumo')
eq(T.formatAnswer(cell('oya', 'tsumo', 2, 30), oyaT(1000)), '1000 ALL (계 3000)', 'formatAnswer oya tsumo')
eq(T.inputFields(cell('ko', 'ron', 3, 30)), ['total'], 'inputFields ron')
eq(T.inputFields(cell('ko', 'tsumo', 3, 30)), ['ko', 'oya'], 'inputFields ko tsumo')
eq(T.inputFields(cell('oya', 'tsumo', 3, 30)), ['oya'], 'inputFields oya tsumo')

// Part 2 (stages / pick / grade / explain) — added in later tasks
if (fs.existsSync(path.join(__dirname, 'check-score-table.part2.cjs'))) {
  require('./check-score-table.part2.cjs')(T, eq)
}

if (fails) {
  console.error(`FAIL: ${fails} score-table check(s) failed`)
  process.exit(1)
}
console.log('score-table OK')
