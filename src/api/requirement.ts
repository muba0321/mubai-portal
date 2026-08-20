import request from "@/utils/request";

const REQ_BASE = "/api/v1/requirements";

// ==================== 类型定义 ====================

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: "active" | "archived";
  createdAt: string;
}

export interface Requirement {
  id: number;
  projectId: number;
  parentId: number | null;
  title: string;
  description: string;
  requirementType: "feature" | "bug" | "task" | "improvement" | "tech_debt";
  priority: "P0" | "P1" | "P2" | "P3";
  status: "proposed" | "under_review" | "approved" | "in_progress" | "blocked" | "in_testing" | "re_testing" | "done" | "rejected" | "cancelled";
  reporterId: number | null;
  assignee: string;
  assigneeId: number | null;
  milestoneId: number | null;
  dueDate: string | null;
  estimatedEffort: string | null;
  tags: string[];
  viewOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  dueDate: string | null;
  status: "active" | "completed" | "archived";
}

export interface RequirementKanbanColumn {
  category: string;
  requirements: Requirement[];
}

export interface KanbanData {
  backlog: Requirement[];
  in_review: Requirement[];
  planned: Requirement[];
  in_progress: Requirement[];
  testing: Requirement[];
  completed: Requirement[];
  canceled: Requirement[];
}

// ==================== API 方法 ====================

export const RequirementAPI = {
  // ========== 项目 ==========
  getProjects(status?: string) {
    return request<any, Project[]>({
      url: `${REQ_BASE}/projects`,
      method: "get",
      params: status ? { status } : {},
    });
  },

  createProject(data: { name: string; description?: string }) {
    return request<any, any>({
      url: `${REQ_BASE}/projects`,
      method: "post",
      data,
    });
  },

  updateProject(id: number, data: Partial<Project>) {
    return request<any, any>({
      url: `${REQ_BASE}/projects/${id}`,
      method: "put",
      data,
    });
  },

  deleteProject(id: number) {
    return request<any, any>({
      url: `${REQ_BASE}/projects/${id}`,
      method: "delete",
    });
  },

  // ========== 需求 CRUD ==========
  getRequirements(params?: {
    projectId?: number;
    status?: string;
    priority?: string;
    type?: string;
    assignee?: string;
    keyword?: string;
    milestoneId?: number;
  }) {
    return request<any, Requirement[]>({
      url: `${REQ_BASE}/`,
      method: "get",
      params,
    });
  },

  createRequirement(data: Partial<Requirement>) {
    return request<any, Requirement>({
      url: `${REQ_BASE}/`,
      method: "post",
      data,
    });
  },

  updateRequirement(id: number, data: Partial<Requirement>) {
    return request<any, Requirement>({
      url: `${REQ_BASE}/${id}`,
      method: "put",
      data,
    });
  },

  deleteRequirement(id: number) {
    return request<any, any>({
      url: `${REQ_BASE}/${id}`,
      method: "delete",
    });
  },

  // 状态转换（带状态机校验）
  transition(id: number, status: string) {
    return request<any, any>({
      url: `${REQ_BASE}/${id}/transition`,
      method: "post",
      data: { status },
    });
  },

  // ========== 看板 ==========
  getKanban(projectId?: number) {
    return request<any, KanbanData>({
      url: `${REQ_BASE}/kanban`,
      method: "get",
      params: projectId ? { projectId } : {},
    });
  },

  // ========== 日历 ==========
  getCalendarRequirements(projectId?: number, year?: number, month?: number) {
    return request<any, any>({
      url: `${REQ_BASE}/calendar/requirements`,
      method: "get",
      params: { projectId, year, month },
    });
  },

  getRequirementCommits(reqId: number) {
    return request<any, any[]>({
      url: `${REQ_BASE}/${reqId}/commits`,
      method: "get",
    });
  },
  getMilestones(projectId?: number) {
    return request<any, Milestone[]>({
      url: `${REQ_BASE}/milestones`,
      method: "get",
      params: projectId ? { projectId } : {},
    });
  },

  createMilestone(data: { projectId: number; title: string; description?: string; dueDate?: string }) {
    return request<any, Milestone>({
      url: `${REQ_BASE}/milestones`,
      method: "post",
      data,
    });
  },
};

