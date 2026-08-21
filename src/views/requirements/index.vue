<template>
  <div class="app-container todo-page">
    <!-- 视图切换 -->
    <div class="view-tabs">
      <el-radio-group v-model="currentView" size="large">
        <el-radio-button value="list">
          <el-icon><List /></el-icon> 列表
        </el-radio-button>
        <el-radio-button value="kanban">
          <el-icon><Grid /></el-icon> 看板
        </el-radio-button>
        <el-radio-button value="calendar">
          <el-icon><Calendar /></el-icon> 日历
        </el-radio-button>
        <el-radio-button value="statistics">
          <el-icon><DataAnalysis /></el-icon> 统计
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 列表视图 -->
    <div v-if="currentView === 'list'" class="view-content">
      <el-row :gutter="16" class="todo-layout">
        <!-- Left Panel: Project List -->
        <el-col :span="6">
          <el-card shadow="hover" class="project-panel">
            <template #header>
              <div class="panel-header">
                <span>项目</span>
                <el-button type="primary" size="small" @click="openProjectDialog()">
                  <el-icon class="mr-1"><Plus /></el-icon>新建
                </el-button>
              </div>
            </template>

            <div v-loading="projectLoading" class="project-list" ref="projectListRef">
              <div
                v-for="project in projectList"
                :key="project.id"
                :data-id="project.id"
                class="project-item"
                :class="{ active: selectedProjectId === project.id }"
                @click="selectProject(project.id!)"
              >
                <el-icon class="drag-handle" title="拖拽排序"><Rank /></el-icon>
                <div class="project-info">
                  <span class="project-name">{{ project.name }}</span>
                  <el-tag
                    size="small"
                    :type="project.status === 'active' ? 'success' : 'info'"
                  >
                    {{ project.status === "active" ? "进行中" : "已归档" }}
                  </el-tag>
                </div>
                <div class="project-actions">
                  <el-button
                    type="primary" link size="small"
                    @click.stop="openProjectDialog(project)"
                  >
                    <el-icon><EditPen /></el-icon>
                  </el-button>
                  <el-button
                    type="danger" link size="small"
                    @click.stop="handleDeleteProject(project.id!)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <el-empty v-if="!projectLoading && projectList.length === 0" description="暂无项目" />
            </div>
          </el-card>
        </el-col>

        <!-- Right Panel: Requirement List -->
        <el-col :span="18">
          <el-card shadow="hover" class="todo-panel">
            <template #header>
              <div class="panel-header">
                <span>{{ currentProjectName ? `${currentProjectName} - 需求列表` : "请选择项目" }}</span>
                <el-button
                  type="primary"
                  size="small"
                  :disabled="!selectedProjectId"
                  @click="openTodoDialog()"
                >
                  <el-icon class="mr-1"><Plus /></el-icon>新建需求
                </el-button>
              </div>
            </template>

            <el-table
              v-loading="todoLoading"
              :data="todoList"
              row-key="id"
              :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
              default-expand-all
              border
              stripe
              class="todo-table"
            >
              <el-table-column prop="title" label="标题" min-width="200">
                <template #default="{ row }">
                  <span :style="{ fontWeight: !row.parentId ? '600' : 'normal' }">
                    {{ row.title }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column prop="requirementType" label="类型" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="typeTagType(row.requirementType)" size="small" effect="plain">
                    {{ typeLabel(row.requirementType) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="statusTagType(row.status)" size="small">
                    {{ statusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="priority" label="优先级" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="priorityTagType(row.priority)" size="small">
                    {{ row.priority }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="assignee" label="负责人" width="100" />

              <el-table-column prop="dueDate" label="截止日期" width="120">
                <template #default="{ row }">
                  <span v-if="row.dueDate" :class="{ 'text-danger': isOverdue(row.dueDate) }">
                    {{ formatDate(row.dueDate) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openDetail(row.id)">
                    详情
                  </el-button>
                  <el-button type="danger" link size="small" @click="handleDeleteTodo(row.id!)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 看板视图 -->
    <div v-else-if="currentView === 'kanban'" class="view-content">
      <KanbanView />
    </div>

    <!-- 日历视图 -->
    <div v-else-if="currentView === 'calendar'" class="view-content">
      <CalendarView />
    </div>

    <!-- 统计视图 -->
    <div v-else-if="currentView === 'statistics'" class="view-content">
      <StatisticsView />
    </div>

    <!-- 需求详情对话框 -->
    <TodoDetailDialog
      v-model="detailVisible"
      :todo-id="selectedTodoId"
      @update="loadTodos"
    />

    <!-- 项目对话框 -->
    <el-dialog v-model="projectDialogVisible" :title="projectForm.id ? '编辑项目' : '新建项目'" width="500px">
      <el-form :model="projectForm" label-width="80px">
        <el-form-item label="项目名称" required>
          <el-input v-model="projectForm.name" placeholder="输入项目名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="projectForm.status" style="width: 100%">
            <el-option label="进行中" value="active" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="projectForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProject">保存</el-button>
      </template>
    </el-dialog>

    <!-- 需求对话框 -->
    <el-dialog v-model="todoDialogVisible" :title="todoForm.id ? '编辑需求' : '新建需求'" width="600px">
      <el-form :model="todoForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="todoForm.title" placeholder="输入需求标题" />
        </el-form-item>
        <el-form-item label="所属项目">
          <el-select v-model="todoForm.projectId" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="project in projectList"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="todoForm.requirementType" style="width: 100%">
            <el-option label="功能需求" value="feature" />
            <el-option label="Bug 修复" value="bug" />
            <el-option label="任务" value="task" />
            <el-option label="优化改进" value="improvement" />
            <el-option label="技术债务" value="tech_debt" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="todoForm.priority" style="width: 100%">
            <el-option label="P0 紧急" value="P0" />
            <el-option label="P1 高" value="P1" />
            <el-option label="P2 中" value="P2" />
            <el-option label="P3 低" value="P3" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="todoForm.assignee" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="todoForm.dueDate"
            type="datetime"
            placeholder="选择截止日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="todoForm.description" type="textarea" :rows="3" placeholder="请输入需求描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="todoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTodo">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted } from "vue";
import {
  List, Grid, Calendar, DataAnalysis, Plus, EditPen, Delete, Rank,
} from "@element-plus/icons-vue";
import RequirementAPI, { type Project, type Requirement } from "@/api/requirement";
import { ElMessage, ElMessageBox } from "element-plus";
import Sortable from "sortablejs";

// 懒加载重组件
const KanbanView = defineAsyncComponent(() => import("./components/KanbanView.vue"));
const CalendarView = defineAsyncComponent(() => import("./components/CalendarView.vue"));
const StatisticsView = defineAsyncComponent(() => import("./components/StatisticsView.vue"));
const TodoDetailDialog = defineAsyncComponent(() => import("./components/TodoDetailDialog.vue"));

// 视图切换
const currentView = ref("list");

// 项目相关
const projectList = ref<Project[]>([]);
const projectLoading = ref(false);
const selectedProjectId = ref<number>();
const projectDialogVisible = ref(false);
const projectForm = ref<Project>({ id: undefined, name: "", description: "", status: "active", createdAt: "" });

// 需求相关
const todoList = ref<Requirement[]>([]);
const todoLoading = ref(false);
const todoDialogVisible = ref(false);
const todoForm = ref<Partial<Requirement>>({
  title: "",
  description: "",
  priority: "P2",
  requirementType: "task",
  status: "proposed",
});

// 详情对话框
const detailVisible = ref(false);
const selectedTodoId = ref<number>();

const projectListRef = ref<HTMLElement>();

const currentProjectName = computed(() => {
  return projectList.value.find((p) => p.id === selectedProjectId.value)?.name || "";
});

async function loadProjects() {
  projectLoading.value = true;
  try {
    const data = await RequirementAPI.getProjects();
    projectList.value = data || [];
  } catch (error) {
    ElMessage.error("加载项目失败");
  } finally {
    projectLoading.value = false;
  }
}

async function loadTodos() {
  if (!selectedProjectId.value) return;
  todoLoading.value = true;
  try {
    const data = await RequirementAPI.getRequirements({ projectId: selectedProjectId.value });
    todoList.value = data || [];
  } catch (error) {
    ElMessage.error("加载需求失败");
  } finally {
    todoLoading.value = false;
  }
}

function selectProject(id: number) {
  selectedProjectId.value = id;
  loadTodos();
}

function openProjectDialog(project?: Project) {
  projectForm.value = project ? { ...project } : { id: undefined, name: "", description: "", status: "active", createdAt: "" };
  projectDialogVisible.value = true;
}

async function saveProject() {
  if (!projectForm.value.name) {
    ElMessage.warning("请输入项目名称");
    return;
  }

  try {
    if (projectForm.value.id) {
      await RequirementAPI.updateProject(projectForm.value.id, projectForm.value);
      ElMessage.success("项目已更新");
    } else {
      await RequirementAPI.createProject(projectForm.value);
      ElMessage.success("项目已创建");
    }
    projectDialogVisible.value = false;
    loadProjects();
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  }
}

async function handleDeleteProject(id: number) {
  try {
    await ElMessageBox.confirm("确定要删除这个项目吗？项目下的所有需求也会被删除。", "警告", {
      type: "warning",
    });
    await RequirementAPI.deleteProject(id);
    ElMessage.success("项目已删除");
    if (selectedProjectId.value === id) {
      selectedProjectId.value = undefined;
      todoList.value = [];
    }
    loadProjects();
  } catch {
    // 取消删除
  }
}

function openTodoDialog(requirement?: Requirement) {
  if (requirement) {
    todoForm.value = {
      id: requirement.id,
      title: requirement.title,
      description: requirement.description || "",
      priority: requirement.priority,
      requirementType: requirement.requirementType,
      status: requirement.status,
      projectId: requirement.projectId,
      assignee: requirement.assignee || "",
      dueDate: requirement.dueDate || null,
    };
  } else {
    todoForm.value = {
      title: "",
      description: "",
      priority: "P2",
      requirementType: "task",
      status: "proposed",
      projectId: selectedProjectId.value,
    };
  }
  todoDialogVisible.value = true;
}

async function saveTodo() {
  if (!todoForm.value.title) {
    ElMessage.warning("请输入需求标题");
    return;
  }
  if (!todoForm.value.projectId) {
    ElMessage.warning("请选择所属项目");
    return;
  }

  try {
    if (todoForm.value.id) {
      await RequirementAPI.updateRequirement(todoForm.value.id, todoForm.value);
      ElMessage.success("需求已更新");
    } else {
      await RequirementAPI.createRequirement(todoForm.value);
      ElMessage.success("需求已创建");
    }
    todoDialogVisible.value = false;
    loadTodos();
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  }
}

async function handleDeleteTodo(id: number) {
  try {
    await ElMessageBox.confirm("确定要删除这个需求吗？", "警告", {
      type: "warning",
    });
    await RequirementAPI.deleteRequirement(id);
    ElMessage.success("需求已删除");
    loadTodos();
  } catch {
    // 取消删除
  }
}

function openDetail(todoId: number) {
  selectedTodoId.value = todoId;
  detailVisible.value = true;
}

function statusTagType(status: string) {
  const map: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    proposed: "info",
    under_review: "warning",
    approved: "primary",
    in_progress: "warning",
    blocked: "danger",
    in_testing: "info",
    re_testing: "warning",
    done: "success",
    rejected: "danger",
    cancelled: "danger",
  };
  return map[status] || "info";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    proposed: "待处理",
    under_review: "审核中",
    approved: "已排期",
    in_progress: "进行中",
    blocked: "已阻塞",
    in_testing: "测试中",
    re_testing: "复测中",
    done: "已完成",
    rejected: "已拒绝",
    cancelled: "已取消",
  };
  return map[status] || status;
}

function typeTagType(t: string) {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "primary"> = {
    feature: "success",
    bug: "danger",
    task: "primary",
    improvement: "warning",
    tech_debt: "info",
  };
  return map[t] || "info";
}

function typeLabel(t: string) {
  const map: Record<string, string> = {
    feature: "功能",
    bug: "Bug",
    task: "任务",
    improvement: "优化",
    tech_debt: "技术债",
  };
  return map[t] || t;
}

function priorityTagType(priority: string) {
  const map: Record<string, "success" | "warning" | "danger" | "info"> = {
    P0: "danger",
    P1: "warning",
    P2: "primary",
    P3: "info",
  };
  return map[priority] || "info";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date();
}

// 初始化拖拽排序
onMounted(() => {
  if (!projectListRef.value) return;
  Sortable.create(projectListRef.value, {
    handle: ".drag-handle",
    animation: 150,
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    onEnd: async (evt) => {
      const newOrder = Array.from(evt.to.children)
        .filter((item) => item.classList.contains("project-item"))
        .map((item, index) => ({
          id: parseInt((item as HTMLElement).getAttribute("data-id")!),
          sort: index,
        }));

      try {
        await RequirementAPI.updateProjectsSort(newOrder);
        ElMessage.success("排序已更新");
        loadProjects();
      } catch {
        ElMessage.error("排序更新失败");
        loadProjects();
      }
    },
  });
});

// 初始化加载
loadProjects();
</script>

<style scoped>
.todo-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-tabs {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.view-content {
  flex: 1;
  overflow: hidden;
}

.todo-layout {
  height: 100%;
}

.project-panel,
.todo-panel {
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-list {
  max-height: 600px;
  overflow-y: auto;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.3s;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: #ecf5ff;
    border-left: 3px solid #409eff;
  }

  .drag-handle {
    cursor: grab;
    color: #909399;
    font-size: 16px;
    flex-shrink: 0;

    &:hover {
      color: #409eff;
    }

    &:active {
      cursor: grabbing;
    }
  }

  .project-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .project-name {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }

  .project-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
}

.sortable-ghost {
  opacity: 0.4;
  background: #ecf5ff;
}

.sortable-chosen {
  background: #f0f9eb;
}

.sortable-drag {
  opacity: 0.8;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.todo-table {
  :deep(.el-table__row) {
    cursor: pointer;

    &:hover {
      background: #f5f7fa;
    }
  }
}

.text-danger {
  color: #f56c6c;
}

.text-muted {
  color: #c0c4cc;
}

.mr-1 {
  margin-right: 4px;
}
</style>
