export const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/** 使用本地时区生成 YYYY-MM-DD，避免 UTC 导致日期跨天。 */
export function toDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function recentDates(days) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (days - 1 - index))
    return date
  })
}

export function calculateStreak(records) {
  const checkedDays = new Set(records.map((item) => item.date))
  const cursor = new Date()
  if (!checkedDays.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (checkedDays.has(toDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
