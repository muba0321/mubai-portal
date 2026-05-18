import ConfigAPI from "@/api/setting";
import type { ConfigEntry } from "@/api/setting";

const STORAGE_KEY = "system-settings";

export const useSystemSettingStore = defineStore("system-setting", () => {
  // 所有配置键值对（扁平存储，兼容旧版 isEnabled 等用法）
  const settings = ref<Record<string, any>>({});
  const entries = ref<ConfigEntry[]>([]);

  /** 从服务端加载配置（公开接口，无需鉴权） */
  async function fetchSettings() {
    try {
      const data = await ConfigAPI.getPublic();
      settings.value = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          settings.value = JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
  }

  /** 加载所有配置（需鉴权，用于管理页面） */
  async function loadAll() {
    try {
      entries.value = await ConfigAPI.getAll();
    } catch {
      // ignore
    }
  }

  /** 强制从服务端刷新配置 */
  async function refresh() {
    await Promise.all([fetchSettings(), loadAll()]);
  }

  /** 判断功能是否启用 */
  function isEnabled(key: string): boolean {
    return settings.value[key] === true || settings.value[key] === "true";
  }

  /** 获取配置值 */
  function get(key: string, defaultValue?: any): any {
    if (key in settings.value) {
      return settings.value[key];
    }
    return defaultValue;
  }

  /** 新增配置 */
  async function create(data: { namespace: string; configKey: string; configValue?: string; configType?: string; remark?: string }) {
    await ConfigAPI.create(data);
    await refresh();
  }

  /** 更新配置 */
  async function update(id: number, data: { configValue?: string; configType?: string; remark?: string }) {
    await ConfigAPI.update(id, data);
    await refresh();
  }

  /** 删除配置 */
  async function remove(id: number) {
    await ConfigAPI.remove(id);
    await refresh();
  }

  /** 从 localStorage 恢复 */
  function restoreFromCache() {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        settings.value = JSON.parse(cached);
      } catch {
        // ignore
      }
    }
  }

  return {
    settings,
    entries,
    fetchSettings,
    loadAll,
    refresh,
    isEnabled,
    get,
    create,
    update,
    remove,
    restoreFromCache,
  };
});
