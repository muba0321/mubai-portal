<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="caseId ? '编辑用例' : '新建用例'"
    width="800px"
    @close="emit('update:modelValue', false)"
  >
    <el-form :model="form" label-width="100px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="标题" required>
            <el-input v-model="form.title" placeholder="输入用例标题" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属项目" required>
            <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%">
              <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="测试类型">
            <el-select v-model="form.testType" style="width: 100%">
              <el-option label="API 测试" value="api" />
              <el-option label="手工测试" value="manual" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="优先级">
            <el-select v-model="form.priority" style="width: 100%">
              <el-option label="P0 紧急" value="P0" />
              <el-option label="P1 高" value="P1" />
              <el-option label="P2 中" value="P2" />
              <el-option label="P3 低" value="P3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="草稿" value="draft" />
              <el-option label="活跃" value="active" />
              <el-option label="已归档" value="archived" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="用例描述..." />
      </el-form-item>

      <!-- API 测试配置 -->
      <template v-if="form.testType === 'api'">
        <el-divider content-position="left">API 配置</el-divider>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="方法">
              <el-select v-model="form.apiMethod" style="width: 100%">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="18">
            <el-form-item label="URL">
              <el-input v-model="form.apiUrl" placeholder="https://api.example.com/endpoint" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="请求头">
          <el-input v-model="apiHeadersText" type="textarea" :rows="3" placeholder="JSON 格式，如：&#10;{&quot;Content-Type&quot;: &quot;application/json&quot;}" />
        </el-form-item>

        <el-form-item label="请求体">
          <el-input v-model="form.apiBody" type="textarea" :rows="4" placeholder="JSON 格式请求体" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="期望状态码">
              <el-input-number v-model="form.apiExpectedStatus" :min="100" :max="599" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="期望响应体">
          <el-input v-model="form.apiExpectedBody" type="textarea" :rows="3" placeholder="JSON 格式，用于匹配实际响应" />
        </el-form-item>
      </template>

      <!-- 手工测试步骤 -->
      <template v-if="form.testType === 'manual'">
        <el-divider content-position="left">手工测试步骤</el-divider>
        <el-form-item label="前置条件">
          <el-input v-model="form.preconditions" type="textarea" :rows="2" placeholder="测试前需要满足的条件..." />
        </el-form-item>

        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: 600">测试步骤</span>
          <el-button type="primary" size="small" @click="addStep">
            <el-icon><Plus /></el-icon> 添加步骤
          </el-button>
        </div>

        <div v-for="(step, index) in manualSteps" :key="index" style="margin-bottom: 12px; padding: 12px; background: #f5f7fa; border-radius: 6px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
            <span style="font-weight: 600">步骤 {{ index + 1 }}</span>
            <el-button type="danger" link size="small" @click="removeStep(index)">删除</el-button>
          </div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-input v-model="step.action" placeholder="操作描述" />
            </el-col>
            <el-col :span="12">
              <el-input v-model="step.expected" placeholder="期望结果" />
            </el-col>
          </el-row>
        </div>
      </template>

      <!-- 关联需求 -->
      <el-divider content-position="left">关联需求</el-divider>
      <el-form-item label="需求">
        <el-select
          v-model="selectedReqIds"
          multiple
          placeholder="请先选择项目，再选择需求"
          :disabled="!form.projectId"
          style="width: 100%"
        >
          <el-option
            v-for="req in filteredRequirements"
            :key="req.id"
            :label="req.title"
            :value="req.id"
          />
        </el-select>
        <div v-if="!form.projectId" style="font-size: 12px; color: #909399; margin-top: 4px">
          请先选择所属项目
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { TestCaseAPI, type TestCase } from "@/api/test-case";
import { type Project, type Requirement } from "@/api/requirement";
import { ElMessage } from "element-plus";

