<template>
  <div class="ops-history">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>作业历史</span>
          <div class="header-actions">
            <el-select v-model="statusFilter" placeholder="状态筛选" clearable size="small" style="width: 120px" @change="fetchData">
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option label="部分成功" value="partial" />
              <el-option label="超时" value="timeout" />
            </el-select>
            <el-button size="small" @click="fetchData"><el-icon><Refresh /></el-icon> 刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="jobs" v-loading="loading" stripe>
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="作业名称" prop="jobName" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" prop="jobType" width="90">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.jobType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标主机" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row.targets || []).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" prop="duration" width="80" align="center">
          <template #default="{ row }">
            {{ row.duration }}s
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="createdBy" width="90" />
        <el-table-column label="执行时间" prop="createdAt" width="170" />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          small
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="作业详情" width="900px" top="5vh">
      <div v-if="detail" class="job-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="作业名称">{{ detail.jobName }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ detail.jobType }}</el-descriptions-item>
          <el-descriptions-item label="模块">{{ detail.module }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.status)" size="small">{{ statusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">{{ detail.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ detail.duration }}s</el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="2">{{ detail.startedAt }}</el-descriptions-item>
          <el-descriptions-item label="目标主机" :span="2">{{ (detail.targets || []).join(", ") }}</el-descriptions-item>
          <el-descriptions-item label="命令内容" :span="2">
            <pre class="inline-code">{{ detail.moduleArgs }}</pre>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="detail.results" class="results-section" style="margin-top: 16px">
          <h4>执行结果</h4>
          <el-collapse>
            <el-collapse-item v-for="(result, host) in detail.results" :key="host" :title="host" :name="host">
              <el-tag :type="result.status === 'success' ? 'success' : 'danger'" size="small" style="margin-bottom: 8px">
                {{ result.status === 'success' ? '成功' : '失败' }} (exit: {{ result.exit_code }})
              </el-tag>
              <pre class="output-box">{{ result.output || result.error || '(无输出)' }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import AnsibleAPI, { type AnsibleJob, type AnsibleJobDetail } from "@/api/ansible";
import { ElMessage } from "element-plus";

defineOptions({ name: "AnsibleHistory" });

const loading = ref(false);
const jobs = ref<AnsibleJob[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const statusFilter = ref("");

const detailVisible = ref(false);
const detail = ref<AnsibleJobDetail | null>(null);

function statusType(status: string): "success" | "danger" | "warning" | "info" {
  const map: Record<string, "success" | "danger" | "warning" | "info"> = {
    success: "success", failed: "danger", partial: "warning", timeout: "warning", running: "info", pending: "info",
  };
  return map[status] || "info";
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    success: "成功", failed: "失败", partial: "部分成功", timeout: "超时", running: "执行中", pending: "等待",
  };
  return map[status] || status;
}

async function fetchData() {
  loading.value = true;
  try {
    const data = await AnsibleAPI.listJobs({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      status: statusFilter.value || undefined,
    });
    jobs.value = data?.list || [];
    total.value = data?.total || 0;
  } catch { /* ignored */ } finally {
    loading.value = false;
  }
}

async function viewDetail(job: AnsibleJob) {
  try {
    detail.value = await AnsibleAPI.getJob(job.id);
    detailVisible.value = true;
  } catch {
    ElMessage.error("获取详情失败");
  }
}

onMounted(() => { fetchData(); });
</script>

<style scoped>
.ops-history { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
.inline-code { margin: 0; padding: 4px 8px; background: #f5f7fa; border-radius: 4px; font-size: 13px; font-family: monospace; }
.output-box {
  background: #0d1117; color: #c9d1d9; padding: 12px; border-radius: 6px;
  font-family: "JetBrains Mono", "Fira Code", monospace; font-size: 13px;
  line-height: 1.5; max-height: 300px; overflow: auto; white-space: pre-wrap;
  word-break: break-all; margin: 0;
}
</style>
