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
    <div v-if="!currentFile && !blameData" class="file-list">
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
    <div v-else-if="currentFile" class="file-content">
      <div class="file-header">
        <el-button @click="backToList" link>
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <span class="file-path">{{ currentFile.path }}</span>
        <el-tag size="small">{{ currentFile.language }}</el-tag>
        <span class="line-count">{{ currentFile.lines }} 行</span>
        <el-button @click="toggleBlame" type="primary" link size="small">
          {{ showBlame ? '隐藏' : '显示' }} Blame
        </el-button>
      </div>

      <!-- Blame 视图 -->
      <div v-if="showBlame && blameData" class="blame-view">
        <div class="blame-header">
          <h4>Blame 视图 - 每行最后修改信息</h4>
        </div>
        <div class="blame-content">
          <div v-for="(line, idx) in blameData.lines" :key="idx" class="blame-line">
            <span class="blame-hash">{{ line.hash }}</span>
            <span class="blame-author">{{ line.author }}</span>
            <span class="blame-date">{{ line.date }}</span>
            <span class="blame-num">{{ idx + 1 }}</span>
            <span class="blame-code" v-html="highlightCode(line.content, currentFile.language)"></span>
          </div>
        </div>
      </div>

      <!-- 普通代码视图 -->
      <div v-else class="code-viewer">
        <pre><code v-html="highlightedCode"></code></pre>
      </div>
    </div>

    <!-- Blame 加载状态 -->
    <div v-else-if="blameLoading" class="blame-loading">
      <el-skeleton :rows="10" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Folder, Document, ArrowLeft } from "@element-plus/icons-vue";
import { GitAPI, type TreeItem, type FileInfo } from "@/api/git";
import { ElMessage } from "element-plus";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

const props = defineProps<{ repo: string }>();

const items = ref<TreeItem[]>([]);
const currentPath = ref("");
const currentFile = ref<FileInfo | null>(null);
const showBlame = ref(false);
const blameData = ref<any>(null);
const blameLoading = ref(false);

const pathSegments = computed(() => {
  return currentPath.value ? currentPath.value.split("/") : [];
});

const highlightedCode = computed(() => {
  if (!currentFile.value) return "";
  const lang = currentFile.value.language || "plaintext";
  try {
    if (hljs.getLanguage(lang)) {
      return hljs.highlight(currentFile.value.content, { language: lang }).value;
    }
    return hljs.highlightAuto(currentFile.value.content).value;
  } catch {
    return currentFile.value.content;
  }
});

function highlightCode(code: string, lang: string): string {
  try {
    if (hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    return code;
  }
}

async function loadTree(path: string) {
  currentFile.value = null;
  blameData.value = null;
  showBlame.value = false;
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
      showBlame.value = false;
      blameData.value = null;
    } catch {
      ElMessage.error("加载文件内容失败");
    }
  }
}

function backToList() {
  currentFile.value = null;
  blameData.value = null;
  showBlame.value = false;
  loadTree(currentPath.value);
}

function navigateTo(seg: string) {
  const idx = pathSegments.value.indexOf(seg);
  const newPath = pathSegments.value.slice(0, idx + 1).join("/");
  loadTree(newPath);
}

async function toggleBlame() {
  if (!currentFile.value) return;

  if (showBlame.value && blameData.value) {
    showBlame.value = false;
    return;
  }

  blameLoading.value = true;
  try {
    blameData.value = await GitAPI.getBlame(props.repo, currentFile.value.path);
    showBlame.value = true;
  } catch {
    ElMessage.error("加载 Blame 信息失败");
  } finally {
    blameLoading.value = false;
  }
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
      flex-wrap: wrap;

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

    .blame-view {
      .blame-header {
        margin-bottom: 12px;
        h4 {
          margin: 0;
          font-size: 14px;
          color: #303133;
        }
      }

      .blame-content {
        max-height: 600px;
        overflow: auto;
        border: 1px solid #ebeef5;
        border-radius: 6px;

        .blame-line {
          display: flex;
          align-items: center;
          padding: 4px 12px;
          border-bottom: 1px solid #f5f7fa;
          font-size: 12px;
          gap: 12px;

          &:hover {
            background: #f5f7fa;
          }

          .blame-hash {
            font-family: monospace;
            color: #409eff;
            min-width: 60px;
          }

          .blame-author {
            color: #67c23a;
            min-width: 80px;
          }

          .blame-date {
            color: #909399;
            min-width: 80px;
          }

          .blame-num {
            color: #c0c4cc;
            min-width: 40px;
            text-align: right;
          }

          .blame-code {
            flex: 1;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 12px;
            white-space: pre;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }

    .blame-loading {
      padding: 20px;
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

        code {
          background: transparent;
          padding: 0;
        }
      }
    }
  }
}
</style>
