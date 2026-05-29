import request from "@/utils/request";

export interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UserQuery {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
}

const BASE_URL = "/api/v1/users";

const UserAPI = {
  /** 获取用户列表 */
  list(params: UserQuery) {
    return request<any, { total: number; list: UserItem[] }>({
      url: BASE_URL,
      method: "get",
      params,
    });
  },

  /** 分页查询用户（高级版） */
  getPage(params: any) {
    return request<any, { total: number; list: any[] }>({
      url: BASE_URL,
      method: "get",
      params,
    });
  },

  /** 获取用户详情 */
  get(id: number) {
    return request<any, UserItem>({
      url: `${BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 获取用户表单数据 */
  getFormData(id: string) {
    return request<any, any>({
      url: `${BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /** 新增用户 */
  create(data: { username: string; password: string; email?: string; role?: string }) {
    return request({
      url: BASE_URL,
      method: "post",
      data,
    });
  },

  /** 更新用户 */
  update(id: number, data: { email?: string; role?: string; password?: string }) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除用户 */
  remove(id: number) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /** 批量删除用户 */
  deleteByIds(ids: string) {
    return request({
      url: `${BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /** 重置密码 */
  resetPassword(id: number, newPassword: string) {
    return request({
      url: `${BASE_URL}/${id}/password`,
      method: "put",
      data: { newPassword },
    });
  },

  /** 获取当前登录用户信息 */
  getInfo() {
    return request<any, { userId: number; username: string; email: string; role: string }>({
      url: `${BASE_URL}/me`,
      method: "get",
    });
  },

  /** 获取用户下拉选项 */
  getOptions() {
    return request<any, any[]>({
      url: `${BASE_URL}/options`,
      method: "get",
    });
  },

  /** 导出用户 */
  export(params: any) {
    return request<any, Blob>({
      url: `${BASE_URL}/export`,
      method: "get",
      params,
      responseType: "blob",
    });
  },

  /** 导入用户 */
  import(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<any, any>({
      url: `${BASE_URL}/import`,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** 下载导入模板 */
  downloadTemplate() {
    return request<any, Blob>({
      url: `${BASE_URL}/import-template`,
      method: "get",
      responseType: "blob",
    });
  },
};

export default UserAPI;
