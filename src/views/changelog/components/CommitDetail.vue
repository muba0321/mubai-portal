<template>
  <div class="commit-detail" v-loading="loading">
    <div v-if="detail" class="detail-content">
      <!-- 提交信息 -->
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="Hash" :span="2">
          <el-tag type="info">{{ detail.hash }}</el-tag>
          <span class="full-hash">{{ detail.fullHash }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="作者">{{ detail.author }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ detail.date }}</el-descriptions-item>
        <el-descriptions-item label="主题" :span="2">{{ detail.subject }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.body" label="详情" :span="2">
          <pre class="commit-body">{{ detail.body }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="统计">
          <el-tag type="success">+{{ detail.stats.added }}</el-tag>
          <el-tag type="danger">-{{ detail.stats.deleted }}</el-tag>
          <span class="file-count">{{ detail.stats.files }} 个文件</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 变更文件列表 -->
      <div class="files-section">
        <h4>变更文件 ({{ detail.files.length }})</h4>
        <el-table :data="detail.files" size="small" stripe>
          <el-table-column label="文件路径" min-width="300">
            <template #default="{ row }">
              <span class="file-path">{{ row.path }}</span>
            </template>
          </el-table-column>
          <el-table-column label="新增" width="80" align="center">
            <template #default="{ row }">
              <span class="add-count" v-if="row.added > 0">+{{ row.added }}</span>
            </template>
          </el-table-column>
          <el-table-column label="删除" width="80" align="center">
            <template #default="{ row }">
              <span class="del-count" v-if="row.deleted > 0">-{{ row.deleted }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { GitAPI, type CommitDetail } from "@/api/git";
import { ElMessage } from "element-plus";

const props = defineProps<{
  repo: string;
  hash: string;
}>();

const detail = ref<CommitDetail | null>(null);
const loading = ref(true);

async function loadDetail() {
  loading.value = true;
  try {
    detail.value = await GitAPI.getCommitDetail(props.repo, props.hash);
  } catch {
    ElMessage.error("加载提交详情失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadDetail());
</script>

<style scoped>
.commit-detail {
  .full-hash {
    font-family: monospace;
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }

  .commit-body {
    margin: 0;
    white-space: pre-wrap;
    font-size: 13px;
    color: #606266;
  }

  .file-count {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }

  .files-section {
    margin-top: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #303133;
    }

    .file-path {
      font-family: monospace;
      font-size: 12px;
    }

    .add-count {
      color: #67c23a;
      font-weight: 600;
    }

    .del-count {
      color: #f56c6c;
      font-weight: 600;
    }
  }
}
</style>
