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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleBuild(row)">构建</el-button>
          <el-button size="small" @click="viewBuilds(row)">历史</el-button>
          <el-button size="small" @click="viewOverview(row)">概览</el-button>
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

    <!-- 参数化构建弹窗 -->
    <el-dialog v-model="paramBuildVisible" title="参数化构建" width="500px">
      <el-form :model="paramForm" label-width="120px">
        <el-form-item
          v-for="param in parameterDefinitions"
          :key="param.name"
          :label="param.name"
          :prop="param.name"
        >
          <!-- 字符串类型 -->
          <el-input
            v-if="param.type === 'string'"
            v-model="paramForm[param.name]"
            :placeholder="param.description || param.defaultValue || '请输入'"
          />
          <!-- 布尔类型 -->
          <el-switch
            v-else-if="param.type === 'boolean'"
            v-model="paramForm[param.name]"
          />
          <!-- 选择类型 -->
          <el-select
            v-else-if="param.type === 'choice'"
            v-model="paramForm[param.name]"
            style="width: 100%"
          >
            <el-option
              v-for="choice in param.choices"
              :key="choice"
              :label="choice"
              :value="choice"
            />
          </el-select>
          <div v-if="param.description" style="font-size: 12px; color: #909399; margin-top: 4px;">
            {{ param.description }}
          </div>
        </el-form-item>
        <el-form-item v-if="parameterDefinitions.length === 0">
          <el-empty description="该流水线没有定义参数" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paramBuildVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmParamBuild" :loading="building">确认构建</el-button>
      </template>
    </el-dialog>

    <!-- 构建概览弹窗 -->
    <el-dialog v-model="overviewVisible" title="流水线概览" width="900px">
      <div v-if="buildOverview">
        <!-- 构建基本信息 -->
        <el-descriptions :column="3" border style="margin-bottom: 20px;">
          <el-descriptions-item label="流水线">{{ buildOverview.name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(buildOverview.status)" size="small">
              {{ formatStatus(buildOverview.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总耗时">{{ formatDuration(buildOverview.durationMillis) }}</el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="3">{{ formatTime(buildOverview.startTimeMillis) }}</el-descriptions-item>
        </el-descriptions>

        <!-- Stages 步骤条 -->
        <div v-if="buildOverview.stages.length > 0" style="margin-bottom: 20px;">
          <h4 style="margin-bottom: 12px;">构建阶段</h4>
          <div class="stages-container">
            <div
              v-for="(stage, index) in buildOverview.stages"
              :key="index"
              class="stage-item"
              :class="`stage-${stage.status.toLowerCase()}`"
            >
              <div class="stage-icon">
                <el-icon v-if="stage.status === 'SUCCESS'"><CircleCheck /></el-icon>
                <el-icon v-else-if="stage.status === 'FAILED'"><CircleClose /></el-icon>
                <el-icon v-else-if="stage.status === 'RUNNING'"><Loading /></el-icon>
                <el-icon v-else><Minus /></el-icon>
              </div>
              <div class="stage-info">
                <div class="stage-name">{{ stage.name }}</div>
                <div class="stage-duration">{{ formatDuration(stage.durationMillis) }}</div>
              </div>
              <div v-if="index < buildOverview.stages.length - 1" class="stage-connector"></div>
            </div>
          </div>
        </div>
        <div v-else style="margin-bottom: 20px; padding: 20px; background: #f5f7fa; border-radius: 4px; text-align: center; color: #909399;">
          安装 Pipeline REST API 插件后可查看详细的构建阶段信息
        </div>

        <!-- 日志查看 -->
        <div v-if="overviewLog" style="margin-top: 20px;">
          <h4 style="margin-bottom: 12px;">
            控制台日志
            <el-button size="small" @click="loadOverviewLog" style="margin-left: 10px;">刷新日志</el-button>
          </h4>
          <div class="log-container">
            <pre class="log-content">{{ overviewLog }}</pre>
          </div>
        </div>
      </div>
      <div v-else v-loading="overviewLoading" style="min-height: 200px;"></div>
      <template #footer>
        <el-button @click="overviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Refresh, CircleCheck, CircleClose, Loading, Minus } from "@element-plus/icons-vue";
import { JenkinsAPI, type JenkinsJob, type JenkinsBuild, type ParameterDefinition, type BuildOverview } from "@/api/jenkins";
import { ElMessage, ElMessageBox } from "element-plus";

const pipelines = ref<JenkinsJob[]>([]);
const loading = ref(false);
const builds = ref<JenkinsBuild[]>([]);
const buildsLoading = ref(false);
const buildHistoryVisible = ref(false);
const buildLogVisible = ref(false);
const buildLog = ref("");
const currentJob = ref<JenkinsJob | null>(null);

// 参数化构建
const paramBuildVisible = ref(false);
const parameterDefinitions = ref<ParameterDefinition[]>([]);
const paramForm = ref<Record<string, any>>({});
const building = ref(false);

// 构建概览
const overviewVisible = ref(false);
const overviewLoading = ref(false);
const buildOverview = ref<BuildOverview | null>(null);
const overviewLog = ref("");

function getStatusType(status: string) {
  if (status === "SUCCESS") return "success";
  if (status === "FAILURE" || status === "FAILED") return "danger";
  if (status === "UNSTABLE") return "warning";
  if (status === "RUNNING") return "";
  return "info";
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    SUCCESS: "成功",
    FAILURE: "失败",
    FAILED: "失败",
    UNSTABLE: "不稳定",
    ABORTED: "中止",
    NOT_BUILT: "未构建",
    RUNNING: "运行中",
  };
  return map[status] || status;
}

function formatTime(timestamp?: number) {
  if (!timestamp) return "-";
  // Jenkins 返回的是毫秒时间戳
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

/** 处理构建按钮点击 */
async function handleBuild(job: JenkinsJob) {
  // 先获取 Job 配置，检查是否有参数
  try {
    const config = await JenkinsAPI.getJobConfig(job.name);
    if (config.hasParameters && config.parameters.length > 0) {
      // 有参数，弹出参数输入框
      parameterDefinitions.value = config.parameters;
      paramForm.value = {};
      config.parameters.forEach((param: ParameterDefinition) => {
        paramForm.value[param.name] = param.defaultValue ?? (param.type === "boolean" ? false : "");
      });
      currentJob.value = job;
      paramBuildVisible.value = true;
    } else {
      // 无参数，直接触发构建
      await confirmBuild(job);
    }
  } catch {
    // 获取配置失败，直接触发构建
    await confirmBuild(job);
  }
}

/** 确认触发构建 */
async function confirmBuild(job: JenkinsJob) {
  try {
    await ElMessageBox.confirm(`确认触发构建：${job.displayName || job.name}?`, "确认", { type: "warning" });
    await JenkinsAPI.triggerBuild(job.name);
    ElMessage.success("构建已触发");
  } catch {
    // 取消
  }
}

/** 确认参数化构建 */
async function confirmParamBuild() {
  if (!currentJob.value) return;
  building.value = true;
  try {
    await JenkinsAPI.triggerBuild(currentJob.value.name, { parameters: paramForm.value });
    ElMessage.success("构建已触发");
    paramBuildVisible.value = false;
  } catch {
    ElMessage.error("触发构建失败");
  } finally {
    building.value = false;
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

/** 查看构建概览 */
async function viewOverview(job: JenkinsJob) {
  currentJob.value = job;
  overviewVisible.value = true;
  overviewLoading.value = true;
  buildOverview.value = null;
  overviewLog.value = "";

  try {
    // 获取最后一次构建的概览
    let buildNumber = job.lastBuild?.number;
    if (!buildNumber) {
      // 如果没有 lastBuild，获取构建历史
      const data = await JenkinsAPI.getBuilds(job.name, { page: 1, pageSize: 1 });
      if (data.list && data.list.length > 0) {
        buildNumber = data.list[0].number;
      }
    }

    if (buildNumber) {
      const overview = await JenkinsAPI.getBuildOverview(job.name, buildNumber);
      buildOverview.value = overview;
      // 自动加载日志
      loadOverviewLog();
    } else {
      ElMessage.warning("该流水线暂无构建记录");
    }
  } catch {
    ElMessage.error("加载概览失败");
  } finally {
    overviewLoading.value = false;
  }
}

/** 加载概览日志 */
async function loadOverviewLog() {
  if (!currentJob.value || !buildOverview.value) return;
  try {
    const data = await JenkinsAPI.getBuildLog(currentJob.value.name, buildOverview.value.stages.length > 0 ? buildOverview.value.stages[buildOverview.value.stages.length - 1].startTimeMillis : 1);
    // 简化：直接获取最后一次构建的日志
    const buildNum = currentJob.value.lastBuild?.number;
    if (buildNum) {
      const logData = await JenkinsAPI.getBuildLog(currentJob.value.name, buildNum);
      overviewLog.value = logData.log || "";
    }
  } catch {
    // 日志加载失败不报错
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

.stages-container {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  overflow-x: auto;
}

.stage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  position: relative;
  flex: 1;
}

.stage-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 8px;
}

.stage-success .stage-icon {
  background: #e1f3d8;
  color: #67c23a;
}

.stage-failed .stage-icon,
.stage-failure .stage-icon {
  background: #fde2e2;
  color: #f56c6c;
}

.stage-running .stage-icon {
  background: #ecf5ff;
  color: #409eff;
  animation: spin 1s linear infinite;
}

.stage-unknown .stage-icon {
  background: #f4f4f5;
  color: #909399;
}

.stage-info {
  text-align: center;
}

.stage-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.stage-duration {
  font-size: 12px;
  color: #909399;
}

.stage-connector {
  position: absolute;
  top: 18px;
  left: calc(50% + 18px);
  width: calc(100% - 36px);
  height: 2px;
  background: #e4e7ed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
