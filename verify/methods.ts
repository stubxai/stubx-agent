export const ALLOWED_RPC_METHODS = [
  "getAccountInfo",
  "getMultipleAccounts",
  "getTokenSupply",
  "getTokenLargestAccounts",
  "getSlot",
] as const;

export type AllowedRpcMethod = (typeof ALLOWED_RPC_METHODS)[number];
