<template>
  <div class="database-container">
    <!-- 左侧面板 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="db-select-row">
          <el-select v-model="currentDatabase" placeholder="选择数据库" filterable style="flex: 1" @change="onDatabaseChange">
            <el-option v-for="db in databaseList" :key="db" :label="db" :value="db" />
          </el-select>
          <el-button type="primary" size="small" @click="showCreateDialog = true" title="创建数据库">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="table-list">
        <div class="table-list__title">
          <span>数据表 ({{ tableList.length }})</span>
          <el-button link type="primary" size="small" @click="fetchTables">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <el-input v-model="tableSearch" placeholder="搜索表名" clearable size="small" class="table-list__search">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <ul class="table-list__items">
          <li
            v-for="table in filteredTables"
            :key="table"
            :class="['table-list__item', { active: selectedTable === table }]"
            @click="selectTable(table)"
          >
            <el-icon><Grid /></el-icon>
            <span class="table-name">{{ table }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 右侧主区域 -->
    <div class="main-content">
      <!-- 连接信息栏 -->
      <div class="connection-info">
        <span class="conn-label">连接: </span>
        <span class="conn-value" v-if="connInfo">
          {{ connInfo.type }} @ {{ connInfo.host }}:{{ connInfo.port }} / {{ connInfo.database }}
        </span>
        <el-tag size="small" v-if="connInfo">{{ connInfo.version }}</el-tag>
        <el-button link type="primary" size="small" @click="fetchConnectionInfo">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>

      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" type="card" class="db-tabs">
        <!-- SQL 查询 -->
        <el-tab-pane label="SQL 查询" name="query">
          <div class="sql-editor">
            <!-- 自然语言输入区 -->
            <div class="nl-input">
              <el-input
                v-model="nlText"
                placeholder="用自然语言描述查询需求，如：查询所有用户信息，按创建时间倒序排列"
                clearable
                @keydown.enter="generateSQL"
              >
                <template #prepend>
                  <el-icon><ChatDotRound /></el-icon>
                </template>
              </el-input>
              <el-button type="success" :loading="nlLoading" @click="generateSQL" style="margin-left: 8px; white-space: nowrap">
                <el-icon><MagicStick /></el-icon>生成 SQL
              </el-button>
            </div>

            <el-input
              v-model="sqlText"
              type="textarea"
              :rows="8"
              placeholder="输入 SQL 语句 (仅支持 SELECT/SHOW/DESCRIBE/EXPLAIN)，或点击上方「生成 SQL」自动转换"
              class="sql-textarea"
              @keydown.ctrl.enter="executeSQL"
            />
            <div class="sql-actions">
              <el-button type="primary" :loading="sqlLoading" @click="executeSQL">
                <el-icon><CaretRight /></el-icon>执行
              </el-button>
              <el-button @click="sqlText = ''">清空</el-button>
              <span class="sql-hint">Ctrl+Enter 快捷执行</span>
            </div>

            <div v-if="sqlResult" class="sql-result">
              <div class="sql-result__header">
                <span>查询结果 ({{ sqlResult.total }} 条, 耗时 {{ sqlElapsed }}ms)</span>
              </div>
              <el-table :data="sqlResult.rows" border stripe max-height="500" style="width: 100%; margin-top: 8px">
                <el-table-column
                  v-for="col in sqlResult.columns"
                  :key="col"
                  :prop="col"
                  :label="col"
                  min-width="120"
                  show-overflow-tooltip
                />
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- 表结构 -->
        <el-tab-pane label="表结构" name="structure">
          <div v-if="!selectedTable" class="empty-state">请在左侧选择一个数据表</div>
          <div v-else>
            <div class="table-header">
              <span>表: <code>{{ selectedTable }}</code></span>
              <el-button link type="primary" size="small" @click="fetchTableColumns">
                <el-icon><Refresh /></el-icon>刷新
              </el-button>
            </div>
            <el-table :data="tableColumns" border stripe v-loading="columnLoading" style="width: 100%">
              <el-table-column label="#" width="50" type="index" />
              <el-table-column label="字段" prop="field" min-width="140" />
              <el-table-column label="类型" prop="type" min-width="160" />
              <el-table-column label="可为空" prop="null" width="80" align="center">
                <template #default="scope">
                  <el-tag v-if="scope.row.null === 'YES'" type="warning" size="small">YES</el-tag>
                  <el-tag v-else type="success" size="small">NO</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="键" prop="key" width="80" align="center">
                <template #default="scope">
                  <el-tag v-if="scope.row.key === 'PRI'" type="danger" size="small">PRI</el-tag>
                  <el-tag v-else-if="scope.row.key === 'UNI'" type="warning" size="small">UNI</el-tag>
                  <el-tag v-else-if="scope.row.key === 'MUL'" type="info" size="small">MUL</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="默认值" prop="default" min-width="120">
                <template #default="scope">
                  {{ scope.row.default ?? "NULL" }}
                </template>
              </el-table-column>
              <el-table-column label="额外" prop="extra" min-width="120" />
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 表数据 -->
        <el-tab-pane label="表数据" name="data">
          <div v-if="!selectedTable" class="empty-state">请在左侧选择一个数据表</div>
          <div v-else>
            <div class="table-header">
              <span>表: <code>{{ selectedTable }}</code> (共 {{ tableDataTotal }} 条)</span>
              <el-button link type="primary" size="small" @click="fetchTableData">
                <el-icon><Refresh /></el-icon>刷新
              </el-button>
            </div>
            <el-table :data="tableDataList" border stripe v-loading="dataLoading" style="width: 100%; margin-top: 8px" max-height="500">
              <el-table-column v-for="col in tableColumns.map(c => c.field)" :key="col" :prop="col" :label="col" min-width="120" show-overflow-tooltip />
            </el-table>
            <div class="pagination-wrapper">
              <el-pagination
                v-if="tableDataTotal > 0"
                v-model:current-page="tableDataPage"
                v-model:page-size="tableDataPageSize"
                :total="tableDataTotal"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next"
                @current-change="fetchTableData"
                @size-change="onPageSizeChange"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 创建数据库对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建数据库" width="480px" @closed="resetCreateForm">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="数据库名" required>
          <el-input v-model="createForm.name" placeholder="例如: my_database" />
        </el-form-item>
        <el-form-item label="字符集">
          <el-select v-model="createForm.charset" style="width: 100%">
            <el-option label="utf8mb4 (推荐)" value="utf8mb4" />
            <el-option label="utf8" value="utf8" />
            <el-option label="latin1" value="latin1" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序规则">
          <el-select v-model="createForm.collation" style="width: 100%">
            <el-option label="utf8mb4_general_ci (推荐)" value="utf8mb4_general_ci" />
            <el-option label="utf8mb4_unicode_ci" value="utf8mb4_unicode_ci" />
            <el-option label="utf8_general_ci" value="utf8_general_ci" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreateDatabase">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Refresh, Search, CaretRight, Grid, Plus, MagicStick, ChatDotRound } from "@element-plus/icons-vue";
import DatabaseAPI from "@/api/database";
import { ElMessage } from "element-plus";

defineOptions({ name: "Database" });

const currentDatabase = ref("");
const databaseList = ref<string[]>([]);
const tableList = ref<string[]>([]);
const tableSearch = ref("");
const selectedTable = ref("");
const activeTab = ref("query");

const connInfo = ref<{ type: string; host: string; port: number; user: string; database: string; version: string } | null>(null);

// 创建数据库
const showCreateDialog = ref(false);
const createLoading = ref(false);
const createForm = reactive({
  name: "",
  charset: "utf8mb4",
  collation: "utf8mb4_general_ci",
});

// 自然语言转 SQL
const nlText = ref("");
const nlLoading = ref(false);

// SQL 查询
const sqlText = ref("");
const sqlLoading = ref(false);
const sqlResult = ref<{ columns: string[]; rows: Array<Record<string, any>>; total: number } | null>(null);
const sqlElapsed = ref(0);

// 表结构
const tableColumns = ref<Array<Record<string, any>>>([]);
const columnLoading = ref(false);

// 表数据
const tableDataList = ref<Array<Record<string, any>>>([]);
const tableDataTotal = ref(0);
const tableDataPage = ref(1);
const tableDataPageSize = ref(20);
const dataLoading = ref(false);

const filteredTables = computed(() => {
  if (!tableSearch.value) return tableList.value;
  return tableList.value.filter((t) => t.toLowerCase().includes(tableSearch.value.toLowerCase()));
});

async function fetchDatabases() {
  try {
    const result = await DatabaseAPI.getDatabases();
    databaseList.value = result || [];
    if (databaseList.value.length > 0 && !currentDatabase.value) {
      currentDatabase.value = databaseList.value[0];
    }
  } catch {
    ElMessage.error("获取数据库列表失败");
  }
}

async function fetchTables() {
  try {
    const result = await DatabaseAPI.getTables(currentDatabase.value);
    tableList.value = result || [];
  } catch (e: any) {
    ElMessage.error(e.message || "获取表列表失败");
  }
}

async function fetchConnectionInfo() {
  try {
    const result = await DatabaseAPI.getConnectionInfo();
    connInfo.value = result;
  } catch {
    // 静默失败
  }
}

function onDatabaseChange() {
  selectedTable.value = "";
  tableColumns.value = [];
  tableDataList.value = [];
  tableDataTotal.value = 0;
  fetchTables();
}

function selectTable(table: string) {
  selectedTable.value = table;
  fetchTableColumns();
}

async function fetchTableColumns() {
  if (!selectedTable.value) return;
  columnLoading.value = true;
  try {
    const result = await DatabaseAPI.getTableColumns(selectedTable.value, currentDatabase.value);
    tableColumns.value = result || [];
    tableDataPage.value = 1;
    fetchTableData();
  } catch (e: any) {
    ElMessage.error(e.message || "获取表结构失败");
  } finally {
    columnLoading.value = false;
  }
}

async function fetchTableData() {
  if (!selectedTable.value) return;
  dataLoading.value = true;
  try {
    const result = await DatabaseAPI.getTableData(selectedTable.value, tableDataPage.value, tableDataPageSize.value, currentDatabase.value);
    tableDataList.value = result?.list || [];
    tableDataTotal.value = result?.total || 0;
  } catch (e: any) {
    ElMessage.error(e.message || "获取表数据失败");
  } finally {
    dataLoading.value = false;
  }
}

function onPageSizeChange() {
  tableDataPage.value = 1;
  fetchTableData();
}

async function executeSQL() {
  if (!sqlText.value.trim()) {
    ElMessage.warning("请输入 SQL 语句");
    return;
  }
  sqlLoading.value = true;
  sqlResult.value = null;
  const start = Date.now();
  try {
    const result = await DatabaseAPI.executeSQL(sqlText.value);
    sqlElapsed.value = Date.now() - start;
    sqlResult.value = result || { columns: [], rows: [], total: 0 };
    ElMessage.success(`查询成功，共 ${sqlResult.value.total} 条记录`);
  } catch (e: any) {
    sqlElapsed.value = Date.now() - start;
    ElMessage.error(e.message || "SQL 执行失败");
  } finally {
    sqlLoading.value = false;
  }
}

async function handleCreateDatabase() {
  if (!createForm.name.trim()) {
    ElMessage.warning("请输入数据库名称");
    return;
  }
  createLoading.value = true;
  try {
    const result = await DatabaseAPI.createDatabase(createForm.name.trim(), createForm.charset, createForm.collation);
    ElMessage.success(result?.msg || "数据库创建成功");
    showCreateDialog.value = false;
    await fetchDatabases();
    currentDatabase.value = createForm.name.trim();
    fetchTables();
  } catch (e: any) {
    ElMessage.error(e.message || "创建数据库失败");
  } finally {
    createLoading.value = false;
  }
}

function resetCreateForm() {
  createForm.name = "";
  createForm.charset = "utf8mb4";
  createForm.collation = "utf8mb4_general_ci";
}

async function generateSQL() {
  if (!nlText.value.trim()) {
    ElMessage.warning("请输入查询描述");
    return;
  }
  nlLoading.value = true;
  try {
    const result = await DatabaseAPI.nlToSQL(nlText.value.trim(), currentDatabase.value);
    if (result?.sql) {
      sqlText.value = result.sql;
      if (result.explanation) {
        ElMessage.success(`SQL 生成成功 — ${result.explanation}`);
      } else {
        ElMessage.success("SQL 生成成功");
      }
    } else {
      ElMessage.warning("未能生成 SQL，请提供更多表名或字段信息");
    }
  } catch (e: any) {
    ElMessage.error(e.message || "SQL 生成失败");
  } finally {
    nlLoading.value = false;
  }
}

onMounted(() => {
  fetchDatabases();
  fetchConnectionInfo();
});
</script>

<style lang="scss" scoped>
.database-container {
  display: flex;
  height: calc(100vh - 120px);
  gap: 12px;
}

.sidebar {
  width: 260px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  &-header {
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}

.db-select-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  &__search {
    padding: 0 8px 8px;
  }

  &__items {
    flex: 1;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
    color: var(--el-text-color-regular);
    transition: background 0.15s;

    &:hover {
      background: var(--el-color-primary-light-9);
    }

    &.active {
      background: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      font-weight: 500;
    }

    .table-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.main-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.connection-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;

  .conn-label {
    color: var(--el-text-color-secondary);
  }

  .conn-value {
    color: var(--el-text-color-regular);
    font-weight: 500;
  }
}

.db-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px;

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: auto;
  }
}

.sql-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .nl-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sql-textarea {
    font-family: "JetBrains Mono", "Fira Code", "Source Code Pro", monospace;
    font-size: 13px;
  }
}

.sql-actions {
  display: flex;
  align-items: center;
  gap: 8px;

  .sql-hint {
    margin-left: auto;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.sql-result {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 8px;
  margin-top: 4px;

  &__header {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 4px;
  }
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;

  code {
    background: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--el-color-primary);
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}
</style>
