import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 👈 เพิ่มบรรทัดนี้

// https://vitejs.dev/config/


export default defineConfig({
  plugins: [react()],
  // 👇 เพิ่ม block นี้เพื่อตั้งค่า alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

})