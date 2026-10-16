/* Diário Jurídico Ramos Advocacia: montagem das páginas */
(function () {
  "use strict";

  var REPO = "thalissonramos/thalissonramos.github.io";
  var PADRAO = {
    nome: "Diário Jurídico",
    sub: "Ramos Advocacia",
    lema: "Notícias e jurisprudência do STF, STJ e TJMT, todos os dias.",
    cidade: "Sinop/MT",
    url: "https://thalissonramos.github.io",
    editor: {
      nome: "Dr. Thalisson Ramos",
      oab: "OAB/MT 23.316",
      bio: "Advogado e professor de Direito Penal e Processo Penal na UNIFASIPE. Atua nas áreas penal, de família, sucessões e cível em Sinop e no norte de Mato Grosso.",
      foto: "foto.jpg",
      foto_grande: "advogado.jpg"
    },
    contato: {
      escritorio: "Thalisson Ramos Advocacia e Assessoria Jurídica",
      email: "makeramos@hotmail.com",
      whatsapp: "5566999962183",
      whatsapp_exibir: "(66) 99996-2183",
      instagram: "dr.thalissonramos",
      endereco: "Avenida das Palmeiras, nº 2995, Jardim Imperial, CEP 78555-068, Sinop/MT",
      mapa: "Avenida das Palmeiras, 2995, Jardim Imperial, Sinop, MT, 78555-068"
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
  var TRIBUNAIS = [{ id: "stf", nome: "STF" }, { id: "stj", nome: "STJ" }, { id: "tjmt", nome: "TJMT" }];
  var NOME_ED = {};
  EDITORIAS.forEach(function (e) { NOME_ED[e.id] = e.nome; });

  var AREAS = [
    { ic: "balanca", t: "Direito Penal e Tribunal do Júri", d: "Defesa em inquéritos e ações penais, audiências de custódia, pedidos de liberdade, recursos e atuação em plenário do Júri.", tema: "Direito Penal" },
    { ic: "casa", t: "Direito de Família", d: "Divórcio, guarda, convivência, pensão alimentícia, união estável e partilha de bens, sempre buscando soluções que preservem os vínculos familiares.", tema: "Direito de Família" },
    { ic: "doc", t: "Sucessões e Inventários", d: "Inventário judicial e extrajudicial, partilha, testamentos, alvarás e regularização de bens deixados por quem faleceu.", tema: "Inventário e Sucessões" },
    { ic: "contrato", t: "Direito Civil e Contratos", d: "Análise e elaboração de contratos, cobranças, indenizações, posse, usucapião e questões imobiliárias.", tema: "Direito Civil" },
    { ic: "carrinho", t: "Direito do Consumidor", d: "Problemas com bancos, companhias aéreas, planos de saúde, cobranças indevidas e superendividamento.", tema: "Direito do Consumidor" },
    { ic: "carro", t: "Trânsito e CNH", d: "Defesas administrativas e recursos contra multas, suspensão e cassação do direito de dirigir.", tema: "Trânsito e CNH" }
  ];
  var FAQ = [
    { p: "Como faço para falar com o advogado?", r: "O caminho mais rápido é o WhatsApp do escritório. Conte em poucas palavras do que se trata e combinamos o melhor horário para conversar, presencialmente em Sinop ou à distância." },
    { p: "O escritório atende fora de Sinop?", r: "Sim. Atendemos Sinop, Sorriso e toda a região norte de Mato Grosso. Com o processo eletrônico, também acompanhamos causas em outras comarcas e estados." },
    { p: "O que devo levar para a primeira conversa?", r: "Documento pessoal com foto e tudo o que tiver relação com o caso: contratos, mensagens, intimações, boletins de ocorrência ou números de processo. Se não tiver nada em mãos, não tem problema; começamos pela sua história." },
    { p: "As notícias do portal servem como orientação para o meu caso?", r: "Não. O conteúdo do Diário Jurídico é informativo e educativo. Cada situação tem detalhes próprios e precisa ser analisada individualmente por um advogado." }
  ];

  var LINKS = [
    { t: "Supremo Tribunal Federal", d: "Notícias e jurisprudência", u: "https://portal.stf.jus.br/" },
    { t: "Superior Tribunal de Justiça", d: "Notícias e pesquisa de julgados", u: "https://www.stj.jus.br/" },
    { t: "Tribunal de Justiça de MT", d: "Serviços e processos", u: "https://www.tjmt.jus.br/" },
    { t: "Conselho Nacional de Justiça", d: "Normas e estatísticas", u: "https://www.cnj.jus.br/" },
    { t: "OAB Mato Grosso", d: "Seccional da advocacia", u: "https://www.oabmt.org.br/" },
    { t: "Legislação federal", d: "Textos oficiais no Planalto", u: "https://www.planalto.gov.br/ccivil_03/" }
  ];
  var cfg = PADRAO, noticias = { itens: [] }, artigos = [];
  var POR_PAGINA = 30;

  /* Utilitários */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function semAcento(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function $(id) { return document.getElementById(id); }
  function carregar(url) {
    return fetch(url + "?v=" + Date.now(), { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function mesclar(a, b) {
    var out = JSON.parse(JSON.stringify(a));
    Object.keys(b || {}).forEach(function (k) {
      if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) out[k] = mesclar(out[k] || {}, b[k]);
      else if (b[k] !== "" && b[k] != null) out[k] = b[k];
    });
    return out;
  }
  function wa(msg) {
    return "https://wa.me/" + String(cfg.contato.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(msg || "Olá, Dr. Thalisson! Vim pelo Diário Jurídico e gostaria de uma orientação.");
  }
  function insta() { return "https://www.instagram.com/" + String(cfg.contato.instagram).replace(/^@/, "") + "/"; }
  function mapsLink() { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(cfg.contato.mapa || cfg.contato.endereco); }
  function base() { return String(cfg.url || location.origin).replace(/\/$/, ""); }

  var ICONES = {
    whats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z"/></svg>',
    insta: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    lua: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    balanca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 21h14M4 7h16M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z"/></svg>',
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    contrato: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12l4 4v12H4z"/><path d="M8 10h8M8 14h5M14 18l2 2 4-4"/></svg>',
    carrinho: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>',
    carro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM5 11h14"/><circle cx="7.5" cy="13.5" r=".8" fill="currentColor"/><circle cx="16.5" cy="13.5" r=".8" fill="currentColor"/></svg>'
  };

  /* Datas */
  var TZ = "America/Cuiaba";
  var fmtDia = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  var fmtHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  var fmtCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
  var fmtLonga = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function chaveDia(d) { return fmtCurta.format(d); }
  function rotuloDia(d) {
    if (chaveDia(d) === chaveDia(new Date())) return "Hoje";
    if (chaveDia(d) === chaveDia(new Date(Date.now() - 864e5))) return "Ontem";
    return cap(fmtDia.format(d));
  }
  function dataArtigo(s) {
    if (!s) return "";
    var d = new Date(s + "T12:00:00-04:00");
    return isNaN(d) ? s : fmtLonga.format(d);
  }

  /* Compartilhar */
  function compartilhar(url, titulo) {
    if (navigator.share) {
      navigator.share({ title: titulo, text: titulo, url: url }).catch(function () {});
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(titulo + "\n" + url), "_blank", "noopener");
    }
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-share]");
    if (!b) return;
    ev.preventDefault();
    compartilhar(b.getAttribute("data-share"), b.getAttribute("data-titulo") || document.title);
  });
  function botoesCompartilhar(url, titulo) {
    var t = encodeURIComponent(titulo), u = encodeURIComponent(url);
    return '<div class="compartilhar"><span>Compartilhe:</span>' +
      '<a class="cp wa" href="https://wa.me/?text=' + t + "%0A" + u + '" target="_blank" rel="noopener" aria-label="Compartilhar no WhatsApp">' + ICONES.whats + "WhatsApp</a>" +
      '<a class="cp" href="https://www.linkedin.com/sharing/share-offsite/?url=' + u + '" target="_blank" rel="noopener">LinkedIn</a>' +
      '<a class="cp" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener">Facebook</a>' +
      '<button class="cp" type="button" data-copiar="' + esc(url) + '">Copiar link</button></div>';
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-copiar]");
    if (!b) return;
    var u = b.getAttribute("data-copiar");
    (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () {
      b.textContent = "Link copiado";
      setTimeout(function () { b.textContent = "Copiar link"; }, 2000);
    }).catch(function () { prompt("Copie o link:", u); });
  });

  /* Estrutura comum */
  function montarCabecalho(ativo) {
    var hoje = cap(fmtDia.format(new Date()));
    var att = noticias.atualizado ? "Edição de <b>" + fmtCurta.format(new Date(noticias.atualizado)) + "</b>, atualizada às " + fmtHora.format(new Date(noticias.atualizado)) : "Edição diária";
    var menu = '<a href="index.html#/" data-r="inicio">Início</a>' +
      '<a href="index.html#/advogado" data-r="advogado">O Advogado</a>' +
      '<a href="index.html#/artigos" data-r="artigos">Artigos</a>';
    EDITORIAS.forEach(function (e) { menu += '<a href="index.html#/editoria/' + e.id + '" data-r="ed-' + e.id + '">' + e.nome + "</a>"; });
    TRIBUNAIS.forEach(function (t) { menu += '<a href="index.html#/fonte/' + t.id + '" data-r="fo-' + t.id + '">' + t.nome + "</a>"; });
    $("cabecalho").innerHTML =
      '<div class="topo"><div class="wrap"><span>' + esc(hoje) + " · " + esc(cfg.cidade) + '</span><span class="topo-dir"><span id="atualizado">' + att + '</span>' +
      '<a href="' + insta() + '" target="_blank" rel="noopener" aria-label="Instagram">' + ICONES.insta + "</a>" +
      '<a href="' + wa() + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + ICONES.whats + "</a></span></div></div>" +
      '<header class="cabecalho"><div class="wrap">' +
      '<a class="marca" href="index.html#/"><span class="nome">' + esc(cfg.nome) + '</span><span class="sub">' + esc(cfg.sub) + '</span><span class="lema">' + esc(cfg.lema) + "</span></a>" +
      '<form class="busca" id="form-busca" role="search"><input id="campo-busca" type="search" placeholder="Buscar notícias e artigos" aria-label="Buscar">' +
      '<button type="button" class="tema-btn" id="tema" title="Alternar tema claro/escuro" aria-label="Alternar tema">' + ICONES.lua + "</button></form>" +
      "</div></header>" +
      '<nav class="menu" aria-label="Seções"><div class="wrap">' + menu + "</div></nav>";
    marcarMenu(ativo);
    $("form-busca").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var q = $("campo-busca").value.trim();
      if (!q) return;
      if (location.pathname.indexOf("artigo.html") >= 0) location.href = "index.html#/busca/" + encodeURIComponent(q);
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
      if (on && links[i].scrollIntoView && window.innerWidth < 900) links[i].scrollIntoView({ block: "nearest", inline: "center" });
    }
  }
  function montarRodape() {
    var c = cfg.contato;
    var eds = EDITORIAS.map(function (e) { return '<a href="index.html#/editoria/' + e.id + '">' + e.nome + "</a>"; }).join("<br>");
    $("rodape").innerHTML =
      '<footer class="rodape"><div class="wrap">' +
      '<div><div class="nome">' + esc(cfg.nome) + '</div><div class="rod-sub">' + esc(cfg.sub) + "</div>" +
      "<div>" + esc(c.escritorio) + "<br>" + esc(cfg.editor.nome) + " · " + esc(cfg.editor.oab) + '<br><a href="' + mapsLink() + '" target="_blank" rel="noopener">' + esc(c.endereco) + "</a></div></div>" +
      "<div><h5>Seções</h5>" + '<a href="index.html#/advogado">O Advogado</a><br><a href="index.html#/artigos">Artigos</a><br>' + eds + "</div>" +
      "<div><h5>Contato</h5>" +
      '<a class="rod-link" href="' + wa() + '" target="_blank" rel="noopener">' + ICONES.whats + esc(c.whatsapp_exibir) + "</a>" +
      '<a class="rod-link" href="' + insta() + '" target="_blank" rel="noopener">' + ICONES.insta + "@" + esc(c.instagram) + "</a>" +
      '<a class="rod-link" href="mailto:' + esc(c.email) + '">' + ICONES.mail + esc(c.email) + "</a>" +
      '<a class="rod-link" href="' + mapsLink() + '" target="_blank" rel="noopener">' + ICONES.pin + "Como chegar</a>" +
      '<div class="autor-link"><a href="https://github.com/' + REPO + '/issues/new?template=artigo.yml" target="_blank" rel="noopener">Área do autor: publicar artigo</a></div></div>' +
      '<div class="aviso">Conteúdo de caráter exclusivamente informativo e educativo, que não substitui a consulta a um advogado. As manchetes e resumos de notícias pertencem às fontes indicadas, sempre com link para a publicação original. Edição diária atualizada automaticamente às 4h, a partir de fontes oficiais.</div>' +
      "</div></footer>" +
      '<a class="whats-flutuante" href="' + wa() + '" target="_blank" rel="noopener" aria-label="Falar com o advogado pelo WhatsApp">' + ICONES.whats + "<span>Fale com o advogado</span></a>";
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
      return '<div class="coluna-item"><a href="artigo.html?id=' + encodeURIComponent(a.id) + '"><h4>' + esc(a.titulo) + "</h4></a><small>" + esc(dataArtigo(a.data)) + " · " + (a.leitura || 1) + " min de leitura</small></div>";
    }).join("") || '<p class="suave">Em breve, novos artigos.</p>';
    $("lateral").innerHTML =
      '<div class="bloco editor"><div class="secao-titulo"><h2>Editor</h2></div>' +
      '<img src="' + esc(e.foto) + '" alt="Foto de ' + esc(e.nome) + '" width="112" height="112">' +
      "<h3>" + esc(e.nome) + '</h3><div class="oab">' + esc(e.oab) + "</div><p>" + esc(e.bio) + "</p>" +
      '<a class="botao wa" href="' + wa() + '" target="_blank" rel="noopener">' + ICONES.whats + "Falar no WhatsApp</a>" +
      '<a class="botao claro" href="index.html#/advogado">Conheça o advogado</a>' +
      '<a class="botao claro" href="mailto:' + esc(c.email) + '">' + ICONES.mail + "Enviar e-mail</a></div>" +
      '<div class="bloco"><div class="secao-titulo"><h2>Artigos</h2><span><a href="index.html#/artigos">ver todos</a></span></div>' + col + "</div>" +
      '<a class="bloco insta-card" href="' + insta() + '" target="_blank" rel="noopener"><span class="insta-ic">' + ICONES.insta + "</span><span><b>@" + esc(c.instagram) + "</b><small>Conteúdo jurídico diário no Instagram. Siga!</small></span></a>" +
      '<div class="bloco"><div class="secao-titulo"><h2>Por tribunal</h2><span>últimos 30 dias</span></div><div class="tribunais">' + trib + "</div></div>" +
      '<div class="bloco"><div class="secao-titulo"><h2>Links oficiais</h2></div><ul class="links-uteis">' + LINKS.map(function (l) { return '<li><a href="' + l.u + '" target="_blank" rel="noopener">' + esc(l.t) + '<small>' + esc(l.d) + '</small></a></li>'; }).join('') + '</ul></div>' +
      '<div class="bloco"><div class="secao-titulo"><h2>Escritório</h2></div><p class="suave" style="margin:0 0 10px">' + esc(c.escritorio) + "<br>" + esc(c.endereco) + '</p><a class="botao claro" href="' + mapsLink() + '" target="_blank" rel="noopener">' + ICONES.pin + "Como chegar</a></div>";
  }

  /* Notícias */
  function tags(n) {
    var t = '<span class="tag fonte ' + esc(n.fonte_id) + '">' + esc(n.fonte) + "</span>";
    (n.editorias || []).slice(0, 2).forEach(function (e) { if (NOME_ED[e]) t += '<a class="tag" href="#/editoria/' + e + '">' + NOME_ED[e] + "</a>"; });
    return t;
  }
  function linkNoticia(n) { return "index.html#/noticia/" + n.id; }
  function urlNoticia(n) { return base() + "/#/noticia/" + n.id; }
  function btnShare(url, titulo) {
    return '<button class="mini-share" type="button" data-share="' + esc(url) + '" data-titulo="' + esc(titulo) + '" aria-label="Compartilhar">' + ICONES.share + "</button>";
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
      html += '<li><div class="hora">' + fmtHora.format(d) + '</div><div><a href="' + linkNoticia(n) + '"><h4>' + esc(n.titulo) + "</h4></a>" +
        (n.resumo ? "<p>" + esc(n.resumo) + "</p>" : "") + '<div class="meta">' + tags(n) + btnShare(urlNoticia(n), n.titulo) + "</div></div></li>";
    });
    return html ? html + "</ul>" : "";
  }
  function paginada(titulo, sub, itens) {
    var pag = 1;
    function render() {
      var parte = itens.slice(0, pag * POR_PAGINA);
      var html = '<div class="secao-titulo"><h2>' + esc(titulo) + "</h2><span>" + esc(sub) + "</span></div>";
      html += parte.length ? lista(parte) : '<div class="vazio">Nenhuma notícia encontrada nesta seção por enquanto. A próxima edição diária pode trazer novidades.</div>';
      if (itens.length > parte.length) html += '<button class="mais" id="mais">Carregar mais notícias</button>';
      $("principal").innerHTML = html;
      var b = $("mais");
      if (b) b.addEventListener("click", function () { pag++; render(); });
    }
    render();
  }
  function cardArtigo(a, grande) {
    return '<article class="card-artigo' + (grande ? " grande" : "") + '"><a href="artigo.html?id=' + encodeURIComponent(a.id) + '">' +
      (a.capa ? '<div class="capa"><img src="' + esc(a.capa) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></div>' : '<div class="capa sem"><span>' + esc(a.editoria_nome || "Artigo") + "</span></div>") +
      '<div class="corpo"><span class="tag ouro">' + esc(a.editoria_nome || "Artigo") + "</span><h3>" + esc(a.titulo) + "</h3>" +
      (a.linha_fina ? "<p>" + esc(a.linha_fina) + "</p>" : "") +
      "<small>" + esc(dataArtigo(a.data)) + " · " + (a.leitura || 1) + " min de leitura</small></div></a></article>";
  }

  function heroAutor() {
    var e = cfg.editor;
    return '<section class="hero-autor"><div class="wrap">' +
      '<div class="hero-texto"><span class="olho">Editor responsável</span>' +
      "<h1>" + esc(e.nome) + "</h1>" +
      '<p class="hero-cargo">Advogado em Sinop/MT · ' + esc(e.oab) + "</p>" +
      '<p class="hero-bio">' + esc(e.bio) + "</p>" +
      '<div class="hero-areas"><span>Penal e Júri</span><span>Família</span><span>Sucessões</span><span>Cível</span><span>Consumidor</span></div>' +
      '<div class="hero-botoes"><a class="botao wa" href="' + wa() + '" target="_blank" rel="noopener">' + ICONES.whats + 'Falar no WhatsApp</a><a class="botao vazado" href="#/advogado">Conheça o advogado</a></div></div>' +
      '<div class="hero-foto"><img src="advogado-busto.jpg" alt="' + esc(e.nome) + '" width="360" height="460"></div>' +
      "</div></section>";
  }

  /* Faixa de última hora (rolagem) */
  function flash() {
    var it = noticias.itens.slice(0, 10);
    if (!it.length) return "";
    var corpo = it.map(function (n) {
      return '<a href="' + linkNoticia(n) + '"><b>' + esc(n.fonte) + "</b>" + esc(n.titulo) + "</a>";
    }).join("");
    return '<div class="flash"><div class="wrap"><span class="flash-rotulo">Última hora</span>' +
      '<div class="flash-pista"><div class="flash-trilho">' + corpo + '<span class="flash-copia" aria-hidden="true">' + corpo + "</span></div></div></div></div>";
  }

  /* Guia rápido: informação permanente, com base legal */
  var GUIA = [
    { ic: "casa", t: "Pensão alimentícia atrasada", d: "A prisão civil alcança apenas as três parcelas anteriores ao pedido de execução e as que vencerem durante o processo.", base: "Súmula 309 do STJ e art. 528, § 7º, do CPC", msg: "Olá, Dr. Thalisson! Tenho uma dúvida sobre pensão alimentícia." },
    { ic: "contrato", t: "Divórcio sem culpa e sem prazo", d: "Não é preciso esperar nenhum tempo nem provar culpa. Havendo consenso e, em regra, sem filhos menores ou incapazes, pode ser feito em cartório.", base: "Emenda Constitucional 66/2010 e art. 733 do CPC", msg: "Olá, Dr. Thalisson! Gostaria de orientação sobre divórcio." },
    { ic: "doc", t: "Inventário: prazos", d: "O inventário deve ser aberto em até dois meses após o falecimento e concluído em até doze meses. Com herdeiros capazes e em acordo, pode ser feito em cartório.", base: "Arts. 610 e 611 do CPC", msg: "Olá, Dr. Thalisson! Preciso de orientação sobre inventário." },
    { ic: "balanca", t: "Prisão em flagrante", d: "A pessoa presa deve ser levada a um juiz em até 24 horas, na audiência de custódia, e tem direito de permanecer calada e de falar com advogado.", base: "Art. 5º, LXIII, da Constituição e art. 310 do CPP", msg: "Olá, Dr. Thalisson! Preciso de ajuda com uma prisão." },
    { ic: "carrinho", t: "Compra pela internet", d: "O consumidor pode desistir da compra feita fora da loja em até 7 dias, contados da assinatura do contrato ou do recebimento do produto, com devolução dos valores.", base: "Art. 49 do Código de Defesa do Consumidor", msg: "Olá, Dr. Thalisson! Tenho um problema com uma compra." },
    { ic: "carro", t: "Multa ou suspensão da CNH", d: "Toda notificação de trânsito informa o prazo para defesa. Perdê-lo pode fechar a porta para recorrer, por isso vale procurar orientação logo.", base: "Arts. 281 a 290 do Código de Trânsito Brasileiro", msg: "Olá, Dr. Thalisson! Recebi uma notificação de trânsito e preciso de orientação." }
  ];
  function guiaRapido() {
    return '<div class="secao-titulo"><h2>Entenda o Direito</h2><span>informação geral, com base legal</span></div><div class="guia">' +
      GUIA.map(function (g) {
        return '<article class="guia-item"><span class="guia-ic">' + ICONES[g.ic] + "</span><h4>" + esc(g.t) + "</h4><p>" + esc(g.d) + '</p><small>' + esc(g.base) + '</small><a href="' + wa(g.msg) + '" target="_blank" rel="noopener">Tirar uma dúvida</a></article>';
      }).join("") + '</div><p class="guia-nota">Informações gerais e educativas. Cada caso tem particularidades e deve ser analisado individualmente por um advogado.</p>';
  }

  /* Destaques da semana: notícias recentes de temas do dia a dia */
  function destaquesSemana(excl) {
    var limite = Date.now() - 7 * 864e5;
    var base = noticias.itens.filter(function (n) { return !excl[n.id] && new Date(n.data).getTime() >= limite; });
    base.forEach(function (n) {
      var temas = (n.editorias || []).filter(function (e) { return e !== "pratica"; }).length;
      n._p = temas * 10 + (n.imagem ? 2 : 0) + (n.fonte_id === "stf" || n.fonte_id === "stj" ? 1 : 0);
    });
    base.sort(function (a, b) { return b._p - a._p || new Date(b.data) - new Date(a.data); });
    return base.slice(0, 6);
  }

  /* Colunas por tribunal */
  function porTribunal(excl) {
    var cols = TRIBUNAIS.map(function (t) {
      var its = noticias.itens.filter(function (n) { return n.fonte_id === t.id; }).slice(0, 4);
      if (!its.length) return "";
      return '<section class="col-trib ' + t.id + '"><header><h3>' + t.nome + '</h3><a href="#/fonte/' + t.id + '">ver tudo</a></header><ul>' +
        its.map(function (n) { return '<li><a href="' + linkNoticia(n) + '">' + esc(n.titulo) + "</a><small>" + esc(rotuloDia(new Date(n.data))) + "</small></li>"; }).join("") + "</ul></section>";
    }).join("");
    return cols ? '<div class="secao-titulo"><h2>Direto dos tribunais</h2><span>STF, STJ e TJMT</span></div><div class="trib-colunas">' + cols + "</div>" : "";
  }

  /* Blocos por assunto */
  function porAssunto() {
    var ordem = ["penal", "familia", "sucessoes", "civel", "consumidor", "pratica"];
    var blocos = ordem.map(function (id) {
      var its = noticias.itens.filter(function (n) { return (n.editorias || []).indexOf(id) >= 0; }).slice(0, 3);
      if (!its.length) return "";
      return '<section class="assunto"><header><h3>' + NOME_ED[id] + '</h3><a href="#/editoria/' + id + '">mais</a></header>' +
        its.map(function (n) { return '<a class="assunto-item" href="' + linkNoticia(n) + '">' + esc(n.titulo) + "<small>" + esc(n.fonte) + " · " + esc(rotuloDia(new Date(n.data))) + "</small></a>"; }).join("") + "</section>";
    }).join("");
    return blocos ? '<div class="secao-titulo"><h2>Por assunto</h2><span>o que está sendo decidido</span></div><div class="assuntos">' + blocos + "</div>" : "";
  }

  function capa() {
    var itens = noticias.itens;
    var html = "";
    if (!itens.length) {
      html = '<div class="vazio"><h3>A primeira edição está sendo preparada</h3>O robô de atualização busca as notícias do STF, STJ e TJMT todos os dias às 4h. Volte em instantes.</div>';
    } else {
      var comImg = itens.slice(0, 12).filter(function (n) { return n.imagem; })[0];
      var juris = itens.filter(function (n) { return (n.editorias || []).indexOf("jurisprudencia") >= 0; });
      var man = comImg || juris[0] || itens[0];
      var usados = {}; usados[man.id] = 1;
      var dest = juris.filter(function (n) { return !usados[n.id]; }).slice(0, 3);
      if (dest.length < 3) dest = dest.concat(itens.filter(function (n) { return !usados[n.id] && dest.indexOf(n) < 0; }).slice(0, 3 - dest.length));
      dest.forEach(function (n) { usados[n.id] = 1; });

      html += '<div class="secao-titulo"><h2>Manchete</h2><span>' + esc(man.fonte) + " · " + fmtHora.format(new Date(man.data)) + "</span></div>";
      html += '<article class="manchete' + (man.imagem ? "" : " sem-img") + '">' +
        (man.imagem ? '<a href="' + linkNoticia(man) + '" class="img"><img src="' + esc(man.imagem) + '" alt="" referrerpolicy="no-referrer" onerror="var m=this.closest(\'.manchete\');m.classList.add(\'sem-img\');this.parentNode.remove()"></a>' : "") +
        '<div class="corpo"><div class="meta">' + tags(man) + '</div><a href="' + linkNoticia(man) + '"><h3>' + esc(man.titulo) + "</h3></a>" +
        (man.resumo ? "<p>" + esc(man.resumo) + "</p>" : "") + '<div class="meta">' + btnShare(urlNoticia(man), man.titulo) + "</div></div></article>";
      if (dest.length) {
        html += '<div class="secao-titulo"><h2>Destaques da jurisprudência</h2><span><a href="#/editoria/jurisprudencia">ver tudo</a></span></div><div class="destaques">';
        dest.forEach(function (n) {
          html += '<article class="card"><div class="meta">' + tags(n) + '</div><a href="' + linkNoticia(n) + '"><h4>' + esc(n.titulo) + "</h4></a>" +
            '<small class="suave-ui">' + esc(rotuloDia(new Date(n.data))) + " · " + fmtHora.format(new Date(n.data)) + "</small></article>";
        });
        html += "</div>";
      }

      var sem = destaquesSemana(usados);
      if (sem.length) {
        html += '<div class="secao-titulo"><h2>Em destaque na semana</h2><span>temas de maior alcance</span></div><ol class="ranking">';
        sem.forEach(function (n) { usados[n.id] = 1; html += '<li><a href="' + linkNoticia(n) + '"><b></b><span>' + esc(n.titulo) + "<small>" + esc(n.fonte) + " · " + esc(rotuloDia(new Date(n.data))) + "</small></span></a></li>"; });
        html += "</ol>";
      }

      html += guiaRapido();
      html += porTribunal();

      if (artigos.length) {
        html += '<div class="secao-titulo"><h2>Artigos do Dr. Thalisson</h2><span><a href="#/artigos">ver todos</a></span></div><div class="grade-artigos">' +
          artigos.slice(0, 2).map(function (a) { return cardArtigo(a); }).join("") + "</div>";
      }

      html += porAssunto();

      var resto = itens.filter(function (n) { return !usados[n.id]; });
      var parte = resto.slice(0, POR_PAGINA);
      html += '<div class="secao-titulo"><h2>Últimas notícias</h2><span>' + itens.length + " notícias nos últimos 30 dias</span></div>" + lista(parte);
      if (resto.length > parte.length) html += '<a class="mais" href="#/todas">Ver todas as notícias</a>';
    }
    $("principal").innerHTML = html;
  }

  function noticia(id) {
    var n = noticias.itens.filter(function (x) { return x.id === id; })[0];
    if (!n) { capa(); return; }
    var d = new Date(n.data);
    var rel = noticias.itens.filter(function (x) {
      return x.id !== n.id && (x.editorias || []).some(function (e) { return (n.editorias || []).indexOf(e) >= 0; });
    }).slice(0, 5);
    var tema = (n.editorias || []).filter(function (e) { return NOME_ED[e] && e !== "jurisprudencia" && e !== "pratica"; })[0];
    $("principal").innerHTML =
      '<article class="artigo noticia-det"><div class="meta">' + tags(n) + "</div>" +
      "<h1>" + esc(n.titulo) + "</h1>" +
      '<p class="suave-ui">' + esc(rotuloDia(d)) + " às " + fmtHora.format(d) + " · Fonte: " + esc(n.fonte) + "</p>" +
      (n.imagem ? '<img class="noticia-img" src="' + esc(n.imagem) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : "") +
      (n.resumo ? '<p class="linha-fina">' + esc(n.resumo) + "</p>" : "") +
      '<a class="botao" href="' + esc(n.link) + '" target="_blank" rel="noopener">Ler a notícia completa no site do ' + esc(n.fonte) + "</a>" +
      botoesCompartilhar(urlNoticia(n), n.titulo) +
      '<div class="cta-caso"><img src="' + esc(cfg.editor.foto) + '" alt=""><div><b>Precisa de orientação sobre ' + (tema ? "Direito " + (tema === "familia" ? "de Família" : tema === "sucessoes" ? "das Sucessões" : tema === "consumidor" ? "do Consumidor" : NOME_ED[tema]) : "este assunto") + "?</b>" +
      "<p>Cada caso tem particularidades. Converse com o " + esc(cfg.editor.nome) + " e entenda a sua situação.</p>" +
      '<a class="botao wa" href="' + wa("Olá, Dr. Thalisson! Li no Diário Jurídico a notícia \"" + n.titulo + "\" e gostaria de uma orientação.") + '" target="_blank" rel="noopener">' + ICONES.whats + "Falar no WhatsApp</a></div></div>" +
      "</article>" +
      (rel.length ? '<div class="secao-titulo" style="margin-top:28px"><h2>Leia também</h2></div>' + lista(rel) : "");
  }

  function paginaArtigos() {
    var html = '<div class="secao-titulo"><h2>Artigos</h2><span>por ' + esc(cfg.editor.nome) + "</span></div>";
    if (!artigos.length) html += '<div class="vazio">Em breve, novos artigos.</div>';
    else html += '<div class="grade-artigos">' + artigos.map(function (a, i) { return cardArtigo(a, i === 0); }).join("") + "</div>";
    $("principal").innerHTML = html;
  }

  function advogado() {
    var e = cfg.editor, c = cfg.contato;
    var areas = AREAS.map(function (a) {
      return '<div class="area"><span class="area-ic">' + ICONES[a.ic] + "</span><h3>" + esc(a.t) + "</h3><p>" + esc(a.d) + "</p>" +
        '<a href="' + wa("Olá, Dr. Thalisson! Vim pelo Diário Jurídico e gostaria de conversar sobre " + a.tema + ".") + '" target="_blank" rel="noopener">Conversar sobre este tema →</a></div>';
    }).join("");
    var faq = FAQ.map(function (f) { return "<details><summary>" + esc(f.p) + "</summary><p>" + esc(f.r) + "</p></details>"; }).join("");
    $("principal").innerHTML =
      '<section class="adv-topo"><div class="adv-foto"><img src="' + esc(e.foto_grande) + '" alt="' + esc(e.nome) + '"></div><div class="adv-texto">' +
      '<span class="olho">O Advogado</span><h1>' + esc(e.nome) + '</h1><p class="hero-cargo">' + esc(c.escritorio) + " · " + esc(e.oab) + "</p>" +
      "<p>Nasci em Petrolina, Pernambuco, e cresci entre Campina Grande, na Paraíba, e Sinop, onde concluí o ensino médio. Voltei ao Nordeste para começar o curso de Direito e retornei a Sinop para concluir a graduação em 2012.</p>" +
      "<p>Logo após a formatura, atuei por quatro anos como assessor de juiz e chefe de gabinete na Comarca de Guarantã do Norte. Essa experiência dentro do Judiciário me ensinou a enxergar o processo pelos olhos de quem decide, algo que levo para cada caso desde 2016, quando voltei a Sinop para advogar.</p>" +
      "<p>Sou pós-graduado em Direito Penal, Processo Penal, Direito Civil e Processo Civil, e professor de Direito Penal e Processo Penal na UNIFASIPE. Também atuo como palestrante e escrevo sobre Direito.</p>" +
      '<div class="hero-botoes"><a class="botao wa" href="' + wa() + '" target="_blank" rel="noopener">' + ICONES.whats + 'Falar no WhatsApp</a><a class="botao claro" href="' + insta() + '" target="_blank" rel="noopener">' + ICONES.insta + "@" + esc(c.instagram) + "</a></div>" +
      "</div></section>" +
      '<div class="secao-titulo"><h2>Áreas de atuação</h2></div><div class="areas">' + areas + "</div>" +
      '<div class="secao-titulo"><h2>Como funciona o atendimento</h2></div><ol class="passos">' +
      "<li><b>Primeiro contato</b><span>Você envia uma mensagem pelo WhatsApp contando, em poucas palavras, do que se trata.</span></li>" +
      "<li><b>Conversa sobre o caso</b><span>Agendamos um horário para ouvir sua história com calma, no escritório ou à distância.</span></li>" +
      "<li><b>Orientação e estratégia</b><span>Você recebe uma explicação clara sobre caminhos possíveis, riscos e próximos passos.</span></li></ol>" +
      '<div class="secao-titulo"><h2>Perguntas frequentes</h2></div><div class="faq">' + faq + "</div>" +
      '<div class="secao-titulo"><h2>Onde estamos</h2></div><div class="mapa-bloco"><iframe title="Mapa do escritório" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(c.mapa) + '&output=embed"></iframe>' +
      '<div class="mapa-info"><b>' + esc(c.escritorio) + "</b><p>" + esc(c.endereco) + '</p><a class="botao claro" href="' + mapsLink() + '" target="_blank" rel="noopener">' + ICONES.pin + 'Abrir no Google Maps</a><a class="botao wa" href="' + wa() + '" target="_blank" rel="noopener">' + ICONES.whats + esc(c.whatsapp_exibir) + "</a></div></div>";
  }

  function rota() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, "")), p = h.split("/");
    window.scrollTo(0, 0);
    var hero = $("hero");
    if (hero) hero.innerHTML = (p[0] === "" ? flash() + heroAutor() : "");
    var layout = document.querySelector("main.grade");
    if (layout) layout.classList.toggle("larga", p[0] === "advogado");
    if (p[0] === "editoria" && NOME_ED[p[1]]) {
      marcarMenu("ed-" + p[1]);
      paginada(NOME_ED[p[1]], "edição diária", noticias.itens.filter(function (n) { return (n.editorias || []).indexOf(p[1]) >= 0; }));
    } else if (p[0] === "fonte" && p[1]) {
      marcarMenu("fo-" + p[1]);
      var nome = (TRIBUNAIS.filter(function (t) { return t.id === p[1]; })[0] || { nome: p[1].toUpperCase() }).nome;
      paginada("Notícias do " + nome, "fonte oficial", noticias.itens.filter(function (n) { return n.fonte_id === p[1]; }));
    } else if (p[0] === "busca") {
      marcarMenu("");
      var q = p.slice(1).join("/"), termos = semAcento(q).split(/\s+/).filter(Boolean);
      $("campo-busca").value = q;
      var arts = artigos.filter(function (a) {
        var t = semAcento(a.titulo + " " + a.linha_fina + " " + a.html.replace(/<[^>]+>/g, " "));
        return termos.every(function (x) { return t.indexOf(x) >= 0; });
      });
      paginada("Busca: " + q, "", noticias.itens.filter(function (n) {
        var t = semAcento(n.titulo + " " + n.resumo + " " + n.fonte);
        return termos.every(function (x) { return t.indexOf(x) >= 0; });
      }));
      if (arts.length) $("principal").insertAdjacentHTML("afterbegin", '<div class="secao-titulo"><h2>Artigos encontrados</h2></div><div class="grade-artigos" style="margin-bottom:26px">' + arts.map(function (a) { return cardArtigo(a); }).join("") + "</div>");
    } else if (p[0] === "artigos" || p[0] === "coluna") {
      marcarMenu("artigos"); paginaArtigos();
    } else if (p[0] === "advogado") {
      marcarMenu("advogado"); advogado();
    } else if (p[0] === "noticia") {
      marcarMenu(""); noticia(p[1]);
    } else if (p[0] === "todas") {
      marcarMenu("inicio"); paginada("Todas as notícias", "últimos 30 dias", noticias.itens);
    } else {
      marcarMenu("inicio"); capa();
    }
  }

  /* Página de artigo */
  function artigo() {
    var id = new URLSearchParams(location.search).get("id");
    var a = artigos.filter(function (x) { return x.id === id; })[0];
    if (!a) { $("principal").innerHTML = '<div class="vazio">Artigo não encontrado. <a href="index.html#/artigos">Ver todos os artigos</a>.</div>'; return; }
    document.title = a.titulo + " | " + cfg.nome + " " + cfg.sub;
    var url = base() + "/artigo.html?id=" + encodeURIComponent(a.id);
    var outros = artigos.filter(function (x) { return x.id !== a.id; }).slice(0, 2);
    $("principal").innerHTML = '<article class="artigo"><div class="meta"><a class="tag fonte" href="index.html#/artigos">Artigos</a>' +
      (a.editoria_nome ? '<span class="tag ouro">' + esc(a.editoria_nome) + "</span>" : "") + "</div>" +
      "<h1>" + esc(a.titulo) + "</h1>" + (a.linha_fina ? '<p class="linha-fina">' + esc(a.linha_fina) + "</p>" : "") +
      '<div class="assinatura"><img src="' + esc(cfg.editor.foto) + '" alt=""><div><b>' + esc(cfg.editor.nome) + "</b> · " + esc(cfg.editor.oab) + "<br>" + esc(dataArtigo(a.data)) + " · " + (a.leitura || 1) + " min de leitura</div></div>" +
      (a.capa && a.html.indexOf(a.capa) < 0 ? '<img class="noticia-img" src="' + esc(a.capa) + '" alt="" referrerpolicy="no-referrer">' : "") +
      '<div class="texto">' + a.html + "</div>" +
      botoesCompartilhar(url, a.titulo) +
      '<div class="cta-caso"><img src="' + esc(cfg.editor.foto) + '" alt=""><div><b>Gostou do conteúdo?</b><p>Acompanhe o ' + esc(cfg.editor.nome) + ' no Instagram ou fale com o escritório pelo WhatsApp.</p>' +
      '<div class="hero-botoes"><a class="botao wa" href="' + wa("Olá, Dr. Thalisson! Li seu artigo \"" + a.titulo + "\" no Diário Jurídico e gostaria de conversar.") + '" target="_blank" rel="noopener">' + ICONES.whats + 'WhatsApp</a><a class="botao claro" href="' + insta() + '" target="_blank" rel="noopener">' + ICONES.insta + "@" + esc(cfg.contato.instagram) + "</a></div></div></div></article>" +
      (outros.length ? '<div class="secao-titulo" style="margin-top:28px"><h2>Outros artigos</h2></div><div class="grade-artigos">' + outros.map(function (x) { return cardArtigo(x); }).join("") + "</div>" : "");
  }

  function preparar() {
    try { var t = localStorage.getItem("tema"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
    return Promise.all([
      carregar("site.json").then(function (s) { cfg = mesclar(PADRAO, s); }).catch(function () {}),
      carregar("noticias.json").then(function (n) { noticias = n; noticias.itens = n.itens || []; }).catch(function () {}),
      carregar("artigos.json").then(function (a) {
        artigos = (a.artigos || []).filter(function (x) { return x.html; });
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
        montarCabecalho("artigos"); montarLateral(); montarRodape(); artigo();
      });
    }
  };
})();
