#!/usr/bin/env python3
"""
Robô de atualização do Diário Jurídico Ramos Advocacia.

Coleta manchetes de fontes oficiais e especializadas (STF, STJ, TJMT, CNJ,
ConJur, Agência Brasil), classifica por editoria e grava noticias.json.
Roda automaticamente pelo GitHub Actions (ver .github/workflows/atualizar.yml).
Se uma fonte falhar, as demais seguem normalmente.
"""
import datetime as dt
import hashlib
import html
import json
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

import feedparser
import requests
from bs4 import BeautifulSoup

ARQUIVO = Path(__file__).with_name("noticias.json")
FUSO = dt.timezone(dt.timedelta(hours=-4))  # Cuiabá
MAX_ITENS = 400
MAX_DIAS = 30
POR_FONTE = 25
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 DiarioJuridicoRamos/1.0",
    "Accept-Language": "pt-BR,pt;q=0.9",
}

FONTES = [
    {"id": "stf", "nome": "STF", "tipo": "rss", "tribunal": True, "urls": [
        "https://noticias.stf.jus.br/feed/",
        "https://noticias.stf.jus.br/feed/?post_type=postsnoticias",
        "https://portal.stf.jus.br/rss/noticias.asp",
        "https://www.stf.jus.br/portal/RSS/noticiaRss.asp?codigo=1",
    ]},
    {"id": "stj", "nome": "STJ", "tipo": "rss", "tribunal": True, "urls": [
        "https://res.stj.jus.br/hrestp-c-portalp/RSS.xml",
        "https://feeds.feedburner.com/STJNoticias",
    ]},
    {"id": "tjmt", "nome": "TJMT", "tipo": "tjmt", "tribunal": True, "urls": [
        "https://www.tjmt.jus.br/noticias",
        "https://www.tjmt.jus.br/rss",
    ]},
    {"id": "cnj", "nome": "CNJ", "tipo": "rss", "tribunal": False, "urls": [
        "https://www.cnj.jus.br/feed/",
    ]},
    {"id": "conjur", "nome": "ConJur", "tipo": "rss", "tribunal": False, "urls": [
        "https://www.conjur.com.br/rss.xml",
    ]},
    {"id": "agbrasil", "nome": "Agência Brasil", "tipo": "rss", "tribunal": False,
     "filtrar": True, "urls": [
        "https://agenciabrasil.ebc.com.br/rss/justica/feed.xml",
        "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
    ]},
]

# Editorias (palavras sem acento, em minúsculas). A ordem define a prioridade.
EDITORIAS = {
    "sucessoes": r"\b(heranc|herdeir|inventari|testament|espolio|itcmd|sucess|legitima|meacao|partilha de bens do falecido|de cujus)",
    "familia": r"\b(divorci|guarda|pensao aliment|alimentos|aliment(ante|ando)|uniao estavel|paternidade|maternidade|alienacao parental|adocao|adotad|casament|conjug|filiacao|socioafetiv|curatela|interdicao|convivencia familiar|familia)",
    "penal": r"\b(penal|crime|criminos|prisao|preso|presa|reu |re |homicidi|trafico|habeas corpus|juri|maria da penha|violencia domestica|feminicidi|estupro|furto|roubo|estelionat|denuncia|pena |condenad|absolvi|execucao penal|delegad|inquerito|lavagem|organizacao criminosa|medida protetiva|flagrante|preventiva)",
    "consumidor": r"\b(consumidor|cdc|procon|plano de saude|operadora|companhia aerea|voo|bagagem|negativacao|serasa|cadastro de inadimplentes|banco|bancari|cartao de credito|emprestimo consignado|tarifa|fornecedor|propaganda enganosa|superendivid|telefonia|energia eletrica)",
    "pratica": r"\b(prazo|prazos|suspensao de prazo|expediente|ponto facultativo|feriado|pje|sistema eletronico|instabilidade|intimacao|citacao|cpc|codigo de processo|recurso especial|agravo|embargos|apelacao|honorari|advocacia|advogad|oab|audiencia|sessao|pauta|plantao|peticionamento|custas|gratuidade|sisbajud|penhora|execucao|cumprimento de sentenca|repetitivo|tema \d)",
    "civel": r"\b(contrato|contratu|indeniza|dano moral|danos morais|responsabilidade civil|posse|possessori|usucapi|condomini|locacao|aluguel|despejo|imovel|imoveis|propriedade|registro de imoveis|cartorio|direito civil|civel|cobranca|obrigac|seguro|acidente de transito)",
}
JURIS = r"\b(turma|secao|plenario|corte especial|camara|relator|relatora|acordao|sumula|tese|repercussao geral|repetitivo|decide|decidiu|decisao|julg|entendimento|jurisprudencia|mantem|condena|nega|reconhece|afasta|garante|determina|anula|valida|invalida|inconstitucional|constitucional)"
JURIDICO = r"\b(justica|juiz|juiza|tribunal|stf|stj|lei|direito|processo|judicial|julg|ministerio publico|defensoria|advog|oab|cnj|constitucional|codigo)"
FORA = r"\b(trabalhista|clt|tst|trt|reclamacao trabalhista|falencia|recuperacao judicial|societari)"

