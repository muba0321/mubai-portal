import request from "@/utils/request";

const CREDENTIAL_BASE = "/api/v1";

export interface Credential {
  id?: number;
  name: string;
  category: string;
  url?: string;
  username?: string;
  password: string;
  remark?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface CredentialCategory {
  value: string;
  label: string;
  icon: string;
}

export const CredentialAPI = {
  list(params?: { category?: string; keyword?: string }) {
    return request<any, Credential[]>({
      url: `${CREDENTIAL_BASE}/credentials`,
      method: "get",
      params,
    });
  },

  create(data: Partial<Credential>) {
    return request<any, { id: number }>({
      url: `${CREDENTIAL_BASE}/credentials`,
      method: "post",
      data,
    });
  },

  get(id: number) {
    return request<any, Credential>({
      url: `${CREDENTIAL_BASE}/credentials/${id}`,
      method: "get",
    });
  },

  update(id: number, data: Partial<Credential>) {
    return request({
      url: `${CREDENTIAL_BASE}/credentials/${id}`,
      method: "put",
      data,
    });
  },

  delete(id: number) {
    return request({
      url: `${CREDENTIAL_BASE}/credentials/${id}`,
      method: "delete",
    });
  },

  categories() {
    return request<any, CredentialCategory[]>({
      url: `${CREDENTIAL_BASE}/credentials/categories`,
      method: "get",
    });
  },
};

export default CredentialAPI;
