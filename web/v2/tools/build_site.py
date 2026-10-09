#!/usr/bin/env python3
"""Genera la vista previa web/v2. No publica nada."""

from __future__ import annotations

import html
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
CA = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump"
CREATOR = "77RKUqMprQHDSkhFBpC1REU1kE9aM1uw189orHo7wypD"
PERSONAL = "2fS12sTD4TNEEE9MoCEt19brV41UjGdAnaNaxWcmiWvX"
PROJECT = "GtYJuVhP1Xk5BWY7YXXwiwGFEknPqzyxzwpotfQZoutA"
CURVE = "3shQFExQ3rpFL6GaXPRQNTMYazVHmTvRfuazfv62toAE"
MICA_ES = (
    "Esta comunicación publicitaria de criptoactivos no ha sido revisada ni aprobada "
    "por ninguna autoridad competente de ningún Estado miembro de la Unión Europea. "
    "El oferente del criptoactivo es el único responsable del contenido de esta "
    "comunicación publicitaria de criptoactivos."
)
MICA_EN = (
    "This crypto-asset marketing communication has not been reviewed or approved by "
    "any competent authority in any Member State of the European Union. The offeror "
    "of the crypto-asset is solely responsible for the content of this crypto-asset "
    "marketing communication."
)
RISK_ES = (
    "STUBX es un criptoactivo experimental de alto riesgo. No tiene valor garantizado, "
    "no da derechos de ningún tipo (propiedad, voto, dividendos, reembolso ni reparto "
    "de ingresos) y no se promete ninguna rentabilidad. Puede perder todo su valor: "
    "puedes perder todo lo que aportes. Hoy (comprobado el 2026-10-03) STUBX se negocia "
    "en la curva de Pump.fun: el propio contrato compra y vende sin necesitar a otra "
    "persona, pero cada venta baja el precio y las ventas grandes reciben peor precio. "
    "Si el precio cae, vender puede devolverte muy poco o casi nada. Si el token completa "
    "la curva, pasa de forma automática e irreversible a un fondo de liquidez de PumpSwap, "
    "con otras comisiones y el mismo riesgo de caída. Pump.fun o la red Solana pueden "
    "fallar, saturarse o limitar el acceso según el país, así que no siempre podrás vender "
    "cuando quieras. No está cubierto por fondos de garantía de depósitos ni de "
    "indemnización de inversores. Lo que publicamos en esta web y en @stubxai no es "
    "asesoramiento de inversión ni una recomendación personalizada, y no lo ha revisado "
    "ni aprobado la CNMV ni ninguna otra autoridad."
)
RISK_EN = (
    "STUBX is an experimental high-risk crypto-asset. It has no guaranteed value, it "
    "grants no rights of any kind (ownership, voting, dividends, reimbursement, or a "
    "share of revenue), and no return is promised. It can lose all of its value: you "
    "can lose everything you put in. As checked on 2026-10-03, STUBX trades on the "
    "Pump.fun curve: the contract itself buys and sells without needing another person, "
    "but every sale lowers the price and large sales receive a worse price. If the price "
    "falls, selling can return very little or almost nothing. If the token completes the "
    "curve, it moves automatically and irreversibly to a PumpSwap liquidity pool, with "
    "different fees and the same risk of a fall. Pump.fun or the Solana network can fail, "
    "become congested, or limit access depending on the country, so you will not always "
    "be able to sell when you want. It is not covered by deposit-guarantee or investor-"
    "compensation schemes. What we publish on this website and on @stubxai is not "
    "investment advice or a personal recommendation, and it has not been reviewed or "
    "approved by the CNMV or any other authority."
)
CLONE_ES = (
    "Han aparecido tokens en Pump.fun llamados «Comunidad STUBX» o «Comunidad STUBX · "
    "Creador» (símbolo COMUNIDAD) que no son de STUBX. La única CA es "
    f"{CA}. Ni @stubxai ni el creador han lanzado otro token. Comprueba la CA en esta "
    "web. No interactúes con esos tokens."
)
CLONE_EN = (
    "Tokens have appeared on Pump.fun named “Comunidad STUBX” or “Comunidad STUBX · "
    "Creador” (symbol COMUNIDAD) that are not STUBX. The only CA is "
    f"{CA}. Neither @stubxai nor the creator has launched another token. Check the CA "
    "on this website. Do not interact with those tokens."
)

PRIMARY = [
    ("home", "index.html", "Inicio", "Home"),
    ("verify", "verify/index.html", "Verificar", "Verify"),
    ("lab", "lab/index.html", "Lab", "Lab"),
    ("tablero", "tablero/index.html", "Tablero", "Board"),
]
MORE = [
    ("methodology", "methodology/index.html", "Metodología", "Methodology"),
    ("security", "security/index.html", "Seguridad", "Security"),
    ("risks", "risks/index.html", "Riesgos", "Risks"),
    ("legal", "legal/index.html", "Legal", "Legal"),
    ("proofs", "proofs/index.html", "Pruebas", "Proofs"),
    ("status", "status/index.html", "Estado", "Status"),
    ("tokenomics", "tokenomics/index.html", "Reparto", "Supply"),
    ("community", "community/index.html", "Canales", "Channels"),
    ("marca", "marca/index.html", "Marca", "Brand"),
    ("build", "build/index.html", "Versiones", "Versions"),
    ("aprender", "aprender/index.html", "Aprender", "Learn"),
    ("avances", "avances/index.html", "Avances", "Progress"),
    ("studio", "studio/index.html", "Studio", "Studio"),
    ("cuaderno", "cuaderno/index.html", "Cuaderno", "Notebook"),
    ("contribuir", "contribuir/index.html", "Contribuir", "Contribute"),
]


def t(es: str, en: str) -> str:
    return f'<span class="lang es" lang="es">{es}</span><span class="lang en" lang="en">{en}</span>'


def rel_href(frm: str, to: str) -> str:
    start = os.path.dirname(frm) or "."
    return os.path.relpath(to, start=start)


def nav(frm: str, current: str) -> str:
    def items(rows: list[tuple[str, str, str, str]]) -> str:
        out = []
        for pid, dest, es, en in rows:
            href = rel_href(frm, dest)
            current_attr = ' aria-current="page"' if pid == current else ""
            out.append(f'<li><a href="{href}"{current_attr}>{t(es, en)}</a></li>')
        return "".join(out)

    return (
        f'<nav class="site" aria-label="Principal"><ul>{items(PRIMARY)}</ul></nav>'
        f'<details class="mapa"><summary>{t("Mapa del sitio", "Site map")}</summary>'
        f'<nav aria-label="{html.escape("Mapa del sitio / Site map")}"><ul>{items(MORE)}</ul></nav></details>'
    )


def shell(frm: str, current: str, title_es: str, title_en: str, desc_es: str, desc_en: str, body: str, scripts: list[str], narrow: bool) -> str:
    prefix = "../" * frm.count("/")
    wrap = "wrap estrecha" if narrow else "wrap"
    script_tags = "\n".join(f'<script src="{prefix}{src}"></script>' for src in scripts)
    return f"""<!DOCTYPE html>
<html lang="es" data-lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="{html.escape(desc_es)}">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'">
<title data-title-es="{html.escape(title_es)}" data-title-en="{html.escape(title_en)}">{html.escape(title_es)}</title>
<meta name="theme-color" content="#071422">
<link rel="icon" href="{prefix}favicon.ico" sizes="any">
<link rel="icon" href="{prefix}favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="{prefix}apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="{prefix}site.webmanifest">
<link rel="stylesheet" href="{prefix}assets/site.css">
<script src="{prefix}assets/shell.js"></script>
</head>
<body>
<a class="skip lang es" href="#contenido">Saltar al contenido</a>
<a class="skip lang en" href="#contenido">Skip to content</a>
<header class="site"><div class="wrap">
<div class="topbar">
<a class="brand" href="{rel_href(frm, "index.html")}">
<img src="{prefix}assets/talon-avatar-96.webp" width="40" height="40" alt="">
<strong>STUBX</strong>
</a>
<p class="draft">{t("Borrador · 2026-10-09", "Draft · 2026-10-09")}</p>
<div class="langs" role="group" aria-label="Idioma / Language">
<button type="button" data-set-lang="es" lang="es" aria-pressed="true">Español</button>
<button type="button" data-set-lang="en" lang="en" aria-pressed="false">English</button>
</div>
</div>
{nav(frm, current)}
</div></header>
<main id="contenido" class="{wrap}">
<p class="preview"><strong>{t("No publicado.", "Not published.")}</strong> {t("Cristian decide cuándo sale a stubxai.com. Esta copia no sustituye a la web que está hoy en producción.", "Cristian decides when it goes to stubxai.com. This copy does not replace the website that is in production today.")}</p>
{body}
</main>
<footer class="site"><div class="wrap">
<p><strong>{t("Aviso:", "Notice:")}</strong> {t("Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.", "High-risk crypto · You can lose everything · Not investment advice.")} <a href="{rel_href(frm, "risks/index.html")}">{t("Riesgos", "Risks")}</a></p>
<p class="mica"><strong>{t("Aviso MiCA (art. 7.1.e):", "MiCA notice (art. 7.1.e):")}</strong> {t(MICA_ES, MICA_EN)}</p>
<p>{t("CA oficial y única:", "Official and only CA:")} <code>{CA}</code></p>
<p>{t("Canales oficiales:", "Official channels:")} <a href="https://x.com/stubxai">@stubxai</a> · <a href="https://github.com/stubxai/stubx-agent">github.com/stubxai/stubx-agent</a> · <a href="mailto:stubxai.hq@gmail.com">stubxai.hq@gmail.com</a> · <a href="https://t.me/stubxai">t.me/stubxai</a> · <a href="https://farcaster.xyz/stubxai">Farcaster</a> · <a href="https://www.tiktok.com/@stubxai">TikTok</a></p>
<p>{t("Sin cookies ni rastreadores. El idioma y el progreso de Lab, si se usa, se quedan en este navegador.", "No cookies and no trackers. Language and Lab progress, if used, stay in this browser.")}</p>
<p>STUBX · 2026 · {t("Código MIT · Kit con licencia propia · Imágenes de Agente Talón generadas con IA", "MIT code · Kit under its own license · Agente Talón images generated with AI")}</p>
</div></footer>
{script_tags}
</body>
</html>
"""


def write_page(rel: str, current: str, title_es: str, title_en: str, desc_es: str, desc_en: str, body: str, scripts: list[str] | None = None, narrow: bool = False) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(shell(rel, current, title_es, title_en, desc_es, desc_en, body, scripts or [], narrow), encoding="utf-8")


def source(es: str, en: str) -> str:
    return f'<p class="source">{t(es, en)}</p>'


