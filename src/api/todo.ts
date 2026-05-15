import request from "@/utils/request";
import type {
  ProjectItem,
  ProjectForm,
  TodoItem,
  TodoForm,
  TodoQueryParams,
} from "@/types/api";

const BASE_URL = "/api/v1/todo";

/** 项目 API */
export const ProjectAPI = {
  /** 获取项目列表 */
  getList(status?: string) {
    return request<any, ProjectItem[]>({
      url: `${BASE_URL}/projects`,
      method: "get",
      params: status ? { status } : {},
    });
  },

  /** 创建项目 */
  create(data: ProjectForm) {
    return request<any, ProjectItem>({
      url: `${BASE_URL}/projects`,
      method: "post",
      data,
    });
  },

  /** 更新项目 */
  update(id: number, data: ProjectForm) {
    return request<any, ProjectItem>({
      url: `${BASE_URL}/projects/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除项目 */
  delete(id: number) {
    return request({
      url: `${BASE_URL}/projects/${id}`,
      method: "delete",
    });
  },
};

/** 待办项 API */
export const TodoAPI = {
  /** 获取项目下的待办项（树形） */
  getByProject(projectId: number) {
    return request<any, TodoItem[]>({
      url: `${BASE_URL}/projects/${projectId}/todos`,
      method: "get",
    });
  },

  /** 获取全部待办项（支持过滤） */
  getList(params?: TodoQueryParams) {
    return request<any, TodoItem[]>({
      url: `${BASE_URL}/todos`,
      method: "get",
      params,
    });
  },

  /** 创建待办项 */
  create(data: TodoForm) {
    return request<any, TodoItem>({
      url: `${BASE_URL}/todos`,
      method: "post",
      data,
    });
  },

  /** 更新待办项 */
  update(id: number, data: TodoForm) {
    return request<any, TodoItem>({
      url: `${BASE_URL}/todos/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除待办项 */
  delete(id: number) {
    return request({
      url: `${BASE_URL}/todos/${id}`,
      method: "delete",
    });
  },
};

export default { ProjectAPI, TodoAPI };
