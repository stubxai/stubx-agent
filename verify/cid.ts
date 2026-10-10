const CID_RE = /(?:baf[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})/;

export function extractCid(value: string): string | null {
  const match = CID_RE.exec(value);
  return match ? match[0] : null;
}
