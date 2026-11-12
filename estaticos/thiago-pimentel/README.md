# Estáticos: Gestão de Passivo PJ (Pimentel Advocacia)

Dois estáticos para a conta **CA - Gestão de Passivo PJ**, focados em empresário com dor alta: dívida já atrasada, cobrança apertando, risco de execução.

Sem visual de "template de IA": nada de gradiente, brilho, card arredondado ou botão falso. O 01 usa foto real e layout de peça impressa; o 02 é um print do celular com texto no estilo stories e rabisco à mão.

| Peça | Feed 4:5 (1080×1350) | Stories/Reels 9:16 (1080×1920) |
|---|---|---|
| 01: "Mandar pro jurídico" | `estatico-01-mandar-pro-juridico-4x5.png` | `estatico-01-mandar-pro-juridico-9x16.png` |
| 02: Nota "Plano pra salvar a empresa" | `estatico-02-refem-do-banco-4x5.png` | `estatico-02-refem-do-banco-9x16.png` |

## 01: "O gerente já falou em 'mandar pro jurídico'?"
Foto real de um empresário com a mão na cabeça, fazendo conta. A chamada pega o empresário no momento exato em que a dor está no pico: o gerente já ameaçou mandar a dívida pro jurídico, ou seja, a execução está perto. Layout simples de peça impressa: bloco creme com a manchete e um marca-texto amarelo, foto embaixo, faixa vermelha com o valor mínimo e rodapé com a marca.

- **Título:** O gerente já falou em mandar pro jurídico?
- **Texto principal:**
  EMPRESÁRIO: quando a parcela atrasa e o gerente começa a falar em "mandar pro jurídico", a cobrança está mudando de fase. O próximo passo costuma ser a execução: bloqueio das contas, penhora de bens e cobrança sobre sócios e avalistas. Antes disso, com análise do contrato e estratégia jurídica, existe a possibilidade de negociar a dívida. Dívida acima de R$ 200 mil. Cada caso é analisado individualmente. Preencha o formulário.

## 02: nota "Plano pra salvar a empresa" (23:41)
Print do app de notas com tudo o que o empresário já tentou, todos os itens marcados: renegociar com o gerente, empréstimo novo pra quitar o antigo, cheque especial pra pagar fornecedor, antecipar recebíveis, renegociar de novo. Ficam sem marcar "Entender por que a dívida só cresce" e "Falar com advogado de dívida bancária" (circulado em vermelho, com o cursor piscando). Embaixo: "obs: a dívida no banco já passou de 480 mil".
Texto stories: "já fez tudo isso e a dívida só aumentou? **falta o último item da lista.**"

- **Título:** Já fez tudo e a dívida só aumentou?
- **Texto principal:**
  EMPRESÁRIO: renegociou com o gerente, pegou empréstimo novo pra quitar o antigo, usou o cheque especial pra pagar fornecedor, antecipou recebíveis… e a dívida da empresa só aumentou? Cada renegociação feita sem estratégia costuma empurrar a conta pra frente com juro em cima de juro. Com análise do contrato e estratégia jurídica, existe a possibilidade de negociar a dívida antes que vire execução. Dívida acima de R$ 200 mil. Cada caso é analisado individualmente. Preencha o formulário.

## Cuidados (Provimento 205/2021 da OAB)
Não há promessa de resultado nem percentual de desconto. A linguagem é de possibilidade, e o aviso "Cada caso é analisado individualmente. Não há garantia de resultado." aparece na arte.
A interface de celular do 02 é genérica: nenhuma marca de banco, nenhum logo de app real.

## Créditos
Foto do estático 01: Pexels (foto 16282309), licença gratuita que permite uso comercial sem atribuição.

## Como editar
Os fontes ficam em `src/` (HTML + `assets/`). Para mudar um texto ou o valor mínimo, edite o HTML e renderize de novo:

```bash
cd estaticos/thiago-pimentel/src
node render.js 1080 1350 4x5
node render.js 1080 1920 9x16
```
