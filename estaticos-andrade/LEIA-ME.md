# Estático Parcela atrasada · Andrade (modelo José Moura)

Estático de **gestão de passivos** do Andrade (Dr. Guilherme Andrade), feito no layout do
estático campeão do José Moura ("Até 360 dias de fôlego para o caixa").

**Por que esta mensagem:** a única campanha ativa da conta é a `[MF] 11/07 ESTATICOS`. Ela
depende de um só anúncio, o **"Estático B | Parcela atrasada"**: 137 leads, CPL R$ 55,55 nos
últimos 90 dias, no ar desde 11/07. O diário de bordo marca queda recente ("2 dias sem
entrega" em 06/11 e "cpl deu uma aumentada" em 10/11). Por isso a peça nova mantém a mensagem
que já converte ("Parcela atrasada não precisa virar penhora, bloqueio de conta ou nome
negativado") e troca o visual pelo formato que performa no José. Assim ela renova o criativo
sem testar um ângulo do zero.

Ela não repete os dois estáticos de 06/11 que estão no Drive ("Juros abusivos..." e "180 dias
sem cobranças"), que ainda não aparecem na conta. Dá para subir os três juntos como teste.

## Arquivos

| Arquivo | Uso |
|---|---|
| `png/andrade-parcela-atrasada-feed-1080x1350.png` | Feed (4:5): Facebook, Instagram |
| `png/andrade-parcela-atrasada-stories-1080x1920.png` | Stories e Reels (9:16) |
| `estatico-parcela-atrasada.html` | Fonte editável (textos e medidas por formato) |
| `render.js` | Gera os PNGs: `node render.js` |

No Gerenciador, suba os dois no mesmo anúncio e use a personalização de mídia por
posicionamento: 4:5 no feed e 9:16 em stories e reels.

## Texto do anúncio

**Texto principal**

> EMPRESÁRIO, a parcela do banco atrasou e as cobranças não param?
>
> Atraso não precisa virar penhora, bloqueio de conta ou CNPJ negativado. Existem medidas judiciais que podem suspender a cobrança enquanto o valor real da dívida é rediscutido.
>
> A proposta do gerente resolve o problema do banco, não o seu. Antes de aceitar qualquer acordo, vale analisar o contrato: juros, encargos e garantias.
>
> Existe defesa para o devedor PJ, e o banco só torce para você não usar.
>
> Mas cada caso é um caso. Por isso, o primeiro passo é analisar o contrato com um especialista.
>
> 👉 Se a sua empresa tem mais de R$ 300 mil em dívidas bancárias, toque em "Cadastre-se" e preencha o formulário: o Andrade Advocacia avalia o seu caso.

**Título:** Parcela atrasada não precisa virar penhora

**Descrição:** Dívida bancária acima de R$ 300 mil

**Botão:** Cadastre-se

## Para conferir antes de subir

- **Nome:** usei "ANDRADE ADVOCACIA", como no anúncio campeão e no texto dele. Os estáticos de
  06/11 usam "ANDRADE ADVOGADOS". Se for esse, troque no `.brand` do HTML e rode `node render.js`.
- **Régua:** a peça fala em "mais de R$ 300 mil", como na descrição do campeão. O anúncio
  "Inventário" usa R$ 100 mil. Confirme qual é a régua atual do formulário.
- **OAB (Provimento 205/2021):** é conteúdo informativo. Usa "podem" e não promete
  resultado, e traz a ressalva "cada caso exige análise individual".

Foto de fundo: Unsplash (photo-1449157291145-7efd050a4d0e), licença Unsplash, uso comercial
liberado. Fontes: Source Serif 4 e Montserrat (Google Fonts, OFL).
