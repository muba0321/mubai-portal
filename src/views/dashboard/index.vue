<template>
  <div class="dashboard-container">
    <div class="welcome-bar">
      <div class="welcome-title">欢迎回来，Admin</div>
      <div class="welcome-subtitle">
        今天是 {{ currentDateStr }}，系统运行正常 | 最后更新：{{ lastUpdateStr }}
      </div>
    </div>

    <div class="feature-grid">
      <div v-for="item in featureCards" :key="item.title" class="feature-card" @click="handleCardClick(item)">
        <div class="feature-icon" :style="{ backgroundColor: item.bgColor }">
          <el-icon :size="28" :color="item.color">
            <component :is="item.icon" />
          </el-icon>
        </div>
        <div class="feature-title">{{ item.title }}</div>
        <div class="feature-desc">{{ item.desc }}</div>
      </div>
    </div>

    <div class="bottom-row">
      <div class="recent-visits">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon><Clock /></el-icon>
            最近访问
          </div>
          <el-button text size="small" type="primary">查看全部 →</el-button>
        </div>
        <div class="recent-list">
          <div v-for="item in recentList" :key="item.title" class="recent-item" @click="handleCardClick(item)">
            <div class="recent-icon" :style="{ backgroundColor: item.bgColor }">
              <el-icon :size="20" :color="item.color"><component :is="item.icon" /></el-icon>
            </div>
            <div class="recent-info">
              <div class="recent-title">{{ item.title }}</div>
              <div class="recent-time">{{ item.time }}</div>
            </div>
            <el-icon class="recent-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <div class="system-status">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon><Monitor /></el-icon>
            系统状态
          </div>
          <el-button text size="small" type="primary" @click="fetchSystemStatus">刷新</el-button>
        </div>
        <div class="status-grid">
          <div v-for="item in statusItems" :key="item.label" class="status-item">
            <div class="status-left">
              <el-icon :size="24" :color="item.color"><component :is="item.icon" /></el-icon>
              <div>
                <div class="status-label">{{ item.label }}</div>
                <div class="status-value">
                  <span>{{ item.value }}</span>
                  <span class="status-unit" v-if="item.unit">{{ item.unit }}</span>
                </div>
              </div>
            </div>
            <div class="status-dot" :class="item.status"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="common-links-panel">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon><Link /></el-icon>
          常用链接
        </div>
        <el-button text size="small" type="primary">管理链接</el-button>
      </div>
      <div class="links-list">
        <div v-for="link in commonLinks" :key="link.title" class="link-item" @click="handleLinkClick(link)">
          <div class="link-icon" :style="{ backgroundColor: link.bgColor }">
            <el-icon :size="20" :color="link.color"><component :is="link.icon" /></el-icon>
          </div>
          <div class="link-info">
            <div class="link-title">{{ link.title }}</div>
            <div class="link-desc">{{ link.desc }}</div>
          </div>
          <el-icon class="link-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor, DataAnalysis, Document, Bell, Setting, TrendCharts, User, EditPen, Clock, Link, ArrowRight, Cpu, Connection, DataBoard, Warning, Histogram } from "@element-plus/icons-vue";

defineOptions({ name: "Dashboard" });

const currentDateStr = "2026年3月30日";
const lastUpdateStr = "2分钟前";

const featureCards = [
  { title: "CMDB 管理", desc: "虚拟机资产管理", icon: Monitor, bgColor: "#e8f4fd", color: "#409eff" },
  { title: "系统监控", desc: "实时性能监控", icon: DataAnalysis, bgColor: "#e8f8e8", color: "#67c23a" },
  { title: "日志中心", desc: "系统日志查询", icon: Document, bgColor: "#fef3e2", color: "#e6a23c" },
  { title: "告警管理", desc: "告警规则配置", icon: Bell, bgColor: "#fef0f0", color: "#f56c6c" },
  { title: "系统设置", desc: "全局配置管理", icon: Setting, bgColor: "#f0f0ff", color: "#9b59b6" },
  { title: "报表统计", desc: "数据分析报表", icon: TrendCharts, bgColor: "#e0f7f0", color: "#13c2c2" },
  { title: "用户管理", desc: "权限与账号", icon: User, bgColor: "#fff4e5", color: "#fa8c16" },
  { title: "操作记录", desc: "审计日志查看", icon: EditPen, bgColor: "#f0f7ff", color: "#1677ff" },
];

