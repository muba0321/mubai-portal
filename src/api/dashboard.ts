import request from "@/utils/request";

const DASHBOARD_BASE_URL = "/v1/dashboard";

export interface SystemStatus {
  serverOnline: number;
  serviceRunning: number;
  networkStatus: string;
  storageUsage: string;
  alertPending: number;
  cpuLoad: string;
  lastUpdated: string;
}

export interface CommonLink {
  id: number;
  title: string;
  description: string;
  url: string;
  icon: string;
  category?: string;
  sort: number;
}

export interface RecentVisit {
  pagePath: string;
  pageTitle: string;
  visitedAt: string;
}

const DashboardAPI = {
  /** 获取系统状态 */
  getSystemStatus() {
    return request<any, SystemStatus>({
      url: `${DASHBOARD_BASE_URL}/system-status`,
      method: "get",
    });
  },

  /** 获取常用链接 */
  getCommonLinks() {
    return request<any, CommonLink[]>({
      url: `${DASHBOARD_BASE_URL}/common-links`,
      method: "get",
    });
  },

  /** 获取最近访问记录 */
  getRecentVisits() {
    return request<any, RecentVisit[]>({
      url: `${DASHBOARD_BASE_URL}/recent-visits`,
      method: "get",
    });
  },

  /** 记录最近访问 */
  recordVisit(data: { pagePath: string; pageTitle: string }) {
    return request({
      url: `${DASHBOARD_BASE_URL}/recent-visits`,
      method: "post",
      data,
    });
  },

  /** 新增常用链接 */
  createLink(data: Partial<CommonLink>) {
    return request({
      url: `${DASHBOARD_BASE_URL}/common-links`,
      method: "post",
      data,
    });
  },

  /** 修改常用链接 */
  updateLink(id: number, data: Partial<CommonLink>) {
    return request({
      url: `${DASHBOARD_BASE_URL}/common-links/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除常用链接 */
  deleteLink(id: number) {
    return request({
      url: `${DASHBOARD_BASE_URL}/common-links/${id}`,
      method: "delete",
    });
  },

  /** 自动分类现有链接 */
  autoCategorize() {
    return request({
      url: `${DASHBOARD_BASE_URL}/common-links/auto-categorize`,
      method: "post",
    });
  },
};

export default DashboardAPI;
