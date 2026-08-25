<template>
  <div class="cicd-page">
    <div class="page-header">
      <h2 class="page-title">CICD 流程阶段看板</h2>
      <p class="page-desc">展示 CICD 全流程各阶段的完成情况，点击阶段可查看对应需求</p>
    </div>
    <CICDBoard />
  </div>
</template>

<script setup lang="ts">
import CICDBoard from "@/views/dashboard/components/CICDBoard.vue";
</script>

<style scoped>
.cicd-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}
</style>