MESES = {"jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6, "jul": 7,
         "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
         "feb": 2, "apr": 4, "may": 5, "aug": 8, "sep": 9, "oct": 10, "dec": 12}


def sem_acento(txt):
    txt = unicodedata.normalize("NFKD", txt or "")
    return "".join(c for c in txt if not unicodedata.combining(c)).lower()


def limpar(txt, limite=None):
    txt = BeautifulSoup(html.unescape(txt or ""), "html.parser").get_text(" ")
    txt = re.sub(r"\s+", " ", txt).strip()
    txt = re.sub(r"(Leia mais|Continuar lendo|Leia a íntegra)\s*(»|\.\.\.)?$", "", txt).strip()
    if limite and len(txt) > limite:
        corte = txt[:limite].rsplit(" ", 1)[0]
        txt = corte.rstrip(",;:.") + "…"
    return txt


def data_pt(txt):
    """Converte datas como 'Qui, out 1 2026 11:52:00' ou '15/10/2026 18:45'."""
    if not txt:
        return None
    t = sem_acento(txt)
    m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})(?:\D{1,6}(\d{1,2})[:h](\d{2}))?", t)
    if m:
        d, mes, a, h, mi = m.groups()
        return dt.datetime(int(a), int(mes), int(d), int(h or 12), int(mi or 0), tzinfo=FUSO)
    m = re.search(r"([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?", t)
    if m and m.group(1) in MESES:
        mes, d, a, h, mi = m.groups()
        return dt.datetime(int(a), MESES[mes], int(d), int(h or 12), int(mi or 0), tzinfo=FUSO)
    m = re.search(r"(\d{1,2})\s+(?:de\s+)?([a-z]{3})[a-z]*\.?\s+(?:de\s+)?(\d{4})(?:\D+(\d{1,2}):(\d{2}))?", t)
    if m and m.group(2) in MESES:
        d, mes, a, h, mi = m.groups()
        return dt.datetime(int(a), MESES[mes], int(d), int(h or 12), int(mi or 0), tzinfo=FUSO)
    return None


def baixar(url):
    for tentativa in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200 and r.content:
                return r
            print(f"   {url} -> HTTP {r.status_code}")
        except requests.RequestException as e:
            print(f"   {url} -> {type(e).__name__}")
        time.sleep(2 * (tentativa + 1))
    return None


def classificar(titulo, resumo, fonte):
    texto = sem_acento(f"{titulo} {resumo}")
    eds = [ed for ed, rx in EDITORIAS.items() if re.search(rx, texto)]
    if fonte["tribunal"] and re.search(JURIS, texto):
        eds.insert(0, "jurisprudencia")
    return eds


