<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <h3>日历视图</h3>
      <div class="calendar-controls">
        <el-button @click="previousMonth"><el-icon><ArrowLeft /></el-icon></el-button>
        <span class="current-month">{{ year }}年{{ month }}月</span>
        <el-button @click="nextMonth"><el-icon><ArrowRight /></el-icon></el-button>
        <el-button @click="goToToday">今天</el-button>
      </div>
    </div>

    <div class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="weekday-header">{{ day }}</div>
      <div
        v-for="date in calendarDays"
        :key="date.date"
        class="calendar-day"
        :class="{ 'other-month': !date.isCurrentMonth, today: date.isToday }"
      >
        <div class="day-number">{{ date.day }}</div>
        <div v-if="date.events && date.events.length > 0" class="day-events">
          <div
            v-for="req in date.events.slice(0, 3)"
            :key="req.id"
            class="event-item requirement-card"
            @click="openRequirementDetail(req)"
          >
            <el-tag :type="getStatusTagType(req.status)" size="small" class="status-tag">
              {{ getStatusLabel(req.status) }}
            </el-tag>
            <span class="event-title">{{ req.title }}</span>
            <span class="commit-count" v-if="req.totalCommits > 1">
              {{ req.totalCommits }} 个提交
            </span>
          </div>
          <div v-if="date.events.length > 3" class="more-events">
            +{{ date.events.length - 3 }} 更多
          </div>
        </div>
      </div>
    </div>

    <!-- 需求详情弹窗 -->
    <el-dialog v-model="reqDetailVisible" title="需求详情" width="700px">
      <div v-if="selectedReq" class="req-detail">
        <div class="req-header">
          <h3>{{ selectedReq.title }}</h3>
          <div class="req-tags">
            <el-tag :type="getStatusTagType(selectedReq.status)" size="small">
              {{ getStatusLabel(selectedReq.status) }}
            </el-tag>
            <el-tag size="small" type="info">{{ selectedReq.priority }}</el-tag>
          </div>
        </div>

        <!-- 提交记录 -->
        <div class="commits-section">
          <h4>关联提交 ({{ selectedReq.totalCommits }})</h4>
          <div v-for="(commits, module) in selectedReq.commits" :key="module" class="module-group">
            <div class="module-label">
              <el-tag :type="module === '后端' ? 'primary' : 'success'" size="small">
                {{ module }}
              </el-tag>
            </div>
            <div class="commit-list">
              <div v-for="commit in commits" :key="commit.fullHash" class="commit-item">
                <div class="commit-subject">{{ commit.subject }}</div>
                <div class="commit-meta">
                  <span class="commit-hash">{{ commit.hash }}</span>
                  <span class="commit-author">{{ commit.author }}</span>
                  <span class="commit-date">{{ commit.date }}</span>
                </div>
                <div v-if="commit.files && commit.files.length > 0" class="commit-files">
                  <div v-for="file in commit.files.slice(0, 5)" :key="file.path" class="file-item">
                    <span class="file-path">{{ file.path }}</span>
                    <span class="file-stats">
                      <span class="additions">+{{ file.additions }}</span>
                      <span class="deletions">-{{ file.deletions }}</span>
                    </span>
                  </div>
                  <div v-if="commit.files.length > 5" class="more-files">
                    +{{ commit.files.length - 5 }} 个文件
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="reqDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { RequirementAPI } from "@/api/requirement";
import { ElMessage } from "element-plus";

const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);
const calendarData = ref<Record<string, any[]>>({});
const reqDetailVisible = ref(false);
const selectedReq = ref<any>(null);

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

