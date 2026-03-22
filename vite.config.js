// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'

// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     host: '0.0.0.0',
//     port: 5173,
//     proxy: {
//       '/api': {
//         target: 'http://127.0.0.1:9000',
//         changeOrigin: true
//       }
//     }
//   }
// })

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://10.18.14.254:9000',
        changeOrigin: true
      },
      '/public/system': {
        target: 'http://10.18.14.254:9100',
        changeOrigin: true
      }
    }
  }
})