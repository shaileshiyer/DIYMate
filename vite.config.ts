import { defineConfig } from 'vite'
import { hmrPlugin, presets } from 'vite-plugin-web-components-hmr'
import {resolve} from 'path'

function resolveDir(relativeDir) {
  return resolve(__dirname, relativeDir);
}

export default defineConfig({
  server:{
    port:5000
  },
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: 'tsconfig.json'
    }
  },
  plugins: [
    hmrPlugin({
      include: ['./src/**/*.ts'],
      presets: [presets.lit],
    }),
  ],
  resolve:{
    alias:{
      '@core':resolveDir('./src/core'),
      '@services': resolveDir('./src/core/services'),
      '@models':resolveDir('./src/models'),
      '@lib':resolveDir('./src/lib'),
      '@components':resolveDir('./src/components'),
      '@operations':resolveDir('./src/core/operations'),
      '@context':resolveDir('./src/context')
    }
  }
})