import { requestNonceStorage } from "./request-nonce.server";
import { randomBytes } from "node:crypto";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { nonceSecurityHeaders } from "../scripts/security-headers.mjs";

/** 每個 HTML 回應使用獨立授權碼，禁止共用快取。 Each HTML response uses an independent nonce and cannot be shared-cached. */
const handler = createStartHandler((context) => {
  const nonce = context.router.options.ssr?.nonce;
  if (!nonce) return defaultStreamHandler(context);
  for (const [key, value] of Object.entries(nonceSecurityHeaders(nonce))) {
    context.responseHeaders.set(key, value);
  }
  context.responseHeaders.set("Cache-Control", "private, no-store");
  return defaultStreamHandler(context);
});

export default {
  fetch(request: Request, options?: Parameters<typeof handler>[1]) {
    if (!import.meta.env.PROD) return handler(request, options);
    return requestNonceStorage.run(randomBytes(24).toString("base64"), () =>
      handler(request, options),
    );
  },
};
