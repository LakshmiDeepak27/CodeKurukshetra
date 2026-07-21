import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "../Editor/public",
  // The editor is imported from the legacy Editor folder. Ensure its Monaco
  // dependency shares this app's React instance instead of loading a second one.
  resolve: { dedupe: ["react", "react-dom"] },
  server: { 
    fs: { allow: [".."] },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
});
