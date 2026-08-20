<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <h3>日历视图</h3>
      <div class="calendar-controls">
        <el-button @click="previousMonth">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="current-month">{{ year }}年{{ month }}月</span>
        <el-button @click="nextMonth">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button @click="goToToday">今天</el-button>
      </div>
    </div>

    <div class="calendar-grid">
      <!-- 星期标题 -->
      <div v-for="day in weekDays" :key="day" class="weekday-header">
        {{ day }}
      </div>

      <!-- 日期格子 -->
      <div
        v-for="date in calendarDays"
        :key="date.date"
        class="calendar-day"
        :class="{
          'other-month': !date.isCurrentMonth,
          today: date.isToday,
        }"
      >
        <div class="day-number">{{ date.day }}</div>
        <div v-if="date.events && date.events.length > 0" class="day-events">
          <div
            v-for="(event, idx) in date.events.slice(0, 3)"
            :key="event.hash || event.id"
            class="event-item"
            :class="getEventClass(event)"
            @click="openEventDetail(event)"
          >
            <span class="event-module" v-if="event.module">{{ event.module }}</span>
            <span class="event-title">{{ event.subject || event.title }}</span>
          </div>
          <div v-if="date.events.length > 3" class="more-events" @click="openDayDetail(date)">
            +{{ date.events.length - 3 }} 更多
          </div>
        </div>
      </div>
    </div>

    <!-- 提交详情对话框 -->
    <el-dialog
      v-model="commitDetailVisible"
      title="提交详情"
      width="600px"
    >
      <div v-if="selectedCommit" class="commit-detail">
        <div class="commit-header">
          <el-tag :type="selectedCommit.module === '后端' ? 'primary' : 'success'" size="small">
            {{ selectedCommit.module }}
          </el-tag>
          <el-tag type="info" size="small" style="margin-left: 8px;">
            {{ selectedCommit.hash }}
          </el-tag>
        </div>
        <h4 style="margin: 12px 0 8px;">{{ selectedCommit.subject }}</h4>
        <div class="commit-meta">
          <span>作者: {{ selectedCommit.author }}</span>
          <span>日期: {{ selectedCommit.date }}</span>
        </div>
        <div v-if="selectedCommit.files && selectedCommit.files.length > 0" class="commit-files">
          <h5 style="margin: 12px 0 8px; color: #606266;">文件变更 ({{ selectedCommit.files.length }})</h5>
          <div class="file-list">
            <div v-for="file in selectedCommit.files" :key="file.path" class="file-item">
              <span class="file-path">{{ file.path }}</span>
              <span class="file-stats">
                <span class="additions">+{{ file.additions }}</span>
                <span class="deletions">-{{ file.deletions }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="commitDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 日详情对话框 -->
    <el-dialog
      v-model="dayDetailVisible"
      :title="`${selectedDay} 提交记录`"
      width="700px"
    >
      <div v-if="dayEvents.length > 0" class="day-events-list">
        <div
          v-for="event in dayEvents"
          :key="event.hash || event.id"
          class="day-event-item"
          @click="openEventDetail(event)"
        >
          <el-tag :type="event.module === '后端' ? 'primary' : 'success'" size="small">
            {{ event.module }}
          </el-tag>
          <span class="day-event-subject">{{ event.subject || event.title }}</span>
          <span class="day-event-hash">{{ event.hash }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无记录" />
      <template #footer>
        <el-button @click="dayDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import request from "@/utils/request";
import { ElMessage } from "element-plus";

const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);
const calendarData = ref<Record<string, any[]>>({});
const commitDetailVisible = ref(false);
const dayDetailVisible = ref(false);
const selectedCommit = ref<any>(null);
const selectedDay = ref("");
const dayEvents = ref<any[]>([]);

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
    const { data } = await request({
      url: "/api/v1/requirements/calendar/commits",
      method: "get",
      params: { year: year.value, month: month.value },
    });
    calendarData.value = data?.events || {};
  } catch (error) {
    console.error("加载日历失败:", error);
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

function getEventClass(event: any): string {
  if (event.module === "后端") return "backend";
  if (event.module === "前端") return "frontend";
  return "default";
}

function openEventDetail(event: any) {
  selectedCommit.value = event;
  commitDetailVisible.value = true;
}

function openDayDetail(date: any) {
  selectedDay.value = date.date;
  dayEvents.value = date.events || [];
  dayDetailVisible.value = true;
}

loadCalendar();
</script>

<style scoped>
.calendar-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;

  h3 { margin: 0; font-size: 18px; color: #303133; }

  .calendar-controls {
    display: flex;
    align-items: center;
    gap: 12px;

    .current-month {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      min-width: 120px;
      text-align: center;
    }
  }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #ebeef5;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  flex: 1;
}

.weekday-header {
  background: #f5f7fa;
  padding: 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.calendar-day {
  background: white;
  min-height: 100px;
  padding: 8px;
  position: relative;

  &.other-month {
    background: #fafafa;
    .day-number { color: #c0c4cc; }
  }

  &.today {
    background: #ecf5ff;
    .day-number {
      background: #409eff;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .day-number {
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }

  .day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .event-item {
      padding: 4px 6px;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: all 0.2s;

      &:hover { opacity: 0.8; transform: translateX(2px); }

      &.backend { background: #ecf5ff; color: #409eff; border-left: 3px solid #409eff; }
      &.frontend { background: #f0f9eb; color: #67c23a; border-left: 3px solid #67c23a; }
      &.default { background: #f4f4f5; color: #909399; }

      .event-module {
        font-size: 10px;
        margin-right: 4px;
        opacity: 0.7;
      }

      .event-title {
        display: inline;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .more-events {
      font-size: 11px;
      color: #409eff;
      text-align: center;
      padding: 2px;
      cursor: pointer;
      &:hover { text-decoration: underline; }
    }
  }
}

/* 提交详情 */
.commit-detail {
  .commit-header {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }

  .commit-meta {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: #909399;
    margin-bottom: 12px;
  }

  .commit-files {
    .file-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
      background: #f5f7fa;
      font-size: 13px;

      .file-path {
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 70%;
      }

      .file-stats {
        font-size: 12px;

        .additions { color: #67c23a; margin-right: 8px; }
        .deletions { color: #f56c6c; }
      }
    }
  }
}

/* 日详情列表 */
.day-events-list {
  .day-event-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    background: #f5f7fa;
    transition: all 0.2s;

    &:hover {
      background: #ecf5ff;
      transform: translateX(4px);
    }

    .day-event-subject {
      flex: 1;
      font-size: 14px;
      color: #303133;
    }

    .day-event-hash {
      font-size: 12px;
      color: #909399;
      font-family: monospace;
    }
  }
}
</style>
