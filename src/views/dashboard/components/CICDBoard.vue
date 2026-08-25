<template>
  <div class="cicd-board">
    <div class="board-header">
      <div class="board-title">
        <el-icon size="24"><Connection /></el-icon>
        CICD 流程阶段看板
      </div>
      <el-button text size="small" type="primary" @click="loadStages">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="board-loading">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 无穷大流程图 -->
    <div v-else class="infinity-flow">
      <!-- 上排：需求→开发→构建→测试→部署 -->
      <div class="stage-row top-row">
        <div v-for="stage in topStages" :key="stage.id"
             class="stage-node"
             :class="nodeClass(stage)"
             :style="{ '--stage-color': stage.color }"
             @click="goToStage(stage)">
          <div class="stage-icon-wrapper">
            <div class="icon-bg"></div>
            <span class="icon">{{ stage.icon || getIcon(stage.name) }}</span>
            <div v-if="stage.progress === 100" class="completed-badge">✓</div>
          </div>
          <div class="stage-info">
            <div class="stage-name">{{ stage.name }}</div>
            <div class="stage-progress-text">{{ stage.progress }}%</div>
          </div>
          <svg class="progress-ring" width="56" height="56">
            <circle class="progress-bg" cx="28" cy="28" r="24" />
            <circle class="progress-bar"
                    cx="28" cy="28" r="24"
                    :stroke-dasharray="`${stage.progress * 1.5} 150`" />
          </svg>
        </div>
      </div>

      <!-- 下排：监控→灰度→制品→安全→审查（反向排列） -->
      <div class="stage-row bottom-row">
        <div v-for="stage in bottomStages" :key="stage.id"
             class="stage-node"
             :class="nodeClass(stage)"
             :style="{ '--stage-color': stage.color }"
             @click="goToStage(stage)">
          <div class="stage-icon-wrapper">
            <div class="icon-bg"></div>
            <span class="icon">{{ stage.icon || getIcon(stage.name) }}</span>
            <div v-if="stage.progress === 100" class="completed-badge">✓</div>
          </div>
          <div class="stage-info">
            <div class="stage-name">{{ stage.name }}</div>
            <div class="stage-progress-text">{{ stage.progress }}%</div>
          </div>
          <svg class="progress-ring" width="56" height="56">
            <circle class="progress-bg" cx="28" cy="28" r="24" />
            <circle class="progress-bar"
                    cx="28" cy="28" r="24"
                    :stroke-dasharray="`${stage.progress * 1.5} 150`" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Connection, Refresh } from '@element-plus/icons-vue'
import { DashboardAPI } from '@/api/dashboard'

const router = useRouter()
const loading = ref(false)
const stages = ref<any[]>([])

const iconMap: Record<string, string> = {
  '需求管理': '',
  '代码开发': '💻',
  '代码审查': '🔍',
  '持续构建': '🔨',
  '自动化测试': '🧪',
  '安全扫描': '🔒',
  '制品管理': '📦',
  '持续部署': '🚀',
  '灰度发布': '🎯',
  '监控运维': '📊'
}

const topStages = computed(() => stages.value.filter(s => [1, 2, 4, 5, 8].includes(s.order)))
const bottomStages = computed(() => stages.value.filter(s => [10, 9, 7, 6, 3].includes(s.order)))

onMounted(() => {
  loadStages()
})

async function loadStages() {
  loading.value = true
  try {
    const data = await DashboardAPI.getCICDStages()
    stages.value = data.stages || []
  } catch (e) {
    console.error('加载 CICD 阶段失败:', e)
  } finally {
    loading.value = false
  }
}

function nodeClass(stage: any) {
  return {
    'completed': stage.progress === 100,
    'warning': stage.progress > 0 && stage.progress < 50,
    'danger': stage.progress === 0
  }
}

function getIcon(name: string) {
  return iconMap[name] || '📌'
}

function goToStage(stage: any) {
  router.push({
    path: '/todo',
    query: { stage: stage.name, from: 'cicd-board' }
  })
}
</script>

<style scoped>
.cicd-board {
  margin-bottom: 20px;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.board-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.board-loading {
  padding: 40px;
  background: #f5f7fa;
  border-radius: 16px;
}

.infinity-flow {
  position: relative;
  padding: 40px 30px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  overflow: hidden;
}

.stage-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.bottom-row {
  margin-top: 24px;
}

/* 连接箭头 */
.stage-row::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg,
    rgba(102, 126, 234, 0.3) 0%,
    rgba(118, 75, 162, 0.3) 50%,
    rgba(102, 126, 234, 0.3) 100%);
  z-index: 1;
}

.bottom-row::after {
  transform: rotate(180deg);
}

.stage-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  max-width: 180px;
  animation: slideIn 0.6s ease forwards;
  opacity: 0;
}

.stage-node:nth-child(1) { animation-delay: 0.1s; }
.stage-node:nth-child(2) { animation-delay: 0.2s; }
.stage-node:nth-child(3) { animation-delay: 0.3s; }
.stage-node:nth-child(4) { animation-delay: 0.4s; }
.stage-node:nth-child(5) { animation-delay: 0.5s; }

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stage-node:hover {
  transform: translateY(-6px) scale(1.03);
  border-color: var(--stage-color, rgba(102, 126, 234, 0.6));
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--stage-color, rgba(102, 126, 234, 0.4)),
    0 0 24px var(--stage-color, rgba(102, 126, 234, 0.2));
}

.stage-node.completed {
  background: linear-gradient(135deg, rgba(132, 250, 176, 0.15) 0%, rgba(143, 211, 244, 0.15) 100%);
  border-color: rgba(132, 250, 176, 0.5);
}

.stage-node.warning {
  border-color: rgba(246, 211, 101, 0.5);
}

.stage-node.danger {
  border-color: rgba(255, 107, 107, 0.3);
}

.stage-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.icon-bg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--stage-color, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  opacity: 0.2;
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.15); opacity: 0.3; }
}

.icon {
  font-size: 28px;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.completed-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 2px 8px rgba(132, 250, 176, 0.5);
  z-index: 2;
}

.stage-info {
  text-align: center;
  margin-bottom: 12px;
}

.stage-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
  white-space: nowrap;
}

.stage-progress-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--stage-color, #667eea);
  text-shadow: 0 0 12px var(--stage-color, rgba(102, 126, 234, 0.5));
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 3;
}

.progress-bar {
  fill: none;
  stroke: var(--stage-color, #667eea);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 响应式 */
@media (max-width: 1200px) {
  .stage-node {
    max-width: 160px;
    padding: 16px 12px;
  }
}

@media (max-width: 992px) {
  .stage-row {
    flex-wrap: wrap;
    justify-content: center;
  }
  .stage-node {
    max-width: 140px;
  }
}

@media (max-width: 768px) {
  .stage-row {
    gap: 12px;
  }
  .stage-node {
    max-width: 120px;
    padding: 12px 8px;
  }
  .icon {
    font-size: 22px;
  }
  .stage-name {
    font-size: 11px;
  }
  .stage-progress-text {
    font-size: 16px;
  }
}
</style>
