<template>
  <div class="config-container">
    <el-card shadow="never" class="config-card">
      <template #header>
        <div class="config-header">
          <span class="config-title">系统配置（Apollo 风格）</span>
          <div class="config-actions">
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新增配置
            </el-button>
            <el-button @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button @click="handleInitDefaults" :disabled="hasInited">
              初始化预设
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeNamespace" type="card" class="config-tabs">
        <el-tab-pane
          v-for="ns in allNamespaces"
          :key="ns"
          :label="nsLabel(ns)"
          :name="ns"
        />
      </el-tabs>

      <el-table :data="filteredEntries" stripe border style="width: 100%" class="config-table">
        <el-table-column prop="configKey" label="Key" min-width="180" />
        <el-table-column label="Value" min-width="280">
          <template #default="{ row }">
            <template v-if="row.editing">
              <el-input
                v-model="row.editValue"
                :type="row.configType === 'text' ? 'textarea' : 'text'"
                :rows="3"
                clearable
                @keydown.enter="handleSave(row)"
              />
            </template>
            <template v-else>
              <span class="value-cell" :title="row.configValue ?? ''">{{ displayValue(row) }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="configType" label="Type" width="100" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.editing">
              <el-button type="primary" size="small" @click="handleSave(row)">保存</el-button>
              <el-button size="small" @click="handleCancel(row)">取消</el-button>
            </template>
            <template v-else>
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-popconfirm title="确认删除?" @confirm="handleDelete(row)">
                <template #reference>
                  <el-button type="danger" link size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="config-footer">
        <span class="hint">说明：配置按命名空间分组，Key-Value 结构，后续可无缝迁移到 Apollo 配置中心。</span>
      </div>
    </el-card>

    <!-- 新增配置弹窗 -->
    <el-dialog v-model="createVisible" title="新增配置" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="命名空间" required>
          <el-select v-model="createForm.namespace" placeholder="选择或输入" filterable allow-create style="width: 100%">
            <el-option v-for="ns in allNamespaces" :key="ns" :label="ns" :value="ns" />
          </el-select>
        </el-form-item>
        <el-form-item label="Key" required>
          <el-input v-model="createForm.configKey" placeholder="配置键名" />
        </el-form-item>
        <el-form-item label="Value">
          <el-input v-model="createForm.configValue" type="textarea" :rows="3" placeholder="配置值" />
        </el-form-item>
        <el-form-item label="Type">
          <el-select v-model="createForm.configType" style="width: 100%">
            <el-option label="string" value="string" />
            <el-option label="number" value="number" />
            <el-option label="boolean" value="boolean" />
            <el-option label="text" value="text" />
            <el-option label="json" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" placeholder="说明备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Refresh } from "@element-plus/icons-vue";
import ConfigAPI, { type ConfigEntry } from "@/api/setting";
import { useSystemSettingStore } from "@/store/modules/system-setting";

defineOptions({ name: "SystemConfig" });

const settingStore = useSystemSettingStore();

const activeNamespace = ref("application");
const entries = ref<ConfigEntry[]>([]);
const createVisible = ref(false);
const hasInited = ref(false);
const createForm = ref({
  namespace: "application",
  configKey: "",
  configValue: "",
  configType: "string",
  remark: "",
});

// 添加编辑状态到条目
const editingMap = ref<Map<number, { value: string; original: string }>>(new Map());

const allNamespaces = computed(() => {
  const nsSet = new Set(entries.value.map((e) => e.namespace));
  return Array.from(nsSet).sort();
});

const filteredEntries = computed(() =>
  entries.value
    .filter((e) => e.namespace === activeNamespace.value)
    .map((e) => ({
      ...e,
      editing: editingMap.value.has(e.id),
      editValue: editingMap.value.get(e.id)?.value ?? e.configValue ?? "",
    }))
);

const NS_LABELS: Record<string, string> = {
  application: "基础信息",
  "feature-toggle": "功能开关",
  backend: "后端参数",
  security: "安全策略",
};

function nsLabel(ns: string) {
  return NS_LABELS[ns] ?? ns;
}

function displayValue(row: ConfigEntry & { editing?: boolean; editValue?: string }) {
  if (row.configValue === null || row.configValue === undefined) return "";
  if (row.configType === "boolean") {
    return row.configValue === "true" ? "开启" : "关闭";
  }
  return row.configValue;
}

function handleEdit(row: ConfigEntry) {
  editingMap.value.set(row.id, {
    value: row.configValue ?? "",
    original: row.configValue ?? "",
  });
}

function handleCancel(row: ConfigEntry) {
  editingMap.value.delete(row.id);
}

async function handleSave(row: ConfigEntry & { editValue?: string }) {
  const newVal = row.editValue ?? "";
  try {
    await settingStore.update(row.id, { configValue: newVal });
    editingMap.value.delete(row.id);
    ElMessage.success("保存成功");
    await loadEntries();
  } catch {
    ElMessage.error("保存失败");
  }
}

async function handleDelete(row: ConfigEntry) {
  try {
    await settingStore.remove(row.id);
    ElMessage.success("删除成功");
    await loadEntries();
  } catch {
    ElMessage.error("删除失败");
  }
}

function handleCreate() {
  createForm.value = {
    namespace: activeNamespace.value,
    configKey: "",
    configValue: "",
    configType: "string",
    remark: "",
  };
  createVisible.value = true;
}

async function handleCreateConfirm() {
  if (!createForm.value.namespace || !createForm.value.configKey) {
    ElMessage.warning("命名空间和 Key 不能为空");
    return;
  }
  try {
    await settingStore.create({ ...createForm.value });
    createVisible.value = false;
    ElMessage.success("创建成功");
    await loadEntries();
  } catch {
    ElMessage.error("创建失败");
  }
}

async function handleRefresh() {
  await loadEntries();
  ElMessage.info("已刷新");
}

async function handleInitDefaults() {
  try {
    await ConfigAPI.initDefaults();
    hasInited.value = true;
    ElMessage.success("初始化成功");
    await loadEntries();
  } catch {
    ElMessage.error("初始化失败");
  }
}

async function loadEntries() {
  try {
    entries.value = await ConfigAPI.getAll();
  } catch {
    ElMessage.error("加载配置失败");
  }
}

onMounted(async () => {
  await loadEntries();
});
</script>

<style lang="scss" scoped>
.config-container {
  padding: 20px;
}

.config-card {
  :deep(.el-card__header) {
    padding: 16px 20px;
  }
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .config-title {
    font-size: 16px;
    font-weight: 600;
  }

  .config-actions {
    display: flex;
    gap: 8px;
  }
}

.config-tabs {
  margin-bottom: 16px;
}

.config-table {
  margin-bottom: 16px;
}

.value-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}

.config-footer {
  color: var(--el-text-color-secondary);
  font-size: 12px;

  .hint {
    display: inline-block;
  }
}
</style>
