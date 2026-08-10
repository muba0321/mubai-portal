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
            v-for="event in date.events.slice(0, 3)"
            :key="event.id"
            class="event-item"
            :class="getPriorityClass(event.priority)"
            @click="openDetail(event)"
          >
            <span class="event-title">{{ event.title }}</span>
          </div>
          <div v-if="date.events.length > 3" class="more-events">
            +{{ date.events.length - 3 }} 更多
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情对话框 -->
    <TodoDetailDialog
      v-model="detailVisible"
      :todo-id="selectedTodoId"
      @update="loadCalendar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { TodoExtendAPI, type TodoItem } from "@/api/todo";
import TodoDetailDialog from "./TodoDetailDialog.vue";

const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);
const calendarData = ref<Record<string, TodoItem[]>>({});
const detailVisible = ref(false);
const selectedTodoId = ref<number>();

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

const calendarDays = computed(() => {
  const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; events?: TodoItem[] }[] = [];
  const firstDay = new Date(year.value, month.value - 1, 1);
  const lastDay = new Date(year.value, month.value, 0);
  const prevMonthLastDay = new Date(year.value, month.value - 1, 0);

  // 填充上月末尾日期
  const startWeekday = firstDay.getDay();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLastDay.getDate() - i;
    const date = `${year.value}-${String(month.value - 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: false,
      events: calendarData.value[date] || [],
    });
  }

  // 填充本月日期
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = `${year.value}-${String(month.value).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: date === todayStr,
      events: calendarData.value[date] || [],
    });
  }

  // 填充下月开头日期
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = `${year.value}-${String(month.value + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: false,
      events: calendarData.value[date] || [],
    });
  }

  return days;
});

async function loadCalendar() {
  try {
    const data = await TodoExtendAPI.getCalendar(undefined, year.value, month.value);
    calendarData.value = data.events || {};
  } catch (error) {
    console.error("加载日历失败:", error);
  }
}

function previousMonth() {
  if (month.value === 1) {
    month.value = 12;
    year.value--;
  } else {
    month.value--;
  }
  loadCalendar();
}

function nextMonth() {
  if (month.value === 12) {
    month.value = 1;
    year.value++;
  } else {
    month.value++;
  }
  loadCalendar();
}

function goToToday() {
  const today = new Date();
  year.value = today.getFullYear();
  month.value = today.getMonth() + 1;
  loadCalendar();
}

function getPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    urgent: "urgent",
    high: "high",
    medium: "medium",
    low: "low",
  };
  return map[priority] || "medium";
}

function openDetail(todo: TodoItem) {
  selectedTodoId.value = todo.id;
  detailVisible.value = true;
}

// 初始化加载
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

  h3 {
    margin: 0;
    font-size: 18px;
    color: #303133;
  }

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

    .day-number {
      color: #c0c4cc;
    }
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
      transition: all 0.3s;

      &:hover {
        opacity: 0.8;
      }

      &.urgent {
        background: #fde2e2;
        color: #f56c6c;
      }

      &.high {
        background: #fdf6ec;
        color: #e6a23c;
      }

      &.medium {
        background: #f4f4f5;
        color: #909399;
      }

      &.low {
        background: #f0f9eb;
        color: #67c23a;
      }

      .event-title {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .more-events {
      font-size: 11px;
      color: #909399;
      text-align: center;
      padding: 2px;
    }
  }
}
</style>
