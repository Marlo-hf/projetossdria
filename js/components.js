/* Infraestrutura de UI (toast, modal, confirmação) e componentes reutilizáveis. */
(function () {
  const e = U.esc;

  /* ============================== UI infra ============================== */
  const UI = {
    toast(msg, { undo, undoLabel = 'Desfazer', duration = 4200 } = {}) {
      const root = document.getElementById('toast-root');
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `<span>${e(msg)}</span>${undo ? `<button type="button">${e(undoLabel)}</button>` : ''}`;
      root.appendChild(el);
      const kill = () => el.remove();
      if (undo) el.querySelector('button').onclick = () => { undo(); kill(); };
      setTimeout(kill, duration);
    },

    modal(html, { wide = false, className = '', onMount, onClose } = {}) {
      UI.closeModal();
      const root = document.getElementById('modal-root');
      root.innerHTML = `<div class="modal-wrap"><div class="overlay" data-modal-close></div><div class="modal ${wide ? 'wide' : ''} ${className}" role="dialog" aria-modal="true">${html}</div></div>`;
      UI._onClose = onClose;
      const modal = root.querySelector('.modal');
      root.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', () => UI.closeModal()));
      if (onMount) onMount(modal);
      const first = modal.querySelector('[autofocus], input:not([type=hidden]):not([type=checkbox]), textarea, select');
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
          <div class="modal-head"><h2>${e(title)}</h2></div>
          <div class="modal-body"><p style="margin:0">${e(message)}</p></div>
          <div class="modal-foot">
            <button class="btn" data-modal-close>Cancelar</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${e(ok)}</button>
          </div>`, { onClose: () => { if (!answered) resolve(false); } });
        modal.querySelector('[data-ok]').addEventListener('click', () => { answered = true; UI.closeModal(); resolve(true); });
        setTimeout(() => modal.querySelector('[data-ok]').focus(), 30);
      });
    },

    /** Lê os campos [name] de um formulário para um objeto. */
    formData(root) {
      const out = {};
      root.querySelectorAll('[name]').forEach((el) => {
        if (el.type === 'checkbox') out[el.name] = el.checked;
        else out[el.name] = el.value.trim();
      });
      return out;
    },
  };

  /* ============================== Componentes ============================== */
  const M = () => window.META;

  const C = {};

  C.avatar = (name, cls = '') => name
    ? `<span class="avatar ${cls}" style="background:${U.hashColor(name)}" title="${e(name)}">${e(U.initials(name))}</span>`
    : `<span class="avatar ${cls}" style="background:var(--surface-3);color:var(--muted)" title="Sem responsável">–</span>`;

  C.clientAvatar = (c, cls = 'md') => `<span class="avatar ${cls}" style="background:${e(c.color)}">${e(U.initials(c.name))}</span>`;

  C.clientChip = (clientId) => {
    const c = clientId ? Store.client(clientId) : null;
    if (!c) return '<span class="client-chip muted"><span class="dot" style="background:var(--border-strong)"></span>Interno</span>';
    return `<span class="client-chip"><span class="dot" style="background:${e(c.color)}"></span><span class="ellipsis">${e(c.name)}</span></span>`;
  };

  C.statusPill = (id) => {
    const s = M().status[id] || M().STATUSES[0];
    return `<span class="pill" style="color:${s.color};background:${s.color}1f">${e(s.label)}</span>`;
  };
  C.clientStatusPill = (id) => {
    const s = M().clientStatus[id] || M().CLIENT_STATUSES[1];
    return `<span class="pill" style="color:${s.color};background:${s.color}1f">${e(s.label)}</span>`;
  };
  C.prio = (id) => {
    const p = M().priority[id] || M().priority.normal;
    return `<span class="prio" style="color:${p.color}"><span class="flag">⚑</span>${e(p.label)}</span>`;
  };
  C.due = (t) => {
    if (!t.due) return '<span class="due none">Sem prazo</span>';
    const cls = t.status === 'done' ? '' : t.due < U.today() ? 'overdue' : t.due === U.today() ? 'today' : '';
    return `<span class="due ${cls}" title="${e(U.fmtLong(t.due))}">${e(U.fmtDue(t.due))}</span>`;
  };
  C.health = (h, lg) => {
    if (h.score == null) return `<div class="health ${lg ? 'lg' : ''}" style="--p:0"><span>—</span></div>`;
    const col = h.level === 'good' ? 'var(--good)' : h.level === 'warn' ? 'var(--warn)' : 'var(--bad)';
    return `<div class="health ${lg ? 'lg' : ''}" style="--p:${h.score};--c:${col}" title="Saúde: ${h.score}/100 — ${e(h.reasons.join(' · '))}"><span>${h.score}</span></div>`;
  };
  C.healthColor = (h) => h.score == null ? 'var(--border-strong)' : h.level === 'good' ? 'var(--good)' : h.level === 'warn' ? 'var(--warn)' : 'var(--bad)';

  C.empty = (icon, title, sub = '', action = '') => `
    <div class="empty"><div class="big">${icon}</div><strong>${e(title)}</strong>${sub ? `<div>${e(sub)}</div>` : ''}${action ? `<div style="margin-top:12px">${action}</div>` : ''}</div>`;

  C.taskMeta = (t) => {
    const bits = [];
    if (t.checklist.length) {
      const d = t.checklist.filter((i) => i.done).length;
      bits.push(`<span title="Checklist">☑ ${d}/${t.checklist.length}</span>`);
    }
    if (t.comments.length) bits.push(`<span title="Comentários">💬 ${t.comments.length}</span>`);
    if (t.recurrence && t.recurrence !== 'none') bits.push('<span title="Recorrente">🔁</span>');
    if (t.description) bits.push('<span title="Tem descrição">≡</span>');
    const tags = (t.tags || []).slice(0, 3).map((x) => `<span class="tag">${e(x)}</span>`).join('');
    return `<span class="t-meta">${tags}${bits.join('')}</span>`;
  };

  C.taskRow = (t, { showClient = true } = {}) => `
    <div class="task-row ${t.status === 'done' ? 'done' : ''} ${showClient ? '' : 'no-client'}" data-action="open-task" data-id="${t.id}">
      <input type="checkbox" class="check" data-action="toggle-done" data-id="${t.id}" ${t.status === 'done' ? 'checked' : ''} aria-label="Concluir">
      <div class="t-title"><span class="name">${e(t.title)}</span>${C.taskMeta(t)}</div>
      ${showClient ? `<div class="c-client">${C.clientChip(t.clientId)}</div>` : ''}
      <div class="c-assignee">${C.avatar(t.assignee)}</div>
      <div>${C.due(t)}</div>
      <div class="c-prio">${C.prio(t.priority)}</div>
      <div class="c-status">${C.statusPill(t.status)}</div>
    </div>`;

  C.taskHead = (showClient) => `
    <div class="task-row head ${showClient ? '' : 'no-client'}">
      <span></span><span>Tarefa</span>${showClient ? '<span class="c-client">Cliente</span>' : ''}<span class="c-assignee">Resp.</span><span>Prazo</span><span class="c-prio">Prioridade</span><span class="c-status">Status</span>
    </div>`;

  /** Agrupa tarefas conforme o critério escolhido. */
  C.groupTasks = (tasks, groupBy) => {
    const T = U.today();
    const groups = [];
    const push = (key, label, color, items, defaults = {}) => groups.push({ key, label, color, items, defaults });
    if (groupBy === 'status') {
      M().STATUSES.forEach((s) => push('s:' + s.id, s.label, s.color, tasks.filter((t) => t.status === s.id), { status: s.id }));
    } else if (groupBy === 'priority') {
      M().PRIORITIES.forEach((p) => push('p:' + p.id, p.label, p.color, tasks.filter((t) => t.priority === p.id && t.status !== 'done'), { priority: p.id }));
      push('p:done', 'Concluídas', '#12a36b', tasks.filter((t) => t.status === 'done'), { status: 'done' });
    } else if (groupBy === 'client') {
      const ids = [...new Set(tasks.map((t) => t.clientId || ''))];
      const cs = Store.clients().filter((c) => ids.includes(c.id));
      cs.forEach((c) => push('c:' + c.id, c.name, c.color, tasks.filter((t) => t.clientId === c.id), { clientId: c.id }));
      if (ids.includes('')) push('c:', 'Interno (sem cliente)', '#8b93a7', tasks.filter((t) => !t.clientId), { clientId: '' });
    } else if (groupBy === 'assignee') {
      const names = [...new Set(tasks.map((t) => t.assignee || ''))].sort();
      names.forEach((n) => push('a:' + n, n || 'Sem responsável', n ? U.hashColor(n) : '#8b93a7', tasks.filter((t) => (t.assignee || '') === n), { assignee: n }));
    } else {
      const open = tasks.filter((t) => t.status !== 'done');
      const wkEnd = U.addDays(U.weekStart(T), 6);
      push('d:overdue', 'Atrasadas', '#e0443e', open.filter((t) => t.due && t.due < T), { due: T });
      push('d:today', 'Hoje', '#d88a06', open.filter((t) => t.due === T), { due: T });
      push('d:tomorrow', 'Amanhã', '#2f7de1', open.filter((t) => t.due === U.addDays(T, 1)), { due: U.addDays(T, 1) });
      push('d:week', 'Ainda esta semana', '#5b5bd6', open.filter((t) => t.due > U.addDays(T, 1) && t.due <= wkEnd), { due: wkEnd });
      push('d:later', 'Mais tarde', '#9333ea', open.filter((t) => t.due > wkEnd && t.due > U.addDays(T, 1)), {});
      push('d:none', 'Sem prazo', '#8b93a7', open.filter((t) => !t.due), { due: '' });
      push('d:done', 'Concluídas', '#12a36b', tasks.filter((t) => t.status === 'done'), { status: 'done' });
    }
    return groups;
  };

  C.taskList = (tasks, { groupBy = 'status', showClient = true, defaults = {}, collapsed = [] } = {}) => {
    const groups = C.groupTasks(Store.sortTasks(tasks), groupBy);
    const visible = groups.filter((g) => g.items.length || ['s:todo', 'd:today', 'c:' + (defaults.clientId || '')].includes(g.key) || (groupBy === 'status' && g.key !== 's:done'));
    if (!tasks.length && !visible.length) return C.empty('🗂️', 'Nenhuma tarefa aqui', 'Crie a primeira tarefa para começar.');
    return visible.map((g) => {
      const isCol = collapsed.includes(g.key) || (g.key.endsWith(':done') && !collapsed.includes('open:' + g.key));
      const d = { ...defaults, ...g.defaults };
      return `
      <section class="task-group">
        <div class="group-head ${isCol ? 'collapsed' : ''}" data-action="toggle-group" data-key="${e(g.key)}">
          <span class="caret">▼</span><span class="gbar" style="background:${e(g.color)}"></span>
          <span>${e(g.label)}</span><span class="gcount">${g.items.length}</span>
        </div>
        ${isCol ? '' : `
        <div class="task-table">
          ${g.items.length ? C.taskHead(showClient) : ''}
          ${g.items.map((t) => C.taskRow(t, { showClient })).join('')}
          ${g.key.endsWith(':done') ? '' : `<div class="quick-add"><span class="muted">＋</span><input data-quickadd='${e(JSON.stringify(d))}' placeholder="Adicionar tarefa e pressionar Enter…"></div>`}
        </div>`}
      </section>`;
    }).join('');
  };

  C.kanban = (tasks, { showClient = true, defaults = {} } = {}) => {
    const sorted = Store.sortTasks(tasks);
    return `<div class="kanban">${M().STATUSES.map((s) => {
      const items = sorted.filter((t) => t.status === s.id);
      return `
      <div class="k-col" data-drop-status="${s.id}">
        <div class="k-col-head"><span class="gbar" style="width:4px;height:14px;border-radius:2px;background:${s.color}"></span>${e(s.label)}<span class="muted" style="font-weight:600">${items.length}</span></div>
        <div class="k-cards">
          ${items.map((t) => {
            const p = M().priority[t.priority] || M().priority.normal;
            const ckd = t.checklist.filter((i) => i.done).length;
            return `
            <div class="k-card" draggable="true" data-drag-task="${t.id}" data-action="open-task" data-id="${t.id}" style="border-left-color:${p.color}">
              ${showClient ? `<div style="margin-bottom:4px">${C.clientChip(t.clientId)}</div>` : ''}
              <div class="k-title">${e(t.title)}</div>
              ${t.checklist.length ? `<div class="progress" style="margin-bottom:8px"><span style="width:${(ckd / t.checklist.length) * 100}%"></span></div>` : ''}
              <div class="k-foot">${C.due(t)}${C.taskMeta(t)}<span style="margin-left:auto">${C.avatar(t.assignee)}</span></div>
            </div>`;
          }).join('')}
        </div>
        <button class="k-add" data-action="new-task" data-defaults='${e(JSON.stringify({ ...defaults, status: s.id }))}'>＋ Nova tarefa</button>
      </div>`;
    }).join('')}</div>`;
  };

  /* ---------- Diário ---------- */
  C.logCard = (l, { showClient = false } = {}) => {
    const tp = M().logType[l.type] || M().logType.nota;
    const c = l.clientId ? Store.client(l.clientId) : null;
    const m = l.metrics || {};
    const chips = [];
    if (m.spend != null && m.spend !== '') chips.push(`Invest. ${U.fmtMoney(m.spend)}`);
    if (m.leads != null && m.leads !== '') chips.push(`${U.fmtNum(m.leads)} leads`);
    if (m.spend && m.leads) chips.push(`CPL ${U.fmtMoney(m.spend / m.leads)}`);
    if (m.contracts != null && m.contracts !== '') chips.push(`${U.fmtNum(m.contracts)} contratos`);
    const task = l.taskId ? Store.task(l.taskId) : null;
    return `
    <article class="card log-card ${l.pinned ? 'pinned' : ''}" data-icon="${tp.icon}" id="log-${l.id}">
      <div class="l-head">
        <span class="l-type">${tp.icon} ${e(tp.label)}</span>
        ${showClient && c ? `<a class="log-client" href="#/cliente/${c.id}/diario"><span class="dot" style="background:${e(c.color)}"></span>${e(c.name)}</a>` : ''}
        <span class="l-time">${e(l.time || '')}${l.author ? ' · ' + e(l.author) : ''}${l.auto ? ' · automático' : ''}${l.editedAt ? ' · editado' : ''}</span>
        ${l.pinned ? '<span title="Fixado">📌</span>' : ''}
        ${l.impact && l.impact !== 'neutro' ? `<span class="impact ${l.impact}">${l.impact === 'positivo' ? '▲ Positivo' : '▼ Negativo'}</span>` : ''}
        <div class="l-actions">
          <button class="icon-btn sm" data-action="pin-log" data-id="${l.id}" title="${l.pinned ? 'Desafixar' : 'Fixar'}">📌</button>
          <button class="icon-btn sm" data-action="edit-log" data-id="${l.id}" title="Editar">✏️</button>
          <button class="icon-btn sm" data-action="log-to-task" data-id="${l.id}" title="Criar tarefa a partir deste registro">➕</button>
          <button class="icon-btn sm" data-action="delete-log" data-id="${l.id}" title="Excluir">🗑️</button>
        </div>
      </div>
      ${l.title ? `<div class="l-title">${e(l.title)}</div>` : ''}
      ${l.body ? `<div class="l-body">${U.rich(l.body)}</div>` : ''}
      ${C.logSections(l)}
      ${chips.length || (l.tags || []).length || task ? `<div class="l-foot">
        ${chips.length ? `<div class="metric-chips">${chips.map((x) => `<span class="metric-chip">${e(x)}</span>`).join('')}</div>` : ''}
        ${(l.tags || []).map((x) => `<span class="tag">#${e(x)}</span>`).join('')}
        ${task ? `<a href="javascript:void 0" data-action="open-task" data-id="${task.id}" class="small">🔗 ${e(task.title)}</a>` : ''}
      </div>` : ''}
    </article>`;
  };

  /** Os três campos do diário (igual à planilha): análise, ações programadas, ações realizadas. */
  C.logSections = (l) => {
    if (!l.analysis && !l.planned && !l.actionsDone) return '';
    const block = (cls, label, text, extra = '') => text ? `<div class="l-sec ${cls}"><div class="l-sec-h">${label}${extra}</div><div class="l-body">${U.rich(text)}</div></div>` : '';
    const pending = l.planned && !l.actionsDone && !l.plannedTaskId;
    return `<div class="l-secs">
      ${block('sec-a', '🔎 Análise', l.analysis)}
      ${block('sec-p', '🎯 Ações programadas p/ melhoria', l.planned, l.plannedTaskId ? ' <span class="tag">tarefa criada</span>' : pending ? ` <button class="btn btn-sm btn-ghost" data-action="planned-to-task" data-id="${l.id}" title="Criar tarefa com esta ação">➕ virar tarefa</button>` : '')}
      ${block('sec-d', '✅ Ações realizadas', l.actionsDone)}
    </div>`;
  };

  /** Visão "planilha" do diário — mesmas colunas da planilha de diário de bordo. */
  C.logTable = (logs, { showClient = false } = {}) => {
    if (!logs.length) return C.empty('📓', 'Nenhum registro encontrado');
    const imp = { positivo: '🟢', neutro: '⚪', negativo: '🔴' };
    const cell = (l) => {
      if (l.analysis || l.planned || l.actionsDone) return [l.analysis || l.title, l.planned, l.actionsDone];
      const tp = M().logType[l.type] || M().logType.nota;
      return [`${tp.icon} ${[l.title, l.body].filter(Boolean).join(' — ')}`, '', ''];
    };
    return `<div class="card table-wrap"><table class="data sheet">
      <thead><tr><th>Data</th>${showClient ? '<th>Cliente</th>' : ''}<th></th><th>Análise</th><th>Ações programadas p/ melhoria</th><th>Ações realizadas</th><th></th></tr></thead>
      <tbody>${logs.map((l) => {
        const [a, p, d] = cell(l);
        const c = showClient ? Store.client(l.clientId) : null;
        return `<tr data-action="edit-log" data-id="${l.id}" style="cursor:pointer">
          <td><b>${U.fmtDate(l.date, true)}</b><div class="small muted">${U.WD[U.parse(l.date).getDay()]}</div></td>
          ${showClient ? `<td>${c ? `<span class="client-chip"><span class="dot" style="background:${e(c.color)}"></span>${e(c.name)}</span>` : ''}</td>` : ''}
          <td title="${e(l.impact)}">${imp[l.impact] || ''}</td>
          <td class="wrap">${U.rich(a || '')}</td><td class="wrap">${U.rich(p || '')}</td><td class="wrap">${U.rich(d || '')}</td>
          <td>${l.pinned ? '📌' : ''}</td>
        </tr>`;
      }).join('')}</tbody></table></div>`;
  };

  C.timeline = (logs, { showClient = false } = {}) => {
    if (!logs.length) return C.empty('📓', 'Nenhum registro encontrado', 'Use o campo acima para registrar a primeira entrada.');
    const pinned = logs.filter((l) => l.pinned);
    const byDay = new Map();
    logs.forEach((l) => { if (!byDay.has(l.date)) byDay.set(l.date, []); byDay.get(l.date).push(l); });
    let html = '';
    if (pinned.length) {
      html += `<div class="day-group"><div class="day-head"><div class="d-num">📌</div><span class="d-label">Fixados</span><span class="d-count">${pinned.length}</span></div>
        <div class="day-entries">${pinned.map((l) => C.logCard(l, { showClient: true })).join('')}</div></div>`;
    }
    for (const [date, items] of byDay) {
      const d = U.parse(date);
      html += `
      <div class="day-group">
        <div class="day-head">
          <div class="d-num"><div><b>${d.getDate()}</b><small>${U.MONTHS[d.getMonth()]}</small></div></div>
          <span class="d-label">${e(U.fmtDayLabel(date))}</span>
          <span class="d-count">· ${items.length} registro${items.length > 1 ? 's' : ''}</span>
        </div>
        <div class="day-entries">${items.map((l) => C.logCard(l, { showClient })).join('')}</div>
      </div>`;
    }
    return `<div class="timeline">${html}</div>`;
  };

  /** Calendário de calor com os registros das últimas 5 semanas */
  C.heatmap = (logs) => {
    const T = U.today();
    const start = U.addDays(U.weekStart(T), -28);
    const counts = {};
    logs.filter((l) => !l.auto).forEach((l) => { counts[l.date] = (counts[l.date] || 0) + 1; });
    let cells = '';
    for (let i = 0; i < 35; i++) {
      const day = U.addDays(start, i);
      const n = counts[day] || 0;
      const lv = n === 0 ? '' : n === 1 ? 'l1' : n <= 3 ? 'l2' : 'l3';
      const future = day > T;
      cells += `<span class="${lv} ${day === T ? 'today' : ''}" style="${future ? 'opacity:.35' : ''}" title="${U.fmtDate(day)}: ${n} registro(s)"></span>`;
    }
    return `<div class="heat">${cells}</div>
      <div class="row small muted" style="margin-top:6px;justify-content:space-between"><span>${U.fmtDate(start)}</span><span>hoje</span></div>`;
  };

  /* ---------- Gráficos ---------- */
  /** Barras + linha. data: [{label, bar, line}] */
  C.comboChart = (data, { barColor = 'var(--accent)', lineColor = 'var(--warn)', lineFmt = (v) => v, barFmt = (v) => v, target } = {}) => {
    if (!data.length) return '';
    const W = 640, H = 220, P = { l: 40, r: 48, t: 14, b: 26 };
    const iw = W - P.l - P.r, ih = H - P.t - P.b;
    const maxB = Math.max(1, ...data.map((d) => d.bar || 0)) * 1.15;
    const lines = data.map((d) => d.line).filter((v) => v != null);
    const maxL = Math.max(1, ...lines, target || 0) * 1.2;
    const bw = Math.min(46, (iw / data.length) * 0.55);
    const x = (i) => P.l + (iw / data.length) * (i + 0.5);
    const yb = (v) => P.t + ih - (v / maxB) * ih;
    const yl = (v) => P.t + ih - (v / maxL) * ih;
    let s = '';
    for (let g = 0; g <= 4; g++) {
      const y = P.t + (ih / 4) * g;
      s += `<line class="grid-line" x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/>`;
      s += `<text x="${P.l - 6}" y="${y + 3}" text-anchor="end">${barFmt(Math.round(maxB - (maxB / 4) * g))}</text>`;
      s += `<text x="${W - P.r + 6}" y="${y + 3}">${lineFmt(maxL - (maxL / 4) * g)}</text>`;
    }
    data.forEach((d, i) => {
      const h = ((d.bar || 0) / maxB) * ih;
      s += `<rect x="${x(i) - bw / 2}" y="${yb(d.bar || 0)}" width="${bw}" height="${Math.max(0, h)}" rx="4" fill="${barColor}" opacity=".85"><title>${U.esc(d.label)}: ${barFmt(d.bar || 0)}</title></rect>`;
      s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${U.esc(d.label)}</text>`;
    });
    if (target) {
      s += `<line x1="${P.l}" x2="${W - P.r}" y1="${yl(target)}" y2="${yl(target)}" stroke="${lineColor}" stroke-dasharray="4 4" opacity=".6"/>`;
      s += `<text x="${W - P.r - 4}" y="${yl(target) - 5}" text-anchor="end" style="fill:${lineColor}">meta</text>`;
    }
    const pts = data.map((d, i) => d.line != null ? [x(i), yl(d.line)] : null).filter(Boolean);
    if (pts.length > 1) s += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    data.forEach((d, i) => { if (d.line != null) s += `<circle cx="${x(i)}" cy="${yl(d.line)}" r="4" fill="var(--surface)" stroke="${lineColor}" stroke-width="2.5"><title>${U.esc(d.label)}: ${lineFmt(d.line)}</title></circle>`; });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">${s}</svg>`;
  };

  C.miniBars = (values, labels, highlightLast = true) => {
    const max = Math.max(1, ...values);
    return `<div class="bars">${values.map((v, i) => `
      <div class="b ${highlightLast && i === values.length - 1 ? 'today' : ''}" title="${U.esc(labels[i])}: ${v}">
        <small>${v || ''}</small><span style="height:${(v / max) * 70}%"></span><small>${U.esc(labels[i])}</small>
      </div>`).join('')}</div>`;
  };

  window.UI = UI;
  window.C = C;
})();
