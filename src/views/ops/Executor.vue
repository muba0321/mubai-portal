<template>
  <div class="ops-executor">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>作业执行</span>
          <el-button type="primary" :loading="executing" @click="executeJob">
            <el-icon><VideoPlay /></el-icon> 执行
          </el-button>
        </div>
      </template>

      <el-form :model="form" label-width="100px">
        <!-- 作业类型 -->
        <el-form-item label="作业类型">
          <el-radio-group v-model="form.type">
            <el-radio-button label="ad_hoc">Ad-Hoc 命令</el-radio-button>
            <el-radio-button label="playbook">Playbook</el-radio-button>
            <el-radio-button label="script">Script</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 目标主机 -->
        <el-form-item label="目标主机">
          <el-select v-model="form.hosts" multiple filterable placeholder="选择目标主机" style="width: 100%">
            <el-option label="all (全部)" value="all" />
            <el-option-group v-for="(hosts, group) in hostGroups" :key="group" :label="group">
              <el-option v-for="h in hosts" :key="h.name" :label="`${h.name} (${h.ip})`" :value="h.name" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <!-- Ad-Hoc 参数 -->
        <template v-if="form.type === 'ad_hoc'">
          <el-form-item label="模块">
            <el-input v-model="form.module" placeholder="例如: shell, command, ping, yum, service" />
          </el-form-item>
          <el-form-item label="模块参数">
            <el-input v-model="form.args" placeholder="例如: uptime, df -h, ls -la" />
          </el-form-item>
          <el-form-item label="Extra Vars">
            <el-input v-model="form.extra_vars" type="textarea" :rows="2" placeholder='JSON 格式，如 {"key": "value"}' />
          </el-form-item>
        </template>

        <!-- Playbook 参数 -->
        <template v-if="form.type === 'playbook'">
          <el-form-item label="Playbook 路径">
            <el-input v-model="form.playbook" placeholder="/opt/ansible-playbooks/playbooks/xxx.yml" />
          </el-form-item>
          <el-form-item label="Extra Vars">
            <el-input v-model="form.extra_vars" type="textarea" :rows="2" placeholder='JSON 格式' />
          </el-form-item>
        </template>

        <!-- Script 参数 -->
        <template v-if="form.type === 'script'">
          <el-form-item label="脚本路径">
            <el-input v-model="form.script" placeholder="/opt/ansible-playbooks/scripts/xxx.sh" />
          </el-form-item>
        </template>

        <!-- 快捷按钮 -->
        <el-form-item v-if="form.type === 'ad_hoc'" label="快捷命令">
          <el-space wrap>
            <el-button size="small" @click="quickCmd('uptime')">uptime</el-button>
            <el-button size="small" @click="quickCmd('df -h')">df -h</el-button>
            <el-button size="small" @click="quickCmd('free -m')">free -m</el-button>
            <el-button size="small" @click="quickCmd('top -bn1 | head -20')">top</el-button>
            <el-button size="small" @click="quickCmd('docker ps --format table')">docker ps</el-button>
            <el-button size="small" @click="quickCmd('systemctl status docker --no-pager')">systemctl docker</el-button>
          </el-space>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 输出区域 -->
    <el-card v-if="output" shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>执行结果</span>
          <el-tag :type="statusTagType">{{ statusLabel }}</el-tag>
        </div>
      </template>
      <pre class="output-box">{{ output }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay } from "@element-plus/icons-vue";
import AnsibleAPI, { type AnsibleHost } from "@/api/ansible";
import { ElMessage } from "element-plus";

defineOptions({ name: "AnsibleExecutor" });

const inventory = ref<Record<string, AnsibleHost>>({});
const executing = ref(false);
const output = ref("");
const rc = ref(-1);

const form = reactive({
  type: "ad_hoc" as string,
  hosts: [] as string[],
  module: "shell",
  args: "",
  playbook: "",
  script: "",
  extra_vars: "",
});

const hostGroups = computed(() => {
  const groups: Record<string, AnsibleHost[]> = {};
  for (const [name, host] of Object.entries(inventory.value)) {
    const g = host.group;
    if (!groups[g]) groups[g] = [];
    groups[g].push({ ...host, name });
  }
  return groups;
});

const statusLabel = computed(() => {
  if (rc.value === -1) return "等待执行";
  if (rc.value === 0) return "成功";
  return "失败";
});

const statusTagType = computed(() => {
  if (rc.value === -1) return "info";
  if (rc.value === 0) return "success";
  return "danger";
});

function quickCmd(cmd: string) {
  form.args = cmd;
}

async function executeJob() {
  if (form.hosts.length === 0) {
    ElMessage.warning("请选择目标主机");
    return;
  }
  if (form.type === "ad_hoc" && !form.module) {
    ElMessage.warning("请填写模块名称");
    return;
  }
  if (form.type === "playbook" && !form.playbook) {
    ElMessage.warning("请填写 Playbook 路径");
    return;
  }
  if (form.type === "script" && !form.script) {
    ElMessage.warning("请填写脚本路径");
    return;
  }

  executing.value = true;
  output.value = "";
  rc.value = -1;

  try {
    const result = await AnsibleAPI.createJob({
      name: `adhoc_${form.module || "script"}_${Date.now()}`,
      type: form.type as any,
      hosts: form.hosts,
      module: form.module || undefined,
      args: form.args || undefined,
      playbook: form.playbook || undefined,
      script: form.script || undefined,
      extra_vars: form.extra_vars || undefined,
    });
    output.value = result.output || "";
    if (result.error) {
      output.value += "\n--- STDERR ---\n" + result.error;
    }
    rc.value = result.rc ?? -1;
    if (result.status === "success") {
      ElMessage.success("执行成功");
    } else {
      ElMessage.error("执行失败");
    }
  } catch (e: any) {
    output.value = "执行出错: " + (e.message || e);
    ElMessage.error("执行出错");
  } finally {
    executing.value = false;
  }
}

async function fetchInventory() {
  try {
    inventory.value = await AnsibleAPI.getInventory();
  } catch { /* ignored */ }
}

fetchInventory();
</script>

<style scoped>
.ops-executor { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.output-box {
  background: #0d1117; color: #c9d1d9; padding: 16px; border-radius: 6px;
  font-family: "JetBrains Mono", "Fira Code", monospace; font-size: 13px;
  line-height: 1.5; max-height: 500px; overflow: auto; white-space: pre-wrap;
  word-break: break-all;
}
</style>
