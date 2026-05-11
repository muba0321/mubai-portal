import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import mockDevServerPlugin from "vite-plugin-mock-dev-server";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import UnoCSS from "unocss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      vue(),
      mockDevServerPlugin({
        mockDirs: resolve(process.cwd(), "mock"),
      }),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        dts: "src/types/auto-imports.d.ts",
      }),
      Components({
        dts: "src/types/components.d.ts",
        dirs: ["src/components"],
      }),
      UnoCSS(),
    ],
    resolve: {
      alias: {
        "@": resolve(process.cwd(), "src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: Number(env.VITE_APP_PORT) || 3000,
      proxy: {
        [env.VITE_APP_BASE_API]: {
          target: env.VITE_APP_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp("^" + env.VITE_APP_BASE_API), ""),
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
  };
});
