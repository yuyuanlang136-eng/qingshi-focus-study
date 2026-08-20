import { computed, onBeforeUnmount, ref } from 'vue'
import { localRepository } from '../services/localRepository'
import { toDateKey } from '../utils/date'

/**
 * 番茄计时器组合式函数。
 * 使用目标结束时间计算剩余秒数，浏览器标签页降频后也不会产生明显时间漂移。
 */
export function useTimer(config, onStudyFinished, notify) {
  const mode = ref('study')
  const remaining = ref(config.value.studyDuration * 60)
  const running = ref(false)
  let endAt = 0
  let intervalId = null

  const durationSeconds = computed(() =>
    (mode.value === 'study' ? config.value.studyDuration : config.value.restDuration) * 60,
  )
  const progress = computed(() =>
    Math.min(100, Math.max(0, ((durationSeconds.value - remaining.value) / durationSeconds.value) * 100)),
  )
  const displayTime = computed(() => {
    const minutes = Math.floor(remaining.value / 60)
    const seconds = remaining.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  function clearTicker() {
    if (intervalId) window.clearInterval(intervalId)
    intervalId = null
  }

  function finish() {
    clearTicker()
    running.value = false
    if (mode.value === 'study') {
      const minuteMap = localRepository.getStudyMinutes()
      const today = toDateKey()
      minuteMap[today] = (minuteMap[today] || 0) + config.value.studyDuration
      localRepository.saveStudyMinutes(minuteMap)
      onStudyFinished(minuteMap[today])
      mode.value = 'rest'
      remaining.value = config.value.restDuration * 60
      notify(`完成 ${config.value.studyDuration} 分钟专注，休息一下吧`)
    } else {
      mode.value = 'study'
      remaining.value = config.value.studyDuration * 60
      notify('休息结束，可以继续专注学习了')
    }
  }

  function tick() {
    remaining.value = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
    if (remaining.value === 0) finish()
  }

  function start() {
    if (running.value || remaining.value <= 0) return
    clearTicker()
    endAt = Date.now() + remaining.value * 1000
    running.value = true
    intervalId = window.setInterval(tick, 250)
  }

  function pause() {
    tick()
    clearTicker()
    running.value = false
  }

  function reset() {
    clearTicker()
    running.value = false
    remaining.value = durationSeconds.value
  }

  function switchMode(nextMode) {
    clearTicker()
    running.value = false
    mode.value = nextMode
    remaining.value = durationSeconds.value
  }

  function applyConfig() {
    reset()
  }

  onBeforeUnmount(clearTicker)

  return { mode, remaining, running, progress, displayTime, start, pause, reset, switchMode, applyConfig }
}
