/**
 * localStorage 的安全讀寫與舊鍵搬移。
 * 專案從「六道閘門（VibeGate）」更名為「六扇門（Six-Gate）」，鍵名跟著改；
 * 第一次載入時把舊 `vibegate-*` 鍵搬到新鍵，使用者的設定與勾選不會消失。
 * 讀寫都包在 try/catch 裡：隱私模式或配額用盡時只是不存，不會讓整個 app 進錯誤畫面。
 *
 * Safe localStorage access plus a one-time key migration.
 * The project was renamed from "六道閘門 (VibeGate)" to "六扇門 (Six-Gate)" and the
 * keys followed; on first load the old `vibegate-*` keys are moved to the new ones so
 * saved settings and checks survive. Every access is wrapped in try/catch: private
 * mode or a full quota just skips persistence instead of crashing the app.
 */

export const PROFILE_KEY = "six-gate-profile-v1";
export const CHECK_KEY = "six-gate-checks-v1";
export const LOCALE_KEY = "six-gate-locale";
// 主題鍵與型別守衛集中在 src/theme.ts。 The theme key and type guard live in src/theme.ts.
export { THEME_KEY, isTheme } from "../theme.ts";
/**
 * 最近一次 Harness 執行，存在 sessionStorage：重新整理還在，關掉分頁就清掉。
 * The latest Harness run, kept in sessionStorage: it survives a reload and is gone when the tab closes.
 */
export const RUN_KEY = "six-gate-run-v1";

/** 更名前的鍵。 Keys from before the rename. */
export const LEGACY_KEYS: Record<string, string> = {
  [PROFILE_KEY]: "vibegate-profile-v1",
  [CHECK_KEY]: "vibegate-checks-v1",
};

/** 最小介面，方便測試用假物件替代。 Minimal interface so tests can pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStore(): KeyValueStore | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** sessionStorage；不可用時回傳 null。 sessionStorage, or null when it is unavailable. */
export function sessionStore(): KeyValueStore | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

/**
 * 讀出並解析一個鍵；新鍵沒有值就讀舊鍵並搬過去。解析失敗或資料壞掉時回傳 `fallback`。
 * Read and parse one key; when the new key is empty, read the legacy key and move it over.
 * Returns `fallback` when parsing fails or the data is broken.
 */
export function loadWithMigration<T>(
  key: string,
  parse: (raw: unknown) => T,
  fallback: T,
  store: KeyValueStore | null = defaultStore(),
): T {
  if (!store) return fallback;
  try {
    let raw = store.getItem(key);
    const legacy = LEGACY_KEYS[key];
    if (raw === null && legacy) {
      raw = store.getItem(legacy);
      if (raw !== null) {
        store.setItem(key, raw);
        store.removeItem(legacy);
      }
    }
    if (raw === null) return fallback;
    return parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function save(
  key: string,
  value: unknown,
  store: KeyValueStore | null = defaultStore(),
): void {
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* 無法寫入時就不存。 Skip persistence when storage is unavailable. */
  }
}

export function remove(key: string, store: KeyValueStore | null = defaultStore()): void {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* 同上。 Same as above. */
  }
}

export interface StoredRun<P> {
  profile: P;
  at: Date;
}

/**
 * 讀回存下的執行；時間或設定壞掉就當成沒有執行過。
 * Parse a stored run; a broken time or profile counts as no run at all.
 */
export function parseRun<P>(raw: unknown, parseProfile: (raw: unknown) => P): StoredRun<P> | null {
  if (!raw || typeof raw !== "object") return null;
  const { profile, at } = raw as Record<string, unknown>;
  const time = typeof at === "string" ? new Date(at) : null;
  if (!profile || !time || Number.isNaN(time.getTime())) return null;
  return { profile: parseProfile(profile), at: time };
}

export function readString(
  key: string,
  store: KeyValueStore | null = defaultStore(),
): string | null {
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(
  key: string,
  value: string,
  store: KeyValueStore | null = defaultStore(),
): void {
  if (!store) return;
  try {
    store.setItem(key, value);
  } catch {
    /* 同上。 Same as above. */
  }
}

/**
 * 勾選狀態只接受「已知控制項 id → 布林」；其他型別或過期的 id 一律丟掉。
 * Checks accept only "known control id → boolean"; other shapes and stale ids are dropped.
 */
export function parseChecks(raw: unknown, knownIds: ReadonlySet<string>): Record<string, boolean> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (knownIds.has(id) && typeof value === "boolean") out[id] = value;
  }
  return out;
}
