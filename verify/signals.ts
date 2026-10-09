import { formatUnits, percentTruncated } from "./bytes.js";
import { FallbackRpc, classifyRpcFailure } from "./fallback.js";
import { validateMint } from "./input.js";
import { compareCanonical } from "./impersonation.js";
import { decodeMetaplex } from "./metadata.js";
import { decodeMint, readTokenAccount } from "./mint.js";
import {
  ACCOUNT_BASE_LEN,
  MINT_BASE_LEN,
  PUMP_PROGRAM,
  TOKEN_2022_PROGRAM,
  TOKEN_PROGRAM,
  associatedTokenAddress,
  bondingCurvePda,
  metadataPda,
} from "./programs.js";
import { decodeBondingCurve } from "./pump.js";
import { RpcClient, type AccountInfo, type ChainReader, type RpcResult, type RpcTransport } from "./rpc.js";
import type { CanonicalToken, ExtensionReport } from "./types.js";

export type Localized = { es: string; en: string };

export type SignalLevel = "ok" | "atencion" | "riesgo" | "neutro";

export type Signal = {
  id: string;
  level: SignalLevel;
  title: Localized;
  explain: Localized;
};

export type LiveRow = { label: Localized; value: Localized };

export const AUDIT_NOTICE: Localized = {
  es: "Esto no es una auditoría ni una recomendación. Un token sin señales de riesgo puede seguir siendo una mala inversión.",
  en: "This is not an audit or a recommendation. A token with no risk signals can still be a bad investment.",
};

export type LiveReading = {
  ok: boolean;
  kind: "lectura" | "limite" | "tiempo" | "red" | "invalida";
  mint: string | null;
  light: "ok" | "riesgo" | "atencion" | "neutro" | "espera";
  lightLabel: Localized;
  title: Localized;
  support: Localized;
  signals: Signal[];
  rows: LiveRow[];
  endpointHost: string | null;
  usedFallback: boolean;
  slot: number | null;
};

export type ReadMintInput = {
  mint: string;
  registry: readonly CanonicalToken[];
  endpoints: readonly string[];
  transport?: RpcTransport;
  timeoutMs?: number;
  maxRetries?: number;
  minIntervalMs?: number;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
};

export function loadingView(mint: string | null): LiveReading {
  return {
    ok: false,
    kind: "lectura",
    mint,
    light: "espera",
    lightLabel: { es: "Leyendo", en: "Reading" },
    title: { es: "Leyendo la cadena…", en: "Reading the chain…" },
    support: {
      es: "Se consulta un servicio público de Solana, solo lectura. La dirección no se guarda en este sitio.",
      en: "A public Solana service is queried, read-only. The address is not stored on this site.",
    },
    signals: [],
    rows: [],
    endpointHost: null,
    usedFallback: false,
    slot: null,
  };
}

function loc(es: string, en: string): Localized {
  return { es, en };
}

function blank(kind: LiveReading["kind"], mint: string | null, title: Localized, support: Localized): LiveReading {
  return {
    ok: false,
    kind,
    mint,
    light: "neutro",
    lightLabel: loc("No se pudo leer", "Could not be read"),
    title,
    support,
    signals: [],
    rows: [],
    endpointHost: null,
    usedFallback: false,
    slot: null,
  };
}

function failureReading(kind: "limite" | "tiempo" | "red", mint: string, host: string | null, usedFallback: boolean): LiveReading {
  const copy = {
    limite: {
      title: loc("Límite de peticiones", "Request limit"),
      support: loc(
        "El servicio público de lectura ha llegado al límite de peticiones. Prueba otra vez dentro de un momento. No se ha inventado un resultado.",
        "The public read service has hit its request limit. Try again in a moment. No result was invented.",
      ),
    },
    tiempo: {
      title: loc("Tiempo de espera agotado", "Timed out"),
      support: loc(
        "Se agotó el tiempo de espera del servicio de lectura. No se ha inventado un resultado.",
        "The read service timed out. No result was invented.",
      ),
    },
    red: {
      title: loc("No se pudo leer la cadena", "The chain could not be read"),
      support: loc(
        "No se pudo leer la cadena: el servicio no respondió o rechazó la petición. No se ha inventado un resultado.",
        "The chain could not be read: the service did not respond or refused the request. No result was invented.",
      ),
    },
  }[kind];
  return {
    ...blank(kind, mint, copy.title, copy.support),
    endpointHost: host,
    usedFallback,
  };
}

