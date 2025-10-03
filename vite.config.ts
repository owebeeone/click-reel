import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false, // Don't clear dist folder (preserve .d.ts files from tsc)
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ClickReel',
      formats: ['es', 'umd'],
      fileName: (format) => `click-reel.${format}.js`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    // Ensure tree-shaking works properly
    minify: 'esbuild',
  },
  // Development server for demo
  root: '.',
  publicDir: 'public',
});