const props = defineProps<{
  modelValue: boolean;
  caseId?: number;
  projects: Project[];
  requirements: Requirement[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [];
}>();

const saving = ref(false);
const form = ref<Partial<TestCase>>({
  title: "",
  description: "",
  testType: "manual",
  priority: "P2",
  status: "draft",
  projectId: undefined,
  apiMethod: "GET",
  apiExpectedStatus: 200,
});

const apiHeadersText = ref("");
const manualSteps = ref<{ step: number; action: string; expected: string }[]>([]);
const selectedReqIds = ref<number[]>([]);

// 根据所选项目过滤需求
const filteredRequirements = computed(() => {
  if (!form.value.projectId) return [];
  return props.requirements.filter((r) => r.projectId === form.value.projectId);
});

function addStep() {
  manualSteps.value.push({
    step: manualSteps.value.length + 1,
    action: "",
    expected: "",
  });
}

function removeStep(index: number) {
  manualSteps.value.splice(index, 1);
  manualSteps.value.forEach((s, i) => (s.step = i + 1));
}

async function handleSave() {
  if (!form.value.title) {
    ElMessage.warning("请输入标题");
    return;
  }
  if (!form.value.projectId) {
    ElMessage.warning("请选择项目");
    return;
  }

  saving.value = true;
  try {
    // 解析 headers
    let headers = undefined;
    if (apiHeadersText.value) {
      try {
        headers = JSON.parse(apiHeadersText.value);
      } catch {
        ElMessage.error("请求头 JSON 格式错误");
        return;
      }
    }

    const data: any = {
      ...form.value,
      apiHeaders: headers,
      manualSteps: manualSteps.value,
      requirementIds: selectedReqIds.value,
    };

    if (props.caseId) {
      await TestCaseAPI.update(props.caseId, data);
      ElMessage.success("更新成功");
    } else {
      await TestCaseAPI.create(data);
      ElMessage.success("创建成功");
    }

    emit("update:modelValue", false);
    emit("saved");
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    saving.value = false;
  }
}

// 当项目变化时，清空已选需求
watch(() => form.value.projectId, (newProjectId, oldProjectId) => {
  if (newProjectId !== oldProjectId) {
    selectedReqIds.value = [];
  }
});

// 加载已有用例数据
watch([() => props.caseId, () => props.modelValue], async ([newId, isOpen]) => {
  if (newId && isOpen) {
    try {
      const detail = await TestCaseAPI.getDetail(newId);
      // 逐个赋值确保响应式更新
      form.value.title = detail.title || "";
      form.value.description = detail.description || "";
      form.value.testType = detail.testType || "manual";
      form.value.priority = detail.priority || "P2";
      form.value.status = detail.status || "draft";
      form.value.projectId = detail.projectId;
      form.value.apiMethod = detail.apiMethod || "GET";
      form.value.apiUrl = detail.apiUrl || "";
      form.value.apiHeaders = detail.apiHeaders;
      form.value.apiBody = detail.apiBody || "";
      form.value.apiExpectedStatus = detail.apiExpectedStatus || 200;
      form.value.apiExpectedBody = detail.apiExpectedBody || "";
      form.value.manualSteps = detail.manualSteps;
      form.value.preconditions = detail.preconditions || "";

      apiHeadersText.value = detail.apiHeaders ? JSON.stringify(detail.apiHeaders, null, 2) : "";
      manualSteps.value = detail.manualSteps || [];

      // 加载关联需求
      const reqs = await TestCaseAPI.getRequirements(newId);
      selectedReqIds.value = reqs.map((r: any) => r.id);
    } catch (err) {
      console.error("加载用例失败:", err);
    }
  } else if (!newId && isOpen) {
    // 重置表单
    form.value.title = "";
    form.value.description = "";
    form.value.testType = "manual";
    form.value.priority = "P2";
    form.value.status = "draft";
    form.value.projectId = undefined;
    form.value.apiMethod = "GET";
    form.value.apiUrl = "";
    form.value.apiHeaders = undefined;
    form.value.apiBody = "";
    form.value.apiExpectedStatus = 200;
    form.value.apiExpectedBody = "";
    form.value.manualSteps = undefined;
    form.value.preconditions = "";

    apiHeadersText.value = "";
    manualSteps.value = [];
    selectedReqIds.value = [];
  }
});
</script>
