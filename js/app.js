/* Roteador, renderização, ações, atalhos e tela de código de acesso. */
(function () {
  const M = window.META;
  const App = { route: { name: 'painel', params: {} }, taskId: null, last: '' };

  /* ============================== Rotas ============================== */
  const parse = () => {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    switch (p[0]) {
      case 'diario': return { name: 'diario', params: {} };
      case 'clientes': return { name: 'clientes', params: {} };
      case 'c': return { name: 'cliente', params: { id: p[1], tab: p[2] || 'diario' } };
      case 'equipe': return { name: 'equipe', params: {} };
      case 'criativos': return { name: 'criativos', params: {} };
      case 'ajustes': return { name: 'ajustes', params: {} };
      default: return { name: 'painel', params: {} };
    }
  };
  const goNextPending = (exceptId) => {
    const next = Views.pendingList().find((c) => c.id !== exceptId);
    if (next) { location.hash = `#/c/${next.id}/diario`; return next; }
    return null;
  };

  /* ============================== Render ============================== */
  const keepFocus = (fn) => {
    const a = document.activeElement;
    const key = a && a.id ? '#' + CSS.escape(a.id) : null;
    const sel = a && 'selectionStart' in a ? [a.selectionStart, a.selectionEnd] : null;
    fn();
    if (!key) return;
    const el = document.querySelector(key);
    if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); try { if (sel) el.setSelectionRange(sel[0], sel[1]); } catch (err) { /* sem seleção */ } }
  };

  App.render = () => {
    App.route = parse();
    if (App.route.name === 'diario') { if (!goNextPending()) { location.hash = '#/'; UI.toast('Todos os diários de hoje já foram registrados'); } return; }
    const changed = location.hash !== App.last;
    const comp = document.getElementById('composer');
    const draft = comp && !changed ? [...comp.querySelectorAll('[name]')].map((x) => [x.name, x.type === 'checkbox' ? x.checked : x.value]) : null;
    const r = App.route;
    const page = r.name === 'clientes' ? Views.clientes() : r.name === 'cliente' ? Views.cliente(r.params.id, r.params.tab)
      : r.name === 'equipe' ? Views.equipe() : r.name === 'criativos' ? Views.criativos() : r.name === 'ajustes' ? Views.ajustes() : Views.painel();
    keepFocus(() => {
      document.getElementById('rail').innerHTML = Views.rail(page.rail);
      document.getElementById('view').innerHTML = page.top + `<main class="main">${page.body}</main>`;
      document.getElementById('ai-root').innerHTML = VS.ai ? Views.aiPanel() : '';
      const c2 = document.getElementById('composer');
      if (draft && c2) {
        draft.forEach(([k, v]) => { const f = c2.querySelector(`[name="${k}"]`); if (f) { if (f.type === 'checkbox') f.checked = v; else f.value = v; } });
        const imp = c2.querySelector('[name=impact]').value;
        c2.querySelectorAll('[data-action="pick-res"]').forEach((b) => b.classList.toggle('on', b.dataset.k === imp));
      }
    });
    document.title = `${document.querySelector('.top h1')?.textContent || 'Central'} · ${Store.settings.workspaceName || 'Unlockify'}`;
    if (changed) { App.last = location.hash; window.scrollTo(0, 0); }
  };

  App.renderTask = () => {
    if (!App.taskId) return;
    const t = Store.task(App.taskId);
    const modal = document.querySelector('#modal-root .modal');
    if (!t || !modal || !modal.querySelector('#task-view')) { App.taskId = null; return; }
    keepFocus(() => { modal.innerHTML = Forms.taskView(t); modal.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', () => UI.closeModal())); });
  };
  App.openTask = (id) => { App.taskId = id; UI.modal(Forms.taskView(Store.task(id)), { wide: true, onClose: () => { App.taskId = null; } }); };

  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; App.render(); App.renderTask(); }); };

  /* ============================== Ajudantes ============================== */
  const parseDefaults = (el) => { try { return JSON.parse(el?.dataset?.defaults || '{}'); } catch (err) { return {}; } };
  const splitTags = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const setPath = (o, path, v) => { const k = path.split('.'); let x = o; k.slice(0, -1).forEach((y) => { if (!x[y] || typeof x[y] !== 'object') x[y] = {}; x = x[y]; }); x[k[k.length - 1]] = v; };
  const NUMERIC = /^(contract\.|goals\.|investmentCap$)/;
  const curClient = () => (App.route.name === 'cliente' ? App.route.params.id : '');
  const openNewTask = (d = {}) => { if (d.clientId === undefined && curClient()) d.clientId = curClient(); App.pendingPlanned = null; UI.modal(Forms.task(d), { wide: true }); };
  const complete = (id) => {
    const t = Store.task(id); if (!t || t.status === 'done') return;
    const was = t.status;
    const spawned = Store.updateTask(id, { status: 'done' });
    UI.toast(spawned ? `Concluída. Próxima repetição em ${U.fmtDate(spawned.due)}` : 'Demanda concluída', {
      undo: () => {
        if (spawned) Store.removeTask(spawned.id);
        const auto = Store.state.logs.find((l) => l.taskId === id && l.type === 'tarefa' && Date.now() - l.createdAt < 60000);
        if (auto) Store.state.logs = Store.state.logs.filter((l) => l !== auto);
        Store.updateTask(id, { status: was });
      },
    });
  };

  /* ============================== Ações ============================== */
  const A = {
    per: (el) => { VS.per = el.dataset.k; VS.save(); App.render(); },
    sort: (el) => { VS.sort = el.dataset.k; VS.save(); App.render(); },
    cf: (el) => { VS.cf = el.dataset.k; VS.save(); App.render(); },
    ctab: (el) => { location.hash = `#/c/${el.dataset.id}/${el.dataset.k}`; },
    person: (el) => { VS.person = VS.person === el.dataset.k ? '' : el.dataset.k; VS.save(); App.render(); },
    ai: () => { VS.ai = !VS.ai; VS.save(); App.render(); },
    'ai-ask': (el) => { VS.aiQ = el.dataset.q || el.value; VS.ai = true; VS.save(); App.render(); },
    'ai-ask-input': () => { const v = document.getElementById('ai-input').value.trim(); if (v) { VS.aiQ = v; VS.save(); App.render(); } },
    'go-diario': () => { if (!goNextPending()) UI.toast('Todos os diários de hoje já foram registrados'); },
    'open-client': (el) => {
      VS.ai = false; VS.save();
      const tab = el.dataset.tab || (App.route.name === 'cliente' ? App.route.params.tab : 'diario');
      location.hash = `#/c/${el.dataset.id}/${tab}`;
    },
    'pick-res': (el) => {
      const comp = document.getElementById('composer');
      comp.querySelector('[name=impact]').value = el.dataset.k;
      comp.querySelectorAll('[data-action="pick-res"]').forEach((b) => b.classList.toggle('on', b === el));
      comp.querySelector('[name=analysis]').focus();
    },
    'save-entry': (el) => {
      const comp = document.getElementById('composer');
      const d = UI.formData(comp);
      if (!d.analysis && !d.planned && !d.actionsDone && !d.impact) { UI.toast('Escolha o resultado ou escreva a análise.'); comp.querySelector('[name=analysis]').focus(); return; }
      const cid = el.dataset.id;
      const log = Store.addLog({ clientId: cid, type: 'analise', date: U.today(), time: U.nowTime(), analysis: d.analysis || (d.impact === 'positivo' ? 'Resultado bom.' : d.impact === 'negativo' ? 'Resultado ruim.' : 'Resultado neutro.'), planned: d.planned, actionsDone: d.actionsDone, impact: d.impact || 'neutro' });
      if (d.plannedTask && d.planned) {
        const t = Store.addTask({ clientId: cid, title: d.planned.split('\n')[0].slice(0, 140), due: U.addDays(U.today(), 1), priority: 'high', description: `Ação programada no diário de bordo (${U.fmtDate(log.date)}).${d.analysis ? `\nAnálise: ${d.analysis}` : ''}` });
        Store.updateLog(log.id, { plannedTaskId: t.id, editedAt: undefined });
      }
      const next = goNextPending(cid);
      UI.toast(next ? `Registrado. Agora: ${next.name}` : 'Registrado. Diário de hoje completo!');
      if (!next) App.render();
    },
    'skip-client': (el) => {
      const list = Views.pendingList();
      const i = list.findIndex((c) => c.id === el.dataset.id);
      const next = list[i + 1] || list.find((c) => c.id !== el.dataset.id);
      if (next) location.hash = `#/c/${next.id}/diario`; else UI.toast('Não há outro cliente pendente.');
    },
    'edit-log': (el) => UI.modal(Forms.log(Store.log(el.dataset.id)), { wide: true }),
    'save-log-form': () => {
      const root = document.getElementById('log-form'); const d = UI.formData(root);
      const l = Store.log(root.dataset.id);
      Store.updateLog(l.id, { date: d.date || l.date, impact: d.impact, analysis: d.analysis, planned: d.planned, actionsDone: d.actionsDone, title: '', body: '', type: l.type === 'tarefa' ? 'tarefa' : 'analise' });
      UI.closeModal(); UI.toast('Registro salvo');
    },
    'delete-log': (el) => { const l = Store.removeLog(el.dataset.id); UI.closeModal(); UI.toast('Registro excluído', { undo: () => Store.restoreLog(l) }); },

    'new-task': (el) => openNewTask(parseDefaults(el)),
    'save-task-form': () => {
      const root = document.getElementById('task-form'); const d = UI.formData(root);
      if (!d.title) { UI.toast('Escreva o que precisa ser feito.'); root.querySelector('[name=title]').focus(); return; }
      let tags = []; try { tags = JSON.parse(root.dataset.tags || '[]'); } catch (err) { tags = []; }
      const lane = { roteiro: 'roteiro', 'vídeo': 'video', 'estático': 'estatico' }[tags[1]];
      Store.addTask({ title: d.title, clientId: d.clientId, assignee: d.assignee, due: d.due, priority: d.priority, description: d.description, tags: tags.slice(0, 1), status: M.STATUSES[0].id, ...(lane ? { lane } : {}) });
      UI.closeModal(); UI.toast('Demanda criada');
    },
    'open-task': (el) => App.openTask(el.dataset.id),
    'done-task': (el) => complete(el.dataset.id),
    'reopen-task': (el) => Store.updateTask(el.dataset.id, { status: M.STATUSES[0].id }),
    'duplicate-task': (el) => { const t = Store.duplicateTask(el.dataset.id); UI.toast('Demanda duplicada'); App.openTask(t.id); },
    'delete-task': (el) => { const t = Store.removeTask(el.dataset.id); UI.closeModal(); UI.toast('Demanda excluída', { undo: () => Store.restoreTask(t) }); },
    'toggle-check': (el) => { const t = Store.task(el.dataset.id); const i = t.checklist.find((x) => x.id === el.dataset.item); i.done = !i.done; Store.save(); },
    'remove-check': (el) => { const t = Store.task(el.dataset.id); t.checklist = t.checklist.filter((x) => x.id !== el.dataset.item); Store.save(); },

    'new-client': () => UI.modal(Forms.client(), { wide: true }),
    'save-client-form': () => {
      const root = document.getElementById('client-form'); const d = UI.formData(root);
      if (!d.name) { UI.toast('Informe o nome do cliente.'); root.querySelector('[name=name]').focus(); return; }
      const c = Store.addClient(d, { withOnboarding: true });
      UI.closeModal(); UI.toast(`${c.name} criado`); location.hash = `#/c/${c.id}/info`;
    },
    'delete-client': async (el) => {
      const c = Store.client(el.dataset.id);
      if (!(await UI.confirm(`Excluir ${c.name} com todas as demandas e registros do diário? Você pode mudar o status para Encerrado em vez de excluir.`, { title: 'Excluir cliente', ok: 'Excluir', danger: true }))) return;
      const snap = Store.removeClient(c.id); location.hash = '#/clientes';
      UI.toast('Cliente excluído', { undo: () => Store.restoreClient(snap), duration: 8000 });
    },
    'export-json': () => U.download(`backup-${U.today()}.json`, Store.exportJSON(), 'application/json'),
    'reset-all': async () => { if (await UI.confirm('Apagar todos os dados deste navegador? Exporte um backup antes.', { title: 'Apagar tudo', ok: 'Apagar', danger: true })) { Store.reset(false); location.hash = '#/'; } },
  };

  const CH = {
    'client-field': (el) => {
      const c = Store.client(el.dataset.id); if (!c) return;
      const path = el.dataset.field; const v = NUMERIC.test(path) ? U.num(el.value) : el.value.trim();
      if (path === 'name' && !v) { UI.toast('O nome não pode ficar vazio.'); App.render(); return; }
      setPath(c, path, v); Store.save(); UI.toast('Salvo');
    },
    'task-field': (el) => {
      const f = el.dataset.field;
      if (f === 'title' && !el.value.trim()) { App.renderTask(); return; }
      if (f === 'status' && el.value === 'done') { complete(el.dataset.id); return; }
      Store.updateTask(el.dataset.id, { [f]: f === 'title' ? el.value.trim() : el.value });
    },
    'task-tags': (el) => Store.updateTask(el.dataset.id, { tags: splitTags(el.value) }),
    setting: (el) => {
      const f = el.dataset.field; let v = el.value.trim();
      if (f === 'userName') {
        v = v || 'Você'; const old = Store.settings.userName;
        Store.settings.team = (Store.settings.team || []).map((n) => (n === old ? v : n));
        if (!Store.settings.team.includes(v)) Store.settings.team.unshift(v);
        Store.state.tasks.forEach((t) => { if (t.assignee === old) t.assignee = v; });
      }
      Store.settings[f] = v; Store.save(); UI.toast('Salvo');
    },
    'setting-team': (el) => { const t = el.value.split('\n').map((x) => x.trim()).filter(Boolean); if (!t.includes(Store.settings.userName)) t.unshift(Store.settings.userName); Store.settings.team = [...new Set(t)]; Store.save(); UI.toast('Equipe salva'); },
    'import-json': (el) => {
      const file = el.files[0]; el.value = ''; if (!file) return;
      const r = new FileReader();
      r.onload = async () => { if (!(await UI.confirm('Importar este backup substitui os dados atuais. Continuar?', { title: 'Importar backup', ok: 'Importar', danger: true }))) return; try { Store.importJSON(r.result); UI.toast('Backup importado'); location.hash = '#/'; } catch (err) { UI.toast('Arquivo inválido: ' + err.message); } };
      r.readAsText(file);
    },
  };

  /* ============================== Eventos ============================== */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]'); if (!el) return;
    const inner = ev.target.closest('select, input, textarea, label, a[href]');
    if (inner && inner !== el && el.contains(inner) && !inner.dataset.action) return;
    const fn = A[el.dataset.action]; if (!fn) return;
    if (el.tagName === 'BUTTON' || el.dataset.action === 'open-client') ev.preventDefault();
    ev.stopPropagation();
    fn(el, ev);
  });
  document.addEventListener('change', (ev) => { const el = ev.target.closest('[data-change]'); if (el && CH[el.dataset.change]) CH[el.dataset.change](el); });
  const later = U.debounce(() => App.render(), 160);
  document.addEventListener('input', (ev) => { const el = ev.target.closest('[data-input]'); if (el && el.dataset.input === 'cl-q') { VS.q = el.value; VS.save(); later(); } });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target; const mod = ev.ctrlKey || ev.metaKey;
    if (ev.key === 'Escape') { if (UI._menu) return UI.closeMenu(); if (UI.closeModal()) return; if (VS.ai) { VS.ai = false; VS.save(); App.render(); } return; }
    if (ev.key !== 'Enter') { if (!mod && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) && !UI.isModalOpen() && ev.key.toLowerCase() === 'n') { ev.preventDefault(); openNewTask({}); } return; }
    if (t.dataset && t.dataset.quickadd !== undefined) {
      ev.preventDefault(); const title = t.value.trim(); if (!title) return;
      let d = {}; try { d = JSON.parse(t.dataset.quickadd); } catch (err) { d = {}; }
      Store.addTask({ title, assignee: Store.settings.userName, status: M.STATUSES[0].id, ...d }); UI.toast('Demanda criada'); return;
    }
    if (t.dataset && t.dataset.enter) {
      ev.preventDefault(); const v = t.value.trim(); if (!v) return;
      if (t.dataset.enter === 'add-check') { Store.task(t.dataset.id).checklist.push({ id: U.uid(), text: v, done: false }); t.value = ''; Store.save(); }
      else if (t.dataset.enter === 'add-comment') { Store.task(t.dataset.id).comments.push({ id: U.uid(), text: v, at: Date.now(), author: Store.settings.userName }); t.value = ''; Store.save(); }
      else if (t.dataset.enter === 'ai-ask') { VS.aiQ = v; VS.save(); App.render(); }
      return;
    }
    if (t.id === 't-title') { ev.preventDefault(); t.blur(); return; }
    if (mod && t.closest && t.closest('#composer')) { ev.preventDefault(); document.querySelector('[data-action="save-entry"]').click(); return; }
    const modal = t.closest && t.closest('.modal');
    if (modal && (mod || (t.tagName === 'INPUT' && t.type !== 'checkbox'))) { const b = modal.querySelector('.modal-f .btn-violet[data-action^="save"]'); if (b) { ev.preventDefault(); b.click(); } }
  });

  /* Arrastar criativos entre etapas (Roteiro, Edição de vídeo, Estático) */
  document.addEventListener('dragstart', (ev) => { const c = ev.target.closest && ev.target.closest('[data-drag-task]'); if (c) ev.dataTransfer.setData('text/plain', c.dataset.dragTask); });
  document.addEventListener('dragover', (ev) => { const z = ev.target.closest && ev.target.closest('[data-drop-kind]'); if (!z) return; ev.preventDefault(); document.querySelectorAll('.lane.over').forEach((n) => n !== z && n.classList.remove('over')); z.classList.add('over'); });
  document.addEventListener('dragend', () => document.querySelectorAll('.lane.over').forEach((n) => n.classList.remove('over')));
  document.addEventListener('drop', (ev) => {
    const z = ev.target.closest && ev.target.closest('[data-drop-kind]'); if (!z) return;
    ev.preventDefault(); z.classList.remove('over');
    const t = Store.task(ev.dataTransfer.getData('text/plain')); if (!t) return;
    const K = Views.KINDS.find((k) => k.k === z.dataset.dropKind);
    if (Views.kindOf(t) === K.k) return;
    Store.updateTask(t.id, { lane: K.k });
    UI.toast(`Movido para ${K.name}`);
  });

  /* ============================== Início ============================== */
  const boot = () => {
    Store.load();
    Ads.init(window.BORDO_SEED);
    Store.onChange(schedule);
    window.addEventListener('hashchange', () => { UI.closeModal(); UI.closeMenu(); App.render(); });
    App.render();
  };
  window.App = App;

  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const decryptSeed = async (code) => {
    const enc = window.BORDO_SEED_ENC;
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(enc.salt), iterations: enc.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(enc.iv) }, key, b64(enc.data))));
  };
  const CODE_KEY = 'bordo:acesso';
  const appEl = document.getElementById('app');
  const shell = appEl.innerHTML;
  const open = async (code) => {
    window.BORDO_SEED = await decryptSeed(code);
    try { localStorage.setItem(CODE_KEY, code); } catch (err) { /* ignora */ }
    appEl.innerHTML = shell; boot();
  };
  const showLock = () => {
    appEl.innerHTML = `<div class="scene"><div class="orb1"></div><div class="orb2"></div><div class="dots"></div><div class="lock"><form class="glass lock-card" id="lock-form">
      <div class="logo" style="margin:0">U</div><h1>Unlockify · Central</h1><p>Espaço interno da agência. Digite o código de acesso.</p>
      <input class="field" id="lock-code" type="password" autocomplete="current-password" placeholder="Código de acesso" autofocus>
      <div class="small" id="lock-err" style="color:var(--red-text);min-height:18px"></div>
      <button class="btn-gold" style="justify-content:center">Entrar</button></form></div></div>`;
    document.getElementById('lock-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try { await open(document.getElementById('lock-code').value.trim()); } catch (err) { document.getElementById('lock-err').textContent = 'Código incorreto. Confira e tente de novo.'; }
    });
  };
  if (window.BORDO_SEED_ENC && !window.BORDO_SEED) {
    let savedCode = ''; try { savedCode = localStorage.getItem(CODE_KEY) || ''; } catch (err) { savedCode = ''; }
    if (savedCode) open(savedCode).catch(showLock); else showLock();
  } else boot();
})();