// ==================== 兼容旧 API（供组件使用） ====================

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
  url: string;
}

export interface Comment {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

// 导出别名保持兼容
export const ProjectAPI = RequirementAPI;
export const TodoAPI = RequirementAPI;

export const TodoExtendAPI = {
  getTodosEnhanced(params?: {
    projectId?: number;
    assignee?: string;
    priority?: string;
    status?: string;
    tagId?: number;
    keyword?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
  }) {
    return RequirementAPI.getRequirements(params);
  },

  getKanban(projectId?: number) {
    return RequirementAPI.getKanban(projectId);
  },

  getCalendar(projectId?: number, year?: number, month?: number) {
    return request<any, any>({
      url: `${REQ_BASE}/calendar`,
      method: "get",
      params: { projectId, year, month },
    });
  },

  getStatistics(projectId?: number) {
    return request<any, any>({
      url: `${REQ_BASE}/statistics`,
      method: "get",
      params: projectId ? { projectId } : {},
    });
  },

  updateTodo(todoId: number, data: Partial<Requirement>) {
    return RequirementAPI.updateRequirement(todoId, data);
  },

  updateViewOrder(todoId: number, viewOrder: number) {
    return request<any, any>({
      url: `${REQ_BASE}/${todoId}/view-order`,
      method: "put",
      data: { viewOrder },
    });
  },

  // 附件
  uploadAttachment(todoId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<any, Attachment>({
      url: `${REQ_BASE}/attachments/${todoId}`,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  listAttachments(todoId: number) {
    return request<any, Attachment[]>({
      url: `${REQ_BASE}/attachments/${todoId}`,
      method: "get",
    });
  },

  deleteAttachment(attachmentId: number) {
    return request<any, any>({
      url: `${REQ_BASE}/attachments/${attachmentId}`,
      method: "delete",
    });
  },

  // 评论
  addComment(todoId: number, content: string) {
    return request<any, Comment>({
      url: `${REQ_BASE}/comments/${todoId}`,
      method: "post",
      data: { content },
    });
  },

  listComments(todoId: number) {
    return request<any, Comment[]>({
      url: `${REQ_BASE}/comments/${todoId}`,
      method: "get",
    });
  },

  updateComment(commentId: number, content: string) {
    return request<any, any>({
      url: `${REQ_BASE}/comments/${commentId}`,
      method: "put",
      data: { content },
    });
  },

  deleteComment(commentId: number) {
    return request<any, any>({
      url: `${REQ_BASE}/comments/${commentId}`,
      method: "delete",
    });
  },

  // 标签
  listTags() {
    return request<any, Tag[]>({
      url: `${REQ_BASE}/tags`,
      method: "get",
    });
  },

  createTag(name: string, color?: string) {
    return request<any, Tag>({
      url: `${REQ_BASE}/tags`,
      method: "post",
      data: { name, color },
    });
  },

  updateTag(tagId: number, data: { name?: string; color?: string }) {
    return request<any, any>({
      url: `${REQ_BASE}/tags/${tagId}`,
      method: "put",
      data,
    });
  },

  deleteTag(tagId: number) {
    return request<any, any>({
      url: `${REQ_BASE}/tags/${tagId}`,
      method: "delete",
    });
  },

  addTodoTag(todoId: number, tagId: number) {
    return request<any, any>({
      url: `${REQ_BASE}/tags/${todoId}`,
      method: "post",
      data: { tag_id: tagId },
    });
  },

  removeTodoTag(todoId: number, tagId: number) {
    return request<any, any>({
      url: `${REQ_BASE}/tags/${todoId}/${tagId}`,
      method: "delete",
    });
  },

  getTodoTags(todoId: number) {
    return request<any, Tag[]>({
      url: `${REQ_BASE}/tags/${todoId}`,
      method: "get",
    });
  },
};

export default RequirementAPI;
