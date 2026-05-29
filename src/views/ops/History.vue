<template>
  <div class="ops-history">
    <el-card shadow="never">
      <!-- 筛选栏 -->
      <el-form :inline="true" :model="queryParams" class="filter-bar">
        <el-form-item label="作业状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="超时" value="timeout" />
            <el-option label="执行中" value="running" />
          </el-select>
        </el-form-item>
        <el-form-item label="作业类型">
          <el-select v-model="queryParams.type" clearable placeholder="全部" style="width: 130px">
            <el-option label="Ad-Hoc" value="ad_hoc" />
            <el-option label="Playbook" value="playbook" />
            <el-option label="Script" value="script" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table :data="jobList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="job_name" label="作业名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="job_type" label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTag(row.job_type)">
              {{ typeLabel(row.job_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.targets.join(", ") }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTag(row.status)">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by" label="执行者" width="90" />
        <el-table-column prop="started_at" label="开始时间" width="170" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchJobs"
          @current-change="fetchJobs"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="作业详情" width="800px" destroy-on-close>
      <template v-if="currentJob">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentJob.id }}</el-descriptions-item>
          <el-descriptions-item label="作业名称">{{ currentJob.job_name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeLabel(currentJob.job_type) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(currentJob.status)">{{ statusLabel(currentJob.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="目标">{{ currentJob.targets.join(", ") }}</el-descriptions-item>
          <el-descriptions-item label="执行者">{{ currentJob.created_by }}</el-descriptions-item>
          <el-descriptions-item label="模块" v-if="currentJob.module">{{ currentJob.module }}</el-descriptions-item>
          <el-descriptions-item label="参数" v-if="currentJob.module_args">{{ currentJob.module_args }}</el-descriptions-item>
          <el-descriptions-item label="Playbook" v-if="currentJob.playbook_path" :span="2">{{ currentJob.playbook_path }}</el-descriptions-item>
          <el-descriptions-item label="脚本" v-if="currentJob.script_path" :span="2">{{ currentJob.script_path }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentJob.started_at }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentJob.finished_at }}</el-descriptions-item>
        </el-descriptions>

        <!-- 输出 -->
        <div v-if="currentJob.result" style="margin-top: 16px">
          <h4>执行输出</h4>
          <pre class="output-box">{{ formatResult(currentJob.result) }}</pre>
        </div>
        <div v-if="currentJob.error_msg" style="margin-top: 8px">
          <el-alert type="error" :title="currentJob.error_msg" :closable="false" show-icon />
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import AnsibleAPI, { type AnsibleJob } from "@/api/ansible";
import { ElMessage } from "element-plus";

defineOptions({ name: "AnsibleHistory" });

const loading = ref(false);
const jobList = ref<AnsibleJob[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const currentJob = ref<AnsibleJob | null>(null);

const queryParams = reactive({
  page: 1,
  per_page: 20,
  status: "" as string,
  type: "" as string,
});

function typeLabel(t: string) {
  const map: Record<string, string> = { ad_hoc: "Ad-Hoc", playbook: "Playbook", script: "Script" };
  return map[t] || t;
}

function typeTag(t: string) {
  const map: Record<string, string> = { ad_hoc: "", playbook: "success", script: "warning" };
  return map[t] || "info";
}

function statusLabel(s: string) {
  const map: Record<string, string> = { success: "成功", failed: "失败", timeout: "超时", running: "执行中" };
  return map[s] || s;
}

function statusTag(s: string) {
  const map: Record<string, string> = { success: "success", failed: "danger", timeout: "warning", running: "info" };
  return map[s] || "info";
}

function formatResult(result: any): string {
  if (typeof result === "string") return result;
  if (result?.stdout) return result.stdout + (result.stderr ? "\n--- STDERR ---\n" + result.stderr : "");
  return JSON.stringify(result, null, 2);
}

async function fetchJobs() {
  loading.value = true;
  try {
    const res = await AnsibleAPI.listJobs({
      page: queryParams.page,
      per_page: queryParams.per_page,
    });
    jobList.value = res.items;
    total.value = res.total;
  } catch {
    ElMessage.error("获取作业列表失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.page = 1;
  fetchJobs();
}

function handleReset() {
  queryParams.status = "";
  queryParams.type = "";
  queryParams.page = 1;
  fetchJobs();
}

function viewDetail(job: AnsibleJob) {
  currentJob.value = job;
  detailVisible.value = true;
}

fetchJobs();
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.pagination-bar { margin-top: 16px; display: flex; justify-content: flex-end; }
.output-box {
  background: #0d1117; color: #c9d1d9; padding: 12px; border-radius: 6px;
  font-family: "JetBrains Mono", "Fira Code", monospace; font-size: 12px;
  max-height: 400px; overflow: auto; white-space: pre-wrap; word-break: break-all;
}
</style>
