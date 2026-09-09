// Engine invariant smoke test (node). Bundles src/engine/generate.ts with esbuild and
// generates many questions, asserting:
//   1. no tile appears more than 4 times across hand + open melds + ron tile + dora/ura indicators
//   2. dora indicator count == 1 + kan count (and ura matches when riichi)
// Run: npm run test:engine [-- N]
const path = require('path')
const os = require('os')
const fs = require('fs')
const esbuild = require('esbuild')

const N = Number(process.argv[2]) || 50000
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'riichi-gen-')), 'gen.cjs')
esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', 'src', 'engine', 'generate.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: out,
  logLevel: 'error',
})
const { generateQuestion } = require(out)

let over4 = 0
let doraCountBad = 0
const examples = []
for (let i = 0; i < N; i++) {
  const { hand } = generateQuestion(true)
  const cnt = new Array(34).fill(0)
  const add = (t) => cnt[t]++
  hand.closed.forEach(add)
  hand.openMelds.forEach((m) => m.tiles.forEach(add))
  if (!hand.isTsumo) add(hand.winningTile)
  hand.doraIndicators.forEach(add)
  hand.uraIndicators.forEach(add)
  const over = cnt.map((c, t) => [t, c]).filter(([, c]) => c > 4)
  if (over.length) {
    over4++
    if (examples.length < 3) examples.push({ over, hand })
  }
  const nKans = hand.openMelds.filter((m) => m.tiles.length === 4).length
  const expect = hand.doraIndicators.length === 0 ? 0 : 1 + nKans // fallback hand has 0
  if (hand.doraIndicators.length !== expect || (hand.riichi && hand.uraIndicators.length !== expect)) doraCountBad++
}

console.log(`N=${N} over4=${over4} doraCountBad=${doraCountBad}`)
if (examples.length) console.log(JSON.stringify(examples, null, 1))
if (over4 || doraCountBad) {
  console.error('FAIL: engine invariants violated')
  process.exit(1)
}
console.log('OK')