def home() -> str:
    return f"""
<section class="hero">
<div>
<p class="kicker">{t("Solana · Pump.fun · Prototipo", "Solana · Pump.fun · Prototype")}</p>
<h1>{t("Contrasta la dirección antes de creer el nombre.", "Check the address before you trust the name.")}</h1>
<p class="lede">{t("STUBX Verify compara una dirección con fichas públicas del 2026-10-08. No consulta la red, no pide una wallet y no dice qué comprar.", "STUBX Verify compares an address with public cards from 2026-10-08. It does not query the network, it does not ask for a wallet, and it does not say what to buy.")}</p>
<div class="hero-actions">
<a class="primary" href="verify/index.html">{t("Analizar token", "Analyze token")}</a>
<a href="methodology/index.html">{t("Ver la metodología", "Read the methodology")}</a>
</div>
<p class="source">{t("La acción abre la demo fechada de la PR 14 (commit 4161ee6), no una lectura en vivo. La PR no está fusionada.", "The action opens the dated demo from PR 14 (commit 4161ee6), not a live reading. The PR is not merged.")}</p>
</div>
<figure>
<picture>
<source media="(min-width: 900px)" srcset="assets/hero-talon-1000.webp" type="image/webp">
<img src="assets/hero-talon-movil-800.webp" width="800" height="750" alt="{html.escape("Agente Talón, personaje de STUBX: ticket rosa con una gema verde. Ilustración con elementos generados con IA.")}">
</picture>
<figcaption>{t("Agente Talón. Ilustración con elementos generados con IA. No es un sello de aprobación.", "Agente Talón. Illustration with AI-generated elements. It is not a seal of approval.")}</figcaption>
</figure>
</section>
<section class="ca-panel" id="contrato" aria-labelledby="ca-title">
<h2 id="ca-title">{t("Contrato oficial", "Official contract")}</h2>
<p id="ca-label">{t("CA oficial del token, dirección del mint. Única.", "Official token CA, the mint address. The only one.")}</p>
<p class="ca-value" aria-labelledby="ca-label">{CA}</p>
<div class="ca-actions">
<button type="button" class="primary" data-copy="{CA}" aria-describedby="ca-label"><span data-copy-label>{t("Copiar contrato", "Copy contract")}</span></button>
<span class="sr-only" role="status" aria-live="polite" data-copy-status></span>
<a href="https://solscan.io/token/{CA}">{t("Abrir en Solscan", "Open on Solscan")}</a>
<a href="token.json">token.json</a>
</div>
<p>{t(f"Compárala entera con la de la cuenta oficial en X: @stubxai. Cualquier otra CA con el nombre STUBX no es oficial. Fuente: token.json, campo mint, actualizado el 2026-10-05.", f"Compare the whole address with the official X account: @stubxai. Any other CA using the name STUBX is not official. Source: token.json, mint field, updated 2026-10-05.")}</p>
</section>
<div class="grid-3">
<article class="card"><h2>{t("Un personaje", "A character")}</h2><p>{t("Agente Talón pide pruebas antes de creer una promesa. Las imágenes se generan con IA. El lema es «No stub, no story».", "Agente Talón asks for proof before believing a promise. The images are generated with AI. The motto is “No stub, no story”.")}</p></article>
<article class="card"><h2>{t("Un token", "A token")}</h2><p>{t("Creado el 2026-09-23 en Pump.fun. Sin autoridad de emisión ni de congelación. No da derechos. La descripción grabada dice «AI-native» y ya no se puede cambiar: hoy no hay un agente autónomo.", "Created on 2026-09-23 on Pump.fun. No mint authority and no freeze authority. It grants no rights. The recorded description says “AI-native” and can no longer be changed: there is no autonomous agent today.")}</p></article>
<article class="card"><h2>{t("Un prototipo", "A prototype")}</h2><p>{t("El repositorio github.com/stubxai/stubx-agent no tiene wallet ni claves, no firma y no envía transacciones. Licencia MIT.", "The repository github.com/stubxai/stubx-agent has no wallet and no keys, it does not sign, and it does not send transactions. MIT license.")}</p></article>
</div>
<h2>{t("Herramientas de esta misma web", "Tools in this same website")}</h2>
<p>{t("Misma navegación, mismos estilos y el mismo selector de idioma. Lo que no está construido no tiene un botón que finja funcionar.", "Same navigation, same styles, and the same language switch. What is not built has no button pretending to work.")}</p>
<div class="grid-3">
<article class="card"><p class="estado-pill">{t("Demo fechada · 2026-10-08", "Dated demo · 2026-10-08")}</p><h3>Verify</h3><p>{t("Pega una dirección y lee el semáforo en lenguaje llano. Solo con las cinco fichas de esa fecha.", "Paste an address and read the traffic light in plain language. Only with the five cards from that date.")}</p><p><a class="primary" href="verify/index.html">{t("Analizar token", "Analyze token")}</a></p></article>
<article class="card"><p class="estado-pill">{t("Demo fechada · 2026-10-09", "Dated demo · 2026-10-09")}</p><h3>Lab</h3><p>{t("Una misión de cinco pasos para distinguir el mint del registro de un clon. El progreso se queda en este navegador.", "A five-step mission to tell the registry mint from a clone. Progress stays in this browser.")}</p><p><a href="lab/index.html">{t("Hacer la misión", "Do the mission")}</a></p></article>
<article class="card"><p class="estado-pill">{t("Registro · 2026-10-09", "Record · 2026-10-09")}</p><h3>{t("Tablero", "Board")}</h3><p>{t("Estados reales del registro de la PR 14. Una idea, un código en el repositorio y una función publicada no son lo mismo.", "Real states from the PR 14 record. An idea, code in the repository, and a published function are not the same thing.")}</p><p><a href="tablero/index.html">{t("Abrir el tablero", "Open the board")}</a></p></article>
</div>
<div class="grid-3">
<article class="slot"><p class="estado-pill">{t("No construido · 2026-10-09", "Not built · 2026-10-09")}</p><h3>Studio</h3><p>{t("No hay editor ni exportación. La ficha U02 sigue en propuesta.", "There is no editor and no export. Item U02 is still a proposal.")}</p><p><a href="studio/index.html">{t("Ver qué falta", "See what is missing")}</a></p></article>
<article class="slot"><p class="estado-pill">{t("No construido · 2026-10-09", "Not built · 2026-10-09")}</p><h3>{t("Cuaderno", "Notebook")}</h3><p>{t("No hay notas ni historial de consultas. Lab solo guarda el progreso de la misión.", "There are no notes and no query history. Lab only stores mission progress.")}</p><p><a href="cuaderno/index.html">{t("Ver qué falta", "See what is missing")}</a></p></article>
<article class="slot"><p class="estado-pill">{t("No construido · 2026-10-09", "Not built · 2026-10-09")}</p><h3>{t("Contribuir", "Contribute")}</h3><p>{t("No hay formulario ni entrega de archivos. No se piden aportaciones.", "There is no form and no file upload. Contributions are not being requested.")}</p><p><a href="contribuir/index.html">{t("Ver qué falta", "See what is missing")}</a></p></article>
</div>
<section class="risk-block">
<h2>{t("Léelo antes de nada", "Read this before anything else")}</h2>
<p>{t("STUBX es un criptoactivo experimental de alto riesgo. Puedes perder todo lo que aportes. No es asesoramiento ni una recomendación, y no lo ha aprobado la CNMV ni ninguna otra autoridad.", "STUBX is an experimental high-risk crypto-asset. You can lose everything you put in. It is not advice or a recommendation, and it has not been approved by the CNMV or any other authority.")}</p>
<p><a href="risks/index.html">{t("El aviso completo, con MiCA", "The full notice, including MiCA")}</a> · <a href="security/index.html">{t("Canales y aviso de clones", "Channels and clone notice")}</a></p>
</section>
"""


def prepare_tool(name: str) -> str:
    raw = (ROOT / "content" / "tools" / f"{name}.html").read_text(encoding="utf-8")
    raw = re.sub(r"^<main[^>]*>", "", raw)
    raw = re.sub(r"</main>\s*$", "", raw)
    raw = raw.replace(
        "<p>Herramienta educativa con datos públicos. No es consejo de inversión. Cripto de alto riesgo · Puedes perderlo todo.</p>\n<p lang=\"en\">Educational tool using public data. Not investment advice. High-risk crypto · You can lose everything.</p>",
        "<p>" + t(
            "Herramienta educativa con datos públicos. No es consejo de inversión. Cripto de alto riesgo · Puedes perderlo todo.",
            "Educational tool using public data. Not investment advice. High-risk crypto · You can lose everything.",
        ) + "</p>",
    )
    raw = raw.replace('<section id="resultado"', '<section id="resultado" tabindex="-1"', 1)
    if name == "verify":
        extra = (
            '<p><button type="button" id="ver-lectura-caida">'
            + t(
                "Mostrar el aviso de lectura no disponible",
                "Show the reading-unavailable notice",
            )
            + "</button></p><p class=\"source\">"
            + t(
                "Ese botón no llama a la red. Enseña el mensaje que el motor ya tiene cuando la fuente no responde. La dirección que hayas escrito se conserva.",
                "That button does not call the network. It shows the message the engine already has when the source does not respond. The address you typed stays in the field.",
            )
            + "</p>"
        )
        raw = raw.replace("</form>", "</form>\n" + extra, 1)
    return raw


