# Diário Jurídico Ramos Advocacia

Portal de notícias e jurisprudência (STF, STJ, TJMT e Agência Brasil), editado pelo Dr. Thalisson Ramos, OAB/MT 23.316, Sinop/MT.

Endereço: https://thalissonramos.github.io/

## Como funciona

- O arquivo `atualizar.py` coleta as notícias nas fontes oficiais e especializadas, classifica por editoria e grava `noticias.json`.
- O GitHub Actions (`.github/workflows/atualizar.yml`) roda o robô uma vez por dia, às 4h da manhã (horário de Cuiabá), e publica o site.
- Os artigos são gerados por `gerar_artigos.py` a partir das Issues abertas pelo dono do repositório com o formulário **Novo artigo**.
- Para atualizar na hora: aba **Actions** > **Atualizar notícias e publicar** > **Run workflow**.

## Como editar

| O que mudar | Arquivo |
|---|---|
| WhatsApp, Instagram, e-mail, endereço, bio | `site.json` |
| Artigos | aba **Issues** > **New issue** > **Novo artigo** |
| Foto do editor | `foto.jpg` |
| Cores e fontes | `estilo.css` |

Para editar no próprio GitHub: abra o arquivo, clique no lápis (Edit), altere e clique em **Commit changes**. O site é republicado sozinho em cerca de 1 minuto.

### Publicar um artigo (funciona pelo celular, no app do GitHub)

1. Abra **Issues** > **New issue** > **Novo artigo** (ou use o link "Área do autor" no rodapé do site).
2. Escreva o título, a linha fina, escolha a editoria e cole o texto. Fotos podem ser arrastadas para os campos.
3. Clique em **Create**. Em cerca de 1 minuto o artigo está no ar.

Para corrigir, edite a Issue. Para retirar do ar, feche a Issue (**Close issue**).

## Aviso

Conteúdo informativo e educativo. Manchetes e resumos pertencem às fontes indicadas, sempre com link para a publicação original.
