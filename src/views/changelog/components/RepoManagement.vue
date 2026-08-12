<template>
  <div class="repo-management">
    <!-- 仓库选择 -->
    <div class="repo-tabs">
      <el-radio-group v-model="activeRepo" size="large" @change="onRepoChange">
        <el-radio-button value="frontend">
          <el-icon><Monitor /></el-icon> 前端仓库
        </el-radio-button>
        <el-radio-button value="backend">
          <el-icon><Cpu /></el-icon> 后端仓库
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 功能 Tab -->
    <el-card shadow="never" class="repo-card">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="仓库概览" name="overview">
          <OverviewPanel :repo="repoInfo" />
        </el-tab-pane>
        <el-tab-pane label="提交历史" name="commits">
          <CommitList
            :repo="activeRepo"
            @view-detail="viewCommitDetail"
          />
        </el-tab-pane>
        <el-tab-pane label="分支" name="branches">
          <BranchList :repo="activeRepo" />
        </el-tab-pane>
        <el-tab-pane label="标签" name="tags">
          <TagList :repo="activeRepo" />
        </el-tab-pane>
        <el-tab-pane label="文件浏览" name="files">
          <FileBrowser :repo="activeRepo" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 提交详情弹窗 -->
    <el-dialog v-model="detailVisible" title="提交详情" width="800px">
      <CommitDetail
        v-if="detailVisible"
        :repo="activeRepo"
        :hash="selectedHash"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Monitor, Cpu } from "@element-plus/icons-vue";
import { GitAPI, type RepoInfo } from "@/api/git";
import { ElMessage } from "element-plus";
import OverviewPanel from "./OverviewPanel.vue";
import CommitList from "./CommitList.vue";
import BranchList from "./BranchList.vue";
import TagList from "./TagList.vue";
import FileBrowser from "./FileBrowser.vue";
import CommitDetail from "./CommitDetail.vue";

const activeRepo = ref("frontend");
const activeTab = ref("overview");
const repoInfo = ref<RepoInfo | null>(null);
const detailVisible = ref(false);
const selectedHash = ref("");

async function loadRepoInfo() {
  try {
    repoInfo.value = await GitAPI.getRepo(activeRepo.value);
  } catch {
    ElMessage.error("加载仓库信息失败");
  }
}

function onRepoChange() {
  loadRepoInfo();
}

function onTabChange() {
  // tab 切换时子组件自行加载数据
}

function viewCommitDetail(hash: string) {
  selectedHash.value = hash;
  detailVisible.value = true;
}

onMounted(() => {
  loadRepoInfo();
});
</script>

<style scoped>
.repo-management {
  padding: 0;
}

.repo-tabs {
  margin-bottom: 16px;
}

.repo-card {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}
</style>
