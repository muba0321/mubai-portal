<template>
  <div class="changelog-container">
    <!-- 功能切换 Tab -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-radio-group v-model="viewMode" size="large">
        <el-radio-button value="versions">
          <el-icon><List /></el-icon> 版本记录
        </el-radio-button>
        <el-radio-button value="repo">
          <el-icon><FolderOpened /></el-icon> 仓库信息
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 版本记录视图 -->
    <div v-if="viewMode === 'versions'">
    <el-card shadow="never" class="changelog-card">
      <template #header>
        <div class="changelog-header">
          <span class="changelog-title">版本更新记录</span>
          <el-tag type="info" size="small">当前版本 v{{ appVersion }}</el-tag>
        </div>
      </template>

      <el-timeline>
        <el-timeline-item
          v-for="(version, index) in versions"
          :key="version.version"
          :type="index === 0 ? 'primary' : 'info'"
          :hollow="index !== 0"
          :size="index === 0 ? 'large' : 'default'"
          :timestamp="version.date"
          placement="top"
        >
          <el-card
            shadow="hover"
            class="version-card"
            :class="{ 'version-card--latest': index === 0 }"
            @click="toggleVersion(version)"
          >
            <div class="version-header">
              <div class="version-info">
                <el-tag :type="index === 0 ? 'primary' : 'info'" size="small" effect="dark">
                  v{{ version.version }}
                </el-tag>
                <span class="version-name">{{ version.name }}</span>
              </div>
              <el-icon class="expand-icon" :class="{ 'expand-icon--rotated': version.expanded }">
                <ArrowDown />
              </el-icon>
            </div>

            <el-collapse-transition>
              <div v-show="version.expanded" class="version-details">
                <div v-if="version.summary" class="version-summary">
                  {{ version.summary }}
                </div>
                <div v-for="(section, key) in version.changes" :key="key" class="change-section">
                  <div class="change-section-title">
                    <el-icon>
                      <component :is="sectionIcons[key] || CircleCheck" />
                    </el-icon>
                    <span>{{ sectionLabels[key] || key }}</span>
                  </div>
                  <ul class="change-list">
                    <li v-for="(item, i) in section" :key="i">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </el-collapse-transition>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
    </div>

    <!-- 仓库信息视图 -->
    <RepoManagement v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ArrowDown, CircleCheck, Plus, Edit, Delete, List, FolderOpened } from "@element-plus/icons-vue";
import RepoManagement from "./components/RepoManagement.vue";

const viewMode = ref<"versions" | "repo">("versions");

import pkg from "@/../package.json";

const appVersion = pkg.version;

const sectionLabels: Record<string, string> = {
  feat: "新增功能",
  fix: "问题修复",
  optimize: "优化改进",
  refactor: "重构调整",
  chore: "工程维护",
};

const sectionIcons: Record<string, any> = {
  feat: Plus,
  fix: Edit,
  optimize: CircleCheck,
  refactor: Edit,
  chore: CircleCheck,
};

interface ChangeSection {
  [key: string]: string[];
}

interface Version {
  version: string;
  name: string;
  date: string;
  summary?: string;
  changes: ChangeSection;
  expanded: boolean;
}

