<template>
  <div class="target-status">
    <div class="panel-title">Prometheus Targets</div>
    <div class="target-list">
      <div v-for="t in targets" :key="t.job + t.instance" class="target-item" :class="t.health === 'up' ? 'up' : 'down'">
        <div class="target-left">
          <span class="status-dot" :class="t.health"></span>
          <div class="target-info">
            <span class="target-job">{{ t.job }}</span>
            <span class="target-instance">{{ t.instance }}</span>
          </div>
        </div>
        <span class="target-status">{{ t.health.toUpperCase() }}</span>
      </div>
    </div>
    <div class="panel-footer">
      <a :href="grafanaUrl + '/targets'" target="_blank" class="link">→ Prometheus Targets 详情</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import MonitoringAPI from "@/api/monitoring";
import { useIntervalFn } from "@vueuse/core";

const targets = ref<MonitoringAPI.TargetStatus[]>([]);
const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || "https://grafana.mubai.top";

async function fetch() {
  try {
    targets.value = await MonitoringAPI.getTargets();
  } catch { /* handled */ }
}

fetch();
const { pause } = useIntervalFn(fetch, 30000);
onUnmounted(() => pause());
</script>

<style scoped>
.target-status { background: #152030; border: 1px solid #2d3748; border-radius: 8px; padding: 14px; height: 100%; display: flex; flex-direction: column; }
.panel-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 10px; }
.target-list { flex: 1; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
.target-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border-radius: 4px; font-size: 11px;
  background: #1b4332;
}
.target-item.down { background: #5c1a1a; }
.target-left { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.status-dot.up { background: #69db7c; box-shadow: 0 0 4px #69db7c; }
.status-dot.down { background: #ff8787; box-shadow: 0 0 4px #ff8787; }
.target-info { display: flex; flex-direction: column; min-width: 0; }
.target-job { font-weight: 600; color: #e5e6eb; font-size: 11px; }
.target-instance { color: #86909c; font-size: 10px; }
.target-status { font-weight: 700; font-size: 10px; flex-shrink: 0; margin-left: 8px; }
.target-item.up .target-status { color: #69db7c; }
.target-item.down .target-status { color: #ff8787; }
.panel-footer { margin-top: 10px; text-align: right; flex-shrink: 0; }
.link { color: #74c0fc; font-size: 11px; text-decoration: none; }
.link:hover { text-decoration: underline; }
</style>
