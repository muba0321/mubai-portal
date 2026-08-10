<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="任务详情"
    width="700px"
    @close="emit('close')"
  >
    <div v-if="todo" class="todo-detail">
      <!-- 标题编辑 -->
      <div class="detail-title">
        <el-input
          v-model="editForm.title"
          placeholder="任务标题"
          @change="saveChanges"
        />
      </div>

      <!-- 基本信息 -->
      <div class="detail-info">
        <div class="info-row">
          <el-select v-model="editForm.status" placeholder="状态" @change="saveChanges">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>

          <el-select v-model="editForm.priority" placeholder="优先级" @change="saveChanges">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>

          <el-input
            v-model="editForm.assignee"
            placeholder="负责人"
            @change="saveChanges"
          />
        </div>

        <div class="info-row">
          <el-date-picker
            v-model="editForm.dueDate"
            type="datetime"
            placeholder="截止日期"
            @change="saveChanges"
          />
        </div>
      </div>

      <!-- 描述 -->
      <div class="detail-section">
        <h4>📝 描述</h4>
        <el-input
          v-model="editForm.description"
          type="textarea"
          :rows="4"
          placeholder="任务描述..."
          @change="saveChanges"
        />
      </div>

      <!-- 标签 -->
      <div class="detail-section">
        <TagSelector :todo-id="todoId" @change="onTagsChange" />
      </div>

      <!-- 附件 -->
      <div class="detail-section">
        <AttachmentList :todo-id="todoId" />
      </div>

      <!-- 评论 -->
      <div class="detail-section">
        <CommentList :todo-id="todoId" />
      </div>
    </div>

    <div v-else class="loading">
      <el-skeleton :rows="5" animated />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { TodoAPI, TodoExtendAPI, type TodoItem } from "@/api/todo";
import { ElMessage } from "element-plus";
import TagSelector from "./TagSelector.vue";
import AttachmentList from "./AttachmentList.vue";
import CommentList from "./CommentList.vue";

const props = defineProps<{
  modelValue: boolean;
  todoId?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  update: [];
}>();

const todo = ref<TodoItem | null>(null);
const editForm = ref({
  title: "",
  description: "",
  status: "pending" as string,
  priority: "medium" as string,
  assignee: "",
  dueDate: "" as string | null,
});

async function loadTodo() {
  if (!props.todoId) return;

  try {
    const todos = await TodoAPI.getList();
    todo.value = todos.find((t) => t.id === props.todoId) || null;

    if (todo.value) {
      editForm.value = {
        title: todo.value.title,
        description: todo.value.description || "",
        status: todo.value.status,
        priority: todo.value.priority,
        assignee: todo.value.assignee || "",
        dueDate: todo.value.dueDate || null,
      };
    }
  } catch (error) {
    console.error("加载任务失败:", error);
  }
}

async function saveChanges() {
  if (!props.todoId) return;

  try {
    await TodoAPI.update(props.todoId, editForm.value);
    ElMessage.success("保存成功");
    emit("update");
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  }
}

function onTagsChange(tags: any[]) {
  // 标签变更时的处理
  console.log("标签已更新:", tags);
}

watch(() => props.todoId, () => {
  if (props.todoId) {
    loadTodo();
  }
});
</script>

<style scoped>
.todo-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-title {
  margin-bottom: 20px;

  :deep(.el-input) {
    font-size: 18px;
    font-weight: 600;
  }
}

.detail-info {
  margin-bottom: 20px;

  .info-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;

    :deep(.el-select),
    :deep(.el-input) {
      flex: 1;
    }
  }
}

.detail-section {
  margin-bottom: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #303133;
  }
}

.loading {
  padding: 40px 20px;
}
</style>
