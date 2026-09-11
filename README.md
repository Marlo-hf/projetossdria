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

O sistema é a **transcrição corretiva**: a notação que o produto devolve ao aluno
(barra âmbar, marcação de tempo em monoespaçada, etiqueta de falta grave) abre a
página no hero e reaparece nas quatro frases fatais e no painel de correção. Quem
lê aprende a notação em dez segundos e depois reconhece âmbar como caso perdido no
resto da página.

As cores têm função e não são enfeite:

| Cor | Significado | Onde aparece |
|---|---|---|
| Violeta `#9084E4` | marca e fala do SDR | logo, locutor `sdr`, fase 04, marcadores |
| Âmbar `#F2B33D` | erro e falta grave | linha marcada, frases fatais, nota reprovada, aviso de preço |
| Verde `#3FD0AD` | o que passou | reunião marcada, informações colhidas |

Tipografia: Bricolage Grotesque 800 nos títulos, IBM Plex Sans no texto, IBM Plex
Mono só onde o conteúdo é registro de conversa.

## Decisões que valem manter

- **Sem animação de entrada.** Movimento só responde a ação do usuário: hover,
  foco, abertura do acordeão, estado da barra de navegação ao rolar.
- **Composição varia por seção.** Duas colunas com coluna fixa, tabela editorial
  de três colunas, log de conversa com blocos de larguras diferentes, cartão. Não
  existe nenhuma sequência de cards iguais.
- **Coluna de 1000px, tudo alinhado à esquerda.** Acima de 1300px o índice da
  seção sai para a margem externa. A barra de navegação alinha com a coluna.
- **Acessibilidade.** Todo texto passa em WCAG AA sobre o fundo composto, foco de
  teclado visível, acordeão com `aria-expanded` e painel fechado fora da árvore de
  acessibilidade, `prefers-reduced-motion` respeitado.

## Verificado

Renderizado e medido em Chromium de 320px a 1920px: nenhum estouro horizontal,
nenhuma célula de grid colapsada, nenhum texto abaixo de 11px, contraste mínimo
de 4.59:1 em todos os trechos de texto.
