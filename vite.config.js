import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // ปรับขนาดแจ้งเตือนให้มากขึ้นเพื่อไม่ให้กวนใจ
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // แยกไลบรารีใหญ่ๆ ออกจากไฟล์หลัก
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // แยกไฟล์จาก node_modules ไปไว้ที่ chunk ชื่อ vendor
          }
        }
      }
    }
  }
});