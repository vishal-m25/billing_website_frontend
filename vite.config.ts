import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    allowedHosts: ['billing-website-frontend.onrender.com']
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // ✅ Disable source maps in production
  },
  // ✅ Optional: Disable sourcemaps for dependencies too
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false,
    },
  },
}));
