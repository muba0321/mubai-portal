import request from "@/utils/request";

// 获取 CICD 进展总览
export function getProgressOverview() {
  return request<any, {
    totalStages: number;
    done: number;
    progress: number;
    planned: number;
    overallProgress: number;
  }>({
    url: "/api/v1/cicd-progress/progress-overview",
    method: "get",
  });
}

// 获取各阶段详细信息
export function getStageDetails() {
  return request<any, {
    stages: any[];
  }>({
    url: "/api/v1/cicd-progress/stage-details",
    method: "get",
  });
}

// 更新阶段详细信息
export function updateStageDetail(stageId: string, data: any) {
  return request({
    url: `/api/v1/cicd-progress/stage-details/${stageId}`,
    method: "put",
    data,
  });
}

// 获取时间线
export function getTimeline() {
  return request<any, {
    timeline: any[];
  }>({
    url: "/api/v1/cicd-progress/timeline",
    method: "get",
  });
}
