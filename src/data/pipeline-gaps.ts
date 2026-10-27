import { joinAlt, joinList, pick, quote, type Bi, type Locale } from "../i18n/locale.ts";
import { GATE_DOCS, type GateId } from "./model.ts";
import type { Finding, RunPlan } from "./engine.ts";

/**
 * 管線缺口：用閘門頁的勾選（你們真實的管線）對照 Harness 的發現。
 * 每個發現的攔截條件只寫在這裡，管線頁、閘門頁與放行紀錄都從這裡取用。
 *
 * Pipeline gaps: compare the Harness findings with the gates-page checks (your real pipeline).
 * Each finding's catch requirement lives only here; the Pipeline view, the Gates view and the
 * release record all read it from this module.
 */

type CatchRule = { readonly all: readonly string[] } | { readonly any: readonly string[] };

/**
 * 每個發現的攔截條件：`any` 任一勾選即攔下，`all` 須全部勾選。威脅模型須同時具備資料流與風險盤點。
 * 跨閘門的配對（例如 G5 雙帳號測試也攔得下 G4 的越權）照對照表列入。
 * 匯出只為了讓測試比對 id 清單；其他模組請用下方的函式。
 *
 * Each finding's catch requirement: `any` is caught by one checked control, `all` needs every one.
 * Threat modeling requires both data-flow and risk analysis. Cross-gate pairs (G5's two-account
 * test also catches G4's authorization gap) follow the map. Exported only so tests can compare id
 * lists; other modules use the functions below.
 */
export const CATCH_REQUIREMENTS: Record<string, CatchRule> = {
  "g0-tri": { any: ["g0-tri"] },
  "g0-model": { all: ["g0-dfd", "g0-stride"] },
  "g1-slop": { any: ["g1-exist"] },
  "g1-hook": { any: ["g1-hook", "g1-cool"] },
  "g1-cool": { any: ["g1-cool", "g1-typo"] },
  "g2-key": { any: ["g2-hook", "g2-push"] },
  "g2-hist": { any: ["g2-hist"] },
  "g3-xss": { any: ["g3-taint", "g6-xss"] },
  "g3-cmd": { any: ["g3-param"] },
  "g3-imds": { any: ["g3-iac"] },
  "g3-csp": { any: ["g3-csp"] },
  "g4-bola": { any: ["g4-owner", "g4-rls", "g4-depth", "g5-bola"] },
  "g4-pii": { any: ["g4-pii"] },
  "g4-tool": { any: ["g4-hitl"] },
  "g4-rules": { any: ["g4-rules"] },
  "g5-idor": { any: ["g5-bola"] },
  "g5-jwt": { any: ["g5-jwt"] },
  "g5-ssrf": { any: ["g5-ssrf"] },
  "g5-mfa": { any: ["g5-mfa"] },
  "g5-debug": { any: ["g5-debug"] },
  "g5-rate": { any: ["g5-rate"] },
  "g6-pi": { any: ["g6-direct"] },
  "g6-indirect": { any: ["g6-indirect"] },
  "g6-dow": { any: ["g6-dow"] },
  "g6-tri": { any: ["g0-tri"] },
};

export interface ControlRef {
  id: string;
  gate: GateId;
  text: Bi;
}

const CONTROLS: Record<string, ControlRef> = Object.fromEntries(
  GATE_DOCS.flatMap((doc) =>
    doc.controls.map((item): [string, ControlRef] => [item.id, { ...item, gate: doc.id }]),
  ),
);

export interface CatchRequirement {
  mode: "all" | "any";
  controls: ControlRef[];
}

/**
 * 一個發現的攔截條件。未登錄的發現沒有控制項，永遠不算攔下。
 * A finding's catch requirement. An unregistered finding has no controls and is never caught.
 */
export function catchRequirement(findingId: string): CatchRequirement {
  const rule = CATCH_REQUIREMENTS[findingId];
  if (!rule) return { mode: "any", controls: [] };
  return "all" in rule
    ? { mode: "all", controls: rule.all.map((id) => CONTROLS[id]) }
    : { mode: "any", controls: rule.any.map((id) => CONTROLS[id]) };
}

export interface CatchStatus {
  finding: Finding;
  requirement: CatchRequirement;
  controls: (ControlRef & { checked: boolean })[];
  /** 攔截條件已被勾選滿足。 The checks meet the catch requirement. */
  caught: boolean;
  /** 還沒勾的控制項，順序同攔截條件。 The unchecked controls, in requirement order. */
  missing: ControlRef[];
}

/**
 * 這次執行的每個發現是否攔下；管線缺口就是 `caught` 為 false 的那些。
 * Whether each finding in the run is caught; the pipeline gaps are the ones with `caught` false.
 */
export function catchStatus(plan: RunPlan, checks: Record<string, boolean>): CatchStatus[] {
  return plan.steps.flatMap((s) =>
    s.findings.map((finding) => {
      const requirement = catchRequirement(finding.id);
      const controls = requirement.controls.map((item) => ({
        ...item,
        checked: Boolean(checks[item.id]),
      }));
      const caught =
        controls.length > 0 &&
        (requirement.mode === "all"
          ? controls.every((item) => item.checked)
          : controls.some((item) => item.checked));
      return {
        finding,
        requirement,
        controls,
        caught,
        missing: requirement.controls.filter((item) => !checks[item.id]),
      };
    }),
  );
}

/**
 * 這次執行中，這個控制項參與了哪些發現的攔截條件；`partners` 是還要一起勾的控制項，任一型為空。
 * Which findings in the run list this control in their catch requirement; `partners` are the
 * controls it must be checked together with, empty for an `any` requirement.
 */
export function findingsCaughtWith(
  plan: RunPlan,
  controlId: string,
): { finding: Finding; partners: ControlRef[] }[] {
  return plan.steps
    .flatMap((s) => s.findings)
    .flatMap((finding) => {
      const { mode, controls } = catchRequirement(finding.id);
      if (!controls.some((item) => item.id === controlId)) return [];
      const partners = mode === "all" ? controls.filter((item) => item.id !== controlId) : [];
      return [{ finding, partners }];
    });
}

/**
 * 還缺哪些控制項：全部型用「、」列出，任一型用「／」表示擇一。
 * 控制項文字本身就含有「、」與「／」，所以每項都加上引號。
 *
 * The missing controls: an `all` requirement lists them, an `any` requirement offers them as
 * alternatives. Control text itself contains commas and slashes, so each one is quoted.
 */
export function describeMissing(status: CatchStatus, locale: Locale): string {
  const join = status.requirement.mode === "all" ? joinList : joinAlt;
  return join(
    locale,
    status.missing.map((item) => quote(locale, pick(locale, item.text))),
  );
}
