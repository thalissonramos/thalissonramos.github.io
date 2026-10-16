/* Diário Jurídico Ramos Advocacia: montagem das páginas */
(function () {
  "use strict";

  var PADRAO = {
    nome: "Diário Jurídico",
    sub: "Ramos Advocacia",
    lema: "Notícias e jurisprudência do STF, STJ e TJMT, todos os dias.",
    cidade: "Sinop/MT",
    editor: {
      nome: "Dr. Thalisson Ramos",
      oab: "OAB/MT 23.316",
      bio: "Advogado, doutor em Direito e professor de Direito Penal na UNIFASIPE. Atua nas áreas penal, de família, sucessões e cível em Sinop e no norte de Mato Grosso.",
      foto: "foto.jpg"
    },
    contato: {
      escritorio: "Thalisson Ramos Advocacia e Assessoria Jurídica",
      email: "thalissonmakeadv@gmail.com",
      whatsapp: "",
      instagram: "",
      endereco: "Avenida das Palmeiras, nº 2995, Jardim Imperial, CEP 78555-068, Sinop/MT"
    }
  };

  var EDITORIAS = [
    { id: "jurisprudencia", nome: "Jurisprudência" },
    { id: "civel", nome: "Cível" },
    { id: "familia", nome: "Família" },
    { id: "sucessoes", nome: "Sucessões" },
    { id: "penal", nome: "Penal" },
    { id: "consumidor", nome: "Consumidor" },
    { id: "pratica", nome: "Prática forense" }
  ];
  var TRIBUNAIS = [
    { id: "stf", nome: "STF" },
    { id: "stj", nome: "STJ" },
    { id: "tjmt", nome: "TJMT" }
  ];
  var NOME_ED = {};
  EDITORIAS.forEach(function (e) { NOME_ED[e.id] = e.nome; });

  var cfg = PADRAO, noticias = { itens: [] }, artigos = [];
  var POR_PAGINA = 30;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function semAcento(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function $(id) { return document.getElementById(id); }
  function carregar(url) {
    return fetch(url + "?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function mesclar(a, b) {
    var out = JSON.parse(JSON.stringify(a));
    Object.keys(b || {}).forEach(function (k) {
      if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) out[k] = mesclar(out[k] || {}, b[k]);
      else if (b[k] !== "" && b[k] != null) out[k] = b[k];
    });
    return out;
  }

  /* Datas */
  var fmtDia = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Cuiaba" });
  var fmtHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Cuiaba" });
  var fmtCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Cuiaba" });
  function chaveDia(d) { return fmtCurta.format(d); }
  function rotuloDia(d) {
    var hoje = new Date(), ontem = new Date(Date.now() - 864e5);
    if (chaveDia(d) === chaveDia(hoje)) return "Hoje";
    if (chaveDia(d) === chaveDia(ontem)) return "Ontem";
    var t = fmtDia.format(d);
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  /* Estrutura comum */
  function montarCabecalho(ativo) {
    var hoje = fmtDia.format(new Date());
    hoje = hoje.charAt(0).toUpperCase() + hoje.slice(1);
    var att = noticias.atualizado ? "Atualizado às <b>" + fmtHora.format(new Date(noticias.atualizado)) + "</b> de " + fmtCurta.format(new Date(noticias.atualizado)) : "Edição diária";
    var menu = '<a href="index.html#/" data-r="inicio">Início</a>';
    EDITORIAS.forEach(function (e) { menu += '<a href="index.html#/editoria/' + e.id + '" data-r="ed-' + e.id + '">' + e.nome + "</a>"; });
    TRIBUNAIS.forEach(function (t) { menu += '<a href="index.html#/fonte/' + t.id + '" data-r="fo-' + t.id + '">' + t.nome + "</a>"; });
    menu += '<a href="index.html#/coluna" data-r="coluna">Coluna do Professor</a>';
    $("cabecalho").innerHTML =
      '<div class="topo"><div class="wrap"><span>' + esc(hoje) + " · " + esc(cfg.cidade) + '</span><span id="atualizado">' + att + "</span></div></div>" +
      '<header class="cabecalho"><div class="wrap">' +
      '<a class="marca" href="index.html#/"><span class="nome">' + esc(cfg.nome) + '</span><span class="sub">' + esc(cfg.sub) + '</span><span class="lema">' + esc(cfg.lema) + "</span></a>" +
      '<form class="busca" id="form-busca" role="search"><input id="campo-busca" type="search" placeholder="Buscar notícias" aria-label="Buscar notícias">' +
      '<button type="button" class="tema-btn" id="tema" title="Alternar tema claro/escuro" aria-label="Alternar tema"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button></form>' +
      "</div></header>" +
      '<nav class="menu" aria-label="Editorias"><div class="wrap">' + menu + "</div></nav>";
    marcarMenu(ativo);
    $("form-busca").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var q = $("campo-busca").value.trim();
      if (!q) return;
      if (location.pathname.indexOf("artigo") >= 0) location.href = "index.html#/busca/" + encodeURIComponent(q);
      else location.hash = "#/busca/" + encodeURIComponent(q);
    });
    $("tema").addEventListener("click", function () {
      var atual = document.documentElement.getAttribute("data-theme");
      var escuro = atual ? atual === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      var novo = escuro ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", novo);
      try { localStorage.setItem("tema", novo); } catch (e) {}
    });
  }
  function marcarMenu(ativo) {
    var links = document.querySelectorAll(".menu a");
    for (var i = 0; i < links.length; i++) {
      var on = links[i].getAttribute("data-r") === ativo;
      links[i].classList.toggle("ativo", on);
      if (on && links[i].scrollIntoView) links[i].scrollIntoView({ block: "nearest", inline: "center" });
    }
  }
  function montarRodape() {
    var c = cfg.contato;
    var eds = EDITORIAS.map(function (e) { return '<a href="index.html#/editoria/' + e.id + '">' + e.nome + "</a>"; }).join("<br>");
    $("rodape").innerHTML =
      '<footer class="rodape"><div class="wrap">' +
      '<div><div class="nome">' + esc(cfg.nome) + "</div>" +
      '<div style="color:var(--ouro-claro);font-weight:600;letter-spacing:.2em;text-transform:uppercase;font-size:12px;margin:4px 0 12px">' + esc(cfg.sub) + "</div>" +
      "<div>" + esc(c.escritorio) + "<br>" + esc(cfg.editor.nome) + " · " + esc(cfg.editor.oab) + "<br>" + esc(c.endereco) + "</div></div>" +
      "<div><h5>Editorias</h5>" + eds + "</div>" +
      "<div><h5>Contato</h5>" + contatoLinks("<br>") + "</div>" +
      '<div class="aviso">Conteúdo de caráter exclusivamente informativo e educativo, que não substitui a consulta a um advogado. As manchetes e resumos pertencem às fontes indicadas em cada notícia, com link para a publicação original. Atualização automática diária a partir de fontes oficiais e especializadas.</div>' +
      "</div></footer>";
  }
  function contatoLinks(sep) {
    var c = cfg.contato, l = [];
    if (c.whatsapp) l.push('<a href="https://wa.me/' + esc(c.whatsapp.replace(/\D/g, "")) + '" target="_blank" rel="noopener">WhatsApp</a>');
    if (c.email) l.push('<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>");
    if (c.instagram) l.push('<a href="https://instagram.com/' + esc(c.instagram.replace(/^@/, "")) + '" target="_blank" rel="noopener">Instagram ' + esc(c.instagram) + "</a>");
    return l.join(sep);
  }

  /* Barra lateral */
  function montarLateral() {
    var e = cfg.editor, c = cfg.contato;
    var cont = {};
    noticias.itens.forEach(function (n) { cont[n.fonte_id] = (cont[n.fonte_id] || 0) + 1; });
    var trib = TRIBUNAIS.map(function (t) {
      return '<a href="index.html#/fonte/' + t.id + '"><b>' + (cont[t.id] || 0) + "</b><span>" + t.nome + "</span></a>";
    }).join("");
    var col = artigos.slice(0, 4).map(function (a) {
      return '<div class="coluna-item"><a href="artigo.html?id=' + encodeURIComponent(a.id) + '"><h4>' + esc(a.titulo) + "</h4></a><small>" + esc(dataArtigo(a.data)) + "</small></div>";
    }).join("") || '<p style="color:var(--suave);margin:0">Em breve, novos artigos.</p>';
    var botoes = "";
    if (c.whatsapp) botoes += '<a class="botao" href="https://wa.me/' + esc(c.whatsapp.replace(/\D/g, "")) + '" target="_blank" rel="noopener">Fale com o escritório</a>';
    if (c.email) botoes += '<a class="botao ' + (c.whatsapp ? "claro" : "") + '" href="mailto:' + esc(c.email) + '">Enviar e-mail</a>';
    if (c.instagram) botoes += '<a class="botao claro" href="https://instagram.com/' + esc(c.instagram.replace(/^@/, "")) + '" target="_blank" rel="noopener">Instagram</a>';
    $("lateral").innerHTML =
      '<div class="bloco editor"><div class="secao-titulo"><h2>Editor</h2></div>' +
      '<img src="' + esc(e.foto) + '" alt="Foto de ' + esc(e.nome) + '" width="112" height="112">' +
      "<h3>" + esc(e.nome) + '</h3><div class="oab">' + esc(e.oab) + "</div><p>" + esc(e.bio) + "</p>" + botoes + "</div>" +
      '<div class="bloco"><div class="secao-titulo"><h2>Coluna do Professor</h2><span><a href="index.html#/coluna">ver todos</a></span></div>' + col + "</div>" +
      '<div class="bloco"><div class="secao-titulo"><h2>Por tribunal</h2><span>últimos 30 dias</span></div><div class="tribunais">' + trib + "</div></div>" +
      '<div class="bloco"><div class="secao-titulo"><h2>Escritório</h2></div><p style="margin:0;font-size:15px;color:var(--suave)">' + esc(c.escritorio) + "<br>" + esc(c.endereco) + "</p></div>";
  }
  function dataArtigo(s) {
    if (!s) return "";
    var d = new Date(s + "T12:00:00-04:00");
    return isNaN(d) ? s : fmtCurta.format(d);
  }

  /* Notícias */
  function tags(n) {
    var t = '<span class="tag fonte ' + esc(n.fonte_id) + '">' + esc(n.fonte) + "</span>";
    (n.editorias || []).slice(0, 2).forEach(function (e) { if (NOME_ED[e]) t += '<a class="tag" href="#/editoria/' + e + '">' + NOME_ED[e] + "</a>"; });
    return t;
  }
  function linkExt(n, conteudo) {
    return '<a href="' + esc(n.link) + '" target="_blank" rel="noopener">' + conteudo + "</a>";
  }
  function lista(itens) {
    var html = "", diaAtual = "";
    itens.forEach(function (n) {
      var d = new Date(n.data), k = chaveDia(d);
      if (k !== diaAtual) {
        if (diaAtual) html += "</ul>";
        html += '<div class="dia">' + esc(rotuloDia(d)) + '</div><ul class="lista">';
        diaAtual = k;
      }
      html += '<li><div class="hora">' + fmtHora.format(d) + "</div><div>" + linkExt(n, "<h4>" + esc(n.titulo) + "</h4>") +
        (n.resumo ? "<p>" + esc(n.resumo) + "</p>" : "") + '<div class="meta">' + tags(n) + "</div></div></li>";
    });
    return html ? html + "</ul>" : "";
  }
  function paginada(titulo, sub, itens) {
    var pag = 1;
    function render() {
      var parte = itens.slice(0, pag * POR_PAGINA);
      var html = '<div class="secao-titulo"><h2>' + esc(titulo) + "</h2><span>" + esc(sub) + "</span></div>";
      html += parte.length ? lista(parte) : '<div class="vazio">Nenhuma notícia encontrada nesta seção por enquanto. A próxima atualização automática pode trazer novidades.</div>';
      if (itens.length > parte.length) html += '<button class="mais" id="mais">Carregar mais notícias</button>';
      $("principal").innerHTML = html;
      var b = $("mais");
      if (b) b.addEventListener("click", function () { pag++; render(); });
    }
    render();
  }

  function capa() {
    var itens = noticias.itens;
    if (!itens.length) {
      $("principal").innerHTML = '<div class="vazio"><h3 style="font-family:var(--titulo);margin-top:0">A primeira edição está sendo preparada</h3>O robô de atualização busca as notícias do STF, STJ e TJMT algumas vezes por dia. Volte em instantes.</div>';
      return;
    }
    var comImg = itens.slice(0, 12).filter(function (n) { return n.imagem; })[0];
    var juris = itens.filter(function (n) { return (n.editorias || []).indexOf("jurisprudencia") >= 0; });
    var man = comImg || juris[0] || itens[0];
    var usados = {}; usados[man.id] = 1;
    var dest = juris.filter(function (n) { return !usados[n.id]; }).slice(0, 3);
    if (dest.length < 3) dest = dest.concat(itens.filter(function (n) { return !usados[n.id] && dest.indexOf(n) < 0; }).slice(0, 3 - dest.length));
    dest.forEach(function (n) { usados[n.id] = 1; });

    var html = '<div class="secao-titulo"><h2>Manchete</h2><span>' + esc(man.fonte) + " · " + fmtHora.format(new Date(man.data)) + "</span></div>";
    html += '<article class="manchete' + (man.imagem ? "" : " sem-img") + '">' +
      (man.imagem ? linkExt(man, '<div class="img"><img src="' + esc(man.imagem) + '" alt="" loading="eager" referrerpolicy="no-referrer" onerror="var m=this.closest(\'.manchete\');m.classList.add(\'sem-img\');this.parentNode.parentNode.remove()"></div>') : "") +
      '<div class="corpo"><div class="meta">' + tags(man) + "</div>" + linkExt(man, "<h3>" + esc(man.titulo) + "</h3>") +
      (man.resumo ? "<p>" + esc(man.resumo) + "</p>" : "") + "</div></article>";
    if (dest.length) {
      html += '<div class="secao-titulo"><h2>Destaques da jurisprudência</h2><span><a href="#/editoria/jurisprudencia">ver tudo</a></span></div><div class="destaques">';
      dest.forEach(function (n) {
        html += '<article class="card"><div class="meta">' + tags(n) + "</div>" + linkExt(n, "<h4>" + esc(n.titulo) + "</h4>") +
          '<small style="font:12.5px var(--ui);color:var(--suave)">' + esc(rotuloDia(new Date(n.data))) + " · " + fmtHora.format(new Date(n.data)) + "</small></article>";
      });
      html += "</div>";
    }
    var resto = itens.filter(function (n) { return !usados[n.id]; });
    var parte = resto.slice(0, POR_PAGINA);
    html += '<div class="secao-titulo"><h2>Últimas notícias</h2><span>' + itens.length + " notícias nos últimos 30 dias</span></div>" + lista(parte);
    if (resto.length > parte.length) html += '<a class="mais" style="text-align:center;width:max-content" href="#/todas">Ver todas as notícias</a>';
    $("principal").innerHTML = html;
  }

  function coluna() {
    var html = '<div class="secao-titulo"><h2>Coluna do Professor</h2><span>' + esc(cfg.editor.nome) + "</span></div>";
    if (!artigos.length) html += '<div class="vazio">Em breve, novos artigos.</div>';
    artigos.forEach(function (a) {
      html += '<article class="card" style="margin-bottom:16px"><a href="artigo.html?id=' + encodeURIComponent(a.id) + '"><h4 style="font-size:23px">' + esc(a.titulo) + "</h4></a>" +
        (a.linha_fina ? '<p style="margin:0;color:var(--suave)">' + esc(a.linha_fina) + "</p>" : "") +
        '<small style="font:12.5px var(--ui);color:var(--suave)">' + esc(dataArtigo(a.data)) + (a.editoria && NOME_ED[a.editoria] ? " · " + NOME_ED[a.editoria] : "") + "</small></article>";
    });
    $("principal").innerHTML = html;
  }

  function rota() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, "")), p = h.split("/");
    window.scrollTo(0, 0);
    if (p[0] === "editoria" && NOME_ED[p[1]]) {
      marcarMenu("ed-" + p[1]);
      paginada(NOME_ED[p[1]], "atualização diária", noticias.itens.filter(function (n) { return (n.editorias || []).indexOf(p[1]) >= 0; }));
    } else if (p[0] === "fonte" && p[1]) {
      marcarMenu("fo-" + p[1]);
      var nome = (TRIBUNAIS.filter(function (t) { return t.id === p[1]; })[0] || { nome: p[1].toUpperCase() }).nome;
      paginada("Notícias do " + nome, "fonte oficial", noticias.itens.filter(function (n) { return n.fonte_id === p[1]; }));
    } else if (p[0] === "busca") {
      marcarMenu("");
      var q = p.slice(1).join("/"), termos = semAcento(q).split(/\s+/).filter(Boolean);
      $("campo-busca").value = q;
      paginada("Busca: " + q, "", noticias.itens.filter(function (n) {
        var t = semAcento(n.titulo + " " + n.resumo + " " + n.fonte);
        return termos.every(function (x) { return t.indexOf(x) >= 0; });
      }));
    } else if (p[0] === "coluna") {
      marcarMenu("coluna"); coluna();
    } else if (p[0] === "todas") {
      marcarMenu("inicio"); paginada("Todas as notícias", "últimos 30 dias", noticias.itens);
    } else {
      marcarMenu("inicio"); capa();
    }
  }

  /* Artigo (Markdown simples: ## título, > citação, **negrito**, *itálico*) */
  function md(txt) {
    return String(txt || "").split(/\n\s*\n/).map(function (b) {
      b = esc(b.trim()).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
      if (/^##\s/.test(b)) return "<h2>" + b.replace(/^##\s*/, "") + "</h2>";
      if (/^&gt;\s?/.test(b)) return "<blockquote>" + b.replace(/^&gt;\s?/, "") + "</blockquote>";
      return b ? "<p>" + b + "</p>" : "";
    }).join("");
  }
  function artigo() {
    var id = new URLSearchParams(location.search).get("id");
    var a = artigos.filter(function (x) { return x.id === id; })[0] || artigos[0];
    if (!a) { $("principal").innerHTML = '<div class="vazio">Artigo não encontrado.</div>'; return; }
    document.title = a.titulo + " | " + cfg.nome + " " + cfg.sub;
    $("principal").innerHTML = '<article class="artigo"><div class="meta"><span class="tag fonte">Coluna do Professor</span>' +
      (a.editoria && NOME_ED[a.editoria] ? '<span class="tag">' + NOME_ED[a.editoria] + "</span>" : "") + "</div>" +
      "<h1>" + esc(a.titulo) + "</h1>" + (a.linha_fina ? '<p class="linha-fina">' + esc(a.linha_fina) + "</p>" : "") +
      '<div class="assinatura"><img src="' + esc(cfg.editor.foto) + '" alt=""><div><b style="color:var(--texto)">' + esc(cfg.editor.nome) + "</b> · " + esc(cfg.editor.oab) + "<br>" + esc(dataArtigo(a.data)) + "</div></div>" +
      '<div class="texto">' + md(a.texto) + "</div></article>";
  }

  function preparar() {
    try { var t = localStorage.getItem("tema"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
    return Promise.all([
      carregar("site.json").then(function (s) { cfg = mesclar(PADRAO, s); }).catch(function () {}),
      carregar("noticias.json").then(function (n) { noticias = n; noticias.itens = n.itens || []; }).catch(function () {}),
      carregar("artigos.json").then(function (a) {
        artigos = (a.artigos || a || []).slice().sort(function (x, y) { return String(y.data).localeCompare(String(x.data)); });
      }).catch(function () {})
    ]);
  }

  window.Portal = {
    iniciarCapa: function () {
      preparar().then(function () {
        montarCabecalho("inicio"); montarLateral(); montarRodape(); rota();
        window.addEventListener("hashchange", rota);
      });
    },
    iniciarArtigo: function () {
      preparar().then(function () {
        montarCabecalho("coluna"); montarLateral(); montarRodape(); artigo();
      });
    }
  };
})();
