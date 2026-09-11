# Professor SDR, página de vendas

Página de vendas da formação **Professor SDR** (Unlockify Digital), para SDR de
escritório de advocacia que trabalha com gestão de passivos bancários de empresa.

Arquivo único: **`index.html`**. Sem build, sem framework, sem dependência.
Basta publicar o arquivo. As fontes vêm do Google Fonts, e não há nenhuma imagem.

## Antes de publicar

1. **Link do checkout.** Trocar o marcador `COLE_AQUI_O_LINK_DA_KIWIFY` pela URL
   da Kiwify. Ele aparece em dois lugares, o botão do hero e o botão do cartão de
   preço, cada um sinalizado por um comentário no HTML.
2. **Contato de equipe.** A última linha do cartão de preço fala em formar uma
   equipe inteira, mas ainda não existe canal definido para isso. Hoje é texto
   puro. Quando houver e-mail ou WhatsApp, virar link.

## Direção visual

**Console de simulação.** O produto é uma prova falada com relógio correndo, nota
que se mexe e falta que fica registrada. A página adota a linguagem do instrumento:
timecode como espinha, medidores que se movem, waveform de voz, fio de 1px,
tipografia gigante contra metadados minúsculos em monoespaçada.

A regra de forma saiu da assinatura de marca da Unlockify: **dado é reto, energia é
redonda**. Transcrição, fios e leituras ficam retos e monoespaçados. O que é vivo
(waveform, medidor de nota, a própria marca) usa o traço de terminal arredondado
do logo.

O logo "Ui" é SVG inline, redesenhado a partir do vídeo de marca. As cores foram
amostradas dos frames: fundo `#141728`, violeta `#A794EE`, elevação de luz
`#38305F`.

### O momento central

A seção 02 é uma história conduzida pelo scroll. O console fica fixo, o roteiro
rola ao lado, e em sete estados a ligação acontece na tela: o relógio avança, as
falas entram uma a uma, a nota sobe até 55 e **cai para 40** na falta grave, a
reunião fica verde no passo 06 (parece vitória) e no 07 a correção mostra que
reunião marcada não salva a nota. Sem biblioteca: `position: sticky` mais
`IntersectionObserver` mais transições de `transform` e `opacity`.

As cores têm função e não são enfeite:

| Cor | Significado | Onde aparece |
|---|---|---|
| Violeta `#A794EE` | marca e fala do SDR | logo, locutor `sdr`, fase 04, marcadores |
| Âmbar `#F2B33D` | erro e falta grave | linha marcada, frases fatais, nota reprovada, aviso de preço |
| Verde `#3FD0AD` | o que passou | reunião marcada, informações colhidas |

Tipografia: Bricolage Grotesque 800 nos títulos, IBM Plex Sans no texto, IBM Plex
Mono só onde o conteúdo é registro de conversa.

## Decisões que valem manter

- **Nenhuma animação gratuita.** Não existe fade-in genérico de seção. Todo
  movimento carrega informação: o waveform é voz, o medidor é a nota caindo, os
  estados são a narrativa, a contagem do 143 é a contagem de conversas, a luz do
  botão é affordance, a paralaxe é profundidade.
- **Composição varia por seção.** Hero em perspectiva 3D, lista editorial com
  citações gigantes, console fixo com roteiro rolando, índice de elenco, tabela
  de três colunas, número editorial com log de conversa, comparativo lado a lado,
  cartão de preço, acordeão, fechamento cinematográfico. Nenhuma se repete.
- **Coluna de 1240px, tudo alinhado à esquerda.** A barra de navegação alinha com
  a coluna de conteúdo.
- **Acessibilidade.** Todo texto passa em WCAG AA sobre o fundo composto, foco de
  teclado visível, acordeão com `aria-expanded` e painel fechado fora da árvore de
  acessibilidade, `prefers-reduced-motion` respeitado.

## Verificado

Renderizado e medido em Chromium de 320px a 1920px: nenhum estouro horizontal,
nenhuma célula de grid colapsada, nenhum texto abaixo de 11px, nenhum erro de
JavaScript. Contraste mínimo de 4.64:1 em todos os trechos de texto, medido com
composição de alfa sobre o fundo real.

A história do scroll foi verificada estado por estado no desktop e em três
tamanhos de celular, incluindo a checagem de que o texto da batida ativa nunca
fica atrás do console fixo. Com `prefers-reduced-motion` a narrativa continua
inteira, só sem as transições.
