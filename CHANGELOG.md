# Changelog

## 2026-10-09 · Revisión de seguridad de Verify y Lab (borrador, sin publicar)

- El service worker queda en `/lab/sw.js`, con red primero, y no guarda la portada ni páginas de avisos. El índice de borrador pasa a `indice-borrador.html`.
- El registro de ejemplos de clones añade ERYyy y FMNb. No es una lista completa. La revisión del 09-10 no trae direcciones EVM, así que no se inventan.
- El detector pliega mayúsculas, NFKC y homoglifos, y marca variantes del nombre y dominios parecidos, incluida la URL de Netlify.
- Si la muestra de holders recibe 429, se leen las cuentas de la curva y de la creadora sin llamarlas censo. La CLI no descarga URIs de creadores fuera de pasarelas IPFS o Arweave. `redactEndpoint` no escribe claves de la ruta. Hay `_headers` solo para las rutas nuevas.
- El modo sin «No publicado» ni `noindex` exige `STUBX_PUBLISH=1` y `--publish`. No está activado.
- `.gitleaksignore` ignora solo las huellas de cuentas públicas de token en las fichas del 2026-10-09 (tres de los ejemplos y dos de la ficha oficial releída). Una semilla bajo `tokenAccount` en otro archivo sigue detectándose. El relleno `\0` de Metaplex se recorta y no se muestra como «�».
- La lista de ejemplos EVM añade dos direcciones de search-v2 de Pump.fun del 08-10 09:14, sin verificar en la cadena. Cualquier dirección `0x` dice que el STUBX oficial solo existe en Solana y, si coincide, que es una copia conocida.
- El detector también marca «S.T.U.B.X», «5TUBX», versalitas y handles `x.com/stubxai_` con sufijo. La ficha oficial y la de USDC se releyeron el 2026-10-09.

## 2026-10-09 · STUBX Lab, misión 1 (borrador, sin publicar)

- `lab/`: misión estática «Cómo detectar un token clon en 5 comprobaciones», sobre las fichas de Verify del 2026-10-08. Progreso solo en el navegador. Glosario y tres guías en español, con inglés pendiente de revisión humana.
- `site-drafts/`: páginas `/verify`, `/lab` y `/tablero` generadas, autocontenidas y sin publicar. No sustituyen la web existente.
- Pruebas sin red en `lab/test/`. `npm test` las incluye. `npm run lab:build` regenera los HTML.
- `/verify` comprueba una dirección pegada contra esas fichas, con semáforo y detalles plegados. Si la dirección no es válida o la lectura no está, lo dice en claro y no inventa un resultado. La misión pasa a 5 pasos con preguntas cortas.

## 2026-10-08 · STUBX Verify (MVP, solo lectura)

- Carpeta nueva `verify/`: CLI `verify <mint> [--format json|md|html] [--out dir]`. Componente aparte del agente. El agente sigue sin contactar la red principal ni ningún RPC, y el PPM no cambia (3 marcadas · 1 no aplica).
- Lee datos públicos de mainnet-beta (RPC por defecto `https://api.mainnet-beta.solana.com`, sustituible con `RPC_URL`), con reintentos, retroceso y pausa. No firma, no envía y no custodia. `npm run verify:scan` falla si aparece ese código.
- Ficha en JSON, Markdown y HTML estático, con fuente por campo. Pruebas sin red en `verify/test/`. Fichas de ejemplo del 2026-10-08 en `verify/examples/2026-10-08/`.
- Cómo reproducir cada dato: [verify/README.md](verify/README.md).

## 2026-10-05 · PPM: casilla Wallet → no aplica

- `ppm:print` pasa `wallet` a `status: "not-applicable"` (`notApplicableOn: 2026-10-05`, `ppmMarked: false`). Motivo: el agente no tiene wallet ni claves por diseño (decisión del creador). La wallet pública del proyecto (SOL) no cuenta para marcar esta casilla.
- Contadores: `ppmMarkedCount: 3`, `ppmTotal: 4`, `ppmNotApplicableCount: 1`. No es un PPM «cerrado» ni un 3/3.
- `ppm:check`, tests y el paso de CI comprueban `not-applicable` (nunca `badge`/estado de marcada).
- Docs: README tabla de casillas y párrafo EN.

## 2026-10-05 · PPM: casilla Logs marcada

