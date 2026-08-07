import request from "@/utils/request";

const BASE_URL = "/api/v1/config-source";

export interface ConfigSourceStatus {
  currentSource: string;
  apolloEnabled: boolean;
  apolloConnected: boolean;
  apolloConfigCount: number;
  apolloServer: string | null;
}

export interface ConfigPreview {
  [key: string]: string | null;
}

const ConfigSourceAPI = {
  /** 获取配置源状态 */
  getStatus() {
    return request<any, ConfigSourceStatus>({
      url: `${BASE_URL}/status`,
      method: "get",
    });
  },

  /** 切换配置源 */
  switchSource(source: "apollo" | "local" | "fallback") {
    return request({
      url: `${BASE_URL}/switch`,
      method: "post",
      data: { source },
    });
  },

  /** 预览配置值 */
  preview() {
    return request<any, ConfigPreview>({
      url: `${BASE_URL}/preview`,
      method: "get",
    });
  },
};

export default ConfigSourceAPI;
