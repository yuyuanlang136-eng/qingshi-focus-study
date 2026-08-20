export const STORAGE_KEYS = {
  timerConfig: 'qingshi_timer_config_v1',
  tasks: 'qingshi_tasks_v1',
  clocks: 'qingshi_clocks_v1',
  studyMinutes: 'qingshi_study_minutes_v1',
  syncQueue: 'qingshi_sync_queue_v1',
}

export const DEFAULT_TIMER_CONFIG = Object.freeze({
  studyDuration: 25,
  restDuration: 5,
})
