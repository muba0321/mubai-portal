import request from "@/utils/request";

const BACKUP_BASE = "/api/v1/backup";

// ==================== 类型定义 ====================

export interface BackupService {
  id: number;
  name: string;
  category: string;
  description: string;
  serverIp: string;
  serverName: string;
  port: number;
  processType?: string;
  processName?: string;
  backupMethod: string;
  backupPath: string;
  enabled: boolean;
  sort: number;
  lastBackup?: {
    status: string | null;
    filePath: string | null;
    fileSize: number | null;
    startedAt: string | null;
    duration: number | null;
  };
}

export interface ServiceStatus {
  serviceId: number;
  serviceName: string;
  serverIp: string;
  status: "running" | "stopped" | "error" | "unknown" | "skip";
  uptime: number | null;
  pid: number | null;
  portStatus: "open" | "closed" | "unknown";
  cpu: string | null;
  memory: string | null;
  error: string | null;
}

export interface ServiceDetail extends BackupService {
  backupScript: string;
  restoreSteps: RestoreStep[];
  stats: {
    totalLogs: number;
    successLogs: number;
    failedLogs: number;
    lastBackup: BackupService["lastBackup"];
  };
}

export interface RestoreStep {
  step: number;
  title: string;
  command: string;
}

export interface BackupLog {
  id: number;
  status: string;
  filePath: string;
  fileSize: number;
  errorMsg: string;
  duration: number;
  startedAt: string;
}

export interface BackupStats {
  total: number;
  enabled: number;
  disabled: number;
  categoryStats: { category: string; count: number }[];
  dailyStats: { date: string; count: number; success: number }[];
}

// ==================== API 方法 ====================

const BackupAPI = {
  /** 服务列表 */
  getServices(params: { pageNum?: number; pageSize?: number; category?: string; serverIp?: string; keyword?: string }) {
    return request<any, { total: number; list: BackupService[] }>({
      url: `${BACKUP_BASE}/services`,
      method: "get",
      params,
    });
  },

  /** 服务详情 */
  getService(id: number) {
    return request<any, ServiceDetail>({
      url: `${BACKUP_BASE}/services/${id}`,
      method: "get",
    });
  },

  /** 备份历史 */
  getLogs(serviceId: number, params?: { pageNum?: number; pageSize?: number }) {
    return request<any, { total: number; list: BackupLog[] }>({
      url: `${BACKUP_BASE}/services/${serviceId}/logs`,
      method: "get",
      params,
    });
  },

  /** 立即备份 */
  triggerBackup(serviceId: number) {
    return request<any, any>({
      url: `${BACKUP_BASE}/services/${serviceId}/backup`,
      method: "post",
    });
  },

  /** 执行恢复 */
  triggerRestore(serviceId: number, confirmName: string) {
    return request<any, any>({
      url: `${BACKUP_BASE}/services/${serviceId}/restore`,
      method: "post",
      data: { confirm: confirmName },
    });
  },

  /** 批量备份 */
  batchBackup() {
    return request<any, { total: number; results: any[] }>({
      url: `${BACKUP_BASE}/batch-backup`,
      method: "post",
    });
  },

  /** 全局统计 */
  getStats() {
    return request<any, BackupStats>({
      url: `${BACKUP_BASE}/stats`,
      method: "get",
    });
  },

  /** 更新服务配置 */
  updateService(id: number, data: Partial<BackupService>) {
    return request<any, any>({
      url: `${BACKUP_BASE}/services/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除备份记录 */
  deleteLog(serviceId: number, logId: number) {
    return request<any, any>({
      url: `${BACKUP_BASE}/services/${serviceId}/logs/${logId}`,
      method: "delete",
    });
  },

  // ==================== 服务状态检测 ====================

  /** 检测所有服务状态 */
  checkAllStatus() {
    return request<any, ServiceStatus[]>({
      url: `${BACKUP_BASE}/status/check`,
      method: "post",
    });
  },

  /** 启动服务 */
  startService(serviceId: number) {
    return request<any, any>({
      url: `${BACKUP_BASE}/services/${serviceId}/start`,
      method: "post",
    });
  },

  /** 停止服务 */
  stopService(serviceId: number) {
    return request<any, any>({
      url: `${BACKUP_BASE}/services/${serviceId}/stop`,
      method: "post",
    });
  },

  /** 重启服务 */
  restartService(serviceId: number) {
    return request<any, any>({
      url: `${BACKUP_BASE}/services/${serviceId}/restart`,
      method: "post",
    });
  },
};

export default BackupAPI;
