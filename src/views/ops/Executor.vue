<template>
  <div class="ops-executor">
    <!-- 执行表单 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>作业执行</span>
          <el-button type="primary" :loading="executing" @click="executeJob">
            <el-icon><VideoPlay /></el-icon> 执行
          </el-button>
        </div>
      </template>

      <el-form :model="form" label-width="100px">
        <!-- 目标主机 -->
        <el-form-item label="目标主机">
          <el-select v-model="form.hosts" multiple filterable placeholder="选择目标主机" style="width: 100%">
            <el-option label="全部主机" value="__all__" />
            <el-option-group v-for="cluster in clusters" :key="cluster" :label="cluster">
              <el-option v-for="h in clusterHosts[cluster]" :key="h.ansibleHost" :label="`${h.name} (${h.ansibleHost})`" :value="h.ansibleHost" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <!-- 命令输入 -->
        <el-form-item label="执行命令">
          <el-input v-model="form.command" type="textarea" :rows="3" placeholder="输入要执行的命令，如 uptime、df -h、docker ps" clearable />
        </el-form-item>

        <!-- 快捷命令模板 -->
        <el-form-item label="快捷命令">
          <div class="template-section">
            <el-select v-model="activeCategory" size="small" style="width: 120px" @change="onCategoryChange">
              <el-option label="全部分类" value="" />
              <el-option label="系统" value="system" />
              <el-option label="服务" value="service" />
              <el-option label="Docker" value="docker" />
              <el-option label="磁盘" value="disk" />
              <el-option label="网络" value="network" />
              <el-option label="自定义" value="custom" />
            </el-select>
            <el-space wrap class="template-buttons">
              <el-button
                v-for="cmd in filteredCommands" :key="cmd.id"
                size="small" :type="form.command === cmd.command ? 'primary' : 'default'"
                @click="selectCommand(cmd)"
              >{{ cmd.name }}</el-button>
            </el-space>
          </div>
        </el-form-item>

        <!-- 自定义变量 -->
        <el-form-item label="自定义变量" v-if="hasVariables">
          <div v-for="v in detectedVars" :key="v" class="var-input-row">
            <el-tag size="small" type="info" style="width: 80px">{&thinsp;{{ v }}&thinsp;}</el-tag>
            <el-input v-model="extraVars[v]" :placeholder="getVarPlaceholder(v)" size="small" style="width: 200px" />
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 执行结果 -->
    <el-card v-if="results.length > 0" shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>执行结果</span>
          <div class="result-summary">
            <el-tag type="success" size="small">成功 {{ successCount }}</el-tag>
            <el-tag type="danger" size="small" v-if="failCount > 0">失败 {{ failCount }}</el-tag>
            <el-tag type="warning" size="small" v-if="timeoutCount > 0">超时 {{ timeoutCount }}</el-tag>
            <el-tag type="info" size="small" v-if="unreachableCount > 0">不可达 {{ unreachableCount }}</el-tag>
            <el-tag type="info" size="small">总耗时 {{ duration }}s</el-tag>
          </div>
        </div>
      </template>

      <!-- 结果总览表格 -->
      <el-table :data="results" size="small" max-height="300" style="margin-bottom: 16px" stripe>
        <el-table-column label="主机" prop="host" width="160" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="退出码" prop="exit_code" width="70" align="center" />
        <el-table-column label="耗时" width="70" align="center">
          <template #default="{ row }">{{ row.duration ?? 0 }}s</template>
        </el-table-column>
        <el-table-column label="错误信息" prop="error" show-overflow-tooltip />
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'success'" type="primary" link size="small" @click="retryHost(row.host)">
              重试
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 详细输出（按需展开） -->
      <el-collapse v-model="expandedResults">
        <el-collapse-item v-for="r in results" :key="r.host" :title="r.host" :name="r.host">
          <div class="result-content">
            <el-tag :type="getStatusType(r.status)" size="small" style="margin-bottom: 8px">
              {{ getStatusText(r.status) }}
              <span v-if="r.exit_code !== undefined"> (exit: {{ r.exit_code }})</span>
            </el-tag>
            <pre class="output-box">{{ r.output || r.error || '(无输出)' }}</pre>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay } from "@element-plus/icons-vue";
import AnsibleAPI, { type InventoryHost, type CommandTemplate, type JobResult } from "@/api/ansible";
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({ name: "AnsibleExecutor" });

// 主机清单
const clusters = ref<string[]>([]);
const clusterHosts = ref<Record<string, InventoryHost[]>>({});
const allHosts = ref<Record<string, InventoryHost>>({});

// 命令模板
const commands = ref<CommandTemplate[]>([]);
const activeCategory = ref("");
const filteredCommands = computed(() => {
  if (!activeCategory.value) return commands.value;
  return commands.value.filter(c => c.category === activeCategory.value);
});

// 表单
const form = reactive({
  hosts: [] as string[],
  command: "",
});

// 变量检测
const hasVariables = computed(() => /\{(\w+)\}/.test(form.command));
const detectedVars = computed(() => {
  const vars = new Set<string>();
  const matches = form.command.match(/\{(\w+)\}/g);
  if (matches) matches.forEach(m => vars.add(m.slice(1, -1)));
  // 移除内置变量
  vars.delete("date");
  vars.delete("datetime");
  vars.delete("timestamp");
  return Array.from(vars);
});
const extraVars = ref<Record<string, string>>({});