function hostOf(endpoint: string): string | null {
  try {
    return new URL(endpoint).host;
  } catch {
    return null;
  }
}

function isMintAccount(owner: string, data: Uint8Array): boolean {
  if (owner === TOKEN_PROGRAM) {
    return data.length === MINT_BASE_LEN;
  }
  if (owner !== TOKEN_2022_PROGRAM) {
    return false;
  }
  if (data.length === MINT_BASE_LEN) {
    return true;
  }
  return data.length > ACCOUNT_BASE_LEN && data[ACCOUNT_BASE_LEN] === 1;
}

function rememberSlot(result: { ok: boolean; slot?: number | null }, slots: Set<number>): void {
  if (result.ok && typeof result.slot === "number") {
    slots.add(result.slot);
  }
}

export async function readAnyMint(input: ReadMintInput): Promise<LiveReading> {
  const checked = validateMint(input.mint.trim());
  if (!checked.ok) {
    return blank(
      "invalida",
      null,
      loc("Esta dirección no es válida", "This address is not valid"),
      loc(
        "Tiene que ser la dirección completa de un mint de Solana, sin el nombre del token y sin texto alrededor.",
        "It has to be the full Solana mint address, without the token name and without surrounding text.",
      ),
    );
  }
  const endpoints = input.endpoints.map((item) => item.trim()).filter((item) => item.length > 0);
  if (endpoints.length === 0) {
    return failureReading("red", checked.mint, null, false);
  }
  const readers = endpoints.map(
    (endpoint) =>
      new RpcClient({
        endpoint,
        transport: input.transport,
        timeoutMs: input.timeoutMs ?? 8000,
        maxRetries: input.maxRetries ?? 0,
        minIntervalMs: input.minIntervalMs ?? 200,
        now: input.now,
        sleep: input.sleep,
        random: input.random,
      }),
  );
  const rpc = new FallbackRpc(readers, endpoints);
  return readWith(checked.mint, input.registry, rpc);
}

