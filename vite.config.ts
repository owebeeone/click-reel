import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false, // Don't clear dist folder (preserve .d.ts files from tsc)
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ClickReel",
      formats: ["es", "umd"],
      fileName: (format) => `click-reel.${format}.js`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@dnd-kit/core",
        "@dnd-kit/utilities",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "react/jsx-runtime",
          "@dnd-kit/core": "DndKit",
          "@dnd-kit/utilities": "DndKitUtilities",
        },
      },
    },
    sourcemap: true,
    // Ensure tree-shaking works properly
    minify: "esbuild",
  },
  // Development server for demo
  root: ".",
  publicDir: "public",
});
