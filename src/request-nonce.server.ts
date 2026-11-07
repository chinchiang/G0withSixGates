import { AsyncLocalStorage } from "node:async_hooks";

/** 非同步請求各自隔離，授權碼不從使用者標頭讀取。 Isolate asynchronous requests; never trust a nonce from user headers. */
export const requestNonceStorage = new AsyncLocalStorage<string>();
export function currentRequestNonce() {
  return requestNonceStorage.getStore();
}
