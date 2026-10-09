import {
  DEFECT_HINT,
  DEFECT_LABEL,
  DEFECT_STATES,
  EXPOSURE_LABEL,
  MITIGATIONS,
  MITIGATION_HINT,
  MITIGATION_LABEL,
  NAME_MAX_LENGTH,
  PRESETS,
  PRESET_NAME,
  SENSITIVITY_LABEL,
  displayName,
  type Exposure,
  type Sensitivity,
} from "@/data/model";
import { agencyOpen, recommendLevel, trifectaOpen, trifectaPresent } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { Badge, Choice, ToggleRow } from "@/components/ui";
import { bi, type Bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";

/**
 * 受測系統設定表單：預設情境、暴露面、LLM／Agent、三要素、緩解。
 * System-under-test form: presets, exposure, LLM / agent, the trifecta, mitigations.
 */

const PRESET_ORDER = ["script", "kb", "platform", "hardened"] as const;

const T = {
  presets: bi("預設情境", "Presets"),
  name: bi("系統名稱", "System name"),
  exposure: bi("暴露面", "Exposure"),
  sensitivity: bi("資料敏感度", "Data sensitivity"),
  api: bi("有 HTTP API 或網頁介面", "Has an HTTP API or web UI"),
  apiImplied: bi("對外或含 LLM 時一定有", "Always true when public or with an LLM"),
  apiHint: bi("內部 API 也要過 G4 與 G5", "Internal APIs still go through G4 and G5"),
  llm: bi("含 LLM 介面", "Has an LLM interface"),
  agent: bi("含 Agent 工具呼叫", "Has agent tool calls"),
  privateData: bi("能讀私有資料", "Can read private data"),
  privateHint: bi("致命三要素之一", "One leg of the lethal trifecta"),
  untrusted: bi("會吃不受信任內容", "Consumes untrusted content"),
  untrustedHint: bi("網頁、信件、PDF、上傳檔", "Web pages, mail, PDFs, uploads"),
  egress: bi("能對外通訊或執行動作", "Can call out or take actions"),
  egressHint: bi("HTTP、寫入、呼叫外部 API", "HTTP, writes, external API calls"),
  needsAi: bi("需有 LLM 或 Agent 才算數", "Only counts with an LLM or agent"),
  destructive: bi("工具可刪改或執行 SQL", "Tools can delete, modify or run SQL"),
  needsAgent: bi("需先有 Agent 工具", "Needs agent tools first"),
  threatModel: bi("已完成威脅建模", "Threat model completed"),
  threatHint: bi(
    "指受測系統本身；管線是否要求，在閘門頁勾選",
    "About the system itself; whether your pipeline requires it is checked on the gates page",
  ),
  diffOnly: bi("PR 只掃差異", "Diff-only PR scan"),
  diffHint: bi("全歷史改在夜間，不取消", "Full history moves to the nightly job, never cancelled"),
  defects: bi("示範程式的狀態", "State of the demo code"),
  mitigations: bi("設計期緩解（可複選）", "Design-time mitigations (multi-select)"),
  triOpen: bi("三要素未切斷", "Trifecta not cut"),
  triCut: bi("三要素已切斷", "Trifecta cut"),
  triAbsent: bi("三要素未同時成立", "Trifecta not present"),
  agency: bi("破壞性工具未經人工核可", "Destructive tools without human approval"),
  custom: bi("自訂", "Custom"),
};

export function ProfileForm() {
  const { profile, setProfile, patchProfile, locale } = useApp();
  const t = useT();
  const advice = recommendLevel(profile);
  const open = trifectaOpen(profile);
  const ai = profile.llm || profile.agent;
  const apiImplied = profile.exposure !== "internal" || profile.llm;
  const trifectaHint = (hint: Bi) => (ai ? t(hint) : t(T.needsAi));

  return (
    <div className="space-y-4">
      <div role="group" aria-label={t(T.presets)} className="flex gap-2 overflow-x-auto pb-1">
        {PRESET_ORDER.map((id) => (
          <Choice
            key={id}
            active={profile.preset === id}
            // 選預設情境時名稱跟著語系走；之後改任何欄位就變成自訂。
            // Picking a preset names it in the current locale; editing any field makes it custom.
            onClick={() => setProfile({ ...PRESETS[id], name: PRESET_NAME[id][locale] })}
            className="shrink-0"
          >
            {t(PRESET_NAME[id])}
          </Choice>
        ))}
      </div>

      <label className="block text-sm">
        <span className="text-muted">{t(T.name)}</span>
        <input
          // 預設情境的名稱跟著語系顯示；一開始打字就變成自訂名稱。
          // Preset names display in the current locale; typing turns it into a custom name.
          value={profile.preset === "custom" ? profile.name : displayName(profile, locale)}
          maxLength={NAME_MAX_LENGTH}
          onChange={(event) => patchProfile({ name: event.target.value })}
          className="mt-1 min-h-11 w-full rounded-md border border-line-strong bg-bg px-3 text-fg"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">{t(T.exposure)}</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(EXPOSURE_LABEL) as Exposure[]).map((value) => (
            <Choice
              key={value}
              active={profile.exposure === value}
              onClick={() => patchProfile({ exposure: value })}
            >
              {t(EXPOSURE_LABEL[value])}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">{t(T.sensitivity)}</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SENSITIVITY_LABEL) as Sensitivity[]).map((value) => (
            <Choice
              key={value}
              active={profile.sensitivity === value}
              onClick={() => patchProfile({ sensitivity: value })}
            >
              {t(SENSITIVITY_LABEL[value])}
            </Choice>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <ToggleRow
          label={t(T.api)}
          hint={apiImplied ? t(T.apiImplied) : t(T.apiHint)}
          on={apiImplied || profile.api}
          disabled={apiImplied}
          onChange={(api) => patchProfile({ api })}
        />
        <ToggleRow label={t(T.llm)} on={profile.llm} onChange={(llm) => patchProfile({ llm })} />
        <ToggleRow
          label={t(T.agent)}
          on={profile.agent}
          onChange={(agent) => patchProfile({ agent })}
        />
        <ToggleRow
          label={t(T.privateData)}
          hint={trifectaHint(T.privateHint)}
          on={profile.privateData}
          disabled={!ai}
          onChange={(privateData) => patchProfile({ privateData })}
        />
        <ToggleRow
          label={t(T.untrusted)}
          hint={trifectaHint(T.untrustedHint)}
          on={profile.untrusted}
          disabled={!ai}
          onChange={(untrusted) => patchProfile({ untrusted })}
        />
        <ToggleRow
          label={t(T.egress)}
          hint={trifectaHint(T.egressHint)}
          on={profile.egress}
          disabled={!ai}
          onChange={(egress) => patchProfile({ egress })}
        />
        <ToggleRow
          label={t(T.destructive)}
          hint={profile.agent ? undefined : t(T.needsAgent)}
          on={profile.destructive}
          disabled={!profile.agent}
          onChange={(destructive) => patchProfile({ destructive })}
        />
        <ToggleRow
          label={t(T.threatModel)}
          hint={t(T.threatHint)}
          on={profile.threatModel}
          onChange={(threatModel) => patchProfile({ threatModel })}
        />
        <ToggleRow
          label={t(T.diffOnly)}
          hint={t(T.diffHint)}
          on={profile.diffOnly}
          onChange={(diffOnly) => patchProfile({ diffOnly })}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">{t(T.defects)}</legend>
        <div className="grid grid-cols-3 gap-2">
          {DEFECT_STATES.map((value) => (
            <Choice
              key={value}
              active={profile.defects === value}
              onClick={() => patchProfile({ defects: value })}
            >
              {t(DEFECT_LABEL[value])}
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">{t(DEFECT_HINT[profile.defects])}</p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">{t(T.mitigations)}</legend>
        <div className="grid gap-2">
          {MITIGATIONS.map((value) => (
            <ToggleRow
              key={value}
              label={t(MITIGATION_LABEL[value])}
              hint={t(MITIGATION_HINT[value])}
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
            {open ? t(T.triOpen) : trifectaPresent(profile) ? t(T.triCut) : t(T.triAbsent)}
          </Badge>
          {agencyOpen(profile) && <Badge tone="block">{t(T.agency)}</Badge>}
          {profile.preset === "custom" && <Badge tone="neutral">{t(T.custom)}</Badge>}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {advice.reasons.map((reason) => (
            <li key={reason.zh}>{t(reason)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