async function readWith(mint: string, registry: readonly CanonicalToken[], rpc: FallbackRpc): Promise<LiveReading> {
  const meta = metadataPda(mint);
  const curve = bondingCurvePda(mint);
  const packed = await rpc.getMultipleAccounts([mint, meta, curve]);
  if (!packed.ok) {
    return failureReading(classifyRpcFailure(packed.error, packed.httpStatus), mint, hostOf(rpc.lastEndpoint), rpc.usedFallback);
  }
  const slots = new Set<number>();
  rememberSlot(packed, slots);
  const mintInfo = packed.value[0] ?? null;
  const metaInfo = packed.value[1] ?? null;
  const curveInfo = packed.value[2] ?? null;
  if (!mintInfo) {
    return {
      ok: true,
      kind: "lectura",
      mint,
      light: "neutro",
      lightLabel: loc("No está", "Not found"),
      title: loc("Esta dirección no existe", "This address does not exist"),
      support: loc(
        "La red no tiene una cuenta en esa dirección. No se rellena con un token vacío.",
        "The network has no account at that address. It is not filled in as an empty token.",
      ),
      signals: [
        {
          id: "ausente",
          level: "neutro",
          title: loc("La cuenta no existe", "The account does not exist"),
          explain: loc(
            "Se pidió la cuenta y la respuesta fue vacía. No es lo mismo que un mint sin permisos.",
            "The account was requested and the response was empty. That is not the same as a mint with no permissions.",
          ),
        },
      ],
      rows: [],
      endpointHost: hostOf(rpc.lastEndpoint),
      usedFallback: rpc.usedFallback,
      slot: packed.slot,
    };
  }
  if (!isMintAccount(mintInfo.owner, mintInfo.data)) {
    const owner = mintInfo.owner;
    return {
      ok: true,
      kind: "lectura",
      mint,
      light: "atencion",
      lightLabel: loc("No es un mint", "Not a mint"),
      title: loc("Esta cuenta no es un mint", "This account is not a mint"),
      support: loc(
        "La dirección existe, pero no es un mint SPL ni Token-2022. El nombre de un token no sustituye a esta comprobación.",
        "The address exists, but it is not an SPL or Token-2022 mint. A token name does not replace this check.",
      ),
      signals: [
        {
          id: "programa",
          level: "atencion",
          title: loc("Programa de la cuenta", "Account program"),
          explain: loc(
            `El propietario de la cuenta es ${owner}. No es el programa SPL Token ni Token-2022.`,
            `The account owner is ${owner}. It is not the SPL Token program or Token-2022.`,
          ),
        },
      ],
      rows: [{ label: loc("Programa", "Program"), value: loc(owner, owner) }],
      endpointHost: hostOf(rpc.lastEndpoint),
      usedFallback: rpc.usedFallback,
      slot: packed.slot,
    };
  }
  const decoded = decodeMint(mintInfo.owner, mintInfo.data);
  if (!decoded || !decoded.initialized) {
    const unread = blank(
      "lectura",
      mint,
      loc("No se pudo leer el mint", "The mint could not be read"),
      loc(
        "La cuenta es del programa de tokens, pero sus bytes no se pudieron separar. No se inventan permisos.",
        "The account belongs to a token program, but its bytes could not be split. Permissions are not invented.",
      ),
    );
    return { ...unread, ok: true, endpointHost: hostOf(rpc.lastEndpoint), usedFallback: rpc.usedFallback, slot: packed.slot };
  }
  const supply = await rpc.getTokenSupply(mint);
  rememberSlot(supply, slots);
  const largest = await rpc.getTokenLargestAccounts(mint);
  rememberSlot(largest, slots);
  const metaplex = metaInfo ? decodeMetaplex(metaInfo.owner, metaInfo.data, mint) : null;
  const bonding = curveInfo && curveInfo.owner === PUMP_PROGRAM ? decodeBondingCurve(curveInfo.owner, curveInfo.data) : null;
  const names = [decoded.tokenMetadata?.name, metaplex?.name].filter((item): item is string => Boolean(item));
  const symbols = [decoded.tokenMetadata?.symbol, metaplex?.symbol].filter((item): item is string => Boolean(item));
  const uri = decoded.tokenMetadata?.uri || metaplex?.uri || "";
  const likeness = compareCanonical(
    { mint, names, symbols, imageUris: [], links: uri ? [uri] : [] },
    registry,
  );
  const signals: Signal[] = [];
  const programName = decoded.standard === "token-2022" ? "Token-2022" : "SPL Token";
  signals.push({
    id: "programa",
    level: "neutro",
    title: loc(`Programa: ${programName}`, `Program: ${programName}`),
    explain: loc(
      decoded.standard === "token-2022"
        ? "Es un mint del programa Token-2022. Puede traer extensiones. Cada extensión de abajo se lee aparte."
        : "Es un mint del programa SPL Token. Ese programa no trae las extensiones de Token-2022.",
      decoded.standard === "token-2022"
        ? "This is a Token-2022 mint. It can carry extensions. Each extension below is read on its own."
        : "This is an SPL Token mint. That program does not carry Token-2022 extensions.",
    ),
  });
  const supplyMatches =
    supply.ok && supply.value.amount === decoded.supplyRaw.toString() && supply.value.decimals === decoded.decimals;
  signals.push({
    id: "suministro",
    level: supply.ok && !supplyMatches ? "atencion" : "neutro",
    title: loc("Suministro y decimales", "Supply and decimals"),
    explain: loc(
      supply.ok
        ? supplyMatches
          ? `Hay ${formatUnits(decoded.supplyRaw, decoded.decimals)} tokens, con ${decoded.decimals} decimales. Las dos lecturas del suministro coinciden.`
          : `Los bytes del mint dicen ${formatUnits(decoded.supplyRaw, decoded.decimals)} con ${decoded.decimals} decimales, y la otra lectura no coincide. No se calculan porcentajes.`
        : `Los bytes del mint dicen ${formatUnits(decoded.supplyRaw, decoded.decimals)} con ${decoded.decimals} decimales. La otra lectura del suministro no respondió, así que no hay porcentajes.`,
      supply.ok
        ? supplyMatches
          ? `There are ${formatUnits(decoded.supplyRaw, decoded.decimals)} tokens, with ${decoded.decimals} decimals. The two supply reads match.`
          : `The mint bytes say ${formatUnits(decoded.supplyRaw, decoded.decimals)} with ${decoded.decimals} decimals, and the other read does not match. Percentages are not calculated.`
        : `The mint bytes say ${formatUnits(decoded.supplyRaw, decoded.decimals)} with ${decoded.decimals} decimals. The other supply read did not respond, so there are no percentages.`,
    ),
  });
  signals.push(authoritySignal("emision", decoded.mintAuthority));
  signals.push(authoritySignal("congelacion", decoded.freezeAuthority));
  signals.push(...extensionSignals(decoded.extensions, decoded.extensionsParsed));
  signals.push(...metadataSignals(decoded.tokenMetadata, metaplex));
  const sample = await accountSample(rpc, mint, mintInfo.owner, curve, largest, supplyMatches ? decoded.supplyRaw : null);
  if (sample.failure) {
    const kind = classifyRpcFailure(sample.failure, sample.httpStatus);
    const text = {
      limite: loc(
        "No se pudo leer la muestra de cuentas con tokens: el servicio llegó al límite de peticiones. No es una concentración de cero.",
        "The token-account sample could not be read: the service hit its request limit. It is not zero concentration.",
      ),
      tiempo: loc(
        "No se pudo leer la muestra de cuentas con tokens: se agotó el tiempo de espera. No es una concentración de cero.",
        "The token-account sample could not be read: the wait timed out. It is not zero concentration.",
      ),
      red: loc(
        "No se pudo leer la muestra de cuentas con tokens. No es una concentración de cero.",
        "The token-account sample could not be read. It is not zero concentration.",
      ),
    }[kind];
    signals.push({
      id: "cuentas",
      level: "atencion",
      title: loc("Cuentas con tokens", "Token accounts"),
      explain: text,
    });
  } else {
    signals.push(sample.signal);
  }
  signals.push(curveSignal(curveInfo, bonding));
  const copyByName = !likeness.inRegistry && likeness.signals.some((item) => /^nombre |^símbolo /.test(item));
  if (likeness.inRegistry) {
    signals.push({
      id: "registro",
      level: "ok",
      title: loc("Está en el registro de STUBX", "It is in the STUBX registry"),
      explain: loc(
        "La dirección coincide con el mint curado. La ficha fechada es una foto anterior. Estar en el registro no es una auditoría.",
        "The address matches the curated mint. The dated card is an earlier snapshot. Being in the registry is not an audit.",
      ),
    });
  } else if (copyByName) {
    signals.push({
      id: "copia",
      level: "riesgo",
      title: loc("Posible copia de STUBX", "Possible STUBX copy"),
      explain: loc(
        "El nombre o el símbolo se parece a STUBX y la dirección es otra. La coincidencia no dice quién lo hizo.",
        "The name or the symbol looks like STUBX and the address is different. The match does not say who did it.",
      ),
    });
  } else {
    signals.push({
      id: "registro",
      level: "neutro",
      title: loc("No es la dirección de STUBX del registro", "It is not the STUBX registry address"),
      explain: loc(
        "Este mint no está en el registro curado. Que no esté no significa que sea falso ni que sea una copia.",
        "This mint is not in the curated registry. That does not mean it is fake, and it does not mean it is a copy.",
      ),
    });
    if (likeness.signals.length > 0) {
      signals.push({
        id: "parecido",
        level: "atencion",
        title: loc("Hay un parecido con el registro", "There is a likeness with the registry"),
        explain: loc(
          "Un enlace u otro dato coincide con el registro y la dirección es otra. La coincidencia no dice quién lo hizo.",
          "A link or another fact matches the registry and the address is different. The match does not say who did it.",
        ),
      });
    }
  }
  const risky = signals.some((item) => item.level === "riesgo");
  const attention = signals.some((item) => item.level === "atencion");
  const headline = likeness.inRegistry
    ? {
        light: risky || attention ? ("atencion" as const) : ("ok" as const),
        lightLabel: loc("En el registro", "In the registry"),
        title: loc("Esta dirección es la del registro de STUBX", "This address is the one in the STUBX registry"),
        support: loc(
          "La lectura de ahora coincide con el mint curado. Las fichas fechadas siguen abajo, como foto anterior.",
          "This reading matches the curated mint. The dated cards remain below, as an earlier snapshot.",
        ),
      }
    : copyByName
      ? {
          light: "riesgo" as const,
          lightLabel: loc("Posible copia de STUBX", "Possible STUBX copy"),
          title: loc("Posible copia de STUBX", "Possible STUBX copy"),
          support: loc(
            "El nombre o el símbolo se parece a STUBX y la dirección es otra. Mira las señales, no solo el nombre.",
            "The name or the symbol looks like STUBX and the address is different. Read the signals, not only the name.",
          ),
        }
      : {
          light: risky || attention ? ("atencion" as const) : ("neutro" as const),
          lightLabel: loc(risky || attention ? "Hay señales" : "Sin esas señales", risky || attention ? "Signals found" : "Without those signals"),
          title: loc("Lectura de este token", "Reading for this token"),
          support: loc(
            "Cada señal describe un hecho leído ahora. No es una puntuación.",
            "Each signal describes a fact read just now. It is not a score.",
          ),
        };
  const displayName = names[0] || "Sin nombre en las fuentes leídas";
  const displaySymbol = symbols[0] || "Sin símbolo en las fuentes leídas";
  return {
    ok: true,
    kind: "lectura",
    mint,
    light: headline.light,
    lightLabel: headline.lightLabel,
    title: headline.title,
    support: headline.support,
    signals,
    rows: [
      { label: loc("Nombre", "Name"), value: loc(displayName, displayName) },
      { label: loc("Símbolo", "Symbol"), value: loc(displaySymbol, displaySymbol) },
      { label: loc("Programa", "Program"), value: loc(programName, programName) },
      {
        label: loc("Suministro", "Supply"),
        value: loc(formatUnits(decoded.supplyRaw, decoded.decimals), formatUnits(decoded.supplyRaw, decoded.decimals)),
      },
      { label: loc("Decimales", "Decimals"), value: loc(String(decoded.decimals), String(decoded.decimals)) },
      {
        label: loc("Servicio de lectura", "Read service"),
        value: loc(
          rpc.usedFallback ? `${hostOf(rpc.lastEndpoint) ?? "público"} · segundo servicio` : (hostOf(rpc.lastEndpoint) ?? "público"),
          rpc.usedFallback ? `${hostOf(rpc.lastEndpoint) ?? "public"} · second service` : (hostOf(rpc.lastEndpoint) ?? "public"),
        ),
      },
    ],
    endpointHost: hostOf(rpc.lastEndpoint),
    usedFallback: rpc.usedFallback,
    slot: slots.size === 1 ? [...slots][0] ?? packed.slot : packed.slot,
  };
}

