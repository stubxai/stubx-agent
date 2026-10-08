# Fichas del 2026-10-08

Generadas con `npm run verify -- <mint> --out verify/examples/2026-10-08` contra `https://api.mainnet-beta.solana.com`. Cada archivo lleva la hora UTC y el slot de esa consulta. Una consulta posterior crea otro id.

| Mint | Archivos | Para qué está |
| --- | --- | --- |
| `TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump` | el mint oficial de STUBX | Registro curado, autoridades revocadas, curva de Pump.fun. |
| `Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf` | clon conocido | Tiene que salir con posible suplantación. |
| `DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ` | clon conocido | Tiene que salir con posible suplantación. |
| `3Zi6p6wzYZYKyuHdBhsDfb2pRR7XTfTfLKkXL7rwpump` | clon conocido | Tiene que salir con posible suplantación. |
| `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | USDC | Contraste: autoridades de emisión o de congelación activas. |

Si un archivo dice `Parcial: sí`, la lista de limitaciones nombra la llamada que falló. No se rellenó ese dato.

En esta tanda la RPC pública respondió HTTP 429 a `getTokenLargestAccounts` en los cinco mints («Too many requests for a specific RPC call»). La muestra de holders queda en no disponible. No se interpreta como concentración cero y no se inventó ninguna cuenta.

En los tres clones, `real_token_reserves` coincide con la reserva real inicial documentada de la curva clásica (`793100000000000`). El avance inferido sale `0.00` porque la resta es cero, no porque faltara la cuenta. En STUBX el mismo cálculo, con la reserva leída, sale `1.74`.

USDC no tiene curva de Pump.fun. En la PDA derivada hay una cuenta del programa del sistema, de datos vacíos. La ficha lo deja como «no es una curva» y no rellena reservas.