const versions = ref<Version[]>([
  {
    version: "1.0.9",
    name: "Jenkins 集成 + 测试管理 + 知识管理 + 需求升级",
    date: "2026-08-25",
    summary: "新增 Jenkins 流水线管理、测试管理模块（22 个预置用例）、知识管理模块（WebDAV 同步 518 个文件）、待办升级为需求管理（审批流/里程碑/Git 关联）。",
    expanded: true,
    changes: {
      feat: [
        "新增 Jenkins 流水线管理（流水线列表/构建历史/日志/参数化构建/概览）",
        "新增 Jenkins CI/CD 自动部署（Jenkinsfile + 定时构建）",
        "新增测试管理模块（API 自动化/手工测试/看板/统计/22 个预置用例）",
        "新增知识管理模块（WebDAV 同步/递归目录树/全文搜索/518 个文件索引）",
        "新增服务备份管理（备份列表/实时状态检测/MD5 值显示）",
        "待办升级为需求管理（9 种状态/审批流/里程碑/Git 提交关联）",
        "新增项目列表拖拽排序功能",
        "新增需求按版本项目分组显示",
        "知识库支持 18 种文件类型（md/sh/py/yml/json/txt/conf 等）",
        "知识库文件类型图标区分（文档/脚本/配置）",
      ],
      fix: [
        "修复 Jenkins API 认证问题（Token 更新 + 用户名修正）",
        "修复 Jenkins 触发构建 415 错误（get_json silent 模式）",
        "修复 Jenkins 节点详情 400 错误（Built-In Node 映射）",
        "修复测试执行接口 415 错误",
        "修复测试用例 api_headers 覆盖 Authorization 问题",
        "修复知识库目录树只支持 2 层问题（改为递归任意深度）",
        "修复知识库文件名截断问题（添加横向滚动）",
        "修复知识库默认全部展开问题（改为默认折叠）",
        "修复知识库左右滚动联动问题（改为独立滚动）",
        "修复编辑用例表单数据不显示问题",
        "修复需求详情加载卡顿问题（新增 GET /<id> 端点）",
        "修复看板/统计/日历视图不显示问题",
        "修复提交时间显示为 UTC 问题（转换为北京时间 UTC+8）",
        "修复 Jenkinsfile 分支配置 main→master",
      ],
      optimize: [
        "知识库目录树支持任意深度递归展示",
        "知识库文件阅读器区分 Markdown 渲染和代码块展示",
        "测试用例编辑对话框支持项目筛选需求",
        "需求日历视图展示 Git 提交记录",
        "构建概览支持 stages 步骤条可视化",
        "前端 TreeNode 递归组件优化",
        "后端 scan_files() 支持 18 种文件格式",
      ],
      chore: [
        "前后端版本统一封版至 v1.0.9",
        "新增 WebDAV 持久挂载 systemd 服务",
        "新增知识库定时同步 systemd timer（每小时）",
        "新增数据库表 kb_files/kb_sync_log",
        "新增测试模块 4 张表（test_case/requirement_map/execution/step）",
        "更新版本记录页面",
      ],
    },
  },
  {
    version: "1.0.8",
    name: "代码库管理功能",
    date: "2026-08-14",
    summary: "新增代码库管理功能（仓库概览、提交历史、分支/标签列表、文件浏览、Diff 视图、Blame 视图），优化提交历史界面，添加本地缓存作为 GitHub API 后备数据源。",
    expanded: true,
    changes: {
      feat: ["新增仓库概览（前端/后端仓库信息展示）", "新增提交历史（支持按时间查看、搜索功能）", "新增分支列表（显示仓库分支信息）", "新增标签列表（显示仓库标签信息）", "新增文件浏览（浏览仓库文件目录结构）", "新增提交详情（Diff 代码对比视图）", "新增 Blame 视图（显示文件每行最后修改信息）"],
      fix: ["修复 GitHub API author 字段解析错误（处理 None 情况）", "修复提交历史 API 500 错误", "修复 Docker 镜像缓存导致代码未更新问题"],
      optimize: ["提交历史界面优化（移除类型筛选，简化界面）", "添加本地缓存作为 GitHub API 失败时的后备数据源（50 条提交记录）"],
      chore: ["前后端版本统一封版至 v1.0.8", "更新版本记录页面", "新增开发环境配置文档"],
    },
  },
  {
    version: "1.0.7",
    name: "指标与告警管理 + 运维中心 + 数据库 AI",
    date: "2026-05-29",
    summary: "新增指标与告警管理系统、运维中心（Ansible）、数据库 AI SQL 生成、Grafana 面板 AI 辅助生成，完善系统管理模块。",
    expanded: false,
    changes: {
      feat: ["新增指标与告警管理页面（指标库/告警规则/通知渠道/模板市场）", "新增运维中心（作业执行/作业历史/定时任务/主机清单）", "新增 Ansible 运维自动化模块（主机清单/Ping检测/作业调度）", "数据库管理 AI SQL 生成（通义千问 DashScope Coding Plan 对接）", "Grafana 面板 AI 辅助生成（自然语言描述 -> 面板 JSON）", "新增审批流系统（审批模板/审批记录/审批步骤）", "完善系统管理（部门管理/角色管理/菜单管理/操作日志/用户管理）"],
      fix: ["修复所有 API 路径 /v1/ -> /api/v1/ 统一规范", "修复 auth.py 登录接口 user.role -> user.identity 适配", "修复 Layout 组件 SCSS 变量未导入导致的构建失败", "修复 settings_cache 配置加载问题", "修复 nginx proxy_pass 多余的 /api/ 后缀导致双重路径"],
      optimize: ["配置 nginx 静态资源缓存策略（JS/CSS 1天缓存 + must-revalidate）", "index.html 设置为 no-cache 强制浏览器获取最新版本", "告警模块响应格式统一为 {code, data} 标准格式", "AI 配置从数据库 sys_config 表加载，支持动态更新"],
      chore: ["前后端版本统一封版至 v1.0.7", "更新版本记录页面"],
    },
  },
  {
    version: "1.0.6",
    name: "监控面板 AI 管理模块 & 服务器配置优化",
    date: "2026-05-25",
    summary: "新增 Grafana 监控面板 AI 辅助管理（自然语言生成/修改面板），Prometheus API 代理查询，Grafana API Key 迁移至数据库存储，登录页版权信息更新。",
    expanded: true,
    changes: {
      feat: ["新增 Grafana 面板管理页面（面板 CRUD、数据源列表、文件夹管理）", "新增 AI 辅助面板生成（自然语言描述 → Grafana 面板 JSON，支持新增/修改/删除）", "新增 Prometheus API 代理查询端点（POST /v1/monitoring/query）", "新增快捷模板按钮（CPU/内存/磁盘/网络/负载/TCP）", "新增 AI 结果预览弹窗（JSON 预览 + 变更说明 + 导入指引）"],
      optimize: ["Grafana API Key 从 docker-compose.yml 迁移至数据库 sys_config 表，提升安全性", "登录页底部版权信息更新", "简化 AI 面板保存流程，支持 provisioned 仪表盘导入指引"],
      chore: ["前后端版本号升级至 1.0.6", "更新 CHANGELOG 记录", "新增交接文档和 K8S/Jenkins 规划文档"],
    },
  },
  {
    version: "1.0.5",
    name: "API 路径修复 & 用户信息迁移",
    date: "2026-05-19",
    summary: "修复 Vite proxy 双重 /api 前缀问题，用户信息从顶部导航栏迁移至侧边栏底部，登录页简化。",
    expanded: true,
    changes: {
      fix: ["修复 Vite proxy rewrite 双重 /api 前缀问题，所有 API 路径从 /api/v1/ 改为 /v1/", "修复 Docker nginx upstream 服务名不匹配导致容器崩溃（backend → sre-portal-backend）"],
      optimize: ["简化登录页：移除左侧企业宣传面板，表单居中展示", "用户信息从顶部导航栏迁移至左侧边栏底部（头像+用户名+角色+退出）", "头像使用 Element Plus el-avatar 组件，无头像时显示 User 图标", "侧边栏收起时仅显示头像，居中布局"],
      chore: ["前后端版本号升级至 1.0.5", "更新 CHANGELOG 记录"],
    },
  },
  {
    version: "1.0.4",
    name: "导航栏优化 & 版本管理",
    date: "2026-05-15",
    summary: "移除 Logo 图标，新增版本记录页面，侧边栏样式优化，前后端版本统一。",
    expanded: true,
    changes: {
      feat: ["新增版本记录页面（时间线布局，点击展开/收起）", "侧边栏新增版本记录导航项"],
      optimize: ["移除侧边栏顶部 Logo 图标，仅保留文字", "侧边栏菜单项圆角 + 渐变激活态 + hover 过渡动画", "统一使用 Element Plus 内置图标（HomeFilled / Monitor / DataBoard / List / Stamp）"],
      chore: ["前端 package.json 版本号升级至 1.0.4", "后端新增 VERSION 文件"],
    },
  },
  {
    version: "1.0.3",
    name: "部署配置统一 & 侧边栏优化",
    date: "2026-05-15",
    summary: "统一本地和服务器部署配置，优化侧边栏导航体验。",
    expanded: true,
    changes: {
      feat: ["侧边栏新增 Element Plus 图标（HomeFilled / Monitor / DataBoard / List）", "新增版本更新记录页面"],
      fix: ["修复 AI 模型调用失败问题（qwen-coder-plus 改为 qwen3.5-plus）", "统一前后端部署配置，解决服务器部署路径不一致问题"],
      optimize: ["侧边栏菜单项添加圆角、hover 过渡动画、激活态渐变效果", "简化 nginx 代理配置，统一使用 /prod-api/ 前缀", "后端 .env.production 数据库连接改为 Docker 容器名"],
      chore: ["新增 docker-compose.prod.yml 和 deploy/docker-compose.yml", "更新 .env.production.example 模板"],
    },
  },
  {
    version: "1.0.2",
    name: "数据库管理与 AI 辅助",
    date: "2026-05-14",
    summary: "新增数据库管理模块，支持自然语言转 SQL。",
    expanded: false,
    changes: {
      feat: ["新增数据库管理页面（SQL 查询、表结构、表数据）", "新增创建数据库功能", "集成通义千问 AI 模型，实现自然语言转 SQL"],
      optimize: ["数据库管理页面新增连接信息显示"],
      chore: ["后端新增 database.py 视图模块"],
    },
  },
  {
    version: "1.0.1",
    name: "CMDB 与待办管理",
    date: "2026-05-13",
    summary: "新增虚拟机管理和待办管理模块。",
    expanded: false,
    changes: {
      feat: ["新增虚拟机管理页面（列表、搜索、分页）", "新增待办管理模块（项目维度、树形子待办）", "新增项目 CRUD 和待办项 CRUD"],
      optimize: ["优化首页 Dashboard 布局"],
    },
  },
  {
    version: "1.0.0",
    name: "项目初始化",
    date: "2026-04-24",
    summary: "SRE Portal 项目正式起步。",
    expanded: false,
    changes: {
      feat: ["用户登录/登出", "首页 Dashboard", "系统基础框架搭建"],
      chore: ["前端 Vue3 + Vite + Element Plus + TypeScript", "后端 Flask + SQLAlchemy + JWT 认证", "Docker 容器化部署方案"],
    },
  },
]);

function toggleVersion(version: Version) {
  version.expanded = !version.expanded;
}
</script>

<style lang="scss" scoped>
.changelog-container {
  padding: 20px;
}

.changelog-card {
  max-width: 800px;
  margin: 0 auto;

  :deep(.el-card__header) {
    padding: 16px 20px;
  }
}

.changelog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .changelog-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.version-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--el-border-color-lighter);

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  &--latest {
    border-color: var(--el-color-primary-light-5);
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.03), rgba(64, 158, 255, 0.01));
  }

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .version-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .version-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .expand-icon {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    transition: transform 0.3s ease;

    &--rotated {
      transform: rotate(180deg);
    }
  }
}

.version-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.version-summary {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.change-section {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.change-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);

  .el-icon {
    font-size: 14px;
  }
}

.change-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;

  li {
    position: relative;
    padding: 4px 0;
    padding-left: 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 12px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: var(--el-color-primary-light-5);
    }
  }
}

// Timeline 样式覆盖
:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

:deep(.el-timeline-item__node) {
  border-width: 2px;
}

:deep(.el-timeline-item__node--primary) {
  background-color: var(--el-color-primary) !important;
}
</style>
