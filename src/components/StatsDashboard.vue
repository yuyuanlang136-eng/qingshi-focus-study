<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarChart3, Clock3, Gauge, Trophy } from '@lucide/vue'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({ data: { type: Array, required: true }, range: { type: Number, required: true }, loading: Boolean })
const emit = defineEmits(['range-change'])
const chartElement = ref(null)
let chart
const total = computed(() => props.data.reduce((sum, item) => sum + item.studyTime, 0))
const average = computed(() => Math.round(total.value / props.range))
const best = computed(() => Math.max(0, ...props.data.map((item) => item.studyTime)))

function renderChart() {
  if (!chartElement.value) return
  chart ||= echarts.init(chartElement.value)
  chart.setOption({
    animationDuration: 500,
    grid: { left: 12, right: 12, top: 24, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', formatter: (items) => `${items[0].axisValue}<br/>专注 ${items[0].value} 分钟` },
    xAxis: {
      type: 'category', data: props.data.map((item) => item.label),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: '#7d8d87', interval: props.range === 30 ? 4 : 0 },
    },
    yAxis: { type: 'value', minInterval: 30, axisLabel: { formatter: '{value}m', color: '#9aa7a2' }, splitLine: { lineStyle: { color: '#edf1ef', type: 'dashed' } } },
    series: [{ type: 'bar', data: props.data.map((item) => item.studyTime), barMaxWidth: 30, itemStyle: { color: '#4eae91', borderRadius: [7, 7, 2, 2] } }],
  })
}

const resize = () => chart?.resize()
onMounted(() => { renderChart(); window.addEventListener('resize', resize) })
watch(() => [props.data, props.range], () => nextTick(renderChart), { deep: true })
onBeforeUnmount(() => { window.removeEventListener('resize', resize); chart?.dispose() })
</script>

<template>
  <section id="stats" class="stats-section">
    <div class="stats-copy">
      <span class="section-kicker"><BarChart3 :size="15" />学习数据</span><h2>看见积累的力量</h2><p>持续记录，让每一份努力都有迹可循。</p>
      <div class="summary-list">
        <div><span><Clock3 :size="17" />本周期专注</span><strong>{{ total }}<small> 分钟</small></strong></div>
        <div><span><Gauge :size="17" />日均专注</span><strong>{{ average }}<small> 分钟</small></strong></div>
        <div><span><Trophy :size="17" />最佳状态</span><strong>{{ best }}<small> 分钟</small></strong></div>
      </div>
    </div>
    <div class="chart-card" :aria-busy="loading">
      <div class="chart-head"><div><strong>专注时长趋势</strong><span>{{ range === 7 ? '近一周' : '近 30 天' }}学习投入</span></div>
        <div class="range-tabs"><button :class="{ active: range === 7 }" @click="emit('range-change', 7)">近 7 天</button><button :class="{ active: range === 30 }" @click="emit('range-change', 30)">近 30 天</button></div>
      </div>
      <div ref="chartElement" class="chart"></div>
    </div>
  </section>
</template>
