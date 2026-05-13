import request from "@/utils/request";
import type { LoginRequest, LoginResponse } from "@/types/api/auth";

const AUTH_BASE_URL = "/api/v1/auth";

const AuthAPI = {
  /** 登录接口*/
  login(data: LoginRequest) {
    return request<any, LoginResponse>({
      url: `${AUTH_BASE_URL}/login`,
      method: "post",
      headers: {
        Authorization: "no-auth",
      },
      data: {
        username: data.username,
        password: data.password,
      },
    });
  },

  /** 刷新 token 接口*/
  refreshToken(refreshToken: string) {
    return request<any, LoginResponse>({
      url: `${AUTH_BASE_URL}/refresh-token`,
      method: "post",
      params: { refresh_token: refreshToken },
      headers: {
        Authorization: "no-auth",
      },
    });
  },

  /** 退出登录接口 */
  logout() {
    return request({
      url: `${AUTH_BASE_URL}/logout`,
      method: "post",
    });
  },
};

export default AuthAPI;
