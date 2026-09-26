# Logs

## Qué hay hoy

No hay registro público. La casilla de logs del PPM sigue `pending`.

Sí hay un tipo de entrada, `LogEntry`, con:

- fecha UTC
- actor fijo `stubx-agent`
- acción y detalle
- `contentSha256` (sha256 del contenido)
- `prevHash` (enlace con la entrada anterior, solo en memoria)
- `hash` de esos campos
- `chain: "stub-until-p4"`

`fingerprint()` usa SHA-256 de Node. Los tests comprueban el digest conocido de `abc`.

Las entradas viven en memoria y se pierden al salir. `log:append` no publica en ningún sitio (`published: false`, `persisted: false`, `network: false`).

`verifyChain()` responde siempre `ok: false` y `phase: "P4"`. No afirma que la cadena sea válida ni completa.

## Qué será P4

- `logs/agent-log.jsonl` de solo-añadir.
- `npm run logs:verify` en CI.
- Rechazo de cualquier edición que no sea añadir al final.
- Ancla gratuita (OpenTimestamps) y atestación.
- `LOGS.md` dirá qué se anota y qué no. Una cadena demuestra que lo publicado no se ha cambiado; no demuestra que se haya anotado todo.

## English

Public append-only logs are phase P4 and are not claimed. This version only defines a sha256 log entry and keeps it in memory. `verifyChain()` does not report success.
