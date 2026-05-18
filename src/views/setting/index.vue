<template>
  <div class="setting-container">
    <el-card shadow="never" class="setting-card">
      <template #header>
        <div class="setting-header">
          <span class="setting-title">系统设置</span>
          <div class="setting-actions">
            <el-button @click="handleReset" :disabled="!hasChanges">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
            <el-button type="primary" @click="handleSave" :loading="saving" :disabled="!hasChanges">
              <el-icon><Check /></el-icon>
              保存
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeGroup" tab-position="left" class="setting-tabs">
        <el-tab-pane
          v-for="group in groups"
          :key="group.key"
          :label="group.label"
          :name="group.key"
        >
          <el-form label-width="160px" class="setting-form">
            <el-form-item
              v-for="item in currentItems"
              :key="item.settingKey"
              :label="item.label"
            >
              <template v-if="item.description" #label>
                <span>{{ item.label }}</span>
                <el-tooltip :content="item.description" placement="top">
                  <el-icon class="info-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>

              <!-- string / text -->
              <el-input
                v-if="item.settingType === 'string'"
                v-model="editValues[item.settingKey]"
                clearable
                placeholder="请输入"
                @input="markChanged"
              />
              <el-input
                v-else-if="item.settingType === 'text'"
                v-model="editValues[item.settingKey]"
                type="textarea"
                :rows="3"
                clearable
                placeholder="请输入"
                @input="markChanged"
              />

              <!-- number -->
              <el-input-number
                v-else-if="item.settingType === 'number'"
                v-model="editValues[item.settingKey]"
                :min="0"
                controls-position="right"
                style="width: 200px"
                @change="markChanged"
              />

              <!-- boolean -->
              <el-switch
                v-else-if="item.settingType === 'boolean'"
                v-model="editValues[item.settingKey]"
                :active-value="true"
                :inactive-value="false"
                @change="markChanged"
              />

              <!-- json -->
              <el-input
                v-else-if="item.settingType === 'json'"
                v-model="editValues[item.settingKey]"
                type="textarea"
                :rows="4"
                placeholder='{"key": "value"}'
                @input="markChanged"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Check, QuestionFilled } from "@element-plus/icons-vue";
import SettingAPI, { type SettingItem } from "@/api/setting";
import { useSystemSettingStore } from "@/store/modules/system-setting";

defineOptions({ name: "SystemSetting" });

const settingStore = useSystemSettingStore();

interface GroupDef {
  key: string;
  label: string;
}

const groups: GroupDef[] = [
  { key: "basic", label: "基础信息" },
  { key: "feature", label: "功能开关" },
  { key: "backend", label: "后端参数" },
  { key: "security", label: "安全策略" },
];

const activeGroup = ref("basic");
const saving = ref(false);
const originalValues = reactive<Record<string, any>>({});
const editValues = reactive<Record<string, any>>({});
const allItems = ref<SettingItem[]>([]);

const currentItems = computed(() =>
  allItems.value.filter((i) => i.settingGroup === activeGroup.value)
);

const hasChanges = computed(() => {
  for (const key of Object.keys(editValues)) {
    if (editValues[key] !== originalValues[key]) return true;
  }
  return false;
});

async function loadGroup(group: string) {
  try {
    const items = await SettingAPI.getGroup(group);
    // 去重合并
    const existingKeys = new Set(allItems.value.map((i) => i.settingKey));
    for (const item of items) {
      if (!existingKeys.has(item.settingKey)) {
        allItems.value.push(item);
        const val = parseValue(item.settingValue, item.settingType, item.defaultValue);
        originalValues[item.settingKey] = val;
        editValues[item.settingKey] = val;
      }
    }
  } catch {
    ElMessage.error(`加载 ${group} 分组配置失败`);
  }
}

function parseValue(val: string | null, type: string, defaultVal: string | null): any {
  if (val === null || val === "") {
    if (type === "boolean") return false;
    if (type === "number") return 0;
    return "";
  }
  if (type === "boolean") return val === "true";
  if (type === "number") return Number(val) || 0;
  return val;
}

function markChanged() {
  // reactive 自动触发更新
}

async function handleSave() {
  const changedData: Record<string, any> = {};
  for (const key of Object.keys(editValues)) {
    if (editValues[key] !== originalValues[key]) {
      const item = allItems.value.find((i) => i.settingKey === key);
      const val = item?.settingType === "number" ? Number(editValues[key]) : editValues[key];
      changedData[key] = val;
    }
  }

  if (Object.keys(changedData).length === 0) {
    ElMessage.info("没有需要保存的修改");
    return;
  }

  saving.value = true;
  try {
    await SettingAPI.updateBatch(changedData);
    // 更新原始值
    for (const [key, val] of Object.entries(changedData)) {
      originalValues[key] = val;
    }
    // 刷新 store
    await settingStore.refresh();
    ElMessage.success("保存成功");
  } catch {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
}

function handleReset() {
  for (const key of Object.keys(editValues)) {
    editValues[key] = originalValues[key];
  }
  ElMessage.info("已重置为上次保存的值");
}

onMounted(async () => {
  // 加载所有分组
  for (const g of groups) {
    await loadGroup(g.key);
  }
});
</script>

<style lang="scss" scoped>
.setting-container {
  padding: 20px;
}

.setting-card {
  max-width: 1000px;
  margin: 0 auto;

  :deep(.el-card__header) {
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .setting-title {
    font-size: 16px;
    font-weight: 600;
  }

  .setting-actions {
    display: flex;
    gap: 8px;
  }
}

.setting-tabs {
  :deep(.el-tabs__header) {
    width: 120px;
    border-right: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-tabs__content) {
    padding: 20px 24px;
    min-height: 400px;
  }
}

.setting-form {
  max-width: 500px;
}

.info-icon {
  margin-left: 4px;
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  cursor: help;
  vertical-align: middle;
}
</style>
