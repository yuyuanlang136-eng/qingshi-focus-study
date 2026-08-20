import { DEFAULT_TIMER_CONFIG, STORAGE_KEYS } from '../constants/storage'
import { readStorage, writeStorage } from '../utils/storage'

export const localRepository = {
  getTimerConfig: () => readStorage(STORAGE_KEYS.timerConfig, { ...DEFAULT_TIMER_CONFIG }),
  saveTimerConfig: (config) => writeStorage(STORAGE_KEYS.timerConfig, config),

  getTasks: () => readStorage(STORAGE_KEYS.tasks, []),
  saveTasks: (tasks) => writeStorage(STORAGE_KEYS.tasks, tasks),

  getClocks: () => readStorage(STORAGE_KEYS.clocks, []),
  saveClocks: (records) => writeStorage(STORAGE_KEYS.clocks, records),

  getStudyMinutes: () => readStorage(STORAGE_KEYS.studyMinutes, {}),
  saveStudyMinutes: (records) => writeStorage(STORAGE_KEYS.studyMinutes, records),

  getSyncQueue: () => readStorage(STORAGE_KEYS.syncQueue, []),
  saveSyncQueue: (queue) => writeStorage(STORAGE_KEYS.syncQueue, queue),
}
