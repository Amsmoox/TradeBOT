// vite.config.ts
import { defineConfig } from "file:///home/othmane/Repos/Projects/Intern/TradeBOT/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///home/othmane/Repos/Projects/Intern/TradeBOT/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/home/othmane/Repos/Projects/Intern/TradeBOT/frontend";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    // Temporarily disable runtime error overlay to avoid browser extension conflicts
    // runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("file:///home/othmane/Repos/Projects/Intern/TradeBOT/frontend/node_modules/@replit/vite-plugin-cartographer/dist/index.mjs").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "@shared": path.resolve(__vite_injected_original_dirname, "shared"),
      "@assets": path.resolve(__vite_injected_original_dirname, "assets")
    }
  },
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9vdGhtYW5lL1JlcG9zL1Byb2plY3RzL0ludGVybi9UcmFkZUJPVC9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvb3RobWFuZS9SZXBvcy9Qcm9qZWN0cy9JbnRlcm4vVHJhZGVCT1QvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvb3RobWFuZS9SZXBvcy9Qcm9qZWN0cy9JbnRlcm4vVHJhZGVCT1QvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBydW50aW1lRXJyb3JPdmVybGF5IGZyb20gXCJAcmVwbGl0L3ZpdGUtcGx1Z2luLXJ1bnRpbWUtZXJyb3ItbW9kYWxcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgLy8gVGVtcG9yYXJpbHkgZGlzYWJsZSBydW50aW1lIGVycm9yIG92ZXJsYXkgdG8gYXZvaWQgYnJvd3NlciBleHRlbnNpb24gY29uZmxpY3RzXG4gICAgLy8gcnVudGltZUVycm9yT3ZlcmxheSgpLFxuICAgIC4uLihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgJiZcbiAgICBwcm9jZXNzLmVudi5SRVBMX0lEICE9PSB1bmRlZmluZWRcbiAgICAgID8gW1xuICAgICAgICAgIGF3YWl0IGltcG9ydChcIkByZXBsaXQvdml0ZS1wbHVnaW4tY2FydG9ncmFwaGVyXCIpLnRoZW4oKG0pID0+XG4gICAgICAgICAgICBtLmNhcnRvZ3JhcGhlcigpLFxuICAgICAgICAgICksXG4gICAgICAgIF1cbiAgICAgIDogW10pLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcbiAgICAgIFwiQHNoYXJlZFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNoYXJlZFwiKSxcbiAgICAgIFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImFzc2V0c1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0XCIpLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogdHJ1ZSxcbiAgICAgIGRlbnk6IFtcIioqLy4qXCJdLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVYsU0FBUyxvQkFBb0I7QUFDOVcsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQTtBQUFBLElBR04sR0FBSSxRQUFRLElBQUksYUFBYSxnQkFDN0IsUUFBUSxJQUFJLFlBQVksU0FDcEI7QUFBQSxNQUNFLE1BQU0sT0FBTywySEFBa0MsRUFBRTtBQUFBLFFBQUssQ0FBQyxNQUNyRCxFQUFFLGFBQWE7QUFBQSxNQUNqQjtBQUFBLElBQ0YsSUFDQSxDQUFDO0FBQUEsRUFDUDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQ2xDLFdBQVcsS0FBSyxRQUFRLGtDQUFXLFFBQVE7QUFBQSxNQUMzQyxXQUFXLEtBQUssUUFBUSxrQ0FBVyxRQUFRO0FBQUEsSUFDN0M7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRLEtBQUssUUFBUSxrQ0FBVyxNQUFNO0FBQUEsSUFDdEMsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxNQUNSLE1BQU0sQ0FBQyxPQUFPO0FBQUEsSUFDaEI7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
