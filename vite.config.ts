import { defineConfig } from 'vite';
import path from 'path';
import litCssPlugin from './lit-css-plugin';

/**
 * Convenience wrapper for path.resolve().
 */
export function resolveDir(relativeDir) {
    return path.resolve(__dirname, relativeDir);
  }
  
  


export default defineConfig(()=>{
    return {
        resolve: {
            extensions: ['.ts', '.ts', '.js', '.css'],
            alias: {
                '@components': resolveDir('frontend/app/components'),
                '@context': resolveDir('frontend/app/context'),
                '@core': resolveDir('frontend/app/core'),
                '@lib': resolveDir('frontend/app/lib'),
                '@models': resolveDir('frontend/app/models'),
                '@operations': resolveDir('frontend/app/core/operations'),
                '@services': resolveDir('frontend/app/core/services'),
            }
        }
    };
})