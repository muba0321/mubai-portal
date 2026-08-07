import request from "@/utils/request";

const GRAFANA_BASE_URL = "/api/v1/grafana";

export interface DashboardItem {
  uid: string;
  title: string;
  uri: string;
  url: string;
  slug: string;
  folderId: number;
  folderTitle: string;
  folderUid: string;
  tags: string[];
  isStarred: boolean;
}

export interface DashboardDetail {
  dashboard: any;
  meta: {
    canSave: boolean;
    canEdit: boolean;
    canAdmin: boolean;
    isStarred: boolean;
    created: string;
    updated: string;
    createdBy: string;
    updatedBy: string;
  };
}

export interface Datasource {
  id: number;
  uid: string;
  name: string;
  type: string;
  access: string;
  url: string;
  isDefault: boolean;
}

export interface Folder {
  id: number;
  uid: string;
  title: string;
}

const GrafanaAPI = {
  /** 获取所有面板列表 */
  getDashboards() {
    return request<any, DashboardItem[]>({
      url: `${GRAFANA_BASE_URL}/dashboards`,
      method: "get",
    });
  },

  /** 获取面板详情 */
  getDashboard(uid: string) {
    return request<any, DashboardDetail>({
      url: `${GRAFANA_BASE_URL}/dashboards/${uid}`,
      method: "get",
    });
  },

  /** 创建面板 */
  createDashboard(data: any) {
    return request({
      url: `${GRAFANA_BASE_URL}/dashboards`,
      method: "post",
      data,
    });
  },

  /** 更新面板 */
  updateDashboard(data: any) {
    return request({
      url: `${GRAFANA_BASE_URL}/dashboards`,
      method: "put",
      data,
    });
  },

  /** 删除面板 */
  deleteDashboard(uid: string) {
    return request({
      url: `${GRAFANA_BASE_URL}/dashboards/${uid}`,
      method: "delete",
    });
  },

  /** 获取所有数据源 */
  getDatasources() {
    return request<any, Datasource[]>({
      url: `${GRAFANA_BASE_URL}/datasources`,
      method: "get",
    });
  },

  /** 获取所有文件夹 */
  getFolders() {
    return request<any, Folder[]>({
      url: `${GRAFANA_BASE_URL}/folders`,
      method: "get",
    });
  },

  /** 创建文件夹 */
  createFolder(data: { title: string; uid?: string }) {
    return request({
      url: `${GRAFANA_BASE_URL}/folders`,
      method: "post",
      data,
    });
  },

  /** 删除文件夹 */
  deleteFolder(folderId: number) {
    return request({
      url: `${GRAFANA_BASE_URL}/folders/${folderId}`,
      method: "delete",
    });
  },

  /** AI 辅助生成/修改面板（同步，AI 生成完成后返回结果） */
  nlToPanel(data: {
    dashboard_uid: string;
    panel_id?: number;
    description: string;
    operation: "add" | "modify" | "delete";
  }) {
    return request<any, any>({
      url: `${GRAFANA_BASE_URL}/nl-to-panel`,
      method: "post",
      data,
      timeout: 180000,  // AI 调用可能耗时 60-90 秒
    });
  },

  // ==================== AI 生成记录 ====================

  /** 获取 AI 生成记录列表 */
  getAiHistory(params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    dashboardUid?: string;
  }) {
    return request<any, { list: AiHistoryItem[]; total: number }>({
      url: `${GRAFANA_BASE_URL}/ai-history`,
      method: "get",
      params,
    });
  },

  /** 获取 AI 生成记录详情 */
  getAiHistoryDetail(id: number) {
    return request<any, AiHistoryItem>({
      url: `${GRAFANA_BASE_URL}/ai-history/${id}`,
      method: "get",
    });
  },

  /** 删除 AI 生成记录 */
  deleteAiHistory(id: number) {
    return request({
      url: `${GRAFANA_BASE_URL}/ai-history/${id}`,
      method: "delete",
    });
  },
};

export default GrafanaAPI;

// ==================== AI 生成记录类型 ====================

export interface AiHistoryItem {
  id: number;
  dashboardUid: string;
  dashboardTitle: string;
  operation: string;
  description: string;
  panelJson: any;
  explanation: string;
  status: string;
  errorMsg: string | null;
  userId: number;
  username: string;
  createdAt: string;
}
