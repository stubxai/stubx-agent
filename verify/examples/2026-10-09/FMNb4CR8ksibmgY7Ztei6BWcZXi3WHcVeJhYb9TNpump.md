# Ficha STUBX Verify

> STUBX Verify muestra datos on-chain públicos. No es consejo de inversión ni garantiza que un token sea seguro.

- Id: `d0fdaab557d36d442f688e25a71bbc54b3d61b5fffa2bf26c2a02ba1eb7a9c86`
- Reglas: `0.1.0`
- Red: `mainnet-beta`
- RPC: `https://api.mainnet-beta.solana.com`
- Mint: `FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump`
- Creada (UTC): 2026-10-09T16:16:39.440Z
- Slot de referencia: 454922310
- Parcial: sí
- Mint soportado: sí

Esta exportación no se actualiza sola. Una consulta nueva crea otro id.

## Hallazgos

- **ok** · Autoridad de emisión revocada. La opción del mint está en 0. Eso quita ese permiso concreto. No es una auditoría ni una recomendación. Que no haya autoridad de congelación reduce ese permiso concreto; no demuestra que el proyecto sea legítimo.
- **ok** · Autoridad de congelación revocada. La opción del mint está en 0. Eso quita ese permiso concreto. No es una auditoría ni una recomendación. Que no haya autoridad de congelación reduce ese permiso concreto; no demuestra que el proyecto sea legítimo.
- **ok** · Metadatos no mutables en las fuentes leídas. La autoridad de actualización está ausente o is_mutable es falso. No es una auditoría ni una recomendación. Que no haya autoridad de congelación reduce ese permiso concreto; no demuestra que el proyecto sea legítimo.
- **riesgo** · Posible suplantación. Posible suplantación: el nombre, el símbolo, la imagen o un enlace coinciden con un token del registro curado, pero el mint es otro. La coincidencia no atribuye intención.
- **ok** · Muestra de holders leída. La mayor cuenta de la muestra sin etiqueta técnica representa el 0.0000% del suministro verificado. Umbral informativo: 20%. No es un censo ni un recuento de personas.

## Identidad

### Programa propietario

TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local..

### Estándar

token-2022. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local..

### Decimales

6 decimales. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: Suministro leído de los bytes del mint (u64 little-endian en el offset 36). Coincide con getTokenSupply (amount, no uiAmount).

### Suministro (unidades mínimas)

1000000000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: Suministro leído de los bytes del mint (u64 little-endian en el offset 36). Coincide con getTokenSupply (amount, no uiAmount).

### Suministro

1000000000 tokens. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: Calculado con enteros a partir de las unidades mínimas. No se usa uiAmount.

### Nombre on-chain

STUBX. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local..

### Símbolo on-chain

STUBX. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local..

### URI

https://ipfs.io/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local..

### Nombre en el JSON

STUBX. Estado: verificado. Fuente: GET · slot — · 2026-10-09T16:16:46.823Z · URI on-chain https://ipfs.io/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q. Contenido leído en https://gateway.pinata.cloud/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q..

### Símbolo en el JSON

STUBX. Estado: verificado. Fuente: GET · slot — · 2026-10-09T16:16:46.823Z · URI on-chain https://ipfs.io/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q. Contenido leído en https://gateway.pinata.cloud/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q..

### Imagen

https://ipfs.io/ipfs/bafkreiahbo5tdgm6b7j25lc7csjjufonmesstd2yb32fpckkwo2gm2x25q. Estado: verificado. Fuente: GET · slot — · 2026-10-09T16:16:46.823Z · URI on-chain https://ipfs.io/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q. Contenido leído en https://gateway.pinata.cloud/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q..

### sha256 de la imagen

070bbb31999e0fd3aeac5f14929a15cd6125298f580ef457894ab3b4666afaec sha256. Estado: verificado. Fuente: GET · slot — · 2026-10-09T16:16:53.589Z · https://gateway.pinata.cloud/ipfs/bafkreiahbo5tdgm6b7j25lc7csjjufonmesstd2yb32fpckkwo2gm2x25q.

### Web

