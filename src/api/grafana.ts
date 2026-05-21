import request from "@/utils/request";

const GRAFANA_BASE_URL = "/v1/grafana";

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
};

export default GrafanaAPI;