def methodology() -> str:
    return f"""
<h1>{t("Metodología", "Methodology")}</h1>
<p class="lede">{t("De dónde sale cada dato de esta vista previa, qué se calculó y qué no se rellena cuando falta.", "Where each figure in this preview comes from, what was calculated, and what is not filled in when something is missing.")}</p>
{source("Textos de la web en producción revisados hasta el 2026-10-05. Fichas de Verify leídas el 2026-10-08. Registro del tablero revisado el 2026-10-09. Esta página no vuelve a consultar la red.", "Production website texts reviewed through 2026-10-05. Verify cards read on 2026-10-08. Board record reviewed on 2026-10-09. This page does not query the network again.")}
<h2>{t("Qué hace Verify aquí", "What Verify does here")}</h2>
<ul class="clean">
<li>{t("Acepta una dirección y comprueba el formato. El nombre del token no sirve.", "It accepts an address and checks the format. The token name is not enough.")}</li>
<li>{t("La compara con cinco fichas guardadas el 2026-10-08 (UTC), commit 4161ee6 de la rama feat/lab-mision-1, PR 14 sin fusionar.", "It compares it with five cards stored on 2026-10-08 (UTC), commit 4161ee6 on branch feat/lab-mision-1, PR 14 unmerged.")}</li>
<li>{t("Si no hay ficha, el resultado es «no se pudo comprobar». No se inventa un verde.", "If there is no card, the result is “could not be checked”. A green result is not invented.")}</li>
<li>{t("«Parece el STUBX oficial» significa que la dirección coincide con el registro de esa tanda. No es una garantía permanente ni una auditoría.", "“Looks like the official STUBX” means the address matches the registry for that batch. It is not a permanent guarantee or an audit.")}</li>
<li>{t("Una señal de copia dice que el nombre, el símbolo, la imagen o un enlace coinciden y el mint es otro. No dice quién lo hizo.", "A copy signal says the name, symbol, image, or a link matches and the mint is a different one. It does not say who did it.")}</li>
</ul>
<h2>{t("Desconocido no es comprobado", "Unknown is not verified")}</h2>
<p>{t("No disponible significa que esa llamada no dejó un dato usable. Desconocido es lo que no se leyó. Ninguno de los dos se convierte en cero, en autoridad revocada ni en metadatos inmutables.", "Unavailable means that call did not leave a usable fact. Unknown is what was not read. Neither one becomes zero, a revoked authority, or immutable metadata.")}</p>
<p>{t("En las cinco fichas, la muestra de cuentas grandes (getTokenLargestAccounts) respondió HTTP 429. La muestra queda en no disponible. No es un censo de personas y no es concentración cero. Una cuenta puede ser de un custodio.", "On all five cards, the large-account sample (getTokenLargestAccounts) returned HTTP 429. The sample stays unavailable. It is not a census of people and it is not zero concentration. An account can belong to a custodian.")}</p>
<h2>{t("Curva", "Curve")}</h2>
<p>{t("Si la cuenta derivada es del programa de la curva, la ficha lo dice. El avance clásico es un cálculo inferido con la reserva real inicial pública documentada (793100000000000), truncado a 2 decimales hacia cero. No es un campo de la cuenta. Si no hay curva, el avance queda en no aplica y no se rellenan reservas con cero.", "If the derived account belongs to the curve program, the card says so. Classic progress is an inferred calculation using the documented public initial real reserve (793100000000000), truncated to 2 decimals toward zero. It is not a field of the account. If there is no curve, progress stays not applicable and reserves are not filled in with zero.")}</p>
<p>{t("En la ficha del mint del registro, el 2026-10-08 a las 07:41:29 UTC, el avance inferido es 1.74. Los tres clones de esa tanda tienen 0.00 inferido. USDC no es una curva.", "On the registry mint card, 2026-10-08 at 07:41:29 UTC, inferred progress is 1.74. The three clones in that batch have inferred 0.00. USDC is not a curve.")}</p>
<h2>{t("Prueba pública mínima", "Minimum public proof")}</h2>
<p>{t("Cuatro casillas: wallet, logs, límites y kill-switch. A 2026-10-05 hay 3 marcadas y 1 que no aplica. No es un 3/3. Marcada no significa auditada. El detalle y las ejecuciones están en Estado.", "Four boxes: wallet, logs, limits, and kill-switch. As of 2026-10-05, 3 are marked and 1 does not apply. It is not 3/3. Marked does not mean audited. The detail and the runs are on Status.")}</p>
<p><a href="../status/index.html">{t("Ver las casillas", "See the boxes")}</a> · <a href="../proofs/index.html">{t("Ver las pruebas, una a una", "See the proofs, one by one")}</a></p>
"""


def security() -> str:
    return f"""
<h1>{t("Seguridad y canales", "Security and channels")}</h1>
<p class="lede">{t("Lista cerrada. Si una cuenta, una web o una CA no está aquí, trátala como no oficial hasta comprobarla en @stubxai y en esta web.", "Closed list. If an account, a website, or a CA is not here, treat it as unofficial until you check it on @stubxai and on this website.")}</p>
{source("Aviso de clones del 2026-10-05, token.json securityNotice. Canales de la web en producción, token.json official, última actualización 2026-10-05.", "Clone notice of 2026-10-05, token.json securityNotice. Channels from the production website, token.json official, last update 2026-10-05.")}
<div class="risk-block"><h2>{t("Aviso de clones · 2026-10-05", "Clone notice · 2026-10-05")}</h2><p>{t(CLONE_ES, CLONE_EN)}</p></div>
<h2>{t("Contrato", "Contract")}</h2>
<p class="ca-value">{CA}</p>
<p>{t("Cópiala solo desde esta web o desde @stubxai. Compárala entera, no solo el principio y el final. En Solscan debe decir STUBX, creado el 2026-09-23, y la wallet creadora es la de abajo.", "Copy it only from this website or from @stubxai. Compare the whole address, not only the start and the end. On Solscan it should say STUBX, created on 2026-09-23, and the creator wallet is the one below.")}</p>
<h2>{t("Canales oficiales", "Official channels")}</h2>
<ul class="clean">
<li>{t("X, único canal oficial en X:", "X, the only official X channel:")} <a href="https://x.com/stubxai">@stubxai</a></li>
<li>{t("Web:", "Website:")} <a href="https://stubxai.com/">stubxai.com</a>. {t("La dirección antigua superb-horse-9036f5.netlify.app está grabada en el token, sigue siendo de STUBX y redirige con 301.", "The old address superb-horse-9036f5.netlify.app is recorded in the token, is still STUBX, and redirects with a 301.")}</li>
<li>{t("Correo, único:", "Email, the only one:")} <a href="mailto:stubxai.hq@gmail.com">stubxai.hq@gmail.com</a></li>
<li>{t("Código, único repositorio:", "Code, the only repository:")} <a href="https://github.com/stubxai/stubx-agent">github.com/stubxai/stubx-agent</a>. {t("github.com/stubx, sin «ai», no tiene relación con STUBX.", "github.com/stubx, without “ai”, has no relation to STUBX.")}</li>
<li>{t("Telegram, solo anuncios:", "Telegram, announcements only:")} <a href="https://t.me/stubxai">t.me/stubxai</a>. {t("Los admins nunca escriben primero por privado.", "Admins never write first in private.")}</li>
<li>Farcaster: <a href="https://farcaster.xyz/stubxai">@stubxai</a></li>
<li>TikTok: <a href="https://www.tiktok.com/@stubxai">@stubxai</a>. {t("Solo vídeos antiestafa. No publica enlaces ni direcciones de token. Mensajes privados desactivados.", "Anti-scam videos only. It does not publish links or token addresses. Private messages are off.")}</li>
<li>Discord: {t("ninguno.", "none.")}</li>
</ul>
<h2>{t("Wallets que no son un canal", "Wallets that are not a channel")}</h2>
<ul class="clean">
<li>{t("Wallet creadora:", "Creator wallet:")} <code>{CREATOR}</code></li>
<li>{t("Wallet personal del creador:", "Creator’s personal wallet:")} <code>{PERSONAL}</code>. {t("Tiene STUBX. Nunca pide que le envíes nada y no acepta aportaciones.", "It holds STUBX. It never asks you to send anything and it does not accept contributions.")}</li>
<li>{t("Wallet pública del proyecto, SOL, controlada por el creador:", "Public project wallet, SOL, controlled by the creator:")} <code>{PROJECT}</code>. {t("No es multifirma. No acepta aportaciones ni donaciones.", "It is not a multisig. It does not accept contributions or donations.")}</li>
</ul>
<p>{t("Cualquier otra wallet que diga ser de STUBX o pida un envío es una estafa. La cuenta personal de X del creador, @CreadorSTUBX, no es un canal oficial.", "Any other wallet that claims to be STUBX or asks for a transfer is a scam. The creator’s personal X account, @CreadorSTUBX, is not an official channel.")}</p>
<h2>{t("Qué no pedirá el equipo", "What the team will not ask for")}</h2>
<ul class="clean">
<li>{t("Que envíes SOL, tokens o dinero.", "That you send SOL, tokens, or money.")}</li>
<li>{t("Tu frase semilla, tu clave privada o tus códigos.", "Your seed phrase, your private key, or your codes.")}</li>
<li>{t("Que conectes una wallet o firmes algo por un mensaje privado.", "That you connect a wallet or sign something because of a private message.")}</li>
<li>{t("Preventas, whitelists o airdrops.", "Presales, whitelists, or airdrops.")}</li>
</ul>
<p>{t("STUBX no escribe primero por mensaje directo. Si alguien lo hace en nombre de STUBX, trátalo como una estafa: no respondas, no abras enlaces y no firmes. La información válida se publica en abierto. Si hay contradicción, no actúes.", "STUBX does not write first in a direct message. If someone does it in STUBX’s name, treat it as a scam: do not reply, do not open links, and do not sign. Valid information is published in the open. If there is a contradiction, do not act.")}</p>
<h2>{t("Cómo avisar", "How to report")}</h2>
<p>{t("Escribe a stubxai.hq@gmail.com con el enlace y una descripción. No envíes la frase semilla, una contraseña ni un documento personal. También está en security.txt. No hay atención continua ni promesa de recuperar fondos.", "Write to stubxai.hq@gmail.com with the link and a description. Do not send the seed phrase, a password, or a personal document. It is also in security.txt. There is no continuous support and no promise to recover funds.")}</p>
<p><a href="../security.txt">security.txt</a> · <a href="../.well-known/security.txt">/.well-known/security.txt</a></p>
<p class="source">{t("Revisión de este texto: 2026-10-09, a partir del aviso publicado el 2026-10-05. No es vigilancia permanente ni una garantía contra el fraude.", "Review of this text: 2026-10-09, from the notice published on 2026-10-05. It is not permanent monitoring or a guarantee against fraud.")}</p>
"""


