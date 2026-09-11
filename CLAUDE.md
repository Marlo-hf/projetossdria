# CLAUDE.md

Orientação para o Claude Code (claude.ai/code) trabalhando neste repositório.

## O que é

Repositório da página de vendas do **Professor SDR** (Unlockify Digital),
formação para SDR de escritório de advocacia de gestão de passivos bancários.

## Estrutura

- `site/index.html`, a página inteira: HTML, CSS e um script curto num arquivo só.
- `site/_headers`, cabeçalhos de resposta do Netlify.
- `netlify.toml`, aponta o deploy para `site/`, para que README e CLAUDE não fiquem públicos.
- `README.md`, direção visual, decisões e o que falta definir.

Não há build, gerenciador de pacotes, teste ou linter, e não existe comando de
build ou teste para documentar. Para ver a página, abrir o arquivo no navegador.

## Sistema visual

A página segue a casa do site da Unlockify (`unlockify.com.br`): Inter 800 com
tracking apertado, violeta `#9184D9`, fundo `#161826`, capítulos alternando
escuro e claro (`#F4F4FB`), raio de 12 a 18px, pílulas, rótulos violeta em caixa
alta, brilho radial suave e o produto aparecendo como janela de app branca
flutuando no escuro.

**As regras antigas do briefing (raio de 3px, sem gradiente, sem sombra, largura
de 1000px, sem rótulo em caixa alta, sem animação) foram substituídas pelo
cliente.** Não restaurar.

## Regras que continuam valendo

Estas são de conformidade e de copy, não de estética:

- **Nenhum travessão em nenhum texto.** Usar vírgula, dois pontos ou ponto.
- Sem depoimento, logo de cliente, número de alunos ou selo de garantia
  inventados. Nada disso existe ainda.
- Sem promessa de resultado para o escritório.
- Os números reais do briefing: 143 conversas, 935 mensagens, 8 módulos,
  52 questões, 20 situações, 16 acertos, 6 aulas, 3 simulações, 10 tentativas,
  45 minutos, R$ 297 e R$ 97.
- Cada cor semântica tem par por superfície, porque o violeta e o âmbar da
  marca não alcançam 4.5:1 sobre fundo claro. Usar `--violet-ink`,
  `--amber-ink`, `--green-ink` em capítulo claro e `--violet-lite` em pílula
  sobre escuro elevado.

## Armadilhas já encontradas

- **Nunca colocar `overflow:hidden` em `.band`.** Isso quebra o `position:sticky`
  do console da simulação e da coluna de preço, e o console some da tela sem
  nenhum erro aparecer. Ao mexer em sticky, medir a posição do elemento na
  rolagem, não só o estado.
- Não declarar `width` em classe que divida elemento com `.wrap`, senão a
  coluna estoura.
- Em grid de coluna única, redefinir `grid-area` de todos os filhos. Sem isso
  uma célula colapsa para largura zero e o texto atropela o vizinho.
- Conferir de 320px a 1920px, e a história do scroll em desktop e celular: no
  celular a faixa de leitura da batida fica abaixo do console fixo.
- Manter o marcador `COLE_AQUI_O_LINK_DA_KIWIFY` até o link real existir.
- **Publicar só no projeto Netlify `professor-sdr-lp`** (site id
  `a26c01aa-69bf-4581-aca8-fc8958f4a6f1`). O projeto `professor-sdr`, que serve
  `sdr.unlockify.com.br`, é o aplicativo do curso com o login dos alunos, e
  publicar a LP nele derruba o produto. Conferir a URL no ar antes de qualquer
  deploy.
