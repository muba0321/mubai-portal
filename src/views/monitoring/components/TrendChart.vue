<template>
  <div class="trend-chart">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <a v-if="grafanaLink" :href="grafanaLink" target="_blank" class="chart-link">→ Grafana 深度分析</a>
    </div>
    <div ref="chartRef" class="chart-body"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useResizeObserver, useIntervalFn } from "@vueuse/core";
import MonitoringAPI from "@/api/monitoring";

echarts.use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent]);

const props = defineProps<{
  title: string;
  fetchFn: () => Promise<MonitoringAPI.EchartsData>;
  grafanaLink?: string;
  unit?: string;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const colorPalette = ["#74c0fc", "#69db7c", "#ffa94d", "#ff8787", "#9775fa", "#38bdf8"];

function renderChart(data: MonitoringAPI.EchartsData) {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const series = data.series.map((s, i) => ({
    name: s.name,
    type: "line" as const,
    data: s.data,
    smooth: true,
    showSymbol: false,
    lineStyle: { width: 2 },
    itemStyle: { color: colorPalette[i % colorPalette.length] },
    areaStyle: i === 0 ? {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: colorPalette[i % colorPalette.length] + "60" },
        { offset: 1, color: colorPalette[i % colorPalette.length] + "10" },
      ]),
    } : undefined,
  }));

  chartInstance.setOption({
    tooltip: { trigger: "axis" as const, backgroundColor: "#152030", borderColor: "#2d3748", textStyle: { color: "#e5e6eb" } },
    legend: { data: data.series.map(s => s.name), textStyle: { color: "#86909c", fontSize: 11 }, top: 0 },
    grid: { left: 50, right: 20, top: 32, bottom: 30 },
    xAxis: {
      type: "category" as const,
      data: data.categories,
      axisLabel: { color: "#86909c", fontSize: 10, interval: Math.max(0, Math.floor(data.categories.length / 8)) },
      axisLine: { lineStyle: { color: "#2d3748" } },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: "#86909c", fontSize: 10, formatter: `{value}${props.unit || ""}` },
      splitLine: { lineStyle: { color: "#2d3748", type: "dashed" } },
    },
    series,
  }, true);
}

async function fetchData() {
  try {
    const data = await props.fetchFn();
    if (data.categories && data.categories.length > 0) {
      renderChart(data);
    }
  } catch { /* handled */ }
}

onMounted(() => {
  nextTick(() => {
    if (chartRef.value) {
      chartInstance = echarts.init(chartRef.value);
      fetchData();
    }
  });
});

useResizeObserver(chartRef, () => chartInstance?.resize());

const { pause } = useIntervalFn(fetchData, 300000);

onBeforeUnmount(() => {
  pause();
  chartInstance?.dispose();
});
</script>

<style scoped>
.trend-chart { background: #152030; border: 1px solid #2d3748; border-radius: 8px; padding: 16px; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.chart-title { font-size: 14px; font-weight: 600; color: #fff; }
.chart-link { color: #74c0fc; font-size: 12px; text-decoration: none; }
.chart-link:hover { text-decoration: underline; }
.chart-body { width: 100%; height: 220px; }
</style>
