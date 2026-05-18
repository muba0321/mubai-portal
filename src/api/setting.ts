import request from "@/utils/request";

const BASE_URL = "/api/v1/settings";

export interface SettingItem {
  id: number;
  settingKey: string;
  settingGroup: string;
  settingType: string;
  settingValue: string | null;
  defaultValue: string | null;
  label: string;
  description?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingGroupItem {
  label: string;
  key: string;
  items: SettingItem[];
}

const SettingAPI = {
  /** 获取分组下所有配置 */
  getGroup(group: string) {
    return request<any, SettingItem[]>({
      url: `${BASE_URL}/group/${group}`,
      method: "get",
    });
  },

  /** 获取单个配置值 */
  getValue(key: string) {
    return request<any, SettingItem>({
      url: `${BASE_URL}/key/${key}`,
      method: "get",
    });
  },

  /** 批量更新配置 */
  updateBatch(data: Record<string, any>) {
    return request({
      url: BASE_URL,
      method: "put",
      data,
    });
  },

  /** 初始化预设配置 */
  initDefaults() {
    return request({
      url: `${BASE_URL}/init`,
      method: "post",
    });
  },

  /** 公开接口：获取基础信息+功能开关（无需鉴权） */
  getPublic() {
    return request<any, Record<string, any>>({
      url: `${BASE_URL}/public`,
      method: "get",
    });
  },
};

export default SettingAPI;
