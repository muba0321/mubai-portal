<template>
  <div class="service-manage">
    <!-- 顶部统计卡片 -->
    <div class="stats-bar">
      <div class="stat-card" style="border-left-color: #409eff">
        <div class="stat-value">{{ statusStats.total }}</div>
        <div class="stat-label">总服务</div>
      </div>
      <div class="stat-card" style="border-left-color: #67c23a">
        <div class="stat-value">{{ statusStats.running }}</div>
        <div class="stat-label">运行中</div>
      </div>
      <div class="stat-card" style="border-left-color: #f56c6c">
        <div class="stat-value">{{ statusStats.stopped }}</div>
        <div class="stat-label">已停止</div>
      </div>
      <div class="stat-card" style="border-left-color: #e6a23c">
        <div class="stat-value">{{ statusStats.error }}</div>
        <div class="stat-label">异常</div>
      </div>
    </div>

    <!-- 标签页 -->
    <el-card shadow="never" style="margin-top: 16px">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- Tab 1: 服务总览 -->
        <el-tab-pane label="服务总览" name="overview">
          <template #label>
            <span><el-icon><Monitor /></el-icon> 服务总览</span>
          </template>

          <!-- 筛选 -->
          <div class="filter-bar" style="margin-bottom: 12px">
            <el-select v-model="filterCategory" placeholder="全部分类" clearable style="width: 140px" @change="fetchStatus">
              <el-option label="数据库" value="database" />
              <el-option label="监控" value="monitoring" />
              <el-option label="CI/CD" value="cicd" />
              <el-option label="配置中心" value="config" />
              <el-option label="网关" value="gateway" />
              <el-option label="应用" value="application" />
              <el-option label="文档" value="documentation" />
            </el-select>
            <el-select v-model="filterServer" placeholder="全部服务器" clearable style="width: 160px" @change="fetchStatus">
              <el-option label="215 应用服务器" value="154.201.73.215" />
              <el-option label="207 监控服务器" value="154.12.54.207" />
              <el-option label="32 网关服务器" value="38.246.245.32" />
            </el-select>
            <el-button type="primary" :loading="statusLoading" :icon="Refresh" @click="fetchStatus">刷新状态</el-button>
          </div>

          <!-- 服务状态列表 -->
          <el-table :data="filteredStatus" v-loading="statusLoading" stripe border>
            <el-table-column label="服务名称" min-width="130">
              <template #default="{ row }">
                <span class="service-name">{{ row.serviceName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="服务器" width="150">
              <template #default="{ row }">
                <span style="font-size: 13px">{{ getServerShortName(row.serverIp) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="serviceStatusType(row.status)" size="small" effect="dark">
                  {{ serviceStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="运行时长" width="110" align="center">
              <template #default="{ row }">
                <span v-if="row.uptime" class="uptime-text">{{ formatUptime(row.uptime) }}</span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="PID" width="70" align="center">
              <template #default="{ row }">
                <span v-if="row.pid">{{ row.pid }}</span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="端口" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.portStatus === 'open' ? 'success' : 'danger'" size="small" effect="plain">
                  {{ row.portStatus === 'open' ? '开放' : '关闭' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="CPU" width="70" align="center">
              <template #default="{ row }">
                <span v-if="row.cpu">{{ row.cpu }}%</span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="内存" width="90" align="center">
              <template #default="{ row }">
                <span v-if="row.memory">{{ row.memory }}</span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <el-button v-if="row.status === 'stopped'" type="success" link size="small" @click="handleStart(row)">启动</el-button>
                <el-button v-if="row.status === 'running'" type="warning" link size="small" @click="handleRestart(row)">重启</el-button>
                <el-button v-if="row.status === 'running'" type="danger" link size="small" @click="handleStop(row)">停止</el-button>
                <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 2: 备份管理 -->
        <el-tab-pane label="备份管理" name="backup">
          <template #label>
            <span><el-icon><DocumentCopy /></el-icon> 备份管理</span>
          </template>

          <!-- 筛选栏 + 操作按钮 -->
          <div class="filter-bar">
            <el-select v-model="bkFilterCategory" placeholder="全部分类" clearable style="width: 140px" @change="fetchBackupData">
              <el-option label="数据库" value="database" />
              <el-option label="监控" value="monitoring" />
              <el-option label="CI/CD" value="cicd" />
              <el-option label="配置中心" value="config" />
              <el-option label="网关" value="gateway" />
              <el-option label="应用" value="application" />
              <el-option label="文档" value="documentation" />
            </el-select>
            <el-select v-model="bkFilterServer" placeholder="全部服务器" clearable style="width: 160px" @change="fetchBackupData">
              <el-option label="215 应用服务器" value="154.201.73.215" />
              <el-option label="207 监控服务器" value="154.12.54.207" />
              <el-option label="32 网关服务器" value="38.246.245.32" />
            </el-select>
            <el-input v-model="bkFilterKeyword" placeholder="搜索服务名称" clearable style="width: 200px" @clear="fetchBackupData" @keyup.enter="fetchBackupData">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <div style="flex: 1" />
            <el-button type="success" :loading="batchLoading" @click="handleBatchBackup">
              <el-icon><Download /></el-icon> 批量备份
            </el-button>
          </div>

          <!-- 备份服务列表 -->
          <el-table :data="bkServices" v-loading="bkLoading" stripe border style="margin-top: 12px">
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
                <el-button type="primary" link size="small" @click="viewBackupDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap" v-if="bkTotal > 0">
            <el-pagination
              v-model:current-page="bkPageNum"
              :page-size="bkPageSize"
              :total="bkTotal"
              layout="prev, pager, next"
              small
              @current-change="fetchBackupData"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 服务详情弹窗（服务总览） -->
    <el-dialog v-model="detailVisible" :title="`${statusDetail?.serviceName} — 服务详情`" width="800px" destroy-on-close>
      <div v-if="statusDetail" class="service-detail">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="服务器">{{ getServerShortName(statusDetail.serverIp) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="serviceStatusType(statusDetail.status)" size="small" effect="dark">{{ serviceStatusText(statusDetail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="PID">{{ statusDetail.pid || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运行时长">{{ statusDetail.uptime ? formatUptime(statusDetail.uptime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="CPU">{{ statusDetail.cpu ? statusDetail.cpu + '%' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="内存">{{ statusDetail.memory || '-' }}</el-descriptions-item>
          <el-descriptions-item label="端口状态" :span="3">
            <el-tag :type="statusDetail.portStatus === 'open' ? 'success' : 'danger'" size="small">
              {{ statusDetail.portStatus === 'open' ? '开放' : '关闭' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-alert v-if="statusDetail.error" :title="statusDetail.error" type="error" :closable="false" show-icon style="margin-top: 12px" />
      </div>
    </el-dialog>

    <!-- 备份详情弹窗（备份管理） -->
    <el-dialog v-model="bkDetailVisible" :title="`${bkDetail?.name} — 备份详情`" width="860px" destroy-on-close>
      <div v-if="bkDetail" class="service-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="服务器">{{ bkDetail.serverName }}</el-descriptions-item>
            <el-descriptions-item label="IP:端口">{{ bkDetail.serverIp }}:{{ bkDetail.port }}</el-descriptions-item>
            <el-descriptions-item label="分类">{{ categoryLabel(bkDetail.category) }}</el-descriptions-item>
            <el-descriptions-item label="备份方式" :span="3">{{ methodLabel(bkDetail.backupMethod) }}</el-descriptions-item>
            <el-descriptions-item label="备份路径" :span="3">
              <code class="path-text">{{ bkDetail.backupPath }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="功能描述" :span="3">{{ bkDetail.description }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 备份统计 -->
        <div class="detail-section" style="margin-top: 16px">
          <h4 class="section-title">备份统计</h4>
          <div class="detail-stats">
            <div class="detail-stat" style="border-left-color: #409eff">
              <span class="stat-num">{{ bkDetail.stats.totalLogs }}</span>
              <span class="stat-txt">总备份</span>
            </div>
            <div class="detail-stat" style="border-left-color: #67c23a">
              <span class="stat-num">{{ bkDetail.stats.successLogs }}</span>
              <span class="stat-txt">成功</span>
            </div>
            <div class="detail-stat" style="border-left-color: #f56c6c">
              <span class="stat-num">{{ bkDetail.stats.failedLogs }}</span>
              <span class="stat-txt">失败</span>
            </div>
            <div class="detail-stat" style="border-left-color: #e6a23c">
              <span class="stat-num">{{ bkDetail.stats.lastBackup?.startedAt ? '今天' : '无' }}</span>
              <span class="stat-txt">最近备份</span>
            </div>
          </div>
        </div>

        <!-- 恢复步骤 -->
        <div v-if="bkDetail.restoreSteps?.length" class="detail-section" style="margin-top: 16px">
          <h4 class="section-title">
            <el-icon><RefreshRight /></el-icon> 恢复步骤
          </h4>
          <div class="restore-steps">
            <div v-for="(step, i) in bkDetail.restoreSteps" :key="i" class="restore-step">
              <div class="step-badge">Step {{ step.step }}</div>
              <div class="step-content">
                <div class="step-title">{{ step.title }}</div>
                <pre class="step-command">{{ step.command }}</pre>
              </div>
            </div>
          </div>
          <el-button type="danger" size="small" style="margin-top: 12px" @click="handleRestore(bkDetail)">
            <el-icon><Warning /></el-icon> 执行恢复
          </el-button>
        </div>

        <!-- 最近备份记录 -->
        <div class="detail-section" style="margin-top: 16px">
          <h4 class="section-title">最近备份记录</h4>
          <el-table :data="bkDetailLogs" size="small" stripe v-loading="bkLogsLoading" max-height="260">
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
import { Download, Refresh, Search, RefreshRight, Warning, Monitor, DocumentCopy } from "@element-plus/icons-vue";
import BackupAPI, { type BackupService, type ServiceDetail, type ServiceStatus, type BackupLog } from "@/api/backup";
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({ name: "ServiceManage" });

const activeTab = ref("overview");

// ========== 服务总览 ==========
const statusLoading = ref(false);
const allStatus = ref<ServiceStatus[]>([]);
const filterCategory = ref("");
const filterServer = ref("");
const detailVisible = ref(false);
const statusDetail = ref<ServiceStatus | null>(null);

const statusStats = ref({ total: 0, running: 0, stopped: 0, error: 0 });

const filteredStatus = computed(() => {
  let list = allStatus.value;
  if (filterCategory.value) {
    // 需要关联服务分类
    list = list.filter(s => {
      const svc = allServicesMap.value[s.serviceId];
      return svc && svc.category === filterCategory.value;
    });
  }
  if (filterServer.value) {
    list = list.filter(s => s.serverIp === filterServer.value);
  }
  return list;
});

const allServicesMap = ref<Record<number, BackupService>>({});

function getServerShortName(ip: string) {
  const map: Record<string, string> = {
    "154.201.73.215": "215 应用",
    "154.12.54.207": "207 监控",
    "38.246.245.32": "32 网关",
  };
  return map[ip] || ip;
}

function serviceStatusType(s: string) {
  return s === "running" ? "success" : s === "stopped" ? "danger" : s === "error" ? "warning" : "info";
}
function serviceStatusText(s: string) {
  return s === "running" ? "运行中" : s === "stopped" ? "已停止" : s === "error" ? "异常" : s === "skip" ? "跳过" : "未知";
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${mins}分`;
  return `${mins}分钟`;
}

async function fetchStatus() {
  statusLoading.value = true;
  try {
    // 先加载服务列表获取分类信息
    const svcData = await BackupAPI.getServices({ pageSize: 100 });
    allServicesMap.value = {};
    (svcData?.list || []).forEach(s => { allServicesMap.value[s.id] = s; });

    const data = await BackupAPI.checkAllStatus();
    allStatus.value = data || [];

    statusStats.value = {
      total: allStatus.value.length,
      running: allStatus.value.filter(s => s.status === "running").length,
      stopped: allStatus.value.filter(s => s.status === "stopped").length,
      error: allStatus.value.filter(s => s.status === "error").length,
    };
  } catch { /* ignored */ } finally {
    statusLoading.value = false;
  }
}

function viewDetail(row: ServiceStatus) {
  statusDetail.value = row;
  detailVisible.value = true;
}

async function handleStart(row: ServiceStatus) {
  try {
    await ElMessageBox.confirm(`确认启动服务「${row.serviceName}」？`, "启动服务", { type: "warning" });
    await BackupAPI.startService(row.serviceId);
    ElMessage.success(`已启动 ${row.serviceName}`);
    fetchStatus();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(e.message || "启动失败");
  }
}

async function handleStop(row: ServiceStatus) {
  try {
    await ElMessageBox.confirm(`确认停止服务「${row.serviceName}」？`, "停止服务", { type: "warning" });
    await BackupAPI.stopService(row.serviceId);
    ElMessage.success(`已停止 ${row.serviceName}`);
    fetchStatus();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(e.message || "停止失败");
  }
}

async function handleRestart(row: ServiceStatus) {
  try {
    await ElMessageBox.confirm(`确认重启服务「${row.serviceName}」？`, "重启服务", { type: "warning" });
    await BackupAPI.restartService(row.serviceId);
    ElMessage.success(`已重启 ${row.serviceName}`);
    fetchStatus();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(e.message || "重启失败");
  }
}

// ========== 备份管理 ==========
const bkLoading = ref(false);
const batchLoading = ref(false);
const bkLogsLoading = ref(false);
const bkServices = ref<BackupService[]>([]);
const bkTotal = ref(0);
const bkPageNum = ref(1);
const bkPageSize = ref(20);
const bkFilterCategory = ref("");
const bkFilterServer = ref("");
const bkFilterKeyword = ref("");

const bkDetailVisible = ref(false);
const bkDetail = ref<ServiceDetail | null>(null);
const bkDetailLogs = ref<BackupLog[]>([]);

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

async function fetchBackupData() {
  bkLoading.value = true;
  try {
    const data = await BackupAPI.getServices({
      pageNum: bkPageNum.value,
      pageSize: bkPageSize.value,
      category: bkFilterCategory.value || undefined,
      serverIp: bkFilterServer.value || undefined,
      keyword: bkFilterKeyword.value || undefined,
    });
    bkServices.value = data?.list || [];
    bkTotal.value = data?.total || 0;
  } catch { /* ignored */ } finally {
    bkLoading.value = false;
  }
}

async function handleBatchBackup() {
  try {
    await ElMessageBox.confirm("确认对所有已启用服务执行备份？", "批量备份", { type: "warning" });
    batchLoading.value = true;
    const data = await BackupAPI.batchBackup();
    ElMessage.success(`批量备份完成，共 ${data.total} 个服务`);
    fetchBackupData();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(e.message || "批量备份失败");
  } finally {
    batchLoading.value = false;
  }
}

async function viewBackupDetail(row: BackupService) {
  try {
    bkDetail.value = await BackupAPI.getService(row.id);
    bkDetailLogs.value = (await BackupAPI.getLogs(row.id, { pageSize: 10 }))?.list || [];
    bkDetailVisible.value = true;
  } catch {
    ElMessage.error("获取详情失败");
  }
}

async function handleRestore(svc: ServiceDetail) {
  try {
    await ElMessageBox.confirm(
      `恢复操作不可逆！请输入服务名称「${svc.name}」确认执行恢复。`,
      "️ 危险操作确认",
      { type: "error", inputPlaceholder: `请输入: ${svc.name}`, inputPattern: new RegExp(`^${svc.name}$`) }
    );
    await BackupAPI.triggerRestore(svc.id, svc.name);
    ElMessage.success("恢复操作已触发（实际执行需接入真实备份系统）");
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(e.message || "恢复失败");
  }
}

function onTabChange(tab: string) {
  if (tab === "overview" && allStatus.value.length === 0) {
    fetchStatus();
  }
}

onMounted(() => {
  fetchStatus();
  fetchBackupData();
});
</script>

<style scoped>
.service-manage { padding: 0; }

/* 顶部统计卡片 */
.stats-bar { display: flex; gap: 12px; margin-bottom: 0; }
.stat-card {
  flex: 1; background: #fff; border-radius: 8px; padding: 16px 20px;
  border: 1px solid #ebeef5; border-left: 3px solid; text-align: center;
}
.stat-value { font-size: 26px; font-weight: 700; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
.service-name { font-weight: 600; color: #303133; }
.server-text { font-size: 13px; color: #606266; }
.path-text { font-size: 12px; color: #409eff; font-family: "JetBrains Mono", monospace; }
.uptime-text { font-size: 13px; color: #67c23a; font-weight: 500; }

/* 详情弹窗 */
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
