import SettingAPI from "@/api/setting";

const STORAGE_KEY = "system-settings";

export const useSystemSettingStore = defineStore("system-setting", () => {
  // 所有配置键值对
  const settings = ref<Record<string, any>>({});

  /** 从服务端加载配置（公开接口，无需鉴权） */
  async function fetchSettings() {
    try {
      const data = await SettingAPI.getPublic();
      settings.value = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 如果接口失败，尝试从 localStorage 恢复
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

  /** 强制从服务端刷新配置 */
  async function refresh() {
    await fetchSettings();
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

  /** 批量更新配置 */
  async function updateBatch(data: Record<string, any>) {
    await SettingAPI.updateBatch(data);
    // 更新本地缓存
    for (const [key, value] of Object.entries(data)) {
      settings.value[key] = value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
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
    fetchSettings,
    refresh,
    isEnabled,
    get,
    updateBatch,
    restoreFromCache,
  };
});
