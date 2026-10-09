# Módulos de la web v2

Una sola web estática. Verify, Lab y el tablero no son sitios aparte: el generador `tools/build_site.py` mete su `<main>` dentro de la misma cabecera, el mismo mapa, el mismo selector ES/EN y el mismo pie.

## Qué está vivo en esta copia

| Pieza | Dónde | Qué hace ahora |
| --- | --- | --- |
| Cascarón | `assets/shell.js`, `assets/site.css` | Idioma (`stubx-lab-lang`), títulos, copiar solo la CA oficial, menú. El service worker solo se registra en `/lab/`. |
| Verify en el navegador | `assets/verify.js` | Bundle de la PR 14, commit `635a1ed`. Pega una dirección y pinta el semáforo con las fichas del 2026-10-09 y las anteriores. |
| Misma regla, importable | `modules/verify/lookup.mjs` | Puerto ESM de `lab/verify/lookup.ts`. Lo usan las pruebas. No llama a la red. Responde a direcciones `0x`. |
| Fichas | `modules/verify/cards.json` | Siete fichas y dos ejemplos EVM. `snapshot.json` dice que no están fusionadas y que no hay lectura en vivo. |
| Lab | `assets/mission.js` + `modules/lab/` | Misión de cinco pasos, glosario y tres guías. El progreso se queda en el navegador. |
| Tablero | `modules/tablero/registros.json` | Registro del 2026-10-09, envuelto en el mismo cascarón. |
| Huecos | `/studio`, `/cuaderno`, `/contribuir` | Texto fechado «No construido · 2026-10-09». Sin formulario ni botones de crear, guardar, exportar o enviar. |

`/avances` no es un segundo tablero: explica que el tablero está en `/tablero`.

## Cuando la PR 14 se fusione

1. `lab/` y `site-drafts/assets/{verify,mission}.js` quedan en esta rama.
2. `node web/v2/tools/bundle-from-lab.mjs` copia esos bundles. Si `lab/` no está, deja la instantánea `635a1ed` y sale bien. No inventa un build.
3. Volver a ejecutar `python3 web/v2/tools/build_site.py`.
4. Poner `snapshot.json` `merged` en verdadero solo cuando la fusión sea un hecho, y fechar las fichas nuevas. Hasta entonces el aviso de demo sigue visible.

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
