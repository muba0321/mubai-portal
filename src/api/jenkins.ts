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

export interface ParameterDefinition {
  name: string;
  type: "string" | "boolean" | "choice";
  description: string;
  defaultValue: string | boolean;
  choices?: string[];
}

export interface BuildStage {
  name: string;
  status: string;
  startTimeMillis: number;
  durationMillis: number;
  pauseDurationMillis: number;
}

export interface BuildOverview {
  name: string;
  status: string;
  startTimeMillis: number;
  durationMillis: number;
  stages: BuildStage[];
}

export const JenkinsAPI = {
  /** 获取所有流水线 */
  getPipelines() {
    return request<any, JenkinsJob[]>({
      url: `${JENKINS_BASE}/pipelines`,
      method: "get",
    });
  },

  /** 获取流水线配置（参数定义） */
  getJobConfig(jobName: string) {
    return request<any, { parameters: ParameterDefinition[]; hasParameters: boolean }>({
      url: `${JENKINS_BASE}/pipelines/${jobName}/config`,
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

  /** 获取构建概览（stages） */
  getBuildOverview(jobName: string, buildNumber: number) {
    return request<any, BuildOverview>({
      url: `${JENKINS_BASE}/pipelines/${jobName}/builds/${buildNumber}/overview`,
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
