import "./zod-jitless";
import { createRouter } from "@tanstack/react-router";
import { ROUTER_DEFAULTS } from "@/app-route";
import { routeTree } from "./routeTree.gen";

/**
 * 路由器：掛上錯誤畫面與找不到頁面的畫面。
 * Router: wires the error screen and the not-found screen.
 */
export function getRouter() {
  return createRouter({
    routeTree,
    ...ROUTER_DEFAULTS,
  });
}
