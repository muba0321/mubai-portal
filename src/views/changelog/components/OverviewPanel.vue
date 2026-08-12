<template>
  <div class="overview-panel">
    <el-row :gutter="20">
      <!-- 仓库信息卡片 -->
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">仓库信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="仓库名称" :span="2">
              <el-link :href="repo?.github" target="_blank" type="primary">
                {{ repo?.name }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="描述">{{ repo?.description }}</el-descriptions-item>
            <el-descriptions-item label="路径">{{ repo?.path }}</el-descriptions-item>
            <el-descriptions-item label="总提交数">
              <el-tag type="primary">{{ repo?.totalCommits }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="分支数">
              <el-tag>{{ repo?.branchCount }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Tag 数">
              <el-tag type="success">{{ repo?.tagCount }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 最新提交 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">最新提交</span>
          </template>
          <div v-if="repo?.latestCommit" class="latest-commit">
            <div class="commit-hash">
              <el-tag size="small" type="info">{{ repo.latestCommit.hash }}</el-tag>
            </div>
            <div class="commit-msg">{{ repo.latestCommit.message }}</div>
            <div class="commit-meta">
              <span>{{ repo.latestCommit.author }}</span>
              <span>{{ repo.latestCommit.date }}</span>
            </div>
          </div>
        </el-card>

        <!-- 贡献者 -->
        <el-card shadow="hover" style="margin-top: 16px">
          <template #header>
            <span class="card-title">最近贡献者</span>
          </template>
          <div class="contributors">
            <el-tag
              v-for="c in repo?.contributors"
              :key="c"
              size="small"
              style="margin: 4px"
            >
              {{ c }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import type { RepoInfo } from "@/api/git";

defineProps<{
  repo: RepoInfo | null;
}>();
</script>

<style scoped>
.card-title {
  font-weight: 600;
  font-size: 14px;
}

.latest-commit {
  .commit-hash {
    margin-bottom: 8px;
  }
  .commit-msg {
    font-size: 13px;
    color: #303133;
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .commit-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #909399;
  }
}

.contributors {
  display: flex;
  flex-wrap: wrap;
}
</style>
