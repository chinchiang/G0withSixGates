import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { missingFromLdd, missingLibrariesAdvice, missingLibraryError } from "./browser-libs.mjs";

const SHELL =
  "/home/me/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

describe("browser libraries", () => {
  it("finds the executable and the first missing library in a launch error", () => {
    // 2026-10-29 在 WSL 實際取得的錯誤，縮短過。 A real WSL launch error from 2026-10-29, shortened.
    const message = [
      "browserType.launch: Target page, context or browser has been closed",
      "Browser logs:",
      "<launched> pid=18032",
      `[pid=18032][err] ${SHELL}: error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory`,
    ].join("\n");
    assert.deepEqual(missingLibraryError(message), { executable: SHELL, library: "libnspr4.so" });
  });

  it("ignores launch errors that are not about libraries", () => {
    assert.equal(
      missingLibraryError("browserType.launch: Executable doesn't exist at /x/chrome"),
      null,
    );
  });

  it("lists every library ldd cannot find, once each", () => {
    const output = [
      "\tlinux-vdso.so.1 (0x00007ffd)",
      "\tlibnspr4.so => not found",
      "\tlibnss3.so => not found",
      "\tlibdl.so.2 => /lib/x86_64-linux-gnu/libdl.so.2 (0x00007f)",
      "\tlibnssutil3.so => not found",
      "\tlibasound.so.2 => not found",
      "\tlibnss3.so => not found",
    ].join("\n");
    assert.deepEqual(missingFromLdd(output), [
      "libnspr4.so",
      "libnss3.so",
      "libnssutil3.so",
      "libasound.so.2",
    ]);
  });

  it("names the libraries and both ways to install them", () => {
    const advice = missingLibrariesAdvice(["libnspr4.so", "libasound.so.2"]);
    assert.match(advice, /libnspr4\.so, libasound\.so\.2/);
    assert.match(advice, /sudo npx playwright install-deps chromium/);
    assert.match(advice, /LD_LIBRARY_PATH=/);
  });
});
