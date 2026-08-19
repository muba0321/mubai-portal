<template>
  <div class="tag-selector">
    <div class="tag-header">
      <span class="title">🏷️ 标签</span>
      <el-button type="primary" link size="small" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon> 新建
      </el-button>
    </div>

    <div v-if="tags.length === 0 && !currentTags.length" class="empty-state">
      <el-empty description="暂无标签" :image-size="50" />
    </div>

    <div v-else class="tag-list">
      <!-- 已选标签 -->
      <div v-for="tag in currentTags" :key="tag.id" class="tag-item selected">
        <span class="tag-color" :style="{ background: tag.color }"></span>
        <span class="tag-name">{{ tag.name }}</span>
        <el-icon class="tag-remove" @click="removeTag(tag)">
          <Close />
        </el-icon>
      </div>

      <!-- 可选标签 -->
      <el-dropdown trigger="click" @command="addTag">
        <div class="tag-item add-tag">
          <el-icon><Plus /></el-icon>
          <span>添加标签</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="tag in availableTags"
              :key="tag.id"
              :command="tag"
            >
              <span class="dropdown-tag">
                <span class="tag-color" :style="{ background: tag.color }"></span>
                {{ tag.name }}
              </span>
            </el-dropdown-item>
            <el-dropdown-item v-if="availableTags.length === 0" disabled>
              无可用标签
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 新建标签对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建标签" width="400px">
      <el-form :model="newTagForm" label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="newTagForm.name" placeholder="标签名称" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="newTagForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTag">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus, Close } from "@element-plus/icons-vue";
import { TodoExtendAPI, type Tag } from "@/api/requirement";
import { ElMessage } from "element-plus";

const props = defineProps<{
  todoId?: number;
}>();

const emit = defineEmits<{
  change: [tags: Tag[]];
}>();

const tags = ref<Tag[]>([]);
const currentTags = ref<Tag[]>([]);
const showCreateDialog = ref(false);
const newTagForm = ref({
  name: "",
  color: "#409eff",
});

const availableTags = computed(() => {
  const currentIds = currentTags.value.map((t) => t.id);
  return tags.value.filter((t) => !currentIds.includes(t.id));
});

async function loadTags() {
  try {
    const data = await TodoExtendAPI.listTags();
    tags.value = data || [];
  } catch (error) {
    console.error("加载标签失败:", error);
  }
}

async function loadCurrentTags() {
  if (!props.todoId) return;
  try {
    const data = await TodoExtendAPI.getTodoTags(props.todoId);
    currentTags.value = data || [];
    emit("change", currentTags.value);
  } catch (error) {
    console.error("加载任务标签失败:", error);
  }
}

async function addTag(tag: Tag) {
  if (!props.todoId) return;
  try {
    await TodoExtendAPI.addTodoTag(props.todoId, tag.id);
    currentTags.value.push(tag);
    emit("change", currentTags.value);
    ElMessage.success("添加成功");
  } catch (error: any) {
    ElMessage.error(error.message || "添加失败");
  }
}

async function removeTag(tag: Tag) {
  if (!props.todoId) return;
  try {
    await TodoExtendAPI.removeTodoTag(props.todoId, tag.id);
    currentTags.value = currentTags.value.filter((t) => t.id !== tag.id);
    emit("change", currentTags.value);
    ElMessage.success("移除成功");
  } catch (error: any) {
    ElMessage.error(error.message || "移除失败");
  }
}

async function createTag() {
  if (!newTagForm.value.name.trim()) {
    ElMessage.warning("请输入标签名称");
    return;
  }

  try {
    const tag = await TodoExtendAPI.createTag(newTagForm.value.name.trim(), newTagForm.value.color);
    tags.value.push(tag);
    showCreateDialog.value = false;
    newTagForm.value = { name: "", color: "#409eff" };
    ElMessage.success("创建成功");
  } catch (error: any) {
    ElMessage.error(error.message || "创建失败");
  }
}

// 初始化加载
loadTags();
loadCurrentTags();
</script>

<style scoped>
.tag-selector {
  margin-top: 16px;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.empty-state {
  padding: 10px 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;

  &.selected {
    background: #f0f9eb;
    border: 1px solid #67c23a;

    .tag-name {
      color: #67c23a;
    }

    .tag-remove {
      color: #67c23a;
      cursor: pointer;

      &:hover {
        color: #f56c6c;
      }
    }
  }

  &.add-tag {
    background: #f5f7fa;
    border: 1px dashed #dcdfe6;
    color: #909399;

    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
  }

  .tag-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .tag-name {
    color: #606266;
  }
}

.dropdown-tag {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
