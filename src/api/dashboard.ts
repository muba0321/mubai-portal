import request from "@/utils/request";

const DASHBOARD_BASE_URL = "/api/v1/dashboard";

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
};

export default DashboardAPI;
