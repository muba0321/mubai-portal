import request from "@/utils/request";

const TODO_BASE = "/api/v1/todo";

// ==================== 原有 API ====================

export interface Project {
  id?: number;
  name: string;
  description?: string;
  status: "active" | "archived";
}

export interface TodoItem {
  id?: number;
  projectId: number;
  parentId?: number | null;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  dueDate?: string;
  viewOrder?: number;
  estimatedHours?: number;
  actualHours?: number;
  tags?: Tag[];
  children?: TodoItem[];
  createdAt?: string;
  updatedAt?: string;
}

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

// 原有 API
export const ProjectAPI = {
  getList(status?: string) {
    return request<any, Project[]>({
      url: `${TODO_BASE}/projects`,
      method: "get",
      params: status ? { status } : {},
    });
  },

  create(data: ProjectForm) {
    return request<any, Project>({
      url: `${TODO_BASE}/projects`,
      method: "post",
      data,
    });
  },

  update(id: number, data: ProjectForm) {
    return request<any, Project>({
      url: `${TODO_BASE}/projects/${id}`,
      method: "put",
      data,
    });
  },

  delete(id: number) {
    return request({
      url: `${TODO_BASE}/projects/${id}`,
      method: "delete",
    });
  },
};

export const TodoAPI = {
  getList(params?: TodoQueryParams) {
    return request<any, TodoItem[]>({
      url: `${TODO_BASE}/todos`,
      method: "get",
      params,
    });
  },

  create(data: TodoForm) {
    return request<any, TodoItem>({
      url: `${TODO_BASE}/todos`,
      method: "post",
      data,
    });
  },

  update(id: number, data: TodoForm) {
    return request<any, TodoItem>({
      url: `${TODO_BASE}/todos/${id}`,
      method: "put",
      data,
    });
  },

  delete(id: number) {
    return request({
      url: `${TODO_BASE}/todos/${id}`,
      method: "delete",
    });
  },
};

// ==================== 扩展 API ====================

export const TodoExtendAPI = {
  // 增强版任务列表（支持多条件筛选）
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
    return request<any, TodoItem[]>({
      url: `${TODO_BASE}/todos`,
      method: "get",
      params,
    });
  },

  // 看板视图
  getKanban(projectId?: number) {
    return request<any, {
      pending: TodoItem[];
      in_progress: TodoItem[];
      completed: TodoItem[];
      cancelled: TodoItem[];
    }>({
      url: `${TODO_BASE}/kanban`,
      method: "get",
      params: projectId ? { projectId } : {},
    });
  },

  // 日历视图
  getCalendar(projectId?: number, year?: number, month?: number) {
    return request<any, {
      year: number;
      month: number;
      events: Record<string, TodoItem[]>;
    }>({
      url: `${TODO_BASE}/calendar`,
      method: "get",
      params: { projectId, year, month },
    });
  },

  // 统计数据
  getStatistics(projectId?: number) {
    return request<any, {
      statusStats: Record<string, number>;
      priorityStats: Record<string, number>;
      assigneeStats: Record<string, { total: number; completed: number }>;
      trend: { date: string; completed: number }[];
      total: number;
    }>({
      url: `${TODO_BASE}/statistics`,
      method: "get",
      params: projectId ? { projectId } : {},
    });
  },

  // 更新任务状态（用于看板拖拽）
  updateTodo(todoId: number, data: Partial<TodoItem>) {
    return request<any, TodoItem>({
      url: `${TODO_BASE}/todos/${todoId}`,
      method: "put",
      data,
    });
  },

  // 更新看板排序
  updateViewOrder(todoId: number, viewOrder: number) {
    return request({
      url: `${TODO_BASE}/todos/${todoId}/view-order`,
      method: "put",
      data: { viewOrder },
    });
  },

  // ==================== 附件管理 ====================

  uploadAttachment(todoId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<any, Attachment>({
      url: `${TODO_BASE}/todos/${todoId}/attachments`,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  listAttachments(todoId: number) {
    return request<any, Attachment[]>({
      url: `${TODO_BASE}/todos/${todoId}/attachments`,
      method: "get",
    });
  },

  deleteAttachment(attachmentId: number) {
    return request({
      url: `${TODO_BASE}/attachments/${attachmentId}`,
      method: "delete",
    });
  },

  // ==================== 评论功能 ====================

  addComment(todoId: number, content: string) {
    return request<any, Comment>({
      url: `${TODO_BASE}/todos/${todoId}/comments`,
      method: "post",
      data: { content },
    });
  },

  listComments(todoId: number) {
    return request<any, Comment[]>({
      url: `${TODO_BASE}/todos/${todoId}/comments`,
      method: "get",
    });
  },

  updateComment(commentId: number, content: string) {
    return request({
      url: `${TODO_BASE}/comments/${commentId}`,
      method: "put",
      data: { content },
    });
  },

  deleteComment(commentId: number) {
    return request({
      url: `${TODO_BASE}/comments/${commentId}`,
      method: "delete",
    });
  },

  // ==================== 标签管理 ====================

  listTags() {
    return request<any, Tag[]>({
      url: `${TODO_BASE}/tags`,
      method: "get",
    });
  },

  createTag(name: string, color?: string) {
    return request<any, Tag>({
      url: `${TODO_BASE}/tags`,
      method: "post",
      data: { name, color },
    });
  },

  updateTag(tagId: number, data: { name?: string; color?: string }) {
    return request({
      url: `${TODO_BASE}/tags/${tagId}`,
      method: "put",
      data,
    });
  },

  deleteTag(tagId: number) {
    return request({
      url: `${TODO_BASE}/tags/${tagId}`,
      method: "delete",
    });
  },

  addTodoTag(todoId: number, tagId: number) {
    return request({
      url: `${TODO_BASE}/todos/${todoId}/tags`,
      method: "post",
      data: { tag_id: tagId },
    });
  },

  removeTodoTag(todoId: number, tagId: number) {
    return request({
      url: `${TODO_BASE}/todos/${todoId}/tags/${tagId}`,
      method: "delete",
    });
  },

  getTodoTags(todoId: number) {
    return request<any, Tag[]>({
      url: `${TODO_BASE}/todos/${todoId}/tags`,
      method: "get",
    });
  },
};

export default { ProjectAPI, TodoAPI, TodoExtendAPI };
