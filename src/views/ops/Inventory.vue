<template>
  <div class="ops-inventory">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>主机清单</span>
          <div class="header-actions">
            <el-select v-model="activeCluster" placeholder="集群筛选" clearable size="small" style="width: 150px" @change="onClusterChange">
              <el-option v-for="c in clusters" :key="c" :label="c" :value="c" />
            </el-select>
            <el-tag>{{ totalHosts }} 台主机</el-tag>
            <el-button size="small" @click="fetchData"><el-icon><Refresh /></el-icon> 刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 按集群分组展示 -->
      <template v-for="cluster in displayClusters" :key="cluster">
        <div class="group-section">
          <div class="group-header">
            <el-tag type="primary" effect="dark">{{ cluster }}</el-tag>
            <span class="group-count">{{ clusterHostMap[cluster]?.length || 0 }} 台</span>
          </div>
          <el-table :data="clusterHostMap[cluster] || []" stripe border style="margin-top: 8px">
            <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip />
            <el-table-column label="IP 地址" width="160">
              <template #default="{ row }">{{ row.ip }}</template>
            </el-table-column>
            <el-table-column label="配置" width="120">
              <template #default="{ row }">{{ row.cpu }}核 / {{ row.memory }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'online' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'online' ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="pingHost(row.ip)">Ping</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <el-empty v-if="totalHosts === 0" description="暂无主机数据" />
    </el-card>

    <!-- Ping 结果弹窗 -->
    <el-dialog v-model="pingVisible" title="Ping 检测结果" width="700px">
      <div v-if="pingResults.length > 0">
        <el-table :data="pingResults" stripe size="small">
          <el-table-column label="主机" prop="host" />
          <el-table-column label="IP" prop="ip" width="150" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'reachable' ? 'success' : 'danger'" size="small">
                {{ row.status === 'reachable' ? '可达' : '不可达' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import AnsibleAPI, { type InventoryHost } from "@/api/ansible";
import { ElMessage } from "element-plus";

defineOptions({ name: "AnsibleInventory" });

const clusters = ref<string[]>([]);
const clusterHostMap = ref<Record<string, (InventoryHost & { name: string; ip: string })[]>>({});
const activeCluster = ref("");
const totalHosts = computed(() => {
  if (!activeCluster.value) return Object.values(clusterHostMap.value).reduce((sum, hosts) => sum + hosts.length, 0);
  return clusterHostMap.value[activeCluster.value]?.length || 0;
});
const displayClusters = computed(() => {
  if (!activeCluster.value) return clusters.value;
  return clusters.value.filter(c => c === activeCluster.value);
});

const pingVisible = ref(false);
const pingResults = ref<any[]>([]);

function onClusterChange() {
  // filter applied via computed
}

async function pingHost(ip: string) {
  try {
    const data = await AnsibleAPI.pingAll();
    pingResults.value = (data.results || []).map((r: any) => ({
      host: r.host,
      ip: r.ip,
      status: r.status,
    }));
    pingVisible.value = true;
  } catch {
    ElMessage.error("Ping 检测失败");
  }
}

async function fetchData() {
  try {
    const data = await AnsibleAPI.getInventory(activeCluster.value || undefined);
    clusters.value = data.clusters || [];
    clusterHostMap.value = {};

    for (const [name, host] of Object.entries(data.hosts || {})) {
      const cluster = host.cluster || "default";
      if (!clusterHostMap.value[cluster]) clusterHostMap.value[cluster] = [];
      clusterHostMap.value[cluster].push({ ...host, name, ip: host.ansibleHost });
    }
  } catch {
    ElMessage.error("获取主机清单失败");
  }
}

onMounted(() => { fetchData(); });
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.group-section { margin-bottom: 20px; }
.group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.group-count { font-size: 12px; color: #999; }
</style>