function authoritySignal(kind: "emision" | "congelacion", authority: { state: string; address: string | null }): Signal {
  const minting = kind === "emision";
  if (authority.state === "revocada") {
    return {
      id: kind,
      level: "ok",
      title: loc(
        minting ? "Nadie puede crear más tokens con ese permiso" : "Nadie puede congelar cuentas con ese permiso",
        minting ? "Nobody can create more tokens with that permission" : "Nobody can freeze accounts with that permission",
      ),
      explain: loc(
        minting
          ? "La autoridad de emisión está revocada en esta lectura. Eso no demuestra que el proyecto sea legítimo."
          : "La autoridad de congelación está revocada en esta lectura. Otros límites del token pueden seguir existiendo.",
        minting
          ? "The mint authority is revoked in this reading. That does not show that the project is legitimate."
          : "The freeze authority is revoked in this reading. Other limits on the token can still exist.",
      ),
    };
  }
  if (authority.state === "activa") {
    return {
      id: kind,
      level: minting ? "atencion" : "riesgo",
      title: loc(
        minting ? "Alguien puede crear más tokens" : "Alguien puede congelar cuentas",
        minting ? "Someone can create more tokens" : "Someone can freeze accounts",
      ),
      explain: loc(
        minting
          ? `La autoridad de emisión sigue asignada a ${authority.address ?? "una dirección"}. Puede aumentar el suministro.`
          : `La autoridad de congelación sigue asignada a ${authority.address ?? "una dirección"}. Puede impedir que una cuenta mueva sus tokens.`,
        minting
          ? `The mint authority is still assigned to ${authority.address ?? "an address"}. It can increase the supply.`
          : `The freeze authority is still assigned to ${authority.address ?? "an address"}. It can stop an account from moving its tokens.`,
      ),
    };
  }
  return {
    id: kind,
    level: "atencion",
    title: loc(
      minting ? "La autoridad de emisión no se pudo leer" : "La autoridad de congelación no se pudo leer",
      minting ? "The mint authority could not be read" : "The freeze authority could not be read",
    ),
    explain: loc(
      "El campo no se decodifica. No se rellena como revocada.",
      "The field does not decode. It is not filled in as revoked.",
    ),
  };
}

