<template>
  <div class="server-matrix">
    <div class="section-header">
      <span class="section-title">基础设施层</span>
      <span class="badge green">{{ onlineCount }} 台在线</span>
      <span class="badge grey">{{ servers.length - onlineCount }} 台离线</span>
    </div>
    <div class="server-cards">
      <div v-for="server in servers" :key="server.ip" class="server-card">
        <div class="server-header">
          <span class="status-dot" :class="server.online ? 'online' : 'offline'"></span>
          <span class="server-name">{{ server.name }}</span>
          <span v-if="!server.online" class="offline-label">离线</span>
        </div>
        <div class="server-ip">{{ server.ip }} &middot; {{ server.os }}</div>

        <div class="metric-bar">
          <div class="metric-label">CPU</div>
          <div class="metric-value" :class="barColor(server.cpu)">{{ server.cpu }}%</div>
          <div class="bar-track"><div class="bar-fill" :class="barColor(server.cpu)" :style="{ width: server.cpu + '%' }"></div></div>
        </div>

        <div class="metric-bar">
          <div class="metric-label">内存</div>
          <div class="metric-value" :class="barColor(server.memory)">{{ server.memory }}%</div>
          <div class="bar-track"><div class="bar-fill" :class="barColor(server.memory)" :style="{ width: server.memory + '%' }"></div></div>
        </div>

        <div class="metric-bar">
          <div class="metric-label">磁盘</div>
          <div class="metric-value" :class="barColor(server.disk)">{{ server.disk }}%</div>
          <div class="bar-track"><div class="bar-fill" :class="barColor(server.disk)" :style="{ width: server.disk + '%' }"></div></div>
        </div>

        <div class="metric-bar">
          <div class="metric-label">负载</div>
          <div class="metric-value" style="color: #74c0fc;">{{ server.load }}</div>
        </div>

        <div class="service-tags">
          <span v-for="svc in server.services" :key="svc" class="service-tag">{{ svc }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MonitoringAPI from "@/api/monitoring";
import { useIntervalFn } from "@vueuse/core";

const servers = ref<MonitoringAPI.ServerInfo[]>([]);

const onlineCount = computed(() => servers.value.filter(s => s.online).length);

function barColor(val: number): string {
  if (val < 70) return "green";
  if (val < 90) return "orange";
  return "red";
}

async function fetch() {
  try {
    servers.value = await MonitoringAPI.getServers();
  } catch { /* handled by interceptor */ }
}

fetch();
const { pause } = useIntervalFn(fetch, 30000);
onUnmounted(() => pause());
</script>

<style scoped>
.server-matrix { background: #1a2636; border: 1px solid #2d3748; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.section-title { font-size: 15px; font-weight: 600; color: #fff; }
.badge { padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
.badge.green { background: #1b4332; color: #69db7c; }
.badge.grey { background: #2d3748; color: #86909c; }

.server-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.server-card { background: #152030; border: 1px solid #2d3748; border-radius: 8px; padding: 16px; }
.server-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.server-name { font-size: 14px; font-weight: 600; color: #e5e6eb; }
.server-ip { font-size: 11px; color: #86909c; margin-bottom: 12px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.status-dot.online { background: #69db7c; box-shadow: 0 0 6px #69db7c; }
.status-dot.offline { background: #ff8787; box-shadow: 0 0 6px #ff8787; }
.offline-label { font-size: 11px; color: #ff8787; margin-left: 4px; }

.metric-bar { margin-bottom: 8px; }
.metric-label { font-size: 12px; color: #86909c; margin-bottom: 3px; display: flex; justify-content: space-between; }
.metric-value { font-size: 12px; font-weight: 600; }
.metric-value.green { color: #69db7c; }
.metric-value.orange { color: #ffa94d; }
.metric-value.red { color: #ff8787; }
.bar-track { height: 5px; background: #2d3748; border-radius: 3px; }
.bar-fill { height: 5px; border-radius: 3px; transition: width 0.5s; }
.bar-fill.green { background: linear-gradient(90deg, #38bdf8, #69db7c); }
.bar-fill.orange { background: linear-gradient(90deg, #ffa94d, #ff8787); }
.bar-fill.red { background: #ff8787; }

.service-tags { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px; }
.service-tag { padding: 2px 8px; border-radius: 3px; font-size: 10px; background: #1b4332; color: #69db7c; border: 1px solid #2d6a4f; }
</style>
