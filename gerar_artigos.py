#!/usr/bin/env python3
"""
Gera artigos.json a partir das Issues do repositório.

Cada artigo é uma Issue aberta pelo dono do repositório com o formulário
"Novo artigo" (.github/ISSUE_TEMPLATE/artigo.yml).
- Publicar: criar a Issue pelo formulário.
- Editar: editar a Issue.
- Despublicar: fechar a Issue.
"""
import datetime as dt
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

import markdown
import nh3
import requests

ARQUIVO = Path(__file__).with_name("artigos.json")
REPO = os.environ.get("GITHUB_REPOSITORY", "thalissonramos/thalissonramos.github.io")
DONO = REPO.split("/")[0]
TOKEN = os.environ.get("GITHUB_TOKEN", "")

EDITORIAS = {
    "jurisprudência": "jurisprudencia", "cível": "civel", "família": "familia",
    "sucessões": "sucessoes", "penal": "penal", "processo penal": "penal",
    "tribunal do júri": "penal", "consumidor": "consumidor",
    "prática forense": "pratica", "advocacia": "pratica",
}
TAGS = {"p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote",
        "h2", "h3", "h4", "hr", "img", "figure", "figcaption", "table", "thead", "tbody",
        "tr", "th", "td", "code", "pre", "sup", "sub"}
ATRIBUTOS = {"a": {"href", "title"}, "img": {"src", "alt", "title", "width", "height"},
             "th": {"align"}, "td": {"align"}}


def slug(txt):
    txt = unicodedata.normalize("NFKD", txt)
    txt = "".join(c for c in txt if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", "-", txt).strip("-")[:70] or "artigo"


def secoes(corpo):
    """Lê o corpo gerado pelo formulário: '### Rótulo' seguido do conteúdo."""
    partes, atual = {}, None
    for linha in (corpo or "").replace("\r\n", "\n").split("\n"):
        m = re.match(r"^###\s+(.+?)\s*$", linha)
        if m:
            atual = m.group(1).strip().lower()
            partes[atual] = []
        elif atual is not None:
            partes[atual].append(linha)
    limpo = {}
    for k, v in partes.items():
        t = "\n".join(v).strip()
        limpo[k] = "" if t in ("_No response_", "_Sem resposta_", "None") else t
    return limpo


def campo(sec, *nomes):
    for k, v in sec.items():
        if any(k.startswith(n) for n in nomes):
            return v
    return ""


def primeira_imagem(txt):
    m = re.search(r'!\[[^\]]*\]\((https?://[^)\s]+)', txt or "") or \
        re.search(r'<img[^>]+src="(https?://[^"]+)"', txt or "")
    return m.group(1) if m else None


def html_artigo(txt):
    html = markdown.markdown(txt, extensions=["extra", "sane_lists", "nl2br"])
    html = nh3.clean(html, tags=TAGS, attributes=ATRIBUTOS, link_rel="noopener noreferrer")
    return html


def buscar_issues():
    cab = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if TOKEN:
        cab["Authorization"] = f"Bearer {TOKEN}"
    issues, pagina = [], 1
    while True:
        r = requests.get(f"https://api.github.com/repos/{REPO}/issues",
                         params={"state": "open", "creator": DONO, "per_page": 100, "page": pagina},
                         headers=cab, timeout=30)
        r.raise_for_status()
        lote = [i for i in r.json() if "pull_request" not in i]
        issues += lote
        if len(r.json()) < 100:
            return issues
        pagina += 1


def main():
    try:
        issues = buscar_issues()
    except Exception as e:  # sem acesso à API, mantém os artigos atuais
        print(f"Não foi possível ler as Issues: {e}")
        return 0
    artigos, usados = [], set()
    for iss in issues:
        nomes_labels = {l["name"].lower() for l in iss.get("labels", [])}
        sec = secoes(iss.get("body"))
        texto = campo(sec, "texto")
        if "artigo" not in nomes_labels and not texto:
            continue  # Issue comum, não é artigo
        if not texto:
            texto = iss.get("body") or ""
        titulo = re.sub(r"^\s*\[artigo\]\s*", "", iss["title"], flags=re.I).strip()
        ed_txt = campo(sec, "editoria").strip().lower()
        capa = primeira_imagem(campo(sec, "foto de capa", "imagem de capa")) or primeira_imagem(texto)
        data_pub = campo(sec, "data")
        m = re.match(r"(\d{2})/(\d{2})/(\d{4})", data_pub or "")
        data = f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else iss["created_at"][:10]
        ident = slug(titulo)
        if ident in usados:
            ident = f"{ident}-{iss['number']}"
        usados.add(ident)
        palavras = len(re.sub(r"<[^>]+>|!\[[^\]]*\]\([^)]*\)", " ", texto).split())
        artigos.append({
            "id": ident,
            "numero": iss["number"],
            "titulo": titulo,
            "linha_fina": campo(sec, "linha fina", "resumo"),
            "editoria": EDITORIAS.get(ed_txt, ""),
            "editoria_nome": campo(sec, "editoria").strip(),
            "data": data,
            "atualizado": iss["updated_at"],
            "capa": capa,
            "leitura": max(1, round(palavras / 200)),
            "html": html_artigo(texto),
        })
    artigos.sort(key=lambda a: (a["data"], a["numero"]), reverse=True)
    saida = {"gerado": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"), "artigos": artigos}
    ARQUIVO.write_text(json.dumps(saida, ensure_ascii=False, indent=1), "utf-8")
    print(f"{len(artigos)} artigo(s) publicados.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
