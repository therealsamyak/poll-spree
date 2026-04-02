import path from "node:path"

import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    tanstackStart({
      router: {
        generatedRouteTree: "./routeTree.gen.ts",
        routesDirectory: "./routes",
      },
      srcDirectory: "src",
    }),
    nitro(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    hmr: true,
    port: 3010,
    watch: {
      usePolling: true,
    },
  },
})
