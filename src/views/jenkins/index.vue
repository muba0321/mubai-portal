<template>
  <div class="jenkins-container">
    <!-- 顶部标签页 -->
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="流水线列表" name="pipelines">
        <pipelines-list />
      </el-tab-pane>
      <el-tab-pane label="节点管理" name="nodes">
        <nodes-list />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PipelinesList from "./components/PipelinesList.vue";
import NodesList from "./components/NodesList.vue";

const activeTab = ref("pipelines");
</script>

<style scoped>
.jenkins-container {
  padding: 20px;
}
</style>
