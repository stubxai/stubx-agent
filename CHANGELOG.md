# Changelog

## Sin publicar

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
