# Ficha STUBX Verify

> STUBX Verify muestra datos on-chain públicos. No es consejo de inversión ni garantiza que un token sea seguro.

- Id: `2c5de795c4aab2014c94dd6ed2fbda4564256b5e00c6fe929f1b7392639393b0`
- Reglas: `0.1.0`
- Red: `mainnet-beta`
- RPC: `https://api.mainnet-beta.solana.com`
- Mint: `Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf`
- Creada (UTC): 2026-10-08T07:41:49.581Z
- Slot de referencia: 454480545
- Parcial: sí
- Mint soportado: sí

Esta exportación no se actualiza sola. Una consulta nueva crea otro id.

## Hallazgos

- **ok** · Autoridad de emisión revocada. La opción del mint está en 0. Eso quita ese permiso concreto. No es una auditoría ni una recomendación. Que no haya autoridad de congelación reduce ese permiso concreto; no demuestra que el proyecto sea legítimo.
- **ok** · Autoridad de congelación revocada. La opción del mint está en 0. Eso quita ese permiso concreto. No es una auditoría ni una recomendación. Que no haya autoridad de congelación reduce ese permiso concreto; no demuestra que el proyecto sea legítimo.
- **ok** · Metadatos no mutables en las fuentes leídas. La autoridad de actualización está ausente o is_mutable es falso. No es una auditoría ni una recomendación. Que no haya autoridad de congelación reduce ese permiso concreto; no demuestra que el proyecto sea legítimo.
- **riesgo** · Posible suplantación. Posible suplantación: el nombre, el símbolo, la imagen o un enlace coinciden con un token del registro curado, pero el mint es otro. La coincidencia no atribuye intención.
- **atención** · Muestra de holders no disponible. No hubo lista de cuentas. No se interpreta como concentración cero.

## Identidad

### Programa propietario

TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local..

### Estándar

token-2022. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local..

### Decimales

6 decimales. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: Suministro leído de los bytes del mint (u64 little-endian en el offset 36). Coincide con getTokenSupply (amount, no uiAmount).

### Suministro (unidades mínimas)

1000000000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: Suministro leído de los bytes del mint (u64 little-endian en el offset 36). Coincide con getTokenSupply (amount, no uiAmount).

### Suministro

1000000000 tokens. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: Calculado con enteros a partir de las unidades mínimas. No se usa uiAmount.

### Nombre on-chain

Comunidad STUBX · Creador. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local..

### Símbolo on-chain

COMUNIDAD. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local..

### URI

https://ipfs.io/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local..

### Nombre en el JSON

Comunidad STUBX · Creador. Estado: verificado. Fuente: GET · slot — · 2026-10-08T07:41:54.803Z · URI on-chain https://ipfs.io/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX. Contenido leído en https://gateway.pinata.cloud/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX..

### Símbolo en el JSON

COMUNIDAD. Estado: verificado. Fuente: GET · slot — · 2026-10-08T07:41:54.803Z · URI on-chain https://ipfs.io/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX. Contenido leído en https://gateway.pinata.cloud/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX..

### Imagen

https://ipfs.io/ipfs/QmUxrUgqFvkof7k3k8eeMzJmuzkn9tre8apC6nGBrhbux9. Estado: verificado. Fuente: GET · slot — · 2026-10-08T07:41:54.803Z · URI on-chain https://ipfs.io/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX. Contenido leído en https://gateway.pinata.cloud/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX..

### sha256 de la imagen

9ef886251ee90b504d8888f012efd159668e9f5ed1e7f22b01a2c8593d3a2d97 sha256. Estado: verificado. Fuente: GET · slot — · 2026-10-08T07:42:01.741Z · https://gateway.pinata.cloud/ipfs/QmUxrUgqFvkof7k3k8eeMzJmuzkn9tre8apC6nGBrhbux9.

### Web

