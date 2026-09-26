# stubx-agent

Esqueleto público del agente de **STUBX** (`@stubx/agents`, v0.1.0).

> Prototipo. Sin valor. No es asesoramiento financiero. El agente no tiene claves, no firma, no custodia y no envía transacciones.

El mint público del token (Pump.fun) es `TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump`. Este programa no lo mueve.

Cuando se publique, el único repositorio oficial previsto es [github.com/stubxai/stubx-agent](https://github.com/stubxai/stubx-agent). Tiene que estar enlazado desde la web oficial y desde @stubxai. La cuenta `github.com/stubx` es ajena y no representa a STUBX.

Identidad de contacto: **@stubxai** / **stubxai.hq@gmail.com**.

## Qué puede hacer

Solo estas acciones, y solo si el kill-switch se lee bien y está apagado:

| Acción | Qué hace aquí |
| --- | --- |
| `ppm:print` | Imprime el estado honesto de las cuatro casillas. |
| `ppm:check` | Comprueba que ese informe no marca casillas de más. |
| `log:append` | Deja un borrador o una nota **en memoria**, con huella sha256. No lo publica. |
| `status` | Resume versión, acciones permitidas y kill-switch. |
| `killswitch:check` | Lee el interruptor. No tiene efecto on-chain. |
| `chain:read` | Lee el mint guardado en `state/public-mint.json`. No llama a ninguna red. |

Cualquier otro nombre se rechaza. Un nombre de firma, custodia, intercambio o envío se rechaza **aunque** alguien lo meta en la lista.

## Qué no puede hacer

- No tiene wallet ni claves. No firma. No custodia. No intercambia tokens. No envía transacciones.
- No contacta la red principal ni ningún RPC.
- No pide activos. No inventa direcciones. No promete resultados.
- No guarda secretos.
- El kill-switch no pausa transferencias de holders, no congela cuentas, no confisca saldos y no apaga Solana.

El detalle está en [LIMITS.md](LIMITS.md) y en [KILL-SWITCH.md](KILL-SWITCH.md).

## Estado de las cuatro casillas

`npm run ppm:print` imprime el JSON. Hoy:

| Casilla | Estado en este repo | ¿Casilla pública marcada? |
| --- | --- | --- |
| Wallet | `pending` | No |
| Logs | `pending` | No |
| Límites | Tests de este repositorio (`repo-tested`) | No |
| Kill-switch | Fail-closed cubierto por tests de este repositorio | No. El simulacro público es la fase P3 |

Un test en verde demuestra este código, en esta versión. No sustituye un enlace público de CI ni el OK legal. Nada aquí marca el PPM de la web.

## Cómo comprobarlo

Hace falta Node.js 20 o superior (`.nvmrc` fija 22.14.0).

```bash
npm ci
npm run typecheck
npm test
npm run ppm:print
```

No hace falta red para los tests. No hace falta una clave.

`npm test` escribe `test-report.json` (no se versiona). `npm run scan:forbidden` recorre `src/`, `scripts/`, `policy/` y `state/` y sale con error si encuentra APIs de firma o de envío.

## Dónde ver la CI

En la pestaña **Actions** del repositorio, workflow `ci`:

`https://github.com/stubxai/stubx-agent/actions/workflows/ci.yml`

Se ejecuta en cada push, en cada pull request y los lunes a las 07:00 UTC. Hace `npm ci`, typecheck, tests, `ppm:print`, `npm audit --audit-level=high` y un escaneo de secretos con el binario libre de gitleaks (historia completa). El artefacto `test-report` incluye el informe, la salida de `ppm:print` y `SHA256SUMS`.

En `main`, un job aparte genera la atestación de procedencia de ese informe (`id-token: write` y `attestations: write` solo en ese job). El resto del workflow usa `contents: read`.

CodeQL y OpenSSF Scorecard van en workflows distintos. No prometemos una nota de Scorecard.

El escáner de secretos es el binario de gitleaks publicado en GitHub, fijado por versión y checksum. No usamos el wrapper `gitleaks-action`: en una cuenta de organización ese wrapper pide una licencia guardada como secreto, y esta CI no guarda secretos.

## Ajustes de GitHub que no van en el código

Quien publique el repo todavía tiene que activar, en la cuenta y en el repositorio:

- 2FA.
- Secret scanning y push protection (gratis en repos públicos).
- Ruleset en `main`: pull request, checks obligatorios, sin force-push y sin borrado.

## Mapa

| Ruta | Para qué |
| --- | --- |
| `src/` | Agente. Sin red y sin claves. |
| `policy/limits.json` | Límites v1, versión máquina. |
| `state/killswitch.json` | Interruptor. Fail-closed si no se puede leer. |
| `state/public-mint.json` | Mint público, solo lectura local. |
| `test/` | Tests. El fixture `test/fixtures/` no es parte del agente. |
| `LIMITS.md`, `KILL-SWITCH.md`, `LOGS.md`, `SECURITY.md`, `THREAT-MODEL.md` | Política y alcance. |

Licencia MIT. Copyright 2026 STUBX. Ver [LICENSE](LICENSE).

Informes de seguridad: [SECURITY.md](SECURITY.md). No hay recompensa económica.

## English

Public skeleton of the STUBX agent. Prototype. No value. Not financial advice. The agent holds no keys: it does not sign, custody, exchange, or send transactions.

Verify with `npm ci`, `npm run typecheck`, `npm test`, and `npm run ppm:print`. CI runs on push, pull request, and every Monday 07:00 UTC. Results will show on the Actions tab of `github.com/stubxai/stubx-agent` once that repository exists. `github.com/stubx` is an unrelated account.

`ppm:print` keeps wallet and logs at `pending`. Limits and the kill-switch have tests in this repository. No public PPM box is marked. The kill-switch cannot pause holder transfers or freeze accounts. Public append-only logs are a later phase.
