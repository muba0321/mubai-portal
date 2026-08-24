<template>
  <div class="knowledge-container">
    <!-- 顶部工具栏 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索知识库..."
          clearable
          style="width: 400px"
          @input="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div>
          <el-button @click="refreshTree" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
          <el-button type="primary" @click="handleSync" :loading="syncing">
            <el-icon><Upload /></el-icon> 同步
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" style="height: calc(100vh - 160px)">
      <!-- 左侧递归目录树 -->
      <el-col :span="6">
        <el-card shadow="never" style="height: 100%">
          <template #header><span>知识库目录</span></template>
          <div style="overflow-y: auto; overflow-x: auto; max-height: calc(100vh - 240px); min-width: 100%">
            <tree-node
              v-for="node in treeData"
              :key="node.name || node.path"
              :node="node"
              :depth="0"
              :selected-file="selectedFile"
              @open-file="openFile"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :span="18">
        <el-card shadow="never" style="height: 100%">
          <!-- 搜索结果 -->
          <div v-if="searchResults.length > 0" style="padding: 10px 0">
            <div style="margin-bottom: 12px; font-weight: 600">搜索结果：{{ searchResults.length }} 条</div>
            <div v-for="item in searchResults" :key="item.path" class="search-item" @click="openFile(item)">
              <div class="search-title">{{ item.title }}</div>
              <div class="search-meta">
                <el-tag size="small">{{ item.category }}</el-tag>
                <span>{{ item.wordCount }} 字</span>
                <span>{{ item.modifiedAt }}</span>
              </div>
            </div>
          </div>

          <!-- 文件阅读器 -->
          <div v-else-if="fileContent" style="padding: 10px 0">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ebeef5">
              <el-button text @click="fileContent = null; selectedFile = ''">
                <el-icon><ArrowLeft /></el-icon> 返回
              </el-button>
              <h3 style="margin: 0">{{ fileContent.title }}</h3>
              <el-tag size="small">{{ fileContent.category }}</el-tag>
              <el-tag v-if="fileContent.fileExt" size="small" type="success">{{ fileContent.fileExt }}</el-tag>
              <span style="font-size: 12px; color: #909399">{{ fileContent.wordCount }} 字</span>
            </div>
            <!-- Markdown 渲染 -->
            <div v-if="isMarkdown" class="markdown-body" v-html="renderedContent"></div>
            <!-- 代码展示 -->
            <pre v-else class="code-body"><code>{{ fileContent.content }}</code></pre>
          </div>

          <!-- 空状态 -->
          <div v-else style="display: flex; align-items: center; justify-content: center; height: 400px; color: #909399">
            <el-empty description="选择文件或搜索内容" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Search, Refresh, Upload, ArrowLeft } from "@element-plus/icons-vue";
import { KnowledgeAPI, type KbFileItem, type KbFileContent } from "@/api/knowledge-base";
import { ElMessage } from "element-plus";
import { marked } from "marked";
import TreeNode from "./components/TreeNode.vue";

const treeData = ref<any[]>([]);
const loading = ref(false);
const syncing = ref(false);
const searchKeyword = ref("");
const searchResults = ref<KbFileItem[]>([]);
const fileContent = ref<KbFileContent | null>(null);
const selectedFile = ref("");

const renderedContent = computed(() => {
  if (!fileContent.value?.content) return "";
  return marked(fileContent.value.content) as string;
});

const isMarkdown = computed(() => {
  const ext = fileContent.value?.fileExt?.toLowerCase();
  return ext === ".md";
});

async function loadTree() {
  loading.value = true;
  try {
    treeData.value = await KnowledgeAPI.getTree();
  } catch {
    ElMessage.error("加载目录失败");
  } finally {
    loading.value = false;
  }
}

async function openFile(file: KbFileItem) {
  selectedFile.value = file.path;
  searchResults.value = [];
  try {
    fileContent.value = await KnowledgeAPI.getFileContent(file.path);
  } catch {
    ElMessage.error("加载文件失败");
  }
}

async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    fileContent.value = null;
    return;
  }
  try {
    searchResults.value = await KnowledgeAPI.search(searchKeyword.value);
    fileContent.value = null;
  } catch {
    ElMessage.error("搜索失败");
  }
}

async function handleSync() {
  syncing.value = true;
  try {
    await KnowledgeAPI.triggerSync();
    ElMessage.success("同步完成");
    loadTree();
  } catch {
    ElMessage.error("同步失败");
  } finally {
    syncing.value = false;
  }
}

function refreshTree() {
  loadTree();
}

onMounted(() => {
  loadTree();
});
</script>

<style scoped>
.knowledge-container {
  padding: 20px;
}

.search-item {
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.search-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.search-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #303133;
}

.search-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.markdown-body {
  line-height: 1.8;
  color: #303133;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin-top: 24px;
  margin-bottom: 12px;
}

.markdown-body :deep(code) {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.markdown-body :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  background: transparent;
  color: inherit;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #ebeef5;
  padding: 8px 12px;
}

.markdown-body :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  color: #606266;
  margin: 16px 0;
}

.code-body {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: "Courier New", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 70vh;
}
</style>
