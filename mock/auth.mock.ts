import { defineMock } from "./base";

// 有效 JWT 格式的 mock token（header.payload.signature）
const MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsIm5pY2tuYW1lIjoiQWRtaW4iLCJpYXQiOjE3NDY5NDA4MDAsImV4cCI6MjA2MjMwMDgwMH0.mock-signature";
const MOCK_REFRESH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NDY5NDA4MDAsImV4cCI6MjA2MjMwMDgwMH0.mock-refresh-signature";

export default defineMock([
  {
    url: "auth/login",
    method: ["POST"],
    body: {
      code: "00000",
      data: {
        accessToken: MOCK_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      },
      msg: "登录成功",
    },
  },
  {
    url: "auth/refresh-token",
    method: ["POST"],
    body: {
      code: "00000",
      data: {
        accessToken: MOCK_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      },
      msg: "刷新成功",
    },
  },
  {
    url: "auth/captcha",
    method: ["GET"],
    body: {
      code: "00000",
      data: {
        captchaId: "mock-captcha-id",
        captchaCode: "",
        captchaImage: "",
      },
      msg: "获取成功",
    },
  },
  {
    url: "auth/logout",
    method: ["DELETE"],
    body: {
      code: "00000",
      data: null,
      msg: "退出成功",
    },
  },
]);
