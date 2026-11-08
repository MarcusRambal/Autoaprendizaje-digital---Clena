import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL("../", import.meta.url));
  const env = loadEnv(mode, envDir, "VITE_");
  return {
    envDir,
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
