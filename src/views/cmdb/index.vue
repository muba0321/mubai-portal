<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item>
          <el-input
            v-model="queryParams.keywords"
            placeholder="快速搜索"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-select v-model="queryParams.cluster" placeholder="集群" clearable style="width: 120px">
            <el-option
              v-for="item in clusterOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 100px">
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-select v-model="queryParams.tenant" placeholder="租户" clearable style="width: 120px">
            <el-option
              v-for="item in tenantOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item class="search-buttons">
          <el-button type="primary" @click="handleQuery">
            <el-icon class="mr-1"><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleResetQuery">
            <el-icon class="mr-1"><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <el-button type="success" @click="handleCreateClick">
            <el-icon class="mr-1"><Plus /></el-icon>添加
          </el-button>
          <el-button type="primary">
            <el-icon class="mr-1"><Upload /></el-icon>导入
          </el-button>
          <el-button type="warning">
            <el-icon class="mr-1"><Download /></el-icon>导出
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="cmdbList"
        border
        stripe
        highlight-current-row
        class="table-section__content"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="集群" min-width="140">
          <template #default="scope">
            <el-tag :type="getClusterTagType(scope.row.cluster)" effect="light" round>
              {{ scope.row.cluster }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="外部 IP" prop="externalIp" min-width="130" />
        <el-table-column label="内部 IP" prop="internalIp" min-width="120" />
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="名称" prop="name" min-width="120">
          <template #default="scope">
            <el-tag effect="plain" size="small">{{ scope.row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="small">
              {{ scope.row.status === 1 ? "在线" : "离线" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="租户" prop="tenant" min-width="100" align="center">
          <template #default="scope">
            <span class="tenant-text">{{ scope.row.tenant }}</span>
          </template>
        </el-table-column>
        <el-table-column label="VCPUS" prop="vcpus" width="80" align="center" />
        <el-table-column label="内存(MB)" prop="memory" width="100" align="right" />
        <el-table-column label="硬盘" prop="disk" min-width="80" align="center" />
        <el-table-column label="访问 URL" prop="accessUrl" min-width="150">
          <template #default="scope">
            <el-link v-if="scope.row.accessUrl" type="primary" :href="scope.row.accessUrl" target="_blank">
              {{ scope.row.accessUrl }}
            </el-link>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="140" align="center">
          <template #default="scope">
            <div class="flex flex-row gap-2 justify-center">
              <el-button type="primary" size="small" circle @click="handleEditClick(scope.row)">
                <el-icon><EditPen /></el-icon>
              </el-button>
              <el-button type="danger" size="small" circle @click="handleDelete(scope.row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部操作栏 -->
      <div class="table-footer">
        <div class="table-footer__actions">
          <el-button type="success" size="small">
            <el-icon class="mr-1"><Plus /></el-icon>添加组件
          </el-button>
          <el-button type="warning" size="small" :disabled="!hasSelection">
            <el-icon class="mr-1"><EditPen /></el-icon>修改选中项
          </el-button>
          <el-button type="warning" size="small" :disabled="!hasSelection">
            <el-icon class="mr-1"><Edit /></el-icon>重命名选中项
          </el-button>
          <el-button type="danger" size="small" :disabled="!hasSelection">
            <el-icon class="mr-1"><Delete /></el-icon>删除选中项
          </el-button>
        </div>
        <pagination
          v-if="total > 0"
          v-model:total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="fetchList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" append-to-body>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="集群" prop="cluster">
          <el-select v-model="formData.cluster" placeholder="请选择集群" style="width: 100%">
            <el-option
              v-for="item in clusterOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="外部 IP" prop="externalIp">
          <el-input v-model="formData.externalIp" placeholder="请输入外部 IP" />
        </el-form-item>
        <el-form-item label="内部 IP" prop="internalIp">
          <el-input v-model="formData.internalIp" placeholder="请输入内部 IP" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="租户" prop="tenant">
          <el-select v-model="formData.tenant" placeholder="请选择租户" style="width: 100%">
            <el-option
              v-for="item in tenantOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="VCPUS" prop="vcpus">
          <el-input-number v-model="formData.vcpus" :min="1" :max="128" style="width: 100%" />
        </el-form-item>
        <el-form-item label="内存(MB)" prop="memory">
          <el-input-number v-model="formData.memory" :min="512" :max="262144" :step="1024" style="width: 100%" />
        </el-form-item>
        <el-form-item label="硬盘" prop="disk">
          <el-input v-model="formData.disk" placeholder="如 100GB" />
        </el-form-item>
        <el-form-item label="访问 URL" prop="accessUrl">
          <el-input v-model="formData.accessUrl" placeholder="https://" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" active-text="在线" inactive-text="离线" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Search, Refresh, Plus, Upload, Download, EditPen, Delete, Edit } from "@element-plus/icons-vue";
import { useTableSelection } from "@/composables";

defineOptions({ name: "CMDB" });

// 集群选项
const clusterOptions = [
  { label: "OpenClaw-Main", value: "OpenClaw-Main" },
  { label: "K8s-Production", value: "K8s-Production" },
  { label: "Infra-Cluster", value: "Infra-Cluster" },
  { label: "Dev-Cluster", value: "Dev-Cluster" },
];

// 租户选项
const tenantOptions = [
  { label: "OpenClaw", value: "OpenClaw" },
  { label: "Platform", value: "Platform" },
  { label: "Monitoring", value: "Monitoring" },
];

const queryFormRef = ref();
const formRef = ref();

const queryParams = reactive({
  keywords: "",
  cluster: "",
  status: "",
  tenant: "",
  pageNum: 1,
  pageSize: 10,
});

const cmdbList = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("添加虚拟机");

const initialFormData = {
  id: undefined,
  cluster: "",
  externalIp: "",
  internalIp: "",
  description: "",
  name: "",
  tenant: "OpenClaw",
  vcpus: 4,
  memory: 8192,
  disk: "100GB",
  accessUrl: "",
  status: 1,
};

const formData = reactive({ ...initialFormData });

const rules: any = {
  cluster: [{ required: true, message: "请选择集群", trigger: "change" }],
  externalIp: [{ required: true, message: "请输入外部 IP", trigger: "blur" }],
  internalIp: [{ required: true, message: "请输入内部 IP", trigger: "blur" }],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  tenant: [{ required: true, message: "请选择租户", trigger: "change" }],
};

// Mock data
const mockData = [
  { id: 1, cluster: "OpenClaw-Main", externalIp: "38.246.245.32", internalIp: "10.0.118.4", description: "OpenClaw 主节点 - 文档归档/Git 推送", name: "vm-web-01", status: 1, tenant: "OpenClaw", vcpus: 4, memory: 8192, disk: "100GB", accessUrl: "portal.mubai.top" },
  { id: 2, cluster: "K8s-Production", externalIp: "192.168.1.100", internalIp: "10.0.119.5", description: "K8s 生产集群 - master 节点", name: "k8s-master-01", status: 1, tenant: "OpenClaw", vcpus: 8, memory: 16384, disk: "200GB", accessUrl: "k8s.example.com" },
  { id: 3, cluster: "Infra-Cluster", externalIp: "10.0.1.50", internalIp: "10.0.1.51", description: "基础设施集群 - 监控/日志", name: "infra-node-01", status: 0, tenant: "OpenClaw", vcpus: 2, memory: 4096, disk: "50GB", accessUrl: "" },
  { id: 4, cluster: "OpenClaw-Main", externalIp: "38.246.245.33", internalIp: "10.0.118.5", description: "OpenClaw 从节点 - 计算任务", name: "vm-compute-01", status: 1, tenant: "OpenClaw", vcpus: 16, memory: 32768, disk: "500GB", accessUrl: "" },
  { id: 5, cluster: "Dev-Cluster", externalIp: "10.10.1.20", internalIp: "172.16.1.20", description: "开发测试环境", name: "dev-test-01", status: 1, tenant: "Platform", vcpus: 4, memory: 8192, disk: "100GB", accessUrl: "dev.mubai.top" },
  { id: 6, cluster: "K8s-Production", externalIp: "192.168.1.101", internalIp: "10.0.119.6", description: "K8s 生产集群 - worker 节点", name: "k8s-worker-01", status: 1, tenant: "OpenClaw", vcpus: 8, memory: 16384, disk: "500GB", accessUrl: "" },
  { id: 7, cluster: "Infra-Cluster", externalIp: "10.0.1.52", internalIp: "10.0.1.53", description: "Prometheus 监控节点", name: "prometheus-01", status: 1, tenant: "Monitoring", vcpus: 4, memory: 8192, disk: "200GB", accessUrl: "prometheus.mubai.top" },
  { id: 8, cluster: "Infra-Cluster", externalIp: "10.0.1.54", internalIp: "10.0.1.55", description: "Grafana 面板节点", name: "grafana-01", status: 1, tenant: "Monitoring", vcpus: 2, memory: 4096, disk: "50GB", accessUrl: "grafana.mubai.top" },
  { id: 9, cluster: "Dev-Cluster", externalIp: "10.10.1.21", internalIp: "172.16.1.21", description: "CI/CD Jenkins 节点", name: "jenkins-01", status: 1, tenant: "Platform", vcpus: 4, memory: 8192, disk: "100GB", accessUrl: "jenkins.mubai.top" },
  { id: 10, cluster: "OpenClaw-Main", externalIp: "38.246.245.34", internalIp: "10.0.118.6", description: "API 网关节点", name: "api-gateway-01", status: 1, tenant: "OpenClaw", vcpus: 4, memory: 8192, disk: "100GB", accessUrl: "api.mubai.top" },
  { id: 11, cluster: "K8s-Production", externalIp: "192.168.1.102", internalIp: "10.0.119.7", description: "K8s 生产集群 - worker 节点", name: "k8s-worker-02", status: 0, tenant: "OpenClaw", vcpus: 8, memory: 16384, disk: "500GB", accessUrl: "" },
  { id: 12, cluster: "Dev-Cluster", externalIp: "10.10.1.22", internalIp: "172.16.1.22", description: "GitLab 代码仓库", name: "gitlab-01", status: 1, tenant: "Platform", vcpus: 4, memory: 8192, disk: "500GB", accessUrl: "gitlab.mubai.top" },
];

function getClusterTagType(cluster: string): "success" | "warning" | "info" | "primary" | "danger" | "" {
  const map: Record<string, any> = {
    "OpenClaw-Main": "success",
    "K8s-Production": "warning",
    "Infra-Cluster": "primary",
    "Dev-Cluster": "info",
  };
  return map[cluster] || "";
}

async function fetchList() {
  loading.value = true;
  try {
    await new Promise((r) => setTimeout(r, 300));
    let data = [...mockData];
    if (queryParams.keywords) {
      const kw = queryParams.keywords.toLowerCase();
      data = data.filter((item) =>
        item.name.toLowerCase().includes(kw) ||
        item.cluster.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw) ||
        item.externalIp.includes(kw) ||
        item.internalIp.includes(kw)
      );
    }
    if (queryParams.cluster) data = data.filter((item) => item.cluster === queryParams.cluster);
    if (queryParams.status !== "") data = data.filter((item) => item.status === Number(queryParams.status));
    if (queryParams.tenant) data = data.filter((item) => item.tenant === queryParams.tenant);

    total.value = data.length;
    const start = (queryParams.pageNum - 1) * queryParams.pageSize;
    cmdbList.value = data.slice(start, start + queryParams.pageSize);
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  fetchList();
}

function handleResetQuery() {
  queryParams.keywords = "";
  queryParams.cluster = "";
  queryParams.status = "";
  queryParams.tenant = "";
  queryFormRef.value?.resetFields();
  handleQuery();
}

const { selectedIds, hasSelection, handleSelectionChange } = useTableSelection<any>();

function handleCreateClick() {
  dialogTitle.value = "添加虚拟机";
  Object.assign(formData, initialFormData);
  dialogVisible.value = true;
}

function handleEditClick(row: any) {
  dialogTitle.value = "编辑虚拟机";
  Object.assign(formData, { ...row });
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().then(() => true, () => false);
  if (!valid) return;
  ElMessage.success(formData.id ? "修改成功" : "添加成功");
  dialogVisible.value = false;
  fetchList();
}

function handleDelete(row: any) {
  ElMessageBox.confirm(`确认删除「${row.name}」？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    ElMessage.success("删除成功");
    fetchList();
  }).catch(() => {});
}

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.filter-section {
  padding: 16px 16px 0;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.search-buttons {
  margin-left: auto;
}

.text-gray {
  color: var(--el-text-color-placeholder);
}

.tenant-text {
  color: var(--el-color-primary);
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 0;
  margin-top: 16px;

  &__actions {
    display: flex;
    gap: 8px;
  }
}
</style>
