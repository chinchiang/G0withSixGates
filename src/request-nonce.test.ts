import { test } from "node:test";
import assert from "node:assert/strict";
import { currentRequestNonce, requestNonceStorage } from "./request-nonce.server.ts";

test("concurrent requests never share a nonce", async () => {
  const result = await Promise.all(
    ["first", "second"].map((nonce) =>
      requestNonceStorage.run(nonce, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return currentRequestNonce();
      }),
    ),
  );
  assert.deepEqual(result, ["first", "second"]);
  assert.equal(currentRequestNonce(), undefined);
});
