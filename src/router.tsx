import "./zod-jitless";
import { createIsomorphicFn } from "@tanstack/react-start";
import { currentRequestNonce } from "./request-nonce.server";
import { createRouter } from "@tanstack/react-router";
import { ROUTER_DEFAULTS } from "@/app-route";
import { routeTree } from "./routeTree.gen";

const requestNonce = createIsomorphicFn()
  .server(() => currentRequestNonce())
  .client(() => document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]')?.content);

/**
 * 路由器：掛上錯誤畫面與找不到頁面的畫面。
 * Router: wires the error screen and the not-found screen.
 */
export function getRouter() {
  return createRouter({
    routeTree,
    ssr: { nonce: requestNonce() },
    ...ROUTER_DEFAULTS,
  });
}
