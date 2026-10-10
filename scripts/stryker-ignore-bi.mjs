/**
 * Stryker 忽略外掛：跳過 `bi("中文", "English")` 裡的內容字串。
 * 這些是顯示用的文字，不是邏輯；逐句對文字斷言沒有意義，留著只會讓存活突變體灌水。
 * 其他地方的字串（例如 `p.exposure === "public"`）仍會被突變。
 *
 * Stryker ignore plugin: skip the content strings inside `bi("中文", "English")`.
 * They are display text, not logic; asserting on every sentence is pointless and
 * leaving them in only inflates the surviving-mutant count. String literals elsewhere
 * (such as `p.exposure === "public"`) are still mutated.
 */
import { PluginKind, declareValuePlugin } from "@stryker-mutator/api/plugin";

const MESSAGE = "Bilingual content string inside bi(); display text, not logic.";

function isBiCall(path) {
  return (
    path.isCallExpression() &&
    path.node.callee.type === "Identifier" &&
    path.node.callee.name === "bi"
  );
}

const biIgnorer = {
  shouldIgnore(path) {
    if ((path.isStringLiteral() || path.isTemplateLiteral()) && isBiCall(path.parentPath)) {
      return MESSAGE;
    }
    return undefined;
  },
};

export const strykerPlugins = [declareValuePlugin(PluginKind.Ignore, "bi-content", biIgnorer)];