def risks() -> str:
    return f"""
<h1>{t("Riesgos", "Risks")}</h1>
<p class="lede">{t("Resumen en lenguaje llano de los riesgos de STUBX y de lo que este proyecto es y no es. No es un dictamen jurídico ni consejo de inversión. Si necesitas asesoramiento, consulta a un profesional colegiado.", "A plain-language summary of the risks of STUBX and of what this project is and is not. It is not a legal opinion or investment advice. If you need advice, ask a licensed professional.")}</p>
<div class="risk-block">
<h2>{t("Aviso de riesgo", "Risk notice")}</h2>
<p>{t(RISK_ES, RISK_EN)}</p>
<p class="mica"><strong>{t("Aviso MiCA (art. 7.1.e):", "MiCA notice (art. 7.1.e):")}</strong> {t(MICA_ES, MICA_EN)}</p>
</div>
<h2>{t("Lo que puede salir mal", "What can go wrong")}</h2>
<div class="grid-3">
<article class="card"><h3>{t("Pérdida total", "Total loss")}</h3><p>{t("Un memecoin puede irse a cero. Puedes perder el 100 % de lo que aportes.", "A memecoin can go to zero. You can lose 100% of what you put in.")}</p></article>
<article class="card"><h3>{t("Mercado y liquidez", "Market and liquidity")}</h3><p>{t("Bots que compran antes que nadie, copias del nombre, poco SOL en la curva, caídas de la red y acceso limitado según el país. Nadie aquí dice que compres o vendas.", "Bots that buy before anyone else, copies of the name, little SOL on the curve, network outages, and access limited by country. Nobody here tells you to buy or sell.")}</p></article>
<article class="card"><h3>{t("Sin promesas", "No promises")}</h3><p>{t("No prometemos rentabilidad, precio, listado en exchanges ni venta pública. STUBX no da derechos, dividendos ni reparto de nada.", "We do not promise a return, a price, an exchange listing, or a public sale. STUBX grants no rights, dividends, or distribution of anything.")}</p></article>
<article class="card"><h3>{t("Riesgo técnico", "Technical risk")}</h3><p>{t("Lanzamiento en la curva pública de Pump.fun, sin reserva de equipo y sin autoridades de emisión ni congelación. Eso reduce algunos riesgos técnicos, no el riesgo de mercado. El código del agente es un prototipo y puede tener fallos.", "Launch on the public Pump.fun curve, with no team reserve and no mint or freeze authority. That reduces some technical risks, not market risk. The agent code is a prototype and can have faults.")}</p></article>
<article class="card"><h3>{t("Estafas y copias", "Scams and copies")}</h3><p>{t("Habrá cuentas, webs y CAs falsas. Solo es oficial lo que aparece en Seguridad. Nadie de STUBX pedirá tu semilla ni fondos por mensaje directo.", "There will be fake accounts, websites, and CAs. Only what appears on Security is official. Nobody from STUBX will ask for your seed or for funds in a direct message.")}</p></article>
<article class="card"><h3>{t("Datos parciales y operación", "Partial data and operations")}</h3><p>{t("Las fichas de Verify de esta vista previa están incompletas: la muestra de holders no está. El creador puede vender sus STUBX en cualquier momento: no hay vesting. La wallet del proyecto la controla una persona y no es multifirma.", "The Verify cards in this preview are incomplete: the holder sample is missing. The creator can sell their STUBX at any time: there is no vesting. One person controls the project wallet and it is not a multisig.")}</p></article>
</div>
<h2>{t("Qué es y qué no es", "What it is and what it is not")}</h2>
<div class="grid-2">
<article class="card"><h3>{t("Qué es", "What it is")}</h3><ul class="clean"><li>{t("Un personaje-meme sobre agentes de IA que piden pruebas.", "A character-meme about AI agents that ask for proof.")}</li><li>{t(f"Un token en Solana creado en Pump.fun el 2026-09-23. CA {CA}.", f"A Solana token created on Pump.fun on 2026-09-23. CA {CA}.")}</li><li>{t("Un prototipo de código abierto, sin wallet ni claves, con tests, kill-switch y registro público.", "An open-source prototype, with no wallet and no keys, with tests, a kill-switch, and a public log.")}</li></ul></article>
<article class="card"><h3>{t("Qué no es", "What it is not")}</h3><ul class="clean"><li>{t("No es consejo de inversión ni una recomendación.", "It is not investment advice or a recommendation.")}</li><li>{t("No es un agente autónomo: no firma, no custodia y no opera.", "It is not an autonomous agent: it does not sign, custody, or trade.")}</li><li>{t("El kill-switch solo afecta al agente del repositorio. No pausa transferencias ni congela cuentas.", "The kill-switch only affects the repository agent. It does not pause transfers or freeze accounts.")}</li><li>{t("No hay agente autónomo, aunque la descripción grabada diga «AI-native».", "There is no autonomous agent, even if the recorded description says “AI-native”.")}</li></ul></article>
</div>
<h2>{t("Lo que no decimos ni hacemos", "What we do not say or do")}</h2>
<ul class="clean">
<li>{t("Sin promesas de rentabilidad ni de precio.", "No promises of return or price.")}</li>
<li>{t("Sin «aprobado por la CNMV» ni «preparado para MiCA». No hay white paper MiCA notificado.", "No “approved by the CNMV” and no “MiCA-ready”. There is no notified MiCA white paper.")}</li>
<li>{t("Sin volumen falso.", "No fake volume.")}</li>
<li>{t("Sin llamadas a comprar, ni urgencias, ni anuncios de listados.", "No calls to buy, no urgency, and no listing announcements.")}</li>
</ul>
"""


def legal() -> str:
    return f"""
<h1>{t("Legal y contacto", "Legal and contact")}</h1>
<p class="lede">{t("Contacto real y límites de lo que esta web afirma. No hay sellos de cumplimiento. Un abogado no ha certificado esta vista previa.", "A real contact and the limits of what this website claims. There are no compliance seals. A lawyer has not certified this preview.")}</p>
<div class="risk-block"><p>{t(RISK_ES, RISK_EN)}</p><p class="mica"><strong>{t("Aviso MiCA (art. 7.1.e):", "MiCA notice (art. 7.1.e):")}</strong> {t(MICA_ES, MICA_EN)}</p></div>
<h2>{t("Qué no es esta web", "What this website is not")}</h2>
<ul class="clean">
<li>{t("No es una oferta ni una invitación a comprar.", "It is not an offer or an invitation to buy.")}</li>
<li>{t("No es una recomendación personalizada.", "It is not a personal recommendation.")}</li>
<li>{t("No está aprobada por la CNMV ni por otra autoridad.", "It is not approved by the CNMV or by another authority.")}</li>
<li>{t("No hay white paper MiCA notificado.", "There is no notified MiCA white paper.")}</li>
<li>{t("Hablar de un criptoactivo puede ser comunicación publicitaria: por eso lleva el aviso del art. 7.1.e.", "Talking about a crypto-asset can be a marketing communication: that is why it carries the art. 7.1.e notice.")}</li>
</ul>
<h2>{t("Privacidad", "Privacy")}</h2>
<ul class="clean">
<li>{t("No hay cuentas, formularios, analítica ni cookies.", "There are no accounts, forms, analytics, or cookies.")}</li>
<li>{t("El selector de idioma guarda stubx-lab-lang en este navegador. Se puede borrar desde el propio navegador.", "The language switch stores stubx-lab-lang in this browser. You can delete it in the browser itself.")}</li>
<li>{t("Lab guarda stubx-lab-mision-01 solo si haces la misión. Es progreso local, sin puntuación y sin valor. Se puede borrar.", "Lab stores stubx-lab-mision-01 only if you do the mission. It is local progress, with no score and no value. It can be deleted.")}</li>
<li>{t("Verify no envía la dirección a ningún servidor. La lectura es local, con las fichas del 2026-10-08.", "Verify does not send the address to any server. The reading is local, with the 2026-10-08 cards.")}</li>
<li>{t("No hay service worker. Recargar trae esta copia; no hay una caché de la portada ni de los avisos.", "There is no service worker. Reloading fetches this copy; there is no cache of the home page or of the notices.")}</li>
</ul>
<h2>{t("Contacto", "Contact")}</h2>
<p><a href="mailto:stubxai.hq@gmail.com">stubxai.hq@gmail.com</a>. {t("Prensa, dudas y fallos de seguridad. No hay formularios. No pedimos semilla, claves ni dinero.", "Press, questions, and security faults. There are no forms. We do not ask for a seed, keys, or money.")}</p>
<p><a href="../security.txt">security.txt</a> · <a href="https://github.com/stubxai/stubx-agent/blob/main/SECURITY.md">SECURITY.md</a>. {t("No hay recompensa económica.", "There is no monetary reward.")}</p>
<p class="source">{t("Textos de riesgo y MiCA: los de la web en producción a 2026-10-05, conservados en su significado. La frase inglesa es una traducción de esa frase española.", "Risk and MiCA texts: those of the production website as of 2026-10-05, kept in meaning. The English sentence is a translation of that Spanish sentence.")}</p>
"""


