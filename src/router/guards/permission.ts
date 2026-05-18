import type { RouteRecordRaw } from "vue-router";
import NProgress from "@/plugins/nprogress";
import router from "@/router";
import { usePermissionStore, useUserStore } from "@/store";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { isTenantEnabled } from "@/utils/tenant";
import { addRecentMenu } from "@/composables/useRecentMenus";
import { AuthStorage } from "@/utils/auth";

/**
 * 无需登录即可访问的白名单路由
 */
const WHITE_LIST = ["/login", "/401", "/404"];

/**
 * 路由权限守卫
 */
export function setupPermissionGuard() {
  router.beforeEach(async (to, _from, next) => {
    NProgress.start();

    try {
      const userStore = useUserStore();
      const permissionStore = usePermissionStore();
      const hasToken = !!AuthStorage.getAccessToken();

      // 白名单路由直接放行
      if (WHITE_LIST.includes(to.path)) {
        // 已登录用户访问登录页，重定向到首页
        if (to.path === "/login" && hasToken) {
          next({ path: "/" });
          return;
        }
        next();
        return;
      }

      // 无 token：重定向到登录页
      if (!hasToken) {
        next({ path: "/login", query: { redirect: to.fullPath } });
        return;
      }

      // 有 token 但路由未生成：获取用户信息并生成路由
      if (!permissionStore.isRouteGenerated) {
        await initTenantContext();

        try {
          // 从后端获取真实用户信息
          const userInfo = await userStore.getUserInfo();
          userStore.userInfo = {
            userId: userInfo.userId,
            username: userInfo.username,
            nickname: userInfo.username,
            avatar: userInfo.avatar || "",
            roles: [userInfo.role],
            perms: ["*:*:*"],
          } as any;
        } catch {
          // 获取用户信息失败（token 过期等），清除状态跳转登录
          userStore.resetUserState();
          next({ path: "/login", query: { redirect: to.fullPath } });
          return;
        }

        const dynamicRoutes = await permissionStore.generateRoutes();
        dynamicRoutes.forEach((route: RouteRecordRaw) => {
          router.addRoute(route);
        });

        next({ ...to, replace: true });
        return;
      }

      // 路由已生成，检查 404
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
