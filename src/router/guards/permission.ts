import type { RouteRecordRaw } from "vue-router";
import NProgress from "@/plugins/nprogress";
import router from "@/router";
import { usePermissionStore, useUserStore } from "@/store";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { isTenantEnabled } from "@/utils/tenant";
import { addRecentMenu } from "@/composables/useRecentMenus";
import { AuthStorage } from "@/utils/auth";
import AuthAPI from "@/api/auth";

/**
 * 路由权限守卫
 */
export function setupPermissionGuard() {
  router.beforeEach(async (to, _from, next) => {
    NProgress.start();

    try {
      const userStore = useUserStore();

      // 清除旧 token，重新登录获取有效 token
      AuthStorage.clearAuth();

      try {
        const { accessToken, refreshToken } = await AuthAPI.login({
          username: "admin",
          password: "admin123",
        });
        AuthStorage.setTokens(accessToken, refreshToken, true);
      } catch {
        console.warn("自动登录失败，继续使用 mock 信息");
      }

      userStore.userInfo = {
        userId: 1,
        username: "admin",
        nickname: "Admin",
        avatar: "",
        roles: ["admin"],
        perms: ["*:*:*"],
      } as any;

      const permissionStore = usePermissionStore();

      // 路由生成
      if (!permissionStore.isRouteGenerated) {
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
      NProgress.done();
      next("/404");
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
