import request from "@/utils/request";

const TEST_BASE = "/api/v1/test-cases";

export interface TestCase {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  testType: "api" | "manual";
  priority: "P0" | "P1" | "P2" | "P3";
  status: "draft" | "active" | "archived";
  tags: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // API 测试配置
  apiMethod?: string;
  apiUrl?: string;
  apiHeaders?: Record<string, string>;
  apiBody?: string;
  apiExpectedStatus?: number;
  apiExpectedBody?: string;
  // 手工测试配置
  manualSteps?: { step: number; action: string; expected: string }[];
  preconditions?: string;
}

export interface TestExecution {
  id: number;
  result: "pass" | "fail" | "blocked" | "skipped";
  executor: string;
  environment: string;
  durationMs: number;
  notes?: string;
  executedAt: string;
}

export interface TestStats {
  total: number;
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  passRate: number;
  recentExecutions: number;
  coverage: { project: string; total: number; covered: number; rate: number }[];
  trend: { date: string; count: number }[];
}

export const TestCaseAPI = {
  // 用例 CRUD
  getList(params?: {
    projectId?: number;
    type?: string;
    priority?: string;
    status?: string;
    keyword?: string;
  }) {
    return request<any, TestCase[]>({
      url: TEST_BASE,
      method: "get",
      params,
    });
  },

  create(data: Partial<TestCase> & { requirementIds?: number[] }) {
    return request<any, any>({
      url: TEST_BASE,
      method: "post",
      data,
    });
  },

  getDetail(id: number) {
    return request<any, TestCase>({
      url: `${TEST_BASE}/${id}`,
      method: "get",
    });
  },

  update(id: number, data: Partial<TestCase> & { requirementIds?: number[] }) {
    return request<any, any>({
      url: `${TEST_BASE}/${id}`,
      method: "put",
      data,
    });
  },

  delete(id: number) {
    return request<any, any>({
      url: `${TEST_BASE}/${id}`,
      method: "delete",
    });
  },

  // 需求关联
  getRequirements(caseId: number) {
    return request<any, any[]>({
      url: `${TEST_BASE}/${caseId}/requirements`,
      method: "get",
    });
  },

  addRequirement(caseId: number, requirementId: number) {
    return request<any, any>({
      url: `${TEST_BASE}/${caseId}/requirements`,
      method: "post",
      data: { requirementId },
    });
  },

  removeRequirement(caseId: number, requirementId: number) {
    return request<any, any>({
      url: `${TEST_BASE}/${caseId}/requirements/${requirementId}`,
      method: "delete",
    });
  },

  // 测试执行
  execute(caseId: number, data?: {
    environment?: string;
    notes?: string;
    stepResults?: { stepIndex: number; status: string; actualResult?: string }[];
  }) {
    return request<any, any>({
      url: `${TEST_BASE}/${caseId}/execute`,
      method: "post",
      data,
    });
  },

  getExecutions(caseId: number) {
    return request<any, TestExecution[]>({
      url: `${TEST_BASE}/${caseId}/executions`,
      method: "get",
    });
  },

  // 统计
  getStats(projectId?: number) {
    return request<any, TestStats>({
      url: `${TEST_BASE}/stats`,
      method: "get",
      params: projectId ? { projectId } : {},
    });
  },
};

export default TestCaseAPI;
