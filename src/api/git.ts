import request from "@/utils/request";

const GIT_BASE = "/api/v1/git";

export interface RepoInfo {
  name: string;
  description: string;
  github: string;
  path: string;
  totalCommits: number;
  branchCount: number;
  tagCount: number;
  latestCommit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  contributors: string[];
}

export interface Commit {
  hash: string;
  fullHash: string;
  author: string;
  email: string;
  date: string;
  type: string;
  message: string;
  fullMessage: string;
}

export interface CommitDetail {
  hash: string;
  fullHash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
  body: string;
  stats: { added: number; deleted: number; files: number };
  files: { path: string; added: number; deleted: number }[];
}

export interface Branch {
  name: string;
  date: string;
  lastCommit: string;
  isRemote: boolean;
  isMain: boolean;
}

export interface Tag {
  name: string;
  date: string;
  message: string;
}

export interface TreeItem {
  type: "dir" | "file";
  name: string;
  path: string;
}

export interface FileInfo {
  path: string;
  branch: string;
  language: string;
  content: string;
  lines: number;
}

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  hunks: { header: string; lines: string[] }[];
}

export interface BlameLine {
  hash: string;
  author: string;
  date: string;
  lineNum: number;
  content: string;
}

export const GitAPI = {
  // 仓库概览
  getRepo(name: string) {
    return request<any, RepoInfo>({
      url: `${GIT_BASE}/repo/${name}`,
      method: "get",
    });
  },

  // 提交历史
  getCommits(name: string, params?: { page?: number; pageSize?: number; type?: string; keyword?: string }) {
    return request<any, { list: Commit[]; total: number; page: number; pageSize: number }>({
      url: `${GIT_BASE}/commits/${name}`,
      method: "get",
      params,
    });
  },

  // 提交详情
  getCommitDetail(name: string, hash: string) {
    return request<any, CommitDetail>({
      url: `${GIT_BASE}/commit/${name}/${hash}`,
      method: "get",
    });
  },

  // 分支列表
  getBranches(name: string) {
    return request<any, Branch[]>({
      url: `${GIT_BASE}/branches/${name}`,
      method: "get",
    });
  },

  // Tag 列表
  getTags(name: string) {
    return request<any, Tag[]>({
      url: `${GIT_BASE}/tags/${name}`,
      method: "get",
    });
  },

  // 文件树
  getTree(name: string, params?: { path?: string; branch?: string }) {
    return request<any, { path: string; branch: string; items: TreeItem[] }>({
      url: `${GIT_BASE}/tree/${name}`,
      method: "get",
      params,
    });
  },

  // 文件内容
  getFile(name: string, params: { path: string; branch?: string }) {
    return request<any, FileInfo>({
      url: `${GIT_BASE}/file/${name}`,
      method: "get",
      params,
    });
  },

  // Diff
  getDiff(name: string, hash: string) {
    return request<any, DiffFile[]>({
      url: `${GIT_BASE}/diff/${name}/${hash}`,
      method: "get",
    });
  },

  // Blame
  getBlame(name: string, path: string) {
    return request<any, { path: string; lines: BlameLine[] }>({
      url: `${GIT_BASE}/blame/${name}`,
      method: "get",
      params: { path },
    });
  },
};

export default GitAPI;
