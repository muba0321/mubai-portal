<template>
  <div class="grafana-container">
    <div class="page-header">
      <div class="page-title">
        <el-icon :size="20"><DataBoard /></el-icon>
        <span>Grafana 面板管理</span>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="small" @click="handleCreate">
          <el-icon><Plus /></el-icon>新建面板
        </el-button>
        <el-button size="small" @click="fetchFolders">
          <el-icon><FolderOpened /></el-icon>刷新
        </el-button>
        <el-tag type="info" size="small" effect="plain">
          <el-icon><Link /></el-icon>
          Grafana URL: {{ grafanaUrl }}
        </el-tag>
      </div>
    </div>

    <!-- 仪表盘选择 -->
    <el-card shadow="never" class="dash-select-card">
      <template #header>
        <div class="card-header">
          <el-icon><Monitor /></el-icon>
          <span>当前仪表盘</span>
        </div>
      </template>
      <el-select v-model="selectedDashUid" placeholder="选择要编辑的仪表盘" style="width: 100%" @change="onDashChange" size="default">
        <el-option v-for="d in dashboards" :key="d.uid" :label="d.title" :value="d.uid">
          <div class="dash-option">
            <span class="dash-title">{{ d.title }}</span>
            <el-tag v-for="tag in d.tags?.slice(0, 2)" :key="tag" size="small" class="ml-1">{{ tag }}</el-tag>
          </div>
        </el-option>
      </el-select>
    </el-card>

    <!-- AI 辅助面板 -->
    <el-card shadow="never" class="ai-card" v-if="selectedDashUid">
      <template #header>
        <div class="card-header">
          <el-icon><MagicStick /></el-icon>
          <span>AI 辅助创建/修改面板</span>
          <el-tag type="warning" size="small" effect="plain">用自然语言描述即可生成面板</el-tag>
        </div>
      </template>
      <el-form :inline="true" size="default">
        <el-form-item label="操作">
          <el-select v-model="aiForm.operation" style="width: 120px" @change="onAiOperationChange">
            <el-option label="新增" value="add" />
            <el-option label="修改" value="modify" />
            <el-option label="删除" value="delete" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="aiForm.operation !== 'add'" label="目标面板">
          <el-select v-model="aiForm.panelId" placeholder="选择面板" style="width: 200px" clearable>
            <el-option v-for="p in currentPanels" :key="p.id" :label="p.title" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" class="ai-desc-item">
          <el-input v-model="aiForm.description" placeholder="描述您想要的面板，如：添加一个CPU使用率折线图" style="width: 400px" clearable @keyup.enter="handleAiGenerate" :disabled="aiTaskRunning">
            <template #append>
              <el-button @click="handleAiGenerate" :loading="aiLoading" :disabled="aiTaskRunning" :icon="MagicStick">
                {{ aiTaskRunning ? '生成中...' : 'AI 生成' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <el-divider style="margin: 8px 0 12px" />
      <div class="quick-templates">
        <span class="label">快捷模板：</span>
        <el-button v-for="t in quickTemplates" :key="t.label" size="small" plain @click="aiForm.description = t.desc" :disabled="aiTaskRunning">
          {{ t.label }}
        </el-button>
      </div>

      <!-- 任务进度面板 -->
      <div v-if="aiTaskRunning || aiTaskResult" class="task-panel" :class="{ 'task-done': aiTaskStatus === 'done' || aiTaskStatus === 'error' }">
        <div class="task-header">
          <span class="task-title">
            <el-icon v-if="aiTaskStatus === 'running'" class="spin"><Loading /></el-icon>
            <el-icon v-else-if="aiTaskStatus === 'done'" color="#67c23a"><CircleCheckFilled /></el-icon>
            <el-icon v-else-if="aiTaskStatus === 'error'" color="#f56c6c"><CircleCloseFilled /></el-icon>
            任务进度
          </span>
          <el-tag v-if="aiTaskStatus === 'running'" type="warning" size="small" effect="plain">执行中</el-tag>
          <el-tag v-else-if="aiTaskStatus === 'done'" type="success" size="small" effect="plain">已完成</el-tag>
          <el-tag v-else-if="aiTaskStatus === 'error'" type="danger" size="small" effect="plain">失败</el-tag>
        </div>
        <div class="task-steps">
          <div v-for="s in aiSteps" :key="s.id" class="task-step" :class="s.status">
            <div class="step-icon">
              <template v-if="s.status === 'done'">
                <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
              </template>
              <template v-else-if="s.status === 'running'">
                <el-icon color="#409eff" class="spin"><Loading /></el-icon>
              </template>
              <template v-else-if="s.status === 'error'">
                <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
              </template>
              <template v-else-if="s.status === 'warning'">
                <el-icon color="#e6a23c"><WarningFilled /></el-icon>
              </template>
              <template v-else>
                <span class="step-num">{{ s.index + 1 }}</span>
              </template>
            </div>
            <div class="step-info">
              <div class="step-name">
                <span v-if="s.icon" class="step-emoji">{{ s.icon }}</span>
                {{ s.name }}
              </div>
              <div v-if="s.message" class="step-message">{{ s.message }}</div>
            </div>
          </div>
        </div>
        <!-- 任务完成后的操作 -->
        <div v-if="aiTaskResult" class="task-actions">
          <el-button type="primary" size="small" @click="aiPreviewVisible = true">
            <el-icon><View /></el-icon>查看结果
          </el-button>
          <el-button size="small" @click="resetAiTask">
            <el-icon><Refresh /></el-icon>重新开始
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据源信息 -->
    <el-card shadow="never" class="info-card">
      <template #header>
        <div class="card-header">
          <el-icon><Cpu /></el-icon>
          <span>数据源</span>
        </div>
      </template>
      <el-table :data="datasources" size="small" stripe>
        <el-table-column label="名称" prop="name" width="150" />
        <el-table-column label="类型" prop="type" width="120" />
        <el-table-column label="URL" prop="url" show-overflow-tooltip />
        <el-table-column label="默认" prop="isDefault" width="60" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success" size="small">是</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 面板列表 -->
    <el-card shadow="never" class="dashboards-card">
      <template #header>
        <div class="card-header">
          <el-icon><Monitor /></el-icon>
          <span>面板列表</span>
          <el-tag type="info" size="small" effect="plain" class="count-badge">
            共 {{ dashboards.length }} 个
          </el-tag>
        </div>
      </template>

      <el-table :data="dashboards" v-loading="loading" size="small" stripe>
        <el-table-column label="标题" prop="title" min-width="200">
          <template #default="{ row }">
            <el-link :href="grafanaUrl + row.url" target="_blank" type="primary" :underline="false">
              {{ row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="文件夹" prop="folderTitle" width="120" />
        <el-table-column label="UID" prop="uid" width="150" />
        <el-table-column label="标签" width="150">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag" size="small" class="mr-1">{{ tag }}</el-tag>
            <span v-if="!row.tags?.length" class="text-muted">无</span>
          </template>
        </el-table-column>
        <el-table-column label="收藏" width="60" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.isStarred" :size="16" color="#e6a23c"><StarFilled /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 文件夹列表 -->
    <el-card shadow="never" class="folders-card">
      <template #header>
        <div class="card-header">
          <el-icon><FolderOpened /></el-icon>
          <span>文件夹</span>
          <el-button type="primary" link size="small" @click="showCreateFolder = true">
            <el-icon><Plus /></el-icon>新建
          </el-button>
        </div>
      </template>
      <el-table :data="folders" size="small" stripe>
        <el-table-column label="名称" prop="title" />
        <el-table-column label="UID" prop="uid" width="200" />
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleDeleteFolder(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑面板弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新建面板' : '编辑面板'" width="800px" top="5vh">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="面板 UID">
          <el-input v-model="editForm.uid" placeholder="自动生成或手动输入" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="editForm.title" placeholder="面板标题" />
        </el-form-item>
        <el-form-item label="文件夹">
          <el-select v-model="editForm.folderId" placeholder="选择文件夹" clearable style="width: 100%">
            <el-option v-for="f in folders" :key="f.id" :label="f.title" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editForm.tagsStr" placeholder="逗号分隔，如：监控,linux" />
        </el-form-item>
        <el-form-item label="JSON 模型">
          <el-input v-model="editForm.modelJson" type="textarea" :rows="20" placeholder="粘贴 Grafana 面板 JSON 模型" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 新建文件夹弹窗 -->
    <el-dialog v-model="showCreateFolder" title="新建文件夹" width="400px">
      <el-form :model="folderForm" label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="folderForm.title" placeholder="文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateFolder = false">取 消</el-button>
        <el-button type="primary" @click="handleCreateFolder">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 面板详情弹窗 -->
    <el-dialog v-model="detailVisible" title="面板详情" width="900px" top="5vh">
      <div v-if="dashboardDetail" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="标题">{{ dashboardDetail.dashboard?.title }}</el-descriptions-item>
          <el-descriptions-item label="UID">{{ dashboardDetail.dashboard?.uid }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ dashboardDetail.meta?.created }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ dashboardDetail.meta?.updated }}</el-descriptions-item>
          <el-descriptions-item label="创建者">{{ dashboardDetail.meta?.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="更新者">{{ dashboardDetail.meta?.updatedBy }}</el-descriptions-item>
        </el-descriptions>
        <div class="model-json">
          <div class="json-header">
            <span>Dashboard JSON Model</span>
            <el-button type="primary" link size="small" @click="copyModel">复制</el-button>
          </div>
          <pre class="json-body">{{ JSON.stringify(dashboardDetail.dashboard, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>

    <!-- AI 生成结果预览弹窗 -->
    <el-dialog v-model="aiPreviewVisible" title="AI 生成结果" width="900px" top="5vh">
      <el-alert v-if="aiTaskResult" :title="aiTaskResult.explanation" type="success" :closable="false" show-icon style="margin-bottom: 16px" />
      <el-alert v-if="saveProvisionedError" title="保存失败" type="warning" :closable="false" show-icon style="margin-bottom: 16px">
        该仪表盘为 Grafana 预配置（provisioned），无法通过 API 修改。请切换到「导入指引」标签页，按步骤手动导入。
      </el-alert>
      <el-tabs v-model="aiTab" type="border-card">
        <el-tab-pane label="面板 JSON" name="json">
          <div class="json-header">
            <span>生成的面板配置</span>
            <el-button type="primary" link size="small" @click="copyAiResult">复制</el-button>
          </div>
          <pre class="json-body">{{ aiTaskResultJson }}</pre>
        </el-tab-pane>
        <el-tab-pane label="变更说明" name="diff">
          <div v-if="aiTaskResult" class="diff-content">
            <p><strong>操作类型：</strong>{{ operationLabels[aiTaskResult.operation] || aiTaskResult.operation }}</p>
            <p><strong>变更说明：</strong>{{ aiTaskResult.explanation }}</p>
            <p><strong>提示：</strong>确认后将{{ aiTaskResult.operation === 'add' ? '新增到当前仪表盘' : aiTaskResult.operation === 'modify' ? '替换原面板' : '从仪表盘移除' }}，点击底部保存按钮提交。</p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="导入指引" name="guide">
          <div class="import-guide">
            <el-steps :active="importGuideStep" finish-status="success" align-center simple style="margin-bottom: 20px">
              <el-step title="复制 JSON" />
              <el-step title="打开 Import" />
              <el-step title="粘贴导入" />
            </el-steps>

            <div class="guide-step-content" v-if="importGuideStep === 1">
              <h4>第一步：复制 JSON</h4>
              <p>点击下方按钮复制生成的 JSON 配置：</p>
              <el-button type="primary" size="default" @click="copyAiResult">
                <el-icon><DocumentCopy /></el-icon>复制 JSON
              </el-button>
              <el-alert type="info" :closable="false" show-icon style="margin-top: 16px">
                复制的内容为完整的 Dashboard JSON，可直接粘贴到 Grafana Import 页面。
              </el-alert>
            </div>

            <div class="guide-step-content" v-if="importGuideStep === 2">
              <h4>第二步：打开 Import Dashboard</h4>
              <p><strong>方式一：</strong>点击顶部导航栏的 <code>+</code> 号，选择 <code>Import</code></p>
              <p><strong>方式二：</strong></p>
              <a :href="grafanaUrl + '/dashboard/import'" target="_blank" class="guide-link">
                <el-icon><Link /></el-icon>直接打开 Import 页面 →
              </a>
            </div>

            <div class="guide-step-content" v-if="importGuideStep === 3">
              <h4>第三步：粘贴 JSON 并导入</h4>
              <p>在 Import 页面的文本框中粘贴 JSON，然后点击 <code>Load</code>，填写 Name、Folder、UID 后点击 <code>Import</code>。</p>
              <ol>
                <li>在文本框中按 <code>Ctrl+V</code> 粘贴已复制的 JSON</li>
                <li>点击 <code>Load</code> 按钮加载</li>
                <li>确认 Name、Folder，点击 <code>Import</code> 完成</li>
              </ol>
              <el-alert type="success" :closable="false" show-icon style="margin-top: 12px">
                导入成功后会自动跳转到仪表盘页面，可以看到生成的图表了。
              </el-alert>
            </div>

            <div class="guide-nav">
              <el-button size="small" :disabled="importGuideStep <= 1" @click="importGuideStep--">上一步</el-button>
              <el-button v-if="importGuideStep < 3" type="primary" size="small" @click="importGuideStep++">下一步</el-button>
              <el-button v-else type="success" size="small" @click="copyAiResult">
                <el-icon><DocumentCopy /></el-icon>重新开始（复制 JSON）
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="aiPreviewVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleAiSave" :loading="aiSaving">
          <el-icon><Check /></el-icon>确认保存到 Grafana
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { DataBoard, Plus, FolderOpened, Monitor, Cpu, Link, StarFilled, MagicStick, Check, Loading, CircleCheckFilled, CircleCloseFilled, WarningFilled, View, Refresh, DocumentCopy, Warning } from "@element-plus/icons-vue";
import GrafanaAPI, { type DashboardItem, type DashboardDetail } from "@/api/grafana";

defineOptions({ name: "GrafanaManage" });

const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || "https://grafana.mubai.top";

const dashboards = ref<DashboardItem[]>([]);
const datasources = ref<any[]>([]);
const folders = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);

const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const detailVisible = ref(false);
const dashboardDetail = ref<DashboardDetail | null>(null);

const showCreateFolder = ref(false);
const folderForm = reactive({ title: "" });

const editForm = reactive({
  uid: "",
  title: "",
  folderId: null as number | null,
  tagsStr: "",
  modelJson: "",
});

async function fetchData() {
  loading.value = true;
  try {
    const [dList, dSources, fList] = await Promise.all([
      GrafanaAPI.getDashboards(),
      GrafanaAPI.getDatasources(),
      GrafanaAPI.getFolders(),
    ]);
    dashboards.value = dList || [];
    datasources.value = dSources || [];
    folders.value = fList || [];
  } finally {
    loading.value = false;
  }
}

function fetchFolders() {
  fetchData();
}

function handleCreate() {
  dialogMode.value = "create";
  Object.assign(editForm, { uid: "", title: "", folderId: null, tagsStr: "", modelJson: "" });
  dialogVisible.value = true;
}

function handleView(row: DashboardItem) {
  GrafanaAPI.getDashboard(row.uid).then((data) => {
    dashboardDetail.value = data;
    detailVisible.value = true;
  });
}

function handleEdit(row: DashboardItem) {
  dialogMode.value = "edit";
  GrafanaAPI.getDashboard(row.uid).then((data) => {
    const dashboard = data.dashboard || {};
    Object.assign(editForm, {
      uid: dashboard.uid || "",
      title: dashboard.title || "",
      folderId: data.meta ? null : null,
      tagsStr: (dashboard.tags || []).join(", "),
      modelJson: JSON.stringify(dashboard, null, 2),
    });
    dialogVisible.value = true;
  });
}

function handleDelete(row: DashboardItem) {
  ElMessageBox.confirm(`确认删除面板「${row.title}」？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      await GrafanaAPI.deleteDashboard(row.uid);
      ElMessage.success("删除成功");
      fetchData();
    } catch {
      // 错误已在拦截器处理
    }
  }).catch(() => {});
}

async function handleSubmit() {
  if (!editForm.title) {
    ElMessage.warning("请输入面板标题");
    return;
  }
  submitting.value = true;
  try {
    let model;
    try {
      model = editForm.modelJson ? JSON.parse(editForm.modelJson) : { title: editForm.title, uid: editForm.uid };
    } catch {
      ElMessage.error("JSON 模型格式错误");
      return;
    }
    const payload = {
      dashboard: model,
      ...(editForm.folderId ? { folderId: editForm.folderId } : {}),
      overwrite: true,
    };
    if (dialogMode.value === "create") {
      await GrafanaAPI.createDashboard(payload);
      ElMessage.success("创建成功");
    } else {
      await GrafanaAPI.updateDashboard(payload);
      ElMessage.success("更新成功");
    }
    dialogVisible.value = false;
    fetchData();
  } finally {
    submitting.value = false;
  }
}

function handleDeleteFolder(row: any) {
  ElMessageBox.confirm(`确认删除文件夹「${row.title}」？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      await GrafanaAPI.deleteFolder(row.id);
      ElMessage.success("删除成功");
      fetchData();
    } catch {
      // 错误已在拦截器处理
    }
  }).catch(() => {});
}

async function handleCreateFolder() {
  if (!folderForm.title) {
    ElMessage.warning("请输入文件夹名称");
    return;
  }
  try {
    await GrafanaAPI.createFolder({ title: folderForm.title });
    ElMessage.success("创建成功");
    showCreateFolder.value = false;
    folderForm.title = "";
    fetchData();
  } catch {
    // 错误已在拦截器处理
  }
}

function copyModel() {
  if (dashboardDetail.value) {
    navigator.clipboard.writeText(JSON.stringify(dashboardDetail.value.dashboard, null, 2));
    ElMessage.success("已复制到剪贴板");
  }
}

// ==================== AI 辅助相关 ====================

const selectedDashUid = ref("");
const aiForm = reactive({
  operation: "add" as "add" | "modify" | "delete",
  panelId: null as number | null,
  description: "",
});
const aiLoading = ref(false);
const aiSaving = ref(false);
const aiPreviewVisible = ref(false);
const aiTab = ref("json");
const aiTaskResult = ref<any>(null);
const aiTaskResultJson = computed(() => aiTaskResult.value ? JSON.stringify(aiTaskResult.value.panelJson, null, 2) : "");

const operationLabels: Record<string, string> = { add: "新增", modify: "修改", delete: "删除" };

const quickTemplates = [
  { label: "CPU 使用率", desc: "添加一个CPU使用率折线图，显示最近6小时趋势，带70%/90%告警阈值" },
  { label: "内存使用", desc: "添加一个内存使用率仪表盘，显示当前内存使用百分比" },
  { label: "磁盘空间", desc: "添加一个磁盘使用统计面板，显示根分区使用率" },
  { label: "网络流量", desc: "添加一个网络流量折线图，显示最近1小时接收和发送流量" },
  { label: "系统负载", desc: "添加一个系统负载折线图，显示1分钟/5分钟/15分钟负载趋势" },
  { label: "TCP 连接", desc: "添加一个TCP当前连接数统计面板" },
];

const currentPanels = ref<{ id: number; title: string; type: string }[]>([]);

const aiTaskRunning = ref(false);
const aiTaskStatus = ref<"idle" | "running" | "done" | "error">("idle");
const aiTaskId = ref("");
const aiSteps = ref<any[]>([]);

const SUB_TASKS = [
  { id: "parse", name: "解析需求", icon: "📋" },
  { id: "fetch_dashboard", name: "获取仪表盘信息", icon: "" },
  { id: "fetch_metrics", name: "获取可用指标", icon: "" },
  { id: "ai_generate", name: "AI 生成面板配置", icon: "🤖" },
  { id: "validate", name: "验证结果", icon: "✅" },
  { id: "done", name: "完成", icon: "🎉" },
];

const saveProvisionedError = ref(false);
const importGuideStep = ref(1);

async function onDashChange() {
  aiForm.description = "";
  aiForm.panelId = null;
  resetAiTask();
  currentPanels.value = [];
  if (selectedDashUid.value) {
    try {
      const data = await GrafanaAPI.getDashboard(selectedDashUid.value);
      const panels = data.dashboard?.panels || [];
      currentPanels.value = panels
        .filter((p: any) => p.type !== "row")
        .map((p: any) => ({ id: p.id, title: p.title, type: p.type }));
    } catch {
      // ignore
    }
  }
}

function onAiOperationChange() {
  if (aiForm.operation === "add") {
    aiForm.panelId = null;
  }
}

function resetAiTask() {
  aiTaskRunning.value = false;
  aiTaskStatus.value = "idle";
  aiTaskId.value = "";
  aiTaskResult.value = null;
  saveProvisionedError.value = false;
  aiSteps.value = SUB_TASKS.map((s, i) => ({ ...s, index: i, status: "pending", message: "", icon: s.icon, name: s.name }));
  stopProgressTimer();
}

function initAiSteps() {
  aiSteps.value = SUB_TASKS.map((s, i) => ({ ...s, index: i, status: "pending", message: "", icon: s.icon, name: s.name }));
}

function copyAiResult() {
  if (aiTaskResult.value?.panelJson) {
    navigator.clipboard.writeText(JSON.stringify(aiTaskResult.value.panelJson, null, 2));
    ElMessage.success("已复制到剪贴板");
  }
}

// 模拟进度动画
let aiProgressTimer: ReturnType<typeof setInterval> | null = null;
const progressPhases = [
  { phase: "parse", delay: 500 },
  { phase: "fetch_dashboard", delay: 1000 },
  { phase: "fetch_metrics", delay: 2000 },
  { phase: "ai_generate", delay: 5000 },
];

function simulateProgress() {
  stopProgressTimer();
  let elapsed = 0;
  aiProgressTimer = setInterval(() => {
    elapsed += 1000;
    for (const p of progressPhases) {
      if (elapsed >= p.delay) {
        const step = aiSteps.value.find((s: any) => s.id === p.phase);
        if (step && step.status === "pending") {
          step.status = "running";
          if (p.phase === "parse") step.message = "已识别操作: add";
          else if (p.phase === "fetch_dashboard") step.message = "已获取仪表盘元数据";
          else if (p.phase === "fetch_metrics") step.message = "正在查询 Prometheus 可用指标...";
          else if (p.phase === "ai_generate") step.message = "正在调用 AI 生成面板配置...";
        }
      }
    }
  }, 1000);
}

function markAllStepsDone() {
  for (const step of aiSteps.value) {
    step.status = "done";
    step.message = "";
  }
}

function stopProgressTimer() {
  if (aiProgressTimer) { clearInterval(aiProgressTimer); aiProgressTimer = null; }
}

async function handleAiGenerate() {
  if (aiTaskRunning.value) return;
  if (!aiForm.description) {
    ElMessage.warning("请输入描述");
    return;
  }
  if (aiForm.operation !== "add" && !aiForm.panelId) {
    ElMessage.warning("请选择目标面板");
    return;
  }
  if (!selectedDashUid.value) {
    ElMessage.warning("请先选择一个仪表盘");
    return;
  }

  resetAiTask();
  aiTaskRunning.value = true;
  aiLoading.value = true;

  initAiSteps();
  simulateProgress();

  try {
    const resp = await GrafanaAPI.nlToPanel({
      dashboard_uid: selectedDashUid.value,
      panel_id: aiForm.panelId || undefined,
      description: aiForm.description,
      operation: aiForm.operation,
    });

    markAllStepsDone();

    aiTaskStatus.value = "done";
    aiTaskResult.value = resp;
  } catch {
    aiTaskStatus.value = "error";
    ElMessage.error("AI 生成失败，请重试");
  } finally {
    aiTaskRunning.value = false;
    aiLoading.value = false;
    stopProgressTimer();
  }
}

async function handleAiSave() {
  if (!aiTaskResult.value || !selectedDashUid.value) return;

  aiSaving.value = true;
  try {
    const panelJson = aiTaskResult.value.panelJson;
    const operation = aiTaskResult.value.operation;

    if (operation === "delete") {
      const pid = aiForm.panelId;
      if (pid) {
        await GrafanaAPI.deleteDashboard(selectedDashUid.value);
        ElMessage.success("删除成功");
      }
    } else {
      const dashResp = await GrafanaAPI.getDashboard(selectedDashUid.value);
      const dashboard = dashResp.dashboard || {};
      const panels = dashboard.panels || [];

      if (operation === "add") {
        const maxY = panels.reduce((max: number, p: any) => {
          const py = (p.gridPos?.y || 0) + (p.gridPos?.h || 0);
          return Math.max(max, py);
        }, 0);
        const newPanel = { ...panelJson };
        if (!newPanel.gridPos) {
          newPanel.gridPos = { h: 8, w: 12, x: 0, y: maxY };
        } else {
          newPanel.gridPos.y = maxY;
        }
        const maxId = panels.reduce((max: number, p: any) => Math.max(max, p.id || 0), 0);
        newPanel.id = maxId + 1;
        panels.push(newPanel);
      } else if (operation === "modify") {
        const idx = panels.findIndex((p: any) => p.id === aiForm.panelId);
        if (idx >= 0) {
          panels[idx] = { ...panelJson, id: aiForm.panelId };
        }
      }

      dashboard.panels = panels;
      await GrafanaAPI.updateDashboard({ dashboard, overwrite: true });
      ElMessage.success(`${operation === "add" ? "新增" : "修改"}成功`);
    }

    aiPreviewVisible.value = false;
    aiForm.description = "";
    saveProvisionedError.value = false;
    resetAiTask();
    fetchData();
  } catch (e: any) {
    const errMsg = e?.message || e?.response?.data?.message || "";
    if (errMsg.includes("provisioned")) {
      saveProvisionedError.value = true;
      aiTab.value = "guide";
      importGuideStep.value = 1;
      ElMessage.warning("该仪表盘无法通过 API 直接保存，已自动切换到「导入指引」，请按步骤手动导入");
    } else {
      ElMessage.error(`保存失败: ${errMsg || "未知错误"}`);
    }
  } finally {
    aiSaving.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.grafana-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
}
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
  .page-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; }
  .page-actions { display: flex; align-items: center; gap: 8px; }
}
.info-card { margin-bottom: 16px; }
.dashboards-card { margin-bottom: 16px; }
.folders-card { margin-bottom: 16px; }
.card-header { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.count-badge { margin-left: auto; }
.mr-1 { margin-right: 4px; }
.text-muted { color: #909399; }
.detail-content { max-height: 70vh; overflow-y: auto; }
.model-json {
  margin-top: 16px; border: 1px solid #ebeef5; border-radius: 6px; overflow: hidden;
  .json-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; background: #f5f7fa; font-size: 13px; font-weight: 500;
  }
  .json-body {
    padding: 12px; font-size: 12px; line-height: 1.6; max-height: 400px;
    overflow-y: auto; background: #fafafa; margin: 0; color: #303133;
  }
}
.diff-content p { margin: 8px 0; line-height: 1.8; }

/* AI 相关样式 */
.dash-select-card { margin-bottom: 16px; }
.dash-option { display: flex; align-items: center; }
.dash-title { flex: 1; }
.ml-1 { margin-left: 4px; }
.ai-card { margin-bottom: 16px; border: 1px solid #d9ecff; }
.ai-card :deep(.el-card__header) { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
.ai-desc-item { flex: 1; }
.ai-desc-item :deep(.el-input__wrapper) { min-width: 400px; }
.quick-templates { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.quick-templates .label { font-size: 13px; color: #909399; white-space: nowrap; }
.task-panel { margin-top: 12px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
.task-panel.task-done { background: #f0f9ff; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.task-title { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; }
.task-steps { display: flex; flex-direction: column; gap: 8px; }
.task-step { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; background: #fff; border-radius: 6px; transition: all 0.3s; }
.task-step.running { border-left: 3px solid #409eff; background: #ecf5ff; }
.task-step.done { border-left: 3px solid #67c23a; }
.task-step.error { border-left: 3px solid #f56c6c; }
.task-step.warning { border-left: 3px solid #e6a23c; }
.step-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.step-num { width: 20px; height: 20px; border-radius: 50%; background: #e4e7ed; color: #909399; font-size: 11px; display: flex; align-items: center; justify-content: center; }
.step-info { flex: 1; }
.step-name { font-size: 13px; font-weight: 500; color: #303133; display: flex; align-items: center; gap: 4px; }
.step-emoji { font-size: 14px; }
.step-message { font-size: 12px; color: #909399; margin-top: 2px; }
.task-actions { margin-top: 12px; display: flex; gap: 8px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* 导入指引 */
.import-guide { padding: 8px 0; }
.guide-step-content { padding: 16px 0; }
.guide-step-content h4 { margin: 0 0 12px; color: #303133; font-size: 15px; }
.guide-step-content p { margin: 8px 0; color: #606266; line-height: 1.8; }
.guide-step-content code { background: #f5f7fa; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #e6a23c; }
.guide-step-content ol { padding-left: 20px; margin: 12px 0; }
.guide-step-content li { margin: 6px 0; color: #606266; line-height: 1.8; }
.guide-screenshot { margin: 12px 0; }
.guide-screenshot .ascii-art {
  background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px; line-height: 1.4; overflow-x: auto; margin: 0;
  border: 1px solid #333;
}
.guide-tip {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px;
  background: #fef7e6; border-radius: 6px; margin-top: 12px; font-size: 13px; color: #e6a23c;
}
.guide-nav { display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #ebeef5; margin-top: 16px; }
.guide-link { display: inline-flex; align-items: center; gap: 4px; color: #409eff; text-decoration: none; font-size: 14px; margin-top: 8px; }
.guide-link:hover { color: #66b1ff; }
</style>
