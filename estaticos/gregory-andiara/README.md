# Estáticos · Gestão de Passivo PJ · Dr. Gregory e Dra. Andiara (Schemes & Remonti)

Novembro/2026 · lead quente, dívida bancária PJ acima de **R$ 200 mil**.

Feitos em cima dos dois estáticos que mais convertem na conta (últimos 90 dias):

| Estático que já roda | Gasto | Leads | Custo por lead |
|---|---|---|---|
| EST 02 · Pergunta com filtro (amarelo) | R$ 1.609,82 | 57 | R$ 28,24 |
| EST 01 · Citação e prazos (escuro, linha do tempo) | R$ 176,82 | 6 | R$ 29,47 |
| Melhor vídeo (Andiara 01), para comparar | R$ 3.727,08 | 80 | R$ 46,59 |

| Peça nova | Base | Arquivos |
|---|---|---|
| GA03 · "Empresário, o banco já bloqueou a conta da sua empresa?" | EST 02 (amarelo) | `png/ga03-conta-bloqueada-amarelo-3x4.png`, `-9x16.png` |
| GA04 · "Atrasou a parcela do banco? Veja o que vem depois." | EST 01 (linha do tempo) | `png/ga04-atrasou-o-que-vem-depois-3x4.png`, `-9x16.png` |

## Texto do anúncio (sugestão, no mesmo modelo do EST 02)

**GA03** · Título: `O banco bloqueou a conta da empresa?`

> EMPRESÁRIO, duas perguntas rápidas:
>
> O banco já bloqueou conta, faturamento ou bens da sua empresa?
> A dívida bancária passa de R$ 200 mil?
>
> Se as duas respostas forem sim, o seu caso pode ser analisado agora. Existem caminhos jurídicos para defender a empresa e proteger o caixa, e eles dependem do que está no contrato e no processo.
>
> Toque em CADASTRE-SE e preencha o formulário para falar com a nossa equipe.

**GA04** · Título: `Atrasou a parcela do banco?`

> EMPRESÁRIO, atrasar a parcela do banco é só o primeiro degrau.
>
> Depois do atraso podem vir o vencimento antecipado (o banco cobra o saldo inteiro de uma vez), a execução na Justiça e a penhora de contas, faturamento e bens.
>
> Cada caso tem particularidades, e é no contrato que se descobre quais caminhos existem. Quanto antes a análise, mais opções.
>
> Empresa com mais de R$ 200 mil em dívida bancária: toque em CADASTRE-SE e preencha o formulário para falar com a nossa equipe.

## Editar e gerar de novo

```bash
node render.js          # gera todos
node render.js ga04     # só uma peça
```

Saída em `png/` (3:4 = 1080x1440, igual aos que rodam; 9:16 = 1080x1920 com margem para a interface de Stories/Reels).