def proofs() -> str:
    blocks = []

    def proof(title_es, title_en, body):
        if body.startswith("<span"):
            cut = 0
            for _ in range(2):
                cut = body.find("</span>", cut) + len("</span>")
            body = f"<p>{body[:cut]}</p>{body[cut:]}"
        blocks.append(f"<article class=\"card\"><h2>{t(title_es, title_en)}</h2>{body}</article>")

    proof(
        "Tests automáticos: 115 de 115 (a 2026-10-04)",
        "Automated tests: 115 of 115 (as of 2026-10-04)",
        t(
            "El 04-10-2026 a las 11:43 (Madrid), main estaba en el commit e4faf6e y la CI pública terminó 115 de 115 en verde, 12 grupos, 0 fallos, incluidos 20 tests de límites. A las 12:40 se repitió en un clon limpio con Node.js 22, con el mismo resultado. Demuestra que, en ese commit, el código hace lo que esos tests comprueban. No demuestra que no haya otros fallos, ni que sea una auditoría, ni nada sobre el precio. Otra versión de main puede tener otra cifra.",
            "On 2026-10-04 at 11:43 (Madrid), main was at commit e4faf6e and the public CI finished 115 of 115 green, 12 groups, 0 failures, including 20 limit tests. At 12:40 it was repeated on a clean clone with Node.js 22, with the same result. It shows that, at that commit, the code does what those tests check. It does not show that there are no other faults, it is not an audit, and it says nothing about price. Another version of main can have a different count.",
        )
        + source(
            "Ejecución citada en la web en producción: github.com/stubxai/stubx-agent, commit e4faf6e, comprobado el 2026-10-04.",
            "Run cited on the production website: github.com/stubxai/stubx-agent, commit e4faf6e, checked on 2026-10-04.",
        ),
    )
    proof(
        "Registro diario: 9 días (a 2026-10-04)",
        "Daily log: 9 days (as of 2026-10-04)",
        t(
            "logs/agent-log.jsonl tenía 9 entradas, del 26-09 al 04-10-2026, escritas por github-actions[bot] con el workflow daily-log. Cada entrada lleva la huella de la anterior. El 04-10-2026 a las 12:40, logs:verify dio ok con 9 entradas. Demuestra que no se cambió una entrada antigua sin rehacer las siguientes. No demuestra que el registro esté completo ni que lo anotado sea verdad. No anota los posts de @stubxai ni la cadena del token.",
            "logs/agent-log.jsonl had 9 entries, from 2026-09-26 to 2026-10-04, written by github-actions[bot] with the daily-log workflow. Each entry carries the hash of the previous one. On 2026-10-04 at 12:40, logs:verify reported ok with 9 entries. It shows that an old entry was not changed without redoing the later ones. It does not show that the log is complete or that what it records is true. It does not record @stubxai posts or the token chain.",
        ),
    )
    proof(
        "Sellos de tiempo: 8 confirmados y 1 pendiente (a 2026-10-04)",
        "Timestamps: 8 confirmed and 1 pending (as of 2026-10-04)",
        t(
            "Había 9 anclas y 9 sellos .ots. Los 8 del 26-09 al 03-10 estaban confirmados en Bitcoin. El del 04-10 seguía pendiente. El primer bloque del ancla 2026-09-26-000001 es 968752. Bitcoin solo es el reloj: no respalda STUBX. Un sello prueba que el ancla existía a más tardar a la hora de su bloque, no que el texto sea verdad. Comprobado a mano el 03-10 y de nuevo el 04-10-2026 a las 12:41 contra blockstream.info.",
            "There were 9 anchors and 9 .ots proofs. The 8 from 09-26 to 10-03 were confirmed in Bitcoin. The 10-04 proof was still pending. The first block of anchor 2026-09-26-000001 is 968752. Bitcoin is only the clock: it does not back STUBX. A proof shows that the anchor existed by the time of its block, not that the text is true. Checked by hand on 10-03 and again on 2026-10-04 at 12:41 against blockstream.info.",
        ),
    )
    proof(
        "Autoridades revocadas",
        "Authorities revoked",
        t(
            f"El mint {CA} (Token-2022) no tiene autoridad de emisión ni de congelación, y los metadatos no tienen autoridad de actualización. Leído en el RPC público el 04-10-2026 a las 12:41 (Madrid), slot 453232549. Suministro 1.000.000.000, 6 decimales. Demuestra que nadie puede crear más STUBX ni congelar cuentas de STUBX, y que esos metadatos no se cambian. No dice nada del precio y no evita las copias.",
            f"Mint {CA} (Token-2022) has no mint authority and no freeze authority, and the metadata has no update authority. Read on the public RPC on 2026-10-04 at 12:41 (Madrid), slot 453232549. Supply 1,000,000,000, 6 decimals. It shows that nobody can create more STUBX or freeze STUBX accounts, and that this metadata cannot be changed. It says nothing about price and it does not stop copies.",
        ),
    )
    proof(
        "Reparto a 2026-10-03 14:19 (Madrid)",
        "Distribution as of 2026-10-03 14:19 (Madrid)",
        t(
            f"Curva {CURVE}: 986.122.445,10 STUBX (98,61 %). Wallet creadora {CREATOR}: 5.272.727,23 (0,53 %). Wallet personal {PERSONAL}: 8.604.827,67 (0,86 %). Suman 1.000.000.000. Releído el 04-10-2026 a las 12:41, slots 453232551 y 453232552, con las mismas cifras. La wallet del proyecto tenía 0 STUBX. No dice dónde estarán mañana. Los del creador no están bloqueados.",
            f"Curve {CURVE}: 986,122,445.10 STUBX (98.61%). Creator wallet {CREATOR}: 5,272,727.23 (0.53%). Personal wallet {PERSONAL}: 8,604,827.67 (0.86%). They sum to 1,000,000,000. Read again on 2026-10-04 at 12:41, slots 453232551 and 453232552, with the same figures. The project wallet held 0 STUBX. It does not say where they will be tomorrow. The creator’s tokens are not locked.",
        )
        + f'<p><a href="../tokenomics/index.html">{t("Tabla completa", "Full table")}</a></p>',
    )
    proof(
        "Wallet pública del proyecto: 0 STUBX",
        "Public project wallet: 0 STUBX",
        t(
            f"{PROJECT} no tenía ninguna cuenta de STUBX el 04-10-2026 a las 12:24 (Madrid), slot 453228585. Es una wallet normal, no multifirma. La controla el creador. El SOL es suyo y solo paga costes del proyecto. No pertenece a los holders, no da derechos y no acepta aportaciones. La cadena no dice quién la controla: lo declara el creador. No es la wallet del agente.",
            f"{PROJECT} had no STUBX account on 2026-10-04 at 12:24 (Madrid), slot 453228585. It is a normal wallet, not a multisig. The creator controls it. The SOL is theirs and it only pays project costs. It does not belong to holders, it grants no rights, and it does not accept contributions. The chain does not say who controls it: the creator declares that. It is not the agent wallet.",
        ),
    )
    proof(
        "Reintegro de la comisión de creador",
        "Creator-fee reimbursement",
        t(
            "El 04-10-2026 a las 11:06 (Madrid), slot 453211124, la transacción 4FhEmdch5DnDSN8BXfH7pFP2h9w8o2MdAMw16FcYxkLiaZ3BJEaqEhRf5e4rVPQxYGRt8oz2n3TDi5dzsL726KEy envió 0,033020866 SOL desde la wallet personal a la wallet del proyecto. 0,031554107 SOL reintegran la comisión cobrada el 2026-09-23 (transacción 3rDQEqHoTQFVgkiAmtBX3sRia9sScEs3K5rcEaDu9riYSNMBrQ3uLQbu9aSBB3zNnCisafbMQo7puURyGF5FtLmH). Los otros 0,001466759 SOL son del creador, para comisiones de red. La cadena demuestra el envío, no el motivo. La comisión es un ingreso del creador: no se reparte.",
            "On 2026-10-04 at 11:06 (Madrid), slot 453211124, transaction 4FhEmdch5DnDSN8BXfH7pFP2h9w8o2MdAMw16FcYxkLiaZ3BJEaqEhRf5e4rVPQxYGRt8oz2n3TDi5dzsL726KEy sent 0.033020866 SOL from the personal wallet to the project wallet. 0.031554107 SOL reimburses the fee collected on 2026-09-23 (transaction 3rDQEqHoTQFVgkiAmtBX3sRia9sScEs3K5rcEaDu9riYSNMBrQ3uLQbu9aSBB3zNnCisafbMQo7puURyGF5FtLmH). The other 0.001466759 SOL is the creator’s, for network fees. The chain shows the transfer, not the reason. The fee is the creator’s income: it is not distributed.",
        ),
    )
    return f"""
<h1>{t("Pruebas", "Proofs")}</h1>
<p class="lede">{t("Siete pruebas públicas, con fecha. Para cada una: qué se comprobó, qué demuestra y qué no demuestra. Después de esa hora el dato puede haber cambiado: esta página no lo vuelve a leer.", "Seven public proofs, with a date. For each one: what was checked, what it shows, and what it does not show. After that time the figure may have changed: this page does not read it again.")}</p>
{source("Página pruebas.html de la web en producción, comprobaciones del 2026-10-04 salvo que se indique otra hora. PPM cerrada en su criterio el 2026-10-05.", "The production website’s pruebas.html page, checks of 2026-10-04 unless another time is stated. PPM criterion closed on 2026-10-05.")}
{''.join(blocks)}
<h2>{t("Lo que no existe hoy", "What does not exist today")}</h2>
<p class="source">{t("Lista comprobada el 2026-10-05. «Por diseño» solo aplica a la wallet y las claves del agente.", "List checked on 2026-10-05. “By design” applies only to the agent wallet and keys.")}</p>
<ul class="clean">
<li>{t("Wallet o claves del agente. La wallet pública del proyecto la controla el creador.", "Agent wallet or keys. The creator controls the public project wallet.")}</li>
<li>{t("Firmar o enviar transacciones.", "Signing or sending transactions.")}</li>
<li>{t("Conexión del agente del repositorio a la red principal: lee una ficha local.", "The repository agent connecting to the public network: it reads a local card.")}</li>
<li>{t("Autonomía real. «Agente autónomo» es el personaje.", "Real autonomy. “Autonomous agent” is the character.")}</li>
<li>{t("Publicar en X desde este repositorio. Los posts de @stubxai los prepara otro agente, con textos aprobados antes.", "Posting to X from this repository. @stubxai posts are prepared by another agent, from texts approved beforehand.")}</li>
<li>{t("Staking, rentabilidad o listados. No se prometen.", "Staking, returns, or listings. They are not promised.")}</li>
</ul>
<h2 id="archivo">{t("Archivo histórico", "Historical archive")}</h2>
<p>{t("Los textos anteriores al estado vigente y las 18 publicaciones de @stubxai retiradas el 2026-10-03, hacia las 11:35 (Madrid), se conservan en la web que está en producción (archivo.html). Fuente: copia hecha el 2026-10-03 a las 11:21 (Madrid). Huella SHA-256 de esa copia: 654f8b25a72bae9d80c83ba3b3aa16ef16a1a531c450fce17d1d806342706897. No describen el estado actual. La copia recuperable está en web/current/archivo.html de este repositorio.", "Texts from before the current state, and the 18 @stubxai posts removed on 2026-10-03 at about 11:35 (Madrid), remain on the production website (archivo.html). Source: a copy made on 2026-10-03 at 11:21 (Madrid). SHA-256 of that copy: 654f8b25a72bae9d80c83ba3b3aa16ef16a1a531c450fce17d1d806342706897. They do not describe the current state. The recoverable copy is in web/current/archivo.html in this repository.")}</p>
<p>{t("Notas que ya acompañan a ese archivo: las respuestas del 2026-10-01 a @solana, @Raydium y @WhiteHouse se retiraron por ambiguas. STUBX no está listado en Raydium y no tiene relación, acuerdo ni anuncio con Solana, Raydium o la Casa Blanca. La frase de la comisión de creador en el post del 2026-10-02 no era exacta: el detalle vigente está en el reparto.", "Notes that already accompany that archive: the 2026-10-01 replies to @solana, @Raydium, and @WhiteHouse were removed as ambiguous. STUBX is not listed on Raydium and has no relationship, agreement, or announcement with Solana, Raydium, or the White House. The creator-fee sentence in the 2026-10-02 post was not accurate: the current detail is on the supply page.")}</p>
<p>{t("La dirección antigua superb-horse-9036f5.netlify.app es la grabada en los metadatos inmutables. Sigue siendo de STUBX y redirige a stubxai.com conservando la ruta.", "The old address superb-horse-9036f5.netlify.app is the one recorded in the immutable metadata. It is still STUBX and redirects to stubxai.com, keeping the path.")}</p>
"""


def status() -> str:
    return f"""
<h1>{t("Estado y casillas PPM", "Status and PPM boxes")}</h1>
<p class="lede">{t("Estado observado en las fechas de abajo. Esta página no vigila la red ni GitHub al abrirse. Si una CI o un simulacro posterior sale en rojo, la casilla correspondiente se desmarca: eso no se refleja solo.", "State observed on the dates below. This page does not watch the network or GitHub when it opens. If a later CI run or drill goes red, the matching box is unmarked: that does not update by itself.")}</p>
<p class="estado-pill">{t("Completo para las fechas citadas", "Complete for the dates cited")}</p>
{source("token.json agentStatus y la portada en producción. PPM marcada el 2026-10-05. Tests citados del 2026-10-04, commit e4faf6e, 115/115.", "token.json agentStatus and the production home page. PPM marked on 2026-10-05. Tests cited from 2026-10-04, commit e4faf6e, 115/115.")}
<div class="tabla-scroll" tabindex="0"><table>
<caption>{t("Prueba pública mínima: 3 de 4 marcadas · 1 no aplica. No es un 3/3.", "Minimum public proof: 3 of 4 marked · 1 not applicable. It is not 3/3.")}</caption>
<thead><tr><th scope="col">{t("Casilla", "Box")}</th><th scope="col">{t("Estado", "State")}</th><th scope="col">{t("Prueba", "Proof")}</th></tr></thead>
<tbody>
<tr><th scope="row">{t("Wallet del agente", "Agent wallet")}</th><td>{t("No aplica · 2026-10-05", "Not applicable · 2026-10-05")}</td><td>{t(f"El agente no tiene wallet ni claves, por diseño. La wallet del proyecto {PROJECT} la controla el creador y no cuenta para esta casilla.", f"The agent has no wallet and no keys, by design. The creator controls the project wallet {PROJECT} and it does not count for this box.")}</td></tr>
<tr><th scope="row">{t("Logs", "Logs")}</th><td>{t("Marcada · 2026-10-05", "Marked · 2026-10-05")}</td><td>{t("Log de solo añadir, ancla 2026-09-26-000001 confirmada en el bloque de Bitcoin 968752. Ejecución daily-log del 05-10: github.com/stubxai/stubx-agent/actions/runs/37274282121. Marcada no significa que registre todo ni que lo anotado sea cierto.", "Append-only log, anchor 2026-09-26-000001 confirmed in Bitcoin block 968752. daily-log run of 10-05: github.com/stubxai/stubx-agent/actions/runs/37274282121. Marked does not mean it records everything or that the notes are true.")}</td></tr>
<tr><th scope="row">{t("Límites", "Limits")}</th><td>{t("Marcada · 2026-10-05", "Marked · 2026-10-05")}</td><td>{t("CI pública del 05-10: github.com/stubxai/stubx-agent/actions/runs/37278171372, commit a960380. Un test en verde demuestra lo que ese test comprueba, en esa versión.", "Public CI of 10-05: github.com/stubxai/stubx-agent/actions/runs/37278171372, commit a960380. A green test shows what that test checks, in that version.")}</td></tr>
<tr><th scope="row">{t("Kill-switch", "Kill-switch")}</th><td>{t("Marcada · 2026-10-05", "Marked · 2026-10-05")}</td><td>{t("Simulacros en verde: 26-09 (36264436020), 28-09 (36397668286) y 05-10 (37284177840). Solo afecta al agente. No pausa transferencias ni congela cuentas.", "Green drills: 09-26 (36264436020), 09-28 (36397668286), and 10-05 (37284177840). It only affects the agent. It does not pause transfers or freeze accounts.")}</td></tr>
</tbody>
</table></div>
<h2>{t("Estados de un dato", "States of a fact")}</h2>
<ul class="clean">
<li>{t("Vacío: todavía no hay lectura. En Verify, el cuadro espera una dirección.", "Empty: there is no reading yet. On Verify, the box waits for an address.")}</li>
<li>{t("Cargando: «Comprobando». No es un resultado.", "Loading: “Checking”. It is not a result.")}</li>
<li>{t("Completo: la ficha tiene los campos verificados que muestra, con su hora.", "Complete: the card has the verified fields it shows, with its time.")}</li>
<li>{t("Parcial: la ficha existe y dice qué falta. La muestra de holders del 2026-10-08 está en no disponible. Eso no anula lo demás y no se rellena con cero.", "Partial: the card exists and says what is missing. The 2026-10-08 holder sample is unavailable. That does not cancel the rest and it is not filled in with zero.")}</li>
<li>{t("Error o no disponible: dirección no válida, sin ficha, o lectura que no responde. No hay semáforo verde.", "Error or unavailable: the address is not valid, there is no card, or the reading does not respond. There is no green light.")}</li>
</ul>
<p><a href="../verify/index.html">{t("Probar esos estados en Verify", "Try those states in Verify")}</a></p>
"""


