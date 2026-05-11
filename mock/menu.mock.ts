import { defineMock } from "./base";

export default defineMock([
  {
    url: "menus/routes",
    method: ["GET"],
    body: {
      code: "00000",
      data: [
        {
          path: "/cmdb",
          component: "Layout",
          name: "/cmdb",
          meta: {
            title: "CMDB 管理",
            icon: "monitor",
            hidden: false,
            alwaysShow: false,
            params: null,
          },
          children: [
            {
              path: "",
              component: "cmdb/index",
              name: "CMDB",
              meta: {
                title: "CMDB 管理",
                icon: "monitor",
                hidden: false,
                keepAlive: true,
                alwaysShow: false,
                params: null,
              },
            },
          ],
        },
        {
          path: "/dashboard",
          component: "Layout",
          name: "/dashboard",
          meta: {
            title: "首页",
            icon: "homepage",
            hidden: false,
            alwaysShow: false,
            params: null,
          },
          children: [
            {
              path: "",
              component: "dashboard/index",
              name: "Dashboard",
              meta: {
                title: "首页",
                icon: "homepage",
                hidden: false,
                keepAlive: true,
                alwaysShow: false,
                params: null,
              },
            },
          ],
        },
      ],
      msg: "一切ok",
    },
  },
]);
