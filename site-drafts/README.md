# Borradores de páginas

Estas páginas no están publicadas. Cuando haya autorización se pueden copiar a stubxai.com sin sustituir las páginas que ya existen: las rutas nuevas son `/verify`, `/lab` y `/tablero`.

No usan CDN ni fuentes externas. El CSS y el JavaScript viven en `assets/` y el service worker en `sw.js`, para que una CSP `default-src 'self'` pueda servirlos. No hay analítica, cuentas ni firma.

Cada HTML lo genera `npm run lab:build`. Si se edita a mano, `npm test` falla.

El aviso de cada página es fijo: «Herramienta educativa con datos públicos. No es consejo de inversión. Cripto de alto riesgo · Puedes perderlo todo.» Las fichas son del 2026-10-08. Lo desconocido no es lo mismo que lo comprobado.
