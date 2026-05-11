import { createDefineMock } from "vite-plugin-mock-dev-server";

export const defineMock = createDefineMock((mock) => {
  // 必须包含代理前缀 /dev-api，否则请求会被 proxy 转发到真实后端
  mock.url = `/dev-api/api/v1/${mock.url}`;
});
