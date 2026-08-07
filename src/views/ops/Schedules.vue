<template>
  <div class="ops-schedules">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>定时任务</span>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon> 创建
          </el-button>
        </div>
      </template>

      <el-table :data="scheduleList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="任务名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="taskTypeTag(row.taskType)" size="small" effect="plain">
              {{ taskTypeLabel(row.taskType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cronExpression" label="Cron" width="130">
          <template #default="{ row }">
            <code style="font-size: 12px">{{ row.cronExpression }}</code>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上次执行" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.lastStatus" :type="logStatusType(row.lastStatus)" size="small">
              {{ row.lastStatus }}
            </el-tag>
            <span v-else style="color: #999">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastRun" label="上次时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewLogs(row)">历史</el-button>
            <el-button type="warning" link size="small" @click="toggleSchedule(row)">
              {{ row.enabled ? "停用" : "启用" }}
            </el-button>
            <el-button type="danger" link size="small" @click="deleteSchedule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建弹窗 -->
    <el-dialog v-model="createVisible" title="创建定时任务" width="560px" destroy-on-close>
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="createForm.name" placeholder="例如: 每日磁盘检查" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="createForm.taskType" style="width: 100%" @change="onTaskTypeChange">
            <el-option v-for="t in taskTypes" :key="t.value" :label="t.label" :value="t.value">
              <span>{{ t.label }}</span>
              <span style="color: #999; font-size: 12px; margin-left: 8px">{{ t.description }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="执行命令" v-if="createForm.taskType === 'command'">
          <el-input v-model="createForm.command" type="textarea" :rows="3" placeholder="输入要执行的命令" />
        </el-form-item>
        <el-form-item label="Cron 表达式">
          <el-input v-model="createForm.cronExpression" placeholder="例如: 0 9 * * * (每天9点)" />
          <div style="font-size: 12px; color: #999; margin-top: 4px">
            格式: 分 时 日 月 星期 | 示例: */30 * * * * (每30分钟), 0 2 * * * (每天凌晨2点)
          </div>
        </el-form-item>
        <el-form-item label="立即启用">
          <el-switch v-model="createForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- 执行历史弹窗 -->
    <el-dialog v-model="logsVisible" title="执行历史" width="700px">
      <el-table :data="logs" v-loading="logsLoading" stripe size="small">
        <el-table-column label="时间" prop="startedAt" width="170" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="logStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="70" align="center">
          <template #default="{ row }">{{ row.duration }}s</template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewLogDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap" v-if="logTotal > pageSize">
        <el-pagination v-model:current-page="logPage" :page-size="pageSize" :total="logTotal" layout="prev, pager, next" small @current-change="fetchLogs" />
      </div>
    </el-dialog>

    <!-- 日志详情弹窗 -->
    <el-dialog v-model="logDetailVisible" title="执行详情" width="800px">
      <div v-if="logDetail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="状态">
            <el-tag :type="logStatusType(logDetail.status)" size="small">{{ logDetail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="耗时">{{ logDetail.duration }}s</el-descriptions-item>
          <el-descriptions-item label="时间" :span="2">{{ logDetail.startedAt }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="logDetail.output" style="margin-top: 12px">
          <h4>执行输出</h4>
          <pre class="output-box">{{ logDetail.output }}</pre>
        </div>
        <el-alert v-if="logDetail.errorMsg" :title="logDetail.errorMsg" type="error" :closable="false" show-icon style="margin-top: 12px" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
import AnsibleAPI, { type AnsibleSchedule, type ScheduleLog, type TaskType } from "@/api/ansible";
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({ name: "AnsibleSchedules" });

const loading = ref(false);
const creating = ref(false);
const scheduleList = ref<AnsibleSchedule[]>([]);
const createVisible = ref(false);
const taskTypes = ref<TaskType[]>([]);

const createForm = reactive({
  name: "",
  taskType: "cmdb_update",
  command: "",
  cronExpression: "*/30 * * * *",
  enabled: true,
});

// 日志相关
const logsVisible = ref(false);
const logsLoading = ref(false);
const logs = ref<ScheduleLog[]>([]);
const logTotal = ref(0);
const logPage = ref(1);
const pageSize = ref(20);
const currentScheduleId = ref(0);
const logDetailVisible = ref(false);
const logDetail = ref<ScheduleLog | null>(null);

const taskTypeLabels: Record<string, string> = {
  command: "SSH 命令", cmdb_update: "CMDB 巡检", disk_check: "磁盘检查",
  service_check: "服务检查", backup: "备份",
};
const taskTypeTags: Record<string, "success" | "warning" | "danger" | "info" | "primary"> = {
  command: "primary", cmdb_update: "success", disk_check: "warning",
  service_check: "info", backup: "danger",
};

function taskTypeLabel(t: string) { return taskTypeLabels[t] || t; }
function taskTypeTag(t: string) { return taskTypeTags[t] || "info"; }
function logStatusType(s: string): "success" | "danger" | "warning" | "info" {
  const map: Record<string, "success" | "danger" | "warning" | "info"> = {
    success: "success", failed: "danger", error: "danger", partial: "warning",
  };
  return map[s] || "info";
}

function onTaskTypeChange() {
  // 选择不同类型时，可以设置默认 cron
  const defaults: Record<string, string> = {
    cmdb_update: "*/30 * * * *",
    disk_check: "0 9 * * *",
    service_check: "0 */2 * * *",
    command: "0 0 * * *",
  };
  if (!createForm.cronExpression || createForm.cronExpression === "*/5 * * * *") {
    createForm.cronExpression = defaults[createForm.taskType] || "0 0 * * *";
  }
}

async function fetchSchedules() {
  loading.value = true;
  try {
    scheduleList.value = await AnsibleAPI.listSchedules();
  } catch { /* ignored */ } finally {
    loading.value = false;
  }
}

async function fetchTaskTypes() {
  try {
    taskTypes.value = await AnsibleAPI.getTaskTypes();
  } catch { /* ignored */ }
}

function openCreateDialog() {
  createForm.name = "";
  createForm.taskType = "cmdb_update";
  createForm.command = "";
  createForm.cronExpression = "*/30 * * * *";
  createForm.enabled = true;
  createVisible.value = true;
}

async function handleCreate() {
  if (!createForm.name) { ElMessage.warning("请填写任务名称"); return; }
  if (!createForm.cronExpression) { ElMessage.warning("请填写 Cron 表达式"); return; }
  if (createForm.taskType === "command" && !createForm.command) { ElMessage.warning("请填写执行命令"); return; }

  creating.value = true;
  try {
    await AnsibleAPI.createSchedule({
      name: createForm.name,
      taskType: createForm.taskType,
      command: createForm.command || undefined,
      cronExpression: createForm.cronExpression,
      enabled: createForm.enabled,
    });
    ElMessage.success("创建成功");
    createVisible.value = false;
    fetchSchedules();
  } catch {
    ElMessage.error("创建失败");
  } finally {
    creating.value = false;
  }
}

async function toggleSchedule(row: AnsibleSchedule) {
  try {
    await AnsibleAPI.toggleSchedule(row.id);
    ElMessage.success(row.enabled ? "已停用" : "已启用");
    fetchSchedules();
  } catch {
    ElMessage.error("操作失败");
  }
}

async function deleteSchedule(row: AnsibleSchedule) {
  try {
    await ElMessageBox.confirm(`确认删除定时任务「${row.name}」？`, "确认", { type: "warning" });
    await AnsibleAPI.deleteSchedule(row.id);
    ElMessage.success("删除成功");
    fetchSchedules();
  } catch { /* cancelled */ }
}

async function viewLogs(row: AnsibleSchedule) {
  currentScheduleId.value = row.id;
  logPage.value = 1;
  logsVisible.value = true;
  await fetchLogs();
}

async function fetchLogs() {
  logsLoading.value = true;
  try {
    const data = await AnsibleAPI.getScheduleLogs(currentScheduleId.value, {
      pageNum: logPage.value,
      pageSize: pageSize.value,
    });
    logs.value = data?.list || [];
    logTotal.value = data?.total || 0;
  } catch { /* ignored */ } finally {
    logsLoading.value = false;
  }
}

function viewLogDetail(row: ScheduleLog) {
  logDetail.value = row;
  logDetailVisible.value = true;
}

onMounted(() => {
  fetchSchedules();
  fetchTaskTypes();
});
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
.output-box {
  background: #0d1117; color: #c9d1d9; padding: 12px; border-radius: 6px;
  font-family: "JetBrains Mono", "Fira Code", monospace; font-size: 13px;
  line-height: 1.5; max-height: 400px; overflow: auto; white-space: pre-wrap;
  word-break: break-all; margin: 0;
}
</style>