def tokenomics() -> str:
    return f"""
<h1>{t("Reparto del suministro", "Supply distribution")}</h1>
<p class="lede">{t("Foto fija. No es un precio, no es un contador en vivo y no es una recomendación.", "A fixed snapshot. It is not a price, it is not a live counter, and it is not a recommendation.")}</p>
{source("Solana, RPC público, getTokenSupply y getTokenAccountsByOwner, commitment finalized. Slots 452931336 a 452931342. Hora: 2026-10-03 14:18:52–14:18:53 (Madrid), publicada como 14:19. token.json supplyDistribution. Relectura el 2026-10-04 12:41 con las mismas cifras.", "Solana public RPC, getTokenSupply and getTokenAccountsByOwner, finalized commitment. Slots 452931336 to 452931342. Time: 2026-10-03 14:18:52–14:18:53 (Madrid), published as 14:19. token.json supplyDistribution. Read again on 2026-10-04 at 12:41 with the same figures.")}
<div class="tabla-scroll" tabindex="0"><table>
<caption>{t("1.000.000.000 STUBX. Las tres filas suman el suministro.", "1,000,000,000 STUBX. The three rows add up to the supply.")}</caption>
<thead><tr><th scope="col">{t("Dónde está", "Where it is")}</th><th scope="col">STUBX</th><th scope="col">%</th></tr></thead>
<tbody>
<tr><th scope="row">{t("Curva pública de Pump.fun", "Pump.fun public curve")}<br><code>{CURVE}</code></th><td>986.122.445,10</td><td>98,61 %</td></tr>
<tr><th scope="row">{t("Wallet creadora", "Creator wallet")}<br><code>{CREATOR}</code></th><td>5.272.727,23</td><td>0,53 %</td></tr>
<tr><th scope="row">{t("Wallet personal del creador", "Creator’s personal wallet")}<br><code>{PERSONAL}</code></th><td>8.604.827,67</td><td>0,86 %</td></tr>
</tbody>
<tfoot><tr><th scope="row">{t("Total", "Total")}</th><td>1.000.000.000,00</td><td>100,00 %</td></tr></tfoot>
</table></div>
<div class="bars" aria-hidden="true">
<div><div class="bar"><span style="width:98.61%"></span></div></div>
<div><div class="bar"><span style="width:0.53%"></span></div></div>
<div><div class="bar"><span style="width:0.86%"></span></div></div>
</div>
<p>{t("Las dos wallets del creador suman 13.877.554,90 STUBX (1,39 %). A esa hora eran todos los STUBX fuera de la curva: no había más holders. Los de la curva no están bloqueados ni reservados. Los del creador tampoco: puede venderlos. Eso es un riesgo.", "The creator’s two wallets add up to 13,877,554.90 STUBX (1.39%). At that time they were all the STUBX outside the curve: there were no other holders. The curve’s tokens are not locked or reserved. The creator’s are not either: they can be sold. That is a risk.")}</p>
<h2>{t("Cómo se obtuvieron", "How they were acquired")}</h2>
<ul class="clean">
<li>{t(f"Wallet creadora {CREATOR}: unos 5,27 M, comprados al crear el token el 2026-09-23 por unos 0,15 SOL, en la curva pública.", f"Creator wallet {CREATOR}: about 5.27 M, bought when the token was created on 2026-09-23 for about 0.15 SOL, on the public curve.")}</li>
<li>{t(f"Wallet personal {PERSONAL}: unos 8,60 M, comprados el 2026-09-28 por unos 0,245 SOL. Transacción 4UJJjAnzvdUKTUQ5VPU8zWHBnHNG6wREndDaTcArZ9Lmwt1MJ7NqZuRX13QWe9aGms39QbHcsErFBPg5kFDs1L8d. Esa compra no se comunicó cuando se hizo; se corrigió el 2026-10-03.", f"Personal wallet {PERSONAL}: about 8.60 M, bought on 2026-09-28 for about 0.245 SOL. Transaction 4UJJjAnzvdUKTUQ5VPU8zWHBnHNG6wREndDaTcArZ9Lmwt1MJ7NqZuRX13QWe9aGms39QbHcsErFBPg5kFDs1L8d. That buy was not disclosed when it happened; it was corrected on 2026-10-03.")}</li>
<li>{t("Sin reserva de equipo, sin preventa, sin venta privada y sin tesorería de tokens. Sin vesting.", "No team reserve, no presale, no private sale, and no token treasury. No vesting.")}</li>
<li>{t("Autoridades de emisión y de congelación revocadas. Eso no hace el token más seguro ni dice nada de su valor.", "Mint and freeze authorities revoked. That does not make the token safer and it says nothing about its value.")}</li>
</ul>
<h2>{t("Wallet del proyecto", "Project wallet")}</h2>
<p><code>{PROJECT}</code></p>
<p>{t("0 STUBX el 2026-10-04 a las 12:24 (Madrid), slot 453228585. No forma parte del suministro ni del gráfico. Wallet normal, no multifirma, creada el 2026-10-04. La controla el creador. El SOL es suyo: no pertenece a los holders, no da derechos y no acepta aportaciones ni donaciones. Solo paga costes del proyecto. Nunca tiene, compra ni vende STUBX. Cada movimiento se publica en un máximo de 7 días. El SOL no pedido se devuelve en un máximo de 30 días, descontando la comisión. Los tokens no pedidos no se tocan. No es la wallet del agente.", "0 STUBX on 2026-10-04 at 12:24 (Madrid), slot 453228585. It is not part of the supply or of the chart. A normal wallet, not a multisig, created on 2026-10-04. The creator controls it. The SOL is theirs: it does not belong to holders, it grants no rights, and it does not accept contributions or donations. It only pays project costs. It never holds, buys, or sells STUBX. Each movement is published within 7 days. Unsolicited SOL is returned within 30 days, minus the network fee. Unsolicited tokens are left untouched. It is not the agent wallet.")}</p>
<p>{t("Movimiento publicado: 2026-10-04, entrada de 0,033020866 SOL desde la wallet personal. 0,031554107 SOL reintegran la comisión de creador del 2026-09-23. 0,001466759 SOL son del creador, para comisiones de red. Salidas: ninguna, en esa publicación. Transacción 4FhEmdch5DnDSN8BXfH7pFP2h9w8o2MdAMw16FcYxkLiaZ3BJEaqEhRf5e4rVPQxYGRt8oz2n3TDi5dzsL726KEy.", "Published movement: 2026-10-04, incoming 0.033020866 SOL from the personal wallet. 0.031554107 SOL reimburses the creator fee of 2026-09-23. 0.001466759 SOL is the creator’s, for network fees. Outgoing: none, in that publication. Transaction 4FhEmdch5DnDSN8BXfH7pFP2h9w8o2MdAMw16FcYxkLiaZ3BJEaqEhRf5e4rVPQxYGRt8oz2n3TDi5dzsL726KEy.")}</p>
<h2>{t("Reglas de las operaciones del creador", "Rules for the creator’s trades")}</h2>
<p>{t("El creador publica aquí todas sus wallets con STUBX y la cantidad de cada una. Cualquier compra, venta o traspaso suyo se comunica en @stubxai y aquí en un máximo de 24 horas, con la transacción, la cantidad, el SOL y la posición resultante. No opera con STUBX mientras prepara un anuncio no publicado, ni desde 24 horas antes hasta 24 horas después de un anuncio del proyecto o de un post con el enlace de negociación, ni para sostener o mover el precio, ni con compras y ventas de ida y vuelta. No anuncia planes de compra ni de venta.", "The creator publishes here every wallet that holds STUBX and the amount in each. Any buy, sale, or transfer of theirs is reported on @stubxai and here within 24 hours, with the transaction, the amount, the SOL, and the resulting position. They do not trade STUBX while preparing an unpublished announcement, nor from 24 hours before until 24 hours after a project announcement or a post with the trading link, nor to support or move the price, nor with round-trip buys and sales. They do not announce buy or sell plans.")}</p>
"""


def community() -> str:
    return f"""
<h1>{t("Comunidad", "Community")}</h1>
<p class="lede">{t("Se puede seguir y comentar sin comprar STUBX. No hay colaboradores anunciados: si no está confirmado aquí, no lo está.", "You can follow and comment without buying STUBX. There are no announced collaborators: if it is not confirmed here, it is not.")}</p>
{source("Canales de token.json official, 2026-10-05. No hay una lista de alianzas. Esta página no promete atención continua.", "Channels from token.json official, 2026-10-05. There is no list of partnerships. This page does not promise continuous attention.")}
<ul class="clean">
<li><a href="https://x.com/stubxai">@stubxai</a> — {t("canal principal. Los posts los prepara un agente distinto del repositorio, con textos aprobados antes. La cuenta se identifica como bot.", "main channel. Posts are prepared by an agent other than the repository one, from texts approved beforehand. The account identifies itself as a bot.")}</li>
<li><a href="https://t.me/stubxai">t.me/stubxai</a> — {t("solo anuncios.", "announcements only.")}</li>
<li><a href="https://farcaster.xyz/stubxai">Farcaster</a> · <a href="https://www.tiktok.com/@stubxai">TikTok</a></li>
<li><a href="mailto:stubxai.hq@gmail.com">stubxai.hq@gmail.com</a></li>
</ul>
<p>{t("No hay Discord. No hay atención 24 horas. Un mensaje directo no es soporte. Las normas antiestafa están en Seguridad.", "There is no Discord. There is no 24-hour support. A direct message is not support. The anti-scam rules are on Security.")}</p>
<p>{t("Los domingos, @stubxai puede destacar un meme de la comunidad, pidiendo permiso antes en una respuesta pública, con crédito. No hay premios, pagos ni tokens por hacer memes. Nadie escribirá por privado por un meme.", "@stubxai may highlight a community meme on Sundays, asking permission first in a public reply, with credit. There are no prizes, payments, or tokens for making memes. Nobody will write in private about a meme.")}</p>
<p><a href="../security/index.html">{t("Lista cerrada y aviso de clones", "Closed list and clone notice")}</a> · <a href="../marca/index.html">{t("Reglas del kit", "Kit rules")}</a></p>
"""


