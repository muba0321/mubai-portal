<template>
  <div class="global-kpi">
    <div v-for="item in kpiList" :key="item.label" class="kpi-card" :class="item.statusClass">
      <div class="kpi-value">{{ item.value }}</div>
      <div class="kpi-label">{{ item.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MonitoringAPI from "@/api/monitoring";
import { useIntervalFn } from "@vueuse/core";

const summary = ref<MonitoringAPI.MonitoringSummary | null>(null);

const kpiList = computed(() => {
  if (!summary.value) return [];
  const s = summary.value;
  return [
    { label: "服务器在线", value: `${s.serverOnline} 台`, statusClass: s.serverOnline >= 3 ? "green" : "red" },
    { label: "Targets UP", value: `${s.upTargets}/${s.totalTargets}`, statusClass: s.downTargets === 0 ? "green" : "red" },
    { label: "平均 CPU", value: `${s.avgCpu}%`, statusClass: s.avgCpu < 80 ? "green" : s.avgCpu < 90 ? "orange" : "red" },
    { label: "平均内存", value: `${s.avgMemory}%`, statusClass: s.avgMemory < 80 ? "green" : s.avgMemory < 90 ? "orange" : "red" },
    { label: "平均磁盘", value: `${s.avgDisk}%`, statusClass: s.avgDisk < 80 ? "green" : s.avgDisk < 90 ? "orange" : "red" },
    { label: "告警数", value: String(s.alertCount), statusClass: s.alertCount === 0 ? "green" : "red" },
  ];
});

async function fetchSummary() {
  try {
    summary.value = await MonitoringAPI.getSummary();
  } catch {
    // error handled by interceptor
  }
}

fetchSummary();
const { pause } = useIntervalFn(fetchSummary, 30000);

onUnmounted(() => pause());
</script>

<style scoped>
.global-kpi { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 20px; }
.kpi-card {
  background: #152030; border: 1px solid #2d3748; border-radius: 8px;
  padding: 18px 12px; text-align: center;
  border-left: 3px solid;
}
.kpi-card.green { border-left-color: #69db7c; }
.kpi-card.orange { border-left-color: #ffa94d; }
.kpi-card.red { border-left-color: #ff8787; }
.kpi-value { font-size: 26px; font-weight: 700; color: #fff; }
.kpi-label { font-size: 12px; color: #86909c; margin-top: 6px; }
</style>
