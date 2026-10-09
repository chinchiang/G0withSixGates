import "./zod-jitless";
import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { AppNotFoundComponent } from "@/lib/not-found-component";
import { routeTree } from "./routeTree.gen";

/**
 * 路由器：掛上錯誤畫面與找不到頁面的畫面。
 * Router: wires the error screen and the not-found screen.
 */
export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: AppNotFoundComponent,
  });
}
