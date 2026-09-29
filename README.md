# Bordo — Gestão de clientes + Diário de bordo

Um "ClickUp" feito sob medida para gestão de clientes (agência / gestor de tráfego): cada cliente tem **uma pasta organizada** com tarefas, **diário de bordo**, métricas semanais e informações/acessos — tudo em um só lugar.

## Como usar

Não precisa instalar nada. Abra o `index.html` no navegador **ou** publique a pasta em qualquer hospedagem estática (Netlify, Vercel, GitHub Pages).

Para rodar localmente com servidor:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Os dados ficam salvos no navegador (localStorage). Use **Ajustes → Exportar backup** para salvar/transportar os dados.
Na primeira abertura aparecem dados de exemplo; clique em **Começar do zero** para usar com seus clientes reais.

## Trazendo seus dados (ClickUp e planilhas)

- **ClickUp:** importe o arquivo `bordo-clickup-import.json` em **Ajustes → Importar backup**. Ele traz clientes, tarefas, status, equipe e o histórico de tarefas concluídas. Por segurança, esse arquivo **não** fica no repositório (que é público).
- **Planilhas de diário de bordo (.xlsx):** na pasta do cliente, aba **Diário de bordo → 📥 Importar planilha**. Lê as colunas *Data · Análise · Ações programadas para buscar melhoria · Ações realizadas* e ignora linhas já importadas. No Google Sheets, use *Arquivo → Fazer download → Microsoft Excel*.

## O que tem

Interface no estilo do ClickUp, mais enxuta:

- **Barra lateral em árvore:** Início, Demandas, Demandas da equipe, Diário de bordo e o espaço **Clientes** com uma pasta por cliente (Visão geral · Demandas · Diário de bordo), além de Produção de criativos e Interno.
- **Clientes (CRM):** tabela com cliente, o que ele mexe, página do Meta, conta de anúncio, responsável na agência, status, demandas abertas e data do último diário.
- **Pasta do cliente:** Visão geral com os dados do cliente editáveis (salvam sozinhos), Demandas em lista agrupada por status, Quadro e Diário de bordo.
- **Diário de bordo:** tabela no formato da planilha (Data · Análise · Ações programadas p/ melhoria · Ações realizadas). A ação programada pode virar tarefa; dá para importar planilhas .xlsx e copiar o diário.
- **Demandas da equipe:** o que falta fazer por pessoa (abertas e atrasadas); arrastar um cartão passa a demanda para outra pessoa.
- **Tarefas:** status, responsável, vencimento e prioridade editáveis direto na lista (clique na célula), janela da tarefa com descrição, checklist e atividade/comentários.
- Busca com `Ctrl+K`, `N` cria tarefa, tema claro/escuro e layout para celular.

## Estrutura

```
index.html          # casca da aplicação
assets/styles.css   # estilos (tema claro/escuro, responsivo, impressão)
js/utils.js         # datas, formatação, texto
js/store.js         # estado, persistência, regras (saúde, recorrência) e dados de exemplo
js/components.js    # toast/modal e componentes (listas, kanban, diário, gráficos)
js/views.js         # páginas, formulários e painel da tarefa
js/app.js           # roteador (hash), ações, atalhos, paleta de comandos, arrastar e soltar
```
