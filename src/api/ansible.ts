import request from "@/utils/request";

const ANSIBLE_BASE = "/api/v1/ansible";

export interface AnsibleHost {
  name: string;
  ip: string;
  group: string;
}

export interface AnsibleJob {
  id: number;
  job_name: string;
  job_type: string;
  targets: string[];
  module?: string;
  module_args?: string;
  playbook_path?: string;
  script_path?: string;
  extra_vars?: Record<string, any>;
  status: string;
  created_by: string;
  started_at?: string;
  finished_at?: string;
  result?: any;
  error_msg?: string;
  created_at?: string;
}

export interface AnsibleJobListResult {
  items: AnsibleJob[];
  total: number;
  page: number;
  perPage: number;
}

export interface AnsibleSchedule {
  id: number;
  job_id: number;
  cron_expression: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  created_at?: string;
}

export interface JobCreateRequest {
  name?: string;
  type: "ad_hoc" | "playbook" | "script";
  hosts: string[];
  module?: string;
  args?: string;
  playbook?: string;
  script?: string;
  extra_vars?: string;
}

const AnsibleAPI = {
  /** Ping 所有节点 */
  pingAll() {
    return request<any, any>({
      url: `${ANSIBLE_BASE}/ping`,
      method: "get",
    });
  },

  /** 获取主机清单 */
  getInventory() {
    return request<any, Record<string, AnsibleHost>>({
      url: `${ANSIBLE_BASE}/inventory`,
      method: "get",
    });
  },

  /** 创建并执行作业 */
  createJob(data: JobCreateRequest) {
    return request<any, any>({
      url: `${ANSIBLE_BASE}/jobs`,
      method: "post",
      data,
    });
  },

  /** 作业历史列表（分页） */
  listJobs(params: { page?: number; per_page?: number }) {
    return request<any, AnsibleJobListResult>({
      url: `${ANSIBLE_BASE}/jobs`,
      method: "get",
      params,
    });
  },

  /** 作业详情 */
  getJob(jobId: number) {
    return request<any, AnsibleJob>({
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
  createSchedule(data: { job_id: number; cron: string; enabled?: boolean }) {
    return request<any, AnsibleSchedule>({
      url: `${ANSIBLE_BASE}/schedules`,
      method: "post",
      data,
    });
  },

  /** 启停定时任务 */
  toggleSchedule(scheduleId: number) {
    return request<any, AnsibleSchedule>({
      url: `${ANSIBLE_BASE}/schedules/${scheduleId}/toggle`,
      method: "put",
    });
  },
};

export default AnsibleAPI;
