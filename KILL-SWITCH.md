# Kill-switch

## Qué es

Un interruptor de nuestros procesos en este repositorio. El estado vive en [`state/killswitch.json`](state/killswitch.json).

Hoy el archivo comprometido está desactivado (`engaged: false`). Cambiarlo es un commit. El simulacro público automático es la fase P3 y **no** está hecho.

## Qué para

Si `engaged` es `true`, el orquestador no ejecuta acciones (`ppm:print`, `ppm:check`, `log:append`, `status`, `chain:read`, `killswitch:check`). Un borrador social válido se rechaza con el límite `no-publish-while-killed`.

## Qué no puede hacer

- No puede pausar transferencias de holders.
- No puede congelar cuentas.
- No puede confiscar saldos.
- No puede apagar Solana.

No hay efecto on-chain. El alcance es `ops-social`. Cualquier otro `scope` en el archivo hace que el agente no actúe.

## Fail-closed

Si el archivo no se puede leer, es un enlace simbólico, no es JSON o no tiene la forma exacta, **no se ejecuta ninguna acción**.

## Cómo se comprueba

`test/kill-switch.test.ts`.

Eso cubre el código de esta versión. No sustituye el simulacro público de la fase P3 ni marca la casilla del PPM.

## English

The kill-switch only stops this package. It reads `state/killswitch.json` and fails closed when that file cannot be read or parsed. It cannot pause holder transfers, freeze accounts, seize balances, or stop Solana. The public drill is phase P3 and has not run.
