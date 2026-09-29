/* Infraestrutura de UI (ícones, toast, modal, menus) e componentes reutilizáveis. */
(function () {
  const e = U.esc;

  /* ============================== Ícones (traço, 24×24) ============================== */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    tasks: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
    team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.8c1.8.7 3 2.5 3.5 5.2"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/><path d="M8 7h8M8 11h6"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    board: '<rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevR: '<path d="m9 6 6 6-6 6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    ads: '<path d="M3 10v4h4l8 5V5L7 10z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
    status: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2.5"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 12h6M9 16h6M9 8h3"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
    insta: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.8" cy="7.2" r=".6"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  };
  const I = (name, size = 16, extra = '') => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICONS[name] || ''}</svg>`;

  /* ============================== UI infra ============================== */
  const UI = {
    toast(msg, { undo, undoLabel = 'Desfazer', duration = 4000 } = {}) {
      const root = document.getElementById('toast-root');
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `<span>${e(msg)}</span>${undo ? `<button type="button">${e(undoLabel)}</button>` : ''}`;
      root.appendChild(el);
      if (undo) el.querySelector('button').onclick = () => { undo(); el.remove(); };
      setTimeout(() => el.remove(), duration);
    },

    modal(html, { wide = false, className = '', onClose } = {}) {
      UI.closeModal();
      const root = document.getElementById('modal-root');
      root.innerHTML = `<div class="modal-wrap"><div class="overlay" data-modal-close></div><div class="modal ${wide ? 'wide' : ''} ${className}" role="dialog" aria-modal="true">${html}</div></div>`;
      UI._onClose = onClose;
      const modal = root.querySelector('.modal');
      root.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', () => UI.closeModal()));
      const first = modal.querySelector('[autofocus], input:not([type=hidden]):not([type=checkbox]):not([type=date]), textarea');
      if (first) setTimeout(() => first.focus(), 20);
      return modal;
    },
    closeModal() {
      const root = document.getElementById('modal-root');
      if (!root.innerHTML) return false;
      root.innerHTML = '';
      const cb = UI._onClose; UI._onClose = null;
      if (cb) cb();
      return true;
    },
    isModalOpen() { return !!document.getElementById('modal-root').innerHTML; },

    confirm(message, { title = 'Confirmar', ok = 'Confirmar', danger = false } = {}) {
      return new Promise((resolve) => {
        let answered = false;
        const modal = UI.modal(`
          <div class="modal-h"><h2>${e(title)}</h2></div>
          <div class="modal-b"><p style="margin:0">${e(message)}</p></div>
          <div class="modal-f"><button class="btn" data-modal-close>Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${e(ok)}</button></div>`,
        { onClose: () => { if (!answered) resolve(false); } });
        modal.querySelector('[data-ok]').addEventListener('click', () => { answered = true; UI.closeModal(); resolve(true); });
      });
    },

    formData(root) {
      const out = {};
      root.querySelectorAll('[name]').forEach((el) => { out[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
      return out;
    },

    /** Menu suspenso ancorado em um elemento (status, responsável, prioridade, data…). */
    popover(anchor, html, onMount) {
      UI.closePopover();
      const pop = document.createElement('div');
      pop.className = 'pop';
      pop.innerHTML = html;
      document.body.appendChild(pop);
      const r = anchor.getBoundingClientRect();
      const w = pop.offsetWidth, h = pop.offsetHeight;
      const left = Math.min(r.left, window.innerWidth - w - 8);
      let top = r.bottom + 4;
      if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
      pop.style.left = Math.max(8, left) + 'px';
      pop.style.top = top + 'px';
      UI._pop = pop;
      setTimeout(() => document.addEventListener('mousedown', UI._popAway = (ev) => { if (!pop.contains(ev.target)) UI.closePopover(); }), 0);
      if (onMount) onMount(pop);
      return pop;
    },
    menu(anchor, items, onPick) {
      const html = items.map((it, i) => it === '-' ? '<div class="sep"></div>' : `<div class="opt ${it.current ? 'cur' : ''}" data-i="${i}">${it.html || e(it.label)}</div>`).join('');
      return UI.popover(anchor, html, (pop) => {
        pop.querySelectorAll('[data-i]').forEach((o) => o.addEventListener('click', () => { const it = items[Number(o.dataset.i)]; UI.closePopover(); onPick(it.value, it); }));
      });
    },
    closePopover() {
      if (UI._pop) { UI._pop.remove(); UI._pop = null; }
      if (UI._popAway) { document.removeEventListener('mousedown', UI._popAway); UI._popAway = null; }
    },
  };

  /* ============================== Componentes ============================== */
  const M = () => window.META;
  const C = { I };

  C.avatar = (name, cls = '') => name
    ? `<span class="av ${cls}" style="background:${U.hashColor(name)}" title="${e(name)}">${e(U.initials(name))}</span>`
    : `<span class="av empty ${cls}" title="Sem responsável">${I('user', 12)}</span>`;

  C.statusOf = (id) => M().status[id] || M().STATUSES[0];
  C.status = (id, soft) => { const s = C.statusOf(id); return `<span class="st ${soft ? 'soft' : ''}" style="--c:${s.color}">${e(s.label)}</span>`; };
  C.sdot = (id) => { const s = C.statusOf(id); return `<span class="sdot ${id === 'done' ? 'done' : ''}" style="--c:${s.color}">${id === 'done' ? I('check', 9, 'stroke-width="3.5"') : ''}</span>`; };

  const PRIO_COLOR = { urgent: 'var(--red)', high: 'var(--amber)', normal: 'var(--blue)', low: 'var(--gray)' };
  C.prio = (id, label = true) => {
    if (!id || id === 'none') return `<span class="flag" style="--c:var(--line-2)">${I('flag', 14)}</span>`;
    const p = M().priority[id] || M().priority.normal;
    return `<span class="flag" style="--c:${PRIO_COLOR[p.id]}">${I('flag', 14, 'fill="currentColor" fill-opacity=".18"')}${label ? e(p.label) : ''}</span>`;
  };
  C.due = (t) => {
    if (!t.due) return `<span class="due none">${I('calendar', 14)}</span>`;
    const cls = t.status === 'done' ? '' : t.due < U.today() ? 'late' : t.due === U.today() ? 'today' : '';
    return `<span class="due ${cls}" title="${e(U.fmtLong(t.due))}">${e(U.fmtDue(t.due))}</span>`;
  };
  C.clientTag = (clientId) => {
    const c = clientId ? Store.client(clientId) : null;
    if (!c) return '<span class="ctag muted"><span class="sq" style="--c:var(--line-2)"></span>Interno</span>';
    return `<span class="ctag"><span class="sq" style="--c:${e(c.color)}"></span><span class="ellipsis">${e(c.name)}</span></span>`;
  };
  C.folder = (c, size = 16) => `<span class="folder-ic" style="--c:${e(c.color)}">${I('folder', size, 'fill="currentColor" fill-opacity=".25"')}</span>`;
  C.empty = (title, sub = '', action = '') => `<div class="empty"><b>${e(title)}</b>${e(sub)}${action ? `<div style="margin-top:12px">${action}</div>` : ''}</div>`;

  C.meta = (t) => {
    const bits = [];
    if (t.checklist.length) bits.push(`<span title="Checklist">${I('tasks', 12)} ${t.checklist.filter((i) => i.done).length}/${t.checklist.length}</span>`);
    if (t.comments.length) bits.push(`<span title="Comentários">${I('msg', 12)} ${t.comments.length}</span>`);
    if (t.description) bits.push(`<span title="Tem descrição">${I('note', 12)}</span>`);
    (t.tags || []).filter((x) => x !== 'Produção de criativos').slice(0, 2).forEach((x) => bits.push(`<span class="tag">${e(x)}</span>`));
    return bits.length ? `<span class="meta">${bits.join('')}</span>` : '';
  };

  /* ---------- Lista (agrupada) ---------- */
  const cols = ({ showClient, showStatus }) => ['minmax(260px,1fr)', showClient ? '180px' : null, '110px', '120px', '110px', showStatus ? '160px' : null].filter(Boolean).join(' ');

  C.row = (t, o) => `
    <div class="tr ${t.status === 'done' ? 'done' : ''}" data-action="open-task" data-id="${t.id}">
      <div class="name"><button class="cell-btn" data-action="pick-status" data-id="${t.id}" title="Mudar status">${C.sdot(t.status)}</button><span class="t">${e(t.title)}</span>${C.meta(t)}</div>
      ${o.showClient ? `<div class="ellipsis">${C.clientTag(t.clientId)}</div>` : ''}
      <div><button class="cell-btn" data-action="pick-assignee" data-id="${t.id}" title="${e(t.assignee || 'Definir responsável')}">${C.avatar(t.assignee)}</button></div>
      <div><button class="cell-btn" data-action="pick-due" data-id="${t.id}">${C.due(t)}</button></div>
      <div><button class="cell-btn" data-action="pick-prio" data-id="${t.id}">${C.prio(t.priority)}</button></div>
      ${o.showStatus ? `<div><button class="cell-btn" data-action="pick-status" data-id="${t.id}">${C.status(t.status, true)}</button></div>` : ''}
    </div>`;

  C.groupTasks = (tasks, by) => {
    const T = U.today();
    const g = [];
    const push = (key, head, items, defaults = {}) => g.push({ key, head, items, defaults });
    if (by === 'status') {
      M().STATUSES.forEach((s) => push('s:' + s.id, C.status(s.id), tasks.filter((t) => t.status === s.id), { status: s.id }));
    } else if (by === 'assignee') {
      const names = [...new Set([...(Store.settings.team || []), ...tasks.map((t) => t.assignee || '')])];
      names.forEach((n) => push('a:' + n, `<span class="row">${C.avatar(n)}<b>${e(n || 'Sem responsável')}</b></span>`, tasks.filter((t) => (t.assignee || '') === n), { assignee: n }));
    } else if (by === 'client') {
      Store.clients().forEach((c) => push('c:' + c.id, `<span class="row">${C.folder(c)}<b>${e(c.name)}</b></span>`, tasks.filter((t) => t.clientId === c.id), { clientId: c.id }));
      push('c:', '<span class="row"><b>Interno</b></span>', tasks.filter((t) => !t.clientId), { clientId: '' });
    } else if (by === 'priority') {
      M().PRIORITIES.forEach((p) => push('p:' + p.id, `<b>${C.prio(p.id)}</b>`, tasks.filter((t) => t.priority === p.id), { priority: p.id }));
    } else {
      const open = tasks.filter((t) => t.status !== 'done');
      const lbl = (txt, color) => `<span class="st" style="--c:${color}">${txt}</span>`;
      push('d:late', lbl('Atrasadas', 'var(--red)'), open.filter((t) => t.due && t.due < T), { due: T });
      push('d:today', lbl('Hoje', 'var(--amber)'), open.filter((t) => t.due === T), { due: T });
      push('d:next', lbl('Próximos 7 dias', 'var(--blue)'), open.filter((t) => t.due > T && t.due <= U.addDays(T, 7)), { due: U.addDays(T, 1) });
      push('d:later', lbl('Mais tarde', '#8b5cf6'), open.filter((t) => t.due > U.addDays(T, 7)), {});
      push('d:none', lbl('Sem data', 'var(--gray)'), open.filter((t) => !t.due), { due: '' });
      push('d:done', lbl('Concluídas', 'var(--green)'), tasks.filter((t) => t.status === 'done'), { status: 'done' });
    }
    return g;
  };

  C.taskList = (tasks, { groupBy = 'status', showClient = true, defaults = {}, open = [] } = {}) => {
    const showStatus = groupBy !== 'status';
    const o = { showClient, showStatus };
    const groups = C.groupTasks(Store.sortTasks(tasks), groupBy).filter((g, i) => g.items.length || (groupBy === 'status' && i === 0));
    if (!groups.length) return C.empty('Nenhuma tarefa', 'Crie a primeira tarefa com o botão "Tarefa".');
    return groups.map((g) => {
      const isDone = g.key === 's:done' || g.key === 'd:done';
      const closed = isDone ? !open.includes(g.key) : open.includes('x' + g.key);
      const d = { ...defaults, ...g.defaults };
      return `
      <section class="grp ${closed ? 'closed' : ''}">
        <div class="grp-h"><button class="caret" data-action="toggle-group" data-key="${e(g.key)}" aria-label="Recolher">${I('chevD', 14)}</button>${g.head}<span class="n">${g.items.length}</span></div>
        <div class="tbl" style="--cols:${cols(o)}">
          <div class="tr th"><span style="padding-left:22px">Nome</span>${showClient ? '<span>Cliente</span>' : ''}<span>Responsável</span><span>Vencimento</span><span>Prioridade</span>${showStatus ? '<span>Status</span>' : ''}</div>
          ${g.items.map((t) => C.row(t, o)).join('')}
          ${isDone ? '' : `<div class="qadd">${I('plus', 14)}<input data-quickadd='${e(JSON.stringify(d))}' placeholder="Adicionar tarefa"></div>`}
        </div>
      </section>`;
    }).join('');
  };

  /* ---------- Quadro ---------- */
  C.card = (t, showClient) => `
    <div class="card" draggable="true" data-drag-task="${t.id}" data-action="open-task" data-id="${t.id}">
      ${showClient ? `<div class="small">${C.clientTag(t.clientId)}</div>` : ''}
      <div class="ct">${e(t.title)}</div>
      <div class="cf">${C.due(t)}${C.prio(t.priority, false)}${C.meta(t)}${C.avatar(t.assignee)}</div>
    </div>`;

  C.board = (tasks, { showClient = true, defaults = {}, by = 'status' } = {}) => {
    const sorted = Store.sortTasks(tasks);
    const colsList = by === 'assignee'
      ? [...new Set([...(Store.settings.team || []), ...tasks.map((t) => t.assignee || '')])].map((n) => ({ head: `${C.avatar(n)}<b>${e(n || 'Sem responsável')}</b>`, items: sorted.filter((t) => (t.assignee || '') === n), drop: `data-drop-assignee="${e(n)}"`, def: { assignee: n } }))
      : M().STATUSES.map((s) => ({ head: C.status(s.id), items: sorted.filter((t) => t.status === s.id), drop: `data-drop-status="${s.id}"`, def: { status: s.id } }));
    return `<div class="board">${colsList.map((c) => `
      <div class="col" ${c.drop}>
        <div class="col-h">${c.head}<span class="n">${c.items.length}</span></div>
        <div class="cards">${c.items.map((t) => C.card(t, showClient)).join('')}</div>
        <button class="col-add" data-action="new-task" data-defaults='${e(JSON.stringify({ ...defaults, ...c.def }))}'>${I('plus', 14)} Adicionar tarefa</button>
      </div>`).join('')}</div>`;
  };

  /* ---------- Diário de bordo (tabela no formato da planilha) ---------- */
  const IMPACT = { positivo: ['Bom', 'var(--green)'], neutro: ['Neutro', 'var(--gray)'], negativo: ['Ruim', 'var(--red)'] };
  C.diaryComposer = ({ clientId, withClient }) => `
    <div class="composer" id="composer">
      <div class="composer-grid ${withClient ? 'with-client' : ''}">
        <div><label for="cp-date">Data</label><input type="date" id="cp-date" name="date" value="${U.today()}"></div>
        ${withClient ? `<div><label for="cp-client">Cliente</label><select id="cp-client" name="clientId"><option value="">Escolha…</option>${Store.clients({ includeClosed: false }).map((c) => `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${e(c.name)}</option>`).join('')}</select></div>` : ''}
        <div><label for="cp-a">Análise</label><textarea id="cp-a" name="analysis" placeholder="Como está a campanha? Leads, CPL, gasto…"></textarea></div>
        <div><label for="cp-p">Ações programadas p/ melhoria</label><textarea id="cp-p" name="planned" placeholder="O que precisa ser feito"></textarea></div>
        <div><label for="cp-d">Ações realizadas</label><textarea id="cp-d" name="actionsDone" placeholder="O que foi feito"></textarea></div>
      </div>
      <div class="composer-foot">
        <span class="note">A análise é feita sempre na janela do dia anterior e de uma semana para trás.</span>
        <select class="chipsel" name="impact" id="cp-impact" style="margin-left:auto"><option value="neutro">Resultado: neutro</option><option value="positivo">Resultado: bom</option><option value="negativo">Resultado: ruim</option></select>
        <label class="row small" title="Cria uma tarefa com a ação programada"><input type="checkbox" class="check" name="plannedTask" id="cp-task"> Virar tarefa</label>
        <button class="btn btn-primary btn-sm" data-action="submit-composer" data-client="${e(clientId || '')}">Adicionar ao diário</button>
      </div>
    </div>`;

  C.diaryTable = (logs, { showClient = false } = {}) => {
    if (!logs.length) return C.empty('Nenhuma atualização no diário', 'Use o campo acima para registrar a primeira.');
    return `<table class="dt"><thead><tr><th>Data</th>${showClient ? '<th>Cliente</th>' : ''}<th>Análise</th><th>Ações programadas p/ melhoria</th><th>Ações realizadas</th><th>Por</th></tr></thead><tbody>
      ${logs.map((l) => {
        const c = showClient ? Store.client(l.clientId) : null;
        const [lbl, col] = IMPACT[l.impact] || IMPACT.neutro;
        const a = l.analysis || [l.title, l.body].filter(Boolean).join(' — ');
        return `<tr data-action="edit-log" data-id="${l.id}">
          <td class="top date"><span class="res" style="background:${col}" title="Resultado: ${lbl}"></span>${U.fmtDate(l.date, true)}<div class="small muted" style="padding-left:14px">${U.WD[U.parse(l.date).getDay()]}</div></td>
          ${showClient ? `<td class="top">${c ? `<span class="ctag"><span class="sq" style="--c:${e(c.color)}"></span>${e(c.name)}</span>` : ''}</td>` : ''}
          <td class="top wrap">${e(a)}</td>
          <td class="top wrap">${e(l.planned || '')}${l.plannedTaskId ? ' <span class="tag">tarefa criada</span>' : ''}</td>
          <td class="top wrap">${e(l.actionsDone || '')}</td>
          <td class="top">${l.author ? C.avatar(l.author) : ''}</td>
        </tr>`;
      }).join('')}</tbody></table>`;
  };

  window.UI = UI;
  window.C = C;
})();
