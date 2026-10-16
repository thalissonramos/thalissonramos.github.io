# Diário Jurídico Ramos Advocacia

Portal de notícias e jurisprudência (STF, STJ, TJMT, CNJ, ConJur e Agência Brasil), editado pelo Dr. Thalisson Ramos, OAB/MT 23.316, Sinop/MT.

Endereço: https://thalissonramos.github.io/

## Como funciona

- O arquivo `atualizar.py` coleta as notícias nas fontes oficiais e especializadas, classifica por editoria e grava `noticias.json`.
- O GitHub Actions (`.github/workflows/atualizar.yml`) roda o robô 4 vezes por dia (6h05, 11h05, 15h05 e 19h05, horário de Cuiabá) e publica o site.
- Para atualizar na hora: aba **Actions** > **Atualizar notícias e publicar** > **Run workflow**.

## Como editar

| O que mudar | Arquivo |
|---|---|
| WhatsApp, Instagram, e-mail, endereço, bio | `site.json` |
| Artigos da Coluna do Professor | `artigos.json` |
| Foto do editor | `foto.jpg` |
| Cores e fontes | `estilo.css` |

Para editar no próprio GitHub: abra o arquivo, clique no lápis (Edit), altere e clique em **Commit changes**. O site é republicado sozinho em cerca de 1 minuto.

### Novo artigo

Em `artigos.json`, copie um bloco existente e altere `id` (sem espaços nem acentos), `titulo`, `linha_fina`, `data` (AAAA-MM-DD), `editoria` (`civel`, `familia`, `sucessoes`, `penal`, `consumidor`, `pratica` ou `jurisprudencia`) e `texto`. No texto, uma linha em branco separa os parágrafos, `## ` inicia um subtítulo e `**palavra**` deixa em negrito.

## Aviso

Conteúdo informativo e educativo. Manchetes e resumos pertencem às fontes indicadas, sempre com link para a publicação original.
