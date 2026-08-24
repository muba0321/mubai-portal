import request from "@/utils/request";

const KB_BASE = "/api/v1/knowledge";

export interface KbCategory {
  name: string;
  type: string;
  fileCount: number;
  children: { name: string; type: string; children: any[] }[];
  files: KbFileItem[];
}

export interface KbFileItem {
  id: number;
  path: string;
  name: string;
  title: string;
  category: string;
  subCategory: string;
  size: number;
  wordCount: number;
  fileExt?: string;
  modifiedAt: string;
}

export interface KbFileContent {
  id: number;
  path: string;
  name: string;
  title: string;
  category: string;
  subCategory: string;
  content: string;
  size: number;
  wordCount: number;
  fileExt?: string;
  modifiedAt: string;
}

export interface KbStats {
  totalFiles: number;
  totalWords: number;
  categories: { name: string; count: number }[];
}

export interface KbSyncStatus {
  lastSync: {
    startedAt: string;
    duration: number;
    status: string;
    filesAdded: number;
    filesUpdated: number;
  };
  recentLogs: any[];
}

export const KnowledgeAPI = {
  getTree() {
    return request<any, KbCategory[]>({ url: `${KB_BASE}/tree`, method: "get" });
  },

  getFiles(params?: { category?: string; keyword?: string; page?: number; pageSize?: number }) {
    return request<any, { list: KbFileItem[]; total: number; page: number; pageSize: number }>({
      url: `${KB_BASE}/files`,
      method: "get",
      params,
    });
  },

  getFileContent(path: string) {
    return request<any, KbFileContent>({
      url: `${KB_BASE}/files/${path}`,
      method: "get",
    });
  },

  search(keyword: string, category?: string) {
    return request<any, KbFileItem[]>({
      url: `${KB_BASE}/search`,
      method: "get",
      params: { q: keyword, category },
    });
  },

  triggerSync() {
    return request<any, any>({ url: `${KB_BASE}/sync`, method: "post" });
  },

  getSyncStatus() {
    return request<any, KbSyncStatus>({ url: `${KB_BASE}/sync/status`, method: "get" });
  },

  getStats() {
    return request<any, KbStats>({ url: `${KB_BASE}/stats`, method: "get" });
  },
};

export default KnowledgeAPI;
