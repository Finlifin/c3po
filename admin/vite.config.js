import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 启用gzip压缩
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10KB以上才压缩
      algorithm: 'gzip',
      ext: '.gz'
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    },
    // 预构建第三方依赖
    include: ['vue', 'vue-router', 'echarts', 'vue-echarts']
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          // 将第三方依赖打包到vendor.js
          vendor: ['vue', 'vue-router', 'echarts', 'vue-echarts'],
          // 将公共组件和工具函数打包到common.js
          common: ['@/components/layout/MainLayout.vue', '@/services/api.js']
        },
        // 动态导入的chunk命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 生成sourcemap（生产环境可以关闭）
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    // 配置API代理
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
