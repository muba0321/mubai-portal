<template>
  <div class="navbar">
    <div class="flex-y-center">
      <!-- 菜单折叠按钮 -->
      <Hamburger :is-active="isSidebarOpened" @toggle-click="toggleSideBar" />
      <!-- 面包屑导航栏（首页不显示） -->
      <Breadcrumb v-if="showBreadcrumb" />
    </div>
    <!-- 导航栏操作区域-->
    <div class="navbar__actions">
      <LayoutToolbar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from "@/store";
import Hamburger from "@/components/Hamburger/index.vue";
import Breadcrumb from "@/components/Breadcrumb/index.vue";

const appStore = useAppStore();

const isSidebarOpened = computed(() => appStore.sidebar.opened);
const currentRoute = useRoute();

// 首页不显示面包屑
const showBreadcrumb = computed(() => {
  return currentRoute.name !== "Dashboard";
});

function toggleSideBar() {
  appStore.toggleSidebar();
}
</script>

<style lang="scss" scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $navbar-height;

  &__actions {
    display: flex;
    align-items: center;
    height: 100%;
  }
}
</style>