const calendarDays = computed(() => {
  const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; events?: any[] }[] = [];
  const firstDay = new Date(year.value, month.value - 1, 1);
  const lastDay = new Date(year.value, month.value, 0);
  const prevMonthLastDay = new Date(year.value, month.value - 1, 0);

  const startWeekday = firstDay.getDay();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLastDay.getDate() - i;
    const date = `${year.value}-${String(month.value - 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({ date, day, isCurrentMonth: false, isToday: false, events: calendarData.value[date] || [] });
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = `${year.value}-${String(month.value).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({ date, day, isCurrentMonth: true, isToday: date === todayStr, events: calendarData.value[date] || [] });
  }

  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = `${year.value}-${String(month.value + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({ date, day, isCurrentMonth: false, isToday: false, events: calendarData.value[date] || [] });
  }

  return days;
});

async function loadCalendar() {
  try {
    const result = await RequirementAPI.getCalendarRequirements(undefined, year.value, month.value);
    calendarData.value = result?.events || {};
  } catch (error) {
    console.error("加载日历失败:", error);
    ElMessage.error("加载日历失败");
  }
}

function previousMonth() {
  if (month.value === 1) { month.value = 12; year.value--; } else { month.value--; }
  loadCalendar();
}

function nextMonth() {
  if (month.value === 12) { month.value = 1; year.value++; } else { month.value++; }
  loadCalendar();
}

function goToToday() {
  const today = new Date();
  year.value = today.getFullYear();
  month.value = today.getMonth() + 1;
  loadCalendar();
}

function getStatusTagType(status: string) {
  const map: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    done: "success", completed: "success",
    in_progress: "primary",
    in_testing: "warning", blocked: "danger",
    proposed: "info", under_review: "warning", approved: "primary",
    rejected: "danger", cancelled: "danger",
  };
  return map[status] || "info";
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    done: "已完成", completed: "已完成",
    in_progress: "进行中", blocked: "已阻塞", in_testing: "测试中",
    proposed: "待处理", under_review: "审核中", approved: "已排期",
    rejected: "已拒绝", cancelled: "已取消",
  };
  return map[status] || status;
}

function openRequirementDetail(req: any) {
  selectedReq.value = req;
  reqDetailVisible.value = true;
}

loadCalendar();
</script>

<style scoped>
.calendar-view { height: 100%; display: flex; flex-direction: column; }

.calendar-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #ebeef5;
  h3 { margin: 0; font-size: 18px; color: #303133; }
  .calendar-controls { display: flex; align-items: center; gap: 12px;
    .current-month { font-size: 16px; font-weight: 600; color: #303133; min-width: 120px; text-align: center; }
  }
}

.calendar-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;
  background: #ebeef5; border: 1px solid #ebeef5; border-radius: 6px; overflow: hidden; flex: 1;
}

.weekday-header { background: #f5f7fa; padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: #606266; }

.calendar-day {
  background: white; min-height: 100px; padding: 8px; position: relative;
  &.other-month { background: #fafafa; .day-number { color: #c0c4cc; } }
  &.today { background: #ecf5ff;
    .day-number { background: #409eff; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  }
  .day-number { font-size: 13px; color: #606266; margin-bottom: 4px; }
  .day-events { display: flex; flex-direction: column; gap: 3px;
    .requirement-card {
      padding: 4px 6px; border-radius: 4px; font-size: 11px; cursor: pointer;
      background: #f0f9eb; border-left: 3px solid #67c23a;
      transition: all 0.2s;
      &:hover { background: #e1f3d8; transform: translateX(2px); }
      .status-tag { margin-right: 4px; font-size: 10px; }
      .event-title { display: inline; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #303133; }
      .commit-count { display: block; font-size: 10px; color: #909399; margin-top: 1px; }
    }
    .more-events { font-size: 11px; color: #409eff; text-align: center; padding: 2px; cursor: pointer;
      &:hover { text-decoration: underline; }
    }
  }
}

/* 需求详情 */
.req-detail {
  .req-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
    h3 { margin: 0; font-size: 18px; color: #303133; }
    .req-tags { display: flex; gap: 6px; }
  }
  .commits-section {
    h4 { margin: 0 0 12px; font-size: 15px; color: #303133; border-bottom: 1px solid #ebeef5; padding-bottom: 8px; }
    .module-group { margin-bottom: 16px;
      .module-label { margin-bottom: 8px; }
      .commit-list { display: flex; flex-direction: column; gap: 8px; }
      .commit-item {
        padding: 10px 12px; background: #f5f7fa; border-radius: 6px;
        .commit-subject { font-size: 14px; color: #303133; margin-bottom: 6px; }
        .commit-meta { display: flex; gap: 12px; font-size: 12px; color: #909399; margin-bottom: 6px;
          .commit-hash { font-family: monospace; color: #409eff; }
        }
        .commit-files {
          .file-item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px;
            .file-path { color: #606266; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75%; }
            .file-stats { font-size: 11px;
              .additions { color: #67c23a; margin-right: 8px; }
              .deletions { color: #f56c6c; }
            }
          }
          .more-files { font-size: 11px; color: #909399; padding: 2px 0; }
        }
      }
    }
  }
}
</style>
