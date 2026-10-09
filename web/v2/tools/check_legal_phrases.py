#!/usr/bin/env python3
"""Comprueba que cada frase de seguridad o legal de web/current tiene equivalente en web/v2.

Una frase cuenta si, ya normalizada, aparece en v2, o si equivalencias-seguridad.json
apunta a otra frase que sí aparece. No es una lista blanca de reglas: cada destino
tiene que estar en el texto generado.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
CURRENT = REPO / "web/current"
V2 = ROOT
PAIRS = Path(__file__).with_name("equivalencias-seguridad.json")

SOURCES = [
    "index.html",
    "canales.html",
    "riesgos.html",
    "pruebas.html",
    "marca.html",
]


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip = 0
        self.capture = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.parts.append(" ")
        if tag in {"script", "style", "svg", "nav", "header", "footer"}:
            self.skip += 1
        if tag in {"p", "li", "h1", "h2", "h3", "figcaption", "td", "th"} and self.skip == 0:
            self.capture += 1
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "svg", "nav", "header", "footer"} and self.skip:
            self.skip -= 1
        if tag in {"p", "li", "h1", "h2", "h3", "figcaption", "td", "th"} and self.capture and self.skip == 0:
            self.capture -= 1
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self.skip == 0 and self.capture:
            self.parts.append(data)


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\u00a0", " ").replace("\u202f", " ")
    text = text.replace("«", "").replace("»", "").replace("“", "").replace("”", "").replace("’", "'")
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def sentences_from(html: str) -> list[str]:
    parser = TextExtractor()
    parser.feed(html)
    raw = "".join(parser.parts)
    found: list[str] = []
    for chunk in re.split(r"\n+", raw):
        chunk = re.sub(r"\s+", " ", chunk).strip()
        if not chunk:
            continue
        pieces = re.split(r"(?<=[.!?])\s+", chunk)
        for piece in pieces:
            words = re.findall(r"\w+", piece, flags=re.UNICODE)
            if len(words) < 8:
                continue
            if not re.search(
                r"riesgo|mica|comisi[oó]n|creador|pump|clon|semilla|clave|wallet|exchange|custodia|"
                r"logo|metadato|ipfs|autoridad|consejo|inversi[oó]n|cnmv|garant|estafa|privado|"
                r"pr[aá]ctica|oficial|congel|pausa|aportaci|donaci|vesting|multifirma|holder|"
                r"cripto|solana|token|\bca\b|aviso|legal|privacidad|edad|pa[ií]s",
                piece,
                flags=re.IGNORECASE,
            ):
                continue
            found.append(piece)
    return found


def v2_corpus() -> str:
    chunks: list[str] = []
    for path in V2.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".json", ".txt", ".md"}:
            continue
        if "node_modules" in path.parts:
            continue
        chunks.append(path.read_text(encoding="utf-8", errors="replace"))
    return normalize("\n".join(chunks))


def long_words(text: str) -> list[str]:
    return re.findall(r"[a-záéíóúüñ0-9]{6,}", text)


def covered(sentence: str, words: set[str]) -> bool:
    """La redacción puede cambiar. Si faltan las palabras largas, la frase no tiene equivalente."""
    own = long_words(sentence)
    if not own:
        return False
    hit = sum(1 for word in own if word in words)
    need = 1.0 if len(own) < 4 else 0.8
    return hit / len(own) >= need


def main() -> int:
    pairs = json.loads(PAIRS.read_text(encoding="utf-8")) if PAIRS.exists() else []
    mapped = {normalize(item["current"]): item["v2"] for item in pairs}
    corpus = v2_corpus()
    words = set(long_words(corpus))
    missing: list[str] = []
    seen: set[str] = set()
    for name in SOURCES:
        html = (CURRENT / name).read_text(encoding="utf-8")
        for sentence in sentences_from(html):
            key = normalize(sentence)
            if key in seen:
                continue
            seen.add(key)
            if key in corpus or covered(key, words):
                continue
            target = mapped.get(key)
            if target and (normalize(target) in corpus or covered(normalize(target), words)):
                continue
            missing.append(sentence)
    if missing:
        sys.stderr.write(f"{len(missing)} frases de web/current sin equivalente en web/v2:\n")
        for sentence in missing:
            sys.stderr.write(f"- {sentence}\n")
        return 1
    print(f"frases de seguridad o legal cubiertas: {len(seen)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
