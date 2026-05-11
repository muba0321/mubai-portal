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

      // 跳过登录：无 token 时后台自动登录 admin/admin123
      if (!AuthStorage.getAccessToken()) {
        try {
          const { accessToken, refreshToken } = await AuthAPI.login({
            username: "admin",
            password: "admin123",
          });
          AuthStorage.setTokens(accessToken, refreshToken, true);
          // 获取用户信息
          try {
            const info = await userStore.getUserInfo();
            // 后端返回 role 字段（单字符串），前端需要 roles[] 和 perms[]
            userStore.userInfo = {
              userId: (info as any).userId ?? 1,
              username: (info as any).username ?? "admin",
              nickname: (info as any).nickname ?? "Admin",
              avatar: (info as any).avatar ?? "",
              roles: [(info as any).role ?? "admin"],
              perms: ["*:*:*"],
            } as any;
          } catch {
            // 静默失败，用默认信息
            userStore.userInfo = {
              userId: 1,
              username: "admin",
              nickname: "Admin",
              avatar: "",
              roles: ["admin"],
              perms: ["*:*:*"],
            } as any;
          }
        } catch {
          // 登录失败，跳回登录页
          ElMessage.warning("自动登录失败，请手动登录");
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
          NProgress.done();
          return;
        }
      }

      const permissionStore = usePermissionStore();

      // 动态路由生成
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
