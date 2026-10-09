import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as model from "./model.ts";
import { GATE_DOCS, PRESETS, displayName, parseSearch } from "./model.ts";

/**
 * 遞迴找出物件裡所有 `{ zh, en }`，確認兩種語言都有字。
 * Recursively find every `{ zh, en }` in a value and check both languages are filled in.
 */
function collectBi(value: unknown, path: string, out: [string, { zh: unknown; en: unknown }][]) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectBi(item, `${path}[${i}]`, out));
    return;
  }
  const record = value as Record<string, unknown>;
  if ("zh" in record && "en" in record && Object.keys(record).length === 2) {
    out.push([path, record as { zh: unknown; en: unknown }]);
    return;
  }
  for (const [key, item] of Object.entries(record)) collectBi(item, `${path}.${key}`, out);
}

describe("bilingual content", () => {
  it("has a non-empty Chinese and English string for every Bi", () => {
    const found: [string, { zh: unknown; en: unknown }][] = [];
    for (const [name, value] of Object.entries(model)) {
      if (typeof value === "function") continue;
      collectBi(value, name, found);
    }
    assert.ok(found.length > 300, `only ${found.length} bilingual strings found`);
    for (const [path, value] of found) {
      assert.equal(typeof value.zh, "string", `${path}.zh`);
      assert.equal(typeof value.en, "string", `${path}.en`);
      assert.ok((value.zh as string).trim().length > 0, `${path}.zh is empty`);
      assert.ok((value.en as string).trim().length > 0, `${path}.en is empty`);
      // 英文欄位不該殘留中文字。 The English side should carry no Chinese characters.
      assert.doesNotMatch(
        value.en as string,
        /[一-鿿]/,
        `${path}.en contains Chinese: ${value.en}`,
      );
    }
  });

  it("keeps control ids unique across gates", () => {
    const ids = GATE_DOCS.flatMap((doc) => doc.controls.map((item) => item.id));
    assert.equal(new Set(ids).size, ids.length);
    for (const doc of GATE_DOCS) {
      for (const item of doc.controls) {
        assert.ok(
          item.id.startsWith(`${doc.id.toLowerCase()}-`),
          `${item.id} is not prefixed with ${doc.id}`,
        );
      }
    }
  });
});

describe("parseSearch", () => {
  it("keeps only valid view, gate and lang values", () => {
    assert.deepEqual(parseSearch({ view: "gates", gate: "G3", lang: "en", junk: 1 }), {
      view: "gates",
      gate: "G3",
      lang: "en",
    });
    assert.deepEqual(parseSearch({ view: "nope", gate: "G9", lang: "fr" }), {
      view: undefined,
      gate: undefined,
      lang: undefined,
    });
  });

  it("drops the defaults so they stay out of the URL", () => {
    assert.deepEqual(parseSearch({ view: "overview", lang: "zh" }), {
      view: undefined,
      gate: undefined,
      lang: undefined,
    });
  });
});

describe("displayName", () => {
  it("localizes preset names and keeps custom names", () => {
    assert.equal(displayName(PRESETS.kb, "en"), "Public customer-support knowledge base");
    assert.equal(displayName(PRESETS.kb, "zh"), "對外客服知識庫");
    assert.equal(
      displayName({ ...PRESETS.kb, name: "Public customer-support knowledge base" }, "zh"),
      "對外客服知識庫",
    );
    assert.equal(
      displayName({ ...PRESETS.kb, preset: "custom", name: "我的系統" }, "en"),
      "我的系統",
    );
  });

  it("falls back when the name is blank", () => {
    assert.equal(
      displayName({ ...PRESETS.script, name: "   " }, "en"),
      "Internal scheduled script",
    );
    assert.equal(
      displayName({ ...PRESETS.script, preset: "custom", name: "" }, "zh"),
      "對外客服知識庫",
    );
  });
});
