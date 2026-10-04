import {
  DEFECT_HINT,
  DEFECT_LABEL,
  DEFECT_STATES,
  EXPOSURE_LABEL,
  MITIGATIONS,
  MITIGATION_HINT,
  MITIGATION_LABEL,
  PRESETS,
  SENSITIVITY_LABEL,
  type Exposure,
  type Sensitivity,
} from "@/data/model";
import { agencyOpen, recommendLevel, trifectaOpen, trifectaPresent } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { Badge, Choice, ToggleRow } from "@/components/ui";

const PRESET_ORDER = ["script", "kb", "platform", "hardened"] as const;

export function ProfileForm() {
  const { profile, setProfile, patchProfile } = useApp();
  const advice = recommendLevel(profile);
  const open = trifectaOpen(profile);
  const ai = profile.llm || profile.agent;
  const apiImplied = profile.exposure !== "internal" || profile.llm;
  const trifectaHint = (hint: string) => (ai ? hint : "需有 LLM 或 Agent 才算數");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRESET_ORDER.map((id) => (
          <Choice
            key={id}
            active={profile.preset === id}
            onClick={() => setProfile(PRESETS[id])}
            className="shrink-0"
          >
            {PRESETS[id].name}
          </Choice>
        ))}
      </div>

      <label className="block text-sm">
        <span className="text-muted">系統名稱</span>
        <input
          value={profile.name}
          onChange={(event) => patchProfile({ name: event.target.value })}
          className="mt-1 min-h-11 w-full rounded-md border border-line-strong bg-bg px-3 text-fg"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">暴露面</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(EXPOSURE_LABEL) as Exposure[]).map((value) => (
            <Choice
              key={value}
              active={profile.exposure === value}
              onClick={() => patchProfile({ exposure: value })}
            >
              {EXPOSURE_LABEL[value]}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">資料敏感度</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SENSITIVITY_LABEL) as Sensitivity[]).map((value) => (
            <Choice
              key={value}
              active={profile.sensitivity === value}
              onClick={() => patchProfile({ sensitivity: value })}
            >
              {SENSITIVITY_LABEL[value]}
            </Choice>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <ToggleRow
          label="有 HTTP API 或網頁介面"
          hint={apiImplied ? "對外或含 LLM 時一定有" : "內部 API 也要過 G4 與 G5"}
          on={apiImplied || profile.api}
          disabled={apiImplied}
          onChange={(api) => patchProfile({ api })}
        />
        <ToggleRow label="含 LLM 介面" on={profile.llm} onChange={(llm) => patchProfile({ llm })} />
        <ToggleRow
          label="含 Agent 工具呼叫"
          on={profile.agent}
          onChange={(agent) => patchProfile({ agent })}
        />
        <ToggleRow
          label="能讀私有資料"
          hint={trifectaHint("致命三要素之一")}
          on={profile.privateData}
          disabled={!ai}
          onChange={(privateData) => patchProfile({ privateData })}
        />
        <ToggleRow
          label="會吃不受信任內容"
          hint={trifectaHint("網頁、信件、PDF、上傳檔")}
          on={profile.untrusted}
          disabled={!ai}
          onChange={(untrusted) => patchProfile({ untrusted })}
        />
        <ToggleRow
          label="能對外通訊或執行動作"
          hint={trifectaHint("HTTP、寫入、呼叫外部 API")}
          on={profile.egress}
          disabled={!ai}
          onChange={(egress) => patchProfile({ egress })}
        />
        <ToggleRow
          label="工具可刪改或執行 SQL"
          hint={profile.agent ? undefined : "需先有 Agent 工具"}
          on={profile.destructive}
          disabled={!profile.agent}
          onChange={(destructive) => patchProfile({ destructive })}
        />
        <ToggleRow
          label="已完成威脅建模"
          hint="指受測系統本身；管線是否要求，在閘門頁勾選"
          on={profile.threatModel}
          onChange={(threatModel) => patchProfile({ threatModel })}
        />
        <ToggleRow
          label="PR 只掃差異"
          hint="全歷史改在夜間，不取消"
          on={profile.diffOnly}
          onChange={(diffOnly) => patchProfile({ diffOnly })}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">示範程式的狀態</legend>
        <div className="grid grid-cols-3 gap-2">
          {DEFECT_STATES.map((value) => (
            <Choice
              key={value}
              active={profile.defects === value}
              onClick={() => patchProfile({ defects: value })}
            >
              {DEFECT_LABEL[value]}
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">{DEFECT_HINT[profile.defects]}</p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">設計期緩解（可複選）</legend>
        <div className="grid gap-2">
          {MITIGATIONS.map((value) => (
            <ToggleRow
              key={value}
              label={MITIGATION_LABEL[value]}
              hint={MITIGATION_HINT[value]}
              on={profile.mitigations.includes(value)}
              onChange={(on) =>
                patchProfile({
                  mitigations: MITIGATIONS.filter((item) =>
                    item === value ? on : profile.mitigations.includes(item),
                  ),
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <div className="rounded-md border border-line bg-bg px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{advice.level}</Badge>
          <Badge tone={open ? "block" : "pass"}>
            {open ? "三要素未切斷" : trifectaPresent(profile) ? "三要素已切斷" : "三要素未同時成立"}
          </Badge>
          {agencyOpen(profile) && <Badge tone="block">破壞性工具未經人工核可</Badge>}
          {profile.preset === "custom" && <Badge tone="neutral">自訂</Badge>}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {advice.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
