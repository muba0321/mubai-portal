<template>
  <div class="diff-view" v-loading="loading">
    <div v-if="diffFiles.length > 0" class="diff-content">
      <div class="diff-header">
        <span class="diff-title">代码变更 - {{ diffFiles.length }} 个文件</span>
        <div class="diff-stats">
          <el-tag type="success">+{{ totalAdditions }}</el-tag>
          <el-tag type="danger">-{{ totalDeletions }}</el-tag>
        </div>
      </div>

      <div v-for="(file, idx) in diffFiles" :key="idx" class="diff-file">
        <div class="diff-file-header">
          <el-icon><Document /></el-icon>
          <span class="file-path">{{ file.path }}</span>
          <el-tag type="success" size="small">+{{ file.additions }}</el-tag>
          <el-tag type="danger" size="small">-{{ file.deletions }}</el-tag>
        </div>

        <div class="diff-hunks">
          <div v-for="(hunk, hIdx) in file.hunks" :key="hIdx" class="diff-hunk">
            <div class="hunk-header">{{ hunk.header }}</div>
            <div class="hunk-content">
              <div
                v-for="(line, lIdx) in hunk.lines"
                :key="lIdx"
                :class="getLineClass(line)"
              >
                <span class="line-marker">{{ getLineMarker(line) }}</span>
                <span class="line-content">{{ getLineContent(line) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-else description="无代码变更" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Document } from "@element-plus/icons-vue";
import { GitAPI, type DiffFile } from "@/api/git";
import { ElMessage } from "element-plus";

const props = defineProps<{
  repo: string;
  hash: string;
}>();

const diffFiles = ref<DiffFile[]>([]);
const loading = ref(true);

const totalAdditions = computed(() =>
  diffFiles.value.reduce((sum, f) => sum + f.additions, 0)
);

const totalDeletions = computed(() =>
  diffFiles.value.reduce((sum, f) => sum + f.deletions, 0)
);

function getLineClass(line: string): string {
  if (line.startsWith("+")) return "line-add";
  if (line.startsWith("-")) return "line-del";
  if (line.startsWith("@@")) return "line-hunk";
  return "line-context";
}

function getLineMarker(line: string): string {
  if (line.startsWith("+")) return "+";
  if (line.startsWith("-")) return "-";
  return " ";
}

function getLineContent(line: string): string {
  return line.substring(1);
}

async function loadDiff() {
  loading.value = true;
  try {
    diffFiles.value = await GitAPI.getDiff(props.repo, props.hash);
  } catch {
    ElMessage.error("加载 Diff 失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadDiff());
</script>

<style scoped>
.diff-view {
  .diff-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;

    .diff-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .diff-stats {
      display: flex;
      gap: 8px;
    }
  }

  .diff-file {
    margin-bottom: 20px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    overflow: hidden;

    .diff-file-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;

      .file-path {
        font-family: monospace;
        font-size: 13px;
        color: #606266;
        flex: 1;
      }
    }

    .diff-hunks {
      .diff-hunk {
        .hunk-header {
          padding: 6px 12px;
          background: #e6f7ff;
          font-family: monospace;
          font-size: 12px;
          color: #1890ff;
          border-bottom: 1px solid #91d5ff;
        }

        .hunk-content {
          .diff-line {
            display: flex;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 12px;
            line-height: 1.5;

            .line-marker {
              width: 20px;
              text-align: center;
              flex-shrink: 0;
              user-select: none;
            }

            .line-content {
              flex: 1;
              padding: 0 8px;
              white-space: pre-wrap;
              word-break: break-all;
            }
          }

          .line-add {
            background: #e6ffed;

            .line-marker {
              color: #28a745;
            }

            .line-content {
              color: #24292e;
            }
          }

          .line-del {
            background: #ffeef0;

            .line-marker {
              color: #d73a49;
            }

            .line-content {
              color: #24292e;
            }
          }

          .line-hunk {
            background: #f1f8ff;
            color: #0366d6;
          }

          .line-context {
            background: #fafbfc;
            color: #6a737d;
          }
        }
      }
    }
  }
}
</style>
