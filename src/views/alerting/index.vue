<template>
  <div class="alerting-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="5" v-for="s in statCards" :key="s.label">
        <el-card shadow="hover" class="stat-card" @click="s.action?.()">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Tab 区域 -->
    <el-card shadow="never">
      <el-tabs v-model="activeTab" type="card">
        <!-- ========== 指标库 ========== -->
        <el-tab-pane label="指标库" name="metrics">
          <div class="tab-toolbar">
            <el-select v-model="metricGroupFilter" placeholder="全部分组" clearable style="width: 160px" @change="fetchMetrics">
              <el-option label="系统指标" value="system" />
              <el-option label="MySQL" value="mysql" />
              <el-option label="Jenkins" value="jenkins" />
              <el-option label="Nginx" value="nginx" />
              <el-option label="Docker" value="docker" />
              <el-option label="自定义" value="custom" />
            </el-select>
            <el-radio-group v-model="metricSourceFilter" size="small" @change="fetchMetrics">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="builtin">内置</el-radio-button>
              <el-radio-button label="custom">自定义</el-radio-button>
            </el-radio-group>
            <el-button type="primary" size="small" @click="openMetricDialog">
              <el-icon><Plus /></el-icon> 添加指标
            </el-button>
          </div>

          <el-row :gutter="16">
            <el-col :span="8" v-for="m in filteredMetrics" :key="m.id">
              <el-card shadow="hover" class="metric-card">
                <div class="metric-header">
                  <span class="metric-name">{{ m.display_name }}</span>
                  <el-tag :type="m.source_type === 'builtin' ? 'success' : 'warning'" size="small">
                    {{ m.source_type === 'builtin' ? '内置' : '自定义' }}
                  </el-tag>
                </div>
                <div class="metric-group">{{ groupLabel(m.group) }}</div>
                <div class="metric-promql">{{ m.promql }}</div>
                <div class="metric-footer">
                  <span>单位: {{ m.unit || '-' }}</span>
                  <el-button type="danger" link size="small" v-if="m.source_type === 'custom'" @click="deleteMetric(m.id)">删除</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-empty v-if="filteredMetrics.length === 0" description="暂无指标数据" />
        </el-tab-pane>

        <!-- ========== 告警规则 ========== -->
        <el-tab-pane label="告警规则" name="rules">
          <div class="tab-toolbar">
            <el-select v-model="ruleSeverityFilter" placeholder="全部级别" clearable style="width: 140px" @change="fetchRules">
              <el-option label="P0 (紧急)" value="P0" />
              <el-option label="P1 (严重)" value="P1" />
              <el-option label="P2 (一般)" value="P2" />
            </el-select>
            <el-button type="primary" size="small" @click="openRuleDialog">
              <el-icon><Plus /></el-icon> 创建规则
            </el-button>
          </div>

          <!-- 活跃告警 -->
          <div v-if="activeAlerts.length > 0" class="active-alerts">
            <div class="active-alerts-title">
              <el-icon color="#e6a23c"><WarningFilled /></el-icon>
              当前活跃告警 ({{ activeAlerts.length }})
            </div>
            <el-alert v-for="r in activeAlerts" :key="r.id" :title="r.name" :type="severityType(r.severity)"
              :description="ruleConditionDesc(r)" show-icon closable :closable="false" />
          </div>

          <!-- 规则列表 -->
          <el-table :data="filteredRules" stripe border v-loading="rulesLoading">
            <el-table-column prop="name" label="规则名称" min-width="180" />
            <el-table-column label="严重级别" width="100">
              <template #default="{ row }">
                <el-tag :type="severityType(row.severity)" size="small">{{ row.severity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="条件" min-width="160">
              <template #default="{ row }">{{ ruleConditionDesc(row) }}</template>
            </el-table-column>
            <el-table-column label="持续时间" width="100">
              <template #default="{ row }">{{ row.condition_duration }}s</template>
            </el-table-column>
            <el-table-column label="来源" width="100">
              <template #default="{ row }">
                <el-tag :type="row.source_type === 'builtin' ? '' : 'warning'" size="small">
                  {{ row.source_type === 'builtin' ? '内置模板' : '用户自定义' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="通知渠道" min-width="120">
              <template #default="{ row }">
                <template v-if="row.notification_channels">
                  <el-tag v-for="cid in row.notification_channels.split(',')" :key="cid" size="small" style="margin-right: 4px">
                    {{ channelName(Number(cid)) }}
                  </el-tag>
                </template>
                <span v-else style="color: #999">未配置</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleRule(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openRuleDialog(row)">编辑</el-button>
                <el-button type="danger" link size="small" v-if="row.source_type === 'custom'" @click="deleteRule(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ========== 通知渠道 ========== -->
        <el-tab-pane label="通知渠道" name="channels">
          <div class="tab-toolbar">
            <el-select v-model="channelTypeFilter" placeholder="全部类型" clearable style="width: 160px" @change="fetchChannels">
              <el-option label="钉钉" value="dingtalk" />
              <el-option label="企业微信" value="wecom" />
              <el-option label="邮件" value="email" />
              <el-option label="自定义Webhook" value="webhook" />
              <el-option label="Slack" value="slack" />
            </el-select>
            <el-button type="primary" size="small" @click="openChannelDialog">
              <el-icon><Plus /></el-icon> 添加渠道
            </el-button>
          </div>

          <el-table :data="filteredChannels" stripe border v-loading="channelsLoading">
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="channelTypeTag(row.type)">{{ channelTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" min-width="140" />
            <el-table-column label="地址" min-width="260">
              <template #default="{ row }">
                <code v-if="row.webhook_url">{{ maskWebhook(row.webhook_url) }}</code>
                <span v-else-if="row.email_recipients">{{ row.email_recipients }}</span>
                <span v-else style="color: #999">未配置</span>
              </template>
            </el-table-column>
            <el-table-column label="级别过滤" width="120">
              <template #default="{ row }">{{ row.level_filter === 'all' ? '全部' : row.level_filter }}</template>
            </el-table-column>
            <el-table-column label="静默周期" width="100">
              <template #default="{ row }">{{ row.silence_period }}s</template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleChannel(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openChannelDialog(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="deleteChannel(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ========== 模板市场 ========== -->
        <el-tab-pane label="模板市场" name="templates">
          <el-row :gutter="16">
            <el-col :span="8" v-for="t in templates" :key="t.id">
              <el-card shadow="hover" class="template-card">
                <div class="template-header">
                  <el-icon :size="24" color="#409eff"><Folder /></el-icon>
                  <span class="template-name">{{ t.name }}</span>
                  <el-tag :type="t.source_type === 'builtin' ? 'success' : 'warning'" size="small">
                    {{ t.source_type === 'builtin' ? '内置' : '自定义' }}
                  </el-tag>
                </div>
                <p class="template-desc">{{ t.description }}</p>
                <div class="template-stats">
                  <span>{{ t.metric_count }} 个指标</span>
                  <el-divider direction="vertical" />
                  <span>{{ t.rule_count }} 条规则</span>
                </div>
                <div class="template-footer">
                  <el-button size="small" @click="viewTemplate(t)">详情</el-button>
                  <el-button type="primary" size="small" @click="applyTemplate(t)">一键应用</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-empty v-if="templates.length === 0" description="暂无模板" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 创建/编辑 规则弹窗 -->
    <el-dialog v-model="ruleDialogVisible" :title="editingRule ? '编辑告警规则' : '创建告警规则'" width="600px">
      <el-form :model="ruleForm" label-width="120px">
        <el-form-item label="规则名称">
          <el-input v-model="ruleForm.name" placeholder="例如: CPU 使用率过高" />
        </el-form-item>
        <el-form-item label="关联指标">
          <el-select v-model="ruleForm.metric_id" filterable placeholder="选择指标" style="width: 100%">
            <el-option v-for="m in metrics" :key="m.id" :label="`${m.display_name} (${m.name})`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="条件">
          <el-row :gutter="8">
            <el-col :span="8">
              <el-select v-model="ruleForm.condition_operator" style="width: 100%">
                <el-option label=">" value=">" />
                <el-option label=">=" value=">=" />
                <el-option label="<" value="<" />
                <el-option label="<=" value="<=" />
                <el-option label="==" value="==" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-input v-model.number="ruleForm.condition_value" placeholder="阈值" />
            </el-col>
            <el-col :span="8">
              <el-input v-model.number="ruleForm.condition_duration" placeholder="持续秒数" />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="严重级别">
          <el-select v-model="ruleForm.severity" style="width: 100%">
            <el-option label="P0 (紧急)" value="P0" />
            <el-option label="P1 (严重)" value="P1" />
            <el-option label="P2 (一般)" value="P2" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知渠道">
          <el-select v-model="ruleForm.notification_channels" multiple placeholder="选择通知渠道" style="width: 100%">
            <el-option v-for="c in channels" :key="c.id" :label="c.name" :value="String(c.id)" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑 通知渠道弹窗 -->
    <el-dialog v-model="channelDialogVisible" :title="editingChannel ? '编辑通知渠道' : '添加通知渠道'" width="600px">
      <el-form :model="channelForm" label-width="120px">
        <el-form-item label="渠道类型">
          <el-select v-model="channelForm.type" style="width: 100%" :disabled="!!editingChannel">
            <el-option label="钉钉" value="dingtalk" />
            <el-option label="企业微信" value="wecom" />
            <el-option label="邮件" value="email" />
            <el-option label="自定义Webhook" value="webhook" />
            <el-option label="Slack" value="slack" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道名称">
          <el-input v-model="channelForm.name" placeholder="例如: SRE 钉钉群" />
        </el-form-item>
        <el-form-item label="Webhook URL" v-if="channelForm.type !== 'email'">
          <el-input v-model="channelForm.webhook_url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="邮件接收人" v-else>
          <el-input v-model="channelForm.email_recipients" placeholder="逗号分隔多个邮箱" />
        </el-form-item>
        <el-form-item label="级别过滤">
          <el-select v-model="channelForm.level_filter" multiple style="width: 100%">
            <el-option label="P0 (紧急)" value="P0" />
            <el-option label="P1 (严重)" value="P1" />
            <el-option label="P2 (一般)" value="P2" />
          </el-select>
        </el-form-item>
        <el-form-item label="静默周期(秒)">
          <el-input-number v-model="channelForm.silence_period" :min="0" :step="60" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="channelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveChannel">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加指标弹窗 -->
    <el-dialog v-model="metricDialogVisible" title="添加自定义指标" width="600px">
      <el-form :model="metricForm" label-width="100px">
        <el-form-item label="指标名称">
          <el-input v-model="metricForm.display_name" placeholder="例如: 磁盘 IOPS" />
        </el-form-item>
        <el-form-item label="标识符">
          <el-input v-model="metricForm.name" placeholder="例如: disk_iops" />
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="metricForm.group" style="width: 100%">
            <el-option label="系统指标" value="system" />
            <el-option label="MySQL" value="mysql" />
            <el-option label="Jenkins" value="jenkins" />
            <el-option label="Nginx" value="nginx" />
            <el-option label="Docker" value="docker" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="PromQL">
          <el-input v-model="metricForm.promql" type="textarea" :rows="3" placeholder="PromQL 查询语句" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="metricForm.unit" placeholder="%, ms, B/s 等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="metricDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMetric">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模板详情弹窗 -->
    <el-dialog v-model="templateDetailVisible" :title="selectedTemplate?.name || '模板详情'" width="700px">
      <p>{{ selectedTemplate?.description }}</p>
      <h4>包含指标 ({{ selectedTemplate?.metrics?.length || 0 }})</h4>
      <el-table :data="selectedTemplate?.metrics || []" border size="small" style="margin-bottom: 16px">
        <el-table-column prop="display_name" label="名称" />
        <el-table-column prop="promql" label="PromQL" show-overflow-tooltip />
        <el-table-column prop="unit" label="单位" width="80" />
      </el-table>
      <h4>包含规则 ({{ selectedTemplate?.rules?.length || 0 }})</h4>
      <el-table :data="selectedTemplate?.rules || []" border size="small">
        <el-table-column prop="name" label="规则名称" />
        <el-table-column label="条件">
          <template #default="{ row }">{{ row.condition_operator }} {{ row.condition_value }}</template>
        </el-table-column>
        <el-table-column prop="severity" label="级别" width="80" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "AlertingManage" });

import { Plus, WarningFilled, Folder } from "@element-plus/icons-vue";
import AlertingAPI, {
  type AlertMetric,
  type AlertRule,
  type NotificationChannel,
  type AlertTemplate,
} from "@/api/alerting";
import { ElMessage, ElMessageBox } from "element-plus";

// ---- Stats ----
const stats = reactive({
  metrics_count: 0,
  templates_count: 0,
  rules_count: 0,
  active_rules: 0,
  channels_count: 0,
});

const statCards = computed(() => [
  { label: "监控指标", value: stats.metrics_count, action: () => { activeTab.value = "metrics"; } },
  { label: "内置模板", value: stats.templates_count, action: () => { activeTab.value = "templates"; } },
  { label: "告警规则", value: stats.rules_count, action: () => { activeTab.value = "rules"; } },
  { label: "活跃告警", value: stats.active_rules, action: () => { activeTab.value = "rules"; } },
  { label: "通知渠道", value: stats.channels_count, action: () => { activeTab.value = "channels"; } },
]);

// ---- Tabs ----
const activeTab = ref("metrics");

// ---- Metrics ----
const metrics = ref<AlertMetric[]>([]);
const metricGroupFilter = ref("");
const metricSourceFilter = ref("all");

const filteredMetrics = computed(() => {
  let list = metrics.value;
  if (metricGroupFilter.value) list = list.filter((m) => m.group === metricGroupFilter.value);
  if (metricSourceFilter.value !== "all") list = list.filter((m) => m.source_type === metricSourceFilter.value);
  return list;
});

// ---- Rules ----
const rules = ref<AlertRule[]>([]);
const rulesLoading = ref(false);
const ruleSeverityFilter = ref("");
const editingRule = ref<AlertRule | null>(null);
const ruleDialogVisible = ref(false);

const ruleForm = reactive({
  name: "",
  metric_id: null as number | null,
  condition_operator: ">",
  condition_value: 0 as number | null,
  condition_duration: 60,
  severity: "P2",
  notification_channels: [] as string[],
});

const activeAlerts = computed(() => rules.value.filter((r) => r.enabled && r.severity === "P0"));

const filteredRules = computed(() => {
  let list = rules.value;
  if (ruleSeverityFilter.value) list = list.filter((r) => r.severity === ruleSeverityFilter.value);
  return list;
});

// ---- Channels ----
const channels = ref<NotificationChannel[]>([]);
const channelsLoading = ref(false);
const channelTypeFilter = ref("");
const editingChannel = ref<NotificationChannel | null>(null);
const channelDialogVisible = ref(false);

const channelForm = reactive({
  type: "dingtalk",
  name: "",
  webhook_url: "",
  email_recipients: "",
  level_filter: ["P0", "P1", "P2"] as string[],
  silence_period: 300,
});

const filteredChannels = computed(() => {
  let list = channels.value;
  if (channelTypeFilter.value) list = list.filter((c) => c.type === channelTypeFilter.value);
  return list;
});

// ---- Templates ----
const templates = ref<AlertTemplate[]>([]);
const selectedTemplate = ref<AlertTemplate | null>(null);
const templateDetailVisible = ref(false);

// ---- Metric Dialog ----
const metricDialogVisible = ref(false);
const metricForm = reactive({
  name: "",
  display_name: "",
  group: "custom",
  promql: "",
  unit: "",
});

// ============ Fetch Data ============

async function fetchStats() {
  try {
    const s = await AlertingAPI.getStats();
    Object.assign(stats, s);
  } catch { /* ignored */ }
}

async function fetchMetrics() {
  try {
    const params: any = {};
    if (metricGroupFilter.value) params.group = metricGroupFilter.value;
    if (metricSourceFilter.value !== "all") params.source_type = metricSourceFilter.value;
    metrics.value = await AlertingAPI.listMetrics(params);
  } catch {
    ElMessage.error("获取指标失败");
  }
}

async function fetchRules() {
  rulesLoading.value = true;
  try {
    const params: any = {};
    if (ruleSeverityFilter.value) params.severity = ruleSeverityFilter.value;
    rules.value = await AlertingAPI.listRules(params);
  } catch {
    ElMessage.error("获取规则失败");
  } finally {
    rulesLoading.value = false;
  }
}

async function fetchChannels() {
  channelsLoading.value = true;
  try {
    const params: any = {};
    if (channelTypeFilter.value) params.type = channelTypeFilter.value;
    channels.value = await AlertingAPI.listChannels(params);
  } catch {
    ElMessage.error("获取通知渠道失败");
  } finally {
    channelsLoading.value = false;
  }
}

async function fetchTemplates() {
  try {
    templates.value = await AlertingAPI.listTemplates();
  } catch {
    ElMessage.error("获取模板失败");
  }
}

function refreshAll() {
  fetchStats();
  fetchMetrics();
  fetchRules();
  fetchChannels();
  fetchTemplates();
}

// ============ Metric CRUD ============

function openMetricDialog() {
  metricForm.name = "";
  metricForm.display_name = "";
  metricForm.group = "custom";
  metricForm.promql = "";
  metricForm.unit = "";
  metricDialogVisible.value = true;
}

async function saveMetric() {
  if (!metricForm.name || !metricForm.display_name) {
    ElMessage.warning("请填写指标名称和显示名称");
    return;
  }
  try {
    await AlertingAPI.createMetric({
      name: metricForm.name,
      display_name: metricForm.display_name,
      group: metricForm.group,
      promql: metricForm.promql,
      unit: metricForm.unit,
      source_type: "custom",
    });
    ElMessage.success("添加成功");
    metricDialogVisible.value = false;
    refreshAll();
  } catch {
    ElMessage.error("添加失败");
  }
}

async function deleteMetric(id: number) {
  try {
    await ElMessageBox.confirm("确认删除该指标？", "确认", { type: "warning" });
    await AlertingAPI.deleteMetric(id);
    ElMessage.success("已删除");
    refreshAll();
  } catch { /* cancelled */ }
}

// ============ Rule CRUD ============

function openRuleDialog(rule?: AlertRule) {
  if (rule) {
    editingRule.value = rule;
    ruleForm.name = rule.name;
    ruleForm.metric_id = rule.metric_id;
    ruleForm.condition_operator = rule.condition_operator || ">";
    ruleForm.condition_value = rule.condition_value;
    ruleForm.condition_duration = rule.condition_duration || 60;
    ruleForm.severity = rule.severity;
    ruleForm.notification_channels = rule.notification_channels?.split(",") || [];
  } else {
    editingRule.value = null;
    ruleForm.name = "";
    ruleForm.metric_id = null;
    ruleForm.condition_operator = ">";
    ruleForm.condition_value = 0;
    ruleForm.condition_duration = 60;
    ruleForm.severity = "P2";
    ruleForm.notification_channels = [];
  }
  ruleDialogVisible.value = true;
}

async function saveRule() {
  if (!ruleForm.name) {
    ElMessage.warning("请填写规则名称");
    return;
  }
  const data: any = {
    name: ruleForm.name,
    metric_id: ruleForm.metric_id,
    condition_operator: ruleForm.condition_operator,
    condition_value: ruleForm.condition_value,
    condition_duration: ruleForm.condition_duration,
    severity: ruleForm.severity,
    notification_channels: ruleForm.notification_channels.join(","),
    source_type: "custom",
  };
  try {
    if (editingRule.value) {
      await AlertingAPI.updateRule(editingRule.value.id, data);
      ElMessage.success("更新成功");
    } else {
      await AlertingAPI.createRule(data);
      ElMessage.success("创建成功");
    }
    ruleDialogVisible.value = false;
    refreshAll();
  } catch {
    ElMessage.error("保存失败");
  }
}

async function toggleRule(row: AlertRule) {
  try {
    await AlertingAPI.toggleRule(row.id);
    refreshAll();
  } catch {
    ElMessage.error("操作失败");
  }
}

async function deleteRule(id: number) {
  try {
    await ElMessageBox.confirm("确认删除该规则？", "确认", { type: "warning" });
    await AlertingAPI.deleteRule(id);
    ElMessage.success("已删除");
    refreshAll();
  } catch { /* cancelled */ }
}

// ============ Channel CRUD ============

function openChannelDialog(channel?: NotificationChannel) {
  if (channel) {
    editingChannel.value = channel;
    channelForm.type = channel.type;
    channelForm.name = channel.name;
    channelForm.webhook_url = channel.webhook_url || "";
    channelForm.email_recipients = channel.email_recipients || "";
    channelForm.level_filter = channel.level_filter === "all" ? ["P0", "P1", "P2"] : channel.level_filter.split(",");
    channelForm.silence_period = channel.silence_period;
  } else {
    editingChannel.value = null;
    channelForm.type = "dingtalk";
    channelForm.name = "";
    channelForm.webhook_url = "";
    channelForm.email_recipients = "";
    channelForm.level_filter = ["P0", "P1", "P2"];
    channelForm.silence_period = 300;
  }
  channelDialogVisible.value = true;
}

async function saveChannel() {
  if (!channelForm.name) {
    ElMessage.warning("请填写渠道名称");
    return;
  }
  const data: any = {
    type: channelForm.type,
    name: channelForm.name,
    webhook_url: channelForm.webhook_url || null,
    email_recipients: channelForm.email_recipients || null,
    level_filter: channelForm.level_filter.length ? channelForm.level_filter.join(",") : "all",
    silence_period: channelForm.silence_period,
  };
  try {
    if (editingChannel.value) {
      await AlertingAPI.updateChannel(editingChannel.value.id, data);
      ElMessage.success("更新成功");
    } else {
      await AlertingAPI.createChannel(data);
      ElMessage.success("添加成功");
    }
    channelDialogVisible.value = false;
    refreshAll();
  } catch {
    ElMessage.error("保存失败");
  }
}

async function toggleChannel(row: NotificationChannel) {
  try {
    await AlertingAPI.updateChannel(row.id, { enabled: row.enabled });
    ElMessage.success(row.enabled ? "已启用" : "已停用");
    refreshAll();
  } catch {
    ElMessage.error("操作失败");
  }
}

async function deleteChannel(id: number) {
  try {
    await ElMessageBox.confirm("确认删除该通知渠道？", "确认", { type: "warning" });
    await AlertingAPI.deleteChannel(id);
    ElMessage.success("已删除");
    refreshAll();
  } catch { /* cancelled */ }
}

// ============ Template ============

async function viewTemplate(t: AlertTemplate) {
  try {
    const detail = await AlertingAPI.getTemplate(t.id);
    selectedTemplate.value = detail;
    templateDetailVisible.value = true;
  } catch {
    ElMessage.error("获取模板详情失败");
  }
}

async function applyTemplate(t: AlertTemplate) {
  try {
    await ElMessageBox.confirm(`确认应用模板「${t.name}」？将创建 ${t.metric_count} 个指标和 ${t.rule_count} 条规则。`, "确认", { type: "info" });
    const result = await AlertingAPI.applyTemplate(t.id);
    ElMessage.success(result.message || "应用成功");
    refreshAll();
  } catch { /* cancelled */ }
}

// ============ Helpers ============

function groupLabel(g: string) {
  const map: Record<string, string> = {
    system: "系统指标", mysql: "MySQL", jenkins: "Jenkins",
    nginx: "Nginx", docker: "Docker", custom: "自定义",
  };
  return map[g] || g;
}

function severityType(sev: string) {
  return sev === "P0" ? "danger" : sev === "P1" ? "warning" : "info";
}

function ruleConditionDesc(row: AlertRule) {
  if (!row.condition_operator || row.condition_value == null) return "-";
  return `${row.condition_operator} ${row.condition_value}`;
}

function channelTypeLabel(t: string) {
  const map: Record<string, string> = {
    dingtalk: "钉钉", wecom: "企微", email: "邮件", webhook: "Webhook", slack: "Slack",
  };
  return map[t] || t;
}

function channelTypeTag(t: string) {
  const map: Record<string, any> = {
    dingtalk: "", wecom: "success", email: "warning", webhook: "info", slack: "danger",
  };
  return map[t] || "info";
}

function channelName(id: number) {
  const c = channels.value.find((x) => x.id === id);
  return c ? c.name : `#${id}`;
}

function maskWebhook(url: string) {
  if (url.length < 20) return url;
  return url.substring(0, 15) + "****" + url.substring(url.length - 8);
}

// ============ Init ============
refreshAll();
</script>

<style scoped>
.alerting-page { padding: 0; }
.stats-row { margin-bottom: 16px; }
.stat-card { text-align: center; cursor: pointer; transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-2px); }
.stat-value { font-size: 32px; font-weight: 700; color: #409eff; }
.stat-label { font-size: 14px; color: #909399; margin-top: 4px; }
.tab-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.metric-card { margin-bottom: 16px; }
.metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.metric-name { font-weight: 600; font-size: 15px; }
.metric-group { font-size: 12px; color: #909399; margin-bottom: 8px; }
.metric-promql { background: #f5f7fa; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #606266; margin-bottom: 8px; word-break: break-all; }
.metric-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #909399; }
.active-alerts { margin-bottom: 16px; }
.active-alerts-title { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; }
.template-card { height: 100%; }
.template-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.template-name { font-weight: 600; font-size: 16px; }
.template-desc { font-size: 13px; color: #606266; min-height: 40px; }
.template-stats { font-size: 13px; color: #409eff; margin-bottom: 12px; }
.template-footer { display: flex; justify-content: space-between; }
</style>
