/**
 * 应用启动入口
 *
 * @description
 * Vue3 应用初始化，包括样式、插件、配置的加载
 */

import { createApp } from "vue";
import App from "./App.vue";

// ===== 样式导入 =====
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "vxe-table/lib/style.css";
import "@/styles/index.scss";
import "uno.css";
import "animate.css";

// ===== 核心配置 =====
import { setupDirective } from "@/directives";
import { setupI18n } from "@/lang";
import { setupRouter } from "@/router";
import { setupStore } from "@/store";
import { useSystemSettingStore } from "@/store/modules/system-setting";

// ===== 全局组件 =====
import * as ElementPlusIcons from "@element-plus/icons-vue";

// ===== 第三方插件 =====
import VXETable from "vxe-table";
import { configureVxeTable } from "@/plugins/vxe-table";

// ===== 路由守卫 =====
import { setupPermissionGuard } from "@/router/guards/permission";

// 创建 Vue 应用实例
const app = createApp(App);

// 1️⃣ 核心配置
setupDirective(app);
setupRouter(app);
setupStore(app);

// 加载系统配置（公开接口，无需鉴权）
const systemSettingStore = useSystemSettingStore();
systemSettingStore.restoreFromCache();
systemSettingStore.fetchSettings().catch(() => {
  // 静默失败，使用缓存数据
});

setupI18n(app);

// 2️⃣ 全局组件（Element Plus 图标）
Object.entries(ElementPlusIcons).forEach(([name, comp]) => app.component(name, comp));

// 3️⃣ 第三方插件
configureVxeTable();
app.use(VXETable);

// 4️⃣ 路由守卫
setupPermissionGuard();

// 5️⃣ 挂载应用
app.mount("#app");
