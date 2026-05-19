# Changelog

All notable changes to SRE Portal Frontend will be documented in this file.

## [1.0.5] - 2026-05-19

### Fixed
- 修复 Vite proxy rewrite 双重 /api 前缀问题，所有 API 路径改为 /v1/

### Changed
- 简化登录页：移除左侧企业宣传面板，表单居中展示
- 用户信息从顶部导航栏迁移至左侧边栏底部（头像+用户名+角色+退出）
- 头像使用 Element Plus el-avatar 组件，无头像时显示 User 图标
- 支持侧边栏收起时仅显示头像，居中布局

## [1.0.0] - 2026-05-13

### Added
- Vue3 + TypeScript + Element Plus 管理后台
- Dashboard 首页：功能卡片、系统状态、常用链接管理、最近访问
- CMDB 虚拟机管理：列表查询、增删改查、筛选（集群/租户/状态）
- 布局系统：侧边栏菜单、顶部导航栏、TagsView 标签页
- 路由守卫：自动登录、动态路由、401 拦截
- Vite 代理：开发环境代理到后端 http://127.0.0.1:5000
