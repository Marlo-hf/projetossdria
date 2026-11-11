# Estáticos: Dr. Guilherme Andrade (Andrade Advocacia)

6 estáticos de gestão de passivo bancário PJ, no modelo do estático JMA do José Moura ("Até 360 dias de fôlego para o caixa"):
foto escura em P&B, logo no topo, cartão creme com manchete serifada, bloco escuro com barra vermelha, 4 ícones e botão vermelho.

Cada peça sai em dois formatos, na pasta `saida/`:

- `*-4x5.jpg`: feed (1620×2025)
- `*-9x16.jpg`: stories/reels (1620×2880, com topo e base livres para a interface do Instagram)

| # | Peça | Chamada | Botão na arte |
|---|------|---------|---------------|
| 01 | Renegociação | O banco ofereceu renegociação? A parcela cai. **A dívida, não.** | Quero a análise do meu caso |
| 02 | Pronampe / aval | Atrasou o Pronampe? A cobrança pode sair do CNPJ e **chegar no seu CPF.** | Quero proteger meu CPF |
| 03 | 4 estágios | Em qual destes **4 estágios** está a dívida da sua empresa? | Responder o formulário |
| 04 | Dívida não cai | Sua empresa paga todo mês e a dívida **não diminui?** | Quero revisar minha dívida |
| 05 | Banco tem advogado | O banco tem um time de advogados. **E a sua empresa?** | Quero um advogado do meu lado |
| 06 | Antes do vencimento | O que você faz **antes do vencimento** muda o que o banco pode fazer depois. | Quero agir antes do atraso |

Todas as peças levam embaixo do botão a linha "Empresas com dívida bancária acima de R$ 300 mil · responda em menos de 1 minuto".
Essa linha pré-qualifica o lead e reduz o atrito para preencher o formulário.

## Pontos para conferir antes de subir

- **Régua de R$ 300 mil:** é a dos estáticos que estão rodando hoje na campanha `[MF] 11/07 ESTATICOS`. Os vídeos de setembro usam R$ 100 mil. Para trocar em todas as peças, altere `REGUA` em `pecas.js` e rode o build de novo.
- **"Menos de 1 minuto":** vale se o formulário continuar curto (faixa de dívida, situação e tipo, com os contatos já preenchidos pelo Meta).
- **Logo:** emblema "A" da logo oficial, sem o círculo azul e sem o texto, em cinza (`#cfcfcf`), ao lado de "ANDRADE / ADVOCACIA" no mesmo tom.
  O emblema (`marca/emblema-andrade.svg`) foi redesenhado em vetor a partir do selo, porque o arquivo original tem só 150×150 px.
  Se houver o vetor oficial, substitua o SVG. A cor fica em `marca.cor` (`pecas.js`).

## Como gerar de novo

```bash
node build.js        # todas as peças
node build.js 03     # só a peça 03
```

Para mudar textos, edite `pecas.js`. Na manchete, o trecho entre `[colchetes]` vira o destaque vermelho.
O build avisa (`EXCEDE`) se algum texto passar da área útil do formato.

## Legendas sugeridas (texto principal do anúncio · botão Meta: Cadastre-se)

### 01 · Renegociação
**Título:** A parcela cai. A dívida, não.

Renegociar com o banco não recalcula a sua dívida. Só reparcela a mesma conta.

Os juros que já correram, as tarifas e o que foi cobrado a mais não são revistos: tudo vira um novo saldo devedor, e o banco volta a cobrar juros em cima dele. Por isso a parcela cai e a dívida não.

Renegociação é prazo. Revisão é conta. Quando o contrato tem cobrança indevida, dá para discutir. Mas isso depende do que está escrito nele, por isso cada caso é analisado individualmente.

👉 Se a sua empresa tem mais de R$ 300 mil em dívida bancária, toque em Cadastre-se e responda o formulário. Leva menos de 1 minuto.

