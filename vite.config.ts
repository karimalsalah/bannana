import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Served from https://usephedm.github.io/bannana/ in production (GitHub Pages),
// and from "/" in local dev.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/bannana/" : "/",
  plugins: [
    // banana-wallet-sdk (and other web3 deps) reference Node globals in the browser.
    nodePolyfills({ globals: { Buffer: true, global: true, process: true } }),
    react(),
    wasm(),
    topLevelAwait(),
  ],
  build: {
    // WebGPU + Rapier WASM + top-level await need a modern target.
    target: "esnext",
    sourcemap: false,
  },
  optimizeDeps: {
    // Rapier ships WASM; let Vite handle it through the wasm plugin.
    exclude: ["@dimforge/rapier3d-simd"],
  },
  server: {
    port: 5173,
    proxy: {
      // Forward API + auth + websocket to the Elysia/Bun backend in dev.
      "/api": "http://localhost:3000",
      "/ws": { target: "ws://localhost:3000", ws: true },
    },
  },
}));
