<template>
  <div class="branch-list">
    <el-table :data="branches" stripe border>
      <el-table-column label="分支名称" min-width="200">
        <template #default="{ row }">
          <div class="branch-name">
            <el-icon v-if="row.isMain"><Star /></el-icon>
            <el-icon v-else><Share /></el-icon>
            <span :class="{ 'main-branch': row.isMain }">{{ row.name }}</span>
            <el-tag v-if="row.isRemote" size="small" type="info">远程</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="最近提交" min-width="250">
        <template #default="{ row }">{{ row.lastCommit }}</template>
      </el-table-column>
      <el-table-column label="日期" width="120">
        <template #default="{ row }">{{ row.date }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Star, Share } from "@element-plus/icons-vue";
import { GitAPI, type Branch } from "@/api/git";
import { ElMessage } from "element-plus";

const props = defineProps<{ repo: string }>();
const branches = ref<Branch[]>([]);

async function loadBranches() {
  try {
    branches.value = await GitAPI.getBranches(props.repo);
  } catch {
    ElMessage.error("加载分支列表失败");
  }
}

onMounted(() => loadBranches());
</script>

<style scoped>
.branch-name {
  display: flex;
  align-items: center;
  gap: 6px;

  .main-branch {
    font-weight: 600;
    color: #e6a23c;
  }
}
</style>
