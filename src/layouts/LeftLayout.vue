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
import { useLayout } from "./useLayout";
import BaseLayout from "./BaseLayout.vue";
import LayoutNavbar from "./components/LayoutNavbar.vue";
import LayoutTagsView from "./components/LayoutTagsView.vue";
import LayoutMain from "./components/LayoutMain.vue";
import LayoutSidebar from "./components/LayoutSidebar.vue";

const { isSidebarOpen, routes } = useLayout();
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
      height: calc(100vh - $navbar-height);
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
