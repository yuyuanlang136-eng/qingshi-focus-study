<script setup>
import { CalendarCheck, Leaf } from '@lucide/vue'
import { WEEK_LABELS } from '../utils/date'

const today = new Date()
</script>

<template>
  <header class="topbar">
    <a class="brand" href="#focus" aria-label="青时首页">
      <span class="brand-mark"><Leaf :size="21" /></span>
      <span>青时</span><small>专注学习助手</small>
    </a>
    <nav aria-label="页面导航">
      <a href="#focus">专注</a><a href="#tasks">任务</a><a href="#checkin">打卡</a><a href="#stats">统计</a>
    </nav>
    <div class="today-chip">
      <CalendarCheck :size="16" />{{ today.getMonth() + 1 }}月{{ today.getDate() }}日 · 周{{ WEEK_LABELS[today.getDay()] }}
    </div>
  </header>
</template>
