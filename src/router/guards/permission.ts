import type { RouteRecordRaw } from "vue-router";
import NProgress from "@/plugins/nprogress";
import router from "@/router";
import { usePermissionStore, useUserStore } from "@/store";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { isTenantEnabled } from "@/utils/tenant";
import { addRecentMenu } from "@/composables/useRecentMenus";
import { AuthStorage } from "@/utils/auth";

/**
 * 路由权限守卫
 */
export function setupPermissionGuard() {
  router.beforeEach(async (to, _from, next) => {
    NProgress.start();

    try {
      const userStore = useUserStore();

      // 无后端时设置默认 token（有效 JWT 格式），跳过登录
      // 如果已有 token 但格式不对（不是标准 JWT 三段式），也重置为 mock token
      const token = AuthStorage.getAccessToken();
      const isValidJwt = token && token.split(".").length === 3;
      if (!token || !isValidJwt) {
        const mockJwt =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsIm5pY2tuYW1lIjoiQWRtaW4iLCJpYXQiOjE3NDY5NDA4MDAsImV4cCI6MjA2MjMwMDgwMH0.mock-signature";
        const mockRefresh =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NDY5NDA4MDAsImV4cCI6MjA2MjMwMDgwMH0.mock-refresh-signature";
        AuthStorage.setTokens(mockJwt, mockRefresh, false);
        userStore.userInfo = {
          userId: 1,
          username: "admin",
          nickname: "Admin",
          avatar: "",
          roles: ["admin"],
          perms: ["*:*:*"],
        } as any;
      }

      const permissionStore = usePermissionStore();

      // 动态路由生成
      if (!permissionStore.isRouteGenerated) {
        // 已禁用 SSE（无后端时避免报错）
        // 已禁用 getUserInfo API 调用（无后端时静默跳过）

        await initTenantContext();

        const dynamicRoutes = await permissionStore.generateRoutes();
        dynamicRoutes.forEach((route: RouteRecordRaw) => {
          router.addRoute(route);
        });

        next({ ...to, replace: true });
        return;
      }

      // 路由 404 检查
      if (to.matched.length === 0) {
        next("/404");
        return;
      }

      next();
    } catch (error) {
      console.error("Route guard error:", error);
      next("/");
      NProgress.done();
    }
  });

  router.afterEach((to) => {
    NProgress.done();

    if (to.meta?.title && to.path) {
      const icon = typeof to.meta.icon === "string" ? to.meta.icon : undefined;
      addRecentMenu(to.path, to.meta.title as string, icon);
    }
  });
}

async function initTenantContext(): Promise<void> {
  if (!isTenantEnabled()) return;
  try {
    await useTenantStoreHook().loadTenant();
  } catch {
    // 静默失败
  }
}
