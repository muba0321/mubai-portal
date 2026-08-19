<template>
  <div class="kanban-board">
    <div class="kanban-header">
      <h3>看板视图</h3>
      <el-select v-model="selectedProject" placeholder="选择项目" clearable @change="loadKanban">
        <el-option
          v-for="project in projects"
          :key="project.id"
          :label="project.name"
          :value="project.id"
        />
      </el-select>
    </div>

    <div class="kanban-columns">
      <div
        v-for="status in statusList"
        :key="status.value"
        class="kanban-column"
        @dragover.prevent="onDragOver"
        @drop="onDrop($event, status.value)"
      >
        <div class="column-header" :style="{ borderColor: status.color }">
          <span class="column-title" :style="{ color: status.color }">
            {{ status.label }}
          </span>
          <span class="column-count">{{ getColumnCount(status.value) }}</span>
        </div>

        <div class="column-content">
          <div
            v-for="todo in getColumnTodos(status.value)"
            :key="todo.id"
            class="todo-card"
            draggable="true"
            @dragstart="onDragStart(todo)"
            @click="openDetail(todo)"
          >
            <div class="card-header">
              <span class="card-title">{{ todo.title }}</span>
              <el-tag
                v-if="todo.priority"
                :type="getPriorityType(todo.priority)"
                size="small"
              >
                {{ getPriorityLabel(todo.priority) }}
              </el-tag>
            </div>

            <div v-if="todo.assignee" class="card-assignee">
              <el-avatar :size="20">{{ todo.assignee.charAt(0) }}</el-avatar>
              <span>{{ todo.assignee }}</span>
            </div>

            <div v-if="todo.dueDate" class="card-due-date">
              <el-icon><Calendar /></el-icon>
              <span :class="{ overdue: isOverdue(todo.dueDate) }">
                {{ formatDate(todo.dueDate) }}
              </span>
            </div>

            <div v-if="todo.tags && todo.tags.length > 0" class="card-tags">
              <span
                v-for="tag in todo.tags"
                :key="tag.id"
                class="tag"
                :style="{ background: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>

            <div class="card-footer">
              <span v-if="todo.attachmentCount" class="card-stat">
                <el-icon><Paperclip /></el-icon>
                {{ todo.attachmentCount }}
              </span>
              <span v-if="todo.commentCount" class="card-stat">
                <el-icon><ChatDotRound /></el-icon>
                {{ todo.commentCount }}
              </span>
            </div>
          </div>

          <div v-if="getColumnTodos(status.value).length === 0" class="empty-column">
            拖拽任务到此处
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情对话框 -->
    <TodoDetailDialog
      v-model="detailVisible"
      :todo-id="selectedTodoId"
      @update="loadKanban"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Calendar, Paperclip, ChatDotRound } from "@element-plus/icons-vue";
import { TodoExtendAPI, ProjectAPI, type TodoItem, type Project } from "@/api/requirement";
import TodoDetailDialog from "./TodoDetailDialog.vue";
import { ElMessage } from "element-plus";

const projects = ref<Project[]>([]);
const selectedProject = ref<number | undefined>();
const kanbanData = ref<Record<string, TodoItem[]>>({
  pending: [],
  in_progress: [],
  completed: [],
  cancelled: [],
});
const detailVisible = ref(false);
const selectedTodoId = ref<number>();
const draggedTodo = ref<TodoItem | null>(null);

const statusList = [
  { value: "pending", label: "待处理", color: "#909399" },
  { value: "in_progress", label: "进行中", color: "#409eff" },
  { value: "completed", label: "已完成", color: "#67c23a" },
  { value: "cancelled", label: "已取消", color: "#f56c6c" },
];

async function loadProjects() {
  try {
    const data = await ProjectAPI.getList("active");
    projects.value = data || [];
  } catch (error) {
    console.error("加载项目失败:", error);
  }
}

async function loadKanban() {
  try {
    const data = await TodoExtendAPI.getKanban(selectedProject.value);
    kanbanData.value = data || {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
  } catch (error) {
    console.error("加载看板失败:", error);
  }
}

function getColumnTodos(status: string): TodoItem[] {
  return kanbanData.value[status] || [];
}

function getColumnCount(status: string): number {
  return getColumnTodos(status).length;
}

function getPriorityType(priority: string): "danger" | "warning" | "success" | "info" {
  const map: Record<string, "danger" | "warning" | "success" | "info"> = {
    urgent: "danger",
    high: "warning",
    medium: "info",
    low: "success",
  };
  return map[priority] || "info";
}

function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    urgent: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  };
  return map[priority] || priority;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN");
}

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date < now;
}

function onDragStart(todo: TodoItem) {
  draggedTodo.value = todo;
}

function onDragOver(_e: DragEvent) {
  _e.dataTransfer!.dropEffect = "move";
}

async function onDrop(e: DragEvent, newStatus: "pending" | "in_progress" | "completed" | "cancelled") {
  if (!draggedTodo.value) return;

  const todo = draggedTodo.value;
  if (todo.status === newStatus) return;

  try {
    await TodoExtendAPI.updateTodo(todo.id!, { ...todo, status: newStatus });
    ElMessage.success("状态已更新");
    await loadKanban();
  } catch (error: any) {
    ElMessage.error(error.message || "更新失败");
  } finally {
    draggedTodo.value = null;
  }
}

function openDetail(todo: TodoItem) {
  selectedTodoId.value = todo.id;
  detailVisible.value = true;
}

// 初始化加载
loadProjects();
loadKanban();
</script>

<style scoped>
.kanban-board {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;

  h3 {
    margin: 0;
    font-size: 18px;
    color: #303133;
  }
}

.kanban-columns {
  display: flex;
  gap: 16px;
  flex: 1;
  overflow-x: auto;
}

.kanban-column {
  flex: 1;
  min-width: 280px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  padding: 12px 16px;
  border-top: 3px solid;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;

  .column-title {
    font-size: 14px;
    font-weight: 600;
  }

  .column-count {
    font-size: 12px;
    color: #909399;
    background: #f4f4f5;
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.column-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  min-height: 200px;
}

.todo-card {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    cursor: grabbing;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;

    .card-title {
      flex: 1;
      font-size: 14px;
      color: #303133;
      line-height: 1.4;
    }
  }

  .card-assignee {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #606266;
    margin-bottom: 8px;
  }

  .card-due-date {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;

    .overdue {
      color: #f56c6c;
    }
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;

    .tag {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
    }
  }

  .card-footer {
    display: flex;
    gap: 12px;

    .card-stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #909399;
    }
  }
}

.empty-column {
  text-align: center;
  padding: 40px 20px;
  color: #c0c4cc;
  font-size: 13px;
}
</style>
