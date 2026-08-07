import request from "@/utils/request";

const ANSIBLE_BASE = "/api/v1/ansible";

// ==================== 类型定义 ====================

export interface InventoryHost {
  name?: string;
  ansibleHost: string;
  internalIp: string;
  os: string;
  cpu: number;
  memory: string;
  status: string;
  cluster: string;
  accessUrl: string;
}

export interface CommandTemplate {
  id: number;
  name: string;
  category: string;
  command: string;
  description: string;
  module: string;
}

export interface JobResult {
  host: string;
  output: string;
  error: string;
  exit_code: number;
  status: string;
}

export interface AnsibleJob {
  id: number;
  jobName: string;
  jobType: string;
  module: string;
  targets: string[];
  status: string;
  createdBy: string;
  startedAt: string;
  duration: number;
  createdAt: string;
}

export interface AnsibleJobDetail extends AnsibleJob {
  moduleArgs: string;
  extraVars: Record<string, any>;
  finishedAt: string;
  results: Record<string, JobResult>;
  errorMsg: string;
}

export interface AnsibleSchedule {
  id: number;
  name: string;
  taskType: string;
  command: string;
  jobId: number;
  cronExpression: string;
  enabled: boolean;
  lastRun: string;
  lastStatus: string;
  createdBy: string;
  createdAt: string;
}

export interface ScheduleLog {
  id: number;
  status: string;
  output: string;
  errorMsg: string;
  duration: number;
  startedAt: string;
}

export interface TaskType {
  value: string;
  label: string;
  description: string;
}

export interface JobCreateRequest {
  name?: string;
  command: string;
  hosts: string[];
  job_type?: string;
  module?: string;
  extra_vars?: Record<string, any>;
}

// ==================== API 方法 ====================

const AnsibleAPI = {
  /** Ping 所有节点 */
  pingAll() {
    return request<any, any>({
      url: `${ANSIBLE_BASE}/ping`,
      method: "get",
    });
  },

  /** 获取主机清单（从 CMDB 读取） */
  getInventory(group?: string) {
    return request<any, { groups: any; hosts: Record<string, InventoryHost>; clusters: string[] }>({
      url: `${ANSIBLE_BASE}/inventory`,
      method: "get",
      params: group ? { group } : {},
    });
  },

  /** 获取快捷命令模板 */
  getCommands(category?: string) {
    return request<any, CommandTemplate[]>({
      url: `${ANSIBLE_BASE}/commands`,
      method: "get",
      params: category ? { category } : {},
    });
  },

  /** 创建快捷命令模板 */
  createCommand(data: { name: string; category: string; command: string; description?: string; module?: string }) {
    return request<any, any>({
      url: `${ANSIBLE_BASE}/commands`,
      method: "post",
      data,
    });
  },

  /** 删除快捷命令模板 */
  deleteCommand(id: number) {
    return request({
      url: `${ANSIBLE_BASE}/commands/${id}`,
      method: "delete",
    });
  },

  /** 创建并执行作业 */
  createJob(data: JobCreateRequest) {
    return request<any, {
      jobId: number;
      status: string;
      duration: number;
      totalHosts: number;
      successCount: number;
      failCount: number;
      results: Record<string, JobResult>;
    }>({
      url: `${ANSIBLE_BASE}/jobs`,
      method: "post",
      data,
    });
  },

  /** 作业历史列表（分页） */
  listJobs(params: { pageNum?: number; pageSize?: number; status?: string }) {
    return request<any, { total: number; list: AnsibleJob[] }>({
      url: `${ANSIBLE_BASE}/jobs`,
      method: "get",
      params,
    });
  },

  /** 作业详情 */
  getJob(jobId: number) {
    return request<any, AnsibleJobDetail>({
      url: `${ANSIBLE_BASE}/jobs/${jobId}`,
      method: "get",
    });
  },

  /** 定时任务列表 */
  listSchedules() {
    return request<any, AnsibleSchedule[]>({
      url: `${ANSIBLE_BASE}/schedules`,
      method: "get",
    });
  },

  /** 创建定时任务 */
  createSchedule(data: { name: string; taskType?: string; command?: string; jobId?: number; cronExpression: string; enabled?: boolean }) {
    return request<any, any>({
      url: `${ANSIBLE_BASE}/schedules`,
      method: "post",
      data,
    });
  },

  /** 更新定时任务 */
  updateSchedule(id: number, data: any) {
    return request({
      url: `${ANSIBLE_BASE}/schedules/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除定时任务 */
  deleteSchedule(id: number) {
    return request({
      url: `${ANSIBLE_BASE}/schedules/${id}`,
      method: "delete",
    });
  },

  /** 启停定时任务 */
  toggleSchedule(scheduleId: number) {
    return request<any, { id: number; enabled: boolean }>({
      url: `${ANSIBLE_BASE}/schedules/${scheduleId}/toggle`,
      method: "put",
    });
  },

  /** 获取定时任务执行历史 */
  getScheduleLogs(scheduleId: number, params?: { pageNum?: number; pageSize?: number }) {
    return request<any, { total: number; list: ScheduleLog[] }>({
      url: `${ANSIBLE_BASE}/schedules/${scheduleId}/logs`,
      method: "get",
      params,
    });
  },

  /** 获取内置任务类型 */
  getTaskTypes() {
    return request<any, TaskType[]>({
      url: `${ANSIBLE_BASE}/schedules/task-types`,
      method: "get",
    });
  },
};

export default AnsibleAPI;
