<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Leaf, Sparkles } from '@lucide/vue'
import AppHeader from './components/AppHeader.vue'
import CheckinPanel from './components/CheckinPanel.vue'
import StatsDashboard from './components/StatsDashboard.vue'
import TaskList from './components/TaskList.vue'
import TimerCard from './components/TimerCard.vue'
import ToastMessage from './components/ToastMessage.vue'
import { useTimer } from './composables/useTimer'
import { DEFAULT_TIMER_CONFIG } from './constants/storage'
import { api, flushSyncQueue } from './services/api'
import { localRepository } from './services/localRepository'
import { toDateKey, WEEK_LABELS } from './utils/date'

const loading = ref(true)
const actionLoading = ref(false)
const tasks = ref([])
const clocks = ref([])
const config = ref({ ...DEFAULT_TIMER_CONFIG })
const todayMinutes = ref(0)
const range = ref(7)
const statistics = ref([])
const toast = ref({ message: '', type: 'success' })
let toastId

function notify(message, type = 'success') {
  window.clearTimeout(toastId)
  toast.value = { message, type }
  toastId = window.setTimeout(() => { toast.value.message = '' }, 2400)
}

const timer = useTimer(config, (minutes) => {
  todayMinutes.value = minutes
  loadStatistics()
}, notify)

const completedCount = computed(() => tasks.value.filter((task) => task.status === '1').length)
const chartData = computed(() => statistics.value.map((item) => {
  const date = new Date(`${item.date}T00:00:00`)
  return {
    ...item,
    label: range.value === 7 ? `周${WEEK_LABELS[date.getDay()]}` : `${date.getMonth() + 1}/${date.getDate()}`,
  }
}))

async function initialize() {
  loading.value = true
  const [timerConfig, taskList, clockList] = await Promise.all([
    api.getTimerConfig(), api.getTasks(), api.getClocks(),
  ])
  config.value = timerConfig
  tasks.value = taskList
  clocks.value = clockList
  todayMinutes.value = localRepository.getStudyMinutes()[toDateKey()] || 0
  timer.applyConfig()
  await loadStatistics()
  loading.value = false
}

async function runAction(action, successMessage) {
  actionLoading.value = true
  try {
    await action()
    if (successMessage) notify(successMessage)
  } catch {
    notify('网络异常，数据已保存到本地，恢复网络后将自动同步', 'error')
  } finally {
    actionLoading.value = false
  }
}

async function saveConfig(next) {
  config.value = next
  timer.applyConfig()
  await runAction(() => api.saveTimerConfig(next), '计时设置已保存')
}

async function addTask(input) {
  const task = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    content: input.content,
    description: input.description,
    status: '0',
    createTime: new Date().toISOString(),
  }
  tasks.value = [task, ...tasks.value]
  await runAction(() => api.addTask(task, tasks.value), '任务已加入清单')
}

async function toggleTask(task) {
  const updated = { ...task, status: task.status === '0' ? '1' : '0' }
  tasks.value = tasks.value.map((item) => item.id === task.id ? updated : item)
  await runAction(() => api.updateTask(updated, tasks.value))
}

async function updateTask(updated) {
  tasks.value = tasks.value.map((item) => item.id === updated.id ? updated : item)
  await runAction(() => api.updateTask(updated, tasks.value), '任务内容已更新')
}

async function deleteTask(id) {
  tasks.value = tasks.value.filter((item) => item.id !== id)
  await runAction(() => api.deleteTask(id, tasks.value), '任务已删除')
}

async function clearTasks() {
  const ids = tasks.value.map((item) => item.id)
  tasks.value = []
  localRepository.saveTasks([])
  actionLoading.value = true
  const results = await Promise.allSettled(ids.map((id) => api.deleteTask(id, [])))
  actionLoading.value = false
  notify(results.some((item) => item.status === 'rejected') ? '任务已在本地清空，部分操作等待同步' : '任务清单已清空')
}

async function checkIn() {
  if (clocks.value.some((item) => item.date === toDateKey())) return notify('今天已经打过卡了', 'error')
  const record = { date: toDateKey(), studyTime: todayMinutes.value, createTime: new Date().toISOString() }
  clocks.value = [record, ...clocks.value]
  await runAction(() => api.addClock(record, clocks.value), '打卡成功，今天也很棒！')
}

async function loadStatistics() {
  statistics.value = await api.getStats(range.value)
}

async function changeRange(next) {
  range.value = next
  actionLoading.value = true
  await loadStatistics()
  actionLoading.value = false
}

async function handleOnline() {
  const synced = await flushSyncQueue()
  if (synced) notify(`网络已恢复，成功同步 ${synced} 条本地操作`)
}

onMounted(() => {
  initialize()
  window.addEventListener('online', handleOnline)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline)
  window.clearTimeout(toastId)
})
</script>

<template>
  <main>
    <ToastMessage :message="toast.message" :type="toast.type" />
    <div v-if="loading" class="loading-screen"><Leaf :size="30" /><span>正在从 Mock API 加载学习数据…</span></div>
    <template v-else>
      <AppHeader />
      <section id="focus" class="hero">
        <div class="hero-copy">
          <div class="eyebrow"><Sparkles :size="15" />Vue3 前端实训作业 · 专注学习工具</div>
          <h1>把注意力，<br /><em>留给重要的事。</em></h1>
          <p>为大学生与研究生设计的轻量化专注空间。设定目标、专注学习、每日打卡，让每一次投入都有迹可循。</p>
          <div class="hero-stats">
            <div><strong>{{ todayMinutes }}</strong><span>今日分钟</span></div>
            <div><strong>{{ completedCount }}<i>/{{ tasks.length }}</i></strong><span>完成任务</span></div>
            <div><strong>{{ clocks.length }}</strong><span>累计打卡</span></div>
          </div>
        </div>
        <TimerCard :timer="timer" :config="config" @save-config="saveConfig" @notify="notify" />
      </section>

      <section class="content-grid">
        <TaskList :tasks="tasks" :loading="actionLoading" @add="addTask" @toggle="toggleTask" @update="updateTask" @delete="deleteTask" @clear="clearTasks" @notify="notify" />
        <CheckinPanel :records="clocks" :today-minutes="todayMinutes" :loading="actionLoading" @check-in="checkIn" @notify="notify" />
      </section>

      <StatsDashboard :data="chartData" :range="range" :loading="actionLoading" @range-change="changeRange" />
      <footer>
        <a class="brand" href="#focus"><span class="brand-mark"><Leaf :size="18" /></span><span>青时</span></a>
        <p>专注当下，静待花开。</p><span>前端实训课程作业 · 数据优先存储于浏览器本地</span>
      </footer>
    </template>
  </main>
</template>
