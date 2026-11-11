# Mateus Klein: estáticos de Gestão de Passivos

São dois estáticos para a campanha de formulário (CTA do Meta: **Cadastre-se**). Cada um sai em dois formatos:

| Estático | Feed 4:5 (1080x1350) | Stories/Reels 9:16 (1080x1920) |
|---|---|---|
| 1. Checklist ("Seu caixa trabalha só para pagar o banco?") | `png/estatico-1-checklist-feed-4x5.png` | `png/estatico-1-checklist-stories-9x16.png` |
| 2. Notificações ("Isso virou rotina na sua empresa?") | `png/estatico-2-notificacoes-feed-4x5.png` | `png/estatico-2-notificacoes-stories-9x16.png` |

No 9:16, o conteúdo fica dentro da área segura: os 250 px do topo e os 340 px de baixo ficam livres para a interface do Stories/Reels.

## Por que dois conceitos diferentes

- **Estático 1 (claro, checklist):** o empresário se reconhece nos sintomas (capital de giro, cheque especial/cartão, parcela atrasada, medo de bloqueio). O "marcou 2 ou mais?" funciona como gancho de autoqualificação. O fundo claro destaca no feed, onde a maioria dos anúncios é escura.
- **Estático 2 (escuro, notificações):** quebra o padrão do feed com notificações de cobrança na tela de bloqueio. O CTA está em primeira pessoa ("Quero analisar meu caso").

Os dois podem rodar no mesmo conjunto de anúncios para ver qual gancho converte melhor.

## Copies sugeridas

### Estático 1: Checklist
**Título:** Seu caixa trabalha só para pagar o banco?

**Texto principal:**
> Empresário, se a sua empresa está usando capital de giro para cobrir parcela, rodando cheque especial e cartão todo mês e já tem parcela atrasada (ou prestes a atrasar), o problema não é só falta de caixa: é a estrutura da dívida.
>
> Pagar no desespero costuma piorar o quadro. Vêm mais juros, mais contratos empilhados e menos fôlego para operar. Antes de aceitar qualquer renegociação, vale entender quais alternativas existem para o passivo bancário da sua empresa.
>
> Cada caso é analisado individualmente. Se a sua empresa tem dívidas bancárias, clique no botão abaixo e preencha o formulário para uma análise do seu caso.

### Estático 2: Notificações
**Título:** Isso virou rotina na sua empresa?

**Texto principal:**
> Parcela em atraso. Limite estourado. Aviso de cobrança.
>
> Quando essas mensagens começam a chegar toda semana, muito empresário toma a pior decisão possível: paga no impulso ou aceita o primeiro acordo que o banco oferece.
>
> Nem todo acordo resolve. Alguns só empurram o problema e deixam o caixa ainda mais preso a contratos pesados. O caminho certo depende dos contratos, do tamanho do passivo e do momento da empresa.
>
> Cada caso é analisado individualmente. Se a sua empresa tem dívidas bancárias, clique no botão abaixo e preencha o formulário.

## OAB (Provimento 205/2021 e Código de Ética)

- Não há promessa de resultado, valores, gratuidade nem comparação. O texto é informativo e termina em "Cada caso é analisado individualmente."
- As notificações usam "BANCO" genérico, sem nome nem marca de instituição real.
- **Nº da OAB:** o art. 44 do Código de Ética pede o número de inscrição na publicidade. Para ele aparecer no rodapé, preencha `const OAB = 'OAB/UF 000.000';` no topo de cada HTML e gere os PNGs de novo.

## Como editar e gerar de novo

Edite o texto direto nos arquivos `estatico-*.html`. Depois rode:

```bash
node render.js            # gera todos os PNGs em png/
node render.js estatico-2 # só um deles
```

O script precisa do Playwright com Chromium e de internet para carregar as fontes (Archivo e Inter, do Google Fonts).