https://stubxai.com/canales. Estado: verificado. Fuente: GET · slot — · 2026-10-08T07:41:54.803Z · URI on-chain https://ipfs.io/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX. Contenido leído en https://gateway.pinata.cloud/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX..

### Red social

https://x.com/CreadorSTUBX. Estado: verificado. Fuente: GET · slot — · 2026-10-08T07:41:54.803Z · URI on-chain https://ipfs.io/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX. Contenido leído en https://gateway.pinata.cloud/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX..

### Telegram

—. Estado: verificado. Fuente: GET · slot — · 2026-10-08T07:41:54.803Z · URI on-chain https://ipfs.io/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX. Contenido leído en https://gateway.pinata.cloud/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX.. Nota: El JSON no trae este campo.

### Descripción (texto del JSON, no de Verify)

Creador de STUBX y tengo STUBX. Cuenta personal, no oficial (oficial: @stubxai). Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.. Estado: verificado. Fuente: GET · slot — · 2026-10-08T07:41:54.803Z · URI on-chain https://ipfs.io/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX. Contenido leído en https://gateway.pinata.cloud/ipfs/QmfTwvyBnNG6DP7ji7r3YVwVunqa2gJVB2AQMGhjufJtcX..


## Permisos

### Autoridad de emisión

{&quot;state&quot;:&quot;revocada&quot;,&quot;address&quot;:null}. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: COption: 0 revocada, 1 activa. Otro valor no se trata como revocada.

### Autoridad de congelación

{&quot;state&quot;:&quot;revocada&quot;,&quot;address&quot;:null}. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: COption: 0 revocada, 1 activa. Otro valor no se trata como revocada.

### Update authority (Metaplex)

—. Estado: verificado. Fuente: getAccountInfo · cuenta AyD61xJQswYesnnYchjou9u9SHWZZKWEQvtj1QSC3NoG · slot 454480548 · 2026-10-08T07:41:50.382Z · PDA Metaplex: semillas metadata, programa de metadatos y mint.. Nota: No hay cuenta de metadatos de Metaplex en la PDA derivada.

### Metadatos Metaplex mutables

—. Estado: no_aplica. Fuente: getAccountInfo · cuenta AyD61xJQswYesnnYchjou9u9SHWZZKWEQvtj1QSC3NoG · slot 454480548 · 2026-10-08T07:41:50.382Z · PDA Metaplex: semillas metadata, programa de metadatos y mint.. Nota: No hay cuenta Metaplex.

### Update authority (Token-2022)

—. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: 32 bytes a cero: no hay autoridad de actualización en la extensión TokenMetadata.

### Extensiones

[{&quot;type&quot;:18,&quot;name&quot;:&quot;MetadataPointer&quot;,&quot;supported&quot;:true,&quot;decoded&quot;:true,&quot;summary&quot;:&quot;autoridad ausente; metadatos en Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf&quot;},{&quot;type&quot;:19,&quot;name&quot;:&quot;TokenMetadata&quot;,&quot;supported&quot;:true,&quot;decoded&quot;:true,&quot;summary&quot;:&quot;nombre Comunidad STUBX · Creador; símbolo COMUNIDAD; autoridad ausente&quot;}]. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: TLV a partir del byte 166 (relleno hasta 165, tipo de cuenta en 165). Una extensión que no sale en la lista no está en la cuenta.


## Distribución

### Denominador

1000000000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot 454480546 · 2026-10-08T07:41:49.982Z · Cuenta del mint, encoding base64, decodificada en local.. Nota: Denominador común de los porcentajes.

### Muestra de mayores cuentas

—. Estado: no_disponible. Fuente: getTokenLargestAccounts · cuenta Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf · slot — · 2026-10-08T07:41:53.218Z · HTTP 429. Nota: Sin respuesta utilizable. No se interpreta como autoridad revocada, como inmutabilidad ni como reserva cero.

### Mayor cuenta sin etiqueta técnica

—. Estado: no_disponible. Nota: Sin respuesta utilizable. No se interpreta como autoridad revocada, como inmutabilidad ni como reserva cero.


