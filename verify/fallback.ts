import type { AccountInfo, ChainReader, LargestAccount, RpcResult, TokenAmount } from "./rpc.js";

export function isRetryableFailure(result: { ok: boolean; error?: string; httpStatus?: number | null }): boolean {
  if (result.ok) {
    return false;
  }
  const status = result.httpStatus ?? null;
  // Un 403 es un rechazo, no un fallo pasajero: no se prueba el servicio siguiente.
  if (status === 429 || status === 408 || (status !== null && status >= 500)) {
    return true;
  }
  return /429|too many|rate limit|timeout|timed out|tiempo de espera|network|fetch failed|ECONN|ENET|ENOTFOUND|socket/i.test(
    result.error ?? "",
  );
}

export function classifyRpcFailure(error: string, httpStatus: number | null): "limite" | "tiempo" | "red" {
  if (httpStatus === 429 || /429|too many|rate limit/i.test(error)) {
    return "limite";
  }
  if (httpStatus === 408 || /timeout|timed out|tiempo de espera|aborted due to timeout/i.test(error)) {
    return "tiempo";
  }
  return "red";
}

/** Prueba el lector siguiente solo si el anterior falla por límite, tiempo o red. */
export class FallbackRpc implements ChainReader {
  lastEndpoint: string;
  usedFallback = false;
  readonly reads: { method: string; endpoint: string }[] = [];

  constructor(
    private readonly readers: readonly ChainReader[],
    readonly endpoints: readonly string[],
  ) {
    this.lastEndpoint = endpoints[0] ?? "";
  }

  getSlot(): Promise<RpcResult<number>> {
    return this.first("getSlot", (reader) => reader.getSlot());
  }

  getAccountInfo(address: string): Promise<RpcResult<AccountInfo | null>> {
    return this.first("getAccountInfo", (reader) => reader.getAccountInfo(address));
  }

  getMultipleAccounts(addresses: readonly string[]): Promise<RpcResult<(AccountInfo | null)[]>> {
    return this.first("getMultipleAccounts", (reader) => reader.getMultipleAccounts(addresses));
  }

  getTokenSupply(mint: string): Promise<RpcResult<TokenAmount>> {
    return this.first("getTokenSupply", (reader) => reader.getTokenSupply(mint));
  }

  getTokenLargestAccounts(mint: string): Promise<RpcResult<LargestAccount[]>> {
    return this.first("getTokenLargestAccounts", (reader) => reader.getTokenLargestAccounts(mint));
  }

  private async first<T>(method: string, run: (reader: ChainReader) => Promise<RpcResult<T>>): Promise<RpcResult<T>> {
    let last: RpcResult<T> | null = null;
    for (let index = 0; index < this.readers.length; index += 1) {
      const reader = this.readers[index];
      if (!reader) {
        continue;
      }
      const result = await run(reader);
      last = result;
      this.lastEndpoint = this.endpoints[index] ?? this.lastEndpoint;
      if (result.ok || !isRetryableFailure(result) || index === this.readers.length - 1) {
        this.reads.push({ method, endpoint: this.lastEndpoint });
        if (index > 0) {
          this.usedFallback = true;
        }
        return result;
      }
    }
    return (
      last ?? {
        ok: false,
        method: "rpc",
        error: "sin respuesta",
        httpStatus: null,
        fetchedAt: new Date().toISOString(),
      }
    );
  }
}
