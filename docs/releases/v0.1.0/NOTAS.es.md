# STUBX 0.1.0

Fecha de estas notas: 2026-10-09. El número del paquete `@stubx/agents` es `0.1.0`. El tag `v0.1.0` está descrito en [TAG.md](TAG.md) y no está creado.

Esto no es una auditoría ni un consejo de inversión. Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.

## Qué puedes hacer hoy, en este repositorio

Cuatro piezas, todas de lectura o de aprendizaje. Ninguna pide una cartera, una semilla ni un pago.

1. **El agente** (`src/`). Lista cerrada de acciones. No tiene claves, no firma, no custodia y no envía transacciones. No llama a la red principal.
2. **Verify**. Comprueba datos públicos de un mint y deja una ficha con fecha y fuente. En la web, la demo usa fichas ya guardadas: no consulta la red al abrir la página.
3. **Lab**. Una misión corta para practicar la diferencia entre el nombre de un token y su dirección. El progreso se queda en el navegador.
4. **La web v2**. Las mismas páginas, en español y en inglés, con la misma navegación. La web v2 se desplegó en stubxai.com el 2026-10-09, fuera de estas notas. Estas notas no la despliegan ni la cambian.

## Verify

- Carpeta `verify/`. El comando lee datos públicos si alguien lo ejecuta a propósito. Métodos de lectura en lista cerrada. Si un dato no llega, la ficha lo deja en no disponible: no inventa un cero ni una autoridad revocada.
- Ejemplos fechados en `verify/examples/2026-10-08/` y `verify/examples/2026-10-09/`. La ficha oficial del mint de STUBX está releída el 2026-10-09.
- En `web/v2/verify/` se pega una dirección y se compara con esas fichas. Si la dirección no es válida, o no está en la lista, la página lo dice. La lista no es un censo.

Una ficha no dice si un token es bueno, seguro o una buena compra.

## Lab

- Misión 1 en `lab/` y en `web/v2/lab/`: cinco pasos, preguntas cortas, botón para seguir (no avanza solo) y opción de empezar de nuevo.
- Glosario y tres guías: identificar el token, interpretar permisos y comprender la curva. El inglés de esa biblioteca está escrito y pendiente de revisión humana. Si una frase no coincide, manda el español.
- Los puntos son progreso local. No valen dinero y no son un certificado.

## Web v2

- Vive en `web/v2/`. Portada, Verify, Lab, tablero, metodología, seguridad, riesgos, legal, pruebas, estado, reparto, canales, marca, versiones, aprender y el archivo de posts.
- El cambio de idioma está en la cabecera. El pie legal es el mismo en todas las páginas de `web/v2/`. La web v2 se desplegó en stubxai.com el 2026-10-09, fuera de estas notas. Estas notas no la despliegan ni la cambian.
- Studio, el cuaderno y contribuir se ven, y dicen que no están construidos. No hay un botón que finja guardarlos o enviarlos.
- La copia recuperable de lo que ya estaba publicado sigue en `web/current/`.

## Indexación

Hecho el 2026-10-09:

- `web/v2/robots.txt` deja rastrear el sitio y señala `https://stubxai.com/sitemap.xml`. Pide a los rastreadores de entrenamiento de IA nombrados en ese archivo que no usen el contenido.
- `web/v2/sitemap.xml` enumera las URLs públicas, con fecha `lastmod`.
- Las páginas públicas de `web/v2/` no llevan `noindex`. Sí lo llevan, con `X-Robots-Tag`, el service worker de Lab, los JSON, el manifiesto, la página 404 y `/studio/`.
- `web/current/` sigue con `noindex`. La web v2 se desplegó en stubxai.com el 2026-10-09, fuera de estas notas. Estas notas no la despliegan ni la cambian.

## Lo que esta versión no hace

- No crea el tag.
- No fusiona nada por sí sola y no despliega.
- No conecta carteras.
- Este repositorio no inserta medición de visitas ni cookies. Cloudflare Web Analytics debe estar apagado en el panel de la zona (sin baliza en el HTML servido el 2026-10-10).

El detalle de cada cambio fechado está en [CHANGELOG.md](../../../CHANGELOG.md).
