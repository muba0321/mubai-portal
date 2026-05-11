import { createDefineMock } from "vite-plugin-mock-dev-server";

export const defineMock = createDefineMock((mock) => {
  mock.url = `api/v1/${mock.url}`;
});
