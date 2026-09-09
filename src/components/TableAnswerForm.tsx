import { useEffect, useRef, useState } from 'react'
import type { Cell, InputField, TableInput } from '../engine/scoreTable'
import { cellKey, inputFields } from '../engine/scoreTable'

const FIELD_LABEL: Record<InputField, string> = {
  total: '방총자가 내는 점수',
  ko: '자 1인이 내는 점수',
  oya: '친이 내는 점수',
}
const FIELD_PLACEHOLDER: Record<InputField, string> = { total: '예: 3900', ko: '예: 1000', oya: '예: 2000' }

function parseNum(s: string): number | null {
  const digits = s.replace(/[^0-9]/g, '')
  if (digits === '') return null
  const n = Number(digits)
  return n > 0 ? n : null
}

const EMPTY: Record<InputField, string> = { total: '', ko: '', oya: '' }

export default function TableAnswerForm({ cell, onSubmit }: { cell: Cell; onSubmit: (input: TableInput) => void }) {
  const fields = inputFields(cell)
  const [vals, setVals] = useState<Record<InputField, string>>(EMPTY)
  const firstRef = useRef<HTMLInputElement>(null)
  const key = cellKey(cell)

  // 문제가 바뀌면 입력 초기화 + 첫 칸 포커스
  useEffect(() => {
    setVals(EMPTY)
    firstRef.current?.focus()
  }, [key])

  const parsed: TableInput = {
    total: parseNum(vals.total),
    ko: parseNum(vals.ko),
    oya: parseNum(vals.oya),
  }
  const canSubmit = fields.every((f) => parsed[f] !== null)
  const submit = () => {
    if (canSubmit) onSubmit(parsed)
  }

  // 친 쯔모는 oya 필드지만 라벨은 ALL
  const label = (f: InputField) => (cell.seat === 'oya' && f === 'oya' ? '3명이 각각 내는 점수 (ALL)' : FIELD_LABEL[f])

  return (
    <div className="space-y-3">
      <div className={fields.length === 2 ? 'grid grid-cols-2 gap-2' : ''}>
        {fields.map((f, i) => (
          <div key={f}>
            <div className="mb-1.5 text-xs text-ivory/50">{label(f)}</div>
            <input
              ref={i === 0 ? firstRef : undefined}
              type="text"
              inputMode="numeric"
              value={vals[f]}
              onChange={(e) => setVals((v) => ({ ...v, [f]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={FIELD_PLACEHOLDER[f]}
              className="w-full rounded-md border border-ivory/15 bg-felt px-3 py-2.5 font-num text-lg text-ivory placeholder:text-ivory/25 focus:border-jade focus:outline-none"
            />
          </div>
        ))}
      </div>
      <button
        onClick={submit}
        disabled={!canSubmit}
        className="w-full rounded-lg bg-jade py-3 font-bold text-felt transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-30"
      >
        채점
      </button>
    </div>
  )
}
