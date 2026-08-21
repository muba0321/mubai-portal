<template>
  <div class="stats-container" v-loading="loading">
    <!-- 总览卡片 -->
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total || 0 }}</div>
            <div class="stat-label">总用例数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value success">{{ stats.statusCounts?.active || 0 }}</div>
            <div class="stat-label">活跃用例</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value primary">{{ stats.passRate || 0 }}%</div>
            <div class="stat-label">通过率 (近 7 天)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value warning">{{ stats.recentExecutions || 0 }}</div>
            <div class="stat-label">近 7 天执行数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>按类型分布</span></template>
          <div ref="typeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>按项目覆盖率</span></template>
          <div ref="coverageChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 16px">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header><span>近 30 天执行趋势</span></template>
          <div ref="trendChartRef" class="chart-container-large"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";

const props = defineProps<{
  stats: any;
  loading: boolean;
}>();

const typeChartRef = ref<HTMLElement>();
const coverageChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

let typeChart: echarts.ECharts | null = null;
let coverageChart: echarts.ECharts | null = null;
let trendChart: echarts.ECharts | null = null;

function renderCharts() {
  if (!props.stats) return;

  // 类型分布饼图
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value);
    const typeData = Object.entries(props.stats.typeCounts || {}).map(([key, val]) => ({
      name: key === "api" ? "API 测试" : "手工测试",
      value: val,
    }));
    typeChart.setOption({
      tooltip: { trigger: "item" },
      series: [{
        type: "pie",
        radius: "60%",
        data: typeData,
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.5)" } },
      }],
    });
  }

  // 覆盖率柱状图
  if (coverageChartRef.value) {
    coverageChart = echarts.init(coverageChartRef.value);
    const projects = props.stats.coverage || [];
    coverageChart.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "category", data: projects.map((p: any) => p.project) },
      yAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
      series: [{
        type: "bar",
        data: projects.map((p: any) => ({
          value: p.rate,
          itemStyle: { color: p.rate > 80 ? "#67c23a" : p.rate > 50 ? "#e6a23c" : "#f56c6c" },
        })),
        label: { show: true, formatter: "{c}%", position: "top" },
      }],
    });
  }

  // 执行趋势折线图
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
    trendChart.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "category",
        data: props.stats.trend?.map((t: any) => t.date.slice(5)) || [],
      },
      yAxis: { type: "value", minInterval: 1 },
      series: [{
        name: "执行数",
        type: "line",
        smooth: true,
        data: props.stats.trend?.map((t: any) => t.count) || [],
        itemStyle: { color: "#409eff" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(64, 158, 255, 0.3)" },
            { offset: 1, color: "rgba(64, 158, 255, 0.1)" },
          ]),
        },
      }],
    });
  }
}

watch(() => props.stats, renderCharts);
onMounted(() => {
  window.addEventListener("resize", () => {
    typeChart?.resize();
    coverageChart?.resize();
    trendChart?.resize();
  });
});
onUnmounted(() => {
  typeChart?.dispose();
  coverageChart?.dispose();
  trendChart?.dispose();
});
</script>

<style scoped>
.stats-container {
  min-height: 500px;
}

.stat-card {
  text-align: center;
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 8px;
    &.success { color: #67c23a; }
    &.primary { color: #409eff; }
    &.warning { color: #e6a23c; }
  }
  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}

.chart-container {
  height: 250px;
}

.chart-container-large {
  height: 300px;
}
</style>