- `ppm:print` marca también `logs` (`ppmMarked: true`, `markedOn: 2026-10-05`) con la ejecución pública del workflow `daily-log` del 05-10 (https://github.com/stubxai/stubx-agent/actions/runs/37274282121). `wallet` sigue `pending`. `approved` sigue en `false`. `ppmMarkedCount: 3`.
- Condiciones cumplidas: ≥7 días UTC distintos en `main` (10 a 05-10), sello OpenTimestamps confirmado en Bitcoin (ancla `2026-09-26-000001`, bloque 968752) comprobado a mano con los pasos de [LOGS.md](LOGS.md) (PR #5 / H5), y OK legal.
- Marcada no significa que el log registre todo ni que lo anotado sea cierto. Bitcoin/OpenTimestamps solo son registro de tiempo; no respaldan STUBX.
- `ppm:check` y la CI aceptan las tres casillas marcadas (logs, límites y kill-switch), cada una con un enlace a una ejecución de Actions de este repositorio.
- El paso de la CI pasa a «PPM marks logs, limits and kill-switch, with public runs».

## Sin publicar

Casillas del PPM «Límites» y «Kill-switch» (05-10-2026).

- `ppm:print` marca `limits` y `killSwitch` (`ppmMarked: true`, `markedOn: 2026-10-05`) con sus enlaces públicos: la CI del 05-10 y los simulacros del 26-09, 28-09 y 05-10. `wallet` y `logs` seguían `pending` en ese commit. `approved` sigue en `false`.
- `ppm:check` (y la CI) solo aceptaban esas dos casillas marcadas, cada una con un enlace a una ejecución de Actions de este repositorio, y `ppmMarkedCount` igual al número de casillas marcadas.
- El paso de la CI «PPM stays unmarked» pasa a «PPM marks only limits and kill-switch, with public runs» (luego ampliado a logs; ver entrada de arriba).
- KILL-SWITCH.md, LIMITS.md, README y THREAT-MODEL: textos al día. Marcada no significa auditada; una ejecución en rojo la desmarca.

P5 (28-09-2026): documentación y `logs:status`.

- README y THREAT-MODEL: según confirmó su propietario el 28-09-2026, la cuenta de X @stubxai tiene activada la 2FA con app de autenticación (no verificable desde fuera). El apartado del README pasa a llamarse «Ajustes de cuentas que no van en el código».
- `npm run logs:status` (28-09-2026): resumen de solo lectura que cuenta los días UTC distintos con entradas del workflow y dice si ya llegan a 7. No marca la casilla (siempre `box: "pending"`). Tests en `test/logs-status.test.ts`.
- Nota fija del log (`DAILY_NOTE`), resumen de Actions y LOGS.md: distinguen el agente de este repositorio (no publica en redes sociales) de los posts de @stubxai, que prepara y publica otro agente de IA fuera de este repositorio a partir de textos aprobados. Las entradas anteriores no se reescriben.
- LIMITS: «No tiene valor» pasa a «STUBX no tiene valor intrínseco ni da derechos, y su precio puede llegar a cero», con el pie de riesgo.

Fase P4: log público de solo añadir.

- `logs/agent-log.jsonl`: una entrada diaria encadenada por hash (estado del kill-switch, resultado del simulacro, commit y enlace a la ejecución). Modo `prototipo`: el agente no hace acciones con efecto fuera de este repositorio.
- Workflow `daily-log` (programado cada día a las 06:23 UTC y manual). `contents: write` solo en el job que hace el commit, solo en `main` y solo dentro de `logs/`.
- Anclas en `logs/anchors/` selladas con OpenTimestamps (gratis, sin wallet). Cliente fijado por versión y sha256 en `.github/ots-requirements.txt`.
- `npm run logs:verify` y `logs:check-update` (solo añadir). La CI verifica el log y falla si un cambio edita o borra líneas existentes.
- Tests en `test/public-log.test.ts`.
- CI: la ejecución programada semanal pasa de las 07:00 a las 07:11 UTC (cron `11 7 * * 1`). El README lo describe así.
- KILL-SWITCH.md declara la excepción: el registro diario sigue escribiéndose con el interruptor activado o ilegible, solo para anotar ese estado.
- La casilla «Logs» del PPM sigue `pending`.

Fase P3: simulacro del kill-switch.

- Workflow `killswitch-drill` (programado los lunes a las 08:17 UTC y manual), con permiso `contents: read` y acciones fijadas por SHA.
- `npm run drill:killswitch`: sin llamadas de red, en una copia temporal del estado activa el kill-switch, comprueba que todas las acciones permitidas se rechazan, comprueba el fail-closed con el archivo borrado o corrupto y comprueba que al desactivarlo todo vuelve. Escribe `drill-report.json` y `drill-report.md`.
- Tests del simulacro en `test/drill.test.ts`.
- README y THREAT-MODEL: según confirmó su propietario el 26-09-2026, la cuenta de GitHub `stubxai` tiene activada la 2FA (no verificable desde fuera).
- La casilla «Kill-switch» del PPM sigue sin marcar hasta tener al menos 2 simulacros públicos seguidos en verde y revisión.

## 0.1.0 — 2026-09-26

Primera publicación del esqueleto público (fases P1 y P2).

- Paquete `@stubx/agents` con licencia MIT. Sin dependencias de ejecución.
- Dispatcher con lista cerrada de acciones. Un nombre de firma o de envío se rechaza aunque alguien lo añada a la lista.
- Límites v1 en `policy/limits.json`, aplicados en código y cubiertos por tests negativos.
- Kill-switch fail-closed sobre `state/killswitch.json` (alcance `ops-social`).
- Huella sha256 usada en el formato de entrada de log. La cadena pública de solo-añadir queda para P4.
- `npm run ppm:print` imprime el estado honesto de las cuatro casillas. Wallet y logs siguen `pending`. Ninguna casilla se marca como PPM público.
- CI: typecheck, tests, `ppm:print`, `npm audit`, gitleaks (binario libre) y, en workflows aparte, CodeQL y OpenSSF Scorecard.