### 02 · Pronampe / aval
**Título:** Atrasou o Pronampe? O aval está no seu CPF

Atrasou as parcelas do Pronampe? Muita gente só descobre tarde que a lei do Pronampe exige garantia pessoal do sócio. Quando a empresa atrasa, a cobrança não fica só no CNPJ.

Protesto, negativação do avalista, execução e penhora de bens pessoais: cada etapa tem defesa. Mas ela depende do estágio da cobrança e do que está no contrato.

👉 Se a sua empresa tem mais de R$ 300 mil em dívida bancária, toque em Cadastre-se e responda o formulário para uma análise do seu caso.

### 03 · 4 estágios
**Título:** Em qual estágio está a sua dívida?

Estágio 1: está tudo em dia, mas o juro come o caixa todo mês.
Estágio 2: começou a atrasar e o gerente já ligou.
Estágio 3: já negativou e travou crédito novo.
Estágio 4: chegou cobrança, notificação ou execução.

Cada estágio tem uma saída jurídica diferente e, principalmente, um prazo diferente. Quem está no 1 tem opções que quem está no 4 já não tem.

👉 Diga o seu estágio no formulário. Se a sua empresa tem mais de R$ 300 mil em dívida bancária, toque em Cadastre-se.

### 04 · Dívida não cai
**Título:** Paga todo mês e a dívida não cai?

Sua empresa paga, paga, e a dívida não diminui? Costuma ser sinal de juros e encargos mal aplicados: juros acima do contratado, juros sobre juros, tarifa que ninguém combinou, seguro que ninguém pediu.

Quando existe cobrança indevida, ela pode ser contestada. Mas depende do que está escrito no seu contrato, por isso a análise é individual.

👉 Se a sua empresa tem mais de R$ 300 mil em dívida bancária, toque em Cadastre-se e responda o formulário.

### 05 · Banco tem advogado
**Título:** O banco tem advogado. E a sua empresa?

Capital de giro, Pronampe, cheque especial, cartão PJ. Nenhum desses contratos foi escrito pelo gerente: foram escritos por advogados, para proteger o banco.

Do outro lado da mesa, na hora de assinar, só tinha você.

Revisão de contrato, tutela de urgência e acordo extrajudicial são caminhos previstos em lei, e o que cabe depende do seu caso. Existe defesa para o devedor PJ, e o banco só torce para você não usar.

👉 Se a sua empresa tem mais de R$ 300 mil em dívida bancária, toque em Cadastre-se e responda o formulário.

### 06 · Antes do vencimento
**Título:** Antes do vencimento, ainda existe janela

A parcela do banco vai atrasar no mês que vem? O que você faz antes do vencimento muda o que o banco pode fazer depois.

Depois do atraso, o contrato pode vencer de uma vez, o CNPJ é negativado e a cobrança acelera até a execução e o bloqueio de conta.

Antes disso existe janela: medidas como a tutela de urgência estão previstas em lei, e o que cabe depende do seu caso. Quem age cedo negocia de pé. Quem espera a execução negocia de joelhos.

👉 Se a sua empresa tem mais de R$ 300 mil em dívida bancária, toque em Cadastre-se e responda o formulário.

## Créditos

- Fotos: Unsplash (licença Unsplash, uso comercial livre, sem atribuição obrigatória). IDs:
  01 `photo-1775150031269-8ec41aecd1db` · 02 `photo-1647926760549-308f42ff14ec` · 03 `photo-1764307465084-bf5ba6ffa9d0` ·
  04 `photo-1608292390250-1d5d24e843a7` · 05 `photo-1581135548552-6b898da04acd` · 06 `photo-1752936660488-ea5dba4bbebf`.
  Nas fotos 02 e 05 foram apagados letreiros e logos de empresas reais (inclusive de um banco).
- Fontes: Source Serif 4 e Red Hat Display (Google Fonts, SIL Open Font License).
- Ícones: Lucide (licença ISC, ver `icones/LICENSE-lucide.txt`).
