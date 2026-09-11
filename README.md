# Professor SDR, página de vendas

Página de vendas da formação **Professor SDR** (Unlockify Digital), para SDR de
escritório de advocacia que trabalha com gestão de passivos bancários de empresa.

Arquivo único: **`index.html`**. Sem build, sem framework, sem dependência.
Basta publicar o arquivo. As fontes vêm do Google Fonts, e não há nenhuma imagem.

## Antes de publicar

1. **Link do checkout.** Trocar o marcador `COLE_AQUI_O_LINK_DA_KIWIFY` pela URL
   da Kiwify. Ele aparece em três lugares, o botão do hero, o do cartão de preço
   e o do fechamento, cada um sinalizado por um comentário no HTML.
2. **Contato de equipe.** A última linha do cartão de preço fala em formar uma
   equipe inteira, mas ainda não existe canal definido para isso. Hoje é texto
   puro. Quando houver e-mail ou WhatsApp, virar link.

## Direção visual

A página segue a casa do site da Unlockify (`unlockify.com.br`), extraída do
próprio site renderizado:

- **Inter** 800 com tracking apertado nos títulos
- Violeta `#9184D9`, fundo `#161826`
- **Capítulos alternando escuro e claro** (`#F4F4FB`), que dão ritmo à leitura
- Raio de 12 a 18px, pílulas em `999px`
- Rótulo violeta em caixa alta abrindo cada seção
- Brilho radial violeta discreto, vindo de um canto
- O produto aparecendo como **janela de app branca flutuando no escuro**

Monoespaçada aparece só dentro da janela do produto, onde o conteúdo é registro
de conversa.

### Onde a página vai além do site de origem

1. **O mockup não é parado.** A janela do produto roda uma simulação inteira
   conduzida pelo scroll.
2. **Cada cor semântica tem par por superfície.** O violeta e o âmbar da marca
   não alcançam 4.5:1 sobre fundo claro, então existem `--violet-ink`,
   `--amber-ink` e `--green-ink` para capítulo claro, e `--violet-lite` para
   pílula sobre escuro elevado.
3. **Nenhuma fileira de cards iguais.** A seção de fases usa o padrão da casa,
   mas a quarta carta inverte de cor porque é a prova, não por decoração.

### O momento central

O console fica fixo, o roteiro rola ao lado, e em sete estados a ligação
acontece na tela: o relógio avança, as falas entram uma a uma, a nota sobe até
55 e **cai para 40** na falta grave, a reunião fica verde no passo 06 (parece
vitória) e no 07 a correção mostra que reunião marcada não salva a nota.

Sem biblioteca: `position: sticky` mais `IntersectionObserver` mais transições
de `transform` e `opacity`.

## Cores com significado fixo

| Cor | Significado | Onde aparece |
|---|---|---|
| Violeta | marca e fala do SDR | logo, locutor `sdr`, rótulos, fase 04 |
| Âmbar | erro e falta grave | linha marcada, frases fatais, nota reprovada |
| Verde | o que passou | reunião marcada, informações colhidas |

## Decisões que valem manter

- **Nenhuma animação gratuita.** Não existe fade-in genérico de seção. Todo
  movimento carrega informação: o waveform é voz, o medidor é a nota caindo, os
  estados são a narrativa, a contagem do 143 é a contagem de conversas.
- **Nenhum travessão em nenhum texto**, regra de copy do cliente.
- **Nada inventado.** Sem depoimento, logo de cliente, número de alunos ou selo
  de garantia, e sem promessa de resultado para o escritório.

## Armadilha conhecida

Nunca colocar `overflow:hidden` em `.band`. Isso quebra o `position:sticky` do
console e da coluna de preço, e o console some da tela sem nenhum erro aparecer.
Já aconteceu uma vez. Ao mexer em sticky, medir a posição do elemento durante a
rolagem, não só o estado.

## Verificado

Renderizado e medido em Chromium de 320px a 1920px: nenhum estouro horizontal,
nenhuma célula de grid colapsada, nenhum texto abaixo de 11px, nenhum erro de
JavaScript, e a barra de navegação cabe em todas as larguras.

Contraste WCAG AA em todo texto, medido com composição de alfa sobre o fundo
real, nos capítulos escuros e claros.

A história do scroll foi verificada estado por estado e por posição em desktop e
em dois tamanhos de celular, incluindo a checagem de que o console realmente
gruda e de que o texto da batida ativa nunca fica atrás dele. Com
`prefers-reduced-motion` a narrativa continua inteira, só sem as transições.

## O que ainda falta definir

- Link do checkout da Kiwify
- Preço do pacote de tentativas adicionais
- Se haverá condição para matrícula de equipe, e qual
- Domínio onde a página vai ficar publicada
