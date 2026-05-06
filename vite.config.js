import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// Reads version from package.json and injects it into manifest files in dist/
const manifestVersionPlugin = () => ({
  name: 'manifest-version-plugin',
  buildStart() {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
    const files = ['./public/manifest.json', './public/manifest_test.json']

    files.forEach((filePath) => {
      if (!fs.existsSync(filePath)) return
      const manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      manifest.version = pkg.version
      fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n')
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), manifestVersionPlugin()],
  base: "/owlbear-nimble-monster-tracker/",
  server: {
    cors: {
      origin: 'https://www.owlbear.rodeo', // Allow requests from this origin
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
      allowedHeaders: ['Content-Type'], // Specify allowed headers
    }
  }
})
