# Módulos de la web v2

Una sola web estática. Verify, Lab y el tablero no son sitios aparte: el generador `tools/build_site.py` mete su `<main>` dentro de la misma cabecera, el mismo mapa, el mismo selector ES/EN y el mismo pie.

## Qué está vivo en esta copia

| Pieza | Dónde | Qué hace ahora |
| --- | --- | --- |
| Cascarón | `assets/shell.js`, `assets/site.css` | Idioma (`stubx-lab-lang`), títulos, copiar solo la CA oficial, menú. El service worker solo se registra en `/lab/`. |
| Verify en el navegador | `assets/verify.js` | Bundle de la PR 14, commit `86df576`. Pega una dirección y pinta el semáforo con las fichas del 2026-10-09 y las anteriores. La ficha oficial incluye la cuenta personal publicada y el resto 0,0000 %. |
| Misma regla, importable | `modules/verify/lookup.mjs` | Salida de `tsc` sobre `lab/verify/lookup.ts`, sin source map. Lo usan las pruebas. No llama a la red. Responde a direcciones `0x`. |
| Fichas | `modules/verify/cards.json` | Las fichas de `loadCards`, con textos de presentación añadidos (`statement_en`, `holdersNote_en` y las notas de la curva) sin cambiar los nombres de la API, más los ejemplos EVM. `snapshot.json` dice que el commit está en esta rama (`merged`) y que no hay lectura en vivo. `merged` no significa fusionado en main ni publicado. |
| Lab | `assets/mission.js` + `modules/lab/` | Misión de cinco pasos, glosario y tres guías. El progreso se queda en el navegador. |
| Tablero | `modules/tablero/registros.json` | Registro del 2026-10-09, envuelto en el mismo cascarón. |
| Huecos | `/studio`, `/cuaderno`, `/contribuir` | Texto fechado «No construido · 2026-10-09». Sin formulario ni botones de crear, guardar, exportar o enviar. |

`/avances` no es un segundo tablero: explica que el tablero está en `/tablero`.

## Cuando la PR 14 se fusione

1. `lab/` y `site-drafts/` ya están en esta rama, por el merge de `feat/lab-mision-1` (`86df576`).
2. `node web/v2/tools/bundle-from-lab.mjs` regenera `verify.js`, `mission.js`, `lookup.mjs`, `cards.json`, la misión, el tablero y `snapshot.json` desde ese árbol. Si `lab/` no está, sale con error. No inventa un build.
3. Volver a ejecutar `python3 web/v2/tools/build_site.py`.
4. `snapshot.json` `merged` significa que el commit citado es ancestro de esta rama. No significa que la PR 14 esté en main ni que la web esté publicada. El aviso de demo sigue visible.

Una lectura en vivo (consultar la red al pegar una dirección) no entra con solo fusionar la PR. Haría falta una fuente con fecha, un fallo explícito si no responde, y la bandera de publicación (`STUBX_PUBLISH=1` y `--publish`, la misma de la PR 14). Esta copia no la tiene: `liveNetwork` es falso.

## Huecos que un módulo futuro debe cumplir

Studio, el cuaderno y las contribuciones, cuando existan, entran igual que Verify:

- Su HTML es un `<main>` que `build_site.py` envuelve. No traen su propia cabecera ni su propio selector.
- Usan las variables de `assets/tool.css` y lo que añada `assets/site-extra.css`.
- El idioma sale de `html[data-lang]` y de la clave `stubx-lab-lang`. Cada frase visible tiene par ES/EN. Las direcciones no se traducen.
- En móvil usan la misma navegación. No hay un layout distinto.
- Si el módulo no sabe hacer algo, la página lo dice con fecha. No se dibuja un control que no haga nada.
- Nada de service worker que cachee la portada o los avisos.
- CSP: solo `'self'`. Sin CDN.
