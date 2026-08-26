<template>
  <div class="cicd-progress-board">
    <!-- 页面标题 -->
    <div class="board-header">
      <h2 class="board-title">CICD 规划 vs 实际进展</h2>
      <p class="board-subtitle">DevOps 8 阶段落地追踪 · 持续更新</p>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-value total">{{ overview.totalStages || 8 }}</div>
        <div class="stat-label">标准阶段</div>
      </div>
      <div class="stat-card">
        <div class="stat-value done">{{ overview.done || 0 }}</div>
        <div class="stat-label">已落地</div>
      </div>
      <div class="stat-card">
        <div class="stat-value progress">{{ overview.progress || 0 }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value planned">{{ overview.planned || 0 }}</div>
        <div class="stat-label">规划中</div>
      </div>
    </div>

    <!-- 总进度条 -->
    <div class="total-progress">
      <div class="progress-header">
        <span class="progress-title">整体落地进度</span>
        <span class="progress-percent">{{ overview.overallProgress || 0 }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: (overview.overallProgress || 0) + '%' }"></div>
      </div>
      <div class="progress-legend">
        <span class="legend-item"><span class="legend-dot done"></span> 已落地</span>
        <span class="legend-item"><span class="legend-dot progress"></span> 进行中</span>
        <span class="legend-item"><span class="legend-dot planned"></span> 规划中</span>
      </div>
    </div>

    <!-- CI 阶段分组标题 -->
    <div class="section-divider">
      <div class="divider-line"></div>
      <div class="divider-label ci">CI — 持续集成</div>
      <div class="divider-line"></div>
    </div>

    <!-- CI 阶段卡片 -->
    <div class="stages-grid">
      <div
        v-for="stage in ciStages"
        :key="stage.id"
        class="stage-card ci"
        @click="showStageDetail(stage)"
      >
        <div class="stage-header">
          <div class="stage-icon">{{ stage.icon }}</div>
          <div class="stage-name">{{ stage.stageName || stage.name }}</div>
          <div class="stage-tag" :class="'tag-' + stage.status">
            {{ statusLabel(stage.status) }}
          </div>
        </div>

        <!-- 进度环 -->
        <div class="stage-progress-ring">
          <svg viewBox="0 0 52 52">
            <circle class="ring-bg" cx="26" cy="26" r="22" />
            <circle
              class="ring-progress"
              :class="stage.status"
              cx="26"
              cy="26"
              r="22"
              :stroke-dasharray="ringDasharray(stage.progress)"
            />
          </svg>
          <div class="ring-text" :class="stage.status">
            {{ stage.progress }}%
          </div>
        </div>

        <!-- 规划 vs 实际对比 -->
        <div class="compare-section">
          <div class="compare-title">
            <span>规划功能</span>
            <span>实际状态</span>
          </div>
          <div class="compare-items">
            <div
              v-for="(item, idx) in stage.items"
              :key="idx"
              class="compare-item"
            >
              <div class="ci-dot" :class="item.status"></div>
              <span>{{ item.text }}</span>
            </div>
          </div>
        </div>

        <!-- 关联项目 -->
        <div v-if="stage.linked_projects && stage.linked_projects.length" class="linked-projects">
          <div class="linked-title">关联项目</div>
          <div class="project-tags">
            <span
              v-for="proj in stage.linked_projects"
              :key="proj.id"
              class="project-tag"
            >
              {{ proj.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- CD 阶段分组标题 -->
    <div class="section-divider">
      <div class="divider-line"></div>
      <div class="divider-label cd">CD — 持续部署</div>
      <div class="divider-line"></div>
    </div>

    <!-- CD 阶段卡片 -->
    <div class="stages-grid">
      <div
        v-for="stage in cdStages"
        :key="stage.id"
        class="stage-card cd"
        @click="showStageDetail(stage)"
      >
        <div class="stage-header">
          <div class="stage-icon">{{ stage.icon }}</div>
          <div class="stage-name">{{ stage.stageName || stage.name }}</div>
          <div class="stage-tag" :class="'tag-' + stage.status">
            {{ statusLabel(stage.status) }}
          </div>
        </div>

        <!-- 进度环 -->
        <div class="stage-progress-ring">
          <svg viewBox="0 0 52 52">
            <circle class="ring-bg" cx="26" cy="26" r="22" />
            <circle
              class="ring-progress"
              :class="stage.status"
              cx="26"
              cy="26"
              r="22"
              :stroke-dasharray="ringDasharray(stage.progress)"
            />
          </svg>
          <div class="ring-text" :class="stage.status">
            {{ stage.progress }}%
          </div>
        </div>

        <!-- 规划 vs 实际对比 -->
        <div class="compare-section">
          <div class="compare-title">
            <span>规划功能</span>
            <span>实际状态</span>
          </div>
          <div class="compare-items">
            <div
              v-for="(item, idx) in stage.items"
              :key="idx"
              class="compare-item"
            >
              <div class="ci-dot" :class="item.status"></div>
              <span>{{ item.text }}</span>
            </div>
          </div>
        </div>

        <!-- 关联项目 -->
        <div v-if="stage.linked_projects && stage.linked_projects.length" class="linked-projects">
          <div class="linked-title">关联项目</div>
          <div class="project-tags">
            <span
              v-for="proj in stage.linked_projects"
              :key="proj.id"
              class="project-tag"
            >
              {{ proj.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 落地时间线 -->
    <div class="timeline-section">
      <div class="timeline-header">落地时间线</div>
      <div class="timeline">
        <div class="timeline-fill" :style="{ width: timelineProgress + '%' }"></div>
        <div
          v-for="(item, idx) in timeline"
          :key="idx"
          class="tl-item"
        >
          <div class="tl-dot" :class="item.status"></div>
          <div class="tl-label">{{ item.label }}</div>
          <div class="tl-sub">{{ item.date }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getProgressOverview, getStageDetails, getTimeline } from '@/api/cicd-progress';

interface StageItem {
  text: string;
  status: 'done' | 'progress' | 'planned' | 'missing';
  key: string;
}

interface LinkedProject {
  id: number;
  name: string;
}

interface Stage {
  id: string;
  name: string;
  stageName: string;
  icon: string;
  category: 'ci' | 'cd';
  status: 'done' | 'progress' | 'planned';
  progress: number;
  items: StageItem[];
  linked_projects: LinkedProject[];
  requirement_count: number;
  milestones: any[];
}

interface TimelineItem {
  label: string;
  date: string;
  status: 'done' | 'progress' | 'planned';
  stage: string;
}

const overview = ref({
  totalStages: 8,
  done: 0,
  progress: 0,
  planned: 0,
  overallProgress: 0,
});

const stages = ref<Stage[]>([]);
const timeline = ref<TimelineItem[]>([]);

const ciStages = computed(() => stages.value.filter(s => s.category === 'ci'));
const cdStages = computed(() => stages.value.filter(s => s.category === 'cd'));

const timelineProgress = computed(() => {
  const done = timeline.value.filter(t => t.status === 'done').length;
  return timeline.value.length > 0 ? Math.round((done / timeline.value.length) * 100) : 0;
});

function ringDasharray(progress: number): string {
  const circumference = 2 * Math.PI * 22; // r=22
  const filled = (progress / 100) * circumference;
  return `${filled} ${circumference}`;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    done: '✓ 已落地',
    progress: '◉ 进行中',
    planned: '○ 规划中',
  };
  return labels[status] || status;
}

function showStageDetail(stage: Stage) {
  const status = statusLabel(stage.status);
  const items = stage.items.map(item => {
    const icon = item.status === 'done' ? '✓' :
                 item.status === 'progress' ? '◉' :
                 item.status === 'missing' ? '✗' : '○';
    return `${icon} ${item.text}`;
  }).join('\n');

  const projects = stage.linked_projects?.map(p => p.name).join(', ') || '无';

  alert(`${stage.name} (${status})\n进度：${stage.progress}%\n关联项目：${projects}\n\n${items}`);
}

async function loadData() {
  try {
    // 加载总览数据
    const overviewData = await getProgressOverview();
    overview.value = overviewData;

    // 加载阶段详情
    const stagesData = await getStageDetails();
    stages.value = stagesData.stages;

    // 加载时间线
    const timelineData = await getTimeline();
    timeline.value = timelineData.timeline;
  } catch (error) {
    console.error('Failed to load CICD progress data:', error);
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.cicd-progress-board {
  padding: 24px;
  background: #0a0e27;
  min-height: 100vh;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 页面标题 */
.board-header {
  text-align: center;
  margin-bottom: 30px;
}

.board-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0 0 8px 0;
}

.board-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* 统计卡片 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto 30px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  backdrop-filter: blur(8px);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -1px;
}

.stat-value.total { color: #60a5fa; }
.stat-value.done { color: #34d399; }
.stat-value.progress { color: #fbbf24; }
.stat-value.planned { color: rgba(255, 255, 255, 0.35); }

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* 总进度条 */
.total-progress {
  max-width: 1200px;
  margin: 0 auto 30px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 24px 30px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.progress-title {
  font-size: 16px;
  font-weight: 600;
}

.progress-percent {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.progress-track {
  height: 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #60a5fa 0%, #c084fc 100%);
  transition: width 1.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 30px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.progress-legend {
  display: flex;
  gap: 24px;
  margin-top: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.done { background: #34d399; }
.legend-dot.progress { background: #fbbf24; }
.legend-dot.planned { background: rgba(255, 255, 255, 0.2); }

/* 分组标题 */
.section-divider {
  max-width: 1200px;
  margin: 0 auto 16px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.divider-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  padding: 4px 16px;
  border-radius: 8px;
}

.divider-label.ci {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}

.divider-label.cd {
  color: #c084fc;
  background: rgba(192, 132, 252, 0.1);
}

/* 阶段卡片网格 */
.stages-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto 30px;
}

.stage-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stage-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.12);
}

.stage-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.stage-card.ci::before {
  background: linear-gradient(90deg, #60a5fa, #34d399);
}

.stage-card.cd::before {
  background: linear-gradient(90deg, #c084fc, #f472b6);
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.stage-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.ci .stage-icon {
  background: rgba(96, 165, 250, 0.15);
}

.cd .stage-icon {
  background: rgba(192, 132, 252, 0.15);
}

.stage-name {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
}

.stage-tag {
  margin-left: auto;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.tag-done {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.tag-progress {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.tag-planned {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.4);
}

/* 进度环 */
.stage-progress-ring {
  width: 52px;
  height: 52px;
  margin: 0 auto 12px;
  position: relative;
}

.stage-progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 4;
}

.ring-progress {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dasharray 1s ease;
}

.ring-progress.done {
  stroke: #34d399;
  filter: drop-shadow(0 0 4px rgba(52, 211, 153, 0.4));
}

.ring-progress.progress {
  stroke: #fbbf24;
  filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.4));
}

.ring-progress.planned {
  stroke: rgba(255, 255, 255, 0.2);
}

.ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 700;
}

.ring-text.done { color: #34d399; }
.ring-text.progress { color: #fbbf24; }
.ring-text.planned { color: rgba(255, 255, 255, 0.3); }

/* 规划 vs 实际对比 */
.compare-section {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 12px;
  margin-top: 4px;
}

.compare-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.compare-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.compare-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.ci-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ci-dot.done { background: #34d399; }
.ci-dot.progress { background: #fbbf24; }
.ci-dot.planned { background: rgba(255, 255, 255, 0.2); }
.ci-dot.missing { background: #f56c6c; }

.compare-item span {
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 关联项目 */
.linked-projects {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.linked-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 6px;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.project-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  border-radius: 4px;
  white-space: nowrap;
}

/* 时间线 */
.timeline-section {
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px 30px;
}

.timeline-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

.timeline {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 16px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
}

.timeline-fill {
  position: absolute;
  top: 16px;
  left: 20px;
  height: 2px;
  background: linear-gradient(90deg, #34d399, #fbbf24);
  transition: width 1s ease;
}

.tl-item {
  position: relative;
  text-align: center;
  z-index: 2;
  flex: 1;
}

.tl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 auto 8px;
  border: 2px solid;
}

.tl-dot.done {
  background: #34d399;
  border-color: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.4);
}

.tl-dot.progress {
  background: #fbbf24;
  border-color: #fbbf24;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}

.tl-dot.planned {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
}

.tl-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2px;
}

.tl-sub {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
}
</style>
