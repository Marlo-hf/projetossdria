/* Páginas, formulários e o painel de detalhes da tarefa. */
(function () {
  const e = U.esc;
  const M = window.META;

  /* ============================== Estado de visualização ============================== */
  const VS_KEY = 'bordo:ui:v1';
  const VS_DEFAULT = {
    taskView: 'list', groupBy: 'due',
    clientTaskView: 'list', clientGroupBy: 'status',
    filters: { q: '', clientId: '', priority: '', assignee: '', hideDone: false },
    collapsed: [],
    calMonth: null,
    journal: { q: '', type: '', clientId: '', period: '30', hideAuto: false },
    clientLog: { q: '', type: '', hideAuto: false },
    clientsFilter: { status: '', q: '', sort: 'health' },
    composerType: 'analise',
    logView: 'timeline',
    bannerClosed: false,
  };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(VS_KEY) || '{}'); } catch (err) { saved = {}; }
  const VS = { ...VS_DEFAULT, ...saved };
  ['filters', 'journal', 'clientLog', 'clientsFilter'].forEach((k) => { VS[k] = { ...VS_DEFAULT[k], ...(saved[k] || {}) }; });
  VS.save = () => { try { const { save, ...rest } = VS; localStorage.setItem(VS_KEY, JSON.stringify(rest)); } catch (err) { /* ignore */ } };

  /* ============================== Helpers ============================== */
  const clientOptions = (selected, { internal = true, placeholder } = {}) => {
    let html = placeholder ? `<option value="">${e(placeholder)}</option>` : '';
    if (internal && !placeholder) html += `<option value="" ${!selected ? 'selected' : ''}>Interno (sem cliente)</option>`;
    Store.clients().forEach((c) => { html += `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${e(c.name)}${c.status === 'encerrado' ? ' (encerrado)' : ''}</option>`; });
    return html;
  };
  const options = (list, selected, labelKey = 'label') => list.map((x) => `<option value="${x.id}" ${x.id === selected ? 'selected' : ''}>${e(x[labelKey])}</option>`).join('');
  const teamOptions = (selected, withNone = true) => {
    const team = [...new Set([...(Store.settings.team || []), ...(selected ? [selected] : [])])];
    return (withNone ? `<option value="" ${!selected ? 'selected' : ''}>Sem responsável</option>` : '') + team.map((n) => `<option ${n === selected ? 'selected' : ''}>${e(n)}</option>`).join('');
  };
  const adsLink = (acc) => {
    const v = String(acc || '').trim();
    if (/^https?:/i.test(v)) return v;
    const id = v.replace(/^act_/i, '').replace(/\D/g, '');
    return id ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${id}` : '';
  };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  const miniLog = (l) => {
    const tp = M.logType[l.type] || M.logType.nota;
    const c = Store.client(l.clientId);
    return `<div class="mini-item" data-action="goto" data-href="#/cliente/${l.clientId}/diario" >
      <span style="font-size:16px">${tp.icon}</span>
      <div class="grow"><div class="ellipsis" style="font-weight:600">${e(l.title || tp.label)}</div>
      <div class="small muted ellipsis">${c ? `<span style="color:${e(c.color)}">●</span> ${e(c.name)} · ` : ''}${e(U.fmtDayLabel(l.date))} ${e(l.time || '')}</div></div>
      ${l.impact !== 'neutro' ? `<span class="impact ${l.impact}">${l.impact === 'positivo' ? '▲' : '▼'}</span>` : ''}
    </div>`;
  };

  const kpi = (label, value, sub = '', cls = '', action = '') => `
    <div class="card kpi ${action ? 'clickable' : ''}" ${action}>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${cls}">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>`;

  /** Alertas inteligentes: o que precisa de atenção agora. */
  const buildAlerts = (clientId) => {
    const T = U.today();
    const alerts = [];
    const clients = clientId ? [Store.client(clientId)] : Store.clients({ includeClosed: false });
    clients.forEach((c) => {
      if (!c) return;
      const overdue = Store.tasks({ clientId: c.id, open: true }).filter((t) => Store.isOverdue(t));
      if (overdue.length) alerts.push({ level: 'bad', icon: '⏰', title: `${overdue.length} tarefa(s) atrasada(s) — ${c.name}`, sub: overdue.slice(0, 2).map((t) => t.title).join(' · '), href: `#/cliente/${c.id}/tarefas` });
      if (c.status !== 'pausado') {
        const last = Store.lastLog(c.id);
        const since = last ? U.diffDays(T, last.date) : null;
        if (!last || since > Store.settings.staleDays) alerts.push({ level: 'warn', icon: '📓', title: `Diário parado — ${c.name}`, sub: last ? `Último registro manual ${U.daysAgoLabel(last.date)}` : 'Nenhum registro manual ainda', href: `#/cliente/${c.id}/diario` });
      }
      const ms = Store.metricsFor(c.id); const lm = ms[ms.length - 1];
      const cpl = Store.derive(lm).cpl;
      if (lm && c.goals?.cpl && cpl > c.goals.cpl * 1.1) alerts.push({ level: 'bad', icon: '📈', title: `CPL acima da meta — ${c.name}`, sub: `${U.fmtMoney(cpl)} vs meta ${U.fmtMoney(c.goals.cpl)} (semana de ${U.fmtDate(lm.week)})`, href: `#/cliente/${c.id}/metricas` });
      if (c.status === 'ativo' && (!lm || U.diffDays(T, lm.week) > 13)) alerts.push({ level: 'info', icon: '📊', title: `Atualizar métricas — ${c.name}`, sub: lm ? `Última semana registrada: ${U.fmtDate(lm.week)}` : 'Nenhuma métrica registrada', href: `#/cliente/${c.id}/metricas` });
      if (c.contract?.renewal) {
        const dd = U.diffDays(c.contract.renewal, T);
        if (dd >= 0 && dd <= 15) alerts.push({ level: 'info', icon: '📄', title: `Renovação de contrato em ${dd} dia(s) — ${c.name}`, sub: U.fmtLong(c.contract.renewal), href: `#/cliente/${c.id}/info` });
      }
      const waiting = Store.tasks({ clientId: c.id, status: 'waiting' }).filter((t) => (t.activity.slice().reverse().find((a) => a.text.includes('Aguardando'))?.at || t.createdAt) < Date.now() - 3 * 864e5);
      if (waiting.length) alerts.push({ level: 'warn', icon: '⏳', title: `Aguardando cliente há +3 dias — ${c.name}`, sub: waiting.map((t) => t.title).join(' · '), href: `#/cliente/${c.id}/tarefas` });
    });
    const rank = { bad: 0, warn: 1, info: 2 };
    return alerts.sort((a, b) => rank[a.level] - rank[b.level]);
  };

  const alertList = (alerts, limit = 8) => alerts.length
    ? alerts.slice(0, limit).map((a) => `
      <div class="alert-item ${a.level}" style="cursor:pointer" data-action="goto" data-href="${a.href}">
        <div class="a-ico">${a.icon}</div>
        <div class="grow"><div class="a-title">${e(a.title)}</div><div class="a-sub ellipsis">${e(a.sub)}</div></div>
      </div>`).join('') + (alerts.length > limit ? `<div class="small muted" style="padding:8px 18px">+ ${alerts.length - limit} alerta(s)</div>` : '')
    : C.empty('🎉', 'Nada pendente', 'Tudo em dia por aqui.');

  /* ============================== Dashboard ============================== */
  const dashboard = () => {
    const T = U.today();
    const ws = U.weekStart(T);
    const open = Store.tasks({ open: true });
    const overdue = open.filter((t) => Store.isOverdue(t));
    const todayT = open.filter((t) => t.due === T);
    const wsTs = U.parse(ws).getTime();
    const doneWeek = Store.tasks({ status: 'done' }).filter((t) => (t.completedAt || 0) >= wsTs);
    const logsWeek = Store.logs({ from: ws, hideAuto: true });
    const activeClients = Store.state.clients.filter((c) => ['ativo', 'onboarding'].includes(c.status));
    const mrr = activeClients.reduce((s, c) => s + (Number(c.contract?.fee) || 0), 0);
    const alerts = buildAlerts();
    const focus = Store.sortTasks([...overdue, ...todayT]);
    const days = [...Array(7)].map((_, i) => U.addDays(T, i - 6));
    const doneByDay = days.map((d) => Store.state.tasks.filter((t) => t.completedAt && U.toISO(new Date(t.completedAt)) === d).length);
    const healthList = activeClients.concat(Store.state.clients.filter((c) => c.status === 'pausado'))
      .map((c) => ({ c, h: Store.health(c) })).sort((a, b) => (a.h.score ?? 101) - (b.h.score ?? 101));

    const html = `
      ${Store.settings.demo && !VS.bannerClosed ? `<div class="banner"><span>✨</span><span class="grow"><b>Você está vendo dados de exemplo.</b> Explore à vontade — quando quiser, comece do zero com seus clientes reais.</span>
        <button class="btn btn-sm" data-action="close-banner">Continuar explorando</button><button class="btn btn-sm btn-primary" data-action="start-fresh">Começar do zero</button></div>` : ''}
      <div class="page-head">
        <div><h1>${greeting()}, ${e(Store.settings.userName)} 👋</h1><p>${e(U.fmtLong(T))}</p></div>
        <div class="actions">
          <button class="btn" data-action="new-client">＋ Cliente</button>
          <button class="btn" data-action="new-log">📓 Registrar no diário</button>
          <button class="btn btn-primary" data-action="new-task" data-defaults='${e(JSON.stringify({ due: T }))}'>＋ Tarefa para hoje</button>
        </div>
      </div>
      <div class="kpis">
        ${kpi('📌 Para hoje', todayT.length, 'tarefas com prazo hoje', todayT.length ? 'warn' : '', 'data-action="goto" data-href="#/tarefas"')}
        ${kpi('⏰ Atrasadas', overdue.length, overdue.length ? 'resolva primeiro' : 'nenhuma 🎉', overdue.length ? 'bad' : 'good', 'data-action="goto" data-href="#/tarefas"')}
        ${kpi('✅ Concluídas na semana', doneWeek.length, `${open.length} abertas no total`, '', '')}
        ${kpi('📓 Registros na semana', logsWeek.length, 'entradas manuais no diário', '', 'data-action="goto" data-href="#/diario"')}
        ${kpi('👥 Clientes ativos', activeClients.length, `${Store.state.clients.length} cadastrados`, '', 'data-action="goto" data-href="#/clientes"')}
        ${kpi('💰 Receita recorrente', U.fmtMoney(mrr, true), 'soma dos contratos ativos', '', '')}
      </div>
      <div class="dash-grid">
        <div class="dash-col">
          <div class="card">
            <div class="card-head"><h3>🎯 Foco de hoje</h3><span class="muted small">atrasadas + prazo hoje</span>
              <a class="small" style="margin-left:auto" href="#/tarefas">Ver todas →</a></div>
            ${focus.length ? `<div>${focus.map((t) => C.taskRow(t)).join('')}</div>` : C.empty('☕', 'Nada para hoje', 'Aproveite para adiantar tarefas da semana.')}
          </div>
          <div class="card">
            <div class="card-head"><h3>📓 Diário de bordo — atividade recente</h3><a class="small" style="margin-left:auto" href="#/diario">Abrir diário →</a></div>
            <div class="mini-list">${Store.logs().slice(0, 8).map(miniLog).join('') || C.empty('📓', 'Diário vazio')}</div>
          </div>
        </div>
        <div class="dash-col">
          <div class="card">
            <div class="card-head"><h3>🚨 Precisa de atenção</h3><span class="chip" style="margin-left:auto">${alerts.length}</span></div>
            ${alertList(alerts, 7)}
          </div>
          <div class="card">
            <div class="card-head"><h3>❤️ Saúde dos clientes</h3></div>
            <div class="mini-list">${healthList.map(({ c, h }) => `
              <div class="mini-item" data-action="goto" data-href="#/cliente/${c.id}">
                ${C.clientAvatar(c, '')}
                <div class="grow"><div class="ellipsis" style="font-weight:600">${e(c.name)}</div><div class="small muted ellipsis">${e(h.reasons[0])}</div></div>
                ${C.health(h)}
              </div>`).join('') || C.empty('👥', 'Nenhum cliente ativo')}</div>
          </div>
          <div class="card">
            <div class="card-head"><h3>📈 Tarefas concluídas — 7 dias</h3></div>
            <div class="card-body">${C.miniBars(doneByDay, days.map((d) => U.WD[U.parse(d).getDay()]))}</div>
          </div>
        </div>
      </div>`;
    return { title: 'Início', crumbs: '<strong>Início</strong>', html };
  };

  /* ============================== Tarefas ============================== */
  const taskToolbar = ({ scope, clientId }) => {
    const f = VS.filters;
    const view = scope === 'client' ? VS.clientTaskView : VS.taskView;
    const groupBy = scope === 'client' ? VS.clientGroupBy : VS.groupBy;
    return `
    <div class="toolbar">
      <input class="input input-sm" id="task-search" placeholder="🔍 Filtrar tarefas…" value="${e(f.q)}" data-input="task-filter" data-field="q">
      ${scope === 'client' ? '' : `<select class="select select-sm" style="width:auto" data-change="task-filter" data-field="clientId">${clientOptions(f.clientId, { placeholder: 'Todos os clientes' })}<option value="__internal" ${f.clientId === '__internal' ? 'selected' : ''}>Interno (sem cliente)</option></select>`}
      <select class="select select-sm" style="width:auto" data-change="task-filter" data-field="priority"><option value="">Toda prioridade</option>${options(M.PRIORITIES, f.priority)}</select>
      <select class="select select-sm" style="width:auto" data-change="task-filter" data-field="assignee"><option value="">Todos responsáveis</option>${(Store.settings.team || []).map((n) => `<option ${n === f.assignee ? 'selected' : ''}>${e(n)}</option>`).join('')}</select>
      <label class="toggle small"><input type="checkbox" class="check" data-change="task-filter" data-field="hideDone" ${f.hideDone ? 'checked' : ''}> Ocultar concluídas</label>
      <div style="margin-left:auto" class="row">
        ${view === 'list' ? `<select class="select select-sm" style="width:auto" data-change="group-by" data-scope="${scope}">
          ${[['due', 'Agrupar: prazo'], ['status', 'Agrupar: status'], ['client', 'Agrupar: cliente'], ['priority', 'Agrupar: prioridade'], ['assignee', 'Agrupar: responsável']].filter(([k]) => !(scope === 'client' && k === 'client')).map(([k, l]) => `<option value="${k}" ${k === groupBy ? 'selected' : ''}>${l}</option>`).join('')}
        </select>` : ''}
        <div class="seg">
          <button class="${view === 'list' ? 'active' : ''}" data-action="task-view" data-scope="${scope}" data-view="list">☰ Lista</button>
          <button class="${view === 'board' ? 'active' : ''}" data-action="task-view" data-scope="${scope}" data-view="board">▦ Quadro</button>
        </div>
      </div>
    </div>`;
  };

  const filteredTasks = (clientId) => {
    const f = VS.filters;
    let list = Store.tasks({ q: f.q, priority: f.priority, assignee: f.assignee });
    const cid = clientId !== undefined ? clientId : f.clientId;
    if (cid === '__internal') list = list.filter((t) => !t.clientId);
    else if (cid) list = list.filter((t) => t.clientId === cid);
    if (f.hideDone) list = list.filter((t) => t.status !== 'done');
    return list;
  };

  const taskBody = (scope, clientId) => {
    const list = filteredTasks(scope === 'client' ? clientId : undefined);
    const view = scope === 'client' ? VS.clientTaskView : VS.taskView;
    const groupBy = scope === 'client' ? VS.clientGroupBy : VS.groupBy;
    const defaults = scope === 'client' ? { clientId } : (VS.filters.clientId && VS.filters.clientId !== '__internal' ? { clientId: VS.filters.clientId } : {});
    const showClient = scope !== 'client';
    return view === 'board'
      ? C.kanban(list, { showClient, defaults })
      : C.taskList(list, { groupBy, showClient, defaults, collapsed: VS.collapsed });
  };

  const tasksPage = () => {
    const open = Store.tasks({ open: true });
    const overdue = open.filter((t) => Store.isOverdue(t)).length;
    const html = `
      <div class="page-head">
        <div><h1>Tarefas</h1><p>${open.length} abertas · ${overdue} atrasadas · todas as pastas de clientes em um só lugar</p></div>
        <div class="actions"><button class="btn btn-primary" data-action="new-task">＋ Nova tarefa</button></div>
      </div>
      ${taskToolbar({ scope: 'all' })}
      <div id="tasks-content">${taskBody('all')}</div>`;
    return { title: 'Tarefas', crumbs: '<strong>Tarefas</strong>', html };
  };

  /* ============================== Clientes ============================== */
  const clientCard = (c) => {
    const h = Store.health(c);
    const open = Store.tasks({ clientId: c.id, open: true });
    const overdue = open.filter((t) => Store.isOverdue(t)).length;
    const last = Store.lastLog(c.id);
    const ms = Store.metricsFor(c.id); const lm = ms[ms.length - 1];
    const cpl = Store.derive(lm).cpl;
    const cplCls = cpl && c.goals?.cpl ? (cpl > c.goals.cpl ? 'color:var(--bad)' : 'color:var(--good)') : '';
    return `
    <article class="card client-card" data-action="goto" data-href="#/cliente/${c.id}">
      <div class="cc-bar" style="background:${e(c.color)}"></div>
      <div class="cc-top">
        ${C.clientAvatar(c)}
        <div class="grow"><div class="cc-name ellipsis">${c.pinned ? '📌 ' : ''}${e(c.name)}</div>
          <div class="cc-sub ellipsis">${e(c.niche || 'Sem nicho definido')}</div>
          <div style="margin-top:4px">${C.clientStatusPill(c.status)}</div></div>
        ${C.health(h)}
      </div>
      <div class="cc-stats">
        <div><div class="v">${open.length}${overdue ? ` <span style="color:var(--bad);font-size:12px">(${overdue}⏰)</span>` : ''}</div><div class="l">Tarefas abertas</div></div>
        <div><div class="v" style="${cplCls}">${cpl ? U.fmtMoney(cpl) : '—'}</div><div class="l">CPL última sem.</div></div>
        <div><div class="v">${lm ? U.fmtNum(lm.leads) : '—'}</div><div class="l">Leads última sem.</div></div>
      </div>
      <div class="cc-foot"><span>📓 Diário: ${e(last ? U.daysAgoLabel(last.date) : 'sem registros')}</span><span style="margin-left:auto">${c.contract?.fee ? U.fmtMoney(Number(c.contract.fee)) + '/mês' : ''}</span></div>
    </article>`;
  };

  const clientsPage = () => {
    const f = VS.clientsFilter;
    let list = Store.clients().filter((c) => (!f.status || c.status === f.status) && (!f.q || U.match([c.name, c.company, c.niche, (c.tags || []).join(' '), c.contact?.name].join(' '), f.q)));
    if (f.sort === 'health') list.sort((a, b) => (Store.health(a).score ?? 101) - (Store.health(b).score ?? 101));
    else if (f.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (f.sort === 'activity') list.sort((a, b) => (Store.lastLog(b.id)?.date || '').localeCompare(Store.lastLog(a.id)?.date || ''));
    else if (f.sort === 'fee') list.sort((a, b) => (Number(b.contract?.fee) || 0) - (Number(a.contract?.fee) || 0));
    const counts = Object.fromEntries(M.CLIENT_STATUSES.map((s) => [s.id, Store.state.clients.filter((c) => c.status === s.id).length]));
    const html = `
      <div class="page-head">
        <div><h1>Clientes</h1><p>Cada cliente tem sua pasta com tarefas, diário de bordo, métricas e informações.</p></div>
        <div class="actions"><button class="btn btn-primary" data-action="new-client">＋ Novo cliente</button></div>
      </div>
      <div class="toolbar">
        <input class="input input-sm" id="client-search" placeholder="🔍 Buscar cliente, nicho, contato…" value="${e(f.q)}" data-input="clients-filter" data-field="q">
        <div class="row-wrap">
          <button class="chip ${!f.status ? 'active' : ''}" data-action="clients-status" data-status="">Todos <b>${Store.state.clients.length}</b></button>
          ${M.CLIENT_STATUSES.map((s) => `<button class="chip ${f.status === s.id ? 'active' : ''}" data-action="clients-status" data-status="${s.id}">${e(s.label)} <b>${counts[s.id]}</b></button>`).join('')}
        </div>
        <select class="select select-sm" style="width:auto;margin-left:auto" data-change="clients-sort">
          ${[['health', 'Ordenar: precisa de atenção'], ['name', 'Ordenar: nome'], ['activity', 'Ordenar: atividade recente'], ['fee', 'Ordenar: valor do contrato']].map(([k, l]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      ${list.length ? `<div class="client-grid">${list.map(clientCard).join('')}</div>` : C.empty('👥', 'Nenhum cliente encontrado', '', '<button class="btn btn-primary" data-action="new-client">＋ Cadastrar cliente</button>')}`;
    return { title: 'Clientes', crumbs: '<strong>Clientes</strong>', html };
  };

  /* ============================== Pasta do cliente ============================== */
  const TABS = [
    { id: 'visao', label: 'Visão geral', icon: '🏠' },
    { id: 'tarefas', label: 'Tarefas', icon: '✅' },
    { id: 'diario', label: 'Diário de bordo', icon: '📓' },
    { id: 'metricas', label: 'Métricas', icon: '📊' },
    { id: 'info', label: 'Informações & acessos', icon: '🗂️' },
  ];

  const clientPage = (id, tab = 'visao') => {
    const c = Store.client(id);
    if (!c) return { title: 'Cliente não encontrado', crumbs: '<a href="#/clientes">Clientes</a>', html: C.empty('🔎', 'Cliente não encontrado', 'Ele pode ter sido excluído.', '<a class="btn" href="#/clientes">Voltar para clientes</a>') };
    if (!TABS.find((t) => t.id === tab)) tab = 'visao';
    const h = Store.health(c);
    const openCount = Store.tasks({ clientId: id, open: true }).length;
    const logCount = Store.logs({ clientId: id }).length;
    const wa = U.waLink(c.contact?.phone);
    const counts = { tarefas: openCount, diario: logCount, metricas: Store.metricsFor(id).length };
    const body = { visao: clientOverview, tarefas: clientTasks, diario: clientJournal, metricas: clientMetrics, info: clientInfo }[tab](c);
    const html = `
      <div class="card client-hero" style="--client-color:${e(c.color)}">
        <div class="hero-top">
          ${C.clientAvatar(c, 'lg')}
          <div class="grow" style="min-width:220px">
            <h1>${e(c.name)}</h1>
            <div class="hero-meta">
              <select class="select select-sm" style="width:auto" data-change="client-field" data-id="${c.id}" data-field="status">${options(M.CLIENT_STATUSES, c.status)}</select>
              ${c.niche ? `<span>🏷️ ${e(c.niche)}</span>` : ''}
              ${c.contact?.name ? `<span>👤 ${e(c.contact.name)}</span>` : ''}
              ${c.contract?.fee ? `<span>💰 ${U.fmtMoney(Number(c.contract.fee))}/mês</span>` : ''}
              ${c.investmentCap ? `<span>🎚️ teto ${U.fmtMoney(Number(c.investmentCap))}</span>` : ''}
              ${c.goals?.cpl ? `<span>🎯 meta CPL ${U.fmtMoney(Number(c.goals.cpl))}</span>` : ''}
              ${c.contract?.start ? `<span>📅 cliente desde ${U.fmtDate(c.contract.start, true)}</span>` : ''}
            </div>
          </div>
          <div class="hero-actions">
            ${C.health(h, true)}
            ${c.adAccount ? `<a class="btn" href="${e(adsLink(c.adAccount))}" target="_blank" rel="noopener" title="Conta ${e(c.adAccount)}">📈 Conta de anúncio</a>` : ''}
            ${c.clickupUrl ? `<a class="icon-btn" href="${e(c.clickupUrl)}" target="_blank" rel="noopener" title="Abrir no ClickUp">↗</a>` : ''}
            ${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">🟢 WhatsApp</a>` : ''}
            <button class="btn" data-action="weekly-report" data-id="${c.id}">📋 Relatório da semana</button>
            <button class="btn" data-action="edit-client" data-id="${c.id}">✏️ Editar</button>
            <button class="icon-btn" data-action="pin-client" data-id="${c.id}" title="${c.pinned ? 'Desafixar da barra lateral' : 'Fixar no topo'}">${c.pinned ? '📌' : '📍'}</button>
            <button class="icon-btn" data-action="delete-client" data-id="${c.id}" title="Excluir cliente">🗑️</button>
          </div>
        </div>
        <nav class="tabs">${TABS.map((t) => `<a class="tab ${t.id === tab ? 'active' : ''}" href="#/cliente/${c.id}/${t.id}">${t.icon} ${t.label}${counts[t.id] != null ? `<span class="count">${counts[t.id]}</span>` : ''}</a>`).join('')}</nav>
      </div>
      ${body}`;
    return {
      title: c.name,
      crumbs: `<a href="#/clientes">Clientes</a><span>/</span><strong>${e(c.name)}</strong><span>/</span><span>${TABS.find((t) => t.id === tab).label}</span>`,
      html,
    };
  };

  const goalBar = (label, value, target, fmt, lowerIsBetter) => {
    if (!target) return '';
    const ratio = value == null ? 0 : lowerIsBetter ? Math.min(1, target / value) : Math.min(1, value / target);
    const ok = value != null && (lowerIsBetter ? value <= target : value >= target);
    return `<div class="goal"><div class="row between"><span>${label}</span><span><b>${value == null ? '—' : fmt(value)}</b> <span class="muted">/ meta ${fmt(target)}</span></span></div>
      <div class="bar"><span style="width:${ratio * 100}%;background:${ok ? 'var(--good)' : 'var(--warn)'}"></span></div></div>`;
  };

  const clientOverview = (c) => {
    const T = U.today();
    const open = Store.sortTasks(Store.tasks({ clientId: c.id, open: true }));
    const overdue = open.filter((t) => Store.isOverdue(t));
    const last = Store.lastLog(c.id);
    const ms = Store.metricsFor(c.id); const lm = ms[ms.length - 1]; const pm = ms[ms.length - 2];
    const d = Store.derive(lm); const pd = Store.derive(pm);
    const h = Store.health(c);
    const alerts = buildAlerts(c.id);
    const logs = Store.logs({ clientId: c.id }).slice(0, 5);
    const monthSpend = Store.monthSpend(c.id);
    const deltaTxt = (cur, prev, lowerIsBetter) => {
      if (cur == null || prev == null || !prev) return '';
      const p = (cur - prev) / prev;
      const good = lowerIsBetter ? p <= 0 : p >= 0;
      return ` <span class="delta ${good ? 'up-good' : 'up-bad'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p * 100).toFixed(0)}%</span>`;
    };
    return `
      <div class="kpis">
        ${kpi('✅ Tarefas abertas', open.length, overdue.length ? `<span style="color:var(--bad)">${overdue.length} atrasada(s)</span>` : 'nenhuma atrasada', overdue.length ? 'bad' : '', `data-action="goto" data-href="#/cliente/${c.id}/tarefas"`)}
        ${kpi('📓 Último registro', last ? U.daysAgoLabel(last.date) : '—', last ? e(last.title || '') : 'diário sem entradas manuais', last && U.diffDays(T, last.date) > Store.settings.staleDays ? 'warn' : '', `data-action="goto" data-href="#/cliente/${c.id}/diario"`)}
        ${kpi('🎯 CPL última semana', d.cpl != null ? U.fmtMoney(d.cpl) + deltaTxt(d.cpl, pd.cpl, true) : '—', c.goals?.cpl ? `meta ${U.fmtMoney(c.goals.cpl)}` : 'sem meta definida', d.cpl != null && c.goals?.cpl ? (d.cpl > c.goals.cpl ? 'bad' : 'good') : '', `data-action="goto" data-href="#/cliente/${c.id}/metricas"`)}
        ${kpi('👥 Leads última semana', lm ? U.fmtNum(lm.leads) + deltaTxt(lm.leads, pm?.leads) : '—', c.goals?.leads ? `meta ${c.goals.leads}/semana` : '', '', `data-action="goto" data-href="#/cliente/${c.id}/metricas"`)}
        ${kpi('💸 Investido no mês', U.fmtMoney(monthSpend), c.contract?.budget ? `verba prevista ${U.fmtMoney(Number(c.contract.budget))}` : '', '', '')}
      </div>
      <div class="overview-grid">
        <div class="dash-col">
          <div class="card">
            <div class="card-head"><h3>✅ Próximas tarefas</h3>
              <button class="btn btn-sm" style="margin-left:auto" data-action="new-task" data-defaults='${e(JSON.stringify({ clientId: c.id }))}'>＋ Tarefa</button></div>
            ${open.length ? open.slice(0, 7).map((t) => C.taskRow(t, { showClient: false })).join('') : C.empty('🎉', 'Nenhuma tarefa aberta')}
            ${open.length > 7 ? `<a class="small" style="display:block;padding:10px 18px" href="#/cliente/${c.id}/tarefas">Ver todas as ${open.length} tarefas →</a>` : ''}
          </div>
          <div class="card">
            <div class="card-head"><h3>📓 Diário de bordo</h3>
              <button class="btn btn-sm" style="margin-left:auto" data-action="new-log" data-client="${c.id}">＋ Registrar</button>
              <a class="small" href="#/cliente/${c.id}/diario">Abrir →</a></div>
            <div class="mini-list">${logs.map(miniLog).join('') || C.empty('📓', 'Nenhum registro ainda')}</div>
          </div>
          ${ms.length ? `<div class="card"><div class="card-head"><h3>📊 Desempenho semanal</h3><div class="legend" style="margin-left:auto"><span style="--c:var(--accent)">Leads</span><span style="--c:var(--warn)">CPL</span></div></div>
            <div class="card-body">${C.comboChart(ms.slice(-8).map((m) => ({ label: U.fmtDate(m.week), bar: m.leads || 0, line: Store.derive(m).cpl })), { lineFmt: (v) => 'R$' + Math.round(v), target: c.goals?.cpl })}</div></div>` : ''}
        </div>
        <div class="dash-col">
          <div class="card card-pad">
            <div class="row" style="gap:14px">${C.health(h, true)}<div><h3 style="font-size:15px">Saúde do cliente</h3><div class="small muted">calculada por prazos, diário e metas</div></div></div>
            <ul style="margin:12px 0 0;padding-left:18px;font-size:13px">${h.reasons.map((r) => `<li>${e(r)}</li>`).join('')}</ul>
          </div>
          ${alerts.length ? `<div class="card"><div class="card-head"><h3>🚨 Atenção</h3></div>${alertList(alerts)}</div>` : ''}
          ${c.goals?.cpl || c.goals?.leads || c.goals?.contracts ? `<div class="card"><div class="card-head"><h3>🏁 Metas (última semana)</h3></div><div class="card-body">
            ${goalBar('CPL', d.cpl, c.goals?.cpl, (v) => U.fmtMoney(v), true)}
            ${goalBar('Leads', lm?.leads, c.goals?.leads, (v) => U.fmtNum(v))}
            ${goalBar('Contratos', lm?.contracts, c.goals?.contracts, (v) => U.fmtNum(v))}
          </div></div>` : ''}
          <div class="card"><div class="card-head"><h3>👤 Contato</h3><a class="small" style="margin-left:auto" href="#/cliente/${c.id}/info">Editar</a></div><div class="card-body">
            <dl class="info-list">
              <dt>Responsável</dt><dd>${e(c.contact?.name || '—')}${c.contact?.role ? ` <span class="muted">· ${e(c.contact.role)}</span>` : ''}</dd>
              <dt>Telefone</dt><dd>${c.contact?.phone ? `<a href="${U.waLink(c.contact.phone)}" target="_blank" rel="noopener">${e(c.contact.phone)}</a>` : '—'}</dd>
              <dt>E-mail</dt><dd>${c.contact?.email ? `<a href="mailto:${e(c.contact.email)}">${e(c.contact.email)}</a>` : '—'}</dd>
              <dt>Renovação</dt><dd>${c.contract?.renewal ? U.fmtDate(c.contract.renewal, true) : '—'}</dd>
              <dt>Pagamento</dt><dd>${c.contract?.payday ? `todo dia ${e(c.contract.payday)}` : '—'}</dd>
            </dl></div></div>
          ${(c.links || []).length ? `<div class="card"><div class="card-head"><h3>🔗 Links rápidos</h3></div><div class="card-body link-list">${c.links.map((l) => `<a href="${e(l.url)}" target="_blank" rel="noopener">↗ <span class="ellipsis">${e(l.label || l.url)}</span></a>`).join('')}</div></div>` : ''}
          ${c.notes ? `<div class="card"><div class="card-head"><h3>🗒️ Notas importantes</h3></div><div class="card-body l-body" style="font-size:13.5px">${U.rich(c.notes)}</div></div>` : ''}
        </div>
      </div>`;
  };

  const clientTasks = (c) => `${taskToolbar({ scope: 'client', clientId: c.id })}<div id="tasks-content">${taskBody('client', c.id)}</div>`;

  /* ---------- Compositor do diário ---------- */
  const PRESETS = [
    'Performance ok, gerando leads.',
    'Não gerou leads ontem, ainda cedo pra mexer. Deixar rodar.',
    'Deu uma caída, seguir analisando.',
    'CPL acima da meta.',
    'Gasto elevado sem resultado.',
    'Campanha em fase de aprendizado.',
    'Performance dentro do orçamento.',
  ];
  const composer = ({ clientId, showClientSelect }) => {
    const type = VS.composerType;
    const c = clientId ? Store.client(clientId) : null;
    return `
    <div class="card composer ${type === 'analise' ? 'is-analise' : ''}" id="composer" data-client="${e(clientId || '')}">
      <div class="type-row">${M.LOG_TYPES.filter((t) => t.id !== 'tarefa').map((t) => `<button type="button" class="chip ${t.id === type ? 'active' : ''}" data-action="composer-type" data-type="${t.id}">${t.icon} ${t.label}</button>`).join('')}</div>
      <input type="hidden" name="type" value="${type}">
      <div class="mode-analise">
        <div class="window-note">* A análise é feita sempre na janela do dia anterior e de uma semana para trás.${c && c.adAccount ? ` · <a href="${e(adsLink(c.adAccount))}" target="_blank" rel="noopener">Abrir conta de anúncio ↗</a>` : ''}</div>
        <div class="grid-3 analysis-grid">
          <div class="field"><label>🔎 Análise</label><textarea class="textarea" name="analysis" placeholder="Como está a campanha? Leads, CPL, gasto vs. orçamento…"></textarea>
            <div class="presets">${PRESETS.map((p) => `<button type="button" class="chip" data-action="preset" data-text="${e(p)}">${e(p)}</button>`).join('')}</div></div>
          <div class="field"><label>🎯 Ações programadas p/ melhoria</label><textarea class="textarea" name="planned" placeholder="O que precisa ser feito? (pode virar tarefa)"></textarea>
            <label class="toggle small" style="margin-top:6px"><input type="checkbox" class="check" name="plannedTask"> Criar tarefa com a ação programada</label></div>
          <div class="field"><label>✅ Ações realizadas</label><textarea class="textarea" name="actionsDone" placeholder="O que já foi feito hoje?"></textarea></div>
        </div>
      </div>
      <div class="mode-other">
        <input class="input title-input" name="title" placeholder="O que aconteceu? (ex.: Pausei o conjunto X por CPL alto)" autocomplete="off">
        <textarea class="textarea body-input" name="body" placeholder="Detalhes, contexto, próximos passos… Use - para listas e **texto** para negrito. Ctrl+Enter para salvar."></textarea>
      </div>
      <div class="composer-extra hidden" id="composer-extra">
        <div class="field"><label>Investimento (R$)</label><input class="input input-sm" name="spend" inputmode="decimal" placeholder="0,00"></div>
        <div class="field"><label>Leads</label><input class="input input-sm" name="leads" inputmode="numeric" placeholder="0"></div>
        <div class="field"><label>Contratos</label><input class="input input-sm" name="contracts" inputmode="numeric" placeholder="0"></div>
        <div class="field"><label>Tags (vírgula)</label><input class="input input-sm" name="tags" placeholder="verba, teste"></div>
      </div>
      <div class="composer-foot">
        ${showClientSelect ? `<select class="select select-sm" style="width:auto;max-width:220px" name="clientId">${clientOptions(clientId, { placeholder: 'Escolha o cliente…' })}</select>` : ''}
        <input type="date" class="input input-sm" style="width:auto" name="date" value="${U.today()}">
        <input type="time" class="input input-sm" style="width:auto" name="time" value="${U.nowTime()}">
        <select class="select select-sm" style="width:auto" name="impact">
          <option value="neutro">⚪ Neutro</option><option value="positivo">🟢 Bom</option><option value="negativo">🔴 Ruim</option>
        </select>
        <button type="button" class="btn btn-sm btn-ghost" data-action="composer-extra">📊 Números & tags</button>
        <button type="button" class="btn btn-primary btn-sm" style="margin-left:auto" data-action="submit-composer">Registrar no diário</button>
      </div>
    </div>`;
  };

  const journalSide = (logs) => {
    const manual = logs.filter((l) => !l.auto);
    const T = U.today();
    const thisMonth = manual.filter((l) => l.date.slice(0, 7) === T.slice(0, 7));
    const byType = {};
    manual.forEach((l) => { byType[l.type] = (byType[l.type] || 0) + 1; });
    const maxT = Math.max(1, ...Object.values(byType));
    const pos = manual.filter((l) => l.impact === 'positivo').length;
    const neg = manual.filter((l) => l.impact === 'negativo').length;
    let streak = 0; const days = new Set(manual.map((l) => l.date));
    let dd = days.has(T) ? T : U.addDays(T, -1);
    while (days.has(dd)) { streak++; dd = U.addDays(dd, -1); }
    return `
      <aside class="side-panel">
        <div class="card card-pad">
          <h3 style="font-size:14px;margin-bottom:10px">📅 Frequência de registros</h3>
          ${C.heatmap(logs)}
        </div>
        <div class="card card-pad">
          <h3 style="font-size:14px;margin-bottom:6px">📌 Resumo</h3>
          <div class="stat-line"><span>Registros (filtro atual)</span><b>${logs.length}</b></div>
          <div class="stat-line"><span>Manuais neste mês</span><b>${thisMonth.length}</b></div>
          <div class="stat-line"><span>Sequência de dias</span><b>${streak} 🔥</b></div>
          <div class="stat-line"><span>Positivos / negativos</span><b><span style="color:var(--good)">${pos}</span> / <span style="color:var(--bad)">${neg}</span></b></div>
          <div class="stat-line"><span>Último registro</span><b>${manual[0] ? U.daysAgoLabel(manual[0].date) : '—'}</b></div>
        </div>
        ${(() => {
          const pend = logs.filter((l) => l.planned && !l.actionsDone && !l.plannedTaskId).slice(0, 6);
          return pend.length ? `<div class="card card-pad"><h3 style="font-size:14px;margin-bottom:6px">🎯 Ações programadas em aberto</h3>
            ${pend.map((l) => `<div class="stat-line" style="align-items:flex-start;gap:8px"><span class="small"><b>${U.fmtDate(l.date)}</b> ${e(l.planned.slice(0, 90))}${l.planned.length > 90 ? '…' : ''}</span>
              <button class="btn btn-sm" data-action="planned-to-task" data-id="${l.id}" title="Criar tarefa">➕</button></div>`).join('')}</div>` : '';
        })()}
        <div class="card card-pad">
          <h3 style="font-size:14px;margin-bottom:10px">🧭 Por tipo</h3>
          ${Object.keys(byType).length ? Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
            <div class="type-bar" style="cursor:pointer" data-action="log-type-filter" data-type="${k}"><span style="width:118px" class="ellipsis">${M.logType[k]?.icon} ${e(M.logType[k]?.label || k)}</span><div class="tb-track"><span style="width:${(v / maxT) * 100}%"></span></div><b>${v}</b></div>`).join('') : '<div class="muted small">Sem dados</div>'}
        </div>
      </aside>`;
  };

  const logFilters = (f, scope) => `
    <div class="toolbar">
      <input class="input input-sm" id="log-search-${scope}" placeholder="🔍 Buscar no diário…" value="${e(f.q)}" data-input="log-filter" data-scope="${scope}" data-field="q">
      ${scope === 'all' ? `<select class="select select-sm" style="width:auto" data-change="log-filter" data-scope="${scope}" data-field="clientId">${clientOptions(f.clientId, { placeholder: 'Todos os clientes' })}</select>` : ''}
      <select class="select select-sm" style="width:auto" data-change="log-filter" data-scope="${scope}" data-field="type"><option value="">Todos os tipos</option>${M.LOG_TYPES.map((t) => `<option value="${t.id}" ${f.type === t.id ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}</select>
      ${scope === 'all' ? `<select class="select select-sm" style="width:auto" data-change="log-filter" data-scope="${scope}" data-field="period">
        ${[['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias'], ['', 'Todo o período']].map(([k, l]) => `<option value="${k}" ${f.period === k ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}
      <label class="toggle small"><input type="checkbox" class="check" data-change="log-filter" data-scope="${scope}" data-field="hideAuto" ${f.hideAuto ? 'checked' : ''}> Ocultar automáticos</label>
      <div class="row" style="margin-left:auto">
        <div class="seg"><button class="${VS.logView !== 'sheet' ? 'active' : ''}" data-action="log-view" data-view="timeline">🕓 Linha do tempo</button><button class="${VS.logView === 'sheet' ? 'active' : ''}" data-action="log-view" data-view="sheet">▦ Planilha</button></div>
        <button class="btn btn-sm" data-action="copy-journal" data-scope="${scope}" title="Copia os registros filtrados em formato de mensagem">📋 Copiar resumo</button>
        <button class="btn btn-sm" data-action="export-journal" data-scope="${scope}">⬇️ Exportar</button>
        <button class="btn btn-sm" data-action="print">🖨️ PDF</button>
        ${scope === 'client' ? `<label class="btn btn-sm" title="Importar planilha de diário de bordo (.xlsx) — colunas Data, Análise, Ações programadas, Ações realizadas">📥 Importar planilha<input type="file" accept=".xlsx,.xls,.csv" hidden data-change="import-diary-xlsx"></label>` : ''}
      </div>
    </div>`;

  const journalLogs = (scope, clientId) => {
    const f = scope === 'all' ? VS.journal : VS.clientLog;
    const filter = { q: f.q, type: f.type, hideAuto: f.hideAuto };
    if (scope === 'all') { filter.clientId = f.clientId; if (f.period) filter.from = U.addDays(U.today(), -Number(f.period)); }
    else filter.clientId = clientId;
    return Store.logs(filter);
  };

  const clientJournal = (c) => {
    const logs = journalLogs('client', c.id);
    return `
      <div class="log-layout">
        <div>
          ${composer({ clientId: c.id, showClientSelect: false })}
          ${logFilters(VS.clientLog, 'client')}
          ${VS.logView === 'sheet' ? C.logTable(logs) : C.timeline(logs)}
        </div>
        ${journalSide(Store.logs({ clientId: c.id }))}
      </div>`;
  };

  const journalPage = () => {
    const logs = journalLogs('all');
    const html = `
      <div class="page-head">
        <div><h1>📓 Diário de bordo</h1><p>Tudo o que aconteceu em cada cliente — decisões, otimizações, reuniões e resultados — em uma linha do tempo.</p></div>
      </div>
      <div class="log-layout">
        <div>
          ${composer({ clientId: VS.journal.clientId, showClientSelect: true })}
          ${logFilters(VS.journal, 'all')}
          ${VS.logView === 'sheet' ? C.logTable(logs, { showClient: true }) : C.timeline(logs, { showClient: true })}
        </div>
        ${journalSide(logs)}
      </div>`;
    return { title: 'Diário de bordo', crumbs: '<strong>Diário de bordo</strong>', html };
  };

  /* ---------- Métricas ---------- */
  const clientMetrics = (c) => {
    const ms = Store.metricsFor(c.id);
    const rev = ms.slice().reverse();
    const lm = ms[ms.length - 1], pm = ms[ms.length - 2];
    const d = Store.derive(lm), pd = Store.derive(pm);
    const totals = ms.reduce((a, m) => ({ spend: a.spend + (m.spend || 0), leads: a.leads + (m.leads || 0), contracts: a.contracts + (m.contracts || 0), revenue: a.revenue + (m.revenue || 0) }), { spend: 0, leads: 0, contracts: 0, revenue: 0 });
    const delta = (cur, prev, lowerIsBetter) => {
      if (cur == null || prev == null || !prev) return '';
      const p = (cur - prev) / prev; const good = lowerIsBetter ? p <= 0 : p >= 0;
      return `<span class="delta ${good ? 'up-good' : 'up-bad'}">${p >= 0 ? '▲' : '▼'}${Math.abs(p * 100).toFixed(0)}%</span>`;
    };
    if (!ms.length) {
      return `<div class="card">${C.empty('📊', 'Nenhuma métrica registrada', 'Registre os números semanais (investimento, leads, contratos) para acompanhar CPL, custo por contrato e ROI.', `<button class="btn btn-primary" data-action="new-metric" data-client="${c.id}">＋ Registrar semana</button>`)}</div>`;
    }
    return `
      <div class="row between" style="margin-bottom:14px;flex-wrap:wrap">
        <div class="muted">Semana mais recente: <b style="color:var(--text)">${U.fmtDate(lm.week, true)}</b> · comparação com a semana anterior</div>
        <button class="btn btn-primary" data-action="new-metric" data-client="${c.id}">＋ Registrar semana</button>
      </div>
      <div class="kpis">
        ${kpi('Investimento', U.fmtMoney(lm.spend) + ' ' + delta(lm.spend, pm?.spend), 'na semana')}
        ${kpi('Leads', U.fmtNum(lm.leads) + ' ' + delta(lm.leads, pm?.leads), c.goals?.leads ? `meta ${c.goals.leads}` : '')}
        ${kpi('CPL', U.fmtMoney(d.cpl) + ' ' + delta(d.cpl, pd.cpl, true), c.goals?.cpl ? `meta ${U.fmtMoney(c.goals.cpl)}` : '', d.cpl && c.goals?.cpl ? (d.cpl > c.goals.cpl ? 'bad' : 'good') : '')}
        ${kpi('Custo p/ lead qualificado', U.fmtMoney(d.cpq) + ' ' + delta(d.cpq, pd.cpq, true), lm.qualified != null ? `${lm.qualified} qualificados` : '')}
        ${kpi('Contratos', U.fmtNum(lm.contracts) + ' ' + delta(lm.contracts, pm?.contracts), d.cpc ? `${U.fmtMoney(d.cpc)} por contrato` : '')}
        ${kpi('Retorno (ROAS)', d.roas ? d.roas.toFixed(1) + 'x' : '—', lm.revenue ? `${U.fmtMoney(lm.revenue)} em honorários` : 'informe a receita')}
      </div>
      <div class="overview-grid">
        <div class="card"><div class="card-head"><h3>Leads × CPL por semana</h3><div class="legend" style="margin-left:auto"><span style="--c:var(--accent)">Leads</span><span style="--c:var(--warn)">CPL</span></div></div>
          <div class="card-body">${C.comboChart(ms.slice(-12).map((m) => ({ label: U.fmtDate(m.week), bar: m.leads || 0, line: Store.derive(m).cpl })), { lineFmt: (v) => 'R$' + Math.round(v), target: c.goals?.cpl })}</div></div>
        <div class="card"><div class="card-head"><h3>Acumulado (${ms.length} semanas)</h3></div><div class="card-body">
          <div class="stat-line"><span>Investimento total</span><b>${U.fmtMoney(totals.spend)}</b></div>
          <div class="stat-line"><span>Leads</span><b>${U.fmtNum(totals.leads)}</b></div>
          <div class="stat-line"><span>CPL médio</span><b>${U.fmtMoney(totals.leads ? totals.spend / totals.leads : null)}</b></div>
          <div class="stat-line"><span>Contratos fechados</span><b>${U.fmtNum(totals.contracts)}</b></div>
          <div class="stat-line"><span>Custo por contrato</span><b>${U.fmtMoney(totals.contracts ? totals.spend / totals.contracts : null)}</b></div>
          <div class="stat-line"><span>Taxa lead → contrato</span><b>${U.fmtPct(totals.leads ? totals.contracts / totals.leads : null)}</b></div>
          <div class="stat-line"><span>Honorários gerados</span><b>${U.fmtMoney(totals.revenue)}</b></div>
          <div class="stat-line"><span>ROAS</span><b>${totals.spend && totals.revenue ? (totals.revenue / totals.spend).toFixed(1) + 'x' : '—'}</b></div>
        </div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-head"><h3>Histórico semanal</h3></div>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Semana</th><th class="num">Invest.</th><th class="num">Leads</th><th class="num">CPL</th><th class="num">Qualif.</th><th class="num">Reuniões</th><th class="num">Contratos</th><th class="num">Custo/contrato</th><th class="num">Receita</th><th>Obs.</th><th></th></tr></thead>
          <tbody>${rev.map((m, i) => {
            const dm = Store.derive(m); const prev = Store.derive(rev[i + 1]);
            const over = c.goals?.cpl && dm.cpl > c.goals.cpl;
            return `<tr>
              <td><b>${U.fmtDate(m.week, true)}</b></td>
              <td class="num">${U.fmtMoney(m.spend)}</td>
              <td class="num">${U.fmtNum(m.leads)}</td>
              <td class="num" style="${over ? 'color:var(--bad);font-weight:700' : ''}">${U.fmtMoney(dm.cpl)}${delta(dm.cpl, prev.cpl, true)}</td>
              <td class="num">${U.fmtNum(m.qualified)}</td>
              <td class="num">${U.fmtNum(m.meetings)}</td>
              <td class="num">${U.fmtNum(m.contracts)}</td>
              <td class="num">${U.fmtMoney(dm.cpc)}</td>
              <td class="num">${U.fmtMoney(m.revenue)}</td>
              <td class="ellipsis" style="max-width:220px" title="${e(m.note || '')}">${e(m.note || '')}</td>
              <td><button class="icon-btn sm" data-action="edit-metric" data-id="${m.id}" title="Editar">✏️</button><button class="icon-btn sm" data-action="delete-metric" data-id="${m.id}" title="Excluir">🗑️</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>`;
  };

  /* ---------- Informações & acessos ---------- */
  const infoField = (c, path, label, type = 'text', ph = '') => {
    const val = path.split('.').reduce((o, k) => (o || {})[k], c) ?? '';
    return `<div class="field"><label>${label}</label><input class="input" type="${type}" value="${e(val)}" placeholder="${e(ph)}" data-change="client-field" data-id="${c.id}" data-field="${path}"></div>`;
  };
  const clientInfo = (c) => `
    <div class="overview-grid">
      <div class="dash-col">
        <div class="card"><div class="card-head"><h3>🏢 Dados do cliente</h3><span class="small muted" style="margin-left:auto">salva automaticamente</span></div><div class="card-body stack">
          <div class="grid-2">${infoField(c, 'name', 'Nome de exibição')}${infoField(c, 'company', 'Razão social / escritório')}</div>
          <div class="grid-2">${infoField(c, 'niche', 'Nicho / produto', 'text', 'Ex.: Gestão de passivos')}
            <div class="field"><label>Tags (vírgula)</label><input class="input" value="${e((c.tags || []).join(', '))}" data-change="client-tags" data-id="${c.id}" placeholder="Meta Ads, Premium"></div></div>
          <div class="field"><label>Cor da pasta</label><div class="row-wrap">${M.CLIENT_COLORS.map((col) => `<button class="avatar" style="background:${col};border:3px solid ${col === c.color ? 'var(--text)' : 'transparent'}" data-action="client-color" data-id="${c.id}" data-color="${col}" aria-label="Cor ${col}"></button>`).join('')}</div></div>
        </div></div>
        <div class="card"><div class="card-head"><h3>📣 Campanha</h3></div><div class="card-body stack">
          <div class="grid-2">${infoField(c, 'adAccount', 'Conta de anúncio (ID act_…)', 'text', 'act_123456789')}${infoField(c, 'investmentCap', 'Teto de investimento (R$)', 'number')}</div>
          <div class="grid-2">${infoField(c, 'diarySheetUrl', 'Planilha do diário (Google Sheets)', 'url', 'https://docs.google.com/…')}${infoField(c, 'clickupUrl', 'Pasta no ClickUp', 'url')}</div>
          ${c.adAccount ? `<a class="btn btn-sm" style="align-self:flex-start" href="${e(adsLink(c.adAccount))}" target="_blank" rel="noopener">📈 Abrir no Gerenciador de Anúncios ↗</a>` : ''}
        </div></div>
        <div class="card"><div class="card-head"><h3>👤 Contato</h3></div><div class="card-body stack">
          <div class="grid-2">${infoField(c, 'contact.name', 'Nome do responsável')}${infoField(c, 'contact.role', 'Cargo')}</div>
          <div class="grid-2">${infoField(c, 'contact.phone', 'WhatsApp / telefone', 'tel', '(11) 99999-9999')}${infoField(c, 'contact.email', 'E-mail', 'email')}</div>
        </div></div>
        <div class="card"><div class="card-head"><h3>📄 Contrato & metas</h3></div><div class="card-body stack">
          <div class="grid-3">${infoField(c, 'contract.fee', 'Fee mensal (R$)', 'number')}${infoField(c, 'contract.budget', 'Verba de anúncios / mês (R$)', 'number')}${infoField(c, 'contract.payday', 'Dia do pagamento', 'number')}</div>
          <div class="grid-2">${infoField(c, 'contract.start', 'Início do contrato', 'date')}${infoField(c, 'contract.renewal', 'Renovação', 'date')}</div>
          <div class="grid-3">${infoField(c, 'goals.cpl', 'Meta de CPL (R$)', 'number')}${infoField(c, 'goals.leads', 'Meta de leads / semana', 'number')}${infoField(c, 'goals.contracts', 'Meta de contratos / semana', 'number')}</div>
        </div></div>
      </div>
      <div class="dash-col">
        <div class="card"><div class="card-head"><h3>🔗 Links</h3></div><div class="card-body">
          ${(c.links || []).map((l, i) => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--border)"><a class="grow ellipsis" href="${e(l.url)}" target="_blank" rel="noopener">↗ ${e(l.label || l.url)}</a><button class="icon-btn sm" data-action="remove-link" data-id="${c.id}" data-kind="links" data-index="${i}" title="Remover">✕</button></div>`).join('') || '<div class="muted small">Nenhum link. Adicione gerenciador, planilhas, LP, Drive…</div>'}
          <div class="row" style="margin-top:10px" id="add-link"><input class="input input-sm" name="label" placeholder="Nome"><input class="input input-sm" name="url" placeholder="https://…"><button class="btn btn-sm" data-action="add-link" data-id="${c.id}" data-kind="links">＋</button></div>
        </div></div>
        <div class="card"><div class="card-head"><h3>🔑 Acessos & IDs</h3></div><div class="card-body">
          <div class="small muted" style="margin-bottom:8px">IDs de contas, páginas, pixels, logins. ⚠️ Evite salvar senhas — os dados ficam neste navegador.</div>
          ${(c.access || []).map((a, i) => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--border)"><span class="muted small ellipsis" style="width:120px">${e(a.label)}</span><code class="grow ellipsis">${e(a.value)}</code><button class="icon-btn sm" data-action="copy-text" data-text="${e(a.value)}" title="Copiar">⧉</button><button class="icon-btn sm" data-action="remove-link" data-id="${c.id}" data-kind="access" data-index="${i}" title="Remover">✕</button></div>`).join('') || '<div class="muted small">Nenhum acesso cadastrado.</div>'}
          <div class="row" style="margin-top:10px" id="add-access"><input class="input input-sm" name="label" placeholder="Ex.: Conta de anúncios"><input class="input input-sm" name="value" placeholder="act_123…"><button class="btn btn-sm" data-action="add-link" data-id="${c.id}" data-kind="access">＋</button></div>
        </div></div>
        <div class="card"><div class="card-head"><h3>🗒️ Notas & preferências do cliente</h3></div><div class="card-body">
          <textarea class="textarea" style="min-height:180px" data-change="client-field" data-id="${c.id}" data-field="notes" placeholder="Como o cliente gosta de receber relatórios, restrições de criativos, horários de atendimento…">${e(c.notes || '')}</textarea>
        </div></div>
      </div>
    </div>`;

  /* ============================== Calendário ============================== */
  const calendarPage = () => {
    const T = U.today();
    const month = VS.calMonth || U.monthStart(T);
    const first = U.parse(month);
    const start = U.weekStart(month);
    const tasks = Store.state.tasks.filter((t) => t.due);
    const logs = Store.state.logs.filter((l) => !l.auto);
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const day = U.addDays(start, i);
      if (i >= 35 && day.slice(0, 7) !== month.slice(0, 7)) break;
      const dayTasks = Store.sortTasks(tasks.filter((t) => t.due === day));
      const dayLogs = logs.filter((l) => l.date === day);
      const other = day.slice(0, 7) !== month.slice(0, 7);
      cells += `
        <div class="cal-day ${other ? 'other' : ''} ${day === T ? 'today' : ''}" data-drop-date="${day}">
          <div class="cal-head"><span class="cal-num">${U.parse(day).getDate()}</span>
            <button class="icon-btn sm add" data-action="new-task" data-defaults='${e(JSON.stringify({ due: day }))}' title="Nova tarefa neste dia">＋</button></div>
          ${dayTasks.slice(0, 4).map((t) => {
            const col = Store.client(t.clientId)?.color || 'var(--border-strong)';
            return `<div class="cal-task ${t.status === 'done' ? 'done' : ''}" style="border-left-color:${e(col)}" draggable="true" data-drag-task="${t.id}" data-action="open-task" data-id="${t.id}" title="${e(t.title)}">${e(t.title)}</div>`;
          }).join('')}
          ${dayTasks.length > 4 ? `<span class="cal-more">+${dayTasks.length - 4} tarefas</span>` : ''}
          ${dayLogs.length ? `<span class="cal-log" data-action="goto" data-href="#/diario" title="${e(dayLogs.map((l) => l.title).join(' · '))}">📓 ${dayLogs.length} registro${dayLogs.length > 1 ? 's' : ''}</span>` : ''}
        </div>`;
    }
    const html = `
      <div class="page-head">
        <div><h1>Calendário</h1><p>Prazos das tarefas e registros do diário. Arraste tarefas para mudar o prazo.</p></div>
        <div class="actions">
          <button class="btn" data-action="cal-nav" data-dir="-1">‹</button>
          <button class="btn" data-action="cal-nav" data-dir="0">Hoje</button>
          <button class="btn" data-action="cal-nav" data-dir="1">›</button>
        </div>
      </div>
      <h2 style="font-size:18px;margin-bottom:12px;text-transform:capitalize">${U.MONTHS_FULL[first.getMonth()]} ${first.getFullYear()}</h2>
      <div class="cal">${['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((d) => `<div class="cal-wd">${d}</div>`).join('')}${cells}</div>`;
    return { title: 'Calendário', crumbs: '<strong>Calendário</strong>', html };
  };

  /* ============================== Configurações ============================== */
  const settingsPage = () => {
    const s = Store.settings;
    const html = `
      <div class="page-head"><div><h1>Configurações</h1><p>Personalize o Bordo e faça backup dos seus dados.</p></div></div>
      <div class="overview-grid">
        <div class="dash-col">
          <div class="card"><div class="card-head"><h3>👤 Perfil & equipe</h3></div><div class="card-body stack">
            <div class="field"><label>Seu nome</label><input class="input" value="${e(s.userName)}" data-change="setting" data-field="userName"></div>
            <div class="field"><label>Equipe (um nome por linha) — aparece como responsável nas tarefas</label>
              <textarea class="textarea" data-change="setting-team">${e((s.team || []).join('\n'))}</textarea></div>
          </div></div>
          <div class="card"><div class="card-head"><h3>⚙️ Preferências</h3></div><div class="card-body stack">
            <div class="field"><label>Tema</label><div class="seg">
              ${[['auto', '🖥️ Automático'], ['light', '☀️ Claro'], ['dark', '🌙 Escuro']].map(([k, l]) => `<button class="${s.theme === k ? 'active' : ''}" data-action="set-theme" data-theme="${k}">${l}</button>`).join('')}
            </div></div>
            <div class="field"><label>Alertar quando um cliente ficar sem registro no diário por (dias)</label>
              <input class="input" type="number" min="1" max="60" value="${e(s.staleDays)}" data-change="setting" data-field="staleDays" style="max-width:120px"></div>
            <label class="toggle"><input type="checkbox" class="check" data-change="setting" data-field="autoLog" ${s.autoLog ? 'checked' : ''}> Registrar automaticamente no diário quando uma tarefa de cliente for concluída</label>
          </div></div>
          <div class="card"><div class="card-head"><h3>🚀 Modelo de onboarding</h3></div><div class="card-body stack">
            <div class="small muted">Checklist criado automaticamente ao cadastrar um novo cliente (um item por linha).</div>
            <textarea class="textarea" style="min-height:190px" data-change="setting-onboarding">${e((s.onboardingTemplate || []).join('\n'))}</textarea>
          </div></div>
        </div>
        <div class="dash-col">
          <div class="card"><div class="card-head"><h3>💾 Backup</h3></div><div class="card-body stack">
            <div class="small muted">Seus dados ficam salvos neste navegador. Exporte um backup regularmente — e use-o para levar os dados para outro computador.</div>
            <div class="row-wrap">
              <button class="btn btn-primary" data-action="export-json">⬇️ Exportar backup (.json)</button>
              <label class="btn">⬆️ Importar backup<input type="file" accept=".json,application/json" hidden data-change="import-json"></label>
              <button class="btn" data-action="export-csv">📄 Tarefas em CSV</button>
            </div>
          </div></div>
          <div class="card"><div class="card-head"><h3>⌨️ Atalhos de teclado</h3></div><div class="card-body">
            ${[['Ctrl/⌘ + K', 'Busca e comandos'], ['N', 'Nova tarefa'], ['D', 'Novo registro no diário'], ['C', 'Novo cliente'], ['G então I / T / C / D / K', 'Ir para Início, Tarefas, Clientes, Diário, Calendário'], ['Esc', 'Fechar painel']].map(([k, l]) => `<div class="stat-line"><span>${l}</span><kbd>${k}</kbd></div>`).join('')}
          </div></div>
          <div class="card"><div class="card-head"><h3>🧹 Dados</h3></div><div class="card-body stack">
            <div class="row-wrap">
              <button class="btn" data-action="load-demo">✨ Carregar dados de exemplo</button>
              <button class="btn btn-danger" data-action="reset-all">🗑️ Apagar tudo</button>
            </div>
            <div class="small muted">${Store.state.clients.length} clientes · ${Store.state.tasks.length} tarefas · ${Store.state.logs.length} registros · ${Store.state.metrics.length} semanas de métricas</div>
          </div></div>
        </div>
      </div>`;
    return { title: 'Configurações', crumbs: '<strong>Configurações</strong>', html };
  };

  /* ============================== Formulários (modais) ============================== */
  const Forms = {};

  Forms.task = (defaults = {}) => `
    <div class="modal-head"><h2>Nova tarefa</h2><button class="icon-btn" style="margin-left:auto" data-modal-close>✕</button></div>
    <div class="modal-body" id="task-form">
      <input class="input" name="title" placeholder="Nome da tarefa" style="font-size:16px;font-weight:600" autofocus>
      <div class="grid-2">
        <div class="field"><label>Cliente</label><select class="select" name="clientId">${clientOptions(defaults.clientId || '')}</select></div>
        <div class="field"><label>Prazo</label><input class="input" type="date" name="due" value="${e(defaults.due ?? '')}"></div>
      </div>
      <div class="grid-3">
        <div class="field"><label>Status</label><select class="select" name="status">${options(M.STATUSES, defaults.status || 'todo')}</select></div>
        <div class="field"><label>Prioridade</label><select class="select" name="priority">${options(M.PRIORITIES, defaults.priority || 'normal')}</select></div>
        <div class="field"><label>Responsável</label><select class="select" name="assignee">${teamOptions(defaults.assignee ?? Store.settings.userName)}</select></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Repetir</label><select class="select" name="recurrence">${options(M.RECURRENCES, 'none')}</select></div>
        <div class="field"><label>Tags (vírgula)</label><input class="input" name="tags" placeholder="Criativo, Relatório"></div>
      </div>
      <div class="field"><label>Descrição</label><textarea class="textarea" name="description" placeholder="Detalhes, links, contexto…"></textarea></div>
      <div class="field"><label>Checklist (um item por linha)</label><textarea class="textarea" name="checklist" style="min-height:60px" placeholder="Opcional"></textarea></div>
    </div>
    <div class="modal-foot">
      <label class="toggle small" style="margin-right:auto"><input type="checkbox" class="check" name="openAfter"> Abrir detalhes após criar</label>
      <button class="btn" data-modal-close>Cancelar</button>
      <button class="btn btn-primary" data-action="save-task-form">Criar tarefa</button>
    </div>`;

  Forms.client = (c) => {
    const isNew = !c; c = c || { status: 'onboarding', contact: {}, contract: {}, goals: {} };
    const f = (name, label, val, type = 'text', ph = '') => `<div class="field"><label>${label}</label><input class="input" type="${type}" name="${name}" value="${e(val ?? '')}" placeholder="${e(ph)}"></div>`;
    return `
    <div class="modal-head"><h2>${isNew ? 'Novo cliente' : 'Editar cliente'}</h2><button class="icon-btn" style="margin-left:auto" data-modal-close>✕</button></div>
    <div class="modal-body" id="client-form" data-id="${e(c.id || '')}">
      <div class="grid-2">${f('name', 'Nome do cliente *', c.name, 'text', 'Ex.: Silva Advogados')}${f('company', 'Razão social / escritório', c.company)}</div>
      <div class="grid-2">${f('niche', 'Nicho / produto', c.niche, 'text', 'Ex.: Direito bancário')}
        <div class="field"><label>Status</label><select class="select" name="status">${options(M.CLIENT_STATUSES, c.status)}</select></div></div>
      <div class="label" style="margin-top:4px">Contato</div>
      <div class="grid-2">${f('contact.name', 'Responsável', c.contact?.name)}${f('contact.role', 'Cargo', c.contact?.role)}</div>
      <div class="grid-2">${f('contact.phone', 'WhatsApp', c.contact?.phone, 'tel', '(11) 99999-9999')}${f('contact.email', 'E-mail', c.contact?.email, 'email')}</div>
      <div class="label" style="margin-top:4px">Contrato & metas</div>
      <div class="grid-3">${f('contract.fee', 'Fee mensal (R$)', c.contract?.fee, 'number')}${f('contract.budget', 'Verba/mês (R$)', c.contract?.budget, 'number')}${f('contract.start', 'Início', c.contract?.start || (isNew ? U.today() : ''), 'date')}</div>
      <div class="grid-3">${f('goals.cpl', 'Meta de CPL (R$)', c.goals?.cpl, 'number')}${f('goals.leads', 'Leads / semana', c.goals?.leads, 'number')}${f('goals.contracts', 'Contratos / semana', c.goals?.contracts, 'number')}</div>
      ${isNew ? `<label class="toggle"><input type="checkbox" class="check" name="withOnboarding" checked> Criar checklist de onboarding (${(Store.settings.onboardingTemplate || []).length} itens)</label>` : ''}
    </div>
    <div class="modal-foot"><button class="btn" data-modal-close>Cancelar</button><button class="btn btn-primary" data-action="save-client-form">${isNew ? 'Criar pasta do cliente' : 'Salvar'}</button></div>`;
  };

  Forms.log = (l, defaults = {}) => {
    const isNew = !l; l = l || { type: VS.composerType, date: U.today(), time: U.nowTime(), impact: 'neutro', metrics: {}, tags: [], clientId: defaults.clientId || '', ...defaults };
    return `
    <div class="modal-head"><h2>${isNew ? '📓 Novo registro no diário' : 'Editar registro'}</h2><button class="icon-btn" style="margin-left:auto" data-modal-close>✕</button></div>
    <div class="modal-body" id="log-form" data-id="${e(l.id || '')}">
      <div class="grid-2">
        <div class="field"><label>Cliente *</label><select class="select" name="clientId">${clientOptions(l.clientId, { placeholder: 'Escolha o cliente…' })}</select></div>
        <div class="field"><label>Tipo</label><select class="select" name="type">${M.LOG_TYPES.map((t) => `<option value="${t.id}" ${t.id === l.type ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>🔎 Análise</label><textarea class="textarea" name="analysis" style="min-height:70px" placeholder="Como está a campanha? (janela do dia anterior e 7 dias)" autofocus>${e(l.analysis || '')}</textarea></div>
      <div class="grid-2">
        <div class="field"><label>🎯 Ações programadas p/ melhoria</label><textarea class="textarea" name="planned" style="min-height:70px">${e(l.planned || '')}</textarea></div>
        <div class="field"><label>✅ Ações realizadas</label><textarea class="textarea" name="actionsDone" style="min-height:70px">${e(l.actionsDone || '')}</textarea></div>
      </div>
      <div class="field"><label>Título (opcional)</label><input class="input" name="title" value="${e(l.title || '')}" placeholder="Resumo em uma linha"></div>
      <div class="field"><label>Observações</label><textarea class="textarea" name="body" style="min-height:60px" placeholder="Contexto, decisão, próximos passos…">${e(l.body || '')}</textarea></div>
      <div class="grid-3">
        <div class="field"><label>Data</label><input class="input" type="date" name="date" value="${e(l.date)}"></div>
        <div class="field"><label>Hora</label><input class="input" type="time" name="time" value="${e(l.time || '')}"></div>
        <div class="field"><label>Impacto</label><select class="select" name="impact">${[['neutro', '⚪ Neutro'], ['positivo', '🟢 Bom'], ['negativo', '🔴 Ruim']].map(([k, t]) => `<option value="${k}" ${l.impact === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      </div>
      <div class="grid-3">
        <div class="field"><label>Investimento (R$)</label><input class="input" name="spend" inputmode="decimal" value="${e(l.metrics?.spend ?? '')}"></div>
        <div class="field"><label>Leads</label><input class="input" name="leads" inputmode="numeric" value="${e(l.metrics?.leads ?? '')}"></div>
        <div class="field"><label>Contratos</label><input class="input" name="contracts" inputmode="numeric" value="${e(l.metrics?.contracts ?? '')}"></div>
      </div>
      <div class="field"><label>Tags (vírgula)</label><input class="input" name="tags" value="${e((l.tags || []).join(', '))}"></div>
    </div>
    <div class="modal-foot"><button class="btn" data-modal-close>Cancelar</button><button class="btn btn-primary" data-action="save-log-form">${isNew ? 'Registrar' : 'Salvar'}</button></div>`;
  };

  Forms.metric = (clientId, m) => {
    const isNew = !m; m = m || { week: U.addDays(U.weekStart(U.today()), -7) };
    const f = (name, label, ph = '') => `<div class="field"><label>${label}</label><input class="input" name="${name}" inputmode="decimal" value="${e(m[name] ?? '')}" placeholder="${ph}"></div>`;
    return `
    <div class="modal-head"><h2>${isNew ? '📊 Registrar semana' : 'Editar semana'}</h2><button class="icon-btn" style="margin-left:auto" data-modal-close>✕</button></div>
    <div class="modal-body" id="metric-form" data-id="${e(m.id || '')}" data-client="${e(clientId)}">
      <div class="field"><label>Semana (qualquer dia da semana — será ajustado para segunda-feira)</label><input class="input" type="date" name="week" value="${e(m.week)}"></div>
      <div class="grid-3">${f('spend', 'Investimento (R$)', '0,00')}${f('leads', 'Leads')}${f('qualified', 'Leads qualificados')}</div>
      <div class="grid-3">${f('meetings', 'Reuniões / consultas')}${f('contracts', 'Contratos fechados')}${f('revenue', 'Honorários (R$)')}</div>
      <div class="field"><label>Observação</label><input class="input" name="note" value="${e(m.note || '')}" placeholder="Ex.: feriado na quinta, troca de criativos…"></div>
      ${isNew ? '<label class="toggle"><input type="checkbox" class="check" name="alsoLog" checked> Registrar também no diário de bordo</label>' : ''}
    </div>
    <div class="modal-foot"><button class="btn" data-modal-close>Cancelar</button><button class="btn btn-primary" data-action="save-metric-form">Salvar</button></div>`;
  };

  /** Gera texto de relatório semanal (formato WhatsApp) a partir das métricas + diário. */
  Forms.buildWeeklyReport = (c) => {
    const ms = Store.metricsFor(c.id); const lm = ms[ms.length - 1]; const pm = ms[ms.length - 2];
    const d = Store.derive(lm); const pd = Store.derive(pm);
    const from = U.addDays(U.today(), -7);
    const logs = Store.logs({ clientId: c.id, from, hideAuto: false }).filter((l) => l.type !== 'nota' || !l.auto).reverse();
    const done = Store.tasks({ clientId: c.id, status: 'done' }).filter((t) => t.completedAt && t.completedAt >= U.parse(from).getTime());
    const next = Store.sortTasks(Store.tasks({ clientId: c.id, open: true })).slice(0, 4);
    const pct = (a, b) => (a != null && b) ? ` (${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(0)}% vs semana anterior)` : '';
    let t = `*Relatório semanal — ${c.name}*\n`;
    t += `Período: ${U.fmtDate(from)} a ${U.fmtDate(U.today())}\n\n`;
    if (lm) {
      t += `📊 *Números da semana (${U.fmtDate(lm.week)})*\n`;
      t += `• Investimento: ${U.fmtMoney(lm.spend)}\n`;
      t += `• Leads: ${U.fmtNum(lm.leads)}${pct(lm.leads, pm?.leads)}\n`;
      if (d.cpl != null) t += `• Custo por lead: ${U.fmtMoney(d.cpl)}${pct(d.cpl, pd.cpl)}\n`;
      if (lm.qualified != null && lm.qualified !== '') t += `• Leads qualificados: ${U.fmtNum(lm.qualified)}\n`;
      if (lm.contracts != null && lm.contracts !== '') t += `• Contratos fechados: ${U.fmtNum(lm.contracts)}\n`;
      t += '\n';
    }
    const relevant = logs.filter((l) => l.type !== 'tarefa');
    if (relevant.length) {
      t += '🛠️ *O que fizemos*\n';
      relevant.forEach((l) => { t += `• ${l.actionsDone || l.title || l.analysis || M.logType[l.type]?.label}\n`; });
      t += '\n';
    }
    if (done.length) {
      t += '✅ *Entregas concluídas*\n';
      done.forEach((x) => { t += `• ${x.title}\n`; });
      t += '\n';
    }
    if (next.length) {
      t += '🎯 *Próximos passos*\n';
      next.forEach((x) => { t += `• ${x.title}${x.due ? ` (${U.fmtDate(x.due)})` : ''}\n`; });
      t += '\n';
    }
    t += 'Qualquer dúvida, estou à disposição!';
    return t;
  };

  Forms.weeklyReport = (c) => `
    <div class="modal-head"><h2>📋 Relatório da semana — ${e(c.name)}</h2><button class="icon-btn" style="margin-left:auto" data-modal-close>✕</button></div>
    <div class="modal-body" id="report-form" data-client="${c.id}">
      <div class="small muted">Gerado automaticamente a partir das métricas, do diário de bordo e das tarefas. Edite à vontade antes de enviar.</div>
      <textarea class="textarea" name="text" style="min-height:360px;font-size:13px">${e(Forms.buildWeeklyReport(c))}</textarea>
      <label class="toggle"><input type="checkbox" class="check" name="logIt" checked> Registrar o envio no diário de bordo</label>
    </div>
    <div class="modal-foot">
      ${U.waLink(c.contact?.phone) ? '<button class="btn" data-action="report-whatsapp">🟢 Abrir no WhatsApp</button>' : ''}
      <button class="btn btn-primary" data-action="report-copy">📋 Copiar</button>
    </div>`;

  /* ============================== Painel da tarefa ============================== */
  const taskDrawer = (id) => {
    const t = Store.task(id);
    if (!t) return '';
    const c = Store.client(t.clientId);
    const ckDone = t.checklist.filter((i) => i.done).length;
    const logs = Store.state.logs.filter((l) => l.taskId === t.id);
    return `
    <div class="overlay" data-action="close-drawer"></div>
    <aside class="drawer" role="dialog" aria-label="Detalhes da tarefa">
      <div class="drawer-head">
        ${c ? `<a class="client-chip" href="#/cliente/${c.id}" data-action="close-drawer-nav"><span class="dot" style="background:${e(c.color)}"></span>${e(c.name)}</a>` : '<span class="client-chip muted">Interno</span>'}
        <span class="muted small">· criada ${U.timeAgo(t.createdAt)}</span>
        <div style="margin-left:auto" class="row">
          <button class="btn btn-sm ${t.status === 'done' ? '' : 'btn-primary'}" data-action="toggle-done" data-id="${t.id}">${t.status === 'done' ? '↺ Reabrir' : '✓ Concluir'}</button>
          <button class="icon-btn" data-action="duplicate-task" data-id="${t.id}" title="Duplicar">⧉</button>
          <button class="icon-btn" data-action="delete-task" data-id="${t.id}" title="Excluir">🗑️</button>
          <button class="icon-btn" data-action="close-drawer" title="Fechar (Esc)">✕</button>
        </div>
      </div>
      <div class="drawer-body">
        <input class="title-edit" value="${e(t.title)}" data-change="task-field" data-id="${t.id}" data-field="title" aria-label="Título">
        <div class="props">
          <label>◉ Status</label><select class="select select-sm" data-change="task-field" data-id="${t.id}" data-field="status">${options(M.STATUSES, t.status)}</select>
          <label>⚑ Prioridade</label><select class="select select-sm" data-change="task-field" data-id="${t.id}" data-field="priority">${options(M.PRIORITIES, t.priority)}</select>
          <label>📅 Prazo</label><div class="row"><input type="date" class="input input-sm" value="${e(t.due || '')}" data-change="task-field" data-id="${t.id}" data-field="due">
            <button class="btn btn-sm btn-ghost" data-action="quick-due" data-id="${t.id}" data-days="0">Hoje</button><button class="btn btn-sm btn-ghost" data-action="quick-due" data-id="${t.id}" data-days="1">Amanhã</button><button class="btn btn-sm btn-ghost" data-action="quick-due" data-id="${t.id}" data-days="7">+1 sem</button></div>
          <label>👤 Responsável</label><select class="select select-sm" data-change="task-field" data-id="${t.id}" data-field="assignee">${teamOptions(t.assignee)}</select>
          <label>🗂️ Cliente</label><select class="select select-sm" data-change="task-field" data-id="${t.id}" data-field="clientId">${clientOptions(t.clientId)}</select>
          <label>🔁 Repetir</label><select class="select select-sm" data-change="task-field" data-id="${t.id}" data-field="recurrence">${options(M.RECURRENCES, t.recurrence || 'none')}</select>
          <label>🏷️ Tags</label><input class="input input-sm" value="${e(t.tags.join(', '))}" placeholder="separe por vírgula" data-change="task-tags" data-id="${t.id}">
          <label>⏱️ Tempo</label><div class="row-wrap"><b>${U.fmtMinutes(t.timeSpent)}</b>
            ${[15, 30, 60].map((m) => `<button class="btn btn-sm" data-action="add-time" data-id="${t.id}" data-min="${m}">+${m < 60 ? m + 'min' : '1h'}</button>`).join('')}
            ${t.timeSpent ? `<button class="btn btn-sm btn-ghost" data-action="add-time" data-id="${t.id}" data-min="-${t.timeSpent}">zerar</button>` : ''}</div>
        </div>

        <div class="h-sub">📝 Descrição</div>
        <textarea class="textarea" style="min-height:110px" data-change="task-field" data-id="${t.id}" data-field="description" placeholder="Adicione detalhes, links, contexto…">${e(t.description || '')}</textarea>

        <div class="h-sub">☑️ Checklist <span class="muted small">${ckDone}/${t.checklist.length}</span></div>
        ${t.checklist.length ? `<div class="progress" style="margin-bottom:8px"><span style="width:${(ckDone / t.checklist.length) * 100}%"></span></div>` : ''}
        ${t.checklist.map((i) => `
          <div class="checklist-item ${i.done ? 'done' : ''}">
            <input type="checkbox" class="check" data-action="toggle-check" data-id="${t.id}" data-item="${i.id}" ${i.done ? 'checked' : ''}>
            <span class="txt grow">${e(i.text)}</span>
            <button class="icon-btn sm" data-action="check-to-task" data-id="${t.id}" data-item="${i.id}" title="Transformar em tarefa">↗</button>
            <button class="icon-btn sm" data-action="remove-check" data-id="${t.id}" data-item="${i.id}" title="Remover">✕</button>
          </div>`).join('')}
        <input class="input input-sm" style="margin-top:6px" placeholder="＋ Adicionar item e pressionar Enter" data-enter="add-check" data-id="${t.id}">

        <div class="h-sub">💬 Comentários <span class="muted small">${t.comments.length}</span></div>
        ${t.comments.map((cm) => `<div class="comment">${C.avatar(cm.author)}<div class="bubble"><div class="small muted"><b style="color:var(--text)">${e(cm.author || '')}</b> · ${U.timeAgo(cm.at)}</div>${U.rich(cm.text)}</div></div>`).join('')}
        <div class="row" style="align-items:flex-start"><textarea class="textarea" id="comment-input" style="min-height:44px" placeholder="Escreva um comentário… (Ctrl+Enter)" data-enter-ctrl="add-comment" data-id="${t.id}"></textarea>
          <button class="btn" data-action="add-comment" data-id="${t.id}">Enviar</button></div>

        ${c ? `<div class="h-sub">📓 Diário de bordo</div>
          ${logs.map((l) => `<div class="small" style="margin-bottom:4px">${M.logType[l.type]?.icon} ${e(l.title)} · <span class="muted">${U.fmtDate(l.date)}</span></div>`).join('')}
          <button class="btn btn-sm" data-action="task-to-log" data-id="${t.id}">📓 Registrar algo sobre esta tarefa no diário</button>` : ''}

        <div class="h-sub">🕓 Histórico</div>
        ${t.activity.slice().reverse().slice(0, 15).map((a) => `<div class="activity">${e(a.text)} · ${U.timeAgo(a.at)}</div>`).join('')}
      </div>
    </aside>`;
  };

  window.VS = VS;
  window.Views = {
    dashboard, tasks: tasksPage, clients: clientsPage, client: clientPage, journal: journalPage,
    calendar: calendarPage, settings: settingsPage, taskDrawer, taskBody, journalLogs, buildAlerts,
  };
  window.Forms = Forms;
})();
