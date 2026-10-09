export const DRAFT_KEY = "stubx-studio-draft";

export function loadDraft(storage) {
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function saveDraft(storage, draft) {
  storage.setItem(DRAFT_KEY, JSON.stringify({ v: 1, ...draft }));
}

export function clearDraft(storage) {
  storage.removeItem(DRAFT_KEY);
}
