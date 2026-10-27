import { buildPlan, sameResult, type RunPlan } from "../data/engine.ts";
import { RUN_RULE_VERSION, parseProfile, type Profile } from "../data/model.ts";
import { bi, type Bi } from "../i18n/locale.ts";
import {
  RUN_KEY,
  loadWithMigration,
  readString,
  remove,
  save,
  type KeyValueStore,
} from "./storage.ts";

/**
 * Harness 執行的生命週期：執行、逐道揭示、停止、過期與存檔，全部是純函式。
 * 裁決在按下執行時就已確定，逐道揭示只是畫面效果：離開管線頁等於看完揭示，之後不能再停止。
 *
 * The Harness run lifecycle: run, reveal, stop, staleness and persistence, all as pure functions.
 * The verdict is fixed when Run is pressed and the reveal is only an on-screen effect: leaving the
 * Pipeline view counts as finishing the reveal, after which Stop is no longer possible.
 */

export interface HarnessRun {
  profile: Profile;
  at: Date;
}

export interface HarnessRunState {
  run: HarnessRun | null;
  /** 揭示中按停止時要還原的上一份執行。 The run Stop puts back during a reveal. */
  previous: HarnessRun | null;
  /** 已揭示的閘門數；`"all"` 代表揭示已結束。 Gates revealed so far; `"all"` once the reveal is over. */
  revealed: number | "all";
  /** 讀回的紀錄規則版本不符或資料損壞。 The stored record had another rule version or was broken. */
  invalid: boolean;
}

export type HarnessRunEvent =
  | { type: "hydrate"; run: HarnessRun | null; invalid: boolean }
  | { type: "start"; profile: Profile; at: Date }
  | { type: "revealNext" }
  | { type: "stop" }
  | { type: "finishReveal" };

export type HarnessPhase = "idle" | "revealing" | "done";

export const INITIAL_HARNESS_RUN: HarnessRunState = {
  run: null,
  previous: null,
  revealed: "all",
  invalid: false,
};

export const STALE_NOTICE: Bi = bi(
  "設定已改，這份裁決對不上目前的系統。",
  "The settings changed; this verdict no longer matches the current system.",
);

export function harnessPhase(state: HarnessRunState): HarnessPhase {
  if (!state.run) return "idle";
  return state.revealed === "all" ? "done" : "revealing";
}

/**
 * 狀態機。不符合前提的事件一律忽略，原樣回傳，避免重複點擊或卸載時機造成競態。
 * The state machine. An event whose precondition fails is ignored and the state returned as is,
 * so double clicks and unmount timing cannot race.
 */
export function harnessRunReducer(state: HarnessRunState, event: HarnessRunEvent): HarnessRunState {
  const revealing = harnessPhase(state) === "revealing";
  switch (event.type) {
    case "hydrate":
      return { run: event.run, previous: null, revealed: "all", invalid: event.invalid };
    case "start":
      if (revealing) return state;
      return {
        run: { profile: event.profile, at: event.at },
        previous: state.run,
        revealed: 0,
        invalid: false,
      };
    case "revealNext": {
      if (!revealing || !state.run || state.revealed === "all") return state;
      const next = state.revealed + 1;
      return next >= buildPlan(state.run.profile).steps.length
        ? { ...state, previous: null, revealed: "all" }
        : { ...state, revealed: next };
    }
    case "stop":
      if (!revealing) return state;
      return { ...state, run: state.previous, previous: null, revealed: "all" };
    case "finishReveal":
      if (!revealing) return state;
      return { ...state, previous: null, revealed: "all" };
  }
}

/** 已揭示幾道閘門；揭示結束後就是全部。 How many gates are revealed; all of them once the reveal is over. */
export function revealedCount(state: HarnessRunState, plan: RunPlan | null): number {
  return state.revealed === "all" ? (plan?.steps.length ?? 0) : state.revealed;
}

export function planFor(run: HarnessRun | null): RunPlan | null {
  return run ? buildPlan(run.profile) : null;
}

/**
 * 揭示結束後，用目前的設定重新執行會得到不同的結果。只改名稱或預設情境標記、切換不影響裁決的設計期緩解都不算。
 * After the reveal, running again with the current settings would give a different result. Renaming,
 * the preset tag or a design-time mitigation that never changes the verdict does not count.
 */
export function isStale(state: HarnessRunState, profile: Profile): boolean {
  return harnessPhase(state) === "done" && !!state.run && !sameResult(state.run.profile, profile);
}

/**
 * 解析存下的執行；時間或設定壞掉、或設定正規化後會改變，都當成沒有這份執行。
 * Parse a stored run; a broken time or profile, or one that normalization would change, counts as no run.
 */
function parseStoredRun(raw: unknown): HarnessRun | null {
  if (!raw || typeof raw !== "object") return null;
  const { profile, at, version } = raw as Record<string, unknown>;
  if (version !== RUN_RULE_VERSION) return null;
  const time = typeof at === "string" ? new Date(at) : null;
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile) ||
    !time ||
    Number.isNaN(time.getTime())
  )
    return null;
  const parsed = parseProfile(profile);
  const original = profile as Record<string, unknown>;
  const normalized = parsed as unknown as Record<string, unknown>;
  if (
    Object.keys(normalized).some(
      (key) => JSON.stringify(original[key]) !== JSON.stringify(normalized[key]),
    )
  )
    return null;
  return { profile: parsed, at: time };
}

/**
 * 讀回最近一次執行。有紀錄卻讀不回來時回報 `invalid`，並刪掉那筆紀錄。
 * Load the latest run. A record that exists but cannot be read reports `invalid` and is removed.
 */
export function loadRun(store: KeyValueStore | null): { run: HarnessRun | null; invalid: boolean } {
  const saved = readString(RUN_KEY, store);
  const run = loadWithMigration(RUN_KEY, parseStoredRun, null, store);
  const invalid = saved !== null && run === null;
  if (invalid) remove(RUN_KEY, store);
  return { run, invalid };
}

/** 存下最近一次執行；`null` 就刪除。 Save the latest run, or remove it for `null`. */
export function saveRun(run: HarnessRun | null, store: KeyValueStore | null): void {
  if (run)
    save(
      RUN_KEY,
      { profile: run.profile, at: run.at.toISOString(), version: RUN_RULE_VERSION },
      store,
    );
  else remove(RUN_KEY, store);
}
