<template>
  <BaseLayout>
    <!-- 左侧菜单 -->
    <div class="layout__sidebar" :class="{ 'layout__sidebar--collapsed': !isSidebarOpen }">
      <div class="sidebar__header">
        <div class="sidebar__header-inner">
          <span v-if="isSidebarOpen" class="sidebar__title">Mubai Portal</span>
        </div>
      </div>
      <el-scrollbar class="sidebar__scrollbar">
        <LayoutSidebar :data="routes" base-path="" />
      </el-scrollbar>

      <!-- 底部用户信息 -->
      <div class="sidebar__user" :class="{ 'sidebar__user--collapsed': !isSidebarOpen }">
        <el-dropdown trigger="click" placement="top">
          <div class="sidebar__user-trigger">
            <el-avatar :size="28" :src="userStore.userInfo.avatar || undefined">
              <el-icon :size="16"><User /></el-icon>
            </el-avatar>
            <div v-if="isSidebarOpen" class="sidebar__user-info">
              <span class="sidebar__user-name">{{ userStore.userInfo.username || "用户" }}</span>
              <span class="sidebar__user-role">{{ userStore.userInfo.roles?.[0] || "" }}</span>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleProfileClick">
                {{ t("navbar.profile") }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="logout">
                {{ t("navbar.logout") }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主内容区 -->
    <div
      class="layout__main"
      :class="{
        hasTagsView: showTagsView,
        'layout__main--collapsed': !isSidebarOpen,
      }"
    >
      <LayoutNavbar />
      <LayoutTagsView v-if="showTagsView" />
      <LayoutMain />
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { User } from "@element-plus/icons-vue";
import { useUserStore } from "@/store";
import { useLayout } from "./useLayout";
import BaseLayout from "./BaseLayout.vue";
import LayoutNavbar from "./components/LayoutNavbar.vue";
import LayoutTagsView from "./components/LayoutTagsView.vue";
import LayoutMain from "./components/LayoutMain.vue";
import LayoutSidebar from "./components/LayoutSidebar.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { isSidebarOpen, routes } = useLayout();

function handleProfileClick() {
  router.push({ name: "Profile" });
}

function logout() {
  ElMessageBox.confirm("确定注销并退出系统吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    lockScroll: false,
  }).then(() => {
    userStore.logout().then(() => {
      router.push(`/login?redirect=${route.fullPath}`);
    });
  });
}
</script>

<style lang="scss" scoped>
.layout {
  &__sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 999;
    width: $sidebar-width;
    background-color: $menu-background;
    transition: width 0.28s;
    border-right: 1px solid rgba(0, 0, 0, 0.06);

    &--collapsed {
      width: $sidebar-width-collapsed;

      .sidebar__header-inner {
        justify-content: center;
      }

      .sidebar__title {
        display: none;
      }
    }

    .sidebar__header {
      width: 100%;
      height: $navbar-height;
      background-color: $sidebar-logo-background;
      border-right: none;

      .sidebar__header-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }

      .sidebar__title {
        font-size: 14px;
        font-weight: bold;
        color: $sidebar-logo-text-color;
      }
    }

    .sidebar__scrollbar {
      height: calc(100vh - $navbar-height - 56px);
    }

    .sidebar__user {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background-color: rgba(0, 0, 0, 0.1);

      &--collapsed {
        justify-content: center;
        padding: 0;

        .sidebar__user-trigger {
          justify-content: center;
        }
      }
    }

    .sidebar__user-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      :deep(.el-avatar) {
        flex-shrink: 0;
        background: var(--el-color-primary);
      }
    }

    .sidebar__user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .sidebar__user-name {
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar__user-role {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :deep(.el-menu) {
      border: none;
    }
  }

  &__main {
    position: relative;
    height: 100%;
    margin-left: $sidebar-width;
    overflow-y: auto;
    transition: margin-left 0.28s;

    &--collapsed {
      margin-left: $sidebar-width-collapsed;
    }

    .fixed-header {
      position: sticky;
      top: 0;
      z-index: 9;
      transition: width 0.28s;
    }
  }
}

/* 移动端样式*/
.mobile {
  .layout__sidebar {
    width: $sidebar-width !important;
    transition:
      transform 0.28s,
      width 0s;
  }

  &.hideSidebar {
    .layout__sidebar {
      transform: translateX(-$sidebar-width);
    }
  }

  &.openSidebar {
    .layout__sidebar {
      transform: translateX(0);
    }
  }

  .layout__main {
    margin-left: 0 !important;
  }
}

.hasTagsView {
  :deep(.app-main) {
    height: calc(100vh - $navbar-height - $tags-view-height) !important;
  }
}
</style>
