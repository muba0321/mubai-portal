import type { RouteRecordRaw } from "vue-router";
import { constantRoutes } from "@/router";
import { store } from "@/store";
import router from "@/router";
import { useUserStoreHook } from "@/store/modules/user";

export const usePermissionStore = defineStore("permission", () => {
  const routes = ref<RouteRecordRaw[]>([]);
  const mixLayoutSideMenus = ref<RouteRecordRaw[]>([]);
  const isRouteGenerated = ref(false);

  /** 生成动态路由 — 当前使用静态路由，无需从后端获取 */
  async function generateRoutes(): Promise<RouteRecordRaw[]> {
    routes.value = [...constantRoutes];
    isRouteGenerated.value = true;
    return [];
  }

  const setMixLayoutSideMenus = (parentPath: string) => {
    const parentMenu = routes.value.find((item: RouteRecordRaw) => item.path === parentPath);
    mixLayoutSideMenus.value = parentMenu?.children || [];
  };

  const resetRouter = () => {
    routes.value = [...constantRoutes];
    mixLayoutSideMenus.value = [];
    isRouteGenerated.value = false;
  };

  let reloadPromise: Promise<RouteRecordRaw[]> | null = null;

  async function reloadDynamicRoutesOnce(): Promise<RouteRecordRaw[]> {
    if (reloadPromise) return reloadPromise;
    reloadPromise = (async () => {
      try {
        resetRouter();
        return [];
      } finally {
        reloadPromise = null;
      }
    })();
    return reloadPromise;
  }

  let snapshotPromise: Promise<void> | null = null;

  async function reloadPermissionSnapshotOnce(): Promise<void> {
    if (snapshotPromise) return snapshotPromise;
    snapshotPromise = (async () => {
      try {
        const userStore = useUserStoreHook();
        await userStore.getUserInfo();
        await reloadDynamicRoutesOnce();
      } finally {
        snapshotPromise = null;
      }
    })();
    return snapshotPromise;
  }

  return {
    routes,
    mixLayoutSideMenus,
    isRouteGenerated,
    generateRoutes,
    setMixLayoutSideMenus,
    resetRouter,
    reloadDynamicRoutesOnce,
    reloadPermissionSnapshotOnce,
  };
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
