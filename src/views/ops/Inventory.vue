<template>
  <div class="ops-inventory">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>主机清单</span>
          <el-tag>{{ Object.keys(inventory).length }} 台主机</el-tag>
        </div>
      </template>

      <!-- 按分组展示 -->
      <template v-for="(hosts, group) in groupedHosts" :key="group">
        <div class="group-section">
          <div class="group-header">
            <el-tag type="primary" effect="dark">{{ group }}</el-tag>
            <span class="group-count">{{ hosts.length }} 台</span>
          </div>
          <el-table :data="hosts" stripe border style="margin-top: 8px">
            <el-table-column prop="name" label="主机名称" width="180" />
            <el-table-column prop="ip" label="IP 地址" width="180" />
            <el-table-column prop="group" label="分组" width="180" />
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="pingHost(row.name)">
                  Ping
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <el-empty v-if="Object.keys(inventory).length === 0" description="暂无主机数据" />
    </el-card>

    <!-- Ping 结果弹窗 -->
    <el-dialog v-model="pingVisible" title="Ping 结果" width="700px">
      <pre class="output-box">{{ pingOutput }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import AnsibleAPI, { type AnsibleHost } from "@/api/ansible";
import { ElMessage } from "element-plus";

defineOptions({ name: "AnsibleInventory" });

const inventory = ref<Record<string, AnsibleHost>>({});
const pingVisible = ref(false);
const pingOutput = ref("");

const groupedHosts = computed(() => {
  const groups: Record<string, Array<AnsibleHost & { name: string }>> = {};
  for (const [name, host] of Object.entries(inventory.value)) {
    const g = host.group;
    if (!groups[g]) groups[g] = [];
    groups[g].push({ ...host, name });
  }
  return groups;
});

async function pingHost(name: string) {
  try {
    const result = await AnsibleAPI.pingAll();
    // Find the specific host result in output
    pingOutput.value = result.output || JSON.stringify(result, null, 2);
    pingVisible.value = true;
  } catch {
    ElMessage.error("Ping 失败");
  }
}

async function fetchInventory() {
  try {
    inventory.value = await AnsibleAPI.getInventory();
  } catch {
    ElMessage.error("获取主机清单失败");
  }
}

fetchInventory();
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.group-section { margin-bottom: 20px; }
.group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.group-count { font-size: 12px; color: #999; }
.output-box {
  background: #0d1117; color: #c9d1d9; padding: 12px; border-radius: 6px;
  font-family: "JetBrains Mono", "Fira Code", monospace; font-size: 12px;
  max-height: 400px; overflow: auto; white-space: pre-wrap; word-break: break-all;
}
</style>
