import { defineConfig } from 'vite'
import { hmrPlugin, presets } from 'vite-plugin-web-components-hmr'

export default defineConfig({
  server:{
    port:5000
  },
  plugins: [
    hmrPlugin({
      include: ['./src/**/*.ts'],
      presets: [presets.lit],
    }),
  ],
})