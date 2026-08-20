<script setup>
import { computed, reactive, ref } from 'vue'
import { BookOpen, Coffee, Pause, Play, RefreshCcw, RotateCcw, Save, Settings2 } from '@lucide/vue'

const props = defineProps({ timer: { type: Object, required: true }, config: { type: Object, required: true } })
const emit = defineEmits(['save-config', 'notify'])
const settingsOpen = ref(false)
const draft = reactive({ studyDuration: props.config.studyDuration, restDuration: props.config.restDuration })
const ringStyle = computed(() => ({ '--progress': `${props.timer.progress.value * 3.6}deg` }))

function openSettings() {
  draft.studyDuration = props.config.studyDuration
  draft.restDuration = props.config.restDuration
  settingsOpen.value = !settingsOpen.value
}

function saveConfig() {
  const study = Number(draft.studyDuration)
  const rest = Number(draft.restDuration)
  if (!Number.isFinite(study) || !Number.isFinite(rest) || study < 1 || study > 180 || rest < 1 || rest > 60) {
    emit('notify', '请输入有效时长：专注 1–180 分钟，休息 1–60 分钟', 'error')
    return
  }
  emit('save-config', { studyDuration: Math.round(study), restDuration: Math.round(rest) })
  settingsOpen.value = false
}
</script>

<template>
  <section class="timer-card" aria-label="番茄专注计时器">
    <div class="timer-head">
      <div class="mode-tabs">
        <button :class="{ active: timer.mode.value === 'study' }" @click="timer.switchMode('study')"><BookOpen :size="15" />专注</button>
        <button :class="{ active: timer.mode.value === 'rest' }" @click="timer.switchMode('rest')"><Coffee :size="15" />休息</button>
      </div>
      <button class="icon-btn" aria-label="计时设置" @click="openSettings"><Settings2 :size="19" /></button>
    </div>

    <div v-if="settingsOpen" class="settings-panel">
      <label>专注分钟<input v-model="draft.studyDuration" type="number" min="1" max="180" /></label>
      <label>休息分钟<input v-model="draft.restDuration" type="number" min="1" max="60" /></label>
      <button @click="saveConfig"><Save :size="15" />保存</button>
    </div>

    <div class="timer-ring" :style="ringStyle">
      <div class="timer-inner">
        <span>{{ timer.mode.value === 'study' ? '保持专注' : '放松片刻' }}</span>
        <strong>{{ timer.displayTime.value }}</strong>
        <small>{{ timer.running.value ? '计时进行中' : '准备好了就开始' }}</small>
      </div>
    </div>

    <div class="timer-actions">
      <button class="sub-action" aria-label="重置计时" @click="timer.reset"><RotateCcw :size="20" /></button>
      <button class="primary-action" @click="timer.running.value ? timer.pause() : timer.start()">
        <Pause v-if="timer.running.value" :size="22" fill="currentColor" />
        <Play v-else :size="22" fill="currentColor" />
        <span>{{ timer.running.value ? '暂停一下' : '开始专注' }}</span>
      </button>
      <button class="sub-action" aria-label="切换专注与休息" @click="timer.switchMode(timer.mode.value === 'study' ? 'rest' : 'study')"><RefreshCcw :size="20" /></button>
    </div>
    <p class="timer-tip">完成一轮将自动记录 {{ config.studyDuration }} 分钟专注时长</p>
  </section>
</template>
