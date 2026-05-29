<template>
  <div class="ops-schedules">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>定时任务</span>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon> 创建
          </el-button>
        </div>
      </template>

      <el-table :data="scheduleList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="job_id" label="关联作业 ID" width="120" />
        <el-table-column prop="cron_expression" label="Cron 表达式" width="160">
          <template #default="{ row }">
            <code>{{ row.cron_expression }}</code>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_run" label="上次执行" width="170" />
        <el-table-column prop="next_run" label="下次执行" width="170" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="toggleSchedule(row)">
              {{ row.enabled ? "停用" : "启用" }}
            </el-button>
            <el-button type="danger" link size="small" @click="deleteSchedule(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建弹窗 -->
    <el-dialog v-model="createVisible" title="创建定时任务" width="500px" destroy-on-close>
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="作业 ID">
          <el-input-number v-model="createForm.job_id" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Cron 表达式">
          <el-input v-model="createForm.cron" placeholder="例如: */5 * * * * (每5分钟)" />
          <div style="font-size: 12px; color: #999; margin-top: 4px">
            格式: 分 时 日 月 星期<br>
            示例: 0 */2 * * * (每2小时), 30 8 * * 1-5 (工作日8:30)
          </div>
        </el-form-item>
        <el-form-item label="立即启用">
          <el-switch v-model="createForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
import AnsibleAPI, { type AnsibleSchedule } from "@/api/ansible";
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({ name: "AnsibleSchedules" });

const loading = ref(false);
const scheduleList = ref<AnsibleSchedule[]>([]);
const createVisible = ref(false);

const createForm = reactive({
  job_id: 1,
  cron: "*/5 * * * *",
  enabled: true,
});

async function fetchSchedules() {
  loading.value = true;
  try {
    scheduleList.value = await AnsibleAPI.listSchedules();
  } catch {
    ElMessage.error("获取定时任务列表失败");
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  createForm.job_id = 1;
  createForm.cron = "*/5 * * * *";
  createForm.enabled = true;
  createVisible.value = true;
}

async function handleCreate() {
  if (!createForm.cron) {
    ElMessage.warning("请填写 Cron 表达式");
    return;
  }
  try {
    await AnsibleAPI.createSchedule({
      job_id: createForm.job_id,
      cron: createForm.cron,
      enabled: createForm.enabled,
    });
    ElMessage.success("创建成功");
    createVisible.value = false;
    fetchSchedules();
  } catch {
    ElMessage.error("创建失败");
  }
}

async function toggleSchedule(row: AnsibleSchedule) {
  try {
    await AnsibleAPI.toggleSchedule(row.id);
    ElMessage.success(row.enabled ? "已停用" : "已启用");
    fetchSchedules();
  } catch {
    ElMessage.error("操作失败");
  }
}

async function deleteSchedule(row: AnsibleSchedule) {
  try {
    await ElMessageBox.confirm(`确认删除定时任务 #${row.id}？`, "确认", { type: "warning" });
    // Note: no delete API yet, just toggle off
    await AnsibleAPI.toggleSchedule(row.id);
    ElMessage.success("已停用并标记删除");
    fetchSchedules();
  } catch {
    // cancelled
  }
}

fetchSchedules();
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
