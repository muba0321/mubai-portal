<template>
  <div class="kanban-container">
    <div class="kanban-columns">
      <div v-for="status in statusList" :key="status.value" class="kanban-column">
        <div class="column-header" :style="{ borderColor: status.color }">
          <span :style="{ color: status.color }">{{ status.label }}</span>
          <span class="column-count">{{ getColumnCount(status.value) }}</span>
        </div>
        <div class="column-content">
          <div
            v-for="item in getColumnItems(status.value)"
            :key="item.id"
            class="kanban-card"
            @click="$emit('edit', item)"
          >
            <div class="card-header">
              <span class="card-title">{{ item.title }}</span>
              <el-tag :type="item.testType === 'api' ? 'primary' : 'success'" size="small">
                {{ item.testType === 'api' ? 'API' : '手工' }}
              </el-tag>
            </div>
            <div class="card-meta">
              <el-tag :type="priorityType(item.priority)" size="small">{{ item.priority }}</el-tag>
              <span class="req-count">需求: {{ item.reqCount || 0 }}</span>
            </div>
            <div class="card-actions">
              <el-button type="primary" link size="small" @click.stop="$emit('execute', item)">执行</el-button>
            </div>
          </div>
          <div v-if="getColumnItems(status.value).length === 0" class="empty-column">
            暂无用例
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type TestCase } from "@/api/test-case";
import { type Project } from "@/api/requirement";

const props = defineProps<{
  cases: TestCase[];
  projects: Project[];
}>();

defineEmits<{
  refresh: [];
  edit: [item: TestCase];
  execute: [item: TestCase];
}>();

const statusList = [
  { value: "draft", label: "草稿", color: "#909399" },
  { value: "active", label: "活跃", color: "#67c23a" },
  { value: "archived", label: "已归档", color: "#e6a23c" },
];

function priorityType(p: string) {
  const map: Record<string, "danger" | "warning" | "primary" | "info"> = {
    P0: "danger", P1: "warning", P2: "primary", P3: "info",
  };
  return map[p] || "info";
}

function getColumnItems(status: string) {
  return props.cases.filter((c) => c.status === status);
}

function getColumnCount(status: string) {
  return getColumnItems(status).length;
}
</script>

<style scoped>
.kanban-container {
  min-height: 500px;
}

.kanban-columns {
  display: flex;
  gap: 16px;
  overflow-x: auto;
}

.kanban-column {
  flex: 1;
  min-width: 280px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  padding: 12px 16px;
  border-top: 3px solid;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  font-weight: 600;
}

.column-count {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.column-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  min-height: 200px;
}

.kanban-card {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;

    .card-title {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .req-count {
      font-size: 12px;
      color: #909399;
    }
  }

  .card-actions {
    display: flex;
    gap: 8px;
  }
}

.empty-column {
  text-align: center;
  padding: 40px 20px;
  color: #c0c4cc;
  font-size: 13px;
}
</style>
