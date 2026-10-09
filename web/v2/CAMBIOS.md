# Cambios de la web v2

Vista previa del 2026-10-09. No está publicada en stubxai.com. La copia recuperable de producción (despliegue `8f5a214b`) está en `web/current/`.

## Mapa

| Producción (una sola página larga o un HTML suelto) | Vista previa |
| --- | --- |
| `/` (`index.html`) | `/` Portada. Acción principal: Analizar token → `/verify`. |
| Ancla `#verificar` y el texto de cómo comparar la CA | `/verify` Demo con las fichas reales del 2026-10-08. |
| No existía | `/lab` Misión de cinco pasos de la PR 14. |
| No existía | `/tablero` Registro de construcción del 2026-10-09. |
| No existía | `/avances` Alias: el tablero no se duplica. |
| Ancla `#metodologia` | `/methodology` |
| `canales.html` y ancla `#canales` | `/security` Contrato, canales, aviso de clones del 2026-10-05, `security.txt`. |
| `riesgos.html` y ancla `#riesgos` | `/risks` Aviso largo, con la frase MiCA. |
| Avisos legales repartidos en el pie y en riesgos | `/legal` Misma frase MiCA, privacidad y contacto. El aviso largo se repite aquí. |
| `pruebas.html` y ancla `#pruebas` | `/proofs` Siete pruebas fechadas. |
| `archivo.html` y `docs.html` | `/proofs#archivo` El texto íntegro de los 18 posts sigue en `web/current/archivo.html`. |
| Ancla `#estado` | `/status` PPM: 3 de 4 marcadas; wallet no aplica. Fecha 2026-10-05. |
| Ancla `#reparto` | `/tokenomics` Suministro a 2026-10-03 14:19 (Madrid). |
| Ancla de comunidad, dentro de canales | `/community` Los mismos canales. Sin Discord. |
| `marca.html` | `/marca` Personaje, logo 3D y logo on-chain. |
| Ancla `#versiones` | `/build` Hecho con fecha y objetivos. No es el tablero. |
| No existía | `/aprender` Glosario y tres guías de la PR 14. |
| No existía | `/studio`, `/cuaderno`, `/contribuir` Huecos. «No construido · 2026-10-09». |
| `404.html` | `404.html` |
| `token.json` | `token.json` Copia byte a byte. |

`_redirects` deja preparados, y sin activar en producción, los saltos `canales` → `/security`, `riesgos` → `/risks`, `pruebas` → `/proofs`, `marca` → `/marca`, `archivo` y `docs` → `/proofs#archivo`.

## Qué se movió o se unió

- Canales, contrato y aviso de clones pasan a `/security`. `/community` no repite el aviso legal: enlaza.
- Riesgos y la frase MiCA del art. 7.1.e viven en `/risks` y en `/legal`. La portada solo deja el resumen y el enlace. El pie repite la frase MiCA en las dos lenguas.
- El archivo de posts no se ha reescrito. `/proofs#archivo` apunta a la copia de producción y da el SHA-256 de la copia del 2026-10-03 11:21 (Madrid): `654f8b25a72bae9d80c83ba3b3aa16ef16a1a531c450fce17d1d806342706897`.
- Verify, Lab y el tablero entran en el mismo cascarón (ver `modules/README.md`). No son enlaces a otra web.
- Studio, cuaderno y contribuciones no se simulan.

## Textos

Las direcciones, los canales y los avisos dicen lo mismo en español y en inglés. El inglés de la frase MiCA es traducción de la frase española publicada; no es otro instrumento. El inglés de la biblioteca de Lab sigue pendiente de revisión humana: si no coincide, manda el español.

| Dónde | Antes (producción, 2026-10-05) | Ahora |
| --- | --- | --- |
| Portada, titular | «Un meme que pide pruebas.» | «Contrasta la dirección antes de creer el nombre.» |
| Portada, acción principal | «Ver las pruebas» hacia `#pruebas` | «Analizar token» hacia `/verify`, con la fecha de las fichas. |
| Portada, riesgos | Una línea y un enlace al ensayo de la misma página | Dos frases y enlace a `/risks`. El ensayo no se ha acortado allí. |
| Versiones | «Cerrar la revisión de la PPM» seguía en objetivos aunque el texto ya decía que el 2026-10-05 estaban marcadas Logs, Límites y Kill-switch, y wallet no aplica | Ese punto pasa a «Hecho», con los mismos hechos y la misma fecha. El resto de objetivos no cambia. |
| Verify, Lab, tablero | No estaban en la web | Interfaz real de la PR 14 (commit `4161ee6`, 2026-10-09 15:54:12Z). Aviso visible: fichas del 2026-10-08, sin red, PR sin fusionar. |
| Studio, cuaderno, contribuir | No estaban | «No construido · 2026-10-09». Sin controles. |

No se han inventado cifras. Suministro, PPM, pruebas y avisos conservan la fecha de la fuente que ya estaba publicada. Esta vista previa no ha vuelto a consultar GitHub ni la red.

CA oficial, sin traducir: `TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump`.

Canales, sin traducir: `@stubxai`, `github.com/stubxai/stubx-agent`, `stubxai.hq@gmail.com`, `t.me/stubxai`, Farcaster `stubxai`, TikTok `@stubxai`. No hay Discord. `github.com/stubx` no es este proyecto.

## Cómo se deshace

1. No desplegar `web/v2/`. stubxai.com sigue siendo el HTML que está en producción.
2. La copia para recuperar ese HTML es `web/current/`.
3. Cerrar o revertir esta pull request deja `main` como estaba. No hay cambio de DNS, de Pages ni de la rama `feat/lab-mision-1`.
