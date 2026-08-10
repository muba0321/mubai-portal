<template>
  <div class="statistics-view">
    <div class="stats-header">
      <h3>统计分析</h3>
      <el-select v-model="selectedProject" placeholder="选择项目" clearable @change="loadStatistics">
        <el-option
          v-for="project in projects"
          :key="project.id"
          :label="project.name"
          :value="project.id"
        />
      </el-select>
    </div>

    <div v-if="stats" class="stats-content">
      <!-- 总览卡片 -->
      <div class="overview-cards">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </el-card>
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value success">{{ stats.statusStats?.completed || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value primary">{{ stats.statusStats?.in_progress || 0 }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </el-card>
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value warning">{{ stats.statusStats?.pending || 0 }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-card>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <!-- 状态分布 -->
        <el-card shadow="hover">
          <template #header>
            <span>状态分布</span>
          </template>
          <div ref="statusChartRef" class="chart-container"></div>
        </el-card>

        <!-- 优先级分布 -->
        <el-card shadow="hover">
          <template #header>
            <span>优先级分布</span>
          </template>
          <div ref="priorityChartRef" class="chart-container"></div>
        </el-card>

        <!-- 完成趋势 -->
        <el-card shadow="hover" class="trend-card">
          <template #header>
            <span>近 30 天完成趋势</span>
          </template>
          <div ref="trendChartRef" class="chart-container-large"></div>
        </el-card>
      </div>

      <!-- 负责人工作量 -->
      <el-card v-if="Object.keys(stats.assigneeStats || {}).length > 0" shadow="hover">
        <template #header>
          <span>负责人工作量</span>
        </template>
        <el-table :data="assigneeTableData" stripe>
          <el-table-column prop="assignee" label="负责人" />
          <el-table-column prop="total" label="总任务数" />
          <el-table-column prop="completed" label="已完成" />
          <el-table-column label="完成率">
            <template #default="{ row }">
              <el-progress
                :percentage="getCompletionRate(row)"
                :color="getProgressColor"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <div v-else class="loading">
      <el-skeleton :rows="5" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";
import { TodoExtendAPI, ProjectAPI, type Project } from "@/api/todo";

const projects = ref<Project[]>([]);
const selectedProject = ref<number | null>(null);
const stats = ref<any>(null);
const statusChartRef = ref<HTMLElement>();
const priorityChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

let statusChart: echarts.ECharts | null = null;
let priorityChart: echarts.ECharts | null = null;
let trendChart: echarts.ECharts | null = null;

const assigneeTableData = computed(() => {
  if (!stats.value?.assigneeStats) return [];
  return Object.entries(stats.value.assigneeStats).map(([assignee, data]: [string, any]) => ({
    assignee,
    total: data.total,
    completed: data.completed,
  }));
});

async function loadProjects() {
  try {
    const data = await ProjectAPI.getList("active");
    projects.value = data || [];
  } catch (error) {
    console.error("加载项目失败:", error);
  }
}

async function loadStatistics() {
  try {
    const data = await TodoExtendAPI.getStatistics(selectedProject.value);
    stats.value = data;
    // 延迟渲染图表，确保 DOM 已更新
    setTimeout(() => {
      renderCharts();
    }, 100);
  } catch (error) {
    console.error("加载统计失败:", error);
  }
}

function renderCharts() {
  if (!stats.value) return;

  // 状态分布饼图
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value);
    statusChart.setOption({
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: "60%",
          data: [
            { value: stats.value.statusStats?.completed || 0, name: "已完成", itemStyle: { color: "#67c23a" } },
            { value: stats.value.statusStats?.in_progress || 0, name: "进行中", itemStyle: { color: "#409eff" } },
            { value: stats.value.statusStats?.pending || 0, name: "待处理", itemStyle: { color: "#909399" } },
            { value: stats.value.statusStats?.cancelled || 0, name: "已取消", itemStyle: { color: "#f56c6c" } },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    });
  }

  // 优先级分布饼图
  if (priorityChartRef.value) {
    priorityChart = echarts.init(priorityChartRef.value);
    priorityChart.setOption({
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: "60%",
          data: [
            { value: stats.value.priorityStats?.urgent || 0, name: "紧急", itemStyle: { color: "#f56c6c" } },
            { value: stats.value.priorityStats?.high || 0, name: "高", itemStyle: { color: "#e6a23c" } },
            { value: stats.value.priorityStats?.medium || 0, name: "中", itemStyle: { color: "#409eff" } },
            { value: stats.value.priorityStats?.low || 0, name: "低", itemStyle: { color: "#67c23a" } },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    });
  }

  // 完成趋势折线图
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
    trendChart.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: stats.value.trend?.map((item: any) => item.date.slice(5)) || [],
      },
      yAxis: {
        type: "value",
        minInterval: 1,
      },
      series: [
        {
          name: "完成任务",
          type: "line",
          smooth: true,
          data: stats.value.trend?.map((item: any) => item.completed) || [],
          itemStyle: { color: "#67c23a" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(103, 194, 58, 0.3)" },
              { offset: 1, color: "rgba(103, 194, 58, 0.1)" },
            ]),
          },
        },
      ],
    });
  }
}

function getCompletionRate(row: any): number {
  if (row.total === 0) return 0;
  return Math.round((row.completed / row.total) * 100);
}

function getProgressColor(percentage: number): string {
  if (percentage < 50) return "#f56c6c";
  if (percentage < 80) return "#e6a23c";
  return "#67c23a";
}

onMounted(() => {
  loadProjects();
  loadStatistics();

  // 窗口大小改变时重绘图表
  window.addEventListener("resize", () => {
    statusChart?.resize();
    priorityChart?.resize();
    trendChart?.resize();
  });
});

onUnmounted(() => {
  statusChart?.dispose();
  priorityChart?.dispose();
  trendChart?.dispose();
});
</script>

<style scoped>
.statistics-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stats-header {
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
}

.stats-content {
  flex: 1;
  overflow-y: auto;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  .stat-card {
    text-align: center;

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 8px;

      &.success {
        color: #67c23a;
      }

      &.primary {
        color: #409eff;
      }

      &.warning {
        color: #e6a23c;
      }
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  .chart-container {
    height: 250px;
  }

  .trend-card {
    grid-column: span 2;

    .chart-container-large {
      height: 300px;
    }
  }
}

.loading {
  padding: 40px 20px;
}
</style>