https://superb-horse-9036f5.netlify.app. Estado: verificado. Fuente: GET · slot — · 2026-10-09T16:16:46.823Z · URI on-chain https://ipfs.io/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q. Contenido leído en https://gateway.pinata.cloud/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q..

### Red social

https://x.com/Stubxai. Estado: verificado. Fuente: GET · slot — · 2026-10-09T16:16:46.823Z · URI on-chain https://ipfs.io/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q. Contenido leído en https://gateway.pinata.cloud/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q..

### Telegram

—. Estado: verificado. Fuente: GET · slot — · 2026-10-09T16:16:46.823Z · URI on-chain https://ipfs.io/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q. Contenido leído en https://gateway.pinata.cloud/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q.. Nota: El JSON no trae este campo.

### Descripción (texto del JSON, no de Verify)

STUBX on Solana. The meme that asks AI agents for proof. Join the community. Build the story. No stub, no story. Estado: verificado. Fuente: GET · slot — · 2026-10-09T16:16:46.823Z · URI on-chain https://ipfs.io/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q. Contenido leído en https://gateway.pinata.cloud/ipfs/bafkreiatjneeiugb4m6d7bcbmuxjuaoaftb4v4yzw3vv2ytzdgq67eta3q..


## Permisos

### Autoridad de emisión

{&quot;state&quot;:&quot;revocada&quot;,&quot;address&quot;:null}. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: COption: 0 revocada, 1 activa. Otro valor no se trata como revocada.

### Autoridad de congelación

{&quot;state&quot;:&quot;revocada&quot;,&quot;address&quot;:null}. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: COption: 0 revocada, 1 activa. Otro valor no se trata como revocada.

### Update authority (Metaplex)

—. Estado: verificado. Fuente: getAccountInfo · cuenta GYNwUbSTCAThLCUq9F8k87ka6psen8BK4ABbiPu4MzXj · slot 454922312 · 2026-10-09T16:16:40.241Z · PDA Metaplex: semillas metadata, programa de metadatos y mint.. Nota: No hay cuenta de metadatos de Metaplex en la PDA derivada.

### Metadatos Metaplex mutables

—. Estado: no_aplica. Fuente: getAccountInfo · cuenta GYNwUbSTCAThLCUq9F8k87ka6psen8BK4ABbiPu4MzXj · slot 454922312 · 2026-10-09T16:16:40.241Z · PDA Metaplex: semillas metadata, programa de metadatos y mint.. Nota: No hay cuenta Metaplex.

### Update authority (Token-2022)

—. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: 32 bytes a cero: no hay autoridad de actualización en la extensión TokenMetadata.

### Extensiones

[{&quot;type&quot;:18,&quot;name&quot;:&quot;MetadataPointer&quot;,&quot;supported&quot;:true,&quot;decoded&quot;:true,&quot;summary&quot;:&quot;autoridad ausente; metadatos en FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump&quot;},{&quot;type&quot;:19,&quot;name&quot;:&quot;TokenMetadata&quot;,&quot;supported&quot;:true,&quot;decoded&quot;:true,&quot;summary&quot;:&quot;nombre STUBX; símbolo STUBX; autoridad ausente&quot;}]. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: TLV a partir del byte 166 (relleno hasta 165, tipo de cuenta en 165). Una extensión que no sale en la lista no está en la cuenta.


## Distribución

### Denominador

1000000000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922311 · 2026-10-09T16:16:39.840Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: Denominador común de los porcentajes.

### Muestra de mayores cuentas

[{&quot;tokenAccount&quot;:&quot;AvKqiEggvnpewDJG6aZoog8ffLtyCGEoe4sks3rGXX5w&quot;,&quot;owner&quot;:&quot;29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh&quot;,&quot;amountRaw&quot;:&quot;1000000000000000&quot;,&quot;percent&quot;:&quot;100.0000&quot;,&quot;label&quot;:&quot;cuenta de la curva, saldo leído; no es un censo&quot;}]. Estado: verificado. Fuente: getMultipleAccounts · cuenta FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump · slot 454922336 · 2026-10-09T16:16:45.060Z · ATA de la curva y, si la curva trae creadora, ATA de la creadora. No sustituye a getTokenLargestAccounts ni es un censo.. Nota: Saldos leídos de la curva y de la creadora. El resto respecto al suministro es 0.0000 %. No es un censo de holders.

