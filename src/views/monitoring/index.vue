<template>
  <div class="monitoring-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon :size="22"><Monitor /></el-icon>
        <span>监控中心</span>
      </div>
      <div class="page-subtitle">
        <span class="refresh-indicator"></span>
        数据实时刷新中
      </div>
    </div>

    <!-- 全局 KPI -->
    <GlobalKPI />

    <!-- 中间行: 服务器矩阵 + Target 状态 -->
    <div class="middle-row">
      <div class="left-panel">
        <ServerMatrix />
      </div>
      <div class="right-panel">
        <TargetStatus />
      </div>
    </div>

    <!-- 趋势图行 -->
    <div class="trend-row">
      <TrendChart
        title="CPU 使用率趋势 (24h)"
        :fetch-fn="() => MonitoringAPI.getCpuMetrics(24, '5m')"
        unit="%"
        :grafana-link="grafanaUrl + '/d/linux-monitor-sre/linux-e79b91-e68ea7-e99da2-e69dbf'"
      />
      <TrendChart
        title="内存使用率趋势 (24h)"
        :fetch-fn="() => MonitoringAPI.getMemoryMetrics(24, '5m')"
        unit="%"
        :grafana-link="grafanaUrl + '/d/linux-monitor-sre/linux-e79b91-e68ea7-e99da2-e69dbf'"
      />
    </div>

    <!-- 分类监控 -->
    <CategoryTabs />
  </div>
</template>

<script setup lang="ts">
import { Monitor } from "@element-plus/icons-vue";
import MonitoringAPI from "@/api/monitoring";
import GlobalKPI from "./components/GlobalKPI.vue";
import ServerMatrix from "./components/ServerMatrix.vue";
import TargetStatus from "./components/TargetStatus.vue";
import TrendChart from "./components/TrendChart.vue";
import CategoryTabs from "./components/CategoryTabs.vue";

defineOptions({ name: "Monitoring" });

const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || "https://grafana.mubai.top";
</script>

<style scoped>
.monitoring-page {
  background: #0f1923;
  min-height: 100vh;
  padding: 20px;
  color: #e5e6eb;
}

.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #2d3748;
}
.page-title { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; color: #fff; }
.page-subtitle { font-size: 12px; color: #86909c; display: flex; align-items: center; gap: 6px; }
.refresh-indicator {
  width: 6px; height: 6px; border-radius: 50%; background: #69db7c;
  box-shadow: 0 0 6px #69db7c; animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.middle-row { display: grid; grid-template-columns: 1fr 240px; gap: 16px; margin-bottom: 16px; }
.right-panel { min-height: 0; }

.trend-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
</style>
