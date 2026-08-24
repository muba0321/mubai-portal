<template>
  <div class="tree-node">
    <!-- 文件夹节点 -->
    <div v-if="node.type === 'folder' || node.children" class="folder-item" :style="{ paddingLeft: (depth * 16 + 8) + 'px' }">
      <div class="folder-header" @click="toggleExpand">
        <el-icon class="expand-icon" :class="{ expanded: isExpanded }"><ArrowRight /></el-icon>
        <el-icon class="folder-icon"><Folder /></el-icon>
        <span class="folder-name">{{ node.name }}</span>
        <el-tag v-if="node.fileCount" size="small" type="info" style="margin-left: auto">{{ node.fileCount }}</el-tag>
      </div>
      <div v-if="isExpanded" class="folder-children">
        <tree-node
          v-for="child in node.children"
          :key="child.name || child.path"
          :node="child"
          :depth="depth + 1"
          :selected-file="selectedFile"
          @open-file="$emit('openFile', $event)"
        />
      </div>
    </div>

    <!-- 文件节点 -->
    <div
      v-else
      class="file-item"
      :class="{ active: selectedFile === node.path }"
      :style="{ paddingLeft: (depth * 16 + 32) + 'px' }"
      @click="$emit('openFile', node)"
    >
      <el-icon :class="getFileIconClass(node.fileExt)"><component :is="getFileIcon(node.fileExt)" /></el-icon>
      <span class="file-name">{{ node.title || node.name }}</span>
      <el-tag v-if="node.fileExt" size="small" :type="getExtTagType(node.fileExt)" style="margin-left: auto; flex-shrink: 0">{{ node.fileExt.replace('.', '') }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ArrowRight, Folder, Document, DataLine, Setting, Files } from "@element-plus/icons-vue";

const props = defineProps<{
  node: any;
  depth: number;
  selectedFile: string;
}>();

defineEmits<{
  openFile: [node: any];
}>();

const isExpanded = ref(props.depth < 1);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function getFileIcon(ext?: string) {
  if (!ext) return Document;
  const e = ext.toLowerCase();
  if (e === ".md") return Document;
  if (e === ".sh" || e === ".py" || e === ".js" || e === ".ts") return DataLine;
  if (e === ".yml" || e === ".yaml" || e === ".json" || e === ".toml" || e === ".xml") return Setting;
  if (e === ".sql" || e === ".csv") return Files;
  return Document;
}

function getFileIconClass(ext?: string) {
  const e = ext?.toLowerCase() || "";
  if (e === ".sh" || e === ".py") return "icon-script";
  if (e === ".yml" || e === ".yaml" || e === ".json") return "icon-config";
  return "";
}

function getExtTagType(ext?: string) {
  const e = ext?.toLowerCase() || "";
  if (e === ".md") return "";
  if (e === ".sh" || e === ".py" || e === ".js" || e === ".ts") return "success";
  if (e === ".yml" || e === ".yaml" || e === ".json") return "warning";
  return "info";
}
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.folder-header:hover {
  background: #f5f7fa;
}

.expand-icon {
  font-size: 12px;
  color: #909399;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.folder-icon {
  color: #e6a23c;
  font-size: 14px;
  flex-shrink: 0;
}

.folder-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.file-item:hover {
  background: #f5f7fa;
}

.file-item.active {
  background: #ecf5ff;
  color: #409eff;
}

.file-item .el-icon {
  color: #909399;
  font-size: 14px;
  flex-shrink: 0;
}

.file-item.active .el-icon {
  color: #409eff;
}

.icon-script .el-icon {
  color: #67c23a;
}

.icon-config .el-icon {
  color: #e6a23c;
}

.file-name {
  font-size: 13px;
  white-space: nowrap;
  flex: 1;
}
</style>
