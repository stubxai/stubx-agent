# Changelog

## 0.1.0 — 2026-09-26

Primera publicación del esqueleto público (fases P1 y P2).

- Paquete `@stubx/agents` con licencia MIT. Sin dependencias de ejecución.
- Dispatcher con lista cerrada de acciones. Un nombre de firma o de envío se rechaza aunque alguien lo añada a la lista.
- Límites v1 en `policy/limits.json`, aplicados en código y cubiertos por tests negativos.
- Kill-switch fail-closed sobre `state/killswitch.json` (alcance `ops-social`).
- Huella sha256 usada en el formato de entrada de log. La cadena pública de solo-añadir queda para P4.
- `npm run ppm:print` imprime el estado honesto de las cuatro casillas. Wallet y logs siguen `pending`. Ninguna casilla se marca como PPM público.
- CI: typecheck, tests, `ppm:print`, `npm audit`, gitleaks (binario libre) y, en workflows aparte, CodeQL y OpenSSF Scorecard.
