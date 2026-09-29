/* Roteador, barra lateral em árvore, eventos, ações e atalhos. */
(function () {
  const e = U.esc;
  const M = window.META;
  const I = C.I;

  const App = { route: { name: 'home', params: {} }, taskId: null, lastRoute: '' };
  VS.sideClosed = VS.sideClosed || [];

  /* ============================== Rotas ============================== */
  const parseRoute = () => {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    switch (p[0]) {
      case 'demandas': return { name: 'tasks', params: { scope: 'all' } };
      case 'criativos': return { name: 'tasks', params: { scope: 'criativos' } };
      case 'interno': return { name: 'tasks', params: { scope: 'interno' } };
      case 'equipe': return { name: 'team', params: {} };
      case 'diario': return { name: 'diary', params: {} };
      case 'clientes': return { name: 'clients', params: {} };
      case 'c': return { name: 'client', params: { id: p[1], tab: p[2] || 'visao' } };
      case 'ajustes': return { name: 'settings', params: {} };
      default: return { name: 'home', params: {} };
    }
  };
  const currentClientId = () => (App.route.name === 'client' ? App.route.params.id : '');
  const scopeOf = () => (App.route.name === 'client' ? 'client' : App.route.params.scope || 'all');

  /* ============================== Barra lateral ============================== */
  const renderSidebar = () => {
    const r = App.route;
    const open = Store.state.tasks.filter((t) => t.status !== 'done' && t.status !== 'daily');
    const late = open.filter((t) => Store.isOverdue(t)).length;
    const nav = (href, icon, label, active, cnt = '', red = false) => `<a class="nav ${active ? 'active' : ''}" href="${href}">${I(icon, 16)}<span class="grow ellipsis">${label}</span>${cnt !== '' ? `<span class="cnt ${red ? 'red' : ''}">${cnt}</span>` : ''}</a>`;
    const clients = Store.clients({ includeClosed: false }).sort((a, b) => a.name.localeCompare(b.name));
    const closed = Store.state.clients.filter((c) => c.status === 'encerrado').length;
    const cOpen = !VS.sideClosed.includes('clientes');
    const criativos = open.filter((t) => (t.tags || []).includes('Produção de criativos')).length;
    const interno = open.filter((t) => !t.clientId && !(t.tags || []).includes('Produção de criativos')).length;
    const ws = Store.settings.workspaceName || 'Agência';
    document.getElementById('sidebar').innerHTML = `
      <div class="ws"><div class="ws-logo">${e(ws.trim()[0] || 'A').toUpperCase()}</div><div class="ws-name ellipsis">${e(ws)}</div></div>
      <div class="side-search" data-action="palette" role="button" tabindex="0">${I('search', 14)}Buscar<kbd>Ctrl K</kbd></div>
      <div class="side-scroll">
        ${nav('#/', 'home', 'Início', r.name === 'home')}
        ${nav('#/demandas', 'tasks', 'Demandas', r.name === 'tasks' && r.params.scope === 'all', late || open.length, !!late)}
        ${nav('#/equipe', 'team', 'Demandas da equipe', r.name === 'team')}
        ${nav('#/diario', 'book', 'Diário de bordo', r.name === 'diary')}
        <div class="side-h"><span>Espaços</span><button data-action="new-client" title="Novo cliente">${I('plus', 14)}</button></div>
        <div class="tree">
          <div class="${cOpen ? 'open' : ''}">
            <a class="nav ${r.name === 'clients' ? 'active' : ''}" href="#/clientes"><span class="caret" data-action="toggle-tree" data-key="clientes">${I('chevR', 12)}</span><span class="space-ic" style="background:#16a34a">C</span><span class="grow">Clientes</span><span class="cnt">${clients.length}</span></a>
            <div class="kids">
              ${clients.map((c) => {
                const active = r.name === 'client' && r.params.id === c.id;
                const isOpen = VS.sideOpen.includes(c.id) || active;
                const n = open.filter((t) => t.clientId === c.id).length;
                return `<div class="${isOpen ? 'open' : ''}">
                  <a class="nav ${active && r.params.tab === 'visao' ? 'active' : ''}" href="#/c/${c.id}" title="${e(c.name)}"><span class="caret" data-action="toggle-tree" data-key="${c.id}">${I('chevR', 12)}</span>${C.folder(c)}<span class="grow ellipsis">${e(c.name)}</span>${n ? `<span class="cnt">${n}</span>` : ''}</a>
                  <div class="kids">
                    <a class="nav ${active && r.params.tab === 'demandas' ? 'active' : ''}" href="#/c/${c.id}/demandas">${I('list', 14)}<span class="grow">Demandas</span></a>
                    <a class="nav ${active && r.params.tab === 'diario' ? 'active' : ''}" href="#/c/${c.id}/diario">${I('book', 14)}<span class="grow">Diário de bordo</span></a>
                  </div></div>`;
              }).join('')}
              ${closed ? `<a class="nav small muted" href="#/clientes" data-action="show-closed">${I('folder', 14)}Encerrados (${closed})</a>` : ''}
            </div>
          </div>
          <a class="nav ${r.params.scope === 'criativos' ? 'active' : ''}" href="#/criativos"><span style="width:16px"></span><span class="space-ic" style="background:#db2777">${I('image', 11)}</span><span class="grow">Produção de criativos</span><span class="cnt">${criativos || ''}</span></a>
          <a class="nav ${r.params.scope === 'interno' ? 'active' : ''}" href="#/interno"><span style="width:16px"></span><span class="space-ic" style="background:#64748b">${I('inbox', 11)}</span><span class="grow">Interno</span><span class="cnt">${interno || ''}</span></a>
        </div>
      </div>
      <div class="side-foot">
        <a class="nav ${r.name === 'settings' ? 'active' : ''}" href="#/ajustes">${I('settings', 16)}Ajustes</a>
        <button class="nav" style="width:auto" data-action="cycle-theme" title="Tema claro/escuro">${I('moon', 16)}</button>
      </div>`;
  };

  /* ============================== Render ============================== */
  const focusKey = (el) => {
    if (!el || el === document.body) return null;
    if (el.id) return '#' + CSS.escape(el.id);
    if (el.dataset && el.dataset.quickadd) return `[data-quickadd='${el.dataset.quickadd}']`;
    return null;
  };
  const keepFocus = (fn) => {
    const a = document.activeElement;
    const key = focusKey(a);
    const sel = a && 'selectionStart' in a ? [a.selectionStart, a.selectionEnd] : null;
    fn();
    if (!key) return;
    let el = null; try { el = document.querySelector(key); } catch (err) { el = null; }
    if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange && sel[0] != null) { try { el.setSelectionRange(sel[0], sel[1]); } catch (err) { /* sem seleção */ } } }
  };
  const pageFor = (r) => {
    switch (r.name) {
      case 'tasks': return Views.tasks(r.params.scope);
      case 'team': return Views.team();
      case 'diary': return Views.diary();
      case 'clients': return Views.clients();
      case 'client': return Views.client(r.params.id, r.params.tab);
      case 'settings': return Views.settings();
      default: return Views.home();
    }
  };

  App.render = () => {
    App.route = parseRoute();
    const changed = location.hash !== App.lastRoute;
    const view = document.getElementById('view');
    const oldScroll = document.getElementById('scroll');
    const pos = oldScroll && !changed ? [oldScroll.scrollTop, oldScroll.scrollLeft] : [0, 0];
    const comp = document.getElementById('composer');
    const draft = comp && !changed ? [...comp.querySelectorAll('[name]')].map((x) => [x.name, x.type === 'checkbox' ? x.checked : x.value]) : null;
    keepFocus(() => {
      const p = pageFor(App.route);
      view.innerHTML = p.head + (p.toolbar || '') + `<div class="scroll" id="scroll">${p.body}</div>`;
      const sc = document.getElementById('scroll'); sc.scrollTop = pos[0]; sc.scrollLeft = pos[1];
      const c2 = document.getElementById('composer');
      if (draft && c2) draft.forEach(([k, v]) => { const f = c2.querySelector(`[name="${k}"]`); if (f) { if (f.type === 'checkbox') f.checked = v; else f.value = v; } });
      renderSidebar();
      document.title = `${view.querySelector('h1')?.textContent.trim() || 'Início'} · ${Store.settings.workspaceName || 'Agência'}`;
    });
    if (changed) { App.lastRoute = location.hash; document.getElementById('app').classList.remove('side-open'); }
  };

  App.renderTask = () => {
    const root = document.getElementById('drawer-root');
    if (!App.taskId || !Store.task(App.taskId)) { root.innerHTML = ''; App.taskId = null; return; }
    const main = root.querySelector('.task-main');
    const act = root.querySelector('.act');
    const pos = main ? main.scrollTop : 0;
    const comment = root.querySelector('#comment-input')?.value || '';
    keepFocus(() => {
      root.innerHTML = Views.taskView(App.taskId);
      const m2 = root.querySelector('.task-main'); if (m2) m2.scrollTop = pos;
      const a2 = root.querySelector('.act'); if (a2) a2.scrollTop = act ? a2.scrollHeight : a2.scrollHeight;
      const ci = root.querySelector('#comment-input'); if (ci) ci.value = comment;
    });
  };
  App.openTask = (id) => { App.taskId = id; App.renderTask(); };
  App.closeTask = () => { App.taskId = null; App.renderTask(); };

  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; App.render(); if (App.taskId) App.renderTask(); }); };

  const applyTheme = () => {
    const t = Store.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  };

  /* ============================== Helpers ============================== */
  const parseDefaults = (el) => { try { return JSON.parse(el?.dataset?.defaults || '{}'); } catch (err) { return {}; } };
  const splitTags = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const setPath = (obj, path, val) => { const k = path.split('.'); let o = obj; k.slice(0, -1).forEach((x) => { if (!o[x] || typeof o[x] !== 'object') o[x] = {}; o = o[x]; }); o[k[k.length - 1]] = val; };
  const NUMERIC = /^(contract\.(fee|budget|payday)|goals\.|investmentCap$)/;

  const openNewTask = (d = {}) => {
    if (d.clientId === undefined && currentClientId()) d.clientId = currentClientId();
    App.pendingPlanned = null;
    UI.modal(Forms.task(d), { wide: true });
  };

  const setStatus = (id, status) => {
    const t = Store.task(id); if (!t || t.status === status) return;
    const was = t.status;
    const spawned = Store.updateTask(id, { status });
    if (status === 'done') {
      UI.toast(spawned ? `Concluída. Próxima repetição em ${U.fmtDate(spawned.due)}` : 'Tarefa concluída', {
        undo: () => {
          if (spawned) Store.removeTask(spawned.id);
          const auto = Store.state.logs.find((l) => l.taskId === id && l.type === 'tarefa' && Date.now() - l.createdAt < 60000);
          if (auto) Store.state.logs = Store.state.logs.filter((l) => l !== auto);
          Store.updateTask(id, { status: was });
        },
      });
    }
  };

  const loadScript = (src, g) => new Promise((res, rej) => {
    if (window[g]) return res();
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('não foi possível carregar o leitor de planilhas'));
    document.head.appendChild(s);
  });
  const parseDiarySheet = (wb) => {
    const out = []; let adAccount = '';
    const n = (v) => U.norm(String(v || '')).trim();
    wb.SheetNames.forEach((name) => {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
      let col = null;
      rows.forEach((row) => {
        row.forEach((v) => { const m = String(v).match(/act=(\d+)/); if (m && !adAccount) adAccount = 'act_' + m[1]; });
        if (!col) {
          const i = row.findIndex((v) => n(v) === 'data');
          if (i >= 0) { col = { date: i }; row.forEach((v, j) => { const x = n(v); if (x.startsWith('analise')) col.a = j; else if (x.includes('programad')) col.p = j; else if (x.includes('realizad')) col.d = j; }); }
          return;
        }
        let d = row[col.date];
        if (typeof d === 'number') { const u = new Date(Math.round((d - 25569) * 864e5)); d = new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()); }
        else if (typeof d === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(d.trim())) { const [dd, mm, yy] = d.trim().split('/').map(Number); d = new Date(yy < 100 ? 2000 + yy : yy, mm - 1, dd); }
        if (!(d instanceof Date) || isNaN(d)) return;
        const g = (k) => (col[k] != null ? String(row[col[k]] || '').trim() : '');
        const x = { date: U.toISO(d), analysis: g('a'), planned: g('p'), actionsDone: g('d') };
        if (!x.analysis && !x.planned && !x.actionsDone) return;
        const t = U.norm(x.analysis + ' ' + x.planned);
        x.impact = /ruim|caida|falho|nao ta tendo|custo alto|elevado|nao gerou/.test(t) ? 'negativo' : /\bok\b|bom|bem|voltando/.test(t) ? 'positivo' : 'neutro';
        out.push(x);
      });
    });
    return { entries: out, adAccount };
  };

  /* ============================== Ações ============================== */
  const Actions = {
    goto: (el) => { location.hash = el.dataset.href; },
    'open-sidebar': () => document.getElementById('app').classList.add('side-open'),
    'close-sidebar': () => document.getElementById('app').classList.remove('side-open'),
    palette: () => Palette.open(),
    'toggle-tree': (el, ev) => {
      ev.preventDefault(); ev.stopPropagation();
      const k = el.dataset.key;
      if (k === 'clientes') VS.sideClosed = VS.sideClosed.includes(k) ? VS.sideClosed.filter((x) => x !== k) : [...VS.sideClosed, k];
      else VS.sideOpen = VS.sideOpen.includes(k) ? VS.sideOpen.filter((x) => x !== k) : [...VS.sideOpen, k];
      VS.save(); renderSidebar();
    },
    'show-closed': () => { VS.clientsStatus = 'encerrado'; VS.save(); App.render(); },
    'cycle-theme': () => { const o = ['auto', 'light', 'dark']; Store.settings.theme = o[(o.indexOf(Store.settings.theme) + 1) % 3]; applyTheme(); Store.save(); },
    'set-theme': (el) => { Store.settings.theme = el.dataset.theme; applyTheme(); Store.save(); },

    /* ---- Tarefas ---- */
    'new-task': (el) => openNewTask(parseDefaults(el)),
    'save-task-form': () => {
      const root = document.getElementById('task-form');
      const d = UI.formData(root);
      if (!d.title) { root.querySelector('[name=title]').focus(); UI.toast('Dê um nome para a tarefa.'); return; }
      let tags = []; try { tags = JSON.parse(root.dataset.tags || '[]'); } catch (err) { tags = []; }
      const t = Store.addTask({ title: d.title, clientId: d.clientId, assignee: d.assignee, status: d.status, due: d.due, priority: d.priority, description: d.description, tags, completedAt: d.status === 'done' ? Date.now() : null });
      if (App.pendingPlanned) { const l = Store.log(App.pendingPlanned); if (l) Store.updateLog(l.id, { plannedTaskId: t.id, editedAt: l.editedAt }); App.pendingPlanned = null; }
      UI.closeModal(); UI.toast('Tarefa criada');
    },
    'open-task': (el) => App.openTask(el.dataset.id),
    'close-task': () => App.closeTask(),
    'close-task-nav': () => App.closeTask(),
    'complete-task': (el) => setStatus(el.dataset.id, 'done'),
    'pick-status': (el) => {
      const t = Store.task(el.dataset.id);
      UI.menu(el, M.STATUSES.map((s) => ({ value: s.id, current: s.id === t.status, html: `${C.sdot(s.id)}<span>${e(s.label)}</span>` })), (v) => setStatus(t.id, v));
    },
    'pick-assignee': (el) => {
      const t = Store.task(el.dataset.id);
      const names = [...new Set([...(Store.settings.team || []), t.assignee].filter(Boolean))];
      UI.menu(el, [...names.map((n) => ({ value: n, current: n === t.assignee, html: `${C.avatar(n)}<span>${e(n)}</span>` })), '-', { value: '', html: `${C.avatar('')}<span>Ninguém</span>` }], (v) => Store.updateTask(t.id, { assignee: v }));
    },
    'pick-prio': (el) => {
      const t = Store.task(el.dataset.id);
      UI.menu(el, M.PRIORITIES.map((p) => ({ value: p.id, current: p.id === t.priority, html: C.prio(p.id) })), (v) => Store.updateTask(t.id, { priority: v }));
    },
    'pick-client': (el) => {
      const t = Store.task(el.dataset.id);
      UI.menu(el, [{ value: '', html: C.clientTag('') }, '-', ...Store.clients({ includeClosed: false }).map((c) => ({ value: c.id, current: c.id === t.clientId, html: C.clientTag(c.id) }))], (v) => Store.updateTask(t.id, { clientId: v }));
    },
    'pick-due': (el) => {
      const t = Store.task(el.dataset.id);
      const T = U.today();
      const nextMon = U.addDays(U.weekStart(T), 7);
      const opts = [['Hoje', T], ['Amanhã', U.addDays(T, 1)], ['Próxima segunda', nextMon], ['Daqui a 1 semana', U.addDays(T, 7)]];
      UI.popover(el, `${opts.map(([l, d]) => `<div class="opt" data-d="${d}">${e(l)}<span class="muted small" style="margin-left:auto">${U.fmtDate(d)}</span></div>`).join('')}<div class="sep"></div>
        <div style="padding:4px 6px"><input type="date" class="input" value="${e(t.due || '')}" aria-label="Data"></div>${t.due ? '<div class="sep"></div><div class="opt" data-d="">Remover data</div>' : ''}`, (pop) => {
        pop.querySelectorAll('[data-d]').forEach((o) => o.addEventListener('click', () => { UI.closePopover(); Store.updateTask(t.id, { due: o.dataset.d }); }));
        pop.querySelector('input').addEventListener('change', (ev) => { UI.closePopover(); Store.updateTask(t.id, { due: ev.target.value }); });
      });
    },
    'toggle-group': (el) => {
      const k = el.dataset.key;
      const key = k.endsWith(':done') ? k : 'x' + k;
      VS.open = VS.open.includes(key) ? VS.open.filter((x) => x !== key) : [...VS.open, key];
      VS.save(); App.render();
    },
    'set-view': (el) => { VS.view[el.dataset.scope] = el.dataset.view; VS.save(); App.render(); },
    'toggle-done-visible': () => { VS.showDone = !VS.showDone; VS.save(); App.render(); },
    'home-mine': (el) => { VS.homeMine = el.dataset.v === '1'; VS.save(); App.render(); },
    'team-person': (el) => { VS.teamPerson = VS.teamPerson === el.dataset.name ? '' : el.dataset.name; VS.save(); App.render(); },
    'duplicate-task': (el) => { const t = Store.duplicateTask(el.dataset.id); UI.toast('Tarefa duplicada'); App.openTask(t.id); },
    'delete-task': (el) => { const t = Store.removeTask(el.dataset.id); App.closeTask(); UI.toast('Tarefa excluída', { undo: () => Store.restoreTask(t) }); },
    'toggle-check': (el) => { const t = Store.task(el.dataset.id); const i = t.checklist.find((x) => x.id === el.dataset.item); i.done = !i.done; Store.save(); },
    'remove-check': (el) => { const t = Store.task(el.dataset.id); t.checklist = t.checklist.filter((x) => x.id !== el.dataset.item); Store.save(); },
    'add-comment': (el) => {
      const inp = document.getElementById('comment-input'); const text = inp.value.trim(); if (!text) return;
      Store.task(el.dataset.id).comments.push({ id: U.uid(), text, at: Date.now(), author: Store.settings.userName });
      inp.value = ''; Store.save();
    },

    /* ---- Clientes ---- */
    'new-client': () => UI.modal(Forms.client(), { wide: true }),
    'save-client-form': () => {
      const root = document.getElementById('client-form');
      const d = UI.formData(root);
      if (!d.name) { root.querySelector('[name=name]').focus(); UI.toast('Informe o nome do cliente.'); return; }
      const { withOnboarding, ...data } = d;
      const c = Store.addClient(data, { withOnboarding });
      UI.closeModal(); UI.toast(`Pasta de ${c.name} criada`);
      location.hash = `#/c/${c.id}`;
    },
    'pick-client-status': (el) => {
      const c = Store.client(el.dataset.id);
      UI.menu(el, M.CLIENT_STATUSES.map((s) => ({ value: s.id, current: s.id === c.status, html: `<span class="st soft" style="--c:${s.color}">${e(s.label)}</span>` })), (v) => Store.updateClient(c.id, { status: v }));
    },

    /* ---- Diário ---- */
    'submit-composer': (el) => {
      const comp = document.getElementById('composer');
      const d = UI.formData(comp);
      const clientId = d.clientId !== undefined ? d.clientId : el.dataset.client;
      if (!clientId) { UI.toast('Escolha o cliente.'); comp.querySelector('[name=clientId]')?.focus(); return; }
      if (!d.analysis && !d.planned && !d.actionsDone) { UI.toast('Preencha a análise ou as ações.'); comp.querySelector('[name=analysis]').focus(); return; }
      const log = Store.addLog({ clientId, type: 'analise', date: d.date || U.today(), analysis: d.analysis, planned: d.planned, actionsDone: d.actionsDone, impact: d.impact });
      if (d.plannedTask && d.planned) {
        const t = Store.addTask({ clientId, title: d.planned.split('\n')[0].slice(0, 140), due: U.addDays(U.today(), 1), priority: 'high', description: `Ação programada no diário de bordo (${U.fmtDate(log.date)}).${d.analysis ? `\nAnálise: ${d.analysis}` : ''}` });
        Store.updateLog(log.id, { plannedTaskId: t.id, editedAt: undefined });
      }
      ['analysis', 'planned', 'actionsDone'].forEach((k) => { comp.querySelector(`[name=${k}]`).value = ''; });
      comp.querySelector('[name=plannedTask]').checked = false;
      comp.querySelector('[name=impact]').value = 'neutro';
      UI.toast('Diário atualizado');
    },
    'edit-log': (el) => UI.modal(Forms.log(Store.log(el.dataset.id)), { wide: true }),
    'save-log-form': () => {
      const root = document.getElementById('log-form');
      const d = UI.formData(root);
      if (!d.clientId) { UI.toast('Escolha o cliente.'); return; }
      Store.updateLog(root.dataset.id, { date: d.date, clientId: d.clientId, impact: d.impact, analysis: d.analysis, planned: d.planned, actionsDone: d.actionsDone, title: '', body: '', type: Store.log(root.dataset.id).type === 'tarefa' ? 'tarefa' : 'analise' });
      UI.closeModal(); UI.toast('Atualização salva');
    },
    'delete-log': (el) => { const l = Store.removeLog(el.dataset.id); UI.closeModal(); UI.toast('Atualização excluída', { undo: () => Store.restoreLog(l) }); },
    'planned-to-task': (el) => {
      const l = Store.log(el.dataset.id);
      UI.closeModal();
      openNewTask({ clientId: l.clientId, due: U.addDays(U.today(), 1), priority: 'high' });
      App.pendingPlanned = l.id;
      const f = document.getElementById('task-form');
      f.querySelector('[name=title]').value = l.planned.split('\n')[0].slice(0, 140);
      f.querySelector('[name=description]').value = `Ação programada no diário de bordo (${U.fmtDate(l.date)}).${l.analysis ? `\nAnálise: ${l.analysis}` : ''}`;
    },
    'diary-tasks': () => { VS.diary.showTasks = !VS.diary.showTasks; VS.save(); App.render(); },
    'copy-diary': async (el) => {
      const cid = el.dataset.scope === 'client' ? currentClientId() : '';
      const logs = Views.diaryLogs(cid).slice().reverse();
      if (!logs.length) { UI.toast('Nada para copiar.'); return; }
      const title = cid ? `Diário de bordo — ${Store.client(cid).name}` : 'Diário de bordo';
      const txt = `*${title}*\n` + logs.map((l) => {
        const c = cid ? '' : ` — ${Store.client(l.clientId)?.name || ''}`;
        return `\n*${U.fmtDate(l.date, true)}*${c}\n` + [l.analysis || l.title ? `Análise: ${l.analysis || l.title}` : '', l.planned ? `Ações programadas: ${l.planned}` : '', l.actionsDone ? `Ações realizadas: ${l.actionsDone}` : ''].filter(Boolean).join('\n');
      }).join('\n');
      if (await U.copy(txt)) UI.toast(`${logs.length} atualizações copiadas`);
    },

    /* ---- Ajustes ---- */
    'export-json': () => U.download(`backup-${U.today()}.json`, Store.exportJSON(), 'application/json'),
    'export-csv': () => {
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = [['Tarefa', 'Cliente', 'Status', 'Prioridade', 'Responsável', 'Vencimento', 'Etiquetas', 'Descrição']];
      Store.sortTasks(Store.state.tasks).forEach((t) => rows.push([t.title, Store.client(t.clientId)?.name || 'Interno', M.status[t.status]?.label, M.priority[t.priority]?.label, t.assignee, t.due, t.tags.join(', '), t.description]));
      U.download(`tarefas-${U.today()}.csv`, '﻿' + rows.map((r) => r.map(q).join(';')).join('\n'), 'text/csv');
    },
    'reset-all': async () => {
      if (await UI.confirm('Apagar todos os clientes, tarefas e o diário deste navegador? Exporte um backup antes.', { title: 'Apagar tudo', ok: 'Apagar tudo', danger: true })) { Store.reset(false); location.hash = '#/'; }
    },
  };

  /* ============================== Mudanças ============================== */
  const Changes = {
    vs: (el) => { VS[el.dataset.field] = el.value; VS.save(); App.render(); },
    'group-by': (el) => { VS.groupBy[el.dataset.scope] = el.value; VS.save(); App.render(); },
    'clients-status': (el) => { VS.clientsStatus = el.value; VS.save(); App.render(); },
    diary: (el) => { VS.diary[el.dataset.field] = el.value; VS.save(); App.render(); },
    'client-field': (el) => {
      const c = Store.client(el.dataset.id); if (!c) return;
      const path = el.dataset.field;
      const val = NUMERIC.test(path) ? U.num(el.value) : el.value.trim();
      if (path === 'name' && !val) { UI.toast('O nome não pode ficar vazio.'); App.render(); return; }
      setPath(c, path, val); Store.save();
    },
    'task-field': (el) => {
      const f = el.dataset.field;
      if (f === 'title' && !el.value.trim()) { App.renderTask(); return; }
      Store.updateTask(el.dataset.id, { [f]: f === 'title' ? el.value.trim() : el.value });
    },
    'task-tags': (el) => Store.updateTask(el.dataset.id, { tags: splitTags(el.value) }),
    setting: (el) => {
      const f = el.dataset.field; let v = el.value.trim();
      if (f === 'staleDays') v = Math.max(1, Number(v) || 3);
      if (f === 'userName') {
        v = v || 'Você';
        const old = Store.settings.userName;
        Store.settings.team = (Store.settings.team || []).map((n) => (n === old ? v : n));
        if (!Store.settings.team.includes(v)) Store.settings.team.unshift(v);
        Store.state.tasks.forEach((t) => { if (t.assignee === old) t.assignee = v; });
      }
      Store.settings[f] = v; Store.save(); UI.toast('Salvo');
    },
    'setting-team': (el) => {
      const t = el.value.split('\n').map((x) => x.trim()).filter(Boolean);
      if (!t.includes(Store.settings.userName)) t.unshift(Store.settings.userName);
      Store.settings.team = [...new Set(t)]; Store.save(); UI.toast('Equipe salva');
    },
    'import-json': (el) => {
      const file = el.files[0]; el.value = ''; if (!file) return;
      const r = new FileReader();
      r.onload = async () => {
        if (!(await UI.confirm('Importar este backup substitui todos os dados atuais. Continuar?', { title: 'Importar backup', ok: 'Importar', danger: true }))) return;
        try { Store.importJSON(r.result); applyTheme(); UI.toast('Backup importado'); location.hash = '#/'; } catch (err) { UI.toast('Arquivo inválido: ' + err.message); }
      };
      r.readAsText(file);
    },
    'import-diary-xlsx': async (el) => {
      const file = el.files[0]; el.value = ''; if (!file) return;
      const cid = currentClientId(); const c = Store.client(cid); if (!c) return;
      try {
        await loadScript('assets/vendor/xlsx.full.min.js', 'XLSX').catch(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX'));
        const { entries, adAccount } = parseDiarySheet(XLSX.read(await file.arrayBuffer()));
        if (!entries.length) { UI.toast('Não encontrei linhas com Data e Análise na planilha.'); return; }
        const have = new Set(Store.logs({ clientId: cid }).map((l) => l.date + '|' + (l.analysis || '').trim()));
        const fresh = entries.filter((x) => !have.has(x.date + '|' + x.analysis));
        if (!(await UI.confirm(`Importar ${fresh.length} atualização(ões) para o diário de ${c.name}?${entries.length - fresh.length ? ` ${entries.length - fresh.length} já existiam e serão ignoradas.` : ''}`, { title: 'Importar planilha', ok: 'Importar' }))) return;
        fresh.forEach((x) => Store.addLog({ clientId: cid, type: 'analise', time: '', author: '', ...x }, { silent: true }));
        if (adAccount && !c.adAccount) c.adAccount = adAccount;
        Store.save(); UI.toast(`${fresh.length} atualizações importadas`);
      } catch (err) { UI.toast('Não foi possível ler a planilha: ' + err.message); }
    },
  };

  const later = U.debounce(() => App.render(), 180);
  const Inputs = {
    q: (el) => { VS.q = el.value; VS.save(); later(); },
    'clients-q': (el) => { VS.clientsQ = el.value; VS.save(); later(); },
    'diary-q': (el) => { VS.diary.q = el.value; VS.save(); later(); },
  };

  /* ============================== Busca (Ctrl+K) ============================== */
  const Palette = {
    items: [], sel: 0,
    open() {
      UI.modal('<input id="pal-in" placeholder="Buscar clientes e tarefas…" autocomplete="off"><div class="list" id="pal-list"></div>', { className: 'palette' });
      const inp = document.getElementById('pal-in');
      inp.addEventListener('input', () => { Palette.sel = 0; Palette.update(inp.value); });
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowDown') { ev.preventDefault(); Palette.sel = Math.min(Palette.items.length - 1, Palette.sel + 1); Palette.paint(); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); Palette.sel = Math.max(0, Palette.sel - 1); Palette.paint(); }
        else if (ev.key === 'Enter') { ev.preventDefault(); Palette.run(Palette.sel); }
      });
      Palette.update('');
    },
    update(q) {
      const cl = Store.clients().filter((c) => !q || U.match([c.name, c.niche].join(' '), q)).slice(0, q ? 8 : 6);
      let items = cl.map((c) => ({ g: 'Clientes', ico: C.folder(c), label: c.name, sub: c.niche, run: () => { location.hash = `#/c/${c.id}`; } }));
      if (q) items = items.concat(Store.sortTasks(Store.tasks({ q })).slice(0, 10).map((t) => ({ g: 'Tarefas', ico: C.sdot(t.status), label: t.title, sub: Store.client(t.clientId)?.name || 'Interno', run: () => App.openTask(t.id) })));
      else items = [{ g: 'Ações', ico: I('plus', 14), label: 'Nova tarefa', run: () => openNewTask({}) }, { g: 'Ações', ico: I('folder', 14), label: 'Novo cliente', run: () => Actions['new-client']() }, ...items];
      Palette.items = items; Palette.paint();
    },
    paint() {
      const list = document.getElementById('pal-list'); if (!list) return;
      let g = '', h = '';
      Palette.items.forEach((it, i) => { if (it.g !== g) { h += `<div class="g">${e(it.g)}</div>`; g = it.g; } h += `<div class="it ${i === Palette.sel ? 'sel' : ''}" data-pi="${i}">${it.ico}<span class="ellipsis">${e(it.label)}</span>${it.sub ? `<span class="sub ellipsis">${e(it.sub)}</span>` : ''}</div>`; });
      list.innerHTML = h || '<div class="empty">Nada encontrado</div>';
      list.querySelectorAll('[data-pi]').forEach((n) => n.addEventListener('click', () => Palette.run(Number(n.dataset.pi))));
    },
    run(i) { const it = Palette.items[i]; if (!it) return; UI.closeModal(); it.run(); },
  };

  /* ============================== Eventos ============================== */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const inner = ev.target.closest('select, input, textarea, label, a[href]');
    if (inner && inner !== el && el.contains(inner) && !inner.dataset.action) return;
    const fn = Actions[el.dataset.action];
    if (!fn) return;
    if (el.tagName === 'A' && el.getAttribute('href') === 'javascript:void 0') ev.preventDefault();
    fn(el, ev);
  });
  document.addEventListener('change', (ev) => { const el = ev.target.closest('[data-change]'); if (el && Changes[el.dataset.change]) Changes[el.dataset.change](el, ev); });
  document.addEventListener('input', (ev) => { const el = ev.target.closest('[data-input]'); if (el && Inputs[el.dataset.input]) Inputs[el.dataset.input](el, ev); });

  const typing = (el) => el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
  document.addEventListener('keydown', (ev) => {
    const t = ev.target; const mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key.toLowerCase() === 'k') { ev.preventDefault(); if (document.getElementById('pal-in')) UI.closeModal(); else Palette.open(); return; }
    if (ev.key === 'Escape') {
      if (UI._pop) { UI.closePopover(); return; }
      if (UI.closeModal()) return;
      if (App.taskId) { App.closeTask(); return; }
      document.getElementById('app').classList.remove('side-open');
      return;
    }
    if (t.dataset && t.dataset.quickadd !== undefined && ev.key === 'Enter') {
      ev.preventDefault(); const title = t.value.trim(); if (!title) return;
      let d = {}; try { d = JSON.parse(t.dataset.quickadd); } catch (err) { d = {}; }
      if (d.assignee === undefined) d.assignee = Store.settings.userName;
      Store.addTask({ title, ...d, completedAt: d.status === 'done' ? Date.now() : null });
      return;
    }
    if (t.dataset && t.dataset.enter === 'add-check' && ev.key === 'Enter') {
      ev.preventDefault(); const v = t.value.trim(); if (!v) return;
      Store.task(t.dataset.id).checklist.push({ id: U.uid(), text: v, done: false }); t.value = ''; Store.save(); return;
    }
    if (t.id === 't-title' && ev.key === 'Enter') { ev.preventDefault(); t.blur(); return; }
    if (t.dataset && t.dataset.enterCtrl && ev.key === 'Enter' && mod) { ev.preventDefault(); Actions[t.dataset.enterCtrl](t); return; }
    if (t.closest && t.closest('#composer') && ev.key === 'Enter' && mod) { ev.preventDefault(); document.querySelector('[data-action="submit-composer"]').click(); return; }
    const modal = t.closest && t.closest('.modal');
    if (modal && ev.key === 'Enter' && (mod || (t.tagName === 'INPUT' && t.type !== 'checkbox' && t.id !== 'pal-in'))) {
      const btn = modal.querySelector('.modal-f .btn-primary[data-action]'); if (btn) { ev.preventDefault(); btn.click(); } return;
    }
    if (typing(t) || mod || ev.altKey || UI.isModalOpen()) return;
    if (ev.key.toLowerCase() === 'n') { ev.preventDefault(); openNewTask({}); }
  });

  /* ---------- Arrastar e soltar ---------- */
  document.addEventListener('dragstart', (ev) => { const c = ev.target.closest && ev.target.closest('[data-drag-task]'); if (!c) return; ev.dataTransfer.setData('text/plain', c.dataset.dragTask); c.classList.add('dragging'); });
  document.addEventListener('dragend', (ev) => { ev.target.classList && ev.target.classList.remove('dragging'); document.querySelectorAll('.over').forEach((n) => n.classList.remove('over')); });
  document.addEventListener('dragover', (ev) => {
    const z = ev.target.closest && ev.target.closest('[data-drop-status], [data-drop-assignee]'); if (!z) return;
    ev.preventDefault(); document.querySelectorAll('.over').forEach((n) => n !== z && n.classList.remove('over')); z.classList.add('over');
  });
  document.addEventListener('drop', (ev) => {
    const z = ev.target.closest && ev.target.closest('[data-drop-status], [data-drop-assignee]'); if (!z) return;
    ev.preventDefault(); z.classList.remove('over');
    const id = ev.dataTransfer.getData('text/plain'); const t = Store.task(id); if (!t) return;
    if (z.dataset.dropStatus !== undefined) setStatus(id, z.dataset.dropStatus);
    else if (z.dataset.dropAssignee !== t.assignee) { Store.updateTask(id, { assignee: z.dataset.dropAssignee }); UI.toast(`Demanda passada para ${z.dataset.dropAssignee || 'ninguém'}`); }
  });

  /* ============================== Início ============================== */
  Store.load();
  applyTheme();
  Store.onChange(schedule);
  window.addEventListener('hashchange', () => { UI.closeModal(); UI.closePopover(); App.render(); });
  App.render();
  window.App = App;
})();
