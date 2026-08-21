<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="执行测试"
    width="700px"
    @close="emit('update:modelValue', false)"
  >
    <div v-loading="loading">
      <template v-if="testCase">
        <div style="margin-bottom: 16px">
          <h3>{{ testCase.title }}</h3>
          <el-tag :type="testCase.testType === 'api' ? 'primary' : 'success'" size="small">
            {{ testCase.testType === 'api' ? 'API 测试' : '手工测试' }}
          </el-tag>
        </div>

        <!-- API 测试执行 -->
        <template v-if="testCase.testType === 'api'">
          <el-descriptions :column="2" border style="margin-bottom: 16px">
            <el-descriptions-item label="方法">{{ testCase.apiMethod }}</el-descriptions-item>
            <el-descriptions-item label="期望状态码">{{ testCase.apiExpectedStatus }}</el-descriptions-item>
            <el-descriptions-item label="URL" :span="2">{{ testCase.apiUrl }}</el-descriptions-item>
          </el-descriptions>

          <div style="margin-bottom: 16px">
            <el-button type="primary" @click="executeApi" :loading="executing">
              <el-icon><VideoPlay /></el-icon> 执行测试
            </el-button>
          </div>

          <div v-if="execResult" style="margin-top: 16px">
            <el-result :icon="execResult.result === 'pass' ? 'success' : 'error'" :title="execResult.result === 'pass' ? '测试通过' : '测试失败'">
              <template #sub-title>
                <div>耗时: {{ execResult.durationMs }}ms</div>
                <div v-if="execResult.details">
                  状态码匹配: {{ execResult.details.status_match ? '✅' : '❌' }}
                  响应体匹配: {{ execResult.details.body_match ? '✅' : '❌' }}
                </div>
              </template>
            </el-result>

            <el-collapse v-if="execResult.actualResponse">
              <el-collapse-item title="实际响应" name="response">
                <pre style="background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 4px; overflow: auto; max-height: 300px">{{ execResult.actualResponse }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </template>

        <!-- 手工测试执行 -->
        <template v-else>
          <div v-if="testCase.preconditions" style="margin-bottom: 16px; padding: 12px; background: #f0f9eb; border-radius: 6px">
            <strong>前置条件:</strong>
            <div>{{ testCase.preconditions }}</div>
          </div>

          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center">
            <span style="font-weight: 600">测试步骤</span>
          </div>

          <div v-for="(step, index) in stepResults" :key="index" style="margin-bottom: 12px; padding: 12px; background: #f5f7fa; border-radius: 6px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
              <span style="font-weight: 600">步骤 {{ index + 1 }}</span>
              <el-radio-group v-model="step.status" size="small">
                <el-radio-button value="pass">通过</el-radio-button>
                <el-radio-button value="fail">失败</el-radio-button>
                <el-radio-button value="skip">跳过</el-radio-button>
              </el-radio-group>
            </div>
            <div style="margin-bottom: 4px"><strong>操作:</strong> {{ step.action }}</div>
            <div style="margin-bottom: 8px"><strong>期望:</strong> {{ step.expected }}</div>
            <el-input v-model="step.actualResult" type="textarea" :rows="2" placeholder="实际结果..." />
          </div>

          <div style="margin-top: 16px; text-align: center">
            <el-button type="primary" @click="submitManual" :loading="executing">提交结果</el-button>
          </div>
        </template>
      </template>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { VideoPlay } from "@element-plus/icons-vue";
import { TestCaseAPI, type TestCase } from "@/api/test-case";
import { ElMessage } from "element-plus";

const props = defineProps<{
  modelValue: boolean;
  caseId?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  done: [];
}>();

const loading = ref(false);
const executing = ref(false);
const testCase = ref<TestCase | null>(null);
const execResult = ref<any>(null);
const stepResults = ref<any[]>([]);

async function loadCase() {
  if (!props.caseId) return;
  loading.value = true;
  try {
    testCase.value = await TestCaseAPI.getDetail(props.caseId);
    if (testCase.value.testType === "manual" && testCase.value.manualSteps) {
      stepResults.value = testCase.value.manualSteps.map((s: any) => ({
        ...s,
        status: "skip",
        actualResult: "",
      }));
    }
    execResult.value = null;
  } catch {} finally {
    loading.value = false;
  }
}

async function executeApi() {
  if (!props.caseId) return;
  executing.value = true;
  try {
    const result = await TestCaseAPI.execute(props.caseId);
    execResult.value = result;
    ElMessage.success(result.result === "pass" ? "测试通过" : "测试失败");
    emit("done");
  } catch {
    ElMessage.error("执行失败");
  } finally {
    executing.value = false;
  }
}

async function submitManual() {
  if (!props.caseId) return;
  executing.value = true;
  try {
    await TestCaseAPI.execute(props.caseId, {
      stepResults: stepResults.value,
    });
    ElMessage.success("结果已提交");
    emit("update:modelValue", false);
    emit("done");
  } catch {
    ElMessage.error("提交失败");
  } finally {
    executing.value = false;
  }
}

watch(() => props.caseId, loadCase);
watch(() => props.modelValue, (val) => {
  if (val) loadCase();
});
</script>
