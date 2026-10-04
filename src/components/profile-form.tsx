import { PRESETS, MITIGATION_LABEL, type Exposure, type Mitigation, type Sensitivity } from "@/data/model";
import { recommendLevel, trifectaOpen } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { Badge, Choice, ToggleRow } from "@/components/ui";

const PRESET_ORDER = ["script", "kb", "platform", "hardened"] as const;

export function ProfileForm() {
  const { profile, setProfile, patchProfile } = useApp();
  const advice = recommendLevel(profile);
  const open = trifectaOpen(profile);

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
          className="mt-1 min-h-11 w-full rounded-md border border-line bg-bg px-3 text-fg"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">暴露面</legend>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["internal", "內部"],
              ["partner", "夥伴"],
              ["public", "對外"],
            ] as const
          ).map(([value, label]) => (
            <Choice
              key={value}
              active={profile.exposure === value}
              onClick={() => patchProfile({ exposure: value as Exposure })}
            >
              {label}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">資料敏感度</legend>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["low", "低"],
              ["business", "業務"],
              ["pii", "個資"],
            ] as const
          ).map(([value, label]) => (
            <Choice
              key={value}
              active={profile.sensitivity === value}
              onClick={() => patchProfile({ sensitivity: value as Sensitivity })}
            >
              {label}
            </Choice>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <ToggleRow label="含 LLM 介面" on={profile.llm} onChange={(llm) => patchProfile({ llm })} />
        <ToggleRow
          label="含 Agent 工具呼叫"
          on={profile.agent}
          onChange={(agent) => patchProfile({ agent })}
        />
        <ToggleRow
          label="能讀私有資料"
          hint="致命三要素之一"
          on={profile.privateData}
          onChange={(privateData) => patchProfile({ privateData })}
        />
        <ToggleRow
          label="會吃不受信任內容"
          hint="網頁、信件、PDF、上傳檔"
          on={profile.untrusted}
          onChange={(untrusted) => patchProfile({ untrusted })}
        />
        <ToggleRow
          label="能對外通訊或執行動作"
          hint="HTTP、寫入、呼叫外部 API"
          on={profile.egress}
          onChange={(egress) => patchProfile({ egress })}
        />
        <ToggleRow
          label="工具可刪改或執行 SQL"
          on={profile.destructive}
          onChange={(destructive) => patchProfile({ destructive })}
        />
        <ToggleRow
          label="已完成威脅建模"
          on={profile.threatModel}
          onChange={(threatModel) => patchProfile({ threatModel })}
        />
        <ToggleRow
          label="PR 只掃差異"
          hint="全歷史改在夜間，不取消"
          on={profile.diffOnly}
          onChange={(diffOnly) => patchProfile({ diffOnly })}
        />
        <ToggleRow
          label="示範程式仍有 Vibe 缺陷"
          hint="關掉表示這次變更已依閘門整治"
          on={profile.defects}
          onChange={(defects) => patchProfile({ defects })}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">設計期如何處理三要素</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(MITIGATION_LABEL) as Mitigation[]).map((value) => (
            <Choice
              key={value}
              active={profile.mitigation === value}
              onClick={() => patchProfile({ mitigation: value })}
            >
              {MITIGATION_LABEL[value]}
            </Choice>
          ))}
        </div>
      </fieldset>

      <div className="rounded-md border border-line bg-bg px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{advice.level}</Badge>
          <Badge tone={open ? "block" : "pass"}>{open ? "三要素未切斷" : "三要素未同時成立或已切斷"}</Badge>
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
