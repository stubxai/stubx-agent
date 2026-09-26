import { ALLOWED_ACTIONS } from "./types.js";
import type { AllowedAction, LimitId } from "./types.js";

export function isAllowedAction(action: string): action is AllowedAction {
  return (ALLOWED_ACTIONS as readonly string[]).includes(action);
}

/**
 * Dangerous names are rejected even if a later edit adds them to the allowlist.
 * The allowlist can only narrow what runs. It cannot grant signing, custody,
 * exchange, or sending.
 */
export function limitForDeniedAction(action: string): LimitId | null {
  const lower = action.toLowerCase();
  if (lower.includes("custod")) {
    return "no-custody";
  }
  if (lower.includes("trade") || lower.includes("swap")) {
    return "no-trade";
  }
  if (lower.includes("send")) {
    return "no-send";
  }
  if (
    lower.includes("sign") ||
    lower.includes("keypair") ||
    lower.includes("secret") ||
    lower.includes("seed")
  ) {
    return "no-sign";
  }
  return null;
}

export type ActionAssessment =
  | { kind: "allow" }
  | { kind: "deny"; limitId: LimitId | null; code: string };

export function assessAction(action: string, allowlist: readonly string[] = ALLOWED_ACTIONS): ActionAssessment {
  const limitId = limitForDeniedAction(action);
  if (limitId) {
    return { kind: "deny", limitId, code: limitId };
  }
  if (!allowlist.includes(action)) {
    return { kind: "deny", limitId: null, code: "not-allowlisted" };
  }
  return { kind: "allow" };
}
