import request from "@/utils/request";

const CMDB_BASE_URL = "/v1/cmdb";

export interface VmItem {
  id: number;
  name: string;
  cluster: string;
  externalIp: string;
  internalIp: string;
  description: string;
  status: number;
  tenant: string;
  vcpus: number;
  memory: number;
  disk: string;
  accessUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VmQueryParams {
  pageNum: number;
  pageSize: number;
  keywords?: string;
  cluster?: string;
  status?: number | string;
  tenant?: string;
}

export interface VmForm {
  id?: number;
  name: string;
  cluster: string;
  externalIp: string;
  internalIp: string;
  description: string;
  status: number;
  tenant: string;
  vcpus: number;
  memory: number;
  disk: string;
  accessUrl: string;
}

export interface ImportResult {
  successCount: number;
  failCount: number;
  errors: string[];
}

export interface OptionItem {
  label: string;
  value: string;
}

const CmdbAPI = {
  /** 分页查询虚拟机列表 */
  getPage(queryParams: VmQueryParams) {
    return request<any, PageResult<VmItem>>({
      url: `${CMDB_BASE_URL}/vms`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取 VM 详情 */
  getById(id: number) {
    return request<any, VmItem>({
      url: `${CMDB_BASE_URL}/vms/${id}`,
      method: "get",
    });
  },

  /** 新增虚拟机 */
  create(data: VmForm) {
    return request({
      url: `${CMDB_BASE_URL}/vms`,
      method: "post",
      data,
    });
  },

  /** 编辑虚拟机 */
  update(id: number, data: VmForm) {
    return request({
      url: `${CMDB_BASE_URL}/vms/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除虚拟机 */
  deleteById(id: number) {
    return request({
      url: `${CMDB_BASE_URL}/vms/${id}`,
      method: "delete",
    });
  },

  /** 批量删除 */
  deleteByIds(ids: number[]) {
    return request({
      url: `${CMDB_BASE_URL}/vms/batch`,
      method: "delete",
      data: { ids },
    });
  },

  /** 导入虚拟机 */
  import(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<any, ImportResult>({
      url: `${CMDB_BASE_URL}/vms/import`,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** 导出虚拟机 */
  export(queryParams: Partial<VmQueryParams>) {
    return request({
      url: `${CMDB_BASE_URL}/vms/export`,
      method: "get",
      params: queryParams,
      responseType: "blob",
    });
  },

  /** 集群选项列表 */
  getClusters() {
    return request<any, OptionItem[]>({
      url: `${CMDB_BASE_URL}/clusters`,
      method: "get",
    });
  },

  /** 租户选项列表 */
  getTenants() {
    return request<any, OptionItem[]>({
      url: `${CMDB_BASE_URL}/tenants`,
      method: "get",
    });
  },
};

export default CmdbAPI;
