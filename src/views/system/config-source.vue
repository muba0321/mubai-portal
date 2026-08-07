<template>
  <div class="config-source-settings">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">配置源管理</span>
          <el-tag :type="statusTagType" size="small">
            {{ sourceLabels[configStatus.currentSource || 'fallback'] }}
          </el-tag>
        </div>
      </template>

      <!-- 配置源状态 -->
      <el-descriptions :column="2" border size="default">
        <el-descriptions-item label="当前配置源">
          <el-tag :type="statusTagType" effect="dark">
            {{ sourceLabels[configStatus.currentSource || 'fallback'] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Apollo 状态">
          <el-tag :type="configStatus.apolloConnected ? 'success' : 'danger'" effect="dark">
            {{ configStatus.apolloConnected ? '已连接' : '未连接' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Apollo 服务地址">
          {{ configStatus.apolloServer || '未启用' }}
        </el-descriptions-item>
        <el-descriptions-item label="Apollo 配置数量">
          {{ configStatus.apolloConfigCount || 0 }} 项
        </el-descriptions-item>
      </el-descriptions>

      <!-- 配置源切换 -->
      <div class="switch-section">
        <div class="section-title">切换配置源</div>
        <el-radio-group v-model="selectedSource" @change="(val: any) => handleSourceChange(val)">
          <el-radio-button value="fallback">
            <el-icon><Connection /></el-icon>
            Apollo 优先 + 本地兜底
          </el-radio-button>
          <el-radio-button value="apollo">
            <el-icon><Cloud /></el-icon>
            仅 Apollo
          </el-radio-button>
          <el-radio-button value="local">
            <el-icon><Files /></el-icon>
            仅本地配置
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 配置预览 -->
      <div class="preview-section">
        <div class="section-title">配置预览</div>
        <el-table :data="previewData" size="small" stripe>
          <el-table-column prop="key" label="配置项" width="180" />
          <el-table-column prop="value" label="值">
            <template #default="{ row }">
              <span :class="{ 'sensitive': row.sensitive }">
                {{ row.value }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 说明 -->
      <el-alert
        title="配置源说明"
        type="info"
        :closable="false"
        show-icon
        class="mt-4"
      >
        <template #default>
          <ul class="info-list">
            <li><strong>Apollo 优先 + 本地兜底</strong>：优先从 Apollo 读取配置，读不到时使用 .env 文件中的配置（推荐生产使用）</li>
            <li><strong>仅 Apollo</strong>：只从 Apollo 读取配置，Apollo 不可用时配置将失效</li>
            <li><strong>仅本地配置</strong>：只使用 .env 文件中的配置，不连接 Apollo</li>
          </ul>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Connection, Cloudy, Files } from "@element-plus/icons-vue";
import ConfigSourceAPI, { type ConfigSourceStatus } from "@/api/config-source";

const sourceLabels: Record<string, string> = {
  fallback: "Apollo 优先 + 本地兜底",
  apollo: "仅 Apollo",
  local: "仅本地配置",
};

const configStatus = ref<ConfigSourceStatus>({
  currentSource: "fallback",
  apolloEnabled: false,
  apolloConnected: false,
  apolloConfigCount: 0,
  apolloServer: null,
});

const selectedSource = ref("fallback");
const loading = ref(false);

const statusTagType = computed(() => {
  const map: Record<string, "success" | "warning" | "info" | "primary" | "danger" | undefined> = {
    fallback: undefined,
    apollo: "success",
    local: "warning",
  };
  return map[configStatus.value.currentSource] || undefined;
});

interface PreviewItem {
  key: string;
  value: string;
  sensitive: boolean;
}

const previewData = ref<PreviewItem[]>([]);

async function loadStatus() {
  try {
    const data = await ConfigSourceAPI.getStatus();
    configStatus.value = data;
    selectedSource.value = data.currentSource || "fallback";
  } catch {
    ElMessage.error("获取配置源状态失败");
  }
}

async function loadPreview() {
  try {
    const data = await ConfigSourceAPI.preview();
    const sensitiveKeys = ["database.url", "ai.api_key", "jwt.secret_key", "secret_key"];
    previewData.value = Object.entries(data).map(([key, value]) => ({
      key,
      value: value ?? "未配置",
      sensitive: sensitiveKeys.includes(key),
    }));
  } catch {
    // 静默失败
  }
}

async function handleSourceChange(source: string) {
  if (source === configStatus.value.currentSource) return;

  loading.value = true;
  try {
    await ConfigSourceAPI.switchSource(source as "apollo" | "local" | "fallback");
    ElMessage.success(`配置源已切换为: ${sourceLabels[source]}`);
    await loadStatus();
    await loadPreview();
  } catch {
    ElMessage.error("切换配置源失败");
    selectedSource.value = configStatus.value.currentSource || "fallback";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStatus();
  loadPreview();
});
</script>

<style lang="scss" scoped>
.config-source-settings {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .card-title {
    font-size: 16px;
    font-weight: 600;
  }
}

.switch-section {
  margin-top: 24px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--el-text-color-primary);
  }

  .el-radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .el-radio-button {
    .el-icon {
      margin-right: 4px;
    }
  }
}

.preview-section {
  margin-top: 24px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--el-text-color-primary);
  }

  .sensitive {
    font-family: monospace;
    color: var(--el-color-warning);
  }
}

.info-list {
  margin: 0;
  padding-left: 16px;

  li {
    margin: 4px 0;
    font-size: 13px;
    line-height: 1.6;
  }
}

.mt-4 {
  margin-top: 16px;
}
</style>
