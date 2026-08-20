import { beforeEach, describe, expect, it } from 'vitest'
import { calculateStreak, toDateKey } from '../src/utils/date'
import { readStorage, writeStorage } from '../src/utils/storage'

describe('本地存储工具', () => {
  beforeEach(() => localStorage.clear())

  it('可以安全写入并读取 JSON 数据', () => {
    expect(writeStorage('demo', { minutes: 25 })).toBe(true)
    expect(readStorage('demo', {})).toEqual({ minutes: 25 })
  })

  it('缓存内容损坏时返回默认值', () => {
    localStorage.setItem('broken', '{bad json')
    expect(readStorage('broken', [])).toEqual([])
  })
})

describe('日期工具', () => {
  it('生成 YYYY-MM-DD 格式日期', () => {
    expect(toDateKey(new Date(2026, 7, 20))).toBe('2026-08-20')
  })

  it('计算包含今天的连续打卡天数', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    expect(calculateStreak([{ date: toDateKey(today) }, { date: toDateKey(yesterday) }])).toBe(2)
  })
})
