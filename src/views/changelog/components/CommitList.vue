<template>
  <div class="commit-list">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索提交信息..."
        clearable
        style="width: 200px"
        @input="debounceLoad"
      />
      <el-select v-model="commitType" placeholder="按类型筛选" clearable style="width: 120px" @change="loadCommits">
        <el-option label="feat" value="feat" />
        <el-option label="fix" value="fix" />
        <el-option label="perf" value="perf" />
        <el-option label="refactor" value="refactor" />
        <el-option label="chore" value="chore" />
      </el-select>
    </div>

    <!-- 提交时间线 -->
    <el-timeline>
      <el-timeline-item
        v-for="commit in commits"
        :key="commit.fullHash"
        :type="typeColor(commit.type)"
        :timestamp="commit.date"
        placement="top"
      >
        <div class="commit-item" @click="$emit('view-detail', commit.fullHash)">
          <div class="commit-header">
            <el-tag :type="typeColor(commit.type)" size="small" effect="dark">
              {{ commit.type || 'other' }}
            </el-tag>
            <span class="commit-message">{{ commit.message }}</span>
          </div>
          <div class="commit-footer">
            <el-tag size="small" type="info">{{ commit.hash }}</el-tag>
            <span class="commit-author">{{ commit.author }}</span>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadCommits"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { GitAPI, type Commit } from "@/api/git";
import { ElMessage } from "element-plus";

const props = defineProps<{ repo: string }>();
const emit = defineEmits<{ "view-detail": [hash: string] }>();

const commits = ref<Commit[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const keyword = ref("");
const commitType = ref("");
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function typeColor(type: string) {
  const map: Record<string, "success" | "danger" | "warning" | "primary" | "info"> = {
    feat: "success",
    fix: "danger",
    perf: "warning",
    refactor: "primary",
    chore: "info",
  };
  return map[type] || "info";
}

function debounceLoad() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadCommits(), 300);
}

async function loadCommits() {
  try {
    const data = await GitAPI.getCommits(props.repo, {
      page: page.value,
      pageSize,
      type: commitType.value || undefined,
      keyword: keyword.value || undefined,
    });
    commits.value = data.list;
    total.value = data.total;
  } catch {
    ElMessage.error("加载提交记录失败");
  }
}

onMounted(() => loadCommits());
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.commit-item {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  .commit-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    .commit-message {
      font-size: 13px;
      color: #303133;
      font-weight: 500;
    }
  }

  .commit-footer {
    display: flex;
    align-items: center;
    gap: 8px;

    .commit-author {
      font-size: 12px;
      color: #909399;
    }
  }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
