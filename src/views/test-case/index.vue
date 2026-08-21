<template>
  <div class="test-case-container">
    <!-- 视图切换 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-radio-group v-model="currentView" size="large">
        <el-radio-button value="list">
          <el-icon><List /></el-icon> 列表
        </el-radio-button>
        <el-radio-button value="kanban">
          <el-icon><Grid /></el-icon> 看板
        </el-radio-button>
        <el-radio-button value="stats">
          <el-icon><DataAnalysis /></el-icon> 统计
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 列表视图 -->
    <div v-if="currentView === 'list'" class="view-content">
      <el-card shadow="never">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span>测试用例</span>
            <el-button type="primary" @click="openEditDialog()">
              <el-icon><Plus /></el-icon> 新建用例
            </el-button>
          </div>
        </template>

        <!-- 筛选栏 -->
        <div style="margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap">
          <el-select v-model="filterProjectId" placeholder="选择项目" clearable style="width: 180px" @change="loadCases">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="filterType" placeholder="测试类型" clearable style="width: 140px" @change="loadCases">
            <el-option label="API 测试" value="api" />
            <el-option label="手工测试" value="manual" />
          </el-select>
          <el-select v-model="filterPriority" placeholder="优先级" clearable style="width: 120px" @change="loadCases">
            <el-option label="P0 紧急" value="P0" />
            <el-option label="P1 高" value="P1" />
            <el-option label="P2 中" value="P2" />
            <el-option label="P3 低" value="P3" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px" @change="loadCases">
            <el-option label="草稿" value="draft" />
            <el-option label="活跃" value="active" />
            <el-option label="已归档" value="archived" />
          </el-select>
          <el-input v-model="filterKeyword" placeholder="关键词搜索" clearable style="width: 200px" @input="loadCases" />
        </div>

        <el-table :data="cases" v-loading="loading" stripe border>
          <el-table-column prop="title" label="用例标题" min-width="200">
            <template #default="{ row }">
              <span style="font-weight: 600">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.testType === 'api' ? 'primary' : 'success'" size="small">
                {{ row.testType === 'api' ? 'API' : '手工' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="priorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="关联需求" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.reqCount || 0 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最近执行" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.lastResult" :type="row.lastResult === 'pass' ? 'success' : 'danger'" size="small">
                {{ row.lastResult === 'pass' ? '通过' : '失败' }}
              </el-tag>
              <span v-else style="color: #909399">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openExecuteDialog(row)">执行</el-button>
              <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 看板视图 -->
    <div v-else-if="currentView === 'kanban'" class="view-content">
      <KanbanView :cases="cases" :projects="projects" @refresh="loadCases" @edit="openEditDialog" @execute="openExecuteDialog" />
    </div>

    <!-- 统计视图 -->
    <div v-else-if="currentView === 'stats'" class="view-content">
      <StatisticsView :stats="stats" :loading="statsLoading" />
    </div>

    <!-- 用例编辑对话框 -->
    <TestCaseEdit
      v-model="editVisible"
      :case-id="selectedCaseId"
      :projects="projects"
      :requirements="requirements"
      @saved="loadCases"
    />

    <!-- 执行对话框 -->
    <TestExecute
      v-model="executeVisible"
      :case-id="selectedCaseId"
      @done="loadCases"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { List, Grid, DataAnalysis, Plus } from "@element-plus/icons-vue";
import { TestCaseAPI, type TestCase } from "@/api/test-case";
import { RequirementAPI, type Project, type Requirement } from "@/api/requirement";
import { ElMessage, ElMessageBox } from "element-plus";
import KanbanView from "./components/KanbanView.vue";
import StatisticsView from "./components/StatisticsView.vue";
import TestCaseEdit from "./components/TestCaseEdit.vue";
import TestExecute from "./components/TestExecute.vue";

const currentView = ref("list");
const cases = ref<TestCase[]>([]);
const loading = ref(false);
const projects = ref<Project[]>([]);
const requirements = ref<Requirement[]>([]);
const stats = ref<any>({});
const statsLoading = ref(false);

// 筛选
const filterProjectId = ref<number>();
const filterType = ref<string>();
const filterPriority = ref<string>();
const filterStatus = ref<string>();
const filterKeyword = ref("");

// 对话框
const editVisible = ref(false);
const executeVisible = ref(false);
const selectedCaseId = ref<number>();

function priorityType(p: string) {
  const map: Record<string, "danger" | "warning" | "primary" | "info"> = {
    P0: "danger", P1: "warning", P2: "primary", P3: "info",
  };
  return map[p] || "info";
}

function statusType(s: string) {
  const map: Record<string, "info" | "success" | "warning"> = {
    draft: "info", active: "success", archived: "warning",
  };
  return map[s] || "info";
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    draft: "草稿", active: "活跃", archived: "已归档",
  };
  return map[s] || s;
}

async function loadProjects() {
  try {
    projects.value = await RequirementAPI.getProjects();
  } catch {}
}

async function loadRequirements() {
  try {
    requirements.value = await RequirementAPI.getRequirements();
  } catch {}
}

async function loadCases() {
  loading.value = true;
  try {
    const data = await TestCaseAPI.getList({
      projectId: filterProjectId.value,
      type: filterType.value,
      priority: filterPriority.value,
      status: filterStatus.value,
      keyword: filterKeyword.value,
    });
    cases.value = data || [];
  } catch {
    ElMessage.error("加载用例失败");
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  statsLoading.value = true;
  try {
    stats.value = await TestCaseAPI.getStats(filterProjectId.value);
  } catch {} finally {
    statsLoading.value = false;
  }
}

function openEditDialog(caseItem?: TestCase) {
  selectedCaseId.value = caseItem?.id;
  editVisible.value = true;
}

function openExecuteDialog(caseItem: TestCase) {
  selectedCaseId.value = caseItem.id;
  executeVisible.value = true;
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm("确定要删除这个用例吗？", "警告", { type: "warning" });
    await TestCaseAPI.delete(id);
    ElMessage.success("删除成功");
    loadCases();
  } catch {}
}

onMounted(() => {
  loadProjects();
  loadRequirements();
  loadCases();
  loadStats();
});
</script>

<style scoped>
.test-case-container {
  padding: 20px;
}

.view-content {
  min-height: 500px;
}
</style>
