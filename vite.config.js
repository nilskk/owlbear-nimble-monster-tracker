import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/owlbear-nimble-monster-tracker/",
  server: {
    cors: {
      origin: 'https://www.owlbear.rodeo', // Allow requests from this origin
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
      allowedHeaders: ['Content-Type'], // Specify allowed headers
    }
  }
})
