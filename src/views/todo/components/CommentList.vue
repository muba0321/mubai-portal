<template>
  <div class="comment-list">
    <div class="comment-header">
      <span class="title"> 评论 ({{ comments.length }})</span>
    </div>

    <div v-if="comments.length === 0" class="empty-state">
      <el-empty description="暂无评论" :image-size="60" />
    </div>

    <div v-else class="comments">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-avatar">
          <el-avatar :size="32" :style="{ background: getAvatarColor(comment.createdBy) }">
            {{ comment.createdBy?.charAt(0)?.toUpperCase() }}
          </el-avatar>
        </div>
        <div class="comment-content">
          <div class="comment-header-row">
            <span class="comment-author">{{ comment.createdBy }}</span>
            <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <div class="comment-text">{{ comment.content }}</div>
          <div v-if="editingId === comment.id" class="comment-edit">
            <el-input
              v-model="editContent"
              type="textarea"
              :rows="3"
              placeholder="修改评论..."
            />
            <div class="edit-actions">
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button type="primary" size="small" :loading="saving" @click="saveEdit">
                保存
              </el-button>
            </div>
          </div>
          <div v-else class="comment-actions">
            <el-button type="primary" link size="small" @click="startEdit(comment)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="deleteComment(comment)">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="comment-input">
      <el-input
        v-model="newComment"
        type="textarea"
        :rows="3"
        placeholder="发表评论..."
        @keydown.ctrl.enter="submitComment"
      />
      <div class="input-actions">
        <span class="tip">Ctrl+Enter 发送</span>
        <el-button type="primary" :loading="submitting" @click="submitComment">
          发表
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { TodoExtendAPI, type Comment } from "@/api/todo";
import { ElMessage, ElMessageBox } from "element-plus";

const props = defineProps<{
  todoId: number;
}>();

const emit = defineEmits<{
  change: [];
}>();

const comments = ref<Comment[]>([]);
const newComment = ref("");
const submitting = ref(false);
const editingId = ref<number | null>(null);
const editContent = ref("");
const saving = ref(false);

const avatarColors = ["#409eff", "#67c23a", "#e6a23c", "#f56c6c", "#909399", "#00bcd4"];

function getAvatarColor(name: string): string {
  if (!name) return "#409eff";
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString("zh-CN");
}

async function loadComments() {
  try {
    const data = await TodoExtendAPI.listComments(props.todoId);
    comments.value = data || [];
  } catch (error) {
    console.error("加载评论失败:", error);
  }
}

async function submitComment() {
  if (!newComment.value.trim()) {
    ElMessage.warning("请输入评论内容");
    return;
  }

  submitting.value = true;
  try {
    await TodoExtendAPI.addComment(props.todoId, newComment.value.trim());
    ElMessage.success("评论成功");
    newComment.value = "";
    await loadComments();
    emit("change");
  } catch (error: any) {
    ElMessage.error(error.message || "评论失败");
  } finally {
    submitting.value = false;
  }
}

function startEdit(comment: Comment) {
  editingId.value = comment.id;
  editContent.value = comment.content;
}

function cancelEdit() {
  editingId.value = null;
  editContent.value = "";
}

async function saveEdit() {
  if (!editContent.value.trim()) {
    ElMessage.warning("评论内容不能为空");
    return;
  }

  saving.value = true;
  try {
    await TodoExtendAPI.updateComment(editingId.value!, editContent.value.trim());
    ElMessage.success("更新成功");
    editingId.value = null;
    editContent.value = "";
    await loadComments();
  } catch (error: any) {
    ElMessage.error(error.message || "更新失败");
  } finally {
    saving.value = false;
  }
}

async function deleteComment(comment: Comment) {
  try {
    await ElMessageBox.confirm("确定要删除这条评论吗？", "提示", {
      type: "warning",
    });

    await TodoExtendAPI.deleteComment(comment.id);
    ElMessage.success("删除成功");
    await loadComments();
    emit("change");
  } catch {
    // 取消删除
  }
}

// 初始化加载
loadComments();
</script>

<style scoped>
.comment-list {
  margin-top: 16px;
}

.comment-header {
  margin-bottom: 12px;

  .title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.empty-state {
  padding: 20px 0;
}

.comments {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;

  .comment-avatar {
    flex-shrink: 0;
  }

  .comment-content {
    flex: 1;
    min-width: 0;

    .comment-header-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .comment-author {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .comment-time {
        font-size: 12px;
        color: #909399;
      }
    }

    .comment-text {
      font-size: 14px;
      color: #606266;
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .comment-edit {
      margin-top: 8px;

      .edit-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
      }
    }

    .comment-actions {
      display: flex;
      gap: 8px;
    }
  }
}

.comment-input {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;

    .tip {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
