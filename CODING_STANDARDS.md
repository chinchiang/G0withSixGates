# 程式碼規範 / Coding standards

審查時對照這份文件。這裡只收需要判斷的規則；寫法固定、機器查得出來的規則，交給 `eslint.config.mjs`。審查時如果發現某種違規每次長得都一樣，建議改成 lint 規則，不要加到這裡。
Review against this file. It holds only rules that need judgement; a rule with a fixed shape a machine can check belongs in `eslint.config.mjs`. If a violation looks the same every time, propose a lint rule instead of adding it here.

## 1. 註解中英對照 / Comments in both languages

說明性的註解與 JSDoc 都寫中文與英文兩個版本，意思一致。短的寫在同一行，以「。 」隔開；長的分兩行，中文在上。
Explanatory comments and JSDoc carry a Chinese and an English version with the same meaning: on one line separated by "。 " when short, on two lines with Chinese first when long.

```ts
// 按下執行就存檔：重新整理後直接看到完成的結果。 Saved as soon as Run is pressed, so a reload shows the finished result.

// 主題只在水合完成後才改 DOM：頁面載入前的小段腳本已先套好記住的主題，避免閃一下。
// Touch the DOM only after hydration: the inline script in <head> already applied the remembered theme, so there is no flash.
```

審查時看：兩個版本是否說同一件事。改了程式碼時，只更新其中一個語言的註解，是最常見的走樣。平台檔案（README「平台檔案」一節）與 `@ts-expect-error` 這類工具指令不適用。
Check that both versions say the same thing; the usual drift is a code change that updates only one language. Platform files (README "Platform files") and tool directives such as `@ts-expect-error` are exempt.

## 2. 使用者看得到的文字走 `bi()` / User-facing text goes through `bi()`

畫面與放行紀錄上的每一段文字，都用 `bi(中文, 英文)` 寫成一組，再用 `t()`／`pick()` 依語系取出。畫面元件把文案集中在檔案開頭的 `T` 文案表；只用一次的短詞可以就地寫 `t(bi("驗證結果", "Verification results"))`。
Every piece of text on screen or in the release record is a `bi(zh, en)` pair read with `t()` / `pick()` for the locale. View components keep their copy in the `T` table at the top of the file; a one-off short label may be written inline as `t(bi("驗證結果", "Verification results"))`.

- 在 `src/components/views/` 裡依 `locale` 分支產生文字，ESLint 會擋下來。其他地方要靠審查判斷。
  ESLint rejects a branch on `locale` that produces text inside `src/components/views/`; elsewhere it is the reviewer's call.
- 依語系決定**格式**可以，例如標點與分隔符號：`reportMarkdown` 的 `const colon = locale === "zh" ? "：" : ": "`。依語系決定**內容**不行，內容要寫成 `bi()`。
  Branching on the locale for **format**, such as punctuation and separators (`const colon = locale === "zh" ? "：" : ": "` in `reportMarkdown`), is fine; **content** goes in `bi()`.
- 同一段文案在畫面和放行紀錄都會出現時，只寫一份，放在 `src/data/`，例如 `findingRows`、`gapSummary`；兩邊各自處理排版和標點。
  Copy that appears both on screen and in the release record is written once in `src/data/` (`findingRows`, `gapSummary`); each side does its own layout and punctuation.

審查時看：新出現的字串有沒有中英兩份；同一句話是不是在畫面和紀錄各寫了一份。
Check that each new string has both languages, and that no sentence is written once for the screen and again for the record.

## 3. 測試的預期值要有獨立來源 / Expected values in tests come from an independent source

斷言的預期值來自字面值、算好的範例或規格，不能用跟被測程式相同的方法再算一次，不然測試永遠不會失敗。
An assertion's expected value comes from a literal, a worked example or the spec, never from recomputing it the way the code does, which could never fail.

```ts
// 好：字面值，跟程式碼的算法無關。 Good: a literal, independent of how the code computes it.
assert.deepEqual(gapSummary(catchStatus(plan, checks)), {
  zh: "本次 14 個發現中，有 11 個可能會漏掉",
  en: "11 of the 14 findings this run may slip through",
});

// 好：算好的範例，把算式寫在註解裡。 Good: a worked example with the arithmetic in a comment.
// 3 種暴露面 × 3 種敏感度 × 8 種緩解子集 × 3 種程式狀態 × 2^10 個布林欄位。
assert.equal(count, 221_184);

// 不好：用跟程式相同的方式組出預期值。 Bad: the expected value is built the same way the code builds it.
assert.equal(summary.zh, `本次 ${statuses.length} 個發現中，有 ${missed.length} 個可能會漏掉`);
```

- 從被測模組取資料當**輸入**可以，例如用 `FINDING_CATALOGUE` 逐條檢查；拿它來產生**預期值**才是問題。
  Using the module's data as **input** (looping over `FINDING_CATALOGUE`) is fine; deriving the **expected value** from it is the problem.
- 重構後輸出應該不變時，用 `npm run compare:main` 跟 `main` 的實際輸出比對，不要在測試裡手抄一份預期值。
  When a refactor should leave the output unchanged, compare with `main`'s real output via `npm run compare:main` rather than hand-copying an expectation into a test.

審查時看：把被測函式改壞一點（換個數字、拿掉一個欄位），這個測試會不會失敗；不會的話，預期值大概不是獨立的。
Check whether the test would fail if the function were slightly broken (a changed number, a dropped field); if not, the expectation is probably not independent.
