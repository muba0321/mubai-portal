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
    <el-dialog v-model="logDetailVisible" :title="report?.task_name || '执行详情'" width="960px" destroy-on-close>
      <div v-if="logDetail && report" class="task-report">
        <!-- 顶部状态栏 -->
        <div class="report-header">
          <div class="header-left">
            <el-tag :type="logStatusType(logDetail.status)" size="large" effect="dark">
              {{ logDetail.status === 'warning' ? '⚠️ 异常' : logDetail.status === 'success' ? '✅ 正常' : logDetail.status }}
            </el-tag>
            <span class="header-meta">
              <el-icon><Clock /></el-icon> {{ logDetail.duration }}s
              <el-divider direction="vertical" />
              <el-icon><Monitor /></el-icon> {{ report.total_hosts }} 台主机
            </span>
          </div>
          <div class="header-right">
            <span class="header-time">{{ logDetail.startedAt }}</span>
          </div>
        </div>

        <!-- 摘要统计卡片 -->
        <div class="summary-grid" v-if="summaryCards.length">
          <div v-for="(card, i) in summaryCards" :key="i" class="stat-card" :style="{ borderColor: card.color }">
            <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </div>

        <!-- 问题列表 -->
        <div v-if="report.issues.length" class="issues-section">
          <div class="section-title">
            <el-icon><WarningFilled /></el-icon>
            <span>发现的问题 ({{ report.issues.length }})</span>
          </div>
          <div class="issue-list">
            <div v-for="(issue, i) in report.issues" :key="i" class="issue-item" :class="'level-' + issue.level">
              <div class="issue-header">
                <span class="issue-level-tag" :class="'tag-' + issue.level">
                  {{ issue.level === 'critical' ? '严重' : '警告' }}
                </span>
                <span class="issue-host">{{ issue.host }}</span>
                <span class="issue-title">{{ issue.title }}</span>
              </div>
              <div class="issue-body">
                <div class="issue-row"><span class="label">期望</span><span>{{ issue.expected }}</span></div>
                <div class="issue-row"><span class="label">实际</span><span class="actual">{{ issue.actual }}</span></div>
                <div class="issue-row"><span class="label">影响</span><span>{{ issue.impact }}</span></div>
                <div class="issue-row"><span class="label">建议</span><span class="suggestion">{{ issue.suggestion }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无问题 -->
        <div v-else class="all-clear">
          <el-icon :size="48" color="#67c23a"><CircleCheckFilled /></el-icon>
          <div class="all-clear-text">所有检查项正常</div>
        </div>

        <!-- 主机明细表格 -->
        <div v-if="report.details.length" class="details-section">
          <el-collapse>
            <el-collapse-item>
              <template #title>
                <span class="collapse-title">
                  <el-icon><List /></el-icon> 主机明细 ({{ report.details.length }} 台)
                </span>
              </template>
              <el-table :data="report.details" size="small" stripe>
                <el-table-column label="主机" prop="host" width="150" />
                <el-table-column label="名称" prop="name" width="150" show-overflow-tooltip />
                <el-table-column label="状态" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getHostStatusType(row)" size="small" effect="dark">{{ getHostStatusText(row) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="详情">
                  <template #default="{ row }">
                    <span class="host-detail-text">{{ formatHostDetail(row) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 错误信息 -->
        <el-alert v-if="logDetail.errorMsg" :title="logDetail.errorMsg" type="error" :closable="false" show-icon style="margin-top: 12px" />
      </div>

      <!-- 无结构化数据时显示原始输出 -->
      <div v-else-if="logDetail" class="raw-output-only">
        <el-alert type="info" :closable="false">本次执行无结构化报告，以下为原始输出：</el-alert>
        <pre class="output-box" style="margin-top: 12px">{{ logDetail.output || '(无输出)' }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus, Clock, Monitor, WarningFilled, CircleCheckFilled, List } from "@element-plus/icons-vue";
import AnsibleAPI, { type AnsibleSchedule, type ScheduleLog, type TaskType, type TaskReport, type TaskIssue } from "@/api/ansible";
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
const report = ref<TaskReport | null>(null);

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
  report.value = row.report || null;
  logDetailVisible.value = true;
}

// 摘要卡片计算
const summaryCards = computed(() => {
  if (!report.value) return [];
  const s = report.value.summary;
  const taskType = report.value.task_type;

  if (taskType === "cmdb_update") {
    return [
      { label: "在线", value: s.online ?? 0, color: "#67c23a" },
      { label: "离线", value: s.offline ?? 0, color: "#f56c6c" },
      { label: "变化", value: s.changes?.length ?? 0, color: "#e6a23c" },
    ];
  } else if (taskType === "disk_check") {
    return [
      { label: "正常", value: s.normal ?? 0, color: "#67c23a" },
      { label: "警告", value: s.warning ?? 0, color: "#e6a23c" },
      { label: "严重", value: s.critical ?? 0, color: "#f56c6c" },
      { label: "错误", value: s.error ?? 0, color: "#909399" },
    ];
  } else if (taskType === "service_check") {
    return [
      { label: "健康", value: s.healthy ?? 0, color: "#67c23a" },
      { label: "部分异常", value: s.partial ?? 0, color: "#e6a23c" },
      { label: "全部停止", value: s.all_down ?? 0, color: "#f56c6c" },
      { label: "错误", value: s.error ?? 0, color: "#909399" },
    ];
  }
  return [];
});

function getHostStatusType(row: any): "success" | "danger" | "warning" | "info" {
  const status = row.status || row.overall;
  if (status === "online" || status === "healthy") return "success";
  if (status === "offline" || status === "all_down" || status === "critical" || status === "error") return "danger";
  if (status === "partial" || status === "warning") return "warning";
  return "info";
}

function getHostStatusText(row: any): string {
  const status = row.status || row.overall;
  const map: Record<string, string> = {
    online: "在线", offline: "离线", healthy: "健康",
    partial: "部分", all_down: "全停", error: "错误",
  };
  return map[status] || status || "-";
}

function formatHostDetail(row: any): string {
  if (row.partitions) {
    return row.partitions.map((p: any) => `${p.mount}=${p.usage}`).join(", ") || "-";
  }
  if (row.services) {
    return row.services.map((s: any) => `${s.name}:${s.status}`).join(", ") || "-";
  }
  if (row.containers) {
    const parts: string[] = [];
    if (row.containers.length) parts.push(`容器:${row.containers.length}`);
    if (row.ports?.length) parts.push(`端口:${row.ports.length}`);
    if (row.disk_usage) parts.push(`磁盘:${row.disk_usage}`);
    if (row.memory_usage) parts.push(`内存:${row.memory_usage}`);
    return parts.join(" | ") || "-";
  }
  return row.error || "-";
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

/* ========== 任务报告美化 ========== */
.task-report { min-height: 200px; }

/* 顶部状态栏 */
.report-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-radius: 8px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  margin-bottom: 16px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-meta { color: #606266; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.header-right .header-time { color: #909399; font-size: 13px; }

/* 摘要统计卡片网格 */
.summary-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px; margin-bottom: 16px;
}
.stat-card {
  text-align: center; padding: 16px 8px; border-radius: 8px;
  background: #fff; border: 1px solid #e4e7ed; border-left: 3px solid;
}
.stat-value { font-size: 28px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 12px; color: #909399; margin-top: 6px; }

/* 问题列表 */
.issues-section { margin-bottom: 16px; }
.section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 15px; font-weight: 600; color: #303133;
  margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ebeef5;
}
.issue-list { display: flex; flex-direction: column; gap: 10px; }
.issue-item {
  border-radius: 8px; padding: 14px 16px;
  border: 1px solid #ebeef5; border-left: 3px solid;
  background: #fff;
}
.issue-item.level-critical { border-left-color: #f56c6c; background: #fef0f0; }
.issue-item.level-warning { border-left-color: #e6a23c; background: #fdf6ec; }
.issue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.issue-level-tag {
  padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #fff;
}
.issue-level-tag.tag-critical { background: #f56c6c; }
.issue-level-tag.tag-warning { background: #e6a23c; }
.issue-host { font-weight: 600; color: #303133; font-size: 13px; }
.issue-title { color: #606266; font-size: 13px; }
.issue-body { font-size: 13px; line-height: 1.8; color: #606266; }
.issue-row { display: flex; gap: 6px; }
.issue-row .label { color: #909399; white-space: nowrap; min-width: 40px; }
.issue-row .actual { color: #f56c6c; font-weight: 500; }
.issue-row .suggestion { color: #67c23a; }

/* 无问题状态 */
.all-clear {
  text-align: center; padding: 32px 0; color: #67c23a;
}
.all-clear-text { font-size: 15px; margin-top: 8px; color: #606266; }

/* 主机明细 */
.details-section { margin-top: 16px; }
.collapse-title { display: flex; align-items: center; gap: 6px; font-weight: 500; }
.host-detail-text { font-size: 12px; color: #606266; font-family: "JetBrains Mono", monospace; }

/* 无结构化数据 */
.raw-output-only { padding: 8px 0; }
</style>
