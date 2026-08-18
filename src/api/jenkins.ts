import request from "@/utils/request";

const JENKINS_BASE = "/api/v1/jenkins";

export interface JenkinsJob {
  name: string;
  displayName: string;
  color: string;
  healthScore: number;
  lastBuild?: {
    number: number;
    status: string;
    timestamp: string;
  };
}

export interface JenkinsBuild {
  number: number;
  status: string;
  duration: number;
  timestamp: string;
  url: string;
}

export interface JenkinsNode {
  name: string;
  displayName: string;
  offline: boolean;
  numExecutors: number;
  numExecutorsBusy: number;
}

export const JenkinsAPI = {
  /** 获取所有流水线 */
  getPipelines() {
    return request<any, JenkinsJob[]>({
      url: `${JENKINS_BASE}/pipelines`,
      method: "get",
    });
  },

  /** 触发构建 */
  triggerBuild(jobName: string, params?: { parameters?: Record<string, string> }) {
    return request({
      url: `${JENKINS_BASE}/pipelines/${jobName}/build`,
      method: "post",
      data: params,
    });
  },

  /** 获取构建历史 */
  getBuilds(jobName: string, params?: { page?: number; pageSize?: number }) {
    return request<any, { list: JenkinsBuild[]; total: number; page: number; pageSize: number }>({
      url: `${JENKINS_BASE}/pipelines/${jobName}/builds`,
      method: "get",
      params,
    });
  },

  /** 获取构建详情 */
  getBuildDetail(jobName: string, buildNumber: number) {
    return request({
      url: `${JENKINS_BASE}/pipelines/${jobName}/builds/${buildNumber}`,
      method: "get",
    });
  },

  /** 获取构建日志 */
  getBuildLog(jobName: string, buildNumber: number) {
    return request({
      url: `${JENKINS_BASE}/pipelines/${jobName}/builds/${buildNumber}/log`,
      method: "get",
    });
  },

  /** 获取节点列表 */
  getNodes() {
    return request<any, JenkinsNode[]>({
      url: `${JENKINS_BASE}/nodes`,
      method: "get",
    });
  },

  /** 获取节点详情 */
  getNodeDetail(nodeName: string) {
    return request({
      url: `${JENKINS_BASE}/nodes/${nodeName}`,
      method: "get",
    });
  },

  /** 获取队列状态 */
  getQueue() {
    return request({
      url: `${JENKINS_BASE}/queue`,
      method: "get",
    });
  },
};

export default JenkinsAPI;
