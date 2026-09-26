# stubx-agent

Esqueleto público del agente de **STUBX** (`@stubx/agents`, v0.1.0).

> Prototipo. Memecoin experimental · puedes perderlo todo · no es consejo de inversión. El agente no tiene claves, no firma, no custodia y no envía transacciones.

[![killswitch-drill](https://github.com/stubxai/stubx-agent/actions/workflows/killswitch-drill.yml/badge.svg)](https://github.com/stubxai/stubx-agent/actions/workflows/killswitch-drill.yml)

Estado del último simulacro del kill-switch. Un simulacro en verde solo demuestra lo que ese simulacro comprueba, en esa versión del código. No marca ninguna casilla del PPM.

El mint público del token (Pump.fun) es `TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump`. Este programa no lo mueve.

El único repositorio oficial es [github.com/stubxai/stubx-agent](https://github.com/stubxai/stubx-agent). Compruébalo: tiene que estar enlazado desde la web oficial y desde [@stubxai](https://x.com/stubxai). La cuenta `github.com/stubx` es ajena y no representa a STUBX.

Canales oficiales: X [@stubxai](https://x.com/stubxai) · web https://superb-horse-9036f5.netlify.app/ · **stubxai.hq@gmail.com**.

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
| Kill-switch | Fail-closed cubierto por tests de este repositorio y simulacro semanal programado en Actions (ver historial) | No. Hacen falta al menos 2 simulacros públicos seguidos en verde y revisión |

Un test en verde solo demuestra lo que ese test comprueba, en esa versión del código. Lo mismo vale para el simulacro. No sustituye un enlace público de CI ni el OK legal. Nada aquí marca el PPM de la web.

## Cómo comprobarlo

Hace falta Node.js 22 o superior (`.nvmrc` fija 22.14.0).

```bash
npm ci
npm run typecheck
npm test
npm run ppm:print
npm run drill:killswitch
```

No hace falta red para los tests. No hace falta una clave.

`npm test` escribe `test-report.json` (no se versiona). `npm run scan:forbidden` recorre `src/`, `scripts/`, `policy/` y `state/` y sale con error si encuentra APIs de firma o de envío.

## Dónde ver la CI

En la pestaña **Actions** del repositorio, workflow `ci`:

`https://github.com/stubxai/stubx-agent/actions/workflows/ci.yml`

Se ejecuta en cada push, en cada pull request y los lunes a las 07:00 UTC, con Node 22.14.0 (la matriz del workflow y `.nvmrc`). Hace `npm ci`, typecheck, tests, `ppm:print`, `npm audit --audit-level=high` y un escaneo de secretos con el binario libre de gitleaks (historia completa). El artefacto `test-report` incluye el informe, la salida de `ppm:print` y `SHA256SUMS`.

En `main`, un job aparte genera la atestación de procedencia de ese informe (`id-token: write` y `attestations: write` solo en ese job). El resto del workflow usa `contents: read`.

El simulacro del kill-switch va en su propio workflow, `killswitch-drill`, programado los lunes a las 08:17 UTC y también manual con «Run workflow». Solo tiene permiso `contents: read`. Qué comprueba y dónde ver el informe: [KILL-SWITCH.md](KILL-SWITCH.md#simulacro-semanal).

CodeQL y OpenSSF Scorecard van en workflows distintos. No prometemos una nota de Scorecard.

El escáner de secretos es el binario de gitleaks publicado en GitHub, fijado por versión y checksum. No usamos el wrapper `gitleaks-action`: en repositorios de organización pide una licencia guardada como secreto, y esta CI no guarda secretos.

## Ajustes de GitHub que no van en el código

Según confirmó su propietario el 26-09-2026, la cuenta de GitHub `stubxai` tiene activada la verificación en dos pasos (2FA). Es un ajuste de la cuenta y no se puede comprobar desde fuera.

Pendiente de confirmar en el repositorio:

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

Public skeleton of the STUBX agent. Prototype. Experimental memecoin · you can lose everything · not investment advice. The agent holds no keys: it does not sign, custody, exchange, or send transactions.

Official channels: [x.com/stubxai](https://x.com/stubxai), https://superb-horse-9036f5.netlify.app/, stubxai.hq@gmail.com.

Verify with Node.js 22 or newer (`npm ci`, `npm run typecheck`, `npm test`, and `npm run ppm:print`). CI runs on Node 22.14.0, on push, pull request, and every Monday 07:00 UTC. Results are on the Actions tab of `github.com/stubxai/stubx-agent`. `github.com/stubx` is an unrelated account.

`ppm:print` keeps wallet and logs at `pending`. Limits and the kill-switch have tests in this repository, and a weekly kill-switch drill is scheduled on the Actions tab (see its history). No public PPM box is marked. The GitHub account `stubxai` has 2FA enabled, as confirmed by its owner on 2026-09-26 (not publicly verifiable). The kill-switch cannot pause holder transfers or freeze accounts. Public append-only logs are a later phase.
