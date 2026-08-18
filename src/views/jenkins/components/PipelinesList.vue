<template>
  <div class="pipelines-list">
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="loadPipelines">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </div>

    <!-- 流水线列表 -->
    <el-table :data="pipelines" v-loading="loading" stripe>
      <el-table-column label="名称" min-width="200">
        <template #default="{ row }">
          <el-link type="primary" @click="viewBuilds(row)">{{ row.displayName || row.name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="健康度" width="120">
        <template #default="{ row }">
          <el-progress :percentage="row.healthScore" :status="row.healthScore >= 80 ? 'success' : 'warning'" />
        </template>
      </el-table-column>
      <el-table-column label="最后构建" width="150">
        <template #default="{ row }">
          <template v-if="row.lastBuild">
            <el-tag :type="getStatusType(row.lastBuild.status)" size="small">
              {{ formatStatus(row.lastBuild.status) }}
            </el-tag>
            <span style="margin-left: 8px;">#{{ row.lastBuild.number }}</span>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="构建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.lastBuild?.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="triggerBuild(row)">构建</el-button>
          <el-button size="small" @click="viewBuilds(row)">历史</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 构建历史弹窗 -->
    <el-dialog v-model="buildHistoryVisible" title="构建历史" width="800px">
      <el-table :data="builds" v-loading="buildsLoading" stripe>
        <el-table-column label="构建编号" width="120">
          <template #default="{ row }">
            <el-link type="primary" @click="viewBuildDetail(row)">#{{ row.number }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ formatStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="120">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="viewBuildLog(row)">日志</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="buildHistoryVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 构建日志弹窗 -->
    <el-dialog v-model="buildLogVisible" title="构建日志" width="900px">
      <div class="log-container">
        <pre class="log-content">{{ buildLog }}</pre>
      </div>
      <template #footer>
        <el-button @click="buildLogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { JenkinsAPI, type JenkinsJob, type JenkinsBuild } from "@/api/jenkins";
import { ElMessage, ElMessageBox } from "element-plus";

const pipelines = ref<JenkinsJob[]>([]);
const loading = ref(false);
const builds = ref<JenkinsBuild[]>([]);
const buildsLoading = ref(false);
const buildHistoryVisible = ref(false);
const buildLogVisible = ref(false);
const buildLog = ref("");
const currentJob = ref<JenkinsJob | null>(null);

function getStatusType(status: string) {
  if (status === "SUCCESS") return "success";
  if (status === "FAILURE") return "danger";
  if (status === "UNSTABLE") return "warning";
  return "info";
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    SUCCESS: "成功",
    FAILURE: "失败",
    UNSTABLE: "不稳定",
    ABORTED: "中止",
    NOT_BUILT: "未构建",
  };
  return map[status] || status;
}

function formatTime(timestamp?: number) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("zh-CN");
}

function formatDuration(duration?: number) {
  if (!duration) return "-";
  const seconds = Math.floor(duration / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分${seconds % 60}秒`;
  const hours = Math.floor(minutes / 60);
  return `${hours}时${minutes % 60}分`;
}

async function loadPipelines() {
  loading.value = true;
  try {
    pipelines.value = await JenkinsAPI.getPipelines();
  } catch {
    ElMessage.error("加载流水线失败");
  } finally {
    loading.value = false;
  }
}

async function triggerBuild(job: JenkinsJob) {
  try {
    await ElMessageBox.confirm(`确认触发构建：${job.displayName || job.name}?`, "确认", { type: "warning" });
    await JenkinsAPI.triggerBuild(job.name);
    ElMessage.success("构建已触发");
  } catch {
    // 取消
  }
}

async function viewBuilds(job: JenkinsJob) {
  currentJob.value = job;
  buildHistoryVisible.value = true;
  buildsLoading.value = true;
  try {
    const data = await JenkinsAPI.getBuilds(job.name);
    builds.value = data.list || [];
  } catch {
    ElMessage.error("加载构建历史失败");
  } finally {
    buildsLoading.value = false;
  }
}

async function viewBuildDetail(build: JenkinsBuild) {
  if (currentJob.value) {
    window.open(build.url, "_blank");
  }
}

async function viewBuildLog(build: JenkinsBuild) {
  if (!currentJob.value) return;
  try {
    const data = await JenkinsAPI.getBuildLog(currentJob.value.name, build.number);
    buildLog.value = data.log || "";
    buildLogVisible.value = true;
  } catch {
    ElMessage.error("加载日志失败");
  }
}

onMounted(() => {
  loadPipelines();
});
</script>

<style scoped>
.action-bar {
  margin-bottom: 20px;
}

.log-container {
  max-height: 500px;
  overflow: auto;
}

.log-content {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
