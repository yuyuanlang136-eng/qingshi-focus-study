import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { port: 5173 },
  build: {
    // ECharts 单独拆包，降低主页面首次加载体积。
    rollupOptions: {
      output: {
        manualChunks: { echarts: ['echarts'] },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
