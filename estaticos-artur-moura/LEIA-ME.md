# Estático Pronampe · Artur Moura (modelo José Moura)

Estático de **gestão de passivos** do Artur Moura no layout do estático campeão do José Moura
("Até 360 dias de fôlego para o caixa": 92 leads a CPL R$ 48,56 nos últimos 30 dias, campanha
`[UNLOCKFY] [LEADS] [GESTÃO DE PASSIVO] - Acima de R$ 200k - 19.10.2026`).

**Por que este estático:** na reunião de 09/11 ficou combinado testar um estático na campanha
do Artur. O Lucas observou que, nas contas do José, quem traz lead são os estáticos. A ideia é
fazer o funil vídeo → estático. Por isso a mensagem é a mesma do anúncio que mais gera lead na
conta do Artur, o **"Vídeo 07 - PRONAMPE e FGI"** (98 leads, CPL R$ 74,18 nos últimos 90 dias).
Quem viu o vídeo reencontra a mesma ideia no estático.

## Arquivos

| Arquivo | Uso |
|---|---|
| `png/artur-moura-pronampe-feed-1080x1350.png` | Feed (4:5): Facebook, Instagram |
| `png/artur-moura-pronampe-stories-1080x1920.png` | Stories e Reels (9:16) |
| `estatico-pronampe.html` | Fonte editável (textos e medidas por formato) |
| `render.js` | Gera os PNGs: `node render.js` |

No Gerenciador, suba os dois no mesmo anúncio e use a personalização de mídia por
posicionamento: 4:5 no feed e 9:16 em stories e reels.

## Texto do anúncio

**Texto principal**

> EMPRESÁRIO, sua empresa tem Pronampe ou FGI em atraso e as cobranças do banco não param?
>
> Muita gente acredita que, se parar de pagar, o fundo garantidor quita a dívida. Não é assim. O fundo honra a garantia com o banco, mas a dívida da empresa continua, e a cobrança também.
>
> Com o atraso, o banco pode antecipar o vencimento do contrato e levar a cobrança à Justiça. Na execução, as contas da empresa podem ser bloqueadas e o sócio que assinou como garantidor também pode ser cobrado.
>
> Existe caminho jurídico: revisar contratos, juros e encargos e montar uma estratégia de renegociação ou de defesa que caiba no caixa da empresa.
>
> Mas cada caso é um caso. Por isso, o primeiro passo é analisar os contratos antes de parar de pagar ou de aceitar qualquer acordo.
>
> 👉 Se a sua empresa tem mais de R$ 200 mil em dívidas bancárias, toque em "Cadastre-se" e solicite a análise.

**Título:** Pronampe atrasado? O fundo não paga por você

**Descrição:** Análise jurídica antes de qualquer acordo

**Botão:** Cadastre-se (formulário com a régua de R$ 200 mil)

## Para conferir antes de subir

- **Grafia do nome:** usei "ARTUR MOURA ADVOGADOS", como aparece no Drive e nas reuniões. O
  estático "Conta amanhecer bloqueada" usa "ARTHUR" e o "Sua empresa não precisa quebrar" usa
  "AM Advogados". Se for outra, troque no `.brand` do HTML e rode `node render.js`.
- **Régua:** a peça fala em "mais de R$ 200 mil", a régua nova definida na reunião de 09/11.
- **OAB (Provimento 205/2021):** é conteúdo informativo, sem promessa de resultado e com a
  ressalva "cada caso exige análise individual".

Foto de fundo: Unsplash (photo-1486406146926-c627a92ad1ab), licença Unsplash, uso comercial
liberado. Fontes: Source Serif 4 e Montserrat (Google Fonts, OFL).