function extensionSignals(extensions: readonly ExtensionReport[], parsed: boolean): Signal[] {
  if (!parsed) {
    return [
      {
        id: "extensiones",
        level: "atencion",
        title: loc("Extensiones no separadas", "Extensions not split"),
        explain: loc(
          "Los bytes extra del mint no se pudieron separar. No se afirma qué extensión falta.",
          "The extra mint bytes could not be split. This does not claim which extension is missing.",
        ),
      },
    ];
  }
  const out: Signal[] = [];
  for (const item of extensions) {
    const signal = oneExtension(item);
    if (signal) {
      out.push(signal);
    }
  }
  if (out.length === 0) {
    out.push({
      id: "extensiones",
      level: "neutro",
      title: loc("Sin extensiones de riesgo leídas", "No risk extensions read"),
      explain: loc(
        "No apareció comisión de transferencia, delegado permanente, gancho de transferencia ni estado inicial congelado. Que no aparezcan no cierra otros riesgos.",
        "No transfer fee, permanent delegate, transfer hook, or frozen default state appeared. Their absence does not close off other risks.",
      ),
    });
  }
  return out;
}

function oneExtension(item: ExtensionReport): Signal | null {
  if (item.type === 1) {
    return {
      id: "comision",
      level: "riesgo",
      title: loc("Comisión de transferencia", "Transfer fee"),
      explain: loc(
        `El mint puede quedarse una parte de cada envío. ${item.summary ?? "La cifra no se decodificó."}`,
        `The mint can keep part of each transfer. ${item.summary ?? "The figure did not decode."}`,
      ),
    };
  }
  if (item.type === 12) {
    const absent = /ausente/.test(item.summary ?? "");
    return {
      id: "delegado",
      level: absent ? "atencion" : "riesgo",
      title: loc("Delegado permanente", "Permanent delegate"),
      explain: loc(
        absent
          ? "La extensión está en el mint y la dirección leída está vacía. Conviene volver a leerla."
          : "Una dirección puede mover tokens desde otras cuentas. Eso no pide permiso a quien los tiene.",
        absent
          ? "The extension is on the mint and the address that was read is empty. It is worth reading again."
          : "An address can move tokens out of other accounts. That does not ask the account that holds them.",
      ),
    };
  }
  if (item.type === 14) {
    return {
      id: "gancho",
      level: "riesgo",
      title: loc("Gancho de transferencia", "Transfer hook"),
      explain: loc(
        "Un programa puede revisar cada envío y rechazarlo. La transferencia deja de ser solo del programa de tokens.",
        "A program can inspect each transfer and reject it. The transfer is no longer only the token program’s.",
      ),
    };
  }
  if (item.type === 6) {
    const frozen = /frozen/.test(item.summary ?? "");
    return {
      id: "estado-inicial",
      level: frozen ? "riesgo" : "neutro",
      title: loc(
        frozen ? "Las cuentas nuevas nacen congeladas" : "Estado inicial de las cuentas",
        frozen ? "New accounts start frozen" : "Initial account state",
      ),
      explain: loc(
        frozen
          ? "El estado por defecto es congelado. Una cuenta nueva puede no poder mover tokens hasta que alguien la descongele."
          : `Estado por defecto leído: ${item.summary ?? "sin detalle"}.`,
        frozen
          ? "The default state is frozen. A new account may be unable to move tokens until someone unfreezes it."
          : `Default state read: ${item.summary ?? "no detail"}.`,
      ),
    };
  }
  if (item.type === 9) {
    return {
      id: "no-transferible",
      level: "atencion",
      title: loc("Marcado como no transferible", "Marked non-transferable"),
      explain: loc(
        "El mint dice que los tokens no se transfieren. Esta lectura no prueba qué ocurre al intentarlo.",
        "The mint says the tokens do not transfer. This reading does not prove what happens if someone tries.",
      ),
    };
  }
  if (item.type === 3) {
    return {
      id: "cierre",
      level: "atencion",
      title: loc("Alguien puede cerrar el mint", "Someone can close the mint"),
      explain: loc(
        item.summary ?? "Hay una autoridad de cierre.",
        item.summary ?? "There is a close authority.",
      ),
    };
  }
  if (!item.supported) {
    return {
      id: `extension-${item.type}`,
      level: "atencion",
      title: loc(`Extensión no descrita (${item.name})`, `Undescribed extension (${item.name})`),
      explain: loc(
        "Hay una extensión que esta lectura no describe. No se da por ausente ni por inofensiva.",
        "There is an extension this reading does not describe. It is not treated as absent or as harmless.",
      ),
    };
  }
  return null;
}

