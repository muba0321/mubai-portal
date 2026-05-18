<template>
  <div class="user-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索用户名"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 用户表格 -->
      <el-table :data="userList" stripe border style="width: 100%">
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
              {{ row.role === "admin" ? "管理员" : "普通用户" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleResetPwd(row)">重置密码</el-button>
            <el-popconfirm title="确认删除该用户？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link size="small" :disabled="row.username === 'mubai'">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="480px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="formData.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" :prop="isEdit ? undefined : 'password'">
          <el-input v-model="formData.password" type="password" show-password :placeholder="isEdit ? '不修改则留空' : '至少6位'" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="formData.role">
            <el-radio value="admin">管理员</el-radio>
            <el-radio value="user">普通用户</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="pwdDialogVisible" title="重置密码" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新密码">
          <el-input v-model="newPassword" type="password" show-password placeholder="至少6位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetPwdConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import UserAPI from "@/api/system/user";

defineOptions({ name: "UserManage" });

const userList = ref([] as any[]);
const total = ref(0);
const keyword = ref("");
const dialogVisible = ref(false);
const pwdDialogVisible = ref(false);
const isEdit = ref(false);
const editingId = ref(0);
const newPassword = ref("");

const formRef = ref();
const formData = reactive({
  username: "",
  password: "",
  email: "",
  role: "user",
});

const formRules = {
  username: [{ required: true, message: "用户名不能为空", trigger: "blur" }],
};

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: "",
});

async function fetchUsers() {
  try {
    const res = await UserAPI.list(queryParams);
    userList.value = res.list || [];
    total.value = res.total || 0;
  } catch {
    ElMessage.error("加载用户列表失败");
  }
}

function handleSearch() {
  queryParams.keyword = keyword.value;
  queryParams.pageNum = 1;
  fetchUsers();
}

function handleReset() {
  keyword.value = "";
  queryParams.keyword = "";
  queryParams.pageNum = 1;
  fetchUsers();
}

function handleCreate() {
  isEdit.value = false;
  editingId.value = 0;
  Object.assign(formData, { username: "", password: "", email: "", role: "user" });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isEdit.value = true;
  editingId.value = row.id;
  Object.assign(formData, {
    username: row.username,
    password: "",
    email: row.email,
    role: row.role,
  });
  dialogVisible.value = true;
}

async function handleConfirm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  try {
    if (isEdit.value) {
      const data: any = { email: formData.email, role: formData.role };
      if (formData.password) data.password = formData.password;
      await UserAPI.update(editingId.value, data);
      ElMessage.success("更新成功");
    } else {
      await UserAPI.create(formData);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    fetchUsers();
  } catch {
    ElMessage.error(isEdit.value ? "更新失败" : "创建失败");
  }
}

function handleResetPwd(row: any) {
  editingId.value = row.id;
  newPassword.value = "";
  pwdDialogVisible.value = true;
}

async function handleResetPwdConfirm() {
  if (!newPassword.value || newPassword.value.length < 6) {
    ElMessage.warning("密码至少6位");
    return;
  }
  try {
    await UserAPI.resetPassword(editingId.value, newPassword.value);
    ElMessage.success("密码重置成功");
    pwdDialogVisible.value = false;
  } catch {
    ElMessage.error("重置密码失败");
  }
}

async function handleDelete(row: any) {
  try {
    await UserAPI.remove(row.id);
    ElMessage.success("删除成功");
    fetchUsers();
  } catch {
    ElMessage.error("删除失败");
  }
}

onMounted(() => {
  fetchUsers();
});
</script>

<style lang="scss" scoped>
.user-container {
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

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
