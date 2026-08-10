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

            <div v-loading="projectLoading" class="project-list">
              <div
                v-for="project in projectList"
                :key="project.id"
                class="project-item"
                :class="{ active: selectedProjectId === project.id }"
                @click="selectProject(project.id!)"
              >
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

        <!-- Right Panel: Todo List -->
        <el-col :span="18">
          <el-card shadow="hover" class="todo-panel">
            <template #header>
              <div class="panel-header">
                <span>{{ currentProjectName ? `${currentProjectName} - 待办项` : "请选择项目" }}</span>
                <el-button
                  type="primary"
                  size="small"
                  :disabled="!selectedProjectId"
                  @click="openTodoDialog()"
                >
                  <el-icon class="mr-1"><Plus /></el-icon>新建待办
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
                    {{ priorityLabel(row.priority) }}
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

    <!-- 任务详情对话框 -->
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
        <el-form-item label="描述">
          <el-input v-model="projectForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProject">保存</el-button>
      </template>
    </el-dialog>

    <!-- 待办对话框 -->
    <el-dialog v-model="todoDialogVisible" title="新建待办" width="600px">
      <el-form :model="todoForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="todoForm.title" placeholder="输入待办标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="todoForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="todoForm.priority" style="width: 100%">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker
                v-model="todoForm.dueDate"
                type="datetime"
                placeholder="选择截止日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="负责人">
          <el-input v-model="todoForm.assignee" placeholder="输入负责人" />
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
import { ref, computed, defineAsyncComponent } from "vue";
import {
  List, Grid, Calendar, DataAnalysis, Plus, EditPen, Delete,
} from "@element-plus/icons-vue";
import { ProjectAPI, TodoAPI, type Project, type TodoItem } from "@/api/todo";
import { ElMessage, ElMessageBox } from "element-plus";

// 懒加载重组件，提升首屏加载速度
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
const projectForm = ref<Project>({ name: "", description: "", status: "active" });

// 待办相关
const todoList = ref<TodoItem[]>([]);
const todoLoading = ref(false);
const todoDialogVisible = ref(false);
const todoForm = ref<Partial<TodoItem>>({
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
});

// 详情对话框
const detailVisible = ref(false);
const selectedTodoId = ref<number>();

const currentProjectName = computed(() => {
  return projectList.value.find((p) => p.id === selectedProjectId.value)?.name || "";
});

async function loadProjects() {
  projectLoading.value = true;
  try {
    const data = await ProjectAPI.getList();
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
    const data = await TodoAPI.getList({ projectId: selectedProjectId.value });
    todoList.value = data || [];
  } catch (error) {
    ElMessage.error("加载待办失败");
  } finally {
    todoLoading.value = false;
  }
}

function selectProject(id: number) {
  selectedProjectId.value = id;
  loadTodos();
}

function openProjectDialog(project?: Project) {
  projectForm.value = project || { name: "", description: "", status: "active" };
  projectDialogVisible.value = true;
}

async function saveProject() {
  if (!projectForm.value.name) {
    ElMessage.warning("请输入项目名称");
    return;
  }

  try {
    if (projectForm.value.id) {
      await ProjectAPI.update(projectForm.value.id, projectForm.value);
      ElMessage.success("项目已更新");
    } else {
      await ProjectAPI.create(projectForm.value);
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
    await ElMessageBox.confirm("确定要删除这个项目吗？项目下的所有待办项也会被删除。", "警告", {
      type: "warning",
    });
    await ProjectAPI.delete(id);
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

function openTodoDialog() {
  todoForm.value = {
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    projectId: selectedProjectId.value,
  };
  todoDialogVisible.value = true;
}

async function saveTodo() {
  if (!todoForm.value.title) {
    ElMessage.warning("请输入待办标题");
    return;
  }

  try {
    await TodoAPI.create(todoForm.value as any);
    ElMessage.success("待办已创建");
    todoDialogVisible.value = false;
    loadTodos();
  } catch (error: any) {
    ElMessage.error(error.message || "创建失败");
  }
}

async function handleDeleteTodo(id: number) {
  try {
    await ElMessageBox.confirm("确定要删除这个待办项吗？", "警告", {
      type: "warning",
    });
    await TodoAPI.delete(id);
    ElMessage.success("待办已删除");
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
    pending: "info",
    in_progress: "primary",
    completed: "success",
    cancelled: "danger",
  };
  return map[status] || "info";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    in_progress: "进行中",
    completed: "已完成",
    cancelled: "已取消",
  };
  return map[status] || status;
}

function priorityTagType(priority: string) {
  const map: Record<string, "success" | "warning" | "danger" | "info"> = {
    low: "success",
    medium: "info",
    high: "warning",
    urgent: "danger",
  };
  return map[priority] || "info";
}

function priorityLabel(priority: string) {
  const map: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "紧急",
  };
  return map[priority] || priority;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date();
}

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
  justify-content: space-between;
  align-items: center;
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

  .project-info {
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
  }
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
