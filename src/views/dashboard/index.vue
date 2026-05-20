<template>
  <div class="dashboard-container">
    <div class="welcome-bar">
      <div class="welcome-title">欢迎回来，{{ userStore.userInfo?.nickname || "Admin" }}</div>
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
        <div class="category-tabs">
          <span
            v-for="cat in allCategories"
            :key="cat"
            class="category-tab"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat"
          >{{ cat }}</span>
        </div>
        <el-button text size="small" type="primary" @click="showManageDialog">管理链接</el-button>
      </div>
      <div class="links-list">
        <div v-for="link in filteredLinks" :key="link.title" class="link-item" @click="handleLinkClick(link)">
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
      <div v-if="filteredLinks.length === 0" class="links-empty">暂无链接</div>
    </div>

    <!-- 管理链接弹窗 -->
    <el-dialog v-model="manageDialogVisible" title="管理常用链接" width="800px" append-to-body>
      <div class="manage-toolbar">
        <el-button type="primary" size="small" @click="handleAddLink">
          <el-icon class="mr-1"><Plus /></el-icon>添加链接
        </el-button>
      </div>
      <el-table :data="manageLinks" border stripe>
        <el-table-column label="名称" prop="title" min-width="120" />
        <el-table-column label="分类" prop="category" width="100" />
        <el-table-column label="链接" prop="url" min-width="180" show-overflow-tooltip />
        <el-table-column label="图标" prop="icon" width="100" />
        <el-table-column label="排序" prop="sort" width="60" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleEditLink(scope.row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDeleteLink(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 链接编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" :title="editForm.id ? '编辑链接' : '添加链接'" width="500px" append-to-body>
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="名称" prop="title">
          <el-input v-model="editForm.title" placeholder="如：CMDB 虚拟机列表" />
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model="editForm.url" placeholder="/cmdb 或 https://..." />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-select v-model="editForm.icon" placeholder="选择图标" style="width: 100%">
            <el-option v-for="name in iconOptions" :key="name" :label="name" :value="name">
              <div class="flex items-center gap-2">
                <el-icon><component :is="iconMap[name]" /></el-icon>
                <span>{{ name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="editForm.category" placeholder="选择分类（可选）" style="width: 100%" clearable>
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" placeholder="链接描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="editForm.sort" :min="0" :max="999" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmitLink">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Monitor, DataAnalysis, Document, Bell, Setting, TrendCharts, User, EditPen, Clock, Link, ArrowRight, Cpu, Connection, DataBoard, Warning, Histogram, Plus } from "@element-plus/icons-vue";
import DashboardAPI from "@/api/dashboard";
import { useUserStore } from "@/store";
import { type CommonLink } from "@/api/dashboard";

defineOptions({ name: "Dashboard" });

const userStore = useUserStore();

// 动态日期
const currentDateStr = computed(() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const w = weekDays[now.getDay()];
  return `${y}年${m}月${d}日 星期${w}`;
});
const lastUpdateStr = ref("刚刚");

// 功能卡片（静态）
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

// 最近访问（从 API 加载）
const recentList = ref<any[]>([]);

// 系统状态（从 API 加载）
const statusItems = ref<any[]>([]);

// 常用链接（从 API 加载）
const commonLinks = ref<any[]>([]);
let hasAutoCategorized = false;

// 分类标签
const allCategories = ["全部", "监控工具", "运维管理", "开发工具", "文档资料", "其他"];
const categoryOptions = allCategories.slice(1); // 去掉"全部"，用于编辑弹窗
const activeCategory = ref("全部");

// 根据名称/URL 自动分类
function autoCategorize(item: any): string {
  const t = (item.title || "").toLowerCase();
  const u = (item.url || "").toLowerCase();
  if (t.includes("监控") || t.includes("grafana") || t.includes("prometheus") || t.includes("大盘") || t.includes("告警")) return "监控工具";
  if (t.includes("cmdb") || t.includes("dns") || t.includes("系统配置") || t.includes("系统设置") || t.includes("设置") || t.includes("配置") || t.includes("极客") || t.includes("管理")) return "运维管理";
  if (t.includes("coding") || t.includes("开发") || t.includes("openclaw") || t.includes("ci") || t.includes("jenkins") || t.includes("git")) return "开发工具";
  if (t.includes("文档") || t.includes("资料") || t.includes("飞书") || t.includes("帮助") || t.includes("help") || t.includes("doc")) return "文档资料";
  return "其他";
}

// 筛选后的链接列表
const filteredLinks = computed(() => {
  const links = commonLinks.value.map(link => ({
    ...link,
    category: link.category || autoCategorize(link),
  }));
  if (activeCategory.value === "全部") return links;
  return links.filter(l => l.category === activeCategory.value);
});

// 映射后端图标名到组件
const iconMap: Record<string, any> = {
  Monitor, DataAnalysis, Document, Bell, Setting, TrendCharts,
  User, EditPen, Clock, Link, Cpu, Connection, DataBoard, Warning, Histogram,
};

async function fetchSystemStatus() {
  try {
    const data = await DashboardAPI.getSystemStatus();
    statusItems.value = [
      { label: "服务器", value: String(data.serverOnline ?? 0), unit: "在线", icon: Cpu, color: "#409eff", status: "online" },
      { label: "服务", value: String(data.serviceRunning ?? 0), unit: "运行中", icon: Connection, color: "#67c23a", status: "online" },
      { label: "网络", value: "", unit: data.networkStatus ?? "正常", icon: DataBoard, color: "#1677ff", status: "online" },
      { label: "存储", value: data.storageUsage ?? "-", unit: "使用", icon: Histogram, color: "#e6a23c", status: "warning" },
      { label: "告警", value: String(data.alertPending ?? 0), unit: "未处理", icon: Warning, color: "#f56c6c", status: data.alertPending > 0 ? "warning" : "online" },
      { label: "负载", value: data.cpuLoad ?? "-", unit: "正常", icon: DataBoard, color: "#67c23a", status: "online" },
    ];
    lastUpdateStr.value = data.lastUpdated ?? "刚刚";
  } catch {
    // 使用默认值
  }
}

async function fetchCommonLinks() {
  try {
    const data = await DashboardAPI.getCommonLinks();
    commonLinks.value = (data || []).map((item: any) => ({
      title: item.title,
      desc: item.description,
      icon: iconMap[item.icon] || Link,
      bgColor: "#e8f4fd",
      color: "#409eff",
      url: item.url,
      id: item.id,
      category: item.category,
    }));
    // 首次加载时自动分类并保存（只执行一次）
    if (!hasAutoCategorized) {
      hasAutoCategorized = true;
      DashboardAPI.autoCategorize();
    }
  } catch {
    // 使用默认值
  }
}

async function fetchRecentVisits() {
  try {
    const data = await DashboardAPI.getRecentVisits();
    recentList.value = (data || []).map((item: any, index: number) => {
      const icons = [Monitor, DataAnalysis, Document, Bell];
      const colors = ["#409eff", "#67c23a", "#e6a23c", "#f56c6c"];
      const bgs = ["#e8f4fd", "#e8f8e8", "#fef3e2", "#fef0f0"];
      const i = index % icons.length;
      return {
        title: item.pageTitle,
        icon: icons[i],
        bgColor: bgs[i],
        color: colors[i],
        time: formatTime(item.visitedAt),
        path: item.pagePath,
      };
    });
  } catch {
    // 使用默认值
  }
}

function formatTime(isoStr: string): string {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚访问";
  if (diffMin < 60) return `${diffMin}分钟前访问`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}小时前访问`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}天前访问`;
}

function handleCardClick(item: any) { console.log("navigate:", item.title); }
function handleLinkClick(item: any) {
  if (item.url) {
    window.open(item.url, "_blank");
  } else {
    console.log("open link:", item.title);
  }
}

onMounted(() => {
  fetchSystemStatus();
  fetchCommonLinks();
  fetchRecentVisits();
});

// 管理链接弹窗
const manageDialogVisible = ref(false);
const manageLinks = ref<any[]>([]);

// 编辑链接弹窗
const editDialogVisible = ref(false);
const editFormRef = ref();
const editForm = reactive<{ id?: number; title: string; url: string; icon: string; description: string; category: string; sort: number }>({
  id: undefined,
  title: "",
  url: "",
  icon: "Link",
  description: "",
  category: "",
  sort: 0,
});
const editRules = {
  title: [{ required: true, message: "请输入名称", trigger: "blur" }],
  url: [{ required: true, message: "请输入链接", trigger: "blur" }],
};

// 可选图标列表
const iconOptions = ["Monitor", "DataAnalysis", "Document", "Bell", "Setting", "TrendCharts", "User", "EditPen", "Clock", "Link", "Cpu", "Connection", "DataBoard", "Warning", "Histogram"];

function showManageDialog() {
  manageLinks.value = commonLinks.value.map(l => ({
    id: l.id,
    title: l.title,
    url: l.url,
    icon: Object.keys(iconMap).find(k => iconMap[k] === l.icon) || "Link",
    description: l.desc,
    category: l.category,
    sort: 0,
  }));
  manageDialogVisible.value = true;
}

function handleAddLink() {
  Object.assign(editForm, { id: undefined, title: "", url: "", icon: "Link", description: "", category: "", sort: 0 });
  editDialogVisible.value = true;
}

function handleEditLink(row: any) {
  Object.assign(editForm, { ...row });
  editDialogVisible.value = true;
}

async function handleSubmitLink() {
  const valid = await editFormRef.value?.validate().then(() => true, () => false);
  if (!valid) return;
  try {
    if (editForm.id) {
      await DashboardAPI.updateLink(editForm.id, editForm);
      ElMessage.success("修改成功");
    } else {
      await DashboardAPI.createLink(editForm);
      ElMessage.success("添加成功");
    }
    editDialogVisible.value = false;
    await fetchCommonLinks();
    showManageDialog();
  } catch {
    // 错误已在拦截器处理
  }
}

function handleDeleteLink(row: any) {
  ElMessageBox.confirm(`确认删除「${row.title}」？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      await DashboardAPI.deleteLink(row.id);
      ElMessage.success("删除成功");
      await fetchCommonLinks();
      showManageDialog();
    } catch {
      // 错误已在拦截器处理
    }
  }).catch(() => {});
}
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
  .category-tabs {
    display: flex; gap: 4px; margin-left: 24px;
    .category-tab {
      padding: 4px 12px; border-radius: 16px; font-size: 13px; color: #606266;
      cursor: pointer; transition: all 0.2s; white-space: nowrap;
      &:hover { background: #f0f5ff; color: #409eff; }
      &.active { background: #409eff; color: #fff; font-weight: 500; }
    }
  }
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
  .links-empty { text-align: center; padding: 24px; color: #909399; font-size: 14px; }
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

.manage-toolbar { margin-bottom: 12px; }
</style>