## Mercado

### Módulo

pump-bonding-curve. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Cuenta con el discriminador público de BondingCurve.

### PDA de la curva

EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun..

### Cuenta de curva presente

true. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun..

### complete

false. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun..

### Reserva virtual de tokens

1073000000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Reserva virtual de tokens, separada de la reserva real.

### Reserva virtual quote

30000000016 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Unidades mínimas de la reserva quote. En la curva clásica de Pump.fun, y cuando quote_mint es la pubkey por defecto, esa reserva son lamports.

### Reserva real de tokens

793100000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Reserva real de tokens, separada de la virtual.

### Reserva real quote

16 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Unidades mínimas de la reserva quote. En la curva clásica de Pump.fun, y cuando quote_mint es la pubkey por defecto, esa reserva son lamports.

### Suministro en la cuenta de la curva

1000000000000000 unidades mínimas. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: token_total_supply de la cuenta de la curva.

### Creator de la cuenta

8zWTcPwDkHWQqeDE8GkjPdWJ3zbK8HtCa5XsMUPaT61q. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Pubkey guardada en la cuenta. No identifica a una persona.

### Mint quote

11111111111111111111111111111111. Estado: verificado. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: 32 bytes a cero: pubkey por defecto. El IDL público de Pump.fun usa ese valor cuando la quote es SOL, no un mint SPL.

### Avance de la curva clásica

0.00 porcentaje. Estado: inferido. Fuente: getAccountInfo · cuenta EHmEvvEkH8S5twjbmdabDdH9vUQLkbAyqhJyUwe3SVmf · slot 454480549 · 2026-10-08T07:41:50.782Z · PDA derivada con las semillas bonding-curve y el mint, programa Pump.fun.. Nota: Porcentaje inferido con la reserva real inicial pública de la curva clásica (793100000000000). Truncado a 2 decimales hacia cero.


## Autenticidad

### En el registro curado

false. Estado: verificado. Fuente: local · slot — · 2026-10-08T07:41:49.581Z · Registro curado verify/registry/canonical.json. Nota: Comparación local. No consulta una red para decidir el registro.

### Id del registro

—. Estado: no_aplica. Fuente: local · slot — · 2026-10-08T07:41:49.581Z · Registro curado..

### Señales

[&quot;nombre «Comunidad STUBX · Creador» incluye STUBX/STUBX&quot;,&quot;enlace «https://stubxai.com/canales» coincide con un enlace u host del registro&quot;]. Estado: verificado. Fuente: local · slot — · 2026-10-08T07:41:49.581Z · Nombre, símbolo, imagen y enlaces frente al registro..

### Lectura

Posible suplantación: el nombre, el símbolo, la imagen o un enlace coinciden con un token del registro curado, pero el mint es otro. La coincidencia no atribuye intención.. Estado: inferido. Fuente: local · slot — · 2026-10-08T07:41:49.581Z · Regla de autenticidad de rulesVersion..


## Limitaciones

- No es una auditoría ni una recomendación. Que no haya autoridad de congelación reduce ese permiso concreto; no demuestra que el proyecto sea legítimo.
- La muestra de holders tiene como máximo 20 cuentas. No es un censo ni un recuento de personas. Una cuenta puede ser un custodio.
- Si los slots de las consultas no coinciden, no es una instantánea atómica.
- STUBX Verify no firma, no envía transacciones y no custodia claves.
- Cada consulta nueva produce un id nuevo. Esta ficha no se actualiza sola.
- Slots observados: 454480545, 454480546, 454480548, 454480549, 454480551.
- getTokenLargestAccounts: HTTP 429

## Cómo reproducir un campo

Cada campo de arriba lleva método, cuenta, slot y hora. Para repetir una lectura de cuenta:

```
curl https://api.mainnet-beta.solana.com -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf",{"encoding":"base64","commitment":"confirmed"}]}'
```

El detalle de offsets y de la curva está en `verify/README.md`.