def marca() -> str:
    return f"""
<h1>{t("Marca", "Brand")}</h1>
<p class="lede">{t("Dos piezas ya aprobadas: el personaje y el logo que está en el token. Esta web no los sustituye. La interfaz usa la paleta de Verify (PR 14) para que las herramientas y las páginas se lean como un solo sitio.", "Two pieces already approved: the character and the logo that is on the token. This website does not replace them. The interface uses the Verify palette (PR 14) so the tools and the pages read as one site.")}</p>
<div class="pair">
<figure>
<img src="../logo/stubx-logo-256.png" width="256" height="256" alt="{html.escape("Agente Talón en el logo para agregadores: ticket rosa con gema verde, fondo oscuro. Ilustración con elementos generados con IA.")}">
<figcaption>{t("Logo para agregadores, 1024 px en logo/stubx-logo-1024.png. SHA-256 389982f374a4c057aba84833acd78938d90fc8871152271c5602501265d4216e. No sustituye al logo on-chain.", "Aggregator logo, 1024 px at logo/stubx-logo-1024.png. SHA-256 389982f374a4c057aba84833acd78938d90fc8871152271c5602501265d4216e. It does not replace the on-chain logo.")}</figcaption>
</figure>
<figure>
<img src="../onchain/logo-bafkreiew224xxf6ncagzzew5bfxlc6hejrib6jmxx66kxdrv5pkeoavd5e.png" width="256" height="256" alt="{html.escape("Logo pixel art grabado en el token STUBX, copia de los mismos bytes que el CID on-chain.")}">
<figcaption>{t("Logo on-chain, pixel art, copia de los mismos bytes. CID bafkreiew224xxf6ncagzzew5bfxlc6hejrib6jmxx66kxdrv5pkeoavd5e. SHA-256 96d6b97b97cd100d9c92dd096eb178e44c501f2597bfbcab8e35ebd44702a3e9. Inmutable.", "On-chain logo, pixel art, a copy of the same bytes. CID bafkreiew224xxf6ncagzzew5bfxlc6hejrib6jmxx66kxdrv5pkeoavd5e. SHA-256 96d6b97b97cd100d9c92dd096eb178e44c501f2597bfbcab8e35ebd44702a3e9. Immutable.")}</figcaption>
</figure>
</div>
<h2>{t("Personaje", "Character")}</h2>
<p>{t("Un ticket rosa en pixel art, borde perforado, ojos cuadrados, boca recta y una gema verde. Seco y escéptico. La gema significa que el prototipo está en pie. No significa «aprobado para invertir». El personaje se generó con IA. Lema: No stub, no story.", "A pink pixel-art ticket, perforated edge, square eyes, a straight mouth, and a green gem. Dry and skeptical. The gem means the prototype is standing. It does not mean “approved to invest”. The character was generated with AI. Motto: No stub, no story.")}</p>
<h2>{t("Paleta de la interfaz", "Interface palette")}</h2>
<p>{t("Fondo #071422, panel #10243f, texto #f4f7fb, línea #8eaccf, acento #ff2d6f. Es la paleta de los borradores de Verify y Lab (PR 14, 2026-10-09), para que el semáforo y las páginas usen los mismos componentes. El kit de memes v0.2 conserva sus propios colores: rosa #fb437f, esmeralda #1beb91, azul noche #05122e.", "Background #071422, panel #10243f, text #f4f7fb, line #8eaccf, accent #ff2d6f. It is the palette of the Verify and Lab drafts (PR 14, 2026-10-09), so the traffic light and the pages use the same components. The meme kit v0.2 keeps its own colors: pink #fb437f, emerald #1beb91, night blue #05122e.")}</p>
<h2>{t("Kit de memes 0.2 · 2026-09-27", "Meme kit 0.2 · 2026-09-27")}</h2>
<p><a href="../kit/stubx-kit-memes-v0.2.zip">{t("Descargar el zip (2,9 MB)", "Download the zip (2.9 MB)")}</a>. SHA-256 799e0371bdfd4619d61d9e29206ca7eb020e78a01981bb11e73a412405091461. {t("28 archivos. Licencia propia dentro del zip (LICENCIA.md). Las fuentes Silkscreen e Inter van con SIL OFL 1.1. El código del agente es MIT.", "28 files. Its own license inside the zip (LICENCIA.md). The Silkscreen and Inter fonts ship with SIL OFL 1.1. The agent code is MIT.")}</p>
<p>{t("Plantillas: T01 Pide el talón, T02 Talón opina, T05 Escalera de pruebas, T06 Ticket PPM, T07 Reacción, T08 Glosario Talón. El pie «Memecoin experimental · puedes perderlo todo · no es consejo de inversión» se deja visible.", "Templates: T01 Pide el talón, T02 Talón opina, T05 Escalera de pruebas, T06 Ticket PPM, T07 Reacción, T08 Glosario Talón. The footer “Memecoin experimental · puedes perderlo todo · no es consejo de inversión” stays visible.")}</p>
<h2>{t("Sí", "Yes")}</h2>
<ul class="clean">
<li>{t("Humor sobre pruebas, transparencia y agentes de IA.", "Humor about proofs, transparency, and AI agents.")}</li>
<li>{t("Consejos antiestafa: leer el handle entero y no firmar lo que no se entiende.", "Anti-scam advice: read the whole handle and do not sign what you do not understand.")}</li>
<li>{t("Usar a Talón tal cual y publicar desde tu cuenta.", "Use Talón as-is and post from your own account.")}</li>
</ul>
<h2>{t("No", "No")}</h2>
<ul class="clean">
<li>{t("Precio, subidas, «100x», cohetes, lunas ni llamadas a comprar o vender.", "Price, pumps, “100x”, rockets, moons, or calls to buy or sell.")}</li>
<li>{t("Poner la CA en un meme. La única CA está en esta web y en @stubxai.", "Putting the CA in a meme. The only CA is on this website and on @stubxai.")}</li>
<li>{t("Hacerse pasar por STUBX o usar el avatar como foto de un perfil.", "Impersonating STUBX or using the avatar as a profile photo.")}</li>
<li>{t("Sorteos, airdrops, whitelists o pedir dinero, datos o firmas.", "Giveaways, airdrops, whitelists, or asking for money, data, or signatures.")}</li>
<li>{t("Atacar a personas o proyectos reales por su nombre.", "Attacking real people or projects by name.")}</li>
</ul>
<p>{t("Puedes usar el kit para memes de fans sin ánimo de lucro, gratis, si cumples las reglas. No puedes venderlo ni usarlo en anuncios de pago sin permiso escrito de STUBX. No te hace representante. El permiso se puede retirar.", "You can use the kit for non-commercial fan memes, free, if you follow the rules. You cannot sell it or use it in paid ads without written permission from STUBX. It does not make you a representative. Permission can be withdrawn.")}</p>
"""


def build_page() -> str:
    return f"""
<h1>{t("Versiones", "Versions")}</h1>
<p class="lede">{t("Lo hecho lleva fecha. Lo que sigue es un objetivo: puede cambiar y no es una promesa. No incluye precios, listados ni liquidez.", "What is done has a date. What follows is a target: it can change and it is not a promise. It does not include prices, listings, or liquidity.")}</p>
{source("Lista de la portada en producción, con las fechas que esa página ya publicaba el 2026-10-05.", "List from the production home page, with the dates that page already published on 2026-10-05.")}
<h2>{t("Hecho", "Done")}</h2>
<ul class="clean">
<li>{t("2026-09-23. Token creado. Autoridades de emisión y de congelación revocadas.", "2026-09-23. Token created. Mint and freeze authorities revoked.")}</li>
<li>{t("2026-09-26. Repositorio público, tests, límites y primer simulacro del kill-switch.", "2026-09-26. Public repository, tests, limits, and the first kill-switch drill.")}</li>
<li>{t("2026-09-26 a 2026-10-03. Registro diario del workflow, en los días que LOGS.md y la portada ya contaron.", "2026-09-26 to 2026-10-03. Daily workflow log, on the days LOGS.md and the home page already counted.")}</li>
<li>{t("2026-09-28. Primer simulacro semanal programado en verde. Dominio stubxai.com registrado.", "2026-09-28. First scheduled weekly drill, green. Domain stubxai.com registered.")}</li>
<li>{t("Octubre 2026. stubxai.com es la web oficial. La dirección antigua redirige con 301.", "October 2026. stubxai.com is the official website. The old address redirects with a 301.")}</li>
<li>{t("2026-10-03. Revisión manual de la parte técnica de la PPM. Ninguna casilla marcada todavía ese día.", "2026-10-03. Manual review of the technical part of the PPM. No box marked yet that day.")}</li>
<li>{t("2026-10-05. Casillas Logs, Límites y Kill-switch marcadas. Wallet del agente pasa a no aplica. En la portada en producción este punto seguía en la lista de objetivos aunque el texto ya decía que estaba marcado: aquí queda en hecho, con los mismos hechos.", "2026-10-05. Logs, Limits, and Kill-switch boxes marked. The agent wallet becomes not applicable. On the production home page this item was still in the target list even though the sentence already said it was marked: here it sits under done, with the same facts.")}</li>
</ul>
<h2>{t("Objetivo, no promesa", "Target, not a promise")}</h2>
<ul class="clean">
<li>{t("Proteger más el repositorio: rama principal con reglas y enlace a la web. Preparado, sin aplicar, según la portada del 2026-10-05.", "Protect the repository further: main branch rules and a link to the website. Prepared, not applied, according to the home page of 2026-10-05.")}</li>
<li>{t("Hitos pequeños con problema, cambio, prueba, límites y una captura con fecha.", "Small milestones with a problem, a change, a proof, limits, and a dated capture.")}</li>
</ul>
<p>{t("El tablero de producto, con lo que está en revisión y lo que sigue en propuesta, es otra página. No mezcla estas fechas con esas fichas.", "The product board, with what is in review and what is still a proposal, is another page. It does not mix these dates with those cards.")}</p>
<p><a href="../tablero/index.html">{t("Abrir el tablero", "Open the board")}</a></p>
"""


def avances() -> str:
    return f"""
<h1>{t("Avances", "Progress")}</h1>
<p>{t("El plan del 2026-10-09 llamó /avances al tablero. En esta vista previa el tablero está en Tablero, con el mismo registro. No hay un segundo tablero.", "The 2026-10-09 plan called the board /avances. In this preview the board is on Board, with the same record. There is not a second board.")}</p>
<p><a class="primary" href="../tablero/index.html">{t("Abrir el tablero", "Open the board")}</a></p>
"""


