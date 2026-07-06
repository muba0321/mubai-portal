import { resolve } from "path";
import { readFileSync } from "fs";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import mockDevServerPlugin from "vite-plugin-mock-dev-server";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import UnoCSS from "unocss/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf-8"));
const __APP_INFO__ = {
  pkg: { name: pkg.name, version: pkg.version },
  lastBuildTime: new Date().toLocaleString(),
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const enableMock = env.VITE_MOCK_DEV_SERVER === "true";

  return {
    plugins: [
      vue(),
      ...(enableMock
        ? [mockDevServerPlugin({ mockDirs: resolve(process.cwd(), "mock") })]
        : []),
      AutoImport({
        imports: ["vue", "vue-router", "pinia", "@vueuse/core", "vue-i18n"],
        dts: "src/types/auto-imports.d.ts",
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        dts: "src/types/components.d.ts",
        dirs: ["src/components"],
        resolvers: [ElementPlusResolver()],
      }),
      UnoCSS(),
    ],
    resolve: {
      alias: {
        "@": resolve(process.cwd(), "src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/variables" as *;`,
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: Number(env.VITE_APP_PORT) || 3000,
      proxy: {
        // 开发环境代理：/dev-api/api/v1/... -> /api/v1/...
        [env.VITE_APP_BASE_API]: {
          target: env.VITE_APP_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp("^" + env.VITE_APP_BASE_API + "/api"), "/api"),
        },
        // 直接代理 /api 前缀的请求到后端（处理绝对路径调用）
        "/api": {
          target: env.VITE_APP_API_URL,
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      exclude: [
        "codemirror-editor-vue3",
        "codemirror",
        "vue-draggable-plus",
        "@wangeditor-next/editor",
        "@wangeditor-next/editor-for-vue",
      ],
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
    define: {
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    },
  };
});
