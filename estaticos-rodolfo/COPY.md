# Estáticos: Gestão de Passivos PJ, Dr. Rodolfo Clivatti (RC Advocacia)

Conta Meta: `1004090062378914` (C.A - GESTÃO DE PASSIVOS PJ). Formato 4:5 (1080x1350, exportado em 2160x2700).
Corte de dívida usado: **acima de R$ 200 mil**, o mesmo dos roteiros de novembro. Se o formulário no ar ainda for o de 100K, ajustar o valor no HTML e rodar `node render.js` de novo.

Os dois seguem o visual dos estáticos que já rodam na conta: título condensado, caixa "Empresário, é simples" e botão "Preencha o formulário".
Nenhum dos dois promete resultado (Provimento 205/2021 da OAB).

---

## Estático 01: A única conta que ninguém negocia (Black Friday)

Arquivo: `png/01-black-friday.png`
Ângulo: o Ad 01 dos roteiros de novembro. Vale rodar até 27/11 (Black Friday). Depois de 28/11, pausar ou tirar o selo da data.

**Título:** A única conta que ninguém negocia

**Texto principal:**
EMPRESÁRIO, na Black Friday você compara o preço da televisão em cinco sites e ainda procura cupom. E a dívida de mais de R$ 200 mil que a sua empresa tem no banco?

A maior conta da empresa costuma ser tratada como preço de etiqueta. Não é. Prazo se conversa. Parcela se conversa. Até o que já atrasou se conversa.

Se a sua empresa deve mais de R$ 200 mil ao banco e está atrasando ou vai atrasar, preencha o formulário. A nossa equipe analisa o seu caso e entra em contato com você.

**Botão:** Saiba mais

---

## Estático 02: Pouso planejado ou pouso forçado?

Arquivo: `png/02-pouso-planejado.png`
Ângulo: o Ad 02 dos roteiros de novembro. Fala com os dois perfis do formulário: "em dia, mas vai atrasar" (planejado) e "em atraso" (forçado).

**Título:** Pouso planejado ou forçado?

**Texto principal:**
EMPRESÁRIO, piloto nenhum espera o combustível acabar pra pedir pouso. Mas muita empresa com mais de R$ 200 mil no banco espera a parcela atrasar pra agir.

Pouso planejado é quando você ainda escolhe a pista: mede o que cabe no caixa e leva uma proposta ao banco. Pouso forçado é quando a parcela já atrasou e as condições chegam prontas. A diferença entre os dois é o momento.

Se a sua empresa deve mais de R$ 200 mil ao banco e está atrasando ou vai atrasar, preencha o formulário. A nossa equipe analisa o seu caso e entra em contato com você.

**Botão:** Saiba mais

---

## Como editar e gerar de novo

```bash
cd estaticos-rodolfo
node render.js
```

O texto da arte fica nos arquivos `01-black-friday.html` e `02-pouso-planejado.html`. O estilo comum fica em `base.css`.
