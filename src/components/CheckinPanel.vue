<script setup>
import { computed } from 'vue'
import { CalendarCheck, Check, Flame } from '@lucide/vue'
import { calculateStreak, recentDates, toDateKey, WEEK_LABELS } from '../utils/date'

const props = defineProps({ records: { type: Array, required: true }, todayMinutes: { type: Number, required: true }, loading: Boolean })
const emit = defineEmits(['check-in', 'notify'])
const today = new Date()
const checkedToday = computed(() => props.records.some((item) => item.date === toDateKey()))
const streak = computed(() => calculateStreak(props.records))
const recentWeek = computed(() => recentDates(7).map((date) => ({
  key: toDateKey(date),
  weekday: WEEK_LABELS[date.getDay()],
  day: date.getDate(),
  checked: props.records.some((item) => item.date === toDateKey(date)),
})))

function checkIn() {
  if (checkedToday.value) return emit('notify', '今天已经打过卡了，请明天再来', 'error')
  if (props.todayMinutes <= 0) return emit('notify', '请先完成一次专注学习，再进行打卡', 'error')
  emit('check-in')
}
</script>

<template>
  <section id="checkin" class="panel checkin-panel">
    <div class="section-head">
      <div><span class="section-kicker"><CalendarCheck :size="15" />每日打卡</span><h2>记录今天的努力</h2></div>
      <span class="streak"><Flame :size="15" />连续 {{ streak }} 天</span>
    </div>
    <div class="checkin-hero" :class="{ checked: checkedToday }">
      <div class="date-card"><span>周{{ WEEK_LABELS[today.getDay()] }}</span><strong>{{ today.getDate() }}</strong><small>{{ today.getFullYear() }}.{{ String(today.getMonth() + 1).padStart(2, '0') }}</small></div>
      <div><span>今日累计专注</span><strong>{{ todayMinutes }}<small> 分钟</small></strong><p>{{ checkedToday ? '今日打卡已完成，继续保持 ✨' : todayMinutes ? '每一段专注，都值得被记录' : '完成一次专注后再来打卡吧' }}</p></div>
    </div>
    <button class="checkin-button" :disabled="checkedToday || loading" @click="checkIn"><Check v-if="checkedToday" :size="20" /><CalendarCheck v-else :size="20" />{{ checkedToday ? '今日已打卡' : '完成今日打卡' }}</button>
    <div class="recent-title"><span>近期记录</span><small>最近 7 天</small></div>
    <div class="week-checks">
      <div v-for="day in recentWeek" :key="day.key" :class="{ active: day.checked }"><span>{{ day.weekday }}</span><i><Check v-if="day.checked" :size="14" /><template v-else>{{ day.day }}</template></i></div>
    </div>
  </section>
</template>
