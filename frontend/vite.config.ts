import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5175,
host: '0.0.0.0', // 允许外部访问
cors: true,
open: true,
    headers: {
      'Access-Control-Allow-Origin': '*' // 允许跨域访问，根据需要设置
    }
  },
})
