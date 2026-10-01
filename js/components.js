/* Ícones, infraestrutura de UI (toast, modal, menus), números do Meta Ads por período e peças reutilizáveis. */
(function () {
  const e = U.esc;

  /* ============================== Ícones ============================== */
  const P = {
    painel: 'M4 13h6V4H4zM14 20h6V11h-6zM4 20h6v-3H4zM14 7h6V4h-6z',
    diario: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM9 9h6M9 13h4',
    clientes: 'M3 7h18v13H3zM8 7V4h8v3',
    equipe: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 3.5a4 4 0 0 1 0 7.5M22 21c0-3-1.5-5-4-5.7',
    criativos: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01',
    ajustes: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
    spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
    back: 'm15 6-6 6 6 6',
    plus: 'M12 5v14M5 12h14',
    x: 'M6 6l12 12M18 6 6 18',
    check: 'm5 12 5 5 9-10',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
    send: 'M12 19V5M5 12l7-7 7 7',
    stop: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9h6v6H9z',
    up: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    zero: 'M12 8v5M12 16.5v.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
    book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
    upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  };
  const I = (n, s = 18, w = 1.9) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || ''}"/></svg>`;

  /* ============================== UI ============================== */
  const UI = {
    toast(msg, { undo, undoLabel = 'Desfazer', duration = 4000 } = {}) {
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `<span>${e(msg)}</span>${undo ? `<button type="button">${e(undoLabel)}</button>` : ''}`;
      document.getElementById('toast-root').appendChild(el);
      if (undo) el.querySelector('button').onclick = () => { undo(); el.remove(); };
      setTimeout(() => el.remove(), duration);
    },
    modal(html, { wide = false, onClose } = {}) {
      UI.closeModal();
      const root = document.getElementById('modal-root');
      root.innerHTML = `<div class="modal-wrap"><div class="overlay" data-modal-close></div><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
      UI._onClose = onClose;
      root.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', () => UI.closeModal()));
      const m = root.querySelector('.modal');
      const f = m.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 30);
      return m;
    },
    closeModal() {
      const root = document.getElementById('modal-root');
      if (!root.innerHTML) return false;
      root.innerHTML = '';
      const cb = UI._onClose; UI._onClose = null; if (cb) cb();
      return true;
    },
    isModalOpen() { return !!document.getElementById('modal-root').innerHTML; },
    confirm(message, { title = 'Confirmar', ok = 'Confirmar', danger = false } = {}) {
      return new Promise((resolve) => {
        let done = false;
        const m = UI.modal(`<div class="modal-h"><h2>${e(title)}</h2></div><div class="modal-b"><p style="margin:0;color:var(--text-2)">${e(message)}</p></div>
          <div class="modal-f"><button class="btn" data-modal-close>Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-violet'}" data-ok>${e(ok)}</button></div>`,
        { onClose: () => { if (!done) resolve(false); } });
        m.querySelector('[data-ok]').addEventListener('click', () => { done = true; UI.closeModal(); resolve(true); });
      });
    },
    formData(root) {
      const o = {};
      root.querySelectorAll('[name]').forEach((el) => { o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
      return o;
    },
    menu(anchor, items, onPick) {
      UI.closeMenu();
      const pop = document.createElement('div');
      pop.className = 'pop-menu';
      pop.innerHTML = items.map((it, i) => `<div class="opt ${it.current ? 'cur' : ''}" data-i="${i}">${it.html || e(it.label)}</div>`).join('');
      document.body.appendChild(pop);
      const r = anchor.getBoundingClientRect();
      pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + 'px';
      let top = r.bottom + 6; if (top + pop.offsetHeight > innerHeight - 8) top = Math.max(8, r.top - pop.offsetHeight - 6);
      pop.style.top = top + 'px';
      pop.querySelectorAll('[data-i]').forEach((o) => o.addEventListener('click', () => { const it = items[+o.dataset.i]; UI.closeMenu(); onPick(it.value); }));
      UI._menu = pop;
      setTimeout(() => document.addEventListener('mousedown', UI._away = (ev) => { if (!pop.contains(ev.target)) UI.closeMenu(); }), 0);
    },
    closeMenu() {
      if (UI._menu) { UI._menu.remove(); UI._menu = null; }
      if (UI._away) { document.removeEventListener('mousedown', UI._away); UI._away = null; }
    },
  };

  /* ============================== Meta Ads ============================== */
  const brl = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kk = (v) => (v >= 1000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : 'R$ ' + Math.round(v || 0).toLocaleString('pt-BR'));
  const pct = (a, b) => (a && b ? Math.round((a / b - 1) * 100) : null);
  const dm = (iso) => { const d = U.parse(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };

  const Ads = {
    data: null,
    init(seed) { this.data = (seed && seed.ads) || null; this.today = (this.data && this.data.to) || U.today(); },
    has(id) { return !!(this.data && this.data.clients && this.data.clients[id]); },
    ids() { return this.data ? Object.keys(this.data.clients) : []; },
    day(id, iso) {
      if (!this.data) return [0, 0];
      if (id === '*') return this.ids().reduce((a, k) => { const v = this.data.clients[k].days[iso] || [0, 0]; return [a[0] + v[0], a[1] + v[1]]; }, [0, 0]);
      const c = this.data.clients[id]; return (c && c.days[iso]) || [0, 0];
    },
    range(id, from, to) {
      let s = 0, l = 0;
      for (let d = from; d <= to; d = U.addDays(d, 1)) { const v = this.day(id, d); s += v[0]; l += v[1]; }
      return { s, l, cpl: l ? s / l : null };
    },
    /** Janela do período escolhido e a janela anterior de mesmo tamanho para comparar. */
    win(per) {
      const T = this.today, Y = U.addDays(T, -1);
      const n = { '7d': 7, '14d': 14, '30d': 30 }[per];
      if (per === 'hoje') return { from: T, to: T, pfrom: Y, pto: Y, label: `Hoje, ${U.fmtDate(T)} · parcial`, short: 'hoje', prev: 'ontem' };
      if (per === 'ontem') { const P2 = U.addDays(Y, -1); return { from: Y, to: Y, pfrom: P2, pto: P2, label: `Ontem, ${U.fmtDate(Y)}`, short: 'ontem', prev: 'anteontem' }; }
      const from = U.addDays(Y, -(n - 1));
      return { from, to: Y, pfrom: U.addDays(from, -n), pto: U.addDays(from, -1), label: `${U.fmtDate(from)} – ${U.fmtDate(Y)}`, short: `${n} dias`, prev: `${n} dias antes` };
    },
    stats(id, per) {
      const w = this.win(per);
      const cur = this.range(id, w.from, w.to), prev = this.range(id, w.pfrom, w.pto);
      const hasPrev = this.data && U.diffDays(w.pto, this.data.from || w.pfrom) >= Math.floor(U.diffDays(w.pto, w.pfrom) * 0.9);
      return { ...cur, prev: hasPrev ? prev : null, dCpl: hasPrev && cur.cpl && prev.cpl ? pct(cur.cpl, prev.cpl) : null, dLeads: hasPrev && prev.l ? pct(cur.l, prev.l) : null, w };
    },
    /** Dias mostrados nos gráficos (14 terminando ontem; 7 no período de 7 dias; hoje inclui o dia atual). */
    chartDays(per) {
      const T = this.today, Y = U.addDays(T, -1);
      const end = per === 'hoje' ? T : Y, n = per === '7d' ? 7 : 14;
      return [...Array(n)].map((_, i) => U.addDays(end, i - n + 1));
    },
  };

  /* ============================== Peças ============================== */
  const RC = { b: '#3DD68C', n: '#A3A6B8', r: '#FF6B5E', x: '#F4C04E' };
  const RB = { b: 'rgba(61,214,140,.14)', n: 'rgba(255,255,255,.07)', r: 'rgba(255,107,94,.14)', x: 'rgba(244,192,78,.14)' };
  const RL = { b: 'bom', n: 'neutro', r: 'ruim', x: 'sem diário' };
  const resOf = (l) => (!l ? 'x' : l.impact === 'positivo' ? 'b' : l.impact === 'negativo' ? 'r' : 'n');
  const C = { I, brl, kk, pct, dm, RC, RB, RL, resOf };

  C.avatar = (name, cls = '') => name ? `<span class="av ${cls}" style="background:${U.hashColor(name)}" title="${e(name)}">${e(U.initials(name))}</span>` : `<span class="av none ${cls}" title="Sem responsável">–</span>`;
  C.resPill = (r) => `<span class="res" style="background:${RB[r]};color:${RC[r]}">${RL[r]}</span>`;
  C.deltaPill = (d, invert = true) => d == null ? '<span class="pill">–</span>' : `<span class="pill ${(d > 0) === invert ? 'bad' : 'good'}">${d > 0 ? '+' : ''}${d}%</span>`;
  C.empty = (t, s = '') => `<div class="empty"><b>${e(t)}</b>${e(s)}</div>`;
  C.spark = (arr, color, h = 34) => {
    const max = Math.max(...arr, 1), n = Math.max(arr.length, 2);
    const line = 'M' + arr.map((v, i) => `${((i / (n - 1)) * 100).toFixed(1)} ${(h - 2 - (v / max) * (h - 6)).toFixed(1)}`).join(' L');
    return `<svg viewBox="0 0 100 ${h}" preserveAspectRatio="none"><path d="${line} L100 ${h} L0 ${h} Z" fill="${color}" fill-opacity=".14"/><path class="line-a" d="${line}" fill="none" stroke="${color}" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>`;
  };
  C.ring = (done, total) => {
    const circ = 2 * Math.PI * 44, dash = total ? (circ * done) / total : 0;
    return `<div class="ring"><svg width="100" height="100" viewBox="0 0 104 104"><circle cx="52" cy="52" r="44" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/><circle cx="52" cy="52" r="44" fill="none" stroke="#F4C04E" stroke-width="10" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 52 52)" style="transition:stroke-dasharray .6s;filter:drop-shadow(0 0 8px rgba(244,192,78,.6))"/></svg>
      <div class="c"><b>${done}<small>/${total}</small></b><span class="small muted">hoje</span></div></div>`;
  };
  C.duePill = (t) => {
    if (!t.due) return '<span class="pill mono">sem prazo</span>';
    const late = t.status !== 'done' && t.due < U.today();
    return `<span class="pill mono ${late ? 'bad' : t.due === U.today() ? 'warn' : ''}">${e(U.fmtDue(t.due))}</span>`;
  };

  window.UI = UI; window.C = C; window.Ads = Ads;
})();
