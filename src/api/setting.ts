import request from "@/utils/request";

const BASE_URL = "/api/v1/configs";

export interface ConfigEntry {
  id: number;
  namespace: string;
  configKey: string;
  configValue: string | null;
  configType: string | null;
  remark: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const ConfigAPI = {
  /** 按命名空间获取所有配置 */
  getByNamespace(namespace: string) {
    return request<any, ConfigEntry[]>({
      url: `${BASE_URL}/ns/${namespace}`,
      method: "get",
    });
  },

  /** 获取所有命名空间和配置 */
  getAll() {
    return request<any, ConfigEntry[]>({
      url: BASE_URL,
      method: "get",
    });
  },

  /** 获取单个配置值 */
  getValue(key: string) {
    return request<any, ConfigEntry>({
      url: `${BASE_URL}/key/${key}`,
      method: "get",
    });
  },

  /** 新增配置 */
  create(data: { namespace: string; configKey: string; configValue?: string; configType?: string; remark?: string }) {
    return request({
      url: BASE_URL,
      method: "post",
      data,
    });
  },

  /** 更新配置 */
  update(id: number, data: { configValue?: string; configType?: string; remark?: string }) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除配置 */
  remove(id: number) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /** 公开接口：获取基础信息+功能开关（无需鉴权） */
  getPublic() {
    return request<any, Record<string, any>>({
      url: `${BASE_URL}/public`,
      method: "get",
    });
  },

  /** 初始化预设配置 */
  initDefaults() {
    return request({
      url: `${BASE_URL}/init`,
      method: "post",
    });
  },
};

export default ConfigAPI;
