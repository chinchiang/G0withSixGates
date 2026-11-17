import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pagesHeadTags } from "./document-head.ts";

describe("document head", () => {
  it("escapes the title and description, and hashes the raw bootstrap script for CSP", () => {
    const tags = pagesHeadTags((s) => `digest(${s})`, {
      title: 'A & <B> "C"',
      description: 'x "y" <z> & w',
      themeColor: "#070b12",
      bootstrap: "var a=1;",
    });
    assert.equal(
      tags,
      [
        "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self' 'sha256-digest(var a=1;)'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'\">",
        "<title>A &amp; &lt;B&gt; &quot;C&quot;</title>",
        '<meta name="description" content="x &quot;y&quot; &lt;z&gt; &amp; w" />',
        '<meta name="theme-color" content="#070b12" />',
        "<script>var a=1;</script>",
      ].join("\n"),
    );
  });

  it("gives the Pages build the server's title, bilingual description, dark theme-color and bootstrap", () => {
    const tags = pagesHeadTags((s) => `len:${s.length}`);
    assert.match(
      tags,
      /^<meta http-equiv="Content-Security-Policy" content=".*'sha256-len:\d+'.*">$/m,
    );
    assert.match(tags, /^<title>六扇門 Six-Gate for Vibe Code<\/title>$/m);
    assert.match(
      tags,
      /^<meta name="description" content="Vibe Coding 的資安閘門：[^"]+ Security gates for vibe coding: [^"]+" \/>$/m,
    );
    assert.match(tags, /^<meta name="theme-color" content="#070b12" \/>$/m);
    // 淺色使用者在 JS 載入前就要換掉 theme-color。 Light-theme users get the theme-color swapped before any JS loads.
    assert.match(tags, /<script>.*six-gate-theme.*setAttribute\("content","#ffffff"\).*<\/script>/);
  });
});