function metadataSignals(
  tokenMeta: { updateAuthority: string | null; name: string; symbol: string; uri: string } | null,
  metaplex: { updateAuthority: string; name: string; symbol: string; uri: string; mutable: boolean | null } | null,
): Signal[] {
  if (!tokenMeta && !metaplex) {
    return [
      {
        id: "metadatos",
        level: "neutro",
        title: loc("Sin metadatos en las fuentes leídas", "No metadata in the sources read"),
        explain: loc(
          "No había cuenta Metaplex ni metadatos de Token-2022. El nombre puede vivir fuera de esta lectura.",
          "There was no Metaplex account and no Token-2022 metadata. The name may live outside this reading.",
        ),
      },
    ];
  }
  const out: Signal[] = [];
  const name = tokenMeta?.name || metaplex?.name || "";
  const symbol = tokenMeta?.symbol || metaplex?.symbol || "";
  const uri = tokenMeta?.uri || metaplex?.uri || "";
  out.push({
    id: "metadatos",
    level: "neutro",
    title: loc(name ? `Nombre: ${name}` : "Nombre no leído", name ? `Name: ${name}` : "Name not read"),
    explain: loc(
      `Símbolo: ${symbol || "no leído"}. URI: ${uri || "no leída"}. El nombre es un texto. La dirección es otra cosa.`,
      `Symbol: ${symbol || "not read"}. URI: ${uri || "not read"}. The name is text. The address is something else.`,
    ),
  });
  const update = tokenMeta?.updateAuthority || (metaplex ? metaplex.updateAuthority : null);
  const mutable = metaplex ? metaplex.mutable : tokenMeta?.updateAuthority ? true : null;
  const canChange = mutable === true || Boolean(tokenMeta?.updateAuthority);
  out.push({
    id: "mutable",
    level: canChange ? "atencion" : "ok",
    title: loc(
      canChange ? "El nombre se puede cambiar" : "El nombre no se puede cambiar en las fuentes leídas",
      canChange ? "The name can be changed" : "The name cannot be changed in the sources read",
    ),
    explain: loc(
      canChange
        ? `Hay quien puede actualizar los metadatos${update ? ` (${update})` : ""}. Un nombre de hoy puede no ser el de mañana.`
        : "En las fuentes leídas no queda autoridad de actualización, o isMutable es falso. Eso no demuestra legitimidad.",
      canChange
        ? `Someone can update the metadata${update ? ` (${update})` : ""}. Today’s name may not be tomorrow’s.`
        : "In the sources read there is no update authority left, or isMutable is false. That does not show legitimacy.",
    ),
  });
  if (tokenMeta && metaplex && (tokenMeta.name !== metaplex.name || tokenMeta.symbol !== metaplex.symbol)) {
    out.push({
      id: "metadatos-distintos",
      level: "atencion",
      title: loc("Las dos fuentes de metadatos no coinciden", "The two metadata sources do not match"),
      explain: loc(
        "El nombre o el símbolo de Token-2022 y el de Metaplex son distintos en esta lectura.",
        "The Token-2022 name or symbol and the Metaplex one differ in this reading.",
      ),
    });
  }
  return out;
}

