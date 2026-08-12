<template>
  <div class="tag-list">
    <el-table :data="tags" stripe border>
      <el-table-column label="标签名称" min-width="150">
        <template #default="{ row }">
          <div class="tag-name">
            <el-icon><PriceTag /></el-icon>
            <el-tag type="success">{{ row.name }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="说明" min-width="300">
        <template #default="{ row }">{{ row.message || '-' }}</template>
      </el-table-column>
      <el-table-column label="日期" width="120">
        <template #default="{ row }">{{ row.date || '-' }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PriceTag } from "@element-plus/icons-vue";
import { GitAPI, type Tag } from "@/api/git";
import { ElMessage } from "element-plus";

const props = defineProps<{ repo: string }>();
const tags = ref<Tag[]>([]);

async function loadTags() {
  try {
    tags.value = await GitAPI.getTags(props.repo);
  } catch {
    ElMessage.error("加载标签列表失败");
  }
}

onMounted(() => loadTags());
</script>

<style scoped>
.tag-name {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