def slot(title_es: str, title_en: str, body_es: str, body_en: str, anchor: str) -> str:
    return f"""
<article class="slot">
<p class="estado-pill">{t("No construido · 2026-10-09", "Not built · 2026-10-09")}</p>
<h1>{t(title_es, title_en)}</h1>
<p>{t(body_es, body_en)}</p>
<p>{t("No hay botón de crear, guardar, exportar ni enviar. Cuando exista, usará esta navegación y estos estilos.", "There is no create, save, export, or send button. When it exists, it will use this navigation and these styles.")}</p>
<p><a href="../tablero/index.html#{anchor}">{t("Registro en el tablero", "Record on the board")}</a></p>
</article>
"""


def md_section(text: str) -> str:
    es, en = text.split("## English", 1)
    es = es.split("## Español", 1)[-1].strip()

    def block(chunk: str, lang: str) -> str:
        parts = []
        for para in re.split(r"\n\s*\n", chunk.strip()):
            line = html.escape(para.strip())
            line = re.sub(r"`([^`]+)`", r"<code>\1</code>", line)
            if not line:
                continue
            parts.append(f"<p>{line}</p>")
        klass = "es" if lang == "es" else "en"
        return f'<div class="lang {klass}" lang="{lang}">{"".join(parts)}</div>'

    return block(es, "es") + block(en, "en")


def aprender() -> str:
    glossary = json.loads((ROOT / "modules/lab/glossary.json").read_text(encoding="utf-8"))
    revision = json.loads((ROOT / "modules/lab/revision.json").read_text(encoding="utf-8"))
    guides = json.loads((ROOT / "modules/lab/guides.json").read_text(encoding="utf-8"))
    cards = []
    for entry in glossary["entries"]:
        cards.append(
            "<article class=\"card\">"
            f"<h3>{t(html.escape(entry['term']['es']), html.escape(entry['term']['en']))}</h3>"
            f"<p>{t(html.escape(entry['means']['es']), html.escape(entry['means']['en']))}</p>"
            f"<p>{t('Ejemplo. ' + html.escape(entry['example']['es']), 'Example. ' + html.escape(entry['example']['en']))}</p>"
            f"<p>{t('No permite concluir: ' + html.escape(entry['doesNotConclude']['es']), 'It does not let you conclude: ' + html.escape(entry['doesNotConclude']['en']))}</p>"
            "</article>"
        )
    guide_html = []
    for guide in guides["guides"]:
        raw = (ROOT / "modules/lab/guides" / guide["file"]).read_text(encoding="utf-8")
        guide_html.append(
            f"<article class=\"card\"><h2>{t(html.escape(guide['title']['es']), html.escape(guide['title']['en']))}</h2>{md_section(raw)}</article>"
        )
    note = html.escape(revision["enStatus"])
    return f"""
<h1>{t("Aprender", "Learn")}</h1>
<p class="lede">{t("Glosario y tres guías de la misión, versión 1.0.0 del 2026-10-09. Es texto, no una aplicación aparte.", "Glossary and three mission guides, version 1.0.0 of 2026-10-09. It is text, not a separate app.")}</p>
<p class="source">{t(f"Inglés: {note} Si una frase no coincide, manda el español. Fuente: lab/library de la PR 14, commit 4161ee6.", f"English: {note} If a sentence does not match, Spanish prevails. Source: lab/library from PR 14, commit 4161ee6.")}</p>
<h2>{t("Glosario", "Glossary")}</h2>
<div class="grid-2">{''.join(cards)}</div>
<h2>{t("Guías", "Guides")}</h2>
{''.join(guide_html)}
<p><a href="../lab/index.html">{t("Usar estos términos en la misión", "Use these terms in the mission")}</a></p>
"""


def not_found() -> str:
    return f"""
<h1>{t("Esta página no está", "This page is not here")}</h1>
<p>{t("La vista previa no tiene esa ruta. La portada sigue en el inicio.", "The preview does not have that route. The home page is still at the start.")}</p>
<p><a class="primary" href="index.html">{t("Ir al inicio", "Go to the start")}</a></p>
"""


def headers() -> str:
    return """# Vista previa STUBX web v2. No es el despliegue de producción.
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Cross-Origin-Opener-Policy: same-origin
  X-Robots-Tag: noindex, nofollow

/assets/*
  Cache-Control: public, max-age=3600
/fonts/*
  Cache-Control: public, max-age=86400
/onchain/*
  Cache-Control: public, max-age=86400
/token.json
  Content-Type: application/json; charset=utf-8
  Cache-Control: public, max-age=300
/.well-known/security.txt
  Content-Type: text/plain; charset=utf-8
"""


def redirects() -> str:
    return """# Preparados para cuando Cristian autorice el cambio. No están activos en producción.
/canales            /security/   301
/canales/           /security/   301
/canales.html       /security/   301
/riesgos            /risks/      301
/riesgos/           /risks/      301
/riesgos.html       /risks/      301
/pruebas            /proofs/     301
/pruebas/           /proofs/     301
/pruebas.html       /proofs/     301
/marca              /marca/      301
/marca.html         /marca/      301
/archivo            /proofs/#archivo  301
/archivo.html       /proofs/#archivo  301
/docs               /proofs/#archivo  301
/docs/              /proofs/#archivo  301
/docs.html          /proofs/#archivo  301
/.well-known/security.txt  /security.txt  200
"""


def manifest() -> str:
    return json.dumps(
        {
            "name": "STUBX",
            "short_name": "STUBX",
            "lang": "es",
            "start_url": "./",
            "display": "browser",
            "background_color": "#071422",
            "theme_color": "#071422",
            "icons": [
                {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
                {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
            ],
        },
        ensure_ascii=False,
        indent=2,
    ) + "\n"


def main() -> None:
    css = (ROOT / "assets/tool.css").read_text(encoding="utf-8") + "\n" + (ROOT / "assets/site-extra.css").read_text(encoding="utf-8")
    (ROOT / "assets/site.css").write_text(css, encoding="utf-8")
    (ROOT / "_headers").write_text(headers(), encoding="utf-8")
    (ROOT / "_redirects").write_text(redirects(), encoding="utf-8")
    (ROOT / "site.webmanifest").write_text(manifest(), encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        "# Vista previa. Las páginas también llevan noindex.\nUser-agent: *\nAllow: /\n",
        encoding="utf-8",
    )

    write_page("index.html", "home", "STUBX · Contrasta la dirección", "STUBX · Check the address", "Vista previa de STUBX. Comprueba la dirección con fichas fechadas. No es consejo de inversión.", "STUBX preview. Check the address with dated cards. Not investment advice.", home())
    write_page("verify/index.html", "verify", "STUBX Verify", "STUBX Verify", "Comprueba una dirección con las fichas del 2026-10-08.", "Check an address with the 2026-10-08 cards.", prepare_tool("verify"), ["assets/verify.js"], True)
    write_page("lab/index.html", "lab", "STUBX Lab", "STUBX Lab", "Misión para distinguir el mint del registro de un clon.", "A mission to tell the registry mint from a clone.", prepare_tool("lab"), ["assets/mission.js"], True)
    board = prepare_tool("tablero")
    write_page("tablero/index.html", "tablero", "STUBX · Tablero", "STUBX · Board", "Tablero de construcción con el registro del 2026-10-09.", "Construction board with the 2026-10-09 record.", board)
    write_page("methodology/index.html", "methodology", "STUBX · Metodología", "STUBX · Methodology", "Fuentes, fechas y límites de lo que esta web afirma.", "Sources, dates, and limits of what this website claims.", methodology())
    write_page("security/index.html", "security", "STUBX · Seguridad", "STUBX · Security", "Contrato, canales oficiales y aviso de clones.", "Contract, official channels, and clone notice.", security())
    write_page("risks/index.html", "risks", "STUBX · Riesgos", "STUBX · Risks", "Riesgos de STUBX en lenguaje llano.", "STUBX risks in plain language.", risks())
    write_page("legal/index.html", "legal", "STUBX · Legal", "STUBX · Legal", "Aviso, privacidad y contacto.", "Notice, privacy, and contact.", legal())
    write_page("proofs/index.html", "proofs", "STUBX · Pruebas", "STUBX · Proofs", "Pruebas fechadas y archivo histórico.", "Dated proofs and the historical archive.", proofs())
    write_page("status/index.html", "status", "STUBX · Estado", "STUBX · Status", "Casillas PPM con fecha y fuente.", "PPM boxes with date and source.", status())
    write_page("tokenomics/index.html", "tokenomics", "STUBX · Reparto", "STUBX · Supply", "Reparto del suministro a 2026-10-03.", "Supply distribution as of 2026-10-03.", tokenomics())
    write_page("community/index.html", "community", "STUBX · Comunidad", "STUBX · Community", "Canales y participación sin comprar.", "Channels and participation without buying.", community())
    write_page("marca/index.html", "marca", "STUBX · Marca", "STUBX · Brand", "Personaje, logos y reglas del kit.", "Character, logos, and kit rules.", marca())
    write_page("build/index.html", "build", "STUBX · Versiones", "STUBX · Versions", "Lo hecho y lo que sigue siendo un objetivo.", "What is done and what is still a target.", build_page())
    write_page("avances/index.html", "avances", "STUBX · Avances", "STUBX · Progress", "El tablero vive en /tablero.", "The board lives at /tablero.", avances())
    write_page("aprender/index.html", "aprender", "STUBX · Aprender", "STUBX · Learn", "Glosario y guías de la misión, 2026-10-09.", "Mission glossary and guides, 2026-10-09.", aprender())
    write_page(
        "studio/index.html",
        "studio",
        "STUBX · Studio",
        "STUBX · Studio",
        "Studio no está construido.",
        "Studio is not built.",
        slot("Studio", "Studio", "No hay editor, catálogo activo ni exportación de imágenes. U02 es una propuesta del 2026-10-09.", "There is no editor, no active catalog, and no image export. U02 is a proposal from 2026-10-09.", "tarea-U02"),
    )
    write_page(
        "cuaderno/index.html",
        "cuaderno",
        "STUBX · Cuaderno",
        "STUBX · Notebook",
        "El cuaderno no está construido.",
        "The notebook is not built.",
        slot("Cuaderno", "Notebook", "No hay lista de consultas, ni importar, ni exportar, ni borrar notas. U05 es una propuesta.", "There is no query list, no import, no export, and no way to delete notes. U05 is a proposal.", "tarea-U05"),
    )
    write_page(
        "contribuir/index.html",
        "contribuir",
        "STUBX · Contribuir",
        "STUBX · Contribute",
        "Las contribuciones no están abiertas.",
        "Contributions are not open.",
        slot("Contribuir", "Contribute", "No hay canal, plantilla descargable ni formulario. No se piden archivos ni datos. U04 es una propuesta, sin premios.", "There is no channel, no downloadable template, and no form. Files and data are not being requested. U04 is a proposal, with no prizes.", "tarea-U04"),
    )
    write_page("404.html", "home", "STUBX · No está", "STUBX · Not here", "Esa ruta no está en la vista previa.", "That route is not in the preview.", not_found())
    print("web v2 escrita")


if __name__ == "__main__":
    main()