def item(fonte, titulo, link, resumo, data, imagem=None):
    titulo = limpar(titulo, 220)
    resumo = limpar(resumo, 260)
    if resumo and sem_acento(resumo).startswith(sem_acento(titulo)[:60]):
        resumo = resumo[len(titulo):].lstrip(" .:-") or ""
    texto = sem_acento(f"{titulo} {resumo}")
    if fonte.get("filtrar") and not re.search(JURIDICO, texto):
        return None
    eds = classificar(titulo, resumo, fonte)
    if re.search(FORA, texto) and not eds:
        return None
    agora = dt.datetime.now(FUSO)
    if not data or data > agora + dt.timedelta(hours=2):
        data = agora
    return {
        "id": hashlib.sha1(link.encode()).hexdigest()[:12],
        "titulo": titulo,
        "resumo": resumo,
        "link": link,
        "fonte": fonte["nome"],
        "fonte_id": fonte["id"],
        "data": data.astimezone(FUSO).isoformat(timespec="minutes"),
        "imagem": imagem,
        "editorias": eds,
    }


def imagem_rss(e):
    for campo in ("media_content", "media_thumbnail"):
        for m in e.get(campo, []) or []:
            if m.get("url"):
                return m["url"]
    for l in e.get("links", []) or []:
        if l.get("type", "").startswith("image") and l.get("href"):
            return l["href"]
    corpo = ""
    if e.get("content"):
        corpo = e["content"][0].get("value", "")
    corpo = corpo or e.get("summary", "")
    m = re.search(r'<img[^>]+src="([^"]+)"', corpo or "")
    return m.group(1) if m else None


def coletar_rss(fonte, url):
    r = baixar(url)
    if not r:
        return []
    texto = r.content.replace(b'xmlns:content="https://', b'xmlns:content="http://')
    texto = texto.replace(b'xmlns:media="https://', b'xmlns:media="http://')
    feed = feedparser.parse(texto)
    if not feed.entries:
        print(f"   {url}: resposta sem itens de RSS ({len(r.content)} bytes; início: {r.content[:160]!r})")
    saida = []
    for e in feed.entries[:POR_FONTE]:
        titulo, link = e.get("title"), e.get("link")
        if not titulo or not link:
            continue
        data = None
        if e.get("published_parsed") or e.get("updated_parsed"):
            p = e.get("published_parsed") or e.get("updated_parsed")
            data = dt.datetime(*p[:6], tzinfo=dt.timezone.utc)
        else:
            data = data_pt(e.get("published") or e.get("updated") or "")
        resumo = e.get("summary") or ""
        it = item(fonte, titulo, link, resumo, data, imagem_rss(e))
        if it:
            saida.append(it)
    return saida


