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

- **Início**: foco do dia (atrasadas + hoje), alertas inteligentes ("precisa de atenção"), saúde de cada cliente, atividade recente do diário, produtividade da semana.
- **Pasta do cliente** com abas:
  - **Visão geral** — KPIs, próximas tarefas, últimos registros, gráfico Leads × CPL, metas, contato, links e notas.
  - **Tarefas** — lista (agrupada por prazo/status/prioridade/responsável) ou quadro Kanban com arrastar e soltar.
  - **Diário de bordo** — no mesmo formato da planilha (Análise · Ações programadas · Ações realizadas), com frases prontas, ação programada que vira tarefa, visão *Linha do tempo* ou *Planilha*; além de registro rápido por tipo (otimização, campanha, criativo, reunião, problema, resultado…), impacto positivo/negativo, métricas e tags; linha do tempo por dia, registros fixados, mapa de frequência, busca/filtros, copiar resumo para WhatsApp, exportar `.md` e imprimir/PDF.
  - **Métricas** — histórico semanal (investimento, leads, qualificados, reuniões, contratos, honorários) com CPL, custo por contrato, ROAS e comparação com a semana anterior.
  - **Informações & acessos** — dados, contato, contrato, metas, links, IDs de contas e notas (salva automaticamente).
- **Saúde do cliente (0–100)**: calculada por tarefas atrasadas, dias sem registro no diário, CPL vs meta e métricas desatualizadas.
- **Relatório da semana** gerado automaticamente (métricas + diário + tarefas), pronto para copiar ou abrir no WhatsApp.
- **Tarefas completas**: checklist, comentários, histórico, tempo gasto, recorrência (diária/semanal/quinzenal/mensal), tags, responsável.
- Tarefa concluída vira registro automático no diário do cliente.
- **Calendário** mensal com prazos e registros (arraste para mudar prazo).
- **Busca global / comandos** (`Ctrl+K`), atalhos (`N` tarefa, `D` diário, `C` cliente, `G` + `I/T/C/D/K` navegar), desfazer exclusões, modo escuro e layout para celular.

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
