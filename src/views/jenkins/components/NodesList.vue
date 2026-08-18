<template>
  <div class="nodes-list">
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="loadNodes">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </div>

    <!-- 节点列表 -->
    <el-table :data="nodes" v-loading="loading" stripe>
      <el-table-column label="节点名称" min-width="200">
        <template #default="{ row }">
          <el-link type="primary" @click="viewNodeDetail(row)">{{ row.displayName || row.name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.offline ? 'danger' : 'success'" size="small">
            {{ row.offline ? "离线" : "在线" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="执行器总数" width="120">
        <template #default="{ row }">
          {{ row.numExecutors }}
        </template>
      </el-table-column>
      <el-table-column label="繁忙执行器" width="120">
        <template #default="{ row }">
          <el-tag :type="row.numExecutorsBusy > 0 ? 'warning' : 'info'" size="small">
            {{ row.numExecutorsBusy }} / {{ row.numExecutors }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="viewNodeDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 节点详情弹窗 -->
    <el-dialog v-model="nodeDetailVisible" title="节点详情" width="600px">
      <el-descriptions :column="2" border v-if="nodeDetail">
        <el-descriptions-item label="名称">{{ nodeDetail.displayName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="nodeDetail.offline ? 'danger' : 'success'">
            {{ nodeDetail.offline ? "离线" : "在线" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="执行器总数">{{ nodeDetail.numExecutors }}</el-descriptions-item>
        <el-descriptions-item label="繁忙执行器">{{ nodeDetail.numExecutorsBusy }}</el-descriptions-item>
        <el-descriptions-item label="离线原因" :span="2" v-if="nodeDetail.offlineCause">
          {{ nodeDetail.offlineCause?.shortDescription || "未知" }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="nodeDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { JenkinsAPI, type JenkinsNode } from "@/api/jenkins";
import { ElMessage } from "element-plus";

const nodes = ref<JenkinsNode[]>([]);
const loading = ref(false);
const nodeDetailVisible = ref(false);
const nodeDetail = ref<any>(null);

async function loadNodes() {
  loading.value = true;
  try {
    nodes.value = await JenkinsAPI.getNodes();
  } catch {
    ElMessage.error("加载节点失败");
  } finally {
    loading.value = false;
  }
}

async function viewNodeDetail(node: JenkinsNode) {
  try {
    // 使用 displayName 作为节点名称传递给后端
    // 后端会处理 "Built-In Node" -> "(master)" 的映射
    const nodeName = node.name || node.displayName;
    const data = await JenkinsAPI.getNodeDetail(nodeName);
    nodeDetail.value = data;
    nodeDetailVisible.value = true;
  } catch {
    ElMessage.error("加载节点详情失败");
  }
}

onMounted(() => {
  loadNodes();
});
</script>

<style scoped>
.action-bar {
  margin-bottom: 20px;
}
</style>