function getVarPlaceholder(v: string): string {
  const map: Record<string, string> = {
    host: "目标 IP", days: "天数 (如 7)", container: "容器名", service: "服务名",
  };
  return map[v] || v;
}

// 执行结果
const executing = ref(false);
const results = ref<(JobResult & { host: string })[]>([]);
const expandedResults = ref<string[]>([]);
const successCount = computed(() => results.value.filter(r => r.status === "success").length);
const failCount = computed(() => results.value.filter(r => r.status === "failed" || r.status === "error").length);
const timeoutCount = computed(() => results.value.filter(r => r.status === "timeout").length);
const unreachableCount = computed(() => results.value.filter(r => r.status === "unreachable").length);
const duration = ref(0);

function getStatusType(status: string): "success" | "danger" | "warning" | "info" {
  const map: Record<string, "success" | "danger" | "warning" | "info"> = {
    success: "success", failed: "danger", error: "danger",
    timeout: "warning", unreachable: "info",
  };
  return map[status] || "info";
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    success: "成功", failed: "失败", error: "错误",
    timeout: "超时", unreachable: "不可达",
  };
  return map[status] || status;
}

function selectCommand(cmd: CommandTemplate) {
  form.command = cmd.command;
  extraVars.value = {};
}

function onCategoryChange() {
  // category changed, commands will auto-filter
}

async function executeJob() {
  if (form.hosts.length === 0) {
    ElMessage.warning("请选择目标主机");
    return;
  }
  if (!form.command.trim()) {
    ElMessage.warning("请输入执行命令");
    return;
  }

  // 变量检查
  if (hasVariables.value) {
    const missing = detectedVars.value.filter(v => !extraVars.value[v]);
    if (missing.length > 0) {
      ElMessage.warning(`请填写变量: ${missing.map(v => `{${v}}`).join(", ")}`);
      return;
    }
  }

  // 目标主机处理
  let targets = form.hosts;
  if (targets.includes("__all__")) {
    targets = Object.values(allHosts.value).map(h => h.ansibleHost);
  }

  executing.value = true;
  results.value = [];
  expandedResults.value = [];

  try {
    // 替换变量
    let command = form.command;
    const vars: Record<string, string> = { ...extraVars.value };
    for (const [key, val] of Object.entries(vars)) {
      command = command.replace(new RegExp(`\\{${key}\\}`, "g"), val);
    }

    const resp = await AnsibleAPI.createJob({
      name: form.command.slice(0, 50),
      command,
      hosts: targets,
    });

    duration.value = resp.duration || 0;

    // 展示结果
    if (resp.results) {
      results.value = Object.entries(resp.results).map(([host, r]) => ({
        ...r,
        host,
      }));
      // 默认展开所有
      expandedResults.value = Object.keys(resp.results);
    }

    if (resp.status === "success") {
      ElMessage.success(`执行成功 (${resp.successCount}/${resp.totalHosts})`);
    } else if (resp.status === "partial") {
      ElMessage.warning(`部分成功：${resp.successCount} 成功 / ${resp.failCount} 失败`);
    } else {
      ElMessage.error(`执行失败 (${resp.failCount}/${resp.totalHosts})`);
    }
  } catch (e: any) {
    ElMessage.error(e.message || "执行出错");
  } finally {
    executing.value = false;
  }
}

// 重试单台主机
async function retryHost(host: string) {
  if (!form.command.trim()) return;
  ElMessage.info(`正在重试 ${host}...`);
  try {
    let command = form.command;
    const vars: Record<string, string> = { ...extraVars.value };
    for (const [key, val] of Object.entries(vars)) {
      command = command.replace(new RegExp(`\\{${key}\\}`, "g"), val);
    }
    const resp = await AnsibleAPI.createJob({
      name: `${form.command.slice(0, 50)} (重试)`,
      command,
      hosts: [host],
    });
    // 将重试结果合并到当前结果中
    const idx = results.value.findIndex(r => r.host === host);
    if (idx >= 0) {
      results.value[idx] = { ...resp.results?.[host], host } as any;
    }
    if (resp.status === "success") {
      ElMessage.success(`${host} 重试成功`);
    } else {
      ElMessage.error(`${host} 重试失败`);
    }
  } catch (e: any) {
    ElMessage.error(`${host} 重试出错: ${e.message}`);
  }
}

// 加载数据
async function fetchInventory() {
  try {
    const data = await AnsibleAPI.getInventory();
    clusters.value = data.clusters || [];
    clusterHosts.value = {};
    allHosts.value = data.hosts || {};

    for (const [name, host] of Object.entries(data.hosts || {})) {
      const cluster = host.cluster || "default";
      if (!clusterHosts.value[cluster]) clusterHosts.value[cluster] = [];
      clusterHosts.value[cluster].push({ ...host, name });
    }
  } catch { /* ignored */ }
}

async function fetchCommands() {
  try {
    commands.value = await AnsibleAPI.getCommands();
  } catch { /* ignored */ }
}

onMounted(() => {
  fetchInventory();
  fetchCommands();
});
</script>

<style scoped>
.ops-executor { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.result-summary { display: flex; gap: 8px; }

.template-section { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.template-buttons { flex: 1; }

.var-input-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }

.result-content { padding: 4px 0; }
.output-box {
  background: #0d1117; color: #c9d1d9; padding: 12px; border-radius: 6px;
  font-family: "JetBrains Mono", "Fira Code", monospace; font-size: 13px;
  line-height: 1.5; max-height: 300px; overflow: auto; white-space: pre-wrap;
  word-break: break-all; margin: 0;
}
</style>
