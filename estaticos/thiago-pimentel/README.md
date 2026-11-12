# Estáticos: Gestão de Passivo PJ (Pimentel Advocacia)

Dois estáticos para a conta **CA - Gestão de Passivo PJ**, focados em empresário com dor alta: dívida já atrasada, cobrança apertando, risco de execução.

**Versão 2 (estilo nativo).** A v1 parecia "template de IA" (gradiente, brilho, cards, botão falso). A v2 imita o que o empresário vê no próprio celular: print de tela com texto no estilo stories do Instagram. Tem foto real, interface de celular e rabisco à mão, sem efeitos.

| Peça | Feed 4:5 (1080×1350) | Stories/Reels 9:16 (1080×1920) |
|---|---|---|
| 01: Tela de bloqueio | `estatico-01-notificacoes-4x5.png` | `estatico-01-notificacoes-9x16.png` |
| 02: Nota "Plano pra salvar a empresa" | `estatico-02-refem-do-banco-4x5.png` | `estatico-02-refem-do-banco-9x16.png` |

## 01: tela de bloqueio às 7:12
Tela de bloqueio com a foto da própria empresa (uma oficina/metalúrgica) de papel de parede e a bateria no fim. Aparecem a mensagem do gerente ("63 dias atrasada, sem proposta até sexta vai pro jurídico") e a notificação do processo ("pedido de bloqueio das contas da empresa").
Texto stories: "empresário, se o seu celular amanheceu assim… …o próximo passo é a conta bloqueada. **fale com um advogado antes disso.**"

- **Título:** Seu celular amanheceu assim?
- **Texto principal:**
  EMPRESÁRIO: parcela do capital de giro atrasada, gerente avisando que vai mandar pro jurídico, processo com pedido de bloqueio das contas. Quando a cobrança chega nesse ponto, o próximo passo do banco costuma ser a execução: bloqueio das contas, penhora de bens e cobrança sobre sócios e avalistas. Quanto antes a estratégia for montada, mais espaço existe pra proteger o caixa da empresa. Existe a possibilidade de negociar a dívida com desconto. Dívida acima de R$ 200 mil. Cada caso é analisado individualmente. Preencha o formulário.

## 02: nota "Plano pra salvar a empresa" (23:41)
Print do app de notas com tudo o que o empresário já tentou, todos os itens marcados: renegociar com o gerente, empréstimo novo pra quitar o antigo, cheque especial pra pagar fornecedor, antecipar recebíveis, renegociar de novo. Ficam sem marcar "Entender por que a dívida só cresce" e "Falar com advogado de dívida bancária" (circulado em vermelho, com o cursor piscando). Embaixo: "obs: a dívida no banco já passou de 480 mil".
Texto stories: "já fez tudo isso e a dívida só aumentou? **falta o último item da lista.**"

- **Título:** Já fez tudo e a dívida só aumentou?
- **Texto principal:**
  EMPRESÁRIO: renegociou com o gerente, pegou empréstimo novo pra quitar o antigo, usou o cheque especial pra pagar fornecedor, antecipou recebíveis… e a dívida da empresa só aumentou? Cada renegociação feita sem estratégia costuma empurrar a conta pra frente com juro em cima de juro. Com análise do contrato e estratégia jurídica, existe a possibilidade de negociar a dívida antes que vire execução. Dívida acima de R$ 200 mil. Cada caso é analisado individualmente. Preencha o formulário.

## Cuidados (Provimento 205/2021 da OAB)
Não há promessa de resultado nem percentual de desconto. A linguagem é de possibilidade, e o aviso "Cada caso é analisado individualmente. Não há garantia de resultado." aparece na arte.
As interfaces de celular são genéricas: nenhuma marca de banco, nenhum logo de app real. Remetentes genéricos ("Gerente PJ", "Processo eletrônico").

## Créditos
Foto do papel de parede do estático 01: Pexels (foto 18569750, oficina/metalúrgica), licença gratuita que permite uso comercial sem atribuição.

## Como editar
Os fontes ficam em `src/` (HTML + `assets/`). Para mudar um texto ou o valor mínimo, edite o HTML e renderize de novo:

```bash
cd estaticos/thiago-pimentel/src
node render.js 1080 1350 4x5
node render.js 1080 1920 9x16
```
