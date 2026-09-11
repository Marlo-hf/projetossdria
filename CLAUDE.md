# CLAUDE.md

Orientação para o Claude Code (claude.ai/code) trabalhando neste repositório.

## O que é

Repositório da página de vendas do **Professor SDR** (Unlockify Digital),
formação para SDR de escritório de advocacia de gestão de passivos bancários.

## Estrutura

- `index.html`, a página inteira: HTML, CSS e um script curto num arquivo só.
- `README.md`, briefing de entrega, direção visual e o que falta definir.

Não há build, gerenciador de pacotes, teste ou linter. Não existe comando de
build, execução ou teste para documentar. Para ver a página, abrir o arquivo no
navegador ou servir o diretório.

## Regras que a página precisa respeitar

Estas vieram do briefing do cliente e não são preferência de estilo:

- **Nenhum travessão em nenhum texto.** Usar vírgula, dois pontos ou ponto.
- Sem rótulo em caixa alta acima dos títulos, sem separador com pontinho no meio,
  sem seta colada no texto de botão.
- Sem gradiente, sem sombra, sem brilho, sem cards iguais em sequência.
- Sem animação de entrada. Movimento só como resposta a uma ação do usuário.
- Sem imagem de banco, sem ícone genérico, sem depoimento, logo de cliente,
  número de alunos ou selo de garantia inventados. Nada disso existe ainda.
- Sem promessa de resultado para o escritório.
- Raio de borda entre 3px e 4px, largura máxima de 1000px, texto alinhado à
  esquerda, linha de no máximo 62 caracteres.

As cores carregam significado fixo: violeta é marca e fala do SDR, âmbar é erro
ou falta grave, verde é o que passou. Não usar nenhuma delas fora disso.

## Ao alterar a página

- Conferir de 320px a 1920px. A transcrição do hero é o elemento de abertura e
  precisa continuar legível no celular.
- `.shell` define a largura da coluna. Não declarar `width` em nenhuma classe que
  divida elemento com `.shell`, senão a coluna estoura.
- Em grid de coluna única, redefinir `grid-area` de todos os filhos. Sem isso uma
  célula colapsa para largura zero e o texto atropela o vizinho.
- Manter o marcador `COLE_AQUI_O_LINK_DA_KIWIFY` até o link real existir.
