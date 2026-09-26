export const MAINNET_FORBIDDEN = true as const;

export type RpcBlockCode = "MAINNET_FORBIDDEN" | "TESTNET_FORBIDDEN" | "REMOTE_RPC_FORBIDDEN";

export type RpcDecision = {
  allowed: false;
  code: RpcBlockCode;
  message: string;
};

function block(code: RpcBlockCode, message: string): RpcDecision {
  return { allowed: false, code, message };
}

/**
 * Every remote endpoint is refused in this version.
 * There is no branch with an allowed RPC.
 */
export function assessRpc(value: string): RpcDecision {
  const raw = value.trim().toLowerCase();
  if (raw.length === 0) {
    return block("REMOTE_RPC_FORBIDDEN", "Empty endpoint. No remote RPC is allowed.");
  }
  if (raw.includes("mainnet")) {
    return block("MAINNET_FORBIDDEN", "Mainnet endpoints are forbidden.");
  }
  if (raw.includes("testnet")) {
    return block("TESTNET_FORBIDDEN", "Testnet endpoints are forbidden.");
  }
  return block("REMOTE_RPC_FORBIDDEN", "No remote RPC is allowed in this version.");
}
