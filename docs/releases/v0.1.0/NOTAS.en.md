# STUBX 0.1.0

These notes are dated 2026-10-09. The `@stubx/agents` package version is `0.1.0`. The `v0.1.0` tag is described in [TAG.md](TAG.md) and has not been created.

This is not an audit and not investment advice. High-risk crypto · You could lose everything · Not investment advice.

English wording of product pages that came from the Lab library is still pending human review. If a sentence does not match, the Spanish version prevails. These release notes are written in both languages on purpose.

## What you can do today, in this repository

Four pieces. All of them read or teach. None of them asks for a wallet, a seed phrase, or a payment.

1. **The agent** (`src/`). A closed list of actions. It has no keys. It does not sign, custody, or send transactions. It does not call mainnet.
2. **Verify**. Reads public mint data and writes a card with a date and a source. On the website, the demo uses cards that are already stored. Opening the page does not query the network.
3. **Lab**. A short mission that practices the difference between a token’s name and its address. Progress stays in the browser.
4. **Web v2**. The same pages, in Spanish and in English, with the same navigation. Web v2 was deployed to stubxai.com on 2026-10-09, outside these notes. These notes do not deploy or change it.

## Verify

- Directory `verify/`. The command reads public data only when someone runs it on purpose. Read methods sit on a closed list. If a fact does not arrive, the card leaves it unavailable. It does not invent a zero or a revoked authority.
- Dated examples live in `verify/examples/2026-10-08/` and `verify/examples/2026-10-09/`. The official STUBX mint card was read again on 2026-10-09.
- `web/v2/verify/` takes a pasted address and compares it with those cards. If the address is not valid, or it is not on the list, the page says so. The list is not a census.

A card does not say whether a token is good, safe, or a good purchase.

## Lab

- Mission 1 in `lab/` and `web/v2/lab/`: five steps, short questions, a button to continue (it does not advance by itself), and a way to start again.
- A glossary and three guides: identify the token, read permissions, and understand the curve. The English text of that library is written and pending human review. If a sentence does not match, Spanish prevails.
- Points are local progress. They are not money and they are not a certificate.

## Web v2

- It lives in `web/v2/`. Home, Verify, Lab, board, methodology, security, risks, legal, proofs, status, supply, channels, brand, versions, learn, and the post archive.
- The language switch is in the header. The legal footer is the same on every page of `web/v2/`. Web v2 was deployed to stubxai.com on 2026-10-09, outside these notes. These notes do not deploy or change it.
- `web/v2/` is the website published on stubxai.com since 2026-10-09 (merge `ed1c7759`). `web/current/` is the earlier copy, kept so it can be put back.
- Studio, the notebook, and the `noindex` of specific routes are not fixed in this note. If the Studio pull request or the notebook pull request merges before the tag, this paragraph has to be rewritten to match what stubxai.com serves that day.

## Indexing

Done on 2026-10-09:

- `web/v2/robots.txt` allows crawling and points at `https://stubxai.com/sitemap.xml`. It asks the AI training crawlers named in that file not to use the content.
- `web/v2/sitemap.xml` lists the public URLs, with a `lastmod` date.
- Public pages in `web/v2/` do not carry `noindex`. `X-Robots-Tag` does apply to the Lab service worker, the JSON files, the manifest, and the 404 page.
- `web/v2/` is the website published on stubxai.com since 2026-10-09 (merge `ed1c7759`). `web/current/` is the earlier copy, kept so it can be put back. Web v2 was deployed to stubxai.com on 2026-10-09, outside these notes. These notes do not deploy or change it.

## What this version does not do

- It does not create the tag.
- It does not merge anything by itself and it does not deploy.
- It does not connect wallets.
- This repository inserts no visit measurement or cookies. Cloudflare Web Analytics must be off in the zone dashboard (no beacon in the HTML served on 2026-10-10).

The dated detail of each change is in [CHANGELOG.md](../../../CHANGELOG.md).
