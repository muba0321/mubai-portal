<template>
  <div class="file-browser">
    <!-- 路径导航 -->
    <div class="breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item @click="navigateTo('')">根目录</el-breadcrumb-item>
        <el-breadcrumb-item v-for="seg in pathSegments" :key="seg">
          <a @click="navigateTo(seg)">{{ seg }}</a>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 文件列表 / 文件内容 -->
    <div v-if="!currentFile" class="file-list">
      <el-table :data="items" stripe border highlight-current-row @row-click="onRowClick">
        <el-table-column label="名称" min-width="300">
          <template #default="{ row }">
            <div class="file-name">
              <el-icon v-if="row.type === 'dir'" color="#e6a23c"><Folder /></el-icon>
              <el-icon v-else color="#409eff"><Document /></el-icon>
              <span :class="{ 'dir-name': row.type === 'dir' }">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'dir' ? 'warning' : 'primary'" size="small">
              {{ row.type === 'dir' ? '目录' : '文件' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 文件内容查看 -->
    <div v-else class="file-content">
      <div class="file-header">
        <el-button @click="backToList" link>
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <span class="file-path">{{ currentFile.path }}</span>
        <el-tag size="small">{{ currentFile.language }}</el-tag>
        <span class="line-count">{{ currentFile.lines }} 行</span>
      </div>
      <div class="code-viewer">
        <pre><code>{{ currentFile.content }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Folder, Document, ArrowLeft } from "@element-plus/icons-vue";
import { GitAPI, type TreeItem, type FileInfo } from "@/api/git";
import { ElMessage } from "element-plus";

const props = defineProps<{ repo: string }>();

const items = ref<TreeItem[]>([]);
const currentPath = ref("");
const currentFile = ref<FileInfo | null>(null);

const pathSegments = computed(() => {
  return currentPath.value ? currentPath.value.split("/") : [];
});

async function loadTree(path: string) {
  currentFile.value = null;
  currentPath.value = path;
  try {
    const data = await GitAPI.getTree(props.repo, { path: path || undefined });
    items.value = data.items;
  } catch {
    ElMessage.error("加载文件列表失败");
  }
}

async function onRowClick(row: TreeItem) {
  if (row.type === "dir") {
    loadTree(row.path);
  } else {
    try {
      currentFile.value = await GitAPI.getFile(props.repo, { path: row.path });
    } catch {
      ElMessage.error("加载文件内容失败");
    }
  }
}

function backToList() {
  currentFile.value = null;
  loadTree(currentPath.value);
}

function navigateTo(seg: string) {
  const idx = pathSegments.value.indexOf(seg);
  const newPath = pathSegments.value.slice(0, idx + 1).join("/");
  loadTree(newPath);
}

onMounted(() => loadTree(""));
</script>

<style scoped>
.file-browser {
  .breadcrumb {
    margin-bottom: 16px;
    padding: 8px 0;

    :deep(.el-breadcrumb__inner) {
      cursor: pointer;
    }
    :deep(.el-breadcrumb__inner:hover) {
      color: var(--el-color-primary);
    }
  }

  .file-name {
    display: flex;
    align-items: center;
    gap: 8px;

    .dir-name {
      font-weight: 600;
    }
  }

  .file-content {
    .file-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #ebeef5;
      margin-bottom: 12px;

      .file-path {
        font-family: monospace;
        font-size: 13px;
        color: #606266;
      }

      .line-count {
        font-size: 12px;
        color: #909399;
      }
    }

    .code-viewer {
      max-height: 600px;
      overflow: auto;

      pre {
        margin: 0;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 6px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #303133;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }
}
</style>
