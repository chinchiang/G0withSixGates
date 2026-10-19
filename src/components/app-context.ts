import { createContext, useContext } from "react";
import { buildPlan, type RunPlan } from "@/data/engine";
import { GATE_DOCS, type GateId, type Profile, type ViewId } from "@/data/model";

export interface HarnessRun {
  profile: Profile;
  at: Date;
}

export interface AppState {
  view: ViewId;
  setView: (view: ViewId) => void;
  gate: GateId;
  openGate: (gate: GateId) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  patchProfile: (partial: Partial<Profile>) => void;
  checks: Record<string, boolean>;
  toggleCheck: (id: string) => void;
  /** 整份換掉，用於清除全部與復原。 */
  replaceChecks: (next: Record<string, boolean>) => void;
  checkProgress: { done: number; total: number };
  run: HarnessRun | null;
  /** 最近一次執行的裁決；閘門頁用它標出每個控制項攔下了什麼。 */
  plan: RunPlan | null;
  startRun: () => void;
  clearRun: () => void;
}

export const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const value = useContext(Ctx);
  if (!value) throw new Error("AppState 尚未就緒");
  return value;
}

export function checkProgressOf(checks: Record<string, boolean>): { done: number; total: number } {
  const total = GATE_DOCS.reduce((sum, doc) => sum + doc.controls.length, 0);
  const done = GATE_DOCS.reduce(
    (sum, doc) => sum + doc.controls.filter((item) => checks[item.id]).length,
    0,
  );
  return { done, total };
}

export function planOf(run: HarnessRun | null): RunPlan | null {
  return run ? buildPlan(run.profile) : null;
}
