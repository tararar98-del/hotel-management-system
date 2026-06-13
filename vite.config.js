import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // เพิ่มบรรทัดนี้: ต้องเป็นชื่อเดียวกับ Repository ของคุณใน GitHub
  base: '/hotel-management-system/', 
  build: {
    chunkSizeWarningLimit: 1000,
  }
});