async function accountSample(
  rpc: ChainReader,
  mint: string,
  program: string,
  curvePda: string,
  largest: RpcResult<{ address: string; amount: string; decimals: number }[]>,
  denominator: bigint | null,
): Promise<{ signal: Signal; failure: string | null; httpStatus: number | null }> {
  if (!largest.ok) {
    return { signal: emptySample(), failure: largest.error, httpStatus: largest.httpStatus };
  }
  const rows = largest.value.slice(0, 20);
  const curveAta = associatedTokenAddress(curvePda, mint, program);
  let owners = new Map<string, string | null>();
  if (rows.length > 0) {
    const packed = await rpc.getMultipleAccounts(rows.map((row) => row.address));
    if (packed.ok) {
      owners = new Map(
        rows.map((row, index) => {
          const account = packed.value[index] ?? null;
          const decoded = account ? readTokenAccount(account.data) : null;
          return [row.address, decoded?.owner ?? null];
        }),
      );
    }
  }
  const lines = rows.map((row) => {
    const amount = BigInt(row.amount);
    const percent = denominator === null ? null : percentTruncated(amount, denominator, 2);
    const technical = curveAta !== null && row.address === curveAta;
    const label = technical ? "cuenta de la curva" : "cuenta con tokens";
    return { address: row.address, percent, label, amount };
  });
  const listed = lines
    .map((row) => `${row.percent === null ? "sin %" : `${row.percent} %`} · ${row.label} · ${row.address}`)
    .join("\n");
  const nonTechnical = lines.filter((row) => row.label !== "cuenta de la curva");
  const top = nonTechnical.reduce<{ amount: bigint; percent: string | null } | null>((best, row) => {
    if (!best || row.amount > best.amount) {
      return { amount: row.amount, percent: row.percent };
    }
    return best;
  }, null);
  const high = top?.percent !== null && top?.percent !== undefined && Number(top.percent) >= 20;
  return {
    failure: null,
    httpStatus: null,
    signal: {
      id: "cuentas",
      level: high ? "atencion" : "neutro",
      title: loc("Cuentas con tokens", "Token accounts"),
      explain: loc(
        rows.length === 0
          ? "La muestra de las 20 cuentas con más tokens volvió vacía. No es un censo y no es concentración cero."
          : `Se leyeron ${rows.length} cuentas con tokens, como máximo 20. No es un censo ni un recuento de personas.${
              top?.percent ? ` La mayor cuenta que no es la de la curva tiene el ${top.percent} %.` : ""
            }\n${listed}`,
        rows.length === 0
          ? "The sample of the 20 largest token accounts came back empty. It is not a census and it is not zero concentration."
          : `${rows.length} token accounts were read, 20 at most. It is not a census and it is not a count of people.${
              top?.percent ? ` The largest account that is not the curve account has ${top.percent}%.` : ""
            }\n${listed}`,
      ),
    },
  };
}

