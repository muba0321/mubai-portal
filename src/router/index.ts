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
    meta: { title: "首页", icon: "el-icon-HomeFilled" },
    children: [
      {
        path: "index",
        name: "Dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: { title: "首页", icon: "el-icon-HomeFilled", affix: true },
      },
    ],
  },

  // 监控中心
  {
    path: "/monitoring",
    component: Layout,
    redirect: "/monitoring/index",
    meta: { title: "监控中心", icon: "el-icon-Monitor", sort: 3 },
    children: [
      {
        path: "index",
        name: "Monitoring",
        component: () => import("@/views/monitoring/index.vue"),
        meta: { title: "监控大屏", icon: "el-icon-Odometer", keepAlive: true },
      },
      {
        path: "grafana",
        name: "GrafanaManage",
        component: () => import("@/views/grafana/index.vue"),
        meta: { title: "面板管理", icon: "el-icon-DataBoard" },
      },
    ],
  },

  // CMDB 管理
  {
    path: "/cmdb",
    component: Layout,
    redirect: "/cmdb/index",
    meta: { title: "CMDB 管理", icon: "el-icon-Monitor" },
    children: [
      {
        path: "index",
        name: "CMDB",
        component: () => import("@/views/cmdb/index.vue"),
        meta: { title: "虚拟机管理", icon: "el-icon-Monitor" },
      },
    ],
  },

  // 数据库管理
  {
    path: "/database",
    component: Layout,
    redirect: "/database/index",
    meta: { title: "数据库管理", icon: "el-icon-DataBoard" },
    children: [
      {
        path: "index",
        name: "Database",
        component: () => import("@/views/database/index.vue"),
        meta: { title: "数据库管理", icon: "el-icon-DataBoard" },
      },
    ],
  },

  // 待办管理
  {
    path: "/todo",
    component: Layout,
    redirect: "/todo/index",
    meta: { title: "待办管理", icon: "el-icon-List" },
    children: [
      {
        path: "index",
        name: "Todo",
        component: () => import("@/views/todo/index.vue"),
        meta: { title: "待办管理", icon: "el-icon-List" },
      },
    ],
  },

  // 版本记录
  {
    path: "/changelog",
    component: Layout,
    redirect: "/changelog/index",
    meta: { title: "版本记录", icon: "el-icon-Stamp" },
    children: [
      {
        path: "index",
        name: "Changelog",
        component: () => import("@/views/changelog/index.vue"),
        meta: { title: "版本记录", icon: "el-icon-Stamp" },
      },
    ],
  },

  // 系统管理
  {
    path: "/system",
    component: Layout,
    redirect: "/system/users",
    meta: { title: "系统管理", icon: "el-icon-Setting" },
    children: [
      {
        path: "users",
        name: "UserManage",
        component: () => import("@/views/system/users/index.vue"),
        meta: { title: "用户管理", icon: "el-icon-UserFilled" },
      },
      {
        path: "settings",
        name: "SystemSetting",
        component: () => import("@/views/setting/index.vue"),
        meta: { title: "配置管理", icon: "el-icon-Tools" },
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
