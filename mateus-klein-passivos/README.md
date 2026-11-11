# Mateus Klein: estáticos de Gestão de Passivos

São dois estáticos para a campanha de formulário (CTA do Meta: **Cadastre-se**). Cada um sai em dois formatos:

| Estático | Feed 4:5 (1080x1350) | Stories/Reels 9:16 (1080x1920) |
|---|---|---|
| 1. Checklist ("Sua empresa fatura. Quem lucra é o banco?") | `png/estatico-1-checklist-feed-4x5.png` | `png/estatico-1-checklist-stories-9x16.png` |
| 2. Notificações ("Seu dia começa com o banco cobrando?") | `png/estatico-2-notificacoes-feed-4x5.png` | `png/estatico-2-notificacoes-stories-9x16.png` |

No 9:16, o conteúdo fica dentro da área segura: os 250 px do topo e os 340 px de baixo ficam livres para a interface do Stories/Reels.

## Por que dois conceitos diferentes

- **Estático 1 (claro, checklist):** contraste direto entre "fatura" e "quem lucra é o banco". O checklist usa a linguagem do dia a dia do empresário ("bola de neve", "todo santo mês", "gerente cobrando", "acordar com a conta bloqueada"). O fechamento vira a chave: "O problema não é venda. É a dívida." O fundo claro destaca no feed, onde a maioria dos anúncios é escura.
- **Estático 2 (escuro, notificações):** tela de bloqueio às 08:12 cheia de cobrança, com o gancho "Seu dia começa com o banco cobrando?". O apoio é "Acordo fechado no desespero vira dívida nova." O CTA está em primeira pessoa ("Quero proteger minha empresa").

Os dois podem rodar no mesmo conjunto de anúncios para ver qual gancho converte melhor.

## Copies sugeridas

### Estático 1: Checklist
**Título:** Sua empresa fatura. Quem lucra é o banco?

**Texto principal:**
> Sua empresa vende, fatura, trabalha o mês inteiro… e no fim quem fica com o lucro é o banco.
>
> Capital de giro que virou bola de neve. Cheque especial e cartão todo santo mês. Parcela atrasada e gerente ligando. Se você se reconheceu, o problema não é falta de venda: é a estrutura da dívida.
>
> E pagar no desespero só piora: mais juros, mais contratos empilhados e menos caixa para operar. Antes de aceitar qualquer renegociação, entenda quais caminhos jurídicos existem para o passivo bancário da sua empresa.
>
> Cada caso é analisado individualmente. Clique no botão abaixo e preencha o formulário.

### Estático 2: Notificações
**Título:** Seu dia começa com o banco cobrando?

**Texto principal:**
> 08h12. Você nem tomou café e o banco já cobrou três vezes.
>
> Parcela atrasada. Limite estourado. Aviso de cobrança. Quando isso vira rotina, a tentação é pagar no impulso ou assinar o primeiro acordo que o banco oferece. Só que acordo fechado no desespero costuma virar dívida nova.
>
> Antes de assinar qualquer coisa, entenda as alternativas para a dívida bancária da sua empresa. O caminho certo depende dos contratos, do tamanho do passivo e do momento do seu negócio.
>
> Cada caso é analisado individualmente. Clique no botão abaixo e preencha o formulário.

## OAB (Provimento 205/2021 e Código de Ética)

- Não há promessa de resultado, valores, gratuidade nem comparação com outros escritórios. As frases provocam a dor, mas não garantem desfecho, e os dois estáticos terminam com "Cada caso é analisado individualmente."
- As notificações usam "BANCO" genérico, sem nome nem marca de instituição real.
- **Nº da OAB:** o art. 44 do Código de Ética pede o número de inscrição na publicidade. Para ele aparecer no rodapé, preencha `const OAB = 'OAB/UF 000.000';` no topo de cada HTML e gere os PNGs de novo.

## Como editar e gerar de novo

Edite o texto direto nos arquivos `estatico-*.html`. Depois rode:

```bash
node render.js            # gera todos os PNGs em png/
node render.js estatico-2 # só um deles
```

O script precisa do Playwright com Chromium e de internet para carregar as fontes (Archivo e Inter, do Google Fonts).
