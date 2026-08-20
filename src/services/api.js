import request from './request'
import { localRepository } from './localRepository'

const endpoints = {
  timer: '/timer/config',
  tasks: '/task/list',
  taskAdd: '/task/add',
  taskUpdate: '/task/update',
  taskDelete: '/task/delete',
  clocks: '/clock/list',
  clockAdd: '/clock/add',
  week: '/stat/week',
  month: '/stat/month',
}

/** 记录离线写操作，网络恢复后按顺序补交至 Mock/Apifox 服务。 */
function enqueue(config) {
  const queue = localRepository.getSyncQueue()
  queue.push({ ...config, createdAt: new Date().toISOString() })
  localRepository.saveSyncQueue(queue)
}

async function writeWithFallback(config, localWrite) {
  localWrite()
  try {
    return await request(config)
  } catch (error) {
    enqueue(config)
    throw error
  }
}

export async function flushSyncQueue() {
  const queue = localRepository.getSyncQueue()
  if (!queue.length) return 0

  const pending = []
  let synced = 0
  for (const item of queue) {
    try {
      await request({ url: item.url, method: item.method, data: item.data })
      synced += 1
    } catch {
      pending.push(item)
    }
  }
  localRepository.saveSyncQueue(pending)
  return synced
}

export const api = {
  async getTimerConfig() {
    try {
      const data = await request.get(endpoints.timer)
      localRepository.saveTimerConfig(data)
      return data
    } catch {
      return localRepository.getTimerConfig()
    }
  },
  saveTimerConfig(config) {
    return writeWithFallback({ url: endpoints.timer, method: 'put', data: config }, () => localRepository.saveTimerConfig(config))
  },
  async getTasks() {
    try {
      const data = await request.get(endpoints.tasks)
      localRepository.saveTasks(data)
      return data
    } catch {
      return localRepository.getTasks()
    }
  },
  addTask(task, tasks) {
    return writeWithFallback({ url: endpoints.taskAdd, method: 'post', data: task }, () => localRepository.saveTasks(tasks))
  },
  updateTask(task, tasks) {
    return writeWithFallback({ url: endpoints.taskUpdate, method: 'put', data: task }, () => localRepository.saveTasks(tasks))
  },
  deleteTask(id, tasks) {
    return writeWithFallback({ url: endpoints.taskDelete, method: 'delete', data: { id } }, () => localRepository.saveTasks(tasks))
  },
  async getClocks() {
    try {
      const data = await request.get(endpoints.clocks)
      localRepository.saveClocks(data)
      return data
    } catch {
      return localRepository.getClocks()
    }
  },
  addClock(record, records) {
    return writeWithFallback({ url: endpoints.clockAdd, method: 'post', data: record }, () => localRepository.saveClocks(records))
  },
  async getStats(range) {
    try {
      return await request.get(range === 7 ? endpoints.week : endpoints.month)
    } catch {
      const minutes = localRepository.getStudyMinutes()
      return recentStats(range, minutes)
    }
  },
}

function recentStats(range, minutes) {
  const today = new Date()
  return Array.from({ length: range }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (range - 1 - index))
    const key = date.toLocaleDateString('sv-SE')
    return { date: key, studyTime: minutes[key] || 0 }
  })
}
