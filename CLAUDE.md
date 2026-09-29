# CLAUDE.md

## Projeto

**Bordo** — app web estático (HTML/CSS/JS puro, sem build e sem dependências) de gestão de clientes com tarefas, diário de bordo e métricas. Veja `README.md`.

## Rodar

`python3 -m http.server 8000` e abrir `http://localhost:8000` (ou abrir `index.html` direto). Não há build, lint nem testes automatizados; valide com `node --check js/*.js` e abrindo no navegador.

## Arquitetura

- Scripts clássicos carregados em ordem (`utils → store → components → views → app`), cada um expõe um global (`U`, `Store`/`META`, `UI`/`C`, `Views`/`Forms`/`VS`, `App`). Mantém funcionando via `file://`.
- Estado em `Store.state` persistido em `localStorage` (`bordo:data:v1`); preferências de visualização em `VS` (`bordo:ui:v1`).
- Renderização por template strings + `innerHTML`; sempre escapar texto do usuário com `U.esc`.
- Eventos por delegação: `data-action` (clique → `Actions`), `data-change` (→ `Changes`), `data-input` (→ `Inputs`). `Store.save()` dispara re-render da página e do painel da tarefa.
- Interface e textos em português (pt-BR).
