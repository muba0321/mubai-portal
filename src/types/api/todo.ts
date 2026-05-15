/** Todo 待办项类型定义 */

export interface ProjectItem {
  id?: number;
  name: string;
  description?: string;
  status: "active" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectForm {
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
  createdAt?: string;
  updatedAt?: string;
  children?: TodoItem[];
}

export interface TodoForm {
  id?: number;
  projectId: number;
  parentId?: number | null;
  title: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  dueDate?: string;
}

export interface TodoQueryParams {
  projectId?: number;
  status?: string;
  priority?: string;
}
