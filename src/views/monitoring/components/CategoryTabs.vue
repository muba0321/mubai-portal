<template>
  <div class="category-tabs-panel">
    <div class="tabs-header">
      <span class="tabs-title">分类监控</span>
      <div class="tab-buttons">
        <span v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
          {{ tab.label }}
        </span>
      </div>
    </div>

    <!-- 基础设施 Tab -->
    <div v-show="activeTab === 'infra'" class="tab-content">
      <div class="metrics-row">
        <div v-for="server in servers" :key="server.ip" class="metric-card">
          <div class="metric-card-title">{{ server.name }}</div>
          <div class="metric-card-sub">{{ server.ip }}</div>
          <div class="metric-card-value" :class="barColor(server.cpu)">{{ server.cpu }}% CPU</div>
          <div class="metric-card-value" :class="barColor(server.memory)">{{ server.memory }}% Memory</div>
          <div class="metric-card-value" :class="barColor(server.disk)">{{ server.disk }}% Disk</div>
          <div class="metric-card-value blue">{{ server.load }} Load</div>
        </div>
      </div>
    </div>

    <!-- 数据库 Tab -->
    <div v-show="activeTab === 'database'" class="tab-content">
      <div class="metrics-row">
        <div class="metric-card wide">
          <div class="metric-card-title">MySQL 数据库</div>
          <div class="metric-card-sub">154.12.54.207:3306</div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">连接数</div>
              <div class="detail-value blue">{{ mysql.connections }}/{{ mysql.maxConnections }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">QPS</div>
              <div class="detail-value cyan">{{ mysql.qps }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">慢查询</div>
              <div class="detail-value" :class="mysql.slowQueries > 0 ? 'orange' : 'green'">{{ mysql.slowQueries }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">运行线程</div>
              <div class="detail-value green">{{ mysql.threadsRunning }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CI/CD Tab -->
    <div v-show="activeTab === 'cicd'" class="tab-content">
      <div class="metrics-row">
        <div class="metric-card wide">
          <div class="metric-card-title">Jenkins CI/CD</div>
          <div class="metric-card-sub">45.205.31.249:8080</div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">构建状态</div>
              <div class="detail-value" :class="jenkins.runningBuilds > 0 ? 'orange' : 'green'">
                {{ jenkins.runningBuilds > 0 ? `运行中 (${jenkins.runningBuilds})` : "空闲" }}
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">队列</div>
              <div class="detail-value cyan">{{ jenkins.queueSize }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Executors</div>
              <div class="detail-value blue">{{ jenkins.executorsBusy }}/{{ jenkins.executorsTotal }} 忙碌</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">空闲</div>
              <div class="detail-value green">{{ jenkins.executorsFree }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 网络 Tab -->
    <div v-show="activeTab === 'network'" class="tab-content">
      <TrendChart title="网络流量 (入站)" :fetch-fn="() => MonitoringAPI.getNetworkMetrics()" unit="B/s" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MonitoringAPI from "@/api/monitoring";
import { useIntervalFn } from "@vueuse/core";
import TrendChart from "./TrendChart.vue";

const tabs = [
  { key: "infra", label: "基础设施" },
  { key: "database", label: "数据库" },
  { key: "cicd", label: "CI/CD" },
  { key: "network", label: "网络" },
];
const activeTab = ref("infra");

const servers = ref<MonitoringAPI.ServerInfo[]>([]);
const mysql = ref<MonitoringAPI.MysqlMetrics>({ connections: 0, maxConnections: 0, qps: 0, slowQueries: 0, threadsRunning: 0, uptimeSeconds: 0 });
const jenkins = ref<MonitoringAPI.JenkinsMetrics>({ runningBuilds: 0, queueSize: 0, executorsTotal: 0, executorsFree: 0, executorsBusy: 0 });

function barColor(val: number): string {
  if (val < 70) return "green";
  if (val < 90) return "orange";
  return "red";
}

async function fetchAll() {
  try { servers.value = await MonitoringAPI.getServers(); } catch {}
  try { mysql.value = await MonitoringAPI.getMysqlMetrics(); } catch {}
  try { jenkins.value = await MonitoringAPI.getJenkinsMetrics(); } catch {}
}

fetchAll();
const { pause } = useIntervalFn(fetchAll, 60000);
onUnmounted(() => pause());
</script>

<style scoped>
.category-tabs-panel { background: #1a2636; border: 1px solid #2d3748; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
.tabs-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.tabs-title { font-size: 15px; font-weight: 600; color: #fff; }
.tab-buttons { display: flex; gap: 6px; }
.tab-btn { padding: 4px 14px; border-radius: 16px; font-size: 12px; color: #86909c; cursor: pointer; transition: all 0.2s; border: 1px solid #2d3748; }
.tab-btn:hover { color: #74c0fc; border-color: #74c0fc; }
.tab-btn.active { background: #165dff; color: #fff; border-color: #165dff; }

.metrics-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.metric-card { background: #152030; border: 1px solid #2d3748; border-radius: 8px; padding: 16px; }
.metric-card.wide { grid-column: span 1; }
.metric-card-title { font-size: 13px; font-weight: 600; color: #e5e6eb; margin-bottom: 4px; }
.metric-card-sub { font-size: 11px; color: #86909c; margin-bottom: 12px; }
.metric-card-value { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.metric-card-value.green { color: #69db7c; }
.metric-card-value.orange { color: #ffa94d; }
.metric-card-value.red { color: #ff8787; }
.metric-card-value.blue { color: #74c0fc; }
.metric-card-value.cyan { color: #38bdf8; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #2d3748; }
.detail-label { font-size: 11px; color: #86909c; margin-bottom: 2px; }
.detail-value { font-size: 15px; font-weight: 600; }
.detail-value.green { color: #69db7c; }
.detail-value.orange { color: #ffa94d; }
.detail-value.red { color: #ff8787; }
.detail-value.blue { color: #74c0fc; }
.detail-value.cyan { color: #38bdf8; }
</style>
