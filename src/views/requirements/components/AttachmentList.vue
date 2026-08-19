<template>
  <div class="attachment-list">
    <div class="attachment-header">
      <span class="title">📎 附件 ({{ attachments.length }})</span>
      <el-upload
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="handleUpload"
        :accept="allowedTypes"
      >
        <el-button type="primary" size="small" :loading="uploading">
          <el-icon><Upload /></el-icon> 上传附件
        </el-button>
      </el-upload>
    </div>

    <div v-if="attachments.length === 0" class="empty-state">
      <el-empty description="暂无附件" :image-size="60" />
    </div>

    <div v-else class="attachment-items">
      <div v-for="att in attachments" :key="att.id" class="attachment-item">
        <div class="file-icon" :class="getFileTypeClass(att.fileType)">
          <el-icon :size="24">
            <component :is="getFileTypeIcon(att.fileType)" />
          </el-icon>
        </div>
        <div class="file-info">
          <div class="file-name" :title="att.fileName">{{ att.fileName }}</div>
          <div class="file-meta">
            <span>{{ formatFileSize(att.fileSize) }}</span>
            <span class="separator">·</span>
            <span>{{ att.uploadedBy }}</span>
            <span class="separator">·</span>
            <span>{{ formatDate(att.createdAt) }}</span>
          </div>
        </div>
        <div class="file-actions">
          <el-button type="primary" link size="small" @click="downloadFile(att)">
            <el-icon><Download /></el-icon>
          </el-button>
          <el-button type="danger" link size="small" @click="deleteFile(att)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Upload, Download, Delete, Document, Picture, VideoPlay, Files } from "@element-plus/icons-vue";
import { RequirementAPI, type Attachment } from "@/api/requirement";
import { ElMessage, ElMessageBox } from "element-plus";

const props = defineProps<{
  todoId: number;
}>();

const emit = defineEmits<{
  change: [];
}>();

const attachments = ref<Attachment[]>([]);
const uploading = ref(false);

// 允许的文件类型
const allowedTypes = ".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.log,.zip";

async function loadAttachments() {
  try {
    const data = await TodoExtendAPI.listAttachments(props.todoId);
    attachments.value = data || [];
  } catch (error) {
    console.error("加载附件失败:", error);
  }
}

function beforeUpload(file: File) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    ElMessage.error("文件大小不能超过 10MB");
    return false;
  }
  return true;
}

async function handleUpload(options: any) {
  uploading.value = true;
  try {
    await TodoExtendAPI.uploadAttachment(props.todoId, options.file);
    ElMessage.success("上传成功");
    await loadAttachments();
    emit("change");
  } catch (error: any) {
    ElMessage.error(error.message || "上传失败");
  } finally {
    uploading.value = false;
  }
}

function getFileTypeClass(fileType: string): string {
  const map: Record<string, string> = {
    png: "image",
    jpg: "image",
    jpeg: "image",
    gif: "image",
    pdf: "pdf",
    doc: "doc",
    docx: "doc",
    xls: "excel",
    xlsx: "excel",
    zip: "archive",
  };
  return map[fileType] || "file";
}

function getFileTypeIcon(fileType: string) {
  const map: Record<string, any> = {
    png: Picture,
    jpg: Picture,
    jpeg: Picture,
    gif: Picture,
    pdf: Document,
    doc: Document,
    docx: Document,
    xls: Document,
    xlsx: Document,
    zip: Files,
  };
  return map[fileType] || Document;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN");
}

function downloadFile(att: Attachment) {
  const link = document.createElement("a");
  link.href = `/api/v1/todo/attachments/${att.id}`;
  link.download = att.fileName;
  link.click();
}

async function deleteFile(att: Attachment) {
  try {
    await ElMessageBox.confirm(`确定要删除附件 "${att.fileName}" 吗？`, "提示", {
      type: "warning",
    });

    await TodoExtendAPI.deleteAttachment(att.id);
    ElMessage.success("删除成功");
    await loadAttachments();
    emit("change");
  } catch {
    // 取消删除
  }
}

// 初始化加载
loadAttachments();
</script>

<style scoped>
.attachment-list {
  margin-top: 16px;
}

.attachment-header {
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
  padding: 20px 0;
}

.attachment-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  transition: background 0.3s;

  &:hover {
    background: #ebeef5;
  }

  .file-icon {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;

    &.image {
      background: #e1f3d8;
      color: #67c23a;
    }

    &.pdf {
      background: #fde2e2;
      color: #f56c6c;
    }

    &.doc {
      background: #e1f3ff;
      color: #409eff;
    }

    &.excel {
      background: #f0f9eb;
      color: #67c23a;
    }

    &.archive {
      background: #fdf6ec;
      color: #e6a23c;
    }

    &.file {
      background: #f4f4f5;
      color: #909399;
    }
  }

  .file-info {
    flex: 1;
    min-width: 0;

    .file-name {
      font-size: 14px;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 4px;
    }

    .file-meta {
      font-size: 12px;
      color: #909399;

      .separator {
        margin: 0 6px;
      }
    }
  }

  .file-actions {
    display: flex;
    gap: 4px;
  }
}
</style>