const recentList = [
  { title: "CMDB 虚拟机管理", icon: Monitor, bgColor: "#e8f4fd", color: "#409eff", time: "2分钟前访问" },
  { title: "系统监控面板", icon: DataAnalysis, bgColor: "#e8f8e8", color: "#67c23a", time: "15分钟前访问" },
  { title: "同步日志", icon: Document, bgColor: "#fef3e2", color: "#e6a23c", time: "1小时前访问" },
  { title: "告警列表", icon: Bell, bgColor: "#fef0f0", color: "#f56c6c", time: "2小时前访问" },
];

const statusItems = [
  { label: "服务器", value: "24", unit: "在线", icon: Cpu, color: "#409eff", status: "online" },
  { label: "服务", value: "142", unit: "运行中", icon: Connection, color: "#67c23a", status: "online" },
  { label: "网络", value: "", unit: "正常", icon: DataBoard, color: "#1677ff", status: "online" },
  { label: "存储", value: "78%", unit: "使用", icon: Histogram, color: "#e6a23c", status: "warning" },
  { label: "告警", value: "3", unit: "未处理", icon: Warning, color: "#f56c6c", status: "warning" },
  { label: "负载", value: "45%", unit: "正常", icon: DataBoard, color: "#67c23a", status: "online" },
];

const commonLinks = [
  { title: "CMDB 虚拟机列表", desc: "管理所有虚拟机资产", icon: Document, bgColor: "#e8f4fd", color: "#409eff" },
  { title: "性能监控大盘", desc: "实时查看系统性能指标", icon: TrendCharts, bgColor: "#e8f8e8", color: "#67c23a" },
  { title: "系统配置", desc: "修改系统参数和设置", icon: Setting, bgColor: "#f0f0ff", color: "#9b59b6" },
  { title: "帮助文档", desc: "查看使用指南和文档", icon: Link, bgColor: "#e0f7f0", color: "#13c2c2" },
];

function handleCardClick(item: any) { console.log("navigate:", item.title); }
function handleLinkClick(item: any) { console.log("open link:", item.title); }
function fetchSystemStatus() { console.log("refresh status"); }
</script>

<style lang="scss" scoped>
.dashboard-container { padding: 16px; background-color: #f0f2f5; min-height: 100%; }

.welcome-bar {
  background: linear-gradient(135deg, #5b9cf6 0%, #85b8fb 100%);
  border-radius: 8px; padding: 20px 28px; margin-bottom: 16px; color: #fff;
  .welcome-title { font-size: 20px; font-weight: 600; margin-bottom: 6px; }
  .welcome-subtitle { font-size: 13px; opacity: 0.9; }
}

.feature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }

.feature-card {
  background: #fff; border-radius: 8px; padding: 20px;
  display: flex; flex-direction: column; align-items: center;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  &:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
  .feature-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .feature-title { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 4px; }
  .feature-desc { font-size: 12px; color: #909399; }
}

.bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px; border-bottom: 1px solid #ebeef5;
  .panel-title { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: #303133; }
}

.recent-visits {
  background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  .recent-list { padding: 8px 12px; }
  .recent-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 8px; cursor: pointer; border-radius: 8px; transition: background 0.2s;
    &:hover { background: #f5f7fa; }
    .recent-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .recent-info { flex: 1; min-width: 0; }
    .recent-title { font-size: 14px; color: #303133; font-weight: 500; }
    .recent-time { font-size: 12px; color: #909399; margin-top: 2px; }
    .recent-arrow { color: #c0c4cc; flex-shrink: 0; }
  }
}

.system-status {
  background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  .status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px 20px; }
  .status-item {
    background: #f5f7fa; border-radius: 8px; padding: 14px;
    display: flex; align-items: center; justify-content: space-between;
    .status-left { display: flex; align-items: center; gap: 10px; }
    .status-label { font-size: 12px; color: #909399; }
    .status-value { font-size: 15px; font-weight: 600; color: #303133; .status-unit { font-size: 12px; font-weight: 400; color: #606266; margin-left: 4px; } }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; &.online { background: #67c23a; box-shadow: 0 0 6px rgba(103,194,58,0.5); } &.warning { background: #e6a23c; box-shadow: 0 0 6px rgba(230,162,60,0.5); } }
  }
}

.common-links-panel {
  background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  .links-list { padding: 8px 12px; }
  .link-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 8px; cursor: pointer; border-radius: 8px; transition: background 0.2s;
    &:hover { background: #f5f7fa; }
    .link-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .link-info { flex: 1; min-width: 0; }
    .link-title { font-size: 14px; color: #303133; font-weight: 500; }
    .link-desc { font-size: 12px; color: #909399; margin-top: 2px; }
    .link-arrow { color: #c0c4cc; flex-shrink: 0; }
  }
}
</style>