def coletar_tjmt(fonte, url):
    if url.endswith("/rss"):
        return coletar_rss(fonte, url)
    r = baixar(url)
    if not r:
        return []
    soup = BeautifulSoup(r.text, "html.parser")
    padrao = re.compile(r"/noticias/(\d{4})/(\d{1,2})/[a-z0-9-]{8,}")
    vistos, saida = set(), []
    for a in soup.find_all("a", href=padrao):
        link = urljoin(url, a["href"].split("?")[0])
        if link in vistos:
            continue
        # Layout atual do TJMT: <a><p>data hora</p><p class="h5"><strong>título</strong></p><p class="h6">resumo</p></a>
        t_el = a.select_one("p.h5, .h5, h2, h3, h4, h5")
        if t_el and len(t_el.get_text(strip=True)) > 15:
            titulo = t_el.get_text(" ", strip=True)
            r_el = a.select_one("p.h6, .h6, small")
            resumo = r_el.get_text(" ", strip=True) if r_el else ""
            data = data_pt(a.get_text(" ", strip=True))
            if not data:
                m = padrao.search(link)
                data = dt.datetime(int(m.group(1)), int(m.group(2)), 1, 12, tzinfo=FUSO)
            img = a.find("img")
            imagem = urljoin(url, img["src"]) if img and img.get("src") and not img["src"].startswith("data:") else None
            vistos.add(link)
            it = item(fonte, titulo, link, resumo, data, imagem)
            if it:
                saida.append(it)
            if len(saida) >= POR_FONTE:
                break
            continue
        bloco, titulo = a, ""
        for _ in range(6):
            bloco = bloco.parent
            if bloco is None:
                break
            h = bloco.find(["h1", "h2", "h3", "h4", "h5"])
            if h and len(h.get_text(strip=True)) > 15:
                titulo = h.get_text(" ", strip=True)
                break
        if not titulo:
            t = a.get_text(" ", strip=True)
            if len(t) > 25 and "continuar" not in t.lower():
                titulo = t
        if not titulo or bloco is None:
            continue
        vistos.add(link)
        texto_bloco = bloco.get_text(" ", strip=True)
        data = data_pt(texto_bloco)
        if not data:
            m = padrao.search(link)
            data = dt.datetime(int(m.group(1)), int(m.group(2)), 1, 12, tzinfo=FUSO)
        resumo = ""
        for p in bloco.find_all("p"):
            pt = p.get_text(" ", strip=True)
            if len(pt) > 40 and pt != titulo:
                resumo = pt
                break
        img = bloco.find("img")
        imagem = urljoin(url, img["src"]) if img and img.get("src") and not img["src"].startswith("data:") else None
        it = item(fonte, titulo, link, resumo, data, imagem)
        if it:
            saida.append(it)
        if len(saida) >= POR_FONTE:
            break
    if not saida:
        print(f"   TJMT: página recebida ({len(r.text)} caracteres), {len(soup.find_all('a', href=padrao))} links de notícia; início: {r.text[:200]!r}")
    return saida


def main():
    anteriores = []
    if ARQUIVO.exists():
        try:
            anteriores = json.loads(ARQUIVO.read_text("utf-8")).get("itens", [])
        except (ValueError, OSError):
            anteriores = []

    novos, status = [], {}
    for fonte in FONTES:
        print(f"> {fonte['nome']}")
        coletados = []
        for url in fonte["urls"]:
            try:
                coletados = coletar_tjmt(fonte, url) if fonte["tipo"] == "tjmt" else coletar_rss(fonte, url)
            except Exception as e:  # uma fonte com defeito não derruba as demais
                print(f"   erro em {url}: {e}")
                coletados = []
            if coletados:
                print(f"   {len(coletados)} itens de {url}")
                break
        status[fonte["id"]] = {"nome": fonte["nome"], "itens": len(coletados), "ok": bool(coletados)}
        novos.extend(coletados)

    # Mescla com o histórico, evitando duplicadas (mesmo link ou mesmo título)
    por_chave, titulos = {}, set()
    for it in novos + anteriores:
        chave_t = re.sub(r"\W+", "", sem_acento(it["titulo"]))[:90]
        if it["id"] in por_chave or chave_t in titulos:
            continue
        por_chave[it["id"]] = it
        titulos.add(chave_t)

    limite = dt.datetime.now(FUSO) - dt.timedelta(days=MAX_DIAS)
    itens = [i for i in por_chave.values() if dt.datetime.fromisoformat(i["data"]) >= limite]
    itens.sort(key=lambda i: i["data"], reverse=True)
    itens = itens[:MAX_ITENS]

    saida = {
        "atualizado": dt.datetime.now(FUSO).isoformat(timespec="minutes"),
        "fontes": status,
        "itens": itens,
    }
    ARQUIVO.write_text(json.dumps(saida, ensure_ascii=False, indent=1), "utf-8")
    print(f"Total: {len(itens)} notícias ({len(novos)} coletadas nesta rodada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
