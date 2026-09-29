/* Roteador, barra lateral, eventos, ações e atalhos. */
(function () {
  const e = U.esc;
  const M = window.META;

  const App = {
    route: { name: 'dashboard', params: {} },
    drawerId: null,
    lastRouteKey: '',
  };

  /* ============================== Roteamento ============================== */
  const parseRoute = () => {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    switch (parts[0]) {
      case 'tarefas': return { name: 'tasks', params: {} };
      case 'clientes': return { name: 'clients', params: {} };
      case 'cliente': return { name: 'client', params: { id: parts[1], tab: parts[2] || 'visao' } };
      case 'diario': return { name: 'journal', params: {} };
      case 'calendario': return { name: 'calendar', params: {} };
      case 'config': return { name: 'settings', params: {} };
      default: return { name: 'dashboard', params: {} };
    }
  };
  const currentClientId = () => (App.route.name === 'client' ? App.route.params.id : '');

  /* ============================== Render ============================== */
  const focusKey = (el) => {
    if (!el || el === document.body) return null;
    if (el.id) return '#' + CSS.escape(el.id);
    const d = el.dataset || {};
    if (d.field && d.id) return `[data-field="${d.field}"][data-id="${d.id}"]`;
    if (d.field && d.scope) return `[data-field="${d.field}"][data-scope="${d.scope}"]`;
    if (d.enter) return `[data-enter="${d.enter}"]`;
    if (d.quickadd) return `[data-quickadd='${d.quickadd}']`;
    return null;
  };
  const withFocusKept = (fn) => {
    const a = document.activeElement;
    const key = focusKey(a);
    const sel = a && 'selectionStart' in a ? [a.selectionStart, a.selectionEnd] : null;
    fn();
    if (!key) return;
    let el = null; try { el = document.querySelector(key); } catch (err) { el = null; }
    if (el && el !== document.activeElement) {
      el.focus({ preventScroll: true });
      if (sel && el.setSelectionRange && sel[0] != null) { try { el.setSelectionRange(sel[0], sel[1]); } catch (err) { /* type sem seleção */ } }
    }
  };

  const renderSidebar = () => {
    const r = App.route;
    const open = Store.tasks({ open: true });
    const overdue = open.filter((t) => Store.isOverdue(t)).length;
    const clients = Store.clients({ includeClosed: false });
    const closed = Store.state.clients.filter((c) => c.status === 'encerrado').length;
    const nav = (href, ico, label, active, count = '', bad = false) =>
      `<a class="nav-item ${active ? 'active' : ''}" href="${href}"><span class="ico">${ico}</span>${label}${count !== '' ? `<span class="count ${bad ? 'bad' : ''}">${count}</span>` : ''}</a>`;
    document.getElementById('sidebar').innerHTML = `
      <div class="brand"><div class="brand-logo">B</div><div><div class="brand-name">Bordo</div><div class="brand-sub">clientes · tarefas · diário</div></div></div>
      <div class="side-scroll">
        ${nav('#/', '🏠', 'Início', r.name === 'dashboard')}
        ${nav('#/tarefas', '✅', 'Tarefas', r.name === 'tasks', overdue || open.length, !!overdue)}
        ${nav('#/diario', '📓', 'Diário de bordo', r.name === 'journal')}
        ${nav('#/calendario', '📅', 'Calendário', r.name === 'calendar')}
        ${nav('#/clientes', '👥', 'Todos os clientes', r.name === 'clients', Store.state.clients.length)}
        <div class="side-section"><span>Pastas de clientes</span><button data-action="new-client" title="Novo cliente (C)">＋</button></div>
        ${clients.map((c) => {
          const h = Store.health(c);
          const n = Store.tasks({ clientId: c.id, open: true }).length;
          return `<a class="nav-item side-client ${r.name === 'client' && r.params.id === c.id ? 'active' : ''}" href="#/cliente/${c.id}" title="${e(c.name)} — saúde ${h.score ?? '—'}">
            <span class="dot" style="background:${e(c.color)}"></span><span class="ellipsis grow">${e(c.name)}</span>
            ${n ? `<span class="muted small">${n}</span>` : ''}<span class="health-dot" style="background:${C.healthColor(h)}"></span></a>`;
        }).join('') || '<div class="muted small" style="padding:6px 10px">Nenhum cliente ainda.</div>'}
        ${closed ? `<a class="nav-item small muted" href="#/clientes" data-action="show-closed">🗄️ ${closed} encerrado(s)</a>` : ''}
      </div>
      <div class="side-footer">
        <a class="nav-item ${r.name === 'settings' ? 'active' : ''}" href="#/config" title="Configurações">⚙️ Ajustes</a>
        <button class="nav-item" data-action="cycle-theme" title="Alternar tema">${Store.settings.theme === 'dark' ? '🌙' : Store.settings.theme === 'light' ? '☀️' : '🖥️'} Tema</button>
      </div>`;
  };

  const viewFor = (r) => {
    switch (r.name) {
      case 'tasks': return Views.tasks();
      case 'clients': return Views.clients();
      case 'client': return Views.client(r.params.id, r.params.tab);
      case 'journal': return Views.journal();
      case 'calendar': return Views.calendar();
      case 'settings': return Views.settings();
      default: return Views.dashboard();
    }
  };

  App.render = () => {
    App.route = parseRoute();
    const key = location.hash;
    const routeChanged = key !== App.lastRouteKey;
    const viewEl = document.getElementById('view');
    // Preserva o que está sendo digitado no compositor do diário
    const comp = document.getElementById('composer');
    const draft = comp && !routeChanged ? {
      values: Object.fromEntries([...comp.querySelectorAll('[name]')].map((x) => [x.name, x.value])),
      extra: !comp.querySelector('#composer-extra').classList.contains('hidden'),
    } : null;
    withFocusKept(() => {
      const v = viewFor(App.route);
      viewEl.innerHTML = v.html;
      document.getElementById('crumbs').innerHTML = v.crumbs;
      document.title = `${v.title} · Bordo`;
      renderSidebar();
      if (draft) {
        const c2 = document.getElementById('composer');
        if (c2) {
          Object.entries(draft.values).forEach(([k, val]) => { const f = c2.querySelector(`[name="${k}"]`); if (f && k !== 'type') f.value = val; });
          if (draft.extra) c2.querySelector('#composer-extra').classList.remove('hidden');
        }
      }
    });
    if (routeChanged) {
      App.lastRouteKey = key;
      window.scrollTo(0, 0);
      document.getElementById('app').classList.remove('side-open');
    }
  };

  App.renderDrawer = () => {
    const root = document.getElementById('drawer-root');
    if (!App.drawerId || !Store.task(App.drawerId)) { root.innerHTML = ''; App.drawerId = null; return; }
    const body = root.querySelector('.drawer-body');
    const scroll = body ? body.scrollTop : 0;
    const comment = root.querySelector('#comment-input')?.value || '';
    withFocusKept(() => {
      root.innerHTML = Views.taskDrawer(App.drawerId);
      const b2 = root.querySelector('.drawer-body'); if (b2) b2.scrollTop = scroll;
      const ci = root.querySelector('#comment-input'); if (ci) ci.value = comment;
    });
  };

  App.openTask = (id) => {
    const isNew = App.drawerId !== id;
    App.drawerId = id;
    App.renderDrawer();
    if (isNew) document.querySelector('#drawer-root .drawer-body')?.scrollTo(0, 0);
  };
  App.closeDrawer = () => { App.drawerId = null; App.renderDrawer(); };

  let scheduled = false;
  const scheduleRender = () => {
    if (scheduled) return; scheduled = true;
    requestAnimationFrame(() => { scheduled = false; App.render(); if (App.drawerId) App.renderDrawer(); });
  };

  const applyTheme = () => {
    const t = Store.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  };

  /* ============================== Helpers de ação ============================== */
  const parseDefaults = (el) => { try { return JSON.parse(el?.dataset?.defaults || '{}'); } catch (err) { return {}; } };
  const splitTags = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const setPath = (obj, path, val) => {
    const keys = path.split('.'); let o = obj;
    keys.slice(0, -1).forEach((k) => { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; o = o[k]; });
    o[keys[keys.length - 1]] = val;
  };
  const NUMERIC_PATHS = /^(contract\.(fee|budget|payday)|goals\.|investmentCap$)/;

  const openNewTask = (defaults = {}) => {
    App.pendingPlannedLog = null;
    if (defaults.clientId === undefined && currentClientId()) defaults.clientId = currentClientId();
    UI.modal(Forms.task(defaults), { wide: true });
  };
  const openNewLog = (defaults = {}) => {
    App.pendingLogTask = defaults.taskId || null;
    if (!defaults.clientId && currentClientId()) defaults.clientId = currentClientId();
    if (!Store.state.clients.length) { UI.toast('Cadastre um cliente primeiro.'); openClientForm(); return; }
    UI.modal(Forms.log(null, defaults), { wide: true });
  };
  const openClientForm = (c) => UI.modal(Forms.client(c), { wide: true });

  const toggleDone = (id) => {
    const t = Store.task(id); if (!t) return;
    const was = t.status;
    if (t.status === 'done') {
      Store.updateTask(id, { status: 'todo' });
      UI.toast('Tarefa reaberta');
    } else {
      const spawned = Store.updateTask(id, { status: 'done' });
      const msg = spawned ? `Concluída! Próxima repetição em ${U.fmtDate(spawned.due)}` : 'Tarefa concluída ✓';
      UI.toast(msg, {
        undo: () => {
          if (spawned) Store.removeTask(spawned.id);
          const tt = Store.task(id); if (!tt) return;
          if (spawned) tt.recurrence = spawned.recurrence;
          // remove registro automático gerado
          const auto = Store.state.logs.find((l) => l.taskId === id && l.auto && l.type === 'tarefa' && Date.now() - l.createdAt < 60000);
          if (auto) Store.state.logs = Store.state.logs.filter((l) => l !== auto);
          Store.updateTask(id, { status: was });
        },
      });
    }
  };

  const journalText = (logs, title, markdown) => {
    const bold = (s) => (markdown ? `**${s}**` : `*${s}*`);
    let out = `${markdown ? '# ' + title : bold(title)}\n\n`;
    let lastDate = '';
    logs.slice().reverse().forEach((l) => {
      if (l.date !== lastDate) { out += `\n${markdown ? '## ' : ''}${bold(U.fmtDayLabel(l.date))}${markdown ? '' : ''}\n`; lastDate = l.date; }
      const tp = M.logType[l.type] || M.logType.nota;
      const c = Store.client(l.clientId);
      out += `${markdown ? '- ' : ''}${tp.icon} ${l.title || tp.label}${c && title.indexOf(c.name) === -1 ? ` (${c.name})` : ''}\n`;
      const ind = (txt, label) => { if (txt) out += txt.split('\n').map((x, i) => (markdown ? '  ' : '   ') + (i === 0 && label ? label + ': ' : '') + x).join('\n') + '\n'; };
      ind(l.analysis, 'Análise'); ind(l.planned, 'Ações programadas'); ind(l.actionsDone, 'Ações realizadas'); ind(l.body);
    });
    return out.trim();
  };

  const currentJournal = (scope) => {
    const logs = scope === 'all' ? Views.journalLogs('all') : Views.journalLogs('client', currentClientId());
    const c = Store.client(currentClientId());
    const title = scope === 'all' ? 'Diário de bordo' : `Diário de bordo — ${c ? c.name : ''}`;
    return { logs, title };
  };

  const loadScript = (src, globalName) => new Promise((resolve, reject) => {
    if (window[globalName]) return resolve();
    const sc = document.createElement('script'); sc.src = src; sc.onload = resolve; sc.onerror = () => reject(new Error('sem conexão para carregar o leitor de planilhas'));
    document.head.appendChild(sc);
  });

  /** Lê uma planilha no formato do diário de bordo (Data | Análise | Ações programadas | Ações realizadas). */
  const parseDiarySheet = (wb) => {
    const entries = []; let adAccount = '';
    const norm = (v) => U.norm(String(v || '')).trim();
    wb.SheetNames.forEach((name) => {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
      let col = null;
      rows.forEach((row) => {
        row.forEach((v) => { const m = String(v).match(/act=(\d+)/); if (m && !adAccount) adAccount = 'act_' + m[1]; });
        if (!col) {
          const i = row.findIndex((v) => norm(v) === 'data');
          if (i >= 0) {
            col = { date: i };
            row.forEach((v, j) => { const n = norm(v); if (n.startsWith('analise')) col.analysis = j; else if (n.includes('programad')) col.planned = j; else if (n.includes('realizad')) col.done = j; });
          }
          return;
        }
        let d = row[col.date];
        if (typeof d === 'number') { const u = new Date(Math.round((d - 25569) * 864e5)); d = new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()); }
        else if (typeof d === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(d.trim())) { const [dd, mm, yy] = d.trim().split('/').map(Number); d = new Date(yy < 100 ? 2000 + yy : yy, mm - 1, dd); }
        if (!(d instanceof Date) || isNaN(d)) return;
        const g = (k) => (col[k] != null ? String(row[col[k]] || '').trim() : '');
        const x = { date: U.toISO(d), analysis: g('analysis'), planned: g('planned'), actionsDone: g('done') };
        if (!x.analysis && !x.planned && !x.actionsDone) return;
        const t = U.norm(x.analysis + ' ' + x.planned);
        x.impact = /ruim|caida|falho|nao ta tendo|custo alto|elevado|nao gerou/.test(t) ? 'negativo' : /\bok\b|bom|bem|voltando/.test(t) ? 'positivo' : 'neutro';
        entries.push(x);
      });
    });
    return { entries, adAccount };
  };

  /* ============================== Ações (cliques) ============================== */
  const Actions = {
    goto: (el) => { location.hash = el.dataset.href; },
    'open-sidebar': () => document.getElementById('app').classList.add('side-open'),
    'close-sidebar': () => document.getElementById('app').classList.remove('side-open'),
    'show-closed': () => { VS.clientsFilter.status = 'encerrado'; VS.save(); App.render(); },
    palette: () => Palette.open(),
    'cycle-theme': () => {
      const order = ['auto', 'light', 'dark'];
      Store.settings.theme = order[(order.indexOf(Store.settings.theme) + 1) % 3];
      applyTheme(); Store.save();
    },
    'set-theme': (el) => { Store.settings.theme = el.dataset.theme; applyTheme(); Store.save(); },
    'close-banner': () => { VS.bannerClosed = true; VS.save(); App.render(); },
    'start-fresh': async () => {
      if (await UI.confirm('Isso apaga os dados de exemplo e deixa o Bordo vazio para seus clientes reais.', { title: 'Começar do zero', ok: 'Começar do zero', danger: true })) {
        Store.reset(false); UI.toast('Tudo limpo! Cadastre seu primeiro cliente.'); location.hash = '#/clientes';
      }
    },

    /* ---- Tarefas ---- */
    'new-task': (el) => openNewTask(parseDefaults(el)),
    'save-task-form': () => {
      const root = document.getElementById('task-form');
      const d = UI.formData(root);
      if (!d.title) { root.querySelector('[name=title]').focus(); UI.toast('Dê um nome para a tarefa.'); return; }
      const t = Store.addTask({
        title: d.title, clientId: d.clientId, due: d.due, status: d.status, priority: d.priority, assignee: d.assignee,
        recurrence: d.recurrence, tags: splitTags(d.tags), description: d.description,
        checklist: d.checklist.split('\n').map((x) => x.trim()).filter(Boolean).map((text) => ({ id: U.uid(), text, done: false })),
        completedAt: d.status === 'done' ? Date.now() : null,
      });
      if (App.pendingPlannedLog) { const pl = Store.log(App.pendingPlannedLog); if (pl) Store.updateLog(pl.id, { plannedTaskId: t.id, editedAt: pl.editedAt }); App.pendingPlannedLog = null; }
      UI.closeModal();
      UI.toast('Tarefa criada');
      if (d.openAfter) App.openTask(t.id);
    },
    'open-task': (el) => App.openTask(el.dataset.id),
    'close-drawer': () => App.closeDrawer(),
    'close-drawer-nav': () => App.closeDrawer(),
    'toggle-done': (el) => toggleDone(el.dataset.id),
    'toggle-group': (el) => {
      const k = el.dataset.key;
      const key = k.endsWith(':done') ? 'open:' + k : k;
      VS.collapsed = VS.collapsed.includes(key) ? VS.collapsed.filter((x) => x !== key) : [...VS.collapsed, key];
      VS.save(); App.render();
    },
    'task-view': (el) => { if (el.dataset.scope === 'client') VS.clientTaskView = el.dataset.view; else VS.taskView = el.dataset.view; VS.save(); App.render(); },
    'duplicate-task': (el) => { const t = Store.duplicateTask(el.dataset.id); UI.toast('Tarefa duplicada'); App.openTask(t.id); },
    'delete-task': (el) => {
      const t = Store.removeTask(el.dataset.id);
      App.closeDrawer();
      UI.toast('Tarefa excluída', { undo: () => Store.restoreTask(t) });
    },
    'quick-due': (el) => Store.updateTask(el.dataset.id, { due: U.addDays(U.today(), Number(el.dataset.days)) }),
    'add-time': (el) => {
      const t = Store.task(el.dataset.id); const m = Number(el.dataset.min);
      t.activity.push({ at: Date.now(), text: m > 0 ? `+${U.fmtMinutes(m)} de trabalho registrados` : 'Tempo zerado' });
      Store.updateTask(t.id, { timeSpent: Math.max(0, (t.timeSpent || 0) + m) }, { log: false });
    },
    'toggle-check': (el) => {
      const t = Store.task(el.dataset.id); const i = t.checklist.find((x) => x.id === el.dataset.item);
      i.done = !i.done;
      if (i.done) t.activity.push({ at: Date.now(), text: `Checklist: "${i.text}" concluído` });
      Store.save();
      if (t.checklist.length && t.checklist.every((x) => x.done) && t.status !== 'done') {
        UI.toast('Checklist completo! Concluir a tarefa?', { undo: () => toggleDone(t.id), undoLabel: 'Concluir', duration: 6000 });
      }
    },
    'remove-check': (el) => { const t = Store.task(el.dataset.id); t.checklist = t.checklist.filter((x) => x.id !== el.dataset.item); Store.save(); },
    'check-to-task': (el) => {
      const t = Store.task(el.dataset.id); const i = t.checklist.find((x) => x.id === el.dataset.item);
      Store.addTask({ title: i.text, clientId: t.clientId, assignee: t.assignee, priority: t.priority, due: t.due, description: `Criada a partir do checklist de "${t.title}"` });
      t.checklist = t.checklist.filter((x) => x.id !== i.id); Store.save();
      UI.toast('Item transformado em tarefa');
    },
    'add-comment': (el) => {
      const input = document.getElementById('comment-input'); const text = input.value.trim(); if (!text) return;
      const t = Store.task(el.dataset.id);
      t.comments.push({ id: U.uid(), text, at: Date.now(), author: Store.settings.userName });
      input.value = '';
      Store.save();
    },
    'task-to-log': (el) => {
      const t = Store.task(el.dataset.id);
      openNewLog({ clientId: t.clientId, taskId: t.id, title: t.title, type: 'otimizacao' });
    },

    /* ---- Clientes ---- */
    'new-client': () => openClientForm(),
    'edit-client': (el) => openClientForm(Store.client(el.dataset.id)),
    'save-client-form': () => {
      const root = document.getElementById('client-form');
      const d = UI.formData(root);
      if (!d.name) { root.querySelector('[name=name]').focus(); UI.toast('Informe o nome do cliente.'); return; }
      const data = {};
      Object.entries(d).forEach(([k, v]) => { if (k !== 'withOnboarding') setPath(data, k, NUMERIC_PATHS.test(k) ? U.num(v) : v); });
      const id = root.dataset.id;
      if (id) {
        const c = Store.client(id);
        Store.updateClient(id, { ...data, contact: { ...c.contact, ...data.contact }, contract: { ...c.contract, ...data.contract }, goals: { ...c.goals, ...data.goals } });
        UI.closeModal(); UI.toast('Cliente atualizado');
      } else {
        const c = Store.addClient(data, { withOnboarding: d.withOnboarding });
        UI.closeModal(); UI.toast(`Pasta de ${c.name} criada`);
        location.hash = `#/cliente/${c.id}`;
      }
    },
    'pin-client': (el) => { const c = Store.client(el.dataset.id); Store.updateClient(c.id, { pinned: !c.pinned }); },
    'delete-client': async (el) => {
      const c = Store.client(el.dataset.id);
      const ok = await UI.confirm(`Excluir "${c.name}" e todas as suas tarefas, registros do diário e métricas? Dica: você pode marcar como "Encerrado" em vez de excluir.`, { title: 'Excluir cliente', ok: 'Excluir', danger: true });
      if (!ok) return;
      const snap = Store.removeClient(c.id);
      location.hash = '#/clientes';
      UI.toast('Cliente excluído', { undo: () => Store.restoreClient(snap), duration: 8000 });
    },
    'client-color': (el) => Store.updateClient(el.dataset.id, { color: el.dataset.color }),
    'add-link': (el) => {
      const box = document.getElementById(el.dataset.kind === 'links' ? 'add-link' : 'add-access');
      const d = UI.formData(box);
      const c = Store.client(el.dataset.id);
      if (el.dataset.kind === 'links') {
        if (!d.url) { UI.toast('Informe a URL.'); return; }
        const url = /^https?:\/\//i.test(d.url) ? d.url : 'https://' + d.url;
        Store.updateClient(c.id, { links: [...(c.links || []), { label: d.label || url, url }] });
      } else {
        if (!d.value) { UI.toast('Informe o valor.'); return; }
        Store.updateClient(c.id, { access: [...(c.access || []), { label: d.label || 'Acesso', value: d.value }] });
      }
    },
    'remove-link': (el) => {
      const c = Store.client(el.dataset.id); const k = el.dataset.kind;
      const arr = [...(c[k] || [])]; arr.splice(Number(el.dataset.index), 1);
      Store.updateClient(c.id, { [k]: arr });
    },
    'copy-text': async (el) => { if (await U.copy(el.dataset.text)) UI.toast('Copiado'); },
    'clients-status': (el) => { VS.clientsFilter.status = el.dataset.status; VS.save(); App.render(); },

    /* ---- Diário ---- */
    'new-log': (el) => openNewLog(el?.dataset?.client ? { clientId: el.dataset.client } : {}),
    'save-log-form': () => {
      const root = document.getElementById('log-form');
      const d = UI.formData(root);
      if (!d.clientId) { UI.toast('Escolha o cliente.'); root.querySelector('[name=clientId]').focus(); return; }
      if (!d.title && !d.body && !d.analysis && !d.planned && !d.actionsDone) { UI.toast('Preencha a análise ou os detalhes.'); return; }
      const data = {
        clientId: d.clientId, type: d.type, title: d.title, body: d.body, analysis: d.analysis, planned: d.planned, actionsDone: d.actionsDone, date: d.date || U.today(), time: d.time, impact: d.impact,
        tags: splitTags(d.tags), metrics: { spend: U.num(d.spend), leads: U.num(d.leads), contracts: U.num(d.contracts) },
      };
      if (root.dataset.id) { Store.updateLog(root.dataset.id, data); UI.toast('Registro atualizado'); }
      else {
        const pending = App.pendingLogTask; App.pendingLogTask = null;
        Store.addLog({ ...data, taskId: pending || undefined }); UI.toast('Registrado no diário 📓');
      }
      UI.closeModal();
    },
    'edit-log': (el) => UI.modal(Forms.log(Store.log(el.dataset.id)), { wide: true }),
    'delete-log': (el) => { const l = Store.removeLog(el.dataset.id); UI.toast('Registro excluído', { undo: () => Store.restoreLog(l) }); },
    'pin-log': (el) => { const l = Store.log(el.dataset.id); Store.updateLog(l.id, { pinned: !l.pinned, editedAt: l.editedAt }); },
    'log-to-task': (el) => {
      const l = Store.log(el.dataset.id);
      openNewTask({ clientId: l.clientId, due: U.addDays(U.today(), 1) });
      const f = document.getElementById('task-form');
      f.querySelector('[name=title]').value = l.title ? `Follow-up: ${l.title}` : '';
      f.querySelector('[name=description]').value = `Do diário de bordo (${U.fmtDate(l.date)}):\n${l.body || ''}`;
    },
    'composer-type': (el) => {
      const comp = document.getElementById('composer');
      comp.querySelectorAll('[data-action="composer-type"]').forEach((b) => b.classList.toggle('active', b === el));
      comp.querySelector('[name=type]').value = el.dataset.type;
      comp.classList.toggle('is-analise', el.dataset.type === 'analise');
      VS.composerType = el.dataset.type; VS.save();
      comp.querySelector(el.dataset.type === 'analise' ? '[name=analysis]' : '[name=title]').focus();
    },
    preset: (el) => {
      const ta = document.querySelector('#composer [name=analysis]'); if (!ta) return;
      ta.value = (ta.value.trim() ? ta.value.trim() + ' ' : '') + el.dataset.text;
      ta.focus();
    },
    'log-view': (el) => { VS.logView = el.dataset.view; VS.save(); App.render(); },
    'planned-to-task': (el) => {
      const l = Store.log(el.dataset.id);
      openNewTask({ clientId: l.clientId, due: U.addDays(U.today(), 1), status: M.status.todo ? 'todo' : undefined });
      App.pendingPlannedLog = l.id;
      const f = document.getElementById('task-form');
      f.querySelector('[name=title]').value = l.planned.split('\n')[0].slice(0, 140);
      f.querySelector('[name=description]').value = `Ação programada no diário de bordo (${U.fmtDate(l.date)}):\n${l.planned}${l.analysis ? `\n\nAnálise: ${l.analysis}` : ''}`;
    },
    'composer-extra': () => document.getElementById('composer-extra').classList.toggle('hidden'),
    'submit-composer': () => {
      const comp = document.getElementById('composer');
      const d = UI.formData(comp);
      const clientId = d.clientId !== undefined ? d.clientId : comp.dataset.client;
      if (!clientId) { UI.toast('Escolha o cliente do registro.'); comp.querySelector('[name=clientId]')?.focus(); return; }
      const isA = d.type === 'analise';
      const data = isA ? { analysis: d.analysis, planned: d.planned, actionsDone: d.actionsDone } : { title: d.title, body: d.body };
      if (!Object.values(data).some(Boolean)) { UI.toast('Escreva o que aconteceu.'); comp.querySelector(isA ? '[name=analysis]' : '[name=title]').focus(); return; }
      const log = Store.addLog({
        clientId, type: d.type, ...data, date: d.date || U.today(), time: d.time || U.nowTime(), impact: d.impact,
        tags: splitTags(d.tags), metrics: { spend: U.num(d.spend), leads: U.num(d.leads), contracts: U.num(d.contracts) },
      });
      if (isA && d.plannedTask && d.planned) {
        const t = Store.addTask({ clientId, title: d.planned.split('\n')[0].slice(0, 140), due: U.addDays(U.today(), 1), priority: 'high', status: M.status.todo ? 'todo' : M.STATUSES[0].id, description: `Ação programada no diário de bordo (${U.fmtDate(log.date)})${d.analysis ? `\nAnálise: ${d.analysis}` : ''}` });
        Store.updateLog(log.id, { plannedTaskId: t.id, editedAt: undefined });
      }
      ['title', 'body', 'analysis', 'planned', 'actionsDone', 'spend', 'leads', 'contracts', 'tags'].forEach((k) => { const f = comp.querySelector(`[name=${k}]`); if (f) f.value = ''; });
      const pt = comp.querySelector('[name=plannedTask]'); if (pt) pt.checked = false;
      comp.querySelector('[name=impact]').value = 'neutro';
      UI.toast('Registrado no diário 📓');
    },
    'log-type-filter': (el) => {
      const f = App.route.name === 'journal' ? VS.journal : VS.clientLog;
      f.type = f.type === el.dataset.type ? '' : el.dataset.type; VS.save(); App.render();
    },
    'copy-journal': async (el) => {
      const { logs, title } = currentJournal(el.dataset.scope);
      if (!logs.length) { UI.toast('Nenhum registro no filtro atual.'); return; }
      if (await U.copy(journalText(logs, title, false))) UI.toast(`${logs.length} registros copiados — cole no WhatsApp ou e-mail`);
    },
    'export-journal': (el) => {
      const { logs, title } = currentJournal(el.dataset.scope);
      if (!logs.length) { UI.toast('Nenhum registro no filtro atual.'); return; }
      U.download(`${U.norm(title).replace(/[^a-z0-9]+/g, '-')}-${U.today()}.md`, journalText(logs, title, true), 'text/markdown');
    },
    print: () => window.print(),

    /* ---- Métricas ---- */
    'new-metric': (el) => UI.modal(Forms.metric(el.dataset.client), { wide: true }),
    'edit-metric': (el) => { const m = Store.state.metrics.find((x) => x.id === el.dataset.id); UI.modal(Forms.metric(m.clientId, m), { wide: true }); },
    'delete-metric': (el) => { const m = Store.removeMetric(el.dataset.id); UI.toast('Semana excluída', { undo: () => Store.restoreMetric(m) }); },
    'save-metric-form': () => {
      const root = document.getElementById('metric-form');
      const d = UI.formData(root);
      if (!d.week) { UI.toast('Informe a semana.'); return; }
      const data = { clientId: root.dataset.client, week: U.weekStart(d.week), note: d.note };
      ['spend', 'leads', 'qualified', 'meetings', 'contracts', 'revenue'].forEach((k) => { data[k] = U.num(d[k]); });
      if (root.dataset.id) data.id = root.dataset.id;
      const m = Store.upsertMetric(data);
      if (d.alsoLog) {
        const x = Store.derive(m);
        Store.addLog({ clientId: m.clientId, type: 'relatorio', title: `Métricas da semana de ${U.fmtDate(m.week)}`, body: [`Investimento ${U.fmtMoney(m.spend)}`, `${U.fmtNum(m.leads)} leads`, x.cpl ? `CPL ${U.fmtMoney(x.cpl)}` : '', m.contracts != null ? `${m.contracts} contratos` : '', m.note].filter(Boolean).join(' · '), metrics: { spend: m.spend, leads: m.leads, contracts: m.contracts }, auto: true });
      }
      UI.closeModal(); UI.toast('Métricas salvas');
    },
    'weekly-report': (el) => UI.modal(Forms.weeklyReport(Store.client(el.dataset.id)), { wide: true }),
    'report-copy': async () => {
      const root = document.getElementById('report-form');
      const text = root.querySelector('[name=text]').value;
      if (await U.copy(text)) UI.toast('Relatório copiado');
      if (root.querySelector('[name=logIt]').checked) {
        Store.addLog({ clientId: root.dataset.client, type: 'relatorio', title: 'Relatório semanal enviado ao cliente', body: text });
        root.querySelector('[name=logIt]').checked = false;
      }
    },
    'report-whatsapp': () => {
      const root = document.getElementById('report-form');
      const c = Store.client(root.dataset.client);
      const text = root.querySelector('[name=text]').value;
      window.open(`${U.waLink(c.contact.phone)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      if (root.querySelector('[name=logIt]').checked) {
        Store.addLog({ clientId: c.id, type: 'relatorio', title: 'Relatório semanal enviado ao cliente', body: text });
        root.querySelector('[name=logIt]').checked = false;
      }
    },

    /* ---- Calendário ---- */
    'cal-nav': (el) => {
      const dir = Number(el.dataset.dir);
      VS.calMonth = dir === 0 ? U.monthStart(U.today()) : U.addMonths(VS.calMonth || U.monthStart(U.today()), dir);
      VS.save(); App.render();
    },

    /* ---- Configurações ---- */
    'export-json': () => U.download(`bordo-backup-${U.today()}.json`, Store.exportJSON(), 'application/json'),
    'export-csv': () => {
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = [['Tarefa', 'Cliente', 'Status', 'Prioridade', 'Responsável', 'Prazo', 'Tags', 'Checklist', 'Tempo (min)', 'Descrição']];
      Store.sortTasks(Store.state.tasks).forEach((t) => rows.push([t.title, Store.client(t.clientId)?.name || 'Interno', M.status[t.status]?.label, M.priority[t.priority]?.label, t.assignee, t.due, t.tags.join(', '), `${t.checklist.filter((i) => i.done).length}/${t.checklist.length}`, t.timeSpent, t.description]));
      U.download(`bordo-tarefas-${U.today()}.csv`, '﻿' + rows.map((r) => r.map(q).join(';')).join('\n'), 'text/csv');
    },
    'load-demo': async () => {
      if (await UI.confirm('Substituir todos os dados atuais pelos dados de exemplo?', { title: 'Carregar exemplo', ok: 'Carregar', danger: true })) {
        Store.reset(true); VS.bannerClosed = false; VS.save(); applyTheme(); UI.toast('Dados de exemplo carregados'); location.hash = '#/';
      }
    },
    'reset-all': async () => {
      if (await UI.confirm('Apagar TODOS os clientes, tarefas, registros e métricas? Faça um backup antes. Esta ação não pode ser desfeita.', { title: 'Apagar tudo', ok: 'Apagar tudo', danger: true })) {
        Store.reset(false); UI.toast('Dados apagados'); location.hash = '#/';
      }
    },
  };

  /* ============================== Mudanças (change) ============================== */
  const Changes = {
    'task-filter': (el) => { VS.filters[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value; VS.save(); App.render(); },
    'group-by': (el) => { if (el.dataset.scope === 'client') VS.clientGroupBy = el.value; else VS.groupBy = el.value; VS.save(); App.render(); },
    'clients-sort': (el) => { VS.clientsFilter.sort = el.value; VS.save(); App.render(); },
    'log-filter': (el) => {
      const f = el.dataset.scope === 'all' ? VS.journal : VS.clientLog;
      f[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value; VS.save(); App.render();
    },
    'client-field': (el) => {
      const c = Store.client(el.dataset.id); if (!c) return;
      const path = el.dataset.field;
      const val = NUMERIC_PATHS.test(path) ? U.num(el.value) : el.value;
      if (path === 'name' && !val.trim()) { UI.toast('O nome não pode ficar vazio.'); App.render(); return; }
      setPath(c, path, val);
      if (path === 'status') Store.addLog({ clientId: c.id, type: 'nota', title: `Status alterado para ${M.clientStatus[val]?.label}`, auto: true }, { silent: true });
      Store.save();
    },
    'client-tags': (el) => Store.updateClient(el.dataset.id, { tags: splitTags(el.value) }),
    'task-field': (el) => {
      const f = el.dataset.field; const id = el.dataset.id;
      if (f === 'status' && el.value === 'done') { toggleDone(id); return; }
      if (f === 'title' && !el.value.trim()) { App.renderDrawer(); return; }
      Store.updateTask(id, { [f]: f === 'title' ? el.value.trim() : el.value });
    },
    'task-tags': (el) => Store.updateTask(el.dataset.id, { tags: splitTags(el.value) }),
    setting: (el) => {
      const f = el.dataset.field;
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (f === 'staleDays') v = Math.max(1, Number(v) || 7);
      if (f === 'userName') {
        v = v.trim() || 'Você';
        const old = Store.settings.userName;
        Store.settings.team = (Store.settings.team || []).map((n) => (n === old ? v : n));
        if (!Store.settings.team.includes(v)) Store.settings.team.unshift(v);
        Store.state.tasks.forEach((t) => { if (t.assignee === old) t.assignee = v; });
      }
      Store.settings[f] = v; Store.save(); UI.toast('Configuração salva');
    },
    'setting-team': (el) => {
      const team = el.value.split('\n').map((x) => x.trim()).filter(Boolean);
      if (!team.includes(Store.settings.userName)) team.unshift(Store.settings.userName);
      Store.settings.team = [...new Set(team)]; Store.save(); UI.toast('Equipe atualizada');
    },
    'setting-onboarding': (el) => { Store.settings.onboardingTemplate = el.value.split('\n').map((x) => x.trim()).filter(Boolean); Store.save(); UI.toast('Modelo salvo'); },
    'import-diary-xlsx': async (el) => {
      const file = el.files[0]; el.value = ''; if (!file) return;
      const clientId = currentClientId(); const c = Store.client(clientId); if (!c) return;
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX');
        const wb = XLSX.read(await file.arrayBuffer());
        const { entries, adAccount } = parseDiarySheet(wb);
        if (!entries.length) { UI.toast('Não encontrei linhas com Data + Análise na planilha.'); return; }
        const existing = new Set(Store.logs({ clientId }).map((l) => l.date + '|' + (l.analysis || '').trim()));
        const fresh = entries.filter((x) => !existing.has(x.date + '|' + x.analysis));
        if (!(await UI.confirm(`Importar ${fresh.length} registro(s) para o diário de ${c.name}?${entries.length - fresh.length ? ` (${entries.length - fresh.length} já existiam e serão ignorados)` : ''}`, { title: 'Importar planilha', ok: 'Importar' }))) return;
        fresh.forEach((x) => Store.addLog({ clientId, type: 'analise', time: '', ...x }, { silent: true }));
        if (adAccount && !c.adAccount) c.adAccount = adAccount;
        Store.save();
        UI.toast(`${fresh.length} registros importados 📓`);
      } catch (err) { UI.toast('Não foi possível ler a planilha: ' + err.message); }
    },
    'import-json': (el) => {
      const file = el.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        if (!(await UI.confirm('Importar este backup substituirá todos os dados atuais. Continuar?', { title: 'Importar backup', ok: 'Importar', danger: true }))) return;
        try { Store.importJSON(reader.result); applyTheme(); UI.toast('Backup importado com sucesso'); location.hash = '#/'; }
        catch (err) { UI.toast('Arquivo inválido: ' + err.message); }
      };
      reader.readAsText(file);
      el.value = '';
    },
  };

  /* ============================== Digitação (input) ============================== */
  const debouncedRender = U.debounce(() => App.render(), 180);
  const Inputs = {
    'task-filter': (el) => { VS.filters[el.dataset.field] = el.value; VS.save(); debouncedRender(); },
    'clients-filter': (el) => { VS.clientsFilter[el.dataset.field] = el.value; VS.save(); debouncedRender(); },
    'log-filter': (el) => { const f = el.dataset.scope === 'all' ? VS.journal : VS.clientLog; f[el.dataset.field] = el.value; VS.save(); debouncedRender(); },
  };

  /* ============================== Paleta de comandos ============================== */
  const Palette = {
    items: [], sel: 0,
    open() {
      UI.modal(`<input id="palette-input" placeholder="Buscar clientes, tarefas, registros… ou digite um comando" autocomplete="off">
        <div class="palette-list" id="palette-list"></div>
        <div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></div>`,
      { className: 'palette' });
      const input = document.getElementById('palette-input');
      input.addEventListener('input', () => { Palette.sel = 0; Palette.update(input.value); });
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowDown') { ev.preventDefault(); Palette.sel = Math.min(Palette.items.length - 1, Palette.sel + 1); Palette.paint(); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); Palette.sel = Math.max(0, Palette.sel - 1); Palette.paint(); }
        else if (ev.key === 'Enter') { ev.preventDefault(); Palette.run(Palette.sel); }
      });
      Palette.sel = 0; Palette.update('');
    },
    update(q) {
      const cmds = [
        { g: 'Ações', ico: '＋', label: 'Nova tarefa', sub: 'N', run: () => openNewTask({}) },
        { g: 'Ações', ico: '📓', label: 'Novo registro no diário', sub: 'D', run: () => openNewLog({}) },
        { g: 'Ações', ico: '👥', label: 'Novo cliente', sub: 'C', run: () => openClientForm() },
        { g: 'Ir para', ico: '🏠', label: 'Início', run: () => { location.hash = '#/'; } },
        { g: 'Ir para', ico: '✅', label: 'Tarefas', run: () => { location.hash = '#/tarefas'; } },
        { g: 'Ir para', ico: '📓', label: 'Diário de bordo', run: () => { location.hash = '#/diario'; } },
        { g: 'Ir para', ico: '📅', label: 'Calendário', run: () => { location.hash = '#/calendario'; } },
        { g: 'Ir para', ico: '👥', label: 'Clientes', run: () => { location.hash = '#/clientes'; } },
        { g: 'Ir para', ico: '⚙️', label: 'Configurações', run: () => { location.hash = '#/config'; } },
        { g: 'Ações', ico: '🌓', label: 'Alternar tema claro/escuro', run: () => Actions['cycle-theme']() },
        { g: 'Ações', ico: '💾', label: 'Exportar backup', run: () => Actions['export-json']() },
      ];
      let items = q ? cmds.filter((c) => U.match(c.label, q)) : cmds.slice(0, 3);
      const cl = Store.clients().filter((c) => !q || U.match([c.name, c.niche, c.contact?.name].join(' '), q)).slice(0, q ? 6 : 5);
      items = items.concat(cl.map((c) => ({ g: 'Clientes', ico: `<span class="avatar" style="width:18px;height:18px;font-size:8px;background:${e(c.color)}">${e(U.initials(c.name))}</span>`, label: c.name, sub: c.niche, run: () => { location.hash = `#/cliente/${c.id}`; } })));
      if (q) {
        items = items.concat(cl.slice(0, 2).map((c) => ({ g: 'Clientes', ico: '📓', label: `Registrar no diário — ${c.name}`, run: () => openNewLog({ clientId: c.id }) })));
        const ts = Store.sortTasks(Store.tasks({ q })).slice(0, 7);
        items = items.concat(ts.map((t) => ({ g: 'Tarefas', ico: t.status === 'done' ? '✔️' : '○', label: t.title, sub: `${Store.client(t.clientId)?.name || 'Interno'}${t.due ? ' · ' + U.fmtDue(t.due) : ''}`, run: () => App.openTask(t.id) })));
        const ls = Store.logs({ q }).slice(0, 6);
        items = items.concat(ls.map((l) => ({ g: 'Diário de bordo', ico: M.logType[l.type]?.icon, label: l.title || M.logType[l.type]?.label, sub: `${Store.client(l.clientId)?.name || ''} · ${U.fmtDate(l.date)}`, run: () => { location.hash = `#/cliente/${l.clientId}/diario`; setTimeout(() => { const n = document.getElementById('log-' + l.id); if (n) { n.scrollIntoView({ block: 'center' }); n.animate([{ boxShadow: '0 0 0 3px var(--accent)' }, { boxShadow: '0 0 0 0 transparent' }], 1600); } }, 80); } })));
      }
      Palette.items = items;
      Palette.paint();
    },
    paint() {
      const list = document.getElementById('palette-list'); if (!list) return;
      let g = '', html = '';
      Palette.items.forEach((it, i) => {
        if (it.g !== g) { html += `<div class="p-group">${e(it.g)}</div>`; g = it.g; }
        html += `<div class="p-item ${i === Palette.sel ? 'sel' : ''}" data-pidx="${i}"><span class="p-ico">${it.ico || ''}</span><span class="ellipsis">${e(it.label)}</span>${it.sub ? `<span class="p-sub ellipsis">${e(it.sub)}</span>` : ''}</div>`;
      });
      list.innerHTML = html || '<div class="empty">Nada encontrado</div>';
      list.querySelectorAll('[data-pidx]').forEach((n) => {
        n.addEventListener('click', () => Palette.run(Number(n.dataset.pidx)));
        n.addEventListener('mousemove', () => { if (Palette.sel !== Number(n.dataset.pidx)) { Palette.sel = Number(n.dataset.pidx); Palette.paint(); } });
      });
      list.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
    },
    run(i) { const it = Palette.items[i]; if (!it) return; UI.closeModal(); it.run(); },
  };

  /* ============================== Eventos globais ============================== */
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

  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-change]');
    if (el && Changes[el.dataset.change]) Changes[el.dataset.change](el, ev);
  });

  document.addEventListener('input', (ev) => {
    const el = ev.target.closest('[data-input]');
    if (el && Inputs[el.dataset.input]) Inputs[el.dataset.input](el, ev);
  });

  const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  let gPressed = 0;

  document.addEventListener('keydown', (ev) => {
    const t = ev.target;
    const mod = ev.ctrlKey || ev.metaKey;

    if (mod && ev.key.toLowerCase() === 'k') { ev.preventDefault(); if (document.getElementById('palette-input')) UI.closeModal(); else Palette.open(); return; }

    if (ev.key === 'Escape') {
      if (UI.closeModal()) return;
      if (App.drawerId) { App.closeDrawer(); return; }
      document.getElementById('app').classList.remove('side-open');
      if (isTyping(t)) t.blur();
      return;
    }

    // Adição rápida de tarefa nas listas
    if (t.dataset && t.dataset.quickadd !== undefined && ev.key === 'Enter') {
      ev.preventDefault();
      const title = t.value.trim(); if (!title) return;
      let d = {}; try { d = JSON.parse(t.dataset.quickadd); } catch (err) { d = {}; }
      Store.addTask({ title, ...d, completedAt: d.status === 'done' ? Date.now() : null });
      return;
    }
    if (t.dataset && t.dataset.enter && ev.key === 'Enter') {
      ev.preventDefault();
      const val = t.value.trim(); if (!val) return;
      if (t.dataset.enter === 'add-check') {
        const task = Store.task(t.dataset.id);
        task.checklist.push({ id: U.uid(), text: val, done: false });
        t.value = ''; Store.save();
      }
      return;
    }
    if (t.dataset && t.dataset.enterCtrl && ev.key === 'Enter' && mod) { ev.preventDefault(); Actions[t.dataset.enterCtrl](t); return; }
    if (t.closest && t.closest('#composer') && ev.key === 'Enter') {
      if (mod) { ev.preventDefault(); Actions['submit-composer'](); return; }
      if (t.name === 'title') { ev.preventDefault(); t.closest('#composer').querySelector('[name=body]').focus(); return; }
    }

    // Enter em modais salva
    const modal = t.closest && t.closest('.modal');
    if (modal && ev.key === 'Enter' && (mod || (t.tagName === 'INPUT' && t.type !== 'checkbox' && t.id !== 'palette-input'))) {
      const btn = modal.querySelector('.modal-foot .btn-primary[data-action]');
      if (btn) { ev.preventDefault(); btn.click(); }
      return;
    }

    if (isTyping(t) || mod || ev.altKey || UI.isModalOpen()) return;
    const k = ev.key.toLowerCase();
    if (gPressed && Date.now() - gPressed < 1200) {
      gPressed = 0;
      const map = { i: '#/', t: '#/tarefas', c: '#/clientes', d: '#/diario', k: '#/calendario', s: '#/config' };
      if (map[k]) { ev.preventDefault(); location.hash = map[k]; }
      return;
    }
    if (k === 'g') { gPressed = Date.now(); return; }
    if (k === 'n') { ev.preventDefault(); openNewTask({}); }
    else if (k === 'd') { ev.preventDefault(); openNewLog({}); }
    else if (k === 'c') { ev.preventDefault(); openClientForm(); }
    else if (k === '/') {
      const s = document.querySelector('#task-search, #client-search, [id^="log-search"]');
      if (s) { ev.preventDefault(); s.focus(); } else { ev.preventDefault(); Palette.open(); }
    }
  });

  /* ---------- Arrastar e soltar ---------- */
  document.addEventListener('dragstart', (ev) => {
    const card = ev.target.closest && ev.target.closest('[data-drag-task]');
    if (!card) return;
    ev.dataTransfer.setData('text/plain', card.dataset.dragTask);
    ev.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });
  document.addEventListener('dragend', (ev) => { ev.target.classList && ev.target.classList.remove('dragging'); document.querySelectorAll('.drag-over').forEach((n) => n.classList.remove('drag-over')); });
  document.addEventListener('dragover', (ev) => {
    const zone = ev.target.closest && ev.target.closest('[data-drop-status], [data-drop-date]');
    if (!zone) return;
    ev.preventDefault();
    document.querySelectorAll('.drag-over').forEach((n) => n !== zone && n.classList.remove('drag-over'));
    zone.classList.add('drag-over');
  });
  document.addEventListener('drop', (ev) => {
    const zone = ev.target.closest && ev.target.closest('[data-drop-status], [data-drop-date]');
    if (!zone) return;
    ev.preventDefault();
    zone.classList.remove('drag-over');
    const id = ev.dataTransfer.getData('text/plain');
    const task = Store.task(id); if (!task) return;
    if (zone.dataset.dropStatus) {
      const st = zone.dataset.dropStatus;
      if (st === task.status) return;
      if (st === 'done') toggleDone(id);
      else Store.updateTask(id, { status: st });
    } else if (zone.dataset.dropDate && zone.dataset.dropDate !== task.due) {
      Store.updateTask(id, { due: zone.dataset.dropDate });
      UI.toast(`Prazo movido para ${U.fmtDate(zone.dataset.dropDate)}`);
    }
  });

  /* ============================== Início ============================== */
  Store.load();
  applyTheme();
  Store.onChange(scheduleRender);
  window.addEventListener('hashchange', () => { UI.closeModal(); App.render(); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => App.render());
  App.render();

  window.App = App;
})();
