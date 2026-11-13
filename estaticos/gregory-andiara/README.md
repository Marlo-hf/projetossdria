# Estáticos · Gestão de Passivo PJ · Dr. Gregory e Dra. Andiara (Schemes & Remonti)

Novembro/2026 · lead quente, dívida bancária PJ acima de **R$ 200 mil**.
Layout no padrão do `gregory-feed` que já roda: foto de empresário preocupado (gerada no Canva, não são os advogados), chamada condensada, faixa dourada, botão branco e logo.

| Peça | Chamada | Arquivos |
|---|---|---|
| GA05 | "O banco bloqueou a conta da empresa? Não espere a penhora." | `png/ga05-conta-bloqueada-4x5.png`, `-9x16.png` |
| GA06 | "A parcela do banco já atrasou? Não espere a execução." | `png/ga06-parcela-atrasou-4x5.png`, `-9x16.png` |

Fotos: `img/empresario-1.jpg` e `img/empresario-2.jpg` (1824x2272), também no Canva, no design "Anúncio de gestão de passivo PJ" (páginas 2 e 3).

## Texto do anúncio (sugestão, no modelo do estático que mais converte na conta)

**GA05** · Título: `O banco bloqueou a conta da empresa?`

> EMPRESÁRIO, duas perguntas rápidas:
>
> O banco já bloqueou conta, faturamento ou bens da sua empresa?
> A dívida bancária passa de R$ 200 mil?
>
> Se as duas respostas forem sim, o seu caso pode ser analisado agora. Existem caminhos jurídicos para defender a empresa e proteger o caixa, e eles dependem do que está no contrato e no processo.
>
> Toque em CADASTRE-SE e preencha o formulário para falar com a nossa equipe.

**GA06** · Título: `A parcela do banco já atrasou?`

> EMPRESÁRIO, atrasar a parcela do banco é só o primeiro passo.
>
> Depois do atraso podem vir o vencimento antecipado (o banco cobra o saldo inteiro de uma vez), a execução na Justiça e a penhora de contas, faturamento e bens.
>
> Cada caso tem particularidades, e é no contrato que se descobre quais caminhos existem. Quanto antes a análise, mais opções.
>
> Empresa com mais de R$ 200 mil em dívida bancária: toque em CADASTRE-SE e preencha o formulário para falar com a nossa equipe.

## Editar e gerar de novo

```bash
node render.js          # gera todos
node render.js ga06     # só uma peça
```

Saída em `png/` (4:5 = 1080x1350; 9:16 = 1080x1920 com margem para a interface de Stories/Reels).
