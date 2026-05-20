import request from "@/utils/request";

const MONITORING_BASE_URL = "/v1/monitoring";

// ============ 全局总览 ============

export interface MonitoringSummary {
  serverOnline: number;
  totalTargets: number;
  upTargets: number;
  downTargets: number;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  alertCount: number;
}

export interface TargetStatus {
  job: string;
  instance: string;
  health: string;
  lastError: string;
}

export interface ServerInfo {
  name: string;
  ip: string;
  os: string;
  cpu: number;
  memory: number;
  disk: number;
  load: number;
  services: string[];
}

export interface EchartsData {
  categories: string[];
  series: { name: string; data: number[] }[];
}

export interface DiskInfo {
  server: string;
  instance: string;
  usage: number;
}

export interface MysqlMetrics {
  connections: number;
  maxConnections: number;
  qps: number;
  slowQueries: number;
  threadsRunning: number;
  uptimeSeconds: number;
}

export interface JenkinsMetrics {
  runningBuilds: number;
  queueSize: number;
  executorsTotal: number;
  executorsFree: number;
  executorsBusy: number;
}

const MonitoringAPI = {
  /** 全局 KPI 概览 */
  getSummary() {
    return request<any, MonitoringSummary>({
      url: `${MONITORING_BASE_URL}/summary`,
      method: "get",
    });
  },

  /** Prometheus Target 状态列表 */
  getTargets() {
    return request<any, TargetStatus[]>({
      url: `${MONITORING_BASE_URL}/targets`,
      method: "get",
    });
  },

  /** 服务器状态快照 */
  getServers() {
    return request<any, ServerInfo[]>({
      url: `${MONITORING_BASE_URL}/servers`,
      method: "get",
    });
  },

  /** CPU 使用率时序数据 */
  getCpuMetrics(range = 24, step = "5m") {
    return request<any, EchartsData>({
      url: `${MONITORING_BASE_URL}/metrics/cpu`,
      method: "get",
      params: { range, step },
    });
  },

  /** 内存使用率时序数据 */
  getMemoryMetrics(range = 24, step = "5m") {
    return request<any, EchartsData>({
      url: `${MONITORING_BASE_URL}/metrics/memory`,
      method: "get",
      params: { range, step },
    });
  },

  /** 磁盘使用率 */
  getDiskMetrics() {
    return request<any, DiskInfo[]>({
      url: `${MONITORING_BASE_URL}/metrics/disk`,
      method: "get",
    });
  },

  /** 网络流量时序数据 */
  getNetworkMetrics(range = 24, step = "5m") {
    return request<any, EchartsData>({
      url: `${MONITORING_BASE_URL}/metrics/network`,
      method: "get",
      params: { range, step },
    });
  },

  /** MySQL 核心指标 */
  getMysqlMetrics() {
    return request<any, MysqlMetrics>({
      url: `${MONITORING_BASE_URL}/mysql`,
      method: "get",
    });
  },

  /** Jenkins 核心指标 */
  getJenkinsMetrics() {
    return request<any, JenkinsMetrics>({
      url: `${MONITORING_BASE_URL}/jenkins`,
      method: "get",
    });
  },
};

export default MonitoringAPI;
