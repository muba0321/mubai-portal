<template>
  <div class="app-container credential-page">
    <el-card shadow="hover">
      <template #header>
        <div class="panel-header">
          <span> 密码管理</span>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              placeholder="搜索服务名称..."
              clearable
              style="width: 200px"
              @input="loadCredentials"
            />
            <el-button type="primary" @click="openDialog()">
              <el-icon><Plus /></el-icon> 新增密码
            </el-button>
          </div>
        </div>
      </template>

      <!-- 分类标签 -->
      <div class="category-tabs">
        <el-tag
          v-for="cat in categories"
          :key="cat.value"
          :type="selectedCategory === cat.value ? 'primary' : 'info'"
          class="category-tag"
          @click="selectCategory(cat.value)"
        >
          <el-icon><component :is="cat.icon" /></el-icon>
          {{ cat.label }}
        </el-tag>
      </div>

      <!-- 密码列表 -->
      <el-table :data="credentials" v-loading="loading" stripe border>
        <el-table-column label="服务名称" min-width="150">
          <template #default="{ row }">
            <div class="service-name">
              <span class="name">{{ row.name }}</span>
              <el-tag size="small" type="info">{{ getCategoryLabel(row.category) }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="访问地址" min-width="150">
          <template #default="{ row }">
            <el-link v-if="row.url" :href="row.url" target="_blank" type="primary">
              {{ row.url }}
            </el-link>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="用户名" width="120">
          <template #default="{ row }">
            <span>{{ row.username || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="密码" width="150">
          <template #default="{ row }">
            <div class="password-cell">
              <span v-if="!showPassword[row.id]">********</span>
              <span v-else class="password-text">{{ row.password }}</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="togglePassword(row)"
              >
                {{ showPassword[row.id] ? '隐藏' : '显示' }}
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            <span>{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row.id!)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="footer-info">
        <span>共 {{ credentials.length }} 条记录</span>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑密码' : '新增密码'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="服务名称" required>
          <el-input v-model="form.name" placeholder="如：GitHub、阿里云、MySQL" />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="访问地址">
          <el-input v-model="form.url" placeholder="https://..." />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="账号/用户名" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="密码" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCredential">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Plus, Monitor, DataBoard, Link, Connection, Files } from "@element-plus/icons-vue";
import { CredentialAPI, type Credential, type CredentialCategory } from "@/api/credential";
import { ElMessage, ElMessageBox } from "element-plus";

const credentials = ref<Credential[]>([]);
const categories = ref<CredentialCategory[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const keyword = ref("");
const selectedCategory = ref<string | null>(null);
const showPassword = ref<Record<number, boolean>>({});
const isEdit = ref(false);

const form = ref<Partial<Credential>>({
  name: "",
  category: "other",
  url: "",
  username: "",
  password: "",
  remark: "",
});

const categoryIconMap: Record<string, any> = {
  server: Monitor,
  database: DataBoard,
  website: Link,
  api: Connection,
  other: Files,
};

async function loadCredentials() {
  loading.value = true;
  try {
    const data = await CredentialAPI.list({
      category: selectedCategory.value || undefined,
      keyword: keyword.value || undefined,
    });
    credentials.value = data || [];
  } catch (error) {
    ElMessage.error("加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  try {
    const data = await CredentialAPI.categories();
    categories.value = data || [];
  } catch (error) {
    // 使用默认分类
    categories.value = [
      { value: "server", label: "服务器", icon: "Monitor" },
      { value: "database", label: "数据库", icon: "DataBoard" },
      { value: "website", label: "网站", icon: "Link" },
      { value: "api", label: "API", icon: "Connection" },
      { value: "other", label: "其他", icon: "Files" },
    ];
  }
}

function selectCategory(category: string) {
  selectedCategory.value = selectedCategory.value === category ? null : category;
  loadCredentials();
}

function getCategoryLabel(category: string): string {
  const cat = categories.value.find((c) => c.value === category);
  return cat?.label || category;
}

async function togglePassword(row: Credential) {
  if (!showPassword.value[row.id!]) {
    // 获取真实密码
    try {
      const data = await CredentialAPI.get(row.id!);
      row.password = data.password;
    } catch (error) {
      ElMessage.error("获取密码失败");
      return;
    }
  }
  showPassword.value[row.id!] = !showPassword.value[row.id!];
}

function openDialog(credential?: Credential) {
  if (credential) {
    isEdit.value = true;
    form.value = {
      id: credential.id,
      name: credential.name,
      category: credential.category,
      url: credential.url,
      username: credential.username,
      password: "", // 不填充密码
      remark: credential.remark,
    };
  } else {
    isEdit.value = false;
    form.value = {
      name: "",
      category: "other",
      url: "",
      username: "",
      password: "",
      remark: "",
    };
  }
  dialogVisible.value = true;
}

async function saveCredential() {
  if (!form.value.name) {
    ElMessage.warning("请输入服务名称");
    return;
  }

  try {
    if (isEdit.value && form.value.id) {
      await CredentialAPI.update(form.value.id, form.value);
      ElMessage.success("更新成功");
    } else {
      await CredentialAPI.create(form.value);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    loadCredentials();
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm("确定要删除这条密码记录吗？", "警告", {
      type: "warning",
    });
    await CredentialAPI.delete(id);
    ElMessage.success("删除成功");
    loadCredentials();
  } catch {
    // 取消删除
  }
}

// 初始化加载
loadCategories();
loadCredentials();
</script>

<style scoped>
.credential-page {
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .category-tag {
    cursor: pointer;
    padding: 6px 12px;

    :deep(.el-icon) {
      margin-right: 4px;
    }
  }
}

.service-name {
  display: flex;
  align-items: center;
  gap: 8px;

  .name {
    font-weight: 600;
    color: #303133;
  }
}

.password-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .password-text {
    font-family: monospace;
    color: #f56c6c;
  }
}

.text-muted {
  color: #c0c4cc;
}

.footer-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  font-size: 13px;
  color: #909399;
}
</style>
