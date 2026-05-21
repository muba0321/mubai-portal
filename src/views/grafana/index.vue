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
  </div>
</template>

<script setup lang="ts">
import { DataBoard, Plus, FolderOpened, Monitor, Cpu, Link, StarFilled } from "@element-plus/icons-vue";
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
</style>
