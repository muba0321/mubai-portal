<template>
  <div class="cicd-page">
    <div class="page-header">
      <h2 class="page-title">CICD 规划 vs 实际进展</h2>
      <p class="page-desc">DevOps 8 阶段落地追踪 · 持续更新</p>
    </div>
    <CICDProgressBoard />
  </div>
</template>

<script setup lang="ts">
import CICDProgressBoard from "@/views/dashboard/components/CICDProgressBoard.vue";
</script>

<style scoped>
.cicd-page {
  padding: 20px;
  background: #0a0e27;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}
</style>
