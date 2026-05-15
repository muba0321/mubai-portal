<template>
  <div class="app-container todo-page">
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

            <el-table-column prop="assignee" label="负责人" width="100" align="center" />

            <el-table-column prop="dueDate" label="截止日期" width="120" align="center">
              <template #default="{ row }">
                {{ row.dueDate ? row.dueDate.slice(0, 10) : "-" }}
              </template>
            </el-table-column>

            <el-table-column label="操作" fixed="right" width="180" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openTodoDialog(row)">
                  编辑
                </el-button>
                <el-button type="success" link size="small" @click="openTodoDialog(undefined, row.id)">
                  子待办
                </el-button>
                <el-button type="danger" link size="small" @click="handleDeleteTodo(row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!todoLoading && todoList.length === 0 && selectedProjectId" description="暂无待办项" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Project Dialog -->
    <el-dialog
      v-model="projectDialogVisible"
      :title="projectDialogTitle"
      width="500px"
      append-to-body
    >
      <el-form ref="projectFormRef" :model="projectForm" :rules="projectRules" label-width="80px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="projectForm.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="projectForm.status">
            <el-radio value="active">进行中</el-radio>
            <el-radio value="archived">已归档</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProjectForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- Todo Dialog -->
    <el-dialog
      v-model="todoDialogVisible"
      :title="todoDialogTitle"
      width="550px"
      append-to-body
    >
      <el-form ref="todoFormRef" :model="todoForm" :rules="todoRules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="todoForm.title" placeholder="请输入待办标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="todoForm.description" type="textarea" :rows="3" placeholder="请输入详细描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="todoForm.status" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="todoForm.priority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="todoForm.assignee" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="todoForm.dueDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="todoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTodoForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus, EditPen, Delete } from "@element-plus/icons-vue";
import { ProjectAPI, TodoAPI } from "@/api/todo";
import type { ProjectItem, ProjectForm, TodoItem as TodoItemType, TodoForm } from "@/types/api";
import type { FormInstance, FormRules } from "element-plus";

defineOptions({ name: "Todo" });

// ==================== Project State ====================
const projectList = ref<ProjectItem[]>([]);
const projectLoading = ref(false);
const selectedProjectId = ref<number | null>(null);

const todoList = ref<TodoItemType[]>([]);
const todoLoading = ref(false);

const currentProjectName = computed(() => {
  const p = projectList.value.find((x) => x.id === selectedProjectId.value);
  return p?.name ?? null;
});

// ==================== Project Dialog ====================
const projectFormRef = ref<FormInstance>();
const projectDialogVisible = ref(false);
const projectDialogTitle = ref("新建项目");

const projectInitialForm: ProjectForm = {
  name: "",
  description: "",
  status: "active",
};

const projectForm = reactive<ProjectForm>({ ...projectInitialForm });

const projectRules: FormRules = {
  name: [{ required: true, message: "项目名称不能为空", trigger: "blur" }],
};

function openProjectDialog(project?: ProjectItem) {
  projectDialogVisible.value = true;
  if (project) {
    projectDialogTitle.value = "编辑项目";
    Object.assign(projectForm, {
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status,
    });
  } else {
    projectDialogTitle.value = "新建项目";
    Object.assign(projectForm, { ...projectInitialForm, id: undefined });
  }
}

async function submitProjectForm() {
  const valid = await projectFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  try {
    if (projectForm.id) {
      await ProjectAPI.update(projectForm.id, { ...projectForm });
      ElMessage.success("修改成功");
    } else {
      await ProjectAPI.create({ ...projectForm });
      ElMessage.success("新增成功");
    }
    projectDialogVisible.value = false;
    fetchProjects();
  } catch {
    // 错误已在拦截器处理
  }
}

async function handleDeleteProject(id: number) {
  ElMessageBox.confirm("确认删除该项目？其下的待办项也将被删除。", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      await ProjectAPI.delete(id);
      ElMessage.success("删除成功");
      if (selectedProjectId.value === id) selectedProjectId.value = null;
      fetchProjects();
    } catch {
      // 错误已在拦截器处理
    }
  }).catch(() => {});
}