### Mayor cuenta sin etiqueta técnica

—. Estado: no_disponible. Nota: No se calcula un máximo fuera de la muestra: solo hay saldos de la curva y de la creadora, no un censo.


## Mercado

### Módulo

pump-bonding-curve. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Cuenta con el discriminador público de BondingCurve.

### PDA de la curva

29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun..

### Cuenta de curva presente

true. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun..

### complete

false. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun..

### Reserva virtual de tokens

1073000000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Reserva virtual de tokens, separada de la reserva real.

### Reserva virtual quote

30000000001 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Unidades mínimas de la reserva quote. En la curva clásica de Pump.fun, y cuando quote_mint es la pubkey por defecto, esa reserva son lamports.

### Reserva real de tokens

793100000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Reserva real de tokens, separada de la virtual.

### Reserva real quote

1 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Unidades mínimas de la reserva quote. En la curva clásica de Pump.fun, y cuando quote_mint es la pubkey por defecto, esa reserva son lamports.

### Suministro en la cuenta de la curva

1000000000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: token_total_supply de la cuenta de la curva.

### Creator de la cuenta

3KhCByAF8e4mfcuHeLS51dEsUfwHQexhRoEW9m18XvT7. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Pubkey guardada en la cuenta. No identifica a una persona.

### Mint quote

11111111111111111111111111111111. Estado: verificado. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: 32 bytes a cero: pubkey por defecto. El IDL público de Pump.fun usa ese valor cuando la quote es SOL, no un mint SPL.

### Avance de la curva clásica

0.00 porcentaje. Estado: inferido. Fuente: getAccountInfo · cuenta 29sEjuDddwrHk9iGHsT9cjBo2dkdDGspcqJuBGaX8NFh · slot 454922315 · 2026-10-09T16:16:40.641Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Porcentaje inferido con la reserva real inicial pública de la curva clásica (793100000000000). Truncado a 2 decimales hacia cero.


## Autenticidad

### En el registro curado

false. Estado: verificado. Fuente: local · slot — · 2026-10-09T16:16:39.440Z · Registro curado verify/registry/canonical.json. Nota: Comparación local. No consulta una red para decidir el registro.

### Id del registro

—. Estado: no_aplica. Fuente: local · slot — · 2026-10-09T16:16:39.440Z · Registro curado..

### Señales

[&quot;nombre «STUBX» incluye STUBX/STUBX&quot;,&quot;símbolo «STUBX» incluye STUBX/STUBX&quot;,&quot;enlace «https://superb-horse-9036f5.netlify.app» coincide con un enlace u host del registro&quot;]. Estado: verificado. Fuente: local · slot — · 2026-10-09T16:16:39.440Z · Nombre, símbolo, imagen y enlaces frente al registro..

### Lectura

Posible suplantación: el nombre, el símbolo, la imagen o un enlace coinciden con un token del registro curado, pero el mint es otro. La coincidencia no atribuye intención.. Estado: inferido. Fuente: local · slot — · 2026-10-09T16:16:39.440Z · Regla de autenticidad de rulesVersion..


## Limitaciones

- No es una auditoría ni una recomendación. Que no haya autoridad de congelación reduce ese permiso concreto; no demuestra que el proyecto sea legítimo.
- La muestra de holders tiene como máximo 20 cuentas. No es un censo ni un recuento de personas. Una cuenta puede ser un custodio.
- Si los slots de las consultas no coinciden, no es una instantánea atómica.
- STUBX Verify no firma, no envía transacciones y no custodia claves.
- Cada consulta nueva produce un id nuevo. Esta ficha no se actualiza sola.
- Slots observados: 454922310, 454922311, 454922312, 454922315, 454922317, 454922336.
- getTokenLargestAccounts: HTTP 429

## Cómo reproducir un campo

Cada campo de arriba lleva método, cuenta, slot y hora. Para repetir una lectura de cuenta:

```
curl https://api.mainnet-beta.solana.com -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump",{"encoding":"base64","commitment":"confirmed"}]}'
```

El detalle de offsets y de la curva está en `verify/README.md`.
