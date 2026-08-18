<template>
  <div class="backup-manage">
    <!-- 顶部统计卡片 -->
    <div class="stats-bar">
      <div class="stat-card" style="border-left-color: #409eff">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总服务</div>
      </div>
      <div class="stat-card" style="border-left-color: #67c23a">
        <div class="stat-value">{{ stats.enabled }}</div>
        <div class="stat-label">已启用</div>
      </div>
      <div class="stat-card" style="border-left-color: #909399">
        <div class="stat-value">{{ stats.disabled }}</div>
        <div class="stat-label">未启用</div>
      </div>
      <div class="stat-card" style="border-left-color: #e6a23c">
        <div class="stat-value">{{ recentSuccess }}</div>
        <div class="stat-label">今日成功</div>
      </div>
    </div>

    <!-- 筛选栏 + 操作按钮 -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>服务备份管理</span>
          <div class="header-actions">
            <el-button type="success" :loading="batchLoading" @click="handleBatchBackup">
              <el-icon><Download /></el-icon> 批量备份
            </el-button>
            <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-select v-model="filterCategory" placeholder="全部分类" clearable style="width: 140px" @change="fetchData">
          <el-option label="数据库" value="database" />
          <el-option label="监控" value="monitoring" />
          <el-option label="CI/CD" value="cicd" />
          <el-option label="配置中心" value="config" />
          <el-option label="网关" value="gateway" />
          <el-option label="应用" value="application" />
          <el-option label="文档" value="documentation" />
        </el-select>
        <el-select v-model="filterServer" placeholder="全部服务器" clearable style="width: 160px" @change="fetchData">
          <el-option label="215 应用服务器" value="154.201.73.215" />
          <el-option label="207 监控服务器" value="154.12.54.207" />
          <el-option label="32 网关服务器" value="38.246.245.32" />
        </el-select>
        <el-input v-model="filterKeyword" placeholder="搜索服务名称" clearable style="width: 200px" @clear="fetchData" @keyup.enter="fetchData">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <!-- 服务列表 -->
      <el-table :data="services" v-loading="loading" stripe border style="margin-top: 12px">
        <el-table-column label="服务名称" min-width="140">
          <template #default="{ row }">
            <span class="service-name">{{ row.name }}</span>
            <el-tag :type="categoryTag(row.category)" size="small" effect="plain" style="margin-left: 6px">
              {{ categoryLabel(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="服务器" width="160">
          <template #default="{ row }">
            <span class="server-text">{{ row.serverName }}</span>
            <br />
            <span style="font-size: 12px; color: #909399">{{ row.serverIp }}:{{ row.port }}</span>
          </template>
        </el-table-column>
        <el-table-column label="功能描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description }}</template>
        </el-table-column>
        <el-table-column label="备份方式" width="110">
          <template #default="{ row }">
            <el-tag :type="methodTag(row.backupMethod)" size="small">{{ methodLabel(row.backupMethod) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? "已启用" : "未启用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上次备份" width="150">
          <template #default="{ row }">
            <div v-if="row.lastBackup?.startedAt">
              <el-tag :type="lastBackupStatusType(row.lastBackup.status)" size="small">
                {{ lastBackupStatusText(row.lastBackup.status) }}
              </el-tag>
              <div style="font-size: 11px; color: #909399; margin-top: 2px">{{ row.lastBackup.startedAt }}</div>
            </div>
            <span v-else style="color: #c0c4cc">未备份</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          small
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 服务详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="`${detail?.name} — 服务详情`" width="860px" destroy-on-close>
      <div v-if="detail" class="service-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="服务器">{{ detail.serverName }}</el-descriptions-item>
            <el-descriptions-item label="IP:端口">{{ detail.serverIp }}:{{ detail.port }}</el-descriptions-item>
            <el-descriptions-item label="分类">{{ categoryLabel(detail.category) }}</el-descriptions-item>
            <el-descriptions-item label="备份方式" :span="3">{{ methodLabel(detail.backupMethod) }}</el-descriptions-item>
            <el-descriptions-item label="备份路径" :span="3">
              <code class="path-text">{{ detail.backupPath }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="功能描述" :span="3">{{ detail.description }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 备份统计 -->
        <div class="detail-section" style="margin-top: 16px">
          <h4 class="section-title">备份统计</h4>
          <div class="detail-stats">
            <div class="detail-stat" style="border-left-color: #409eff">
              <span class="stat-num">{{ detail.stats.totalLogs }}</span>
              <span class="stat-txt">总备份</span>
            </div>
            <div class="detail-stat" style="border-left-color: #67c23a">
              <span class="stat-num">{{ detail.stats.successLogs }}</span>
              <span class="stat-txt">成功</span>
            </div>
            <div class="detail-stat" style="border-left-color: #f56c6c">
              <span class="stat-num">{{ detail.stats.failedLogs }}</span>
              <span class="stat-txt">失败</span>
            </div>
            <div class="detail-stat" style="border-left-color: #e6a23c">
              <span class="stat-num">{{ detail.stats.lastBackup?.startedAt ? '今天' : '无' }}</span>
              <span class="stat-txt">最近备份</span>
            </div>
          </div>
        </div>

        <!-- 恢复步骤 -->
        <div v-if="detail.restoreSteps?.length" class="detail-section" style="margin-top: 16px">
          <h4 class="section-title">
            <el-icon><RefreshRight /></el-icon> 恢复步骤
          </h4>
          <div class="restore-steps">
            <div v-for="(step, i) in detail.restoreSteps" :key="i" class="restore-step">
              <div class="step-badge">Step {{ step.step }}</div>
              <div class="step-content">
                <div class="step-title">{{ step.title }}</div>
                <pre class="step-command">{{ step.command }}</pre>
              </div>
            </div>
          </div>
          <el-button type="danger" size="small" style="margin-top: 12px" @click="handleRestore(detail)">
            <el-icon><Warning /></el-icon> 执行恢复
          </el-button>
        </div>

        <!-- 最近备份记录 -->
        <div class="detail-section" style="margin-top: 16px">
          <h4 class="section-title">最近备份记录</h4>
          <el-table :data="detailLogs" size="small" stripe v-loading="logsLoading" max-height="260">
            <el-table-column label="时间" prop="startedAt" width="170" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="大小" width="90">
              <template #default="{ row }">
                {{ row.fileSize ? formatSize(row.fileSize) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="耗时" width="70" align="center">
              <template #default="{ row }">{{ row.duration }}s</template>
            </el-table-column>
            <el-table-column label="文件路径" show-overflow-tooltip>
              <template #default="{ row }">{{ row.filePath || row.errorMsg }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Download, Refresh, Search, RefreshRight, Warning } from "@element-plus/icons-vue";
import BackupAPI, { type BackupService, type ServiceDetail, type BackupLog } from "@/api/backup";
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({ name: "BackupManage" });

const loading = ref(false);
const batchLoading = ref(false);
const logsLoading = ref(false);
const services = ref<BackupService[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);

const filterCategory = ref("");
const filterServer = ref("");
const filterKeyword = ref("");

const stats = ref({ total: 0, enabled: 0, disabled: 0 });
const recentSuccess = ref(0);

const detailVisible = ref(false);
const detail = ref<ServiceDetail | null>(null);
const detailLogs = ref<BackupLog[]>([]);

const categoryLabels: Record<string, string> = {
  database: "数据库", monitoring: "监控", cicd: "CI/CD",
  config: "配置中心", gateway: "网关", application: "应用", documentation: "文档",
};
const categoryTags: Record<string, "primary" | "success" | "warning" | "danger" | "info"> = {
  database: "danger", monitoring: "primary", cicd: "warning",
  config: "success", gateway: "info", application: "primary", documentation: "info",
};
const methodLabels: Record<string, string> = {
  mysqldump: "mysqldump", tar: "tar 归档", "docker-export": "Docker 导出",
  "docker-cp": "Docker cp", rsync: "rsync", skip: "无需备份",
};
const methodTags: Record<string, "success" | "warning" | "danger" | "info"> = {
  mysqldump: "danger", tar: "primary", "docker-export": "warning",
  "docker-cp": "warning", rsync: "info", skip: "info",
};

function categoryLabel(c: string) { return categoryLabels[c] || c; }
function categoryTag(c: string) { return categoryTags[c] || "info"; }
function methodLabel(m: string) { return methodLabels[m] || m; }
function methodTag(m: string) { return methodTags[m] || "info"; }

function lastBackupStatusType(s: string | null) {
  return s === "success" ? "success" : s === "failed" ? "danger" : "info";
}
function lastBackupStatusText(s: string | null) {
  return s === "success" ? "成功" : s === "failed" ? "失败" : s || "未知";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + " GB";
}

async function fetchStats() {
  try {
    const data = await BackupAPI.getStats();
    stats.value = { total: data.total, enabled: data.enabled, disabled: data.disabled };
    recentSuccess.value = data.dailyStats?.reduce((sum, d) => sum + d.success, 0) ?? 0;
  } catch { /* ignored */ }
}

async function fetchData() {
  loading.value = true;
  try {
    const data = await BackupAPI.getServices({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      category: filterCategory.value || undefined,
      serverIp: filterServer.value || undefined,
      keyword: filterKeyword.value || undefined,
    });
    services.value = data?.list || [];
    total.value = data?.total || 0;
  } catch { /* ignored */ } finally {
    loading.value = false;
  }
}

async function handleBatchBackup() {
  try {
    await ElMessageBox.confirm("确认对所有已启用服务执行备份？", "批量备份", { type: "warning" });
    batchLoading.value = true;
    const data = await BackupAPI.batchBackup();
    ElMessage.success(`批量备份完成，共 ${data.total} 个服务`);
    fetchData();
    fetchStats();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(e.message || "批量备份失败");
  } finally {
    batchLoading.value = false;
  }
}

async function viewDetail(row: BackupService) {
  try {
    detail.value = await BackupAPI.getService(row.id);
    detailLogs.value = (await BackupAPI.getLogs(row.id, { pageSize: 10 }))?.list || [];
    detailVisible.value = true;
  } catch {
    ElMessage.error("获取详情失败");
  }
}

async function handleRestore(svc: ServiceDetail) {
  try {
    await ElMessageBox.confirm(
      `恢复操作不可逆！请输入服务名称「${svc.name}」确认执行恢复。`,
      "⚠️ 危险操作确认",
      { type: "error", inputPlaceholder: `请输入: ${svc.name}`, inputPattern: new RegExp(`^${svc.name}$`) }
    );
    await BackupAPI.triggerRestore(svc.id, svc.name);
    ElMessage.success("恢复操作已触发（实际执行需接入真实备份系统）");
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(e.message || "恢复失败");
  }
}

onMounted(() => {
  fetchData();
  fetchStats();
});
</script>

<style scoped>
.backup-manage { padding: 0; }

/* 顶部统计卡片 */
.stats-bar { display: flex; gap: 12px; margin-bottom: 0; }
.stat-card {
  flex: 1; background: #fff; border-radius: 8px; padding: 16px 20px;
  border: 1px solid #ebeef5; border-left: 3px solid; text-align: center;
}
.stat-value { font-size: 26px; font-weight: 700; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }

.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
.service-name { font-weight: 600; color: #303133; }
.server-text { font-size: 13px; color: #606266; }
.path-text { font-size: 12px; color: #409eff; font-family: "JetBrains Mono", monospace; }

/* 详情弹窗 */
.service-detail { }
.detail-section { }
.section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 600; color: #303133;
  margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #ebeef5;
}
.detail-stats { display: flex; gap: 12px; }
.detail-stat {
  flex: 1; text-align: center; padding: 12px 8px; border-radius: 6px;
  background: #f5f7fa; border-left: 3px solid;
}
.stat-num { font-size: 22px; font-weight: 700; color: #303133; display: block; }
.stat-txt { font-size: 12px; color: #909399; }

/* 恢复步骤 */
.restore-steps { display: flex; flex-direction: column; gap: 10px; }
.restore-step { display: flex; gap: 12px; align-items: flex-start; }
.step-badge {
  background: #409eff; color: #fff; padding: 4px 10px; border-radius: 4px;
  font-size: 12px; font-weight: 600; white-space: nowrap; margin-top: 2px;
}
.step-content { flex: 1; }
.step-title { font-weight: 500; color: #303133; margin-bottom: 4px; }
.step-command {
  background: #0d1117; color: #c9d1d9; padding: 8px 12px; border-radius: 6px;
  font-family: "JetBrains Mono", monospace; font-size: 12px; margin: 0;
  white-space: pre-wrap; line-height: 1.5;
}
</style>