// ==================== Todo Dialog ====================
const todoFormRef = ref<FormInstance>();
const todoDialogVisible = ref(false);
const todoDialogTitle = ref("新建待办项");

const todoInitialForm: TodoForm = {
  projectId: 0,
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  assignee: "",
  parentId: null,
  dueDate: undefined,
};

const todoForm = reactive<TodoForm>({ ...todoInitialForm });

const todoRules: FormRules = {
  title: [{ required: true, message: "标题不能为空", trigger: "blur" }],
};

function openTodoDialog(row?: TodoItemType, parentId?: number) {
  todoDialogVisible.value = true;
  if (row) {
    todoDialogTitle.value = "编辑待办项";
    Object.assign(todoForm, {
      id: row.id,
      projectId: row.projectId,
      parentId: row.parentId,
      title: row.title,
      description: row.description || "",
      status: row.status,
      priority: row.priority,
      assignee: row.assignee || "",
      dueDate: row.dueDate,
    });
  } else {
    todoDialogTitle.value = parentId ? "新建子待办项" : "新建待办项";
    Object.assign(todoForm, {
      ...todoInitialForm,
      id: undefined,
      projectId: selectedProjectId.value ?? 0,
      parentId: parentId ?? null,
    });
  }
}

async function submitTodoForm() {
  const valid = await todoFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  try {
    if (todoForm.id) {
      await TodoAPI.update(todoForm.id, { ...todoForm });
      ElMessage.success("修改成功");
    } else {
      await TodoAPI.create({ ...todoForm });
      ElMessage.success("新增成功");
    }
    todoDialogVisible.value = false;
    fetchTodos();
  } catch {
    // 错误已在拦截器处理
  }
}

async function handleDeleteTodo(id: number) {
  ElMessageBox.confirm("确认删除该待办项？其子待办项也将被删除。", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      await TodoAPI.delete(id);
      ElMessage.success("删除成功");
      fetchTodos();
    } catch {
      // 错误已在拦截器处理
    }
  }).catch(() => {});
}

// ==================== Data Fetching ====================
async function fetchProjects() {
  projectLoading.value = true;
  try {
    projectList.value = await ProjectAPI.getList();
  } finally {
    projectLoading.value = false;
  }
}

async function fetchTodos() {
  if (!selectedProjectId.value) {
    todoList.value = [];
    return;
  }
  todoLoading.value = true;
  try {
    todoList.value = await TodoAPI.getByProject(selectedProjectId.value);
  } finally {
    todoLoading.value = false;
  }
}

function selectProject(id: number) {
  selectedProjectId.value = id;
  fetchTodos();
}

// ==================== Helpers ====================
function statusLabel(s?: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    in_progress: "进行中",
    completed: "已完成",
    cancelled: "已取消",
  };
  return map[s ?? ""] ?? s;
}

function statusTagType(s?: string): "success" | "warning" | "info" | "primary" | "danger" {
  const map: Record<string, any> = {
    pending: "info",
    in_progress: "warning",
    completed: "success",
    cancelled: "danger",
  };
  return map[s ?? ""] ?? "info";
}

function priorityLabel(p?: string) {
  const map: Record<string, string> = { low: "低", medium: "中", high: "高", urgent: "紧急" };
  return map[p ?? ""] ?? p;
}

function priorityTagType(p?: string): "success" | "warning" | "info" | "danger" {
  const map: Record<string, any> = { low: "info", medium: "", high: "warning", urgent: "danger" };
  return map[p ?? ""] ?? "";
}

// ==================== Lifecycle ====================
onMounted(() => {
  fetchProjects();
});
</script>

<style scoped lang="scss">
.todo-page {
  height: 100%;
}

.todo-layout {
  height: calc(100vh - 140px);
}

.project-panel,
.todo-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    overflow-y: auto;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.project-list {
  min-height: 200px;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;

    .project-actions {
      opacity: 1;
    }
  }

  &.active {
    background: #ecf5ff;
  }

  .project-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .project-name {
      font-weight: 500;
    }
  }

  .project-actions {
    opacity: 0;
    transition: opacity 0.2s;
  }
}
</style>
