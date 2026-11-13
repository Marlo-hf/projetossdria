# Estáticos · Gestão de Passivo PJ · Dr. Thiago Pimentel (Pimentel Advocacia)

Novembro/2026 · foco em lead quente (dívida com banco acima de R$ 200 mil, atrasando ou para atrasar).

| Peça | Ângulo | Arquivos |
|---|---|---|
| PM05 · Quem liga agora é a cobrança | Tela bloqueada com chamadas perdidas e SMS de cobrança | `png/pimentel-pm05-cobranca-ligando-4x5.png`, `-9x16.png` |
| PM06 · Dia 5: folha ou banco? | Conta do dia 5 que não fecha (caixa – folha – parcela) | `png/pimentel-pm06-folha-ou-banco-4x5.png`, `-9x16.png` |

## Editar e gerar de novo

Os textos ficam nos `.html`. Depois de editar:

```bash
node render.js          # gera todos
node render.js pm06     # só uma peça
```

Saída em `png/` (4:5 = 1080x1350; 9:16 = 1080x1920, com margem de segurança para a interface de Stories/Reels).
