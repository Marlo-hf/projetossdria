/* Páginas, formulários e a janela da tarefa. Cada página devolve { head, toolbar, body, flush }. */
(function () {
  const e = U.esc;
  const M = window.META;
  const I = C.I;

  /* ============================== Estado de visualização ============================== */
  const VS_KEY = 'bordo:ui:v2';
  const VS_DEFAULT = {
    q: '', assignee: '', showDone: false,
    groupBy: { all: 'status', client: 'status', criativos: 'status', interno: 'status' },
    view: { all: 'list', criativos: 'board', interno: 'list' },
    open: [], teamPerson: '', homeMine: true, sideOpen: [], clientsStatus: 'ativos', clientsQ: '',
    diary: { q: '', clientId: '', period: '30', showTasks: false },
  };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(VS_KEY) || '{}'); } catch (err) { saved = {}; }
  const VS = { ...VS_DEFAULT, ...saved };
  ['groupBy', 'view', 'diary'].forEach((k) => { VS[k] = { ...VS_DEFAULT[k], ...(saved[k] || {}) }; });
  VS.save = () => { try { const { save, ...rest } = VS; localStorage.setItem(VS_KEY, JSON.stringify(rest)); } catch (err) { /* ignora */ } };

  /* ============================== Helpers ============================== */
  const adsLink = (acc) => {
    const v = String(acc || '').trim();
    if (/^https?:/i.test(v)) return v;
    const id = v.replace(/^act_/i, '').replace(/\D/g, '');
    return id ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${id}` : '';
  };
  const url = (v) => { v = String(v || '').trim(); return !v ? '' : /^https?:\/\//i.test(v) ? v : 'https://' + v; };
  const team = () => Store.settings.team || [];
  const openTasks = (list) => list.filter((t) => t.status !== 'done');
  /** Demandas de verdade: abertas e que não são a rotina de acompanhamento diário. */
  const workTasks = (list) => list.filter((t) => t.status !== 'done' && t.status !== 'daily');
  const manualLogs = (filter) => Store.logs(filter).filter((l) => l.type !== 'tarefa' && !(l.auto && l.type === 'nota'));
  const lastDiary = (clientId) => manualLogs({ clientId })[0] || null;

  const head = ({ crumbs = '', icon = '', title, actions = '', tabs = '' }) => `
    <header class="head">
      <div class="crumbs"><button class="ibtn menu-btn" data-action="open-sidebar" aria-label="Menu">${I('menu')}</button>${crumbs}</div>
      <div class="title-row">${icon}<h1>${title}</h1><div class="actions">${actions}</div></div>
      ${tabs ? `<nav class="views">${tabs}</nav>` : '<div style="height:8px"></div>'}
    </header>`;
  const tab = (active, href, icon, label, count) => `<a class="vtab ${active ? 'active' : ''}" ${href.startsWith('#') ? `href="${href}"` : href}>${I(icon, 15)}${label}${count != null ? `<span class="cnt">${count}</span>` : ''}</a>`;
  const newTaskBtn = (defaults = {}) => `<button class="btn btn-primary" data-action="new-task" data-defaults='${e(JSON.stringify(defaults))}'>${I('plus', 15)}<span class="hide-sm">Tarefa</span></button>`;

  const taskToolbar = (scope, { list = true } = {}) => `
    <div class="toolbar">
      <label class="search">${I('search', 14)}<input id="q-${scope}" placeholder="Buscar tarefas" value="${e(VS.q)}" data-input="q"></label>
      <select class="chipsel" data-change="vs" data-field="assignee" aria-label="Responsável">
        <option value="">Todos os responsáveis</option>${team().map((n) => `<option ${n === VS.assignee ? 'selected' : ''}>${e(n)}</option>`).join('')}<option value="__none" ${VS.assignee === '__none' ? 'selected' : ''}>Sem responsável</option>
      </select>
      ${list ? `<select class="chipsel" data-change="group-by" data-scope="${scope}" aria-label="Agrupar">
        ${[['status', 'Agrupar: Status'], ['assignee', 'Agrupar: Responsável'], ['due', 'Agrupar: Vencimento'], ['priority', 'Agrupar: Prioridade'], ...(scope === 'client' ? [] : [['client', 'Agrupar: Cliente']])].map(([k, l]) => `<option value="${k}" ${VS.groupBy[scope] === k ? 'selected' : ''}>${l}</option>`).join('')}
      </select>` : ''}
      <button class="chipsel ${VS.showDone ? 'on' : ''}" data-action="toggle-done-visible">${I('check', 14)} Concluídas</button>
    </div>`;

  const applyFilters = (list) => {
    if (VS.q) list = list.filter((t) => U.match([t.title, t.description, (t.tags || []).join(' '), Store.client(t.clientId)?.name].join(' '), VS.q));
    if (VS.assignee) list = list.filter((t) => (VS.assignee === '__none' ? !t.assignee : t.assignee === VS.assignee));
    if (!VS.showDone) list = list.filter((t) => t.status !== 'done');
    return list;
  };

  /* ============================== Início ============================== */
  const home = () => {
    const T = U.today();
    const me = Store.settings.userName;
    const all = workTasks(Store.state.tasks);
    const mine = all.filter((t) => t.assignee === me);
    const late = all.filter((t) => Store.isOverdue(t));
    const today = all.filter((t) => t.due === T);
    const stale = Store.clients({ includeClosed: false }).filter((c) => c.status !== 'pausado').map((c) => ({ c, l: lastDiary(c.id) }))
      .filter(({ l }) => !l || U.diffDays(T, l.date) > (Store.settings.staleDays || 3))
      .sort((a, b) => (a.l?.date || '').localeCompare(b.l?.date || ''));
    const list = VS.homeMine ? mine : all;
    const recent = manualLogs({}).slice(0, 8);
    const h = new Date().getHours();
    return {
      head: head({ title: `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}, ${e(me)}`, crumbs: `<span>${e(U.fmtLong(T))}</span>`, actions: newTaskBtn({ assignee: me, due: T }) }),
      body: `<div class="pad">
        <div class="stats">
          <div class="stat" data-action="home-mine" data-v="1"><div class="v">${mine.length}</div><div class="l">Minhas demandas abertas</div></div>
          <div class="stat" data-action="goto" data-href="#/equipe"><div class="v ${late.length ? 'red' : ''}">${late.length}</div><div class="l">Atrasadas na equipe</div></div>
          <div class="stat" data-action="goto" data-href="#/demandas"><div class="v">${today.length}</div><div class="l">Vencem hoje</div></div>
          <div class="stat" data-action="goto" data-href="#/diario"><div class="v ${stale.length ? 'red' : ''}">${stale.length}</div><div class="l">Clientes sem diário há +${Store.settings.staleDays || 3} dias</div></div>
        </div>
        <div class="home">
          <div style="min-width:0">
            <div class="h2">${VS.homeMine ? 'Minhas demandas' : 'Demandas de todos'}
              <span style="margin-left:auto" class="row"><button class="chipsel ${VS.homeMine ? 'on' : ''}" data-action="home-mine" data-v="1">Minhas</button><button class="chipsel ${VS.homeMine ? '' : 'on'}" data-action="home-mine" data-v="0">Equipe</button></span></div>
            <div style="overflow-x:auto">${list.length ? C.taskList(list, { groupBy: 'due', open: VS.open, defaults: { assignee: me } }) : C.empty('Nenhuma demanda aberta', VS.homeMine ? 'Nada atribuído a você agora.' : '')}</div>
          </div>
          <div style="min-width:0">
            <div class="sec"><div class="sec-h">${I('book', 15)} Diário parado <span class="right muted small">sem atualização há +${Store.settings.staleDays || 3} dias</span></div>
              ${stale.length ? stale.slice(0, 12).map(({ c, l }) => `<div class="mini" data-action="goto" data-href="#/c/${c.id}/diario">${C.folder(c)}<span class="grow ellipsis">${e(c.name)}</span><span class="small ${l ? 'muted' : ''}" style="${l ? '' : 'color:var(--red)'}">${l ? U.daysAgoLabel(l.date) : 'nunca'}</span></div>`).join('') + (stale.length > 12 ? `<div class="mini muted small" data-action="goto" data-href="#/diario">e mais ${stale.length - 12}…</div>` : '') : C.empty('Todos os diários em dia')}
            </div>
            <div class="sec"><div class="sec-h">${I('clock', 15)} Últimas atualizações do diário</div>
              ${recent.length ? recent.map((l) => { const c = Store.client(l.clientId); return `<div class="mini" data-action="goto" data-href="#/c/${l.clientId}/diario"><div class="grow"><div class="ellipsis" style="font-weight:500">${e(l.analysis || l.actionsDone || l.title || l.planned)}</div><div class="small muted">${c ? e(c.name) : ''} · ${U.fmtDate(l.date)}</div></div></div>`; }).join('') : C.empty('Sem atualizações ainda')}
            </div>
          </div>
        </div>
      </div>`,
    };
  };

  /* ============================== Demandas (lista / quadro) ============================== */
  const SCOPES = {
    all: { title: 'Demandas', icon: 'tasks', filter: () => true, href: '#/demandas', defaults: {} },
    criativos: { title: 'Produção de criativos', icon: 'image', filter: (t) => (t.tags || []).includes('Produção de criativos'), href: '#/criativos', defaults: { tags: ['Produção de criativos'] } },
    interno: { title: 'Interno', icon: 'inbox', filter: (t) => !t.clientId && !(t.tags || []).includes('Produção de criativos'), href: '#/interno', defaults: { clientId: '' } },
  };
  const tasksPage = (scope) => {
    const S = SCOPES[scope];
    const base = Store.state.tasks.filter(S.filter);
    const list = applyFilters(base);
    const view = VS.view[scope];
    return {
      head: head({
        crumbs: `<span>Espaço de trabalho</span>`, icon: `<span class="space-ic" style="background:var(--accent)">${I(S.icon, 12)}</span>`, title: S.title,
        actions: newTaskBtn(S.defaults),
        tabs: tab(view === 'list', `data-action="set-view" data-scope="${scope}" data-view="list" href="javascript:void 0"`, 'list', 'Lista', openTasks(base).length) + tab(view === 'board', `data-action="set-view" data-scope="${scope}" data-view="board" href="javascript:void 0"`, 'board', 'Quadro'),
      }),
      toolbar: taskToolbar(scope, { list: view === 'list' }),
      body: view === 'board' ? C.board(list, { showClient: scope !== 'interno', defaults: S.defaults }) : `<div class="pad">${C.taskList(list, { groupBy: VS.groupBy[scope], showClient: scope !== 'interno', defaults: S.defaults, open: VS.open })}</div>`,
      flush: view === 'board',
    };
  };

  /* ============================== Demandas da equipe ============================== */
  const teamPage = () => {
    const T = U.today();
    const open = workTasks(Store.state.tasks);
    const names = [...new Set([...team(), ...open.map((t) => t.assignee || '')])];
    const p = VS.teamPerson;
    const filtered = applyFilters(open);
    const people = names.map((n) => {
      const ts = open.filter((t) => (t.assignee || '') === n);
      const late = ts.filter((t) => t.due && t.due < T).length;
      return `<div class="person ${p === (n || '__none') ? 'on' : ''}" data-action="team-person" data-name="${e(n || '__none')}">${C.avatar(n, 'lg')}<div><div style="font-weight:600">${e(n || 'Sem responsável')}</div><div class="nums"><b>${ts.length}</b> abertas${late ? ` · <b style="color:var(--red)">${late}</b> atrasadas` : ''}</div></div></div>`;
    }).join('');
    const sel = p ? filtered.filter((t) => (p === '__none' ? !t.assignee : t.assignee === p)) : null;
    return {
      head: head({ crumbs: '<span>Espaço de trabalho</span>', icon: `<span class="space-ic" style="background:#0ea5e9">${I('team', 12)}</span>`, title: 'Demandas da equipe', actions: newTaskBtn(p && p !== '__none' ? { assignee: p } : {}) }),
      toolbar: `<div class="toolbar"><label class="search">${I('search', 14)}<input id="q-team" placeholder="Buscar tarefas" value="${e(VS.q)}" data-input="q"></label>
        <span class="small muted">O que falta fazer, por pessoa (sem as rotinas de acompanhamento diário). Clique em alguém para ver só as demandas dele; arraste um cartão para passar a demanda.</span></div>`,
      body: `<div class="people">${people}${p ? `<button class="chipsel" data-action="team-person" data-name="">${I('x', 14)} Ver todos</button>` : ''}</div>
        ${sel ? `<div class="pad">${C.taskList(sel, { groupBy: 'due', open: VS.open, defaults: { assignee: p === '__none' ? '' : p } })}</div>` : C.board(filtered, { by: 'assignee' })}`,
      flush: !sel,
    };
  };

  /* ============================== Clientes (CRM em funil) ============================== */
  const clientStats = (c) => {
    const open = workTasks(Store.tasks({ clientId: c.id }));
    return { open: open.length, late: open.filter((t) => Store.isOverdue(t)).length, last: lastDiary(c.id) };
  };
  const isStale = (last) => !last || U.diffDays(U.today(), last.date) > (Store.settings.staleDays || 3);
  const filteredClients = () => {
    let list = Store.clients();
    const f = VS.clientsPre || 'all';
    if (VS.clientsQ) list = list.filter((c) => U.match([c.name, c.niche, c.owner].join(' '), VS.clientsQ));
    if (VS.clientsOwner) list = list.filter((c) => c.owner === VS.clientsOwner);
    if (VS.clientsNiche) list = list.filter((c) => U.match(c.niche, VS.clientsNiche));
    if (f === 'mine') list = list.filter((c) => c.owner === Store.settings.userName);
    if (f === 'stale') list = list.filter((c) => c.status !== 'encerrado' && c.status !== 'pausado' && isStale(clientStats(c).last));
    if (f === 'late') list = list.filter((c) => clientStats(c).late > 0);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  };
  const clientCard = (c) => {
    const st = clientStats(c);
    const stale = c.status !== 'encerrado' && c.status !== 'pausado' && isStale(st.last);
    return `<div class="card lead" draggable="true" data-drag-client="${c.id}" data-action="open-client" data-id="${c.id}">
      <div class="lead-top">${C.folder(c)}<span class="lead-name">${e(c.name)}</span>${c.metaPage ? `<a class="ibtn sm" href="${e(url(c.metaPage))}" target="_blank" rel="noopener" title="Abrir no Meta">${I('ads', 14)}</a>` : ''}</div>
      <div class="lead-niche">${e(c.niche) || '<span class="muted">O que ele mexe: —</span>'}</div>
      <div class="lead-foot">
        <span class="pillx ${st.late ? 'red' : ''}" title="Demandas abertas">${I('tasks', 12)}${st.open}${st.late ? ` · ${st.late} atrasada${st.late > 1 ? 's' : ''}` : ''}</span>
        <span class="pillx ${stale ? 'red' : st.last && c.status !== 'encerrado' && c.status !== 'pausado' ? 'ok' : ''}" title="Última atualização do diário">${I('book', 12)}${st.last ? U.daysAgoLabel(st.last.date) : 'sem diário'}</span>
        ${c.owner ? `<span style="margin-left:auto">${C.avatar(c.owner)}</span>` : ''}
      </div>
    </div>`;
  };
  const clientsPage = () => {
    const list = filteredClients();
    const view = VS.clientsView || 'board';
    const pre = VS.clientsPre || 'all';
    const niches = [...new Set(Store.state.clients.flatMap((c) => String(c.niche || '').split('·').map((x) => x.trim())).filter(Boolean))].sort();
    const owners = [...new Set(Store.state.clients.map((c) => c.owner).filter(Boolean))].sort();
    const chip = (k, label, n) => `<button class="chipsel ${pre === k ? 'on' : ''}" data-action="clients-pre" data-k="${k}">${label}${n != null ? ` <b>${n}</b>` : ''}</button>`;
    const all = Store.state.clients.filter((c) => c.status !== 'encerrado');
    const nStale = all.filter((c) => c.status !== 'pausado' && isStale(clientStats(c).last)).length;
    const nLate = all.filter((c) => clientStats(c).late > 0).length;
    let body;
    if (!list.length) body = C.empty('Nenhum cliente neste filtro', '', '<button class="btn" data-action="clients-pre" data-k="all">Limpar filtro</button>');
    else if (view === 'board') {
      body = `<div class="board">${M.CLIENT_STATUSES.map((s) => {
        const items = list.filter((c) => c.status === s.id);
        return `<div class="col" data-drop-cstatus="${s.id}"><div class="col-h"><span class="st" style="--c:${s.color}">${e(s.label)}</span><span class="n">${items.length}</span></div>
          <div class="cards">${items.map(clientCard).join('')}</div>
          ${s.id === 'onboarding' ? `<button class="col-add" data-action="new-client">${I('plus', 14)} Novo cliente</button>` : ''}</div>`;
      }).join('')}</div>`;
    } else {
      body = `<div style="overflow-x:auto;padding:0 12px"><table class="dt"><thead><tr><th>Cliente</th><th>O que ele mexe</th><th>Meta</th><th>Responsável</th><th>Status</th><th style="text-align:right">Demandas</th><th>Último diário</th></tr></thead><tbody>
        ${list.map((c) => { const st = clientStats(c); const s = M.clientStatus[c.status] || M.clientStatus.ativo; return `<tr data-action="open-client" data-id="${c.id}">
          <td><span class="cname">${C.folder(c)}${e(c.name)}</span></td><td class="muted">${e(c.niche) || '—'}</td>
          <td>${c.metaPage ? `<a class="lnk" href="${e(url(c.metaPage))}" target="_blank" rel="noopener">${I('ads', 12)} Abrir</a>` : '—'}</td>
          <td>${c.owner ? `<span class="row">${C.avatar(c.owner)}<span class="small">${e(c.owner.split(' ')[0])}</span></span>` : '—'}</td>
          <td><span class="st soft" style="--c:${s.color}">${e(s.label)}</span></td><td class="num">${st.open}${st.late ? ` <span style="color:var(--red)">(${st.late})</span>` : ''}</td>
          <td class="small ${isStale(st.last) ? 'muted' : ''}">${st.last ? U.daysAgoLabel(st.last.date) : 'nunca'}</td></tr>`; }).join('')}</tbody></table></div>`;
    }
    return {
      head: head({ crumbs: '<span>Espaços</span>', icon: '<span class="space-ic" style="background:#16a34a">C</span>', title: 'Clientes', actions: `<button class="btn btn-primary" data-action="new-client">${I('plus', 15)}Novo cliente</button>`,
        tabs: tab(view === 'board', 'data-action="clients-view" data-view="board" href="javascript:void 0"', 'board', 'Funil') + tab(view === 'list', 'data-action="clients-view" data-view="list" href="javascript:void 0"', 'list', 'Lista', list.length) }),
      toolbar: `<div class="toolbar">
        <label class="search">${I('search', 14)}<input id="q-clients" placeholder="Buscar cliente" value="${e(VS.clientsQ)}" data-input="clients-q"></label>
        ${chip('all', 'Todos')}${chip('mine', 'Meus clientes')}${chip('stale', 'Diário atrasado', nStale)}${chip('late', 'Com demandas atrasadas', nLate)}
        <select class="chipsel" data-change="vs" data-field="clientsOwner" aria-label="Responsável"><option value="">Responsável: todos</option>${owners.map((o) => `<option ${o === VS.clientsOwner ? 'selected' : ''}>${e(o)}</option>`).join('')}</select>
        <select class="chipsel" data-change="vs" data-field="clientsNiche" aria-label="O que mexe"><option value="">O que mexe: todos</option>${niches.map((o) => `<option ${o === VS.clientsNiche ? 'selected' : ''}>${e(o)}</option>`).join('')}</select>
      </div>`,
      body, flush: true,
    };
  };

  /* ============================== Ficha do cliente (informações + diário) ============================== */
  const prop = (c, icon, label, path, type = 'text', ph = '', extra = '') => {
    const val = path.split('.').reduce((o, k) => (o || {})[k], c) ?? '';
    return `<div class="pl">${I(icon, 15)}${label}</div><div class="pv"><input type="${type}" id="p-${path.replace('.', '-')}" value="${e(val)}" placeholder="${e(ph)}" data-change="client-field" data-id="${c.id}" data-field="${path}">${extra}</div>`;
  };
  const openBtn = (href, label = 'Abrir') => href ? `<a class="lnk" href="${e(href)}" target="_blank" rel="noopener">${I('ext', 12)}${label}</a>` : '';

  const clientInfo = (c) => `
    <div class="sec"><div class="sec-h">${I('user', 15)} Informações<span class="right small muted">salva sozinho</span></div>
      <div class="props">
        ${prop(c, 'folder', 'Cliente', 'name')}
        ${prop(c, 'target', 'O que ele mexe', 'niche', 'text', 'Ex.: Gestão de passivos')}
        ${prop(c, 'ads', 'Página do Meta', 'metaPage', 'url', 'Link da conta no Meta', openBtn(url(c.metaPage)))}
        <div class="pl">${I('team', 15)}Responsável</div><div class="pv"><select id="p-owner" data-change="client-field" data-id="${c.id}" data-field="owner"><option value="">—</option>${[...new Set([...team(), c.owner].filter(Boolean))].map((n) => `<option ${n === c.owner ? 'selected' : ''}>${e(n)}</option>`).join('')}</select></div>
        <div class="pl">${I('status', 15)}Status</div><div class="pv"><select id="p-status" data-change="client-field" data-id="${c.id}" data-field="status">${M.CLIENT_STATUSES.map((s) => `<option value="${s.id}" ${s.id === c.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
        ${prop(c, 'money', 'Teto de investimento', 'investmentCap', 'number', 'R$')}
        ${prop(c, 'target', 'Meta de CPL', 'goals.cpl', 'number', 'R$')}
        <div class="pl">${I('note', 15)}Observações</div><div class="pv"><textarea id="p-notes" data-change="client-field" data-id="${c.id}" data-field="notes" placeholder="Combinados, restrições, como o cliente gosta de receber relatório…">${e(c.notes || '')}</textarea></div>
      </div>
    </div>`;

  const clientDemands = (c) => {
    const open = Store.sortTasks(openTasks(Store.tasks({ clientId: c.id })));
    return `<div class="sec"><div class="sec-h">${I('tasks', 15)} Demandas abertas <span class="muted">${open.length}</span>
        <button class="btn btn-sm right" data-action="new-task" data-defaults='${e(JSON.stringify({ clientId: c.id }))}'>${I('plus', 13)}Tarefa</button></div>
      ${open.slice(0, 8).map((t) => `<div class="mini" data-action="open-task" data-id="${t.id}">${C.sdot(t.status)}<span class="grow ellipsis">${e(t.title)}</span>${C.due(t)}${C.avatar(t.assignee)}</div>`).join('') || '<div class="empty" style="padding:18px">Nada pendente</div>'}
      ${open.length > 8 ? `<a class="mini small" href="#/c/${c.id}/demandas">Ver todas as ${open.length}</a>` : ''}
    </div>`;
  };

  /** Ficha completa: informações e demandas à esquerda, diário de bordo à direita — tudo na mesma tela. */
  const clientSheet = (c) => `
    <div class="sheet">
      <div class="sheet-side">${clientInfo(c)}${clientDemands(c)}</div>
      <div class="sheet-main">
        <div class="h2">${I('book', 16)} Diário de bordo <span class="muted small" style="font-weight:500">${manualLogs({ clientId: c.id }).length} atualizações</span></div>
        ${C.diaryComposer({ clientId: c.id })}${diaryFilters('client')}
        <div style="overflow-x:auto">${C.diaryTable(diaryLogs(c.id))}</div>
      </div>
    </div>`;

  const clientPanel = (id) => {
    const c = Store.client(id); if (!c) return '';
    const s = M.clientStatus[c.status] || M.clientStatus.ativo;
    return `<div class="task-wrap"><div class="overlay" data-action="close-client"></div>
      <div class="task client-panel" role="dialog" aria-label="${e(c.name)}">
        <div class="task-top">${C.folder(c, 18)}<b style="font-size:16px">${e(c.name)}</b>
          <button class="cell-btn" data-action="pick-client-status" data-id="${c.id}"><span class="st soft" style="--c:${s.color}">${e(s.label)}</span></button>
          <span class="grow"></span>
          ${c.metaPage ? `<a class="btn btn-sm" href="${e(url(c.metaPage))}" target="_blank" rel="noopener">${I('ads', 14)}Meta</a>` : ''}
          ${c.clickupUrl ? `<a class="btn btn-sm hide-sm" href="${e(url(c.clickupUrl))}" target="_blank" rel="noopener">${I('ext', 14)}ClickUp</a>` : ''}
          <a class="btn btn-sm" href="#/c/${c.id}" data-action="close-client-nav">${I('folder', 14)}Abrir pasta</a>
          <button class="ibtn" data-action="close-client" title="Fechar (Esc)">${I('x')}</button>
        </div>
        <div class="panel-body">${clientSheet(c)}</div>
      </div></div>`;
  };

  const clientPage = (id, tabId = 'visao') => {
    const c = Store.client(id);
    if (!c) return { head: head({ title: 'Cliente não encontrado' }), body: C.empty('Cliente não encontrado', 'Ele pode ter sido excluído.', '<a class="btn" href="#/clientes">Ver clientes</a>') };
    const tasks = Store.tasks({ clientId: id });
    const s = M.clientStatus[c.status] || M.clientStatus.ativo;
    const base = `#/c/${id}`;
    if (tabId === 'diario') tabId = 'visao';
    const H = head({
      crumbs: `<a href="#/clientes">Clientes</a>${I('chevR', 12)}<span>${e(c.name)}</span>`,
      icon: C.folder(c, 20), title: e(c.name) + ` <button class="cell-btn" style="margin-left:6px;vertical-align:3px" data-action="pick-client-status" data-id="${c.id}"><span class="st soft" style="--c:${s.color}">${e(s.label)}</span></button>`,
      actions: `${c.metaPage ? `<a class="btn" href="${e(url(c.metaPage))}" target="_blank" rel="noopener">${I('ads', 15)}<span class="hide-sm">Meta</span></a>` : ''}${newTaskBtn({ clientId: id })}`,
      tabs: tab(tabId === 'visao', base, 'book', 'Ficha e diário') + tab(tabId === 'demandas', `${base}/demandas`, 'list', 'Demandas', openTasks(tasks).length) + tab(tabId === 'quadro', `${base}/quadro`, 'board', 'Quadro'),
    });
    if (tabId === 'demandas') return { head: H, toolbar: taskToolbar('client'), body: `<div class="pad">${C.taskList(applyFilters(tasks), { groupBy: VS.groupBy.client, showClient: false, defaults: { clientId: id }, open: VS.open })}</div>` };
    if (tabId === 'quadro') return { head: H, toolbar: taskToolbar('client', { list: false }), body: C.board(applyFilters(tasks), { showClient: false, defaults: { clientId: id } }), flush: true };
    return { head: H, body: `<div class="pad">${clientSheet(c)}</div>` };
  };

  const diaryFilters = (scope) => {
    const f = VS.diary;
    return `<div class="row" style="flex-wrap:wrap;margin-bottom:10px">
      <label class="search chipsel" style="padding:0 9px">${I('search', 14)}<input id="q-diary-${scope}" style="border:0;outline:0;background:transparent;padding:5px 0;width:170px" placeholder="Buscar no diário" value="${e(f.q)}" data-input="diary-q"></label>
      ${scope === 'all' ? `<select class="chipsel" data-change="diary" data-field="clientId" aria-label="Cliente"><option value="">Todos os clientes</option>${Store.clients().map((c) => `<option value="${c.id}" ${f.clientId === c.id ? 'selected' : ''}>${e(c.name)}</option>`).join('')}</select>` : ''}
      <select class="chipsel" data-change="diary" data-field="period" aria-label="Período">${[['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias'], ['', 'Tudo']].map(([k, l]) => `<option value="${k}" ${f.period === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="chipsel ${f.showTasks ? 'on' : ''}" data-action="diary-tasks">${I('tasks', 14)} Mostrar tarefas concluídas</button>
      <span style="flex:1"></span>
      <button class="chipsel" data-action="copy-diary" data-scope="${scope}">${I('copy', 14)} Copiar</button>
      ${scope === 'client' ? `<label class="chipsel" style="cursor:pointer" title="Importar planilha .xlsx (Data, Análise, Ações programadas, Ações realizadas)">${I('upload', 14)} Importar planilha<input type="file" accept=".xlsx,.xls,.csv" hidden data-change="import-diary-xlsx"></label>` : ''}
    </div>`;
  };
  const diaryLogs = (clientId) => {
    const f = VS.diary;
    const filter = { q: f.q, clientId: clientId || f.clientId };
    if (f.period) filter.from = U.addDays(U.today(), -Number(f.period));
    return Store.logs(filter).filter((l) => (f.showTasks ? true : l.type !== 'tarefa') && !(l.auto && l.type === 'nota'));
  };

  const diaryPage = () => ({
    head: head({ crumbs: '<span>Espaço de trabalho</span>', icon: `<span class="space-ic" style="background:#f59e0b">${I('book', 12)}</span>`, title: 'Diário de bordo' }),
    body: `<div class="pad">${C.diaryComposer({ clientId: VS.diary.clientId, withClient: true })}${diaryFilters('all')}<div style="overflow-x:auto">${C.diaryTable(diaryLogs(), { showClient: true })}</div></div>`,
  });

  /* ============================== Ajustes ============================== */
  const settingsPage = () => {
    const s = Store.settings;
    const f = (label, field, val, type = 'text') => `<div class="field"><label for="s-${field}">${label}</label><input class="input" id="s-${field}" type="${type}" value="${e(val)}" data-change="setting" data-field="${field}"></div>`;
    return {
      head: head({ crumbs: '<span>Espaço de trabalho</span>', title: 'Ajustes' }),
      body: `<div class="pad" style="max-width:760px">
        <div class="sec"><div class="sec-h">${I('settings', 15)} Geral</div><div class="modal-b">
          <div class="g2">${f('Nome do espaço (agência)', 'workspaceName', s.workspaceName || '')}${f('Seu nome', 'userName', s.userName)}</div>
          <div class="field"><label for="s-team">Equipe (um nome por linha)</label><textarea class="textarea" id="s-team" data-change="setting-team">${e(team().join('\n'))}</textarea></div>
          <div class="g2">${f('Avisar diário parado após (dias)', 'staleDays', s.staleDays || 3, 'number')}
            <div class="field"><label>Tema</label><div class="row">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([k, l]) => `<button class="chipsel ${s.theme === k ? 'on' : ''}" data-action="set-theme" data-theme="${k}">${l}</button>`).join('')}</div></div></div>
        </div></div>
        <div class="sec"><div class="sec-h">${I('download', 15)} Backup</div><div class="modal-b">
          <div class="small muted">Os dados ficam salvos neste navegador. Exporte um backup de vez em quando.</div>
          <div class="row" style="flex-wrap:wrap"><button class="btn" data-action="export-json">${I('download', 15)}Exportar backup</button>
            <label class="btn" style="cursor:pointer">${I('upload', 15)}Importar backup<input type="file" accept=".json" hidden data-change="import-json"></label>
            <button class="btn" data-action="export-csv">${I('sheet', 15)}Tarefas em CSV</button></div>
        </div></div>
        <div class="sec"><div class="sec-h">${I('trash', 15)} Dados</div><div class="modal-b">
          <div class="small muted">${Store.state.clients.length} clientes · ${Store.state.tasks.length} tarefas · ${Store.state.logs.length} registros no diário</div>
          <div class="row"><button class="btn btn-danger" data-action="reset-all">Apagar tudo</button></div>
        </div></div>
      </div>`,
    };
  };

  /* ============================== Janela da tarefa ============================== */
  const taskView = (id) => {
    const t = Store.task(id);
    if (!t) return '';
    const c = Store.client(t.clientId);
    const done = t.checklist.filter((i) => i.done).length;
    const feed = [
      ...t.activity.map((a) => ({ at: a.at, html: `<div class="ev">${I('clock', 13)}<span>${e(a.text)} · ${U.timeAgo(a.at)}</span></div>` })),
      ...t.comments.map((cm) => ({ at: cm.at, html: `<div class="cm"><div class="who"><b style="color:var(--text)">${e(cm.author || '')}</b> · ${U.timeAgo(cm.at)}</div>${U.rich(cm.text)}</div>` })),
    ].sort((a, b) => a.at - b.at);
    return `
    <div class="task-wrap"><div class="overlay" data-action="close-task"></div>
    <div class="task" role="dialog" aria-label="Tarefa">
      <div class="task-top">
        <div class="crumbs grow">${c ? `${C.folder(c, 14)}<a href="#/c/${c.id}" data-action="close-task-nav">${e(c.name)}</a>${I('chevR', 12)}<span>Demandas</span>` : '<span>Interno</span>'}
          ${t.clickupUrl ? `<a class="lnk" style="margin-left:8px" href="${e(t.clickupUrl)}" target="_blank" rel="noopener">${I('ext', 12)}ClickUp</a>` : ''}</div>
        <button class="ibtn" data-action="duplicate-task" data-id="${t.id}" title="Duplicar">${I('copy')}</button>
        <button class="ibtn" data-action="delete-task" data-id="${t.id}" title="Excluir">${I('trash')}</button>
        <button class="ibtn" data-action="close-task" title="Fechar (Esc)">${I('x')}</button>
      </div>
      <div class="task-body">
        <div class="task-main">
          <textarea class="task-title" id="t-title" rows="2" data-change="task-field" data-id="${t.id}" data-field="title" aria-label="Título">${e(t.title)}</textarea>
          <div class="tprops">
            <div class="tp"><span class="k">${I('status', 15)}Status</span><div class="row"><button class="cell-btn" data-action="pick-status" data-id="${t.id}">${C.status(t.status)}</button>
              ${t.status === 'done' ? '' : `<button class="btn btn-sm" data-action="complete-task" data-id="${t.id}">${I('check', 13)}Concluir</button>`}</div></div>
            <div class="tp"><span class="k">${I('user', 15)}Responsável</span><div><button class="cell-btn" data-action="pick-assignee" data-id="${t.id}">${C.avatar(t.assignee)}<span>${e(t.assignee || 'Ninguém')}</span></button></div></div>
            <div class="tp"><span class="k">${I('calendar', 15)}Vencimento</span><div><input type="date" id="t-due" value="${e(t.due || '')}" data-change="task-field" data-id="${t.id}" data-field="due"></div></div>
            <div class="tp"><span class="k">${I('flag', 15)}Prioridade</span><div><button class="cell-btn" data-action="pick-prio" data-id="${t.id}">${C.prio(t.priority)}</button></div></div>
            <div class="tp"><span class="k">${I('folder', 15)}Cliente</span><div><button class="cell-btn" data-action="pick-client" data-id="${t.id}">${C.clientTag(t.clientId)}</button></div></div>
            <div class="tp"><span class="k">${I('tag', 15)}Etiquetas</span><div><input type="text" id="t-tags" value="${e(t.tags.join(', '))}" placeholder="separe por vírgula" data-change="task-tags" data-id="${t.id}"></div></div>
          </div>
          <textarea class="desc" id="t-desc" data-change="task-field" data-id="${t.id}" data-field="description" placeholder="Adicione uma descrição…">${e(t.description || '')}</textarea>
          <div class="sub-h">${I('tasks', 16)} Checklist <span class="muted small">${done}/${t.checklist.length}</span></div>
          ${t.checklist.length ? `<div class="progress"><span style="width:${(done / t.checklist.length) * 100}%"></span></div>` : ''}
          ${t.checklist.map((i) => `<div class="ck ${i.done ? 'done' : ''}"><input type="checkbox" class="check" data-action="toggle-check" data-id="${t.id}" data-item="${i.id}" ${i.done ? 'checked' : ''}><span class="txt grow">${e(i.text)}</span><button class="ibtn" data-action="remove-check" data-id="${t.id}" data-item="${i.id}" title="Remover">${I('x', 14)}</button></div>`).join('')}
          <div class="qadd" style="padding-left:8px">${I('plus', 14)}<input id="t-check" placeholder="Adicionar item" data-enter="add-check" data-id="${t.id}"></div>
        </div>
        <aside class="task-side">
          <div class="act-h">Atividade</div>
          <div class="act">${feed.map((f) => f.html).join('') || '<div class="muted small">Sem atividade.</div>'}</div>
          <div class="act-in"><textarea id="comment-input" placeholder="Escreva um comentário… (Ctrl+Enter envia)" data-enter-ctrl="add-comment" data-id="${t.id}"></textarea>
            <div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn btn-primary btn-sm" data-action="add-comment" data-id="${t.id}">Comentar</button></div></div>
        </aside>
      </div>
    </div></div>`;
  };

  /* ============================== Formulários ============================== */
  const Forms = {};
  const sel = (name, opts, cur) => `<select class="select" name="${name}" id="f-${name}">${opts.map(([v, l]) => `<option value="${e(v)}" ${v === cur ? 'selected' : ''}>${e(l)}</option>`).join('')}</select>`;
  const clientOpts = (withInternal = true) => [...(withInternal ? [['', 'Interno (sem cliente)']] : [['', 'Escolha o cliente…']]), ...Store.clients({ includeClosed: false }).map((c) => [c.id, c.name])];

  Forms.task = (d = {}) => `
    <div class="modal-h"><h2>Nova tarefa</h2><button class="ibtn" style="margin-left:auto" data-modal-close>${I('x')}</button></div>
    <div class="modal-b" id="task-form" data-tags='${e(JSON.stringify(d.tags || []))}'>
      <input class="input" name="title" id="f-title" placeholder="Nome da tarefa" style="font-size:16px;font-weight:600;padding:10px 12px" autofocus>
      <div class="g2">
        <div class="field"><label for="f-clientId">Cliente</label>${sel('clientId', clientOpts(), d.clientId || '')}</div>
        <div class="field"><label for="f-assignee">Responsável</label>${sel('assignee', [['', 'Ninguém'], ...team().map((n) => [n, n])], d.assignee ?? Store.settings.userName)}</div>
      </div>
      <div class="g3">
        <div class="field"><label for="f-status">Status</label>${sel('status', M.STATUSES.map((s) => [s.id, s.label]), d.status || M.STATUSES[0].id)}</div>
        <div class="field"><label for="f-due">Vencimento</label><input class="input" type="date" name="due" id="f-due" value="${e(d.due || '')}"></div>
        <div class="field"><label for="f-priority">Prioridade</label>${sel('priority', M.PRIORITIES.map((p) => [p.id, p.label]), d.priority || 'normal')}</div>
      </div>
      <div class="field"><label for="f-description">Descrição</label><textarea class="textarea" name="description" id="f-description" placeholder="Detalhes da demanda"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn" data-modal-close>Cancelar</button><button class="btn btn-primary" data-action="save-task-form">Criar tarefa</button></div>`;

  Forms.client = () => `
    <div class="modal-h"><h2>Novo cliente</h2><button class="ibtn" style="margin-left:auto" data-modal-close>${I('x')}</button></div>
    <div class="modal-b" id="client-form">
      <div class="g2"><div class="field"><label for="n-name">Nome do cliente</label><input class="input" id="n-name" name="name" placeholder="Ex.: Dra. Ana Souza" autofocus></div>
        <div class="field"><label for="n-niche">O que ele mexe</label><input class="input" id="n-niche" name="niche" placeholder="Ex.: Gestão de passivos"></div></div>
      <div class="g2"><div class="field"><label for="n-meta">Página do Meta</label><input class="input" id="n-meta" name="metaPage" placeholder="https://facebook.com/…"></div>
        <div class="field"><label for="n-ads">Conta de anúncio</label><input class="input" id="n-ads" name="adAccount" placeholder="act_123456789"></div></div>
      <div class="g2"><div class="field"><label for="f-owner">Responsável na agência</label>${sel('owner', [['', '—'], ...team().map((n) => [n, n])], '')}</div>
        <div class="field"><label for="f-status">Status</label>${sel('status', M.CLIENT_STATUSES.map((s) => [s.id, s.label]), 'onboarding')}</div></div>
      <label class="row small"><input type="checkbox" class="check" name="withOnboarding" id="n-onb" checked> Criar tarefa de onboarding com o checklist padrão</label>
    </div>
    <div class="modal-f"><button class="btn" data-modal-close>Cancelar</button><button class="btn btn-primary" data-action="save-client-form">Criar pasta do cliente</button></div>`;

  Forms.log = (l) => `
    <div class="modal-h"><h2>Atualização do diário</h2><button class="ibtn" style="margin-left:auto" data-modal-close>${I('x')}</button></div>
    <div class="modal-b" id="log-form" data-id="${l.id}">
      <div class="g3">
        <div class="field"><label for="l-date">Data</label><input class="input" type="date" id="l-date" name="date" value="${e(l.date)}"></div>
        <div class="field"><label for="f-clientId">Cliente</label>${sel('clientId', clientOpts(false), l.clientId)}</div>
        <div class="field"><label for="f-impact">Resultado</label>${sel('impact', [['neutro', 'Neutro'], ['positivo', 'Bom'], ['negativo', 'Ruim']], l.impact || 'neutro')}</div>
      </div>
      <div class="field"><label for="l-a">Análise</label><textarea class="textarea" id="l-a" name="analysis">${e(l.analysis || [l.title, l.body].filter(Boolean).join('\n'))}</textarea></div>
      <div class="g2">
        <div class="field"><label for="l-p">Ações programadas p/ melhoria</label><textarea class="textarea" id="l-p" name="planned">${e(l.planned || '')}</textarea></div>
        <div class="field"><label for="l-d">Ações realizadas</label><textarea class="textarea" id="l-d" name="actionsDone">${e(l.actionsDone || '')}</textarea></div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-danger" style="margin-right:auto" data-action="delete-log" data-id="${l.id}">${I('trash', 14)}Excluir</button>
      ${l.planned && !l.plannedTaskId ? `<button class="btn" data-action="planned-to-task" data-id="${l.id}">${I('plus', 14)}Virar tarefa</button>` : ''}
      <button class="btn" data-modal-close>Cancelar</button><button class="btn btn-primary" data-action="save-log-form">Salvar</button>
    </div>`;

  window.VS = VS;
  window.Views = { clientPanel, home, tasks: tasksPage, team: teamPage, clients: clientsPage, client: clientPage, diary: diaryPage, settings: settingsPage, taskView, diaryLogs, manualLogs, adsLink };
  window.Forms = Forms;
})();