function emptySample(): Signal {
  return {
    id: "cuentas",
    level: "atencion",
    title: loc("Cuentas con tokens", "Token accounts"),
    explain: loc(
      "No se pudo leer la muestra. No es una concentración de cero.",
      "The sample could not be read. It is not zero concentration.",
    ),
  };
}

function curveSignal(account: AccountInfo | null, curve: ReturnType<typeof decodeBondingCurve>): Signal {
  if (!account) {
    return {
      id: "curva",
      level: "neutro",
      title: loc("Sin curva de Pump.fun", "No Pump.fun curve"),
      explain: loc(
        "No hay cuenta en la dirección derivada de la curva. No se rellenan con cero la cantidad real ni la cantidad virtual.",
        "There is no account at the derived curve address. The real amount and the virtual amount are not filled in with zero.",
      ),
    };
  }
  if (!curve) {
    return {
      id: "curva",
      level: "neutro",
      title: loc("No es una curva de Pump.fun", "Not a Pump.fun curve"),
      explain: loc(
        "La dirección derivada tiene una cuenta cuyo propietario no es el programa de la curva, o los bytes no encajan. No se rellena con cero.",
        "The derived address has an account whose owner is not the curve program, or the bytes do not fit. It is not filled in with zero.",
      ),
    };
  }
  const real = curve.realTokenReserves.toString();
  const virtual = curve.virtualTokenReserves.toString();
  const progress = curve.progressPercent === null ? "" : ` Avance inferido de la curva clásica: ${curve.progressPercent} %.`;
  if (curve.complete) {
    return {
      id: "curva",
      level: "neutro",
      title: loc("La curva figura como completada", "The curve is marked complete"),
      explain: loc(
        `El campo complete es verdadero. Cantidad real de la curva: ${real}. Cantidad virtual de la curva: ${virtual}. Esta lectura no mira el mercado posterior.`,
        `The complete field is true. Real curve amount: ${real}. Virtual curve amount: ${virtual}. This reading does not look at the later market.`,
      ),
    };
  }
  return {
    id: "curva",
    level: "neutro",
    title: loc("Curva de Pump.fun abierta", "Pump.fun curve still open"),
    explain: loc(
      `La curva sigue abierta. Cantidad real de la curva: ${real}. Cantidad virtual de la curva: ${virtual}.${progress}`,
      `The curve is still open. Real curve amount: ${real}. Virtual curve amount: ${virtual}.${progress ? ` Inferred classic-curve progress: ${curve.progressPercent}%.` : ""}`,
    ),
  };
}
