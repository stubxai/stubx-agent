# Medición de uso

Decisión del 2026-10-09. Vale para la web, para Verify y para Lab.

## Decisión

**No medimos el uso en el cliente.** No hay baliza, no hay cookie, no hay script de un tercero, no se guarda la IP y no se activa Cloudflare Web Analytics.

Tampoco hay un contador agregado en el servidor. Cualquier petición de «suma uno» llega a quien aloje la página (hoy, Cloudflare) con la dirección IP de quien visita, aunque el programa no la escriba en una base de datos. Eso ya es un dato personal en el registro del alojamiento. Por eso no se añade.

## Qué sí se puede mirar

Solo tres cifras que GitHub ya enseña en la página pública del repositorio, sin que esta web las pida:

- estrellas
- forks
- watchers (suscriptores públicos)

No son visitas a stubxai.com. No identifican a quien abre la web. No se descargan con la API de tráfico de GitHub (clones, vistas, referentes): esa API no es pública y se acerca más a un registro de visitas.

Nadie tiene que ejecutar un script para verlas. Están en `https://github.com/stubxai/stubx-agent`.

## Qué queda fuera

| Opción | Por qué no |
| --- | --- |
| Cloudflare Web Analytics | La baliza es de un tercero y el panel ve la visita. Hay que dejarla apagada en el panel de la zona. Este repositorio no la inserta. |
| Contador propio, aunque no guarde la IP | La petición sigue llevando la IP al alojamiento. |
| Cookie o `localStorage` para contar sesiones | Identifica el navegador. El idioma y el progreso de Lab, si se usan, se quedan en el navegador y no se envían. |
| Script en la página que pregunte a GitHub | Enviaría la IP del visitante a GitHub. |

## Cómo se comprueba

`src/metrics-policy.ts` fija la decisión en código. `npm test` recorre el HTML, el CSS y el JavaScript de `web/v2/`, `web/current/` y `site-drafts/` y falla si aparece una baliza, una cookie o un contador. No añade ninguna medición.

## English

Decision of 2026-10-09. It applies to the website, to Verify, and to Lab.

**There is no client-side measurement.** No beacon, no cookie, no third-party script, no stored IP address, and no Cloudflare Web Analytics.

There is also no aggregated server counter. Any “add one” request reaches the host (today, Cloudflare) with the visitor’s IP address, even if the program never writes that address down. That is already personal data in the host’s log. So it is not added.

The only figures that may be looked at are the three GitHub already shows on the public repository page, without this website asking for them: stars, forks, and watchers. They are not visits to stubxai.com. They do not identify who opens the website. The GitHub traffic API (clones, views, referrers) is not used: it is not public and it is closer to a visit log. No script has to run. The figures are on `https://github.com/stubxai/stubx-agent`.

Cloudflare Web Analytics stays off in the zone dashboard. This repository does not insert it. A first-party counter is refused because the request still carries the IP to the host. A cookie or a storage key used to count sessions would identify the browser. Language and Lab progress, when used, stay in the browser and are not sent. A page script that called GitHub would send the visitor’s IP to GitHub.

`src/metrics-policy.ts` records the decision. `npm test` walks the HTML, CSS, and JavaScript under `web/v2/`, `web/current/`, and `site-drafts/` and fails if a beacon, a cookie, or a counter shows up. It does not add any measurement.
