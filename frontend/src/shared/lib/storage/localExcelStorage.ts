const STORAGE_KEY = "pps-worktime-excel-state-v1";

export const loadExcelStateRaw = (): unknown | null => {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export const saveExcelStateRaw = (state: unknown): void => {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // MVP: silently ignore storage errors (e.g. blocked cookies/private mode)
  }
};

