import type { App } from "vue";
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

export const Layout = () => import("@/layouts/index.vue");

// 静态路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: "/redirect/:path(.*)",
        component: () => import("@/views/redirect/index.vue"),
      },
    ],
  },

  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: { hidden: true },
  },

  // 根路径重定向
  {
    path: "/",
    component: Layout,
    redirect: "/dashboard",
    meta: { hidden: true },
    children: [],
  },

  // 首页
  {
    path: "/dashboard",
    component: Layout,
    redirect: "/dashboard/index",
    meta: { title: "首页", icon: "homepage" },
    children: [
      {
        path: "index",
        name: "Dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: { title: "首页", icon: "homepage", affix: true },
      },
    ],
  },

  // CMDB 管理
  {
    path: "/cmdb",
    component: Layout,
    redirect: "/cmdb/index",
    meta: { title: "CMDB 管理", icon: "monitor" },
    children: [
      {
        path: "index",
        name: "CMDB",
        component: () => import("@/views/cmdb/index.vue"),
        meta: { title: "虚拟机管理", icon: "monitor" },
      },
    ],
  },

  // 数据库管理
  {
    path: "/database",
    component: Layout,
    redirect: "/database/index",
    meta: { title: "数据库管理", icon: "el-icon-Coin" },
    children: [
      {
        path: "index",
        name: "Database",
        component: () => import("@/views/database/index.vue"),
        meta: { title: "数据库管理", icon: "el-icon-Coin" },
      },
    ],
  },

  // 隐藏路由
  {
    path: "/401",
    component: () => import("@/views/error/401.vue"),
    meta: { hidden: true },
  },
  {
    path: "/404",
    component: () => import("@/views/error/404.vue"),
    meta: { hidden: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("@/views/profile/index.vue"),
    meta: { hidden: true },
  },
  {
    path: "/my-notice",
    name: "MyNotice",
    component: () => import("@/views/profile/notice/index.vue"),
    meta: { hidden: true },
  },
  {
    path: "/detail/:id(\\d+)",
    name: "DemoDetail",
    component: () => import("@/views/demo/detail.vue"),
    meta: { hidden: true, keepAlive: true },
  },
];

/**
 * 创建路由
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

// 全局注册 router
export function setupRouter(app: App<Element>) {
  app.use(router);
}

export default router;
