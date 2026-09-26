# Modelo de amenazas (público)

Protegemos la confianza en lo que este repositorio dice, la identidad oficial (@stubxai, el mint público, el correo stubxai.hq@gmail.com) y el límite de no afirmar lo que los tests de esta versión no demuestran.

Fuera de alcance: el token en sí, Pump.fun, el comportamiento de terceros.

| Id | Amenaza | Control en este repositorio |
| --- | --- | --- |
| T1 | Filtrar un secreto | Historia nueva, `.gitignore`, sin secretos de CI, gitleaks sobre la historia en cada ejecución. El agente no usa claves. |
| T2 | Afirmar de más | `ppm:print` no marca casillas. Wallet y logs quedan `pending`. Los textos dicen «en este repositorio, esta versión». |
| T3 | Suplantar el repo | El único repo oficial es `github.com/stubxai/stubx-agent`, que tiene que estar enlazado desde la web (https://superb-horse-9036f5.netlify.app/) y desde [@stubxai](https://x.com/stubxai); si no lo está, no lo des por oficial. `github.com/stubx` es una cuenta ajena. |
| T4 | Cadena de suministro | Cero dependencias de ejecución. `npm ci` con lockfile. Actions fijadas por SHA. Dependabot. CodeQL y Scorecard en workflows aparte. |
| T5 | CI manipulada | En `ci.yml`, `permissions: contents: read`, salvo el job de atestación. CodeQL y Scorecard piden además `security-events: write` (Scorecard, también `id-token: write`) para subir sus resultados. Sin `pull_request_target`. Sin secretos propios. |
| T6 | Logs alterados | No aplica todavía. La cadena pública es P4. Hoy `verifyChain()` no dice que todo esté bien. |
| T7 | Log incompleto | Limitación declarada. No hay log público que pueda estar incompleto. |
| T8 | Malinterpretar el kill-switch | Texto fijo: no pausa transferencias ni congela cuentas. El módulo no tiene capacidad on-chain. |
| T9 | El agente gana capacidad de firma | Lista cerrada, rechazo aunque el nombre peligroso se añada a la lista, y test que falla si `src/` referencia APIs de firma o envío. |
| T10 | Toma de la cuenta de GitHub | 2FA de la cuenta oficial `stubxai`: activada, según confirmó el propietario el 26-09-2026 (no verificable desde fuera). No se resuelve con código de este repo. |

Los rulesets de `main` (PR, checks, sin force-push) son un ajuste de GitHub. Este árbol no puede activarlos.

## English

This repository is the public skeleton of an agent that cannot sign or hold keys. Do not treat a green local test as a marked PPM box. Append-only public logs are a later phase. The weekly kill-switch drill is scheduled on the Actions tab (see its history); the PPM box stays unmarked until at least two consecutive green public drills have been reviewed.
