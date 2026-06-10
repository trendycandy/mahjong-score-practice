// 브라우저용 node:assert 경량 대체. riichi-ts 가 assert(cond) 및 assert.deepStrictEqual 형태로 사용.

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false
  }
  return true
}

function assert(cond: unknown, msg?: string): asserts cond {
  if (!cond) throw new Error(msg ?? 'assertion failed')
}
assert.equal = (a: unknown, b: unknown) => {
  if (a !== b) throw new Error('assert.equal')
}
assert.ok = (c: unknown) => {
  if (!c) throw new Error('assert.ok')
}
// ⚠️ riichi-ts 의 iipeikou 판정이 이 메서드에 의존한다(yaku.js): 두 슌쯔가 같으면 통과→이페코 성립,
// 다르면 throw→다음 후보. 이 메서드가 없으면(undefined) 호출 시 TypeError 가 "항상" throw 되어
// 이페코가 브라우저에서 영영 감지되지 않는다. (node 는 진짜 assert 라 정상 → node/브라우저 동작이 갈렸음)
assert.deepStrictEqual = (a: unknown, b: unknown) => {
  if (!deepEqual(a, b)) throw new Error('assert.deepStrictEqual')
}
export default assert
