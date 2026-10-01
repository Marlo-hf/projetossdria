/* Telas da Central: Painel, Clientes, Cliente (diário/desempenho/demandas/informações), Equipe, Criativos, Ajustes e janelas. */
(function () {
  const e = U.esc;
  const M = window.META;
  const { I, brl, kk, dm, RC, RB, RL, resOf } = C;

  /* ============================== Estado de tela ============================== */
  const VS_KEY = 'bordo:central:v1';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(VS_KEY) || '{}'); } catch (err) { saved = {}; }
  const VS = { per: '30d', sort: 'spend', cf: 'todos', ctab: 'diario', person: '', q: '', ai: false, aiQ: '', ...saved };
  VS.save = () => { try { const { save, ...r } = VS; localStorage.setItem(VS_KEY, JSON.stringify(r)); } catch (err) { /* ignora */ } };

  /* ============================== Dados derivados ============================== */
  const T = () => U.today();
  const team = () => Store.settings.team || [];
  const isActive = (c) => c.status === 'ativo' || c.status === 'onboarding';
  const entries = (cid) => Store.logs({ clientId: cid }).filter((l) => l.type !== 'tarefa' && !(l.auto && l.type === 'nota'));
  const lastEntry = (cid) => entries(cid)[0] || null;
  const doneToday = (cid) => entries(cid).some((l) => l.date === T());
  const ORDER = { r: 0, x: 1, n: 2, b: 3 };
  const diaryClients = () => Store.clients().filter(isActive).sort((a, b) => a.name.localeCompare(b.name));
  const pendingList = () => diaryClients().filter((c) => !doneToday(c.id)).sort((a, b) => ORDER[resOf(lastEntry(a.id))] - ORDER[resOf(lastEntry(b.id))] || a.name.localeCompare(b.name));
  const work = (list) => list.filter((t) => t.status !== 'done' && t.status !== 'daily');
  const isLate = (t) => t.status !== 'done' && t.due && t.due < T();
  const entryText = (l) => (l ? (l.analysis || l.title || l.actionsDone || l.planned || 'Registro sem análise.') : 'Nenhum registro no diário.');
  const lastLabel = (l) => (l ? dm(l.date) : 'nunca');
  const url = (v) => { v = String(v || '').trim(); return !v ? '' : /^https?:\/\//i.test(v) ? v : 'https://' + v; };
  const wdName = (iso) => U.WD_FULL[U.parse(iso).getDay()].replace('-feira', '');

  /* ============================== Moldura ============================== */
  const RAIL = [['painel', 'Painel', '#/'], ['diario', 'Diário de bordo', '#/diario'], ['clientes', 'Clientes', '#/clientes'], ['equipe', 'Equipe', '#/equipe'], ['criativos', 'Criativos', '#/criativos']];
  const rail = (active) => {
    const n = pendingList().length;
    const me = Store.settings.userName || 'Você';
    return `<div class="logo">${e(((Store.settings.workspaceName || 'U').trim()[0] || 'U').toUpperCase())}</div>
      ${RAIL.map(([k, label, href]) => `<a class="rail ${active === k ? 'on' : ''}" href="${href}" title="${label}" aria-label="${label}">${I(k, 20)}${k === 'diario' && n ? `<span class="badge liveA">${n}</span>` : ''}</a>`).join('')}
      <span class="spacer" style="flex:1"></span>
      <a class="rail ${active === 'ajustes' ? 'on' : ''}" href="#/ajustes" title="Ajustes" aria-label="Ajustes">${I('ajustes', 20)}</a>
      <span class="me" style="background:${U.hashColor(me)}" title="${e(me)}">${e(U.initials(me))}</span>`;
  };
  const topbar = ({ title, back = '', period = true }) => {
    const n = pendingList().length;
    const P = [['hoje', 'Hoje'], ['ontem', 'Ontem'], ['7d', '7 dias'], ['14d', '14 dias'], ['30d', '30 dias']];
    return `<header class="top">
      ${back}<h1>${e(title)}</h1>
      ${Ads.data ? '<span class="metapill hide-sm"><i class="live"></i>Meta Ads</span>' : ''}
      <span style="flex:1"></span>
      ${period && Ads.data ? `<div class="per">${P.map(([k, l]) => `<button class="${VS.per === k ? 'on' : ''}" data-action="per" data-k="${k}">${l}</button>`).join('')}</div>` : ''}
      <button class="btn-ai" data-action="ai">${I('spark', 16, 2)}<span>Copiloto</span></button>
      <button class="btn-gold" data-action="go-diario">${I('diario', 16, 2.2)}<span class="t">Diário ·</span> ${n}</button>
    </header>`;
  };

  /* ============================== Painel ============================== */
  const kpiCard = (label, value, sub, tag, color, series, delay) => `
    <div class="glass up lift kpi" style="animation-delay:${delay}s">
      <div class="lbl"><span>${label}</span>${tag}</div>
      <div class="val">${value}</div><div class="sub">${sub}</div>
      ${series ? C.spark(series, color) : '<div style="height:56px"></div>'}
    </div>`;

  const alertsList = () => {
    const out = [];
    const A = (c, text, icon, red) => out.push({ c, text, icon, red });
    if (!Ads.data) return out;
    Store.clients().filter((c) => c.status !== 'encerrado').forEach((c) => {
      if (!Ads.has(c.id)) return;
      const s30 = Ads.stats(c.id, '30d');
      if (s30.s > 200 && s30.l === 0) A(c, `${kk(s30.s)} investidos em 30 dias e nenhum lead.`, 'zero', true);
      const last3 = Ads.range(c.id, U.addDays(Ads.today, -3), Ads.today);
      if (isActive(c) && last3.s < 1 && s30.s > 50) {
        let d = U.addDays(Ads.today, -3);
        while (d > Ads.data.from && Ads.day(c.id, d)[0] < 1) d = U.addDays(d, -1);
        A(c, `Sem veiculação desde ${U.fmtDate(U.addDays(d, 1))}. Conferir saldo e campanhas.`, 'stop', true);
      }
      if (s30.dCpl != null && s30.dCpl > 40 && s30.l >= 3) A(c, `CPL de ${brl(s30.prev.cpl)} para ${brl(s30.cpl)} (+${s30.dCpl}%).`, 'up', true);
      const le = lastEntry(c.id);
      if (isActive(c) && s30.l >= 10 && (!le || U.diffDays(T(), le.date) > 7)) A(c, `${s30.l} leads em 30 dias e ${le ? 'diário parado desde ' + U.fmtDate(le.date) : 'nenhum registro no diário'}.`, 'book', false);
    });
    return out.sort((a, b) => (b.red ? 1 : 0) - (a.red ? 1 : 0));
  };

  const painel = () => {
    const per = VS.per;
    const st = Ads.data ? Ads.stats('*', per) : null;
    const days = Ads.data ? Ads.chartDays(per) : [];
    const dl = days.map((d) => Ads.day('*', d)[1]), ds = days.map((d) => Ads.day('*', d)[0]);
    const open = work(Store.state.tasks), late = open.filter(isLate);
    const tag = (d, inv) => (d == null ? `<span class="pill">${st ? st.w.short : ''}</span>` : `<span class="pill ${(d > 0) !== inv ? 'good' : 'bad'}">${d > 0 ? '+' : ''}${d}%</span>`);
    const kpis = st ? [
      kpiCard('Investimento', kk(st.s), st.w.label, `<span class="pill">${st.w.short}</span>`, '#22D3EE', ds, 0),
      kpiCard('Leads', st.l.toLocaleString('pt-BR'), st.prev ? `${st.w.prev}: ${st.prev.l.toLocaleString('pt-BR')}` : st.w.label, tag(st.dLeads, false), '#A78BFA', dl, 0.06),
      kpiCard('CPL médio', st.cpl ? brl(st.cpl) : '—', st.prev && st.prev.cpl ? `${st.w.prev}: ${brl(st.prev.cpl)}` : st.w.label, tag(st.dCpl, true), '#3DD68C', ds.map((v, i) => (dl[i] ? v / dl[i] : 0)), 0.12),
    ] : [kpiCard('Meta Ads', '—', 'Sem dados de anúncios nesta versão', '', '', null, 0)];
    kpis.push(kpiCard('Demandas atrasadas', String(late.length), `de ${open.length} abertas`, `<span class="pill ${late.length ? 'bad' : 'good'}">${open.length ? Math.round((late.length / open.length) * 100) : 0}%</span>`, '#FF6B5E', null, 0.18));

    const all = diaryClients(), pend = pendingList();
    const done = all.length - pend.length;
    const band = pend.slice(0, 12).map((c) => { const l = lastEntry(c.id), r = resOf(l); return `<button class="dcard pop" style="--c:${RC[r]}" data-action="open-client" data-id="${c.id}" data-tab="diario"><span class="n"><b>${e(c.name)}</b><i style="${l ? '' : 'color:var(--amber)'}">${lastLabel(l)}</i></span><p>${e(entryText(l))}</p></button>`; }).join('');

    const maxL = Math.max(...dl, 1), maxS = Math.max(...ds, 1), nn = days.length;
    const hi = per === 'hoje' || per === 'ontem' ? nn - 1 : -1;
    const spendLine = nn ? 'M' + ds.map((v, i) => `${(((i + 0.5) / nn) * 100).toFixed(2)} ${(100 - (v / maxS) * 78).toFixed(2)}`).join(' L') : '';
    const chart = Ads.data ? `
      <section class="glass up panel panel-pad" style="animation-delay:.25s">
        <div class="sec-h"><h2>Leads por dia</h2>
          <span class="small muted row"><span style="width:10px;height:10px;border-radius:3px;background:linear-gradient(#A78BFA,#7C5CFF)"></span>Leads</span>
          <span class="small muted row"><span style="width:14px;height:2px;background:#22D3EE"></span>Investimento</span>
          <span style="flex:1"></span><span class="mono small muted">${U.fmtDate(days[0])} – ${U.fmtDate(days[nn - 1])}</span></div>
        <div class="chart">
          <div class="grid"><span></span><span></span><span></span><span style="background:rgba(255,255,255,.1)"></span></div>
          <div class="bars" style="grid-template-columns:repeat(${nn},1fr)">${dl.map((v, i) => `<div class="b" title="${dm(days[i])} · ${v} leads · ${brl(ds[i])}" style="opacity:${hi < 0 || hi === i ? 1 : 0.35}"><em style="color:${hi === i ? '#fff' : '#7D8095'}">${v}</em><span class="bar-a" style="height:${Math.round((v / maxL) * 82)}%;animation-delay:${(0.2 + i * 0.04).toFixed(2)}s;background:${hi === i ? 'linear-gradient(180deg,#F4C04E,rgba(244,192,78,.35))' : 'linear-gradient(180deg,#A78BFA,rgba(124,92,255,.35))'}"></span></div>`).join('')}</div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="line-a" d="${spendLine}" fill="none" stroke="#22D3EE" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>
        </div>
        <div class="xlab" style="grid-template-columns:repeat(${nn},1fr)">${days.map((d) => `<span>${U.parse(d).getDate()}</span>`).join('')}</div>
      </section>` : '';

    const rows = Store.clients().filter((c) => Ads.has(c.id) && c.status !== 'encerrado').map((c) => ({ c, s: Ads.stats(c.id, per), d14: Ads.chartDays('14d').map((d) => Ads.day(c.id, d)[1]) })).filter((x) => x.s.s > 0 || x.s.l > 0);
    const sorters = { spend: (a, b) => b.s.s - a.s.s, leads: (a, b) => b.s.l - a.s.l, cpl: (a, b) => (a.s.cpl || 1e9) - (b.s.cpl || 1e9), delta: (a, b) => (b.s.dCpl ?? -999) - (a.s.dCpl ?? -999) };
    rows.sort(sorters[VS.sort] || sorters.spend);
    const table = Ads.data ? `
      <section class="glass up panel" style="animation-delay:.35s">
        <div class="sec-h" style="padding:20px 22px 12px"><h2>Clientes</h2><span class="small dim">${Ads.win(per).label}</span><span style="flex:1"></span>
          <div class="seg">${[['spend', 'Investido'], ['leads', 'Leads'], ['cpl', 'CPL'], ['delta', 'Piora']].map(([k, l]) => `<button class="${VS.sort === k ? 'on' : ''}" data-action="sort" data-k="${k}">${l}</button>`).join('')}</div></div>
        <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Cliente</th><th>Investido</th><th>Leads</th><th>CPL</th><th class="hide-sm">Δ CPL</th><th style="text-align:center">Diário</th><th class="hide-sm">14 dias</th></tr></thead><tbody>
          ${rows.slice(0, 10).map(({ c, s, d14 }) => { const mx = Math.max(...d14, 1); return `<tr data-action="open-client" data-id="${c.id}">
            <td class="name">${e(c.name)}</td><td>${kk(s.s)}</td><td>${s.l}</td><td><b>${s.cpl ? brl(s.cpl) : '—'}</b></td>
            <td class="hide-sm">${C.deltaPill(s.dCpl)}</td><td style="text-align:center">${C.resPill(resOf(lastEntry(c.id)))}</td>
            <td class="hide-sm"><span class="minib">${d14.map((v) => `<span style="height:${Math.round((v / mx) * 100)}%"></span>`).join('')}</span></td></tr>`; }).join('') || `<tr><td colspan="7">${C.empty('Sem investimento no período')}</td></tr>`}
        </tbody></table></div>
        <a href="#/clientes" style="padding:14px;text-align:center;border-top:1px solid var(--line-2)">Ver todos →</a>
      </section>` : '';

    const alerts = alertsList();
    const queue = work(Store.state.tasks).filter((t) => t.due && t.due <= T()).sort((a, b) => a.due.localeCompare(b.due));
    return {
      rail: 'painel',
      top: topbar({ title: 'Painel' }),
      body: `
      <div class="kpis">${kpis.join('')}</div>
      <section class="glass up dband" style="animation-delay:.15s">
        <div class="dband-l"><h2>Diário de bordo</h2>
          <div class="row" style="gap:18px">${C.ring(done, all.length)}<div><div style="font-size:30px;font-weight:700;letter-spacing:-.04em;color:var(--amber)">${pend.length}</div><div class="small muted">clientes sem registro hoje</div></div></div>
          ${pend.length ? '<button class="btn-gold" style="justify-content:center;height:46px" data-action="go-diario">Começar pelo primeiro</button>' : '<div class="pill good" style="align-self:flex-start">Tudo registrado hoje</div>'}</div>
        <div class="dband-grid">${band || C.empty('Todos os diários de hoje estão feitos')}</div>
      </section>
      <div class="main2">
        <div class="col">${chart}${table}</div>
        <div class="col">
          <section class="glass up panel" style="animation-delay:.3s">
            <div class="sec-h" style="padding:20px 20px 10px"><h2>Alertas</h2><span class="pill bad">${alerts.length}</span></div>
            ${alerts.slice(0, 7).map((a) => `<button class="alert rowc" data-action="open-client" data-id="${a.c.id}"><span class="ico" style="background:${a.red ? 'var(--bad-bg)' : 'var(--warn-bg)'};color:${a.red ? 'var(--red-text)' : 'var(--amber)'}">${I(a.icon, 16, 2)}</span><span><b>${e(a.c.name)}</b><span class="t">${e(a.text)}</span></span></button>`).join('') || `<div style="padding:0 20px 18px">${C.empty('Nenhum alerta agora')}</div>`}
          </section>
          <section class="glass up panel panel-pad" style="animation-delay:.4s;gap:14px">
            <div class="sec-h"><h2>Fila de hoje</h2><span style="flex:1"></span><span class="mono small" style="color:var(--red-text)">${queue.filter(isLate).length} atrasadas</span></div>
            ${queue.slice(0, 8).map((t) => `<div class="q" data-action="open-task" data-id="${t.id}"><button class="chk" data-action="done-task" data-id="${t.id}" aria-label="Concluir">${I('check', 12, 3)}</button><span style="min-width:0"><b>${e(t.title)}</b><small>${e(Store.client(t.clientId)?.name || 'Interno')} · ${e(t.assignee || 'sem responsável')}</small></span>${C.duePill(t)}</div>`).join('') || C.empty('Nada vencendo hoje')}
            ${queue.length > 8 ? `<a href="#/equipe" class="small">+ ${queue.length - 8} demandas</a>` : ''}
          </section>
        </div>
      </div>`,
    };
  };

  /* ============================== Clientes ============================== */
  const clientesPage = () => {
    const per = VS.per;
    const enc = VS.cf === 'encerrados';
    const list = Store.clients().filter((c) => (enc ? !isActive(c) : isActive(c)));
    const data = list.map((c) => ({ c, s: Ads.has(c.id) ? Ads.stats(c.id, per) : null, l: lastEntry(c.id) }));
    const F = { todos: () => true, piora: (x) => x.s && x.s.dCpl > 0, ruim: (x) => resOf(x.l) === 'r', sem: (x) => !x.l, encerrados: () => true };
    const actData = enc ? Store.clients().filter(isActive).map((c) => ({ c, s: Ads.has(c.id) ? Ads.stats(c.id, per) : null, l: lastEntry(c.id) })) : data;
    const cards = data.filter(F[VS.cf] || F.todos).sort((a, b) => (b.s ? b.s.s : -1) - (a.s ? a.s.s : -1) || a.c.name.localeCompare(b.c.name));
    const chip = (k, l, n) => `<button class="fchip ${VS.cf === k ? 'on' : ''}" data-action="cf" data-k="${k}">${l}${n != null ? ` · ${n}` : ''}</button>`;
    const nEnc = Store.state.clients.filter((c) => !isActive(c)).length;
    return {
      rail: 'clientes',
      top: topbar({ title: 'Clientes' }),
      body: `
      <div class="filters">${chip('todos', 'Todos', actData.length)}${chip('piora', 'CPL subindo', actData.filter(F.piora).length)}${chip('ruim', 'Diário ruim', actData.filter(F.ruim).length)}${chip('sem', 'Sem diário', actData.filter(F.sem).length)}${nEnc ? chip('encerrados', 'Pausados e encerrados', nEnc) : ''}
        <span style="flex:1"></span><span class="small dim hide-sm">${Ads.data ? Ads.win(per).label : ''}</span><button class="btn btn-sm" data-action="new-client">${I('plus', 15)}Novo cliente</button></div>
      <div class="cgrid">${cards.map(({ c, s, l }, i) => {
        const r = resOf(l); const d14 = Ads.has(c.id) ? Ads.chartDays('14d').map((d) => Ads.day(c.id, d)[1]) : [];
        return `<div class="glass up lift ccard" style="animation-delay:${(Math.min(i, 20) * 0.03).toFixed(2)}s" data-action="open-client" data-id="${c.id}">
          <div class="hd"><b class="ell">${e(c.name)}</b>${s ? C.deltaPill(s.dCpl) : '<span class="pill">sem Meta</span>'}</div>
          <div class="trio"><div><small>CPL</small><b>${s && s.cpl ? brl(s.cpl) : '—'}</b></div><div><small>Leads</small><b>${s ? s.l : '—'}</b></div><div><small>Investido</small><b class="s">${s ? kk(s.s) : '—'}</b></div></div>
          <div class="lastd" style="--c:${RC[r]}"><small>Diário · ${l ? dm(l.date) : '—'}</small><p>${e(entryText(l))}</p></div>
          ${d14.length ? C.spark(d14, '#A78BFA', 30) : '<div style="height:14px"></div>'}
        </div>`;
      }).join('') || C.empty('Nenhum cliente neste filtro')}</div>`,
    };
  };

  /* ============================== Cliente ============================== */
  const heat12 = (cid) => {
    const days = []; let d = T();
    while (days.length < 12) { const wd = U.parse(d).getDay(); if (wd !== 0 && wd !== 6) days.unshift(d); d = U.addDays(d, -1); }
    const byDay = {}; entries(cid).forEach((l) => { if (!byDay[l.date]) byDay[l.date] = resOf(l); });
    const HC = { b: '#3DD68C', n: '#5D6072', r: '#FF6B5E', x: 'rgba(255,255,255,.05)' };
    const cells = days.map((x) => byDay[x] || 'x');
    return { days, cells: cells.map((c, i) => `<span style="background:${HC[c]};${c === 'x' ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)' : ''}" title="${U.fmtDate(days[i])} · ${RL[c]}"></span>`).join(''), nb: cells.filter((c) => c === 'b').length, nn: cells.filter((c) => c === 'n').length, nr: cells.filter((c) => c === 'r').length };
  };

  const clientList = (cid) => {
    const q = VS.q;
    const match = (c) => !q || U.match(c.name, q);
    const pend = pendingList().filter(match);
    const doneL = diaryClients().filter((c) => doneToday(c.id)).filter(match);
    const others = Store.clients().filter((c) => !isActive(c)).filter(match);
    const it = (c) => { const l = lastEntry(c.id); return `<button class="it ${c.id === cid ? 'on' : ''}" data-action="open-client" data-id="${c.id}"><span class="dot" style="background:${RC[resOf(l)]}"></span><span class="ell">${e(c.name)}</span><i>${l ? dm(l.date) : '–'}</i></button>`; };
    const g = (label, color, arr) => (arr.length ? `<div class="g" style="color:${color}"><span>${label}</span><span>${arr.length}</span></div>${arr.map(it).join('')}` : '');
    return `<label class="search">${I('search', 14)}<input id="cl-q" placeholder="Buscar cliente" value="${e(q)}" data-input="cl-q"></label>
      ${g('Sem registro hoje', '#F4C04E', pend)}${g('Registrado hoje', '#7FE3B4', doneL)}${g('Pausados e encerrados', '#7D8095', others)}`;
  };

  const clientePage = (cid, tab) => {
    const c = Store.client(cid);
    if (!c) return { rail: 'clientes', top: topbar({ title: 'Cliente' }), body: C.empty('Cliente não encontrado', 'Ele pode ter sido excluído.') };
    tab = tab || 'diario';
    const per = VS.per;
    const s = Ads.has(c.id) ? Ads.stats(c.id, per) : null;
    const l = lastEntry(c.id), r = resOf(l);
    const tasks = Store.tasks({ clientId: c.id });
    const openT = Store.sortTasks(tasks.filter((t) => t.status !== 'done'));
    const links = [[c.metaPage, 'Gerenciador'], [c.diarySheetUrl, 'Planilha'], [c.clickupUrl, 'ClickUp'], [c.contact && c.contact.phone ? U.waLink(c.contact.phone) : '', 'WhatsApp']].filter(([u]) => u);
    const tabs = [['diario', 'Diário de bordo', '#F4C04E'], ['perf', 'Desempenho', '#A78BFA'], ['dem', `Demandas · ${openT.length}`, '#A78BFA'], ['info', 'Informações', '#A78BFA']];
    const lbl = s ? s.w.short : '';
    let body = '';
    if (tab === 'perf') {
      const days = [];
      if (s) { const stop = per === 'hoje' || per === 'ontem' ? U.addDays(Ads.today, -13) : s.w.from; for (let d = Ads.today; d >= stop; d = U.addDays(d, -1)) days.push(d); }
      const mx = Math.max(...days.map((d) => Ads.day(c.id, d)[1]), 1);
      body = s ? `<section class="glass up panel"><div style="overflow-x:auto"><table class="tbl perf"><thead><tr><th>Dia</th><th>Investido</th><th>Leads</th><th>CPL</th><th style="text-align:left">Leads</th></tr></thead><tbody>
        ${days.map((d) => { const [sp, ld] = Ads.day(c.id, d); return `<tr style="cursor:default"><td style="${d === Ads.today ? 'color:var(--amber)' : ''}">${dm(d)}${d === Ads.today ? ' <span class="small dim">parcial</span>' : ''}</td><td>${brl(sp)}</td><td>${ld}</td><td><b>${ld ? brl(sp / ld) : '—'}</b></td><td style="text-align:left;width:40%"><div class="pbar"><span style="width:${Math.round((ld / mx) * 100)}%"></span></div></td></tr>`; }).join('')}
        </tbody></table></div></section>` : `<section class="glass panel">${C.empty('Sem conta de anúncio ligada', 'Coloque o link do Gerenciador em Informações para ver o desempenho.')}</section>`;
    } else if (tab === 'dem') {
      const doneT = tasks.filter((t) => t.status === 'done').length;
      body = `<section class="glass up panel">
        ${openT.map((t) => `<div class="dem" data-action="open-task" data-id="${t.id}"><button class="chk" data-action="done-task" data-id="${t.id}" aria-label="Concluir">${I('check', 12, 3)}</button><span style="min-width:0"><b class="ell">${e(t.title)}</b><small>${e(t.assignee || 'Sem responsável')} · ${e((M.status[t.status] || {}).label || '')}</small></span><span></span>${C.duePill(t)}</div>`).join('') || C.empty('Nenhuma demanda aberta')}
        <div class="addrow">${I('plus', 16)}<input id="add-dem" data-quickadd='${e(JSON.stringify({ clientId: c.id }))}' placeholder="Nova demanda para ${e(c.name)} — escreva e aperte Enter"></div>
        ${doneT ? `<div class="addrow small">${doneT} demanda(s) concluída(s)</div>` : ''}
      </section>`;
    } else if (tab === 'info') {
      const f = (label, path, type = 'text', ph = '') => { const v = path.split('.').reduce((o, k) => (o || {})[k], c) ?? ''; return `<label for="p-${path}">${label}</label><div><input class="field" id="p-${path}" type="${type}" value="${e(v)}" placeholder="${e(ph)}" data-change="client-field" data-id="${c.id}" data-field="${path}"></div>`; };
      body = `<section class="glass up panel"><div class="props">
        ${f('Cliente', 'name')}${f('O que ele mexe', 'niche', 'text', 'Ex.: Gestão de passivos, Golpe Pix')}${f('Página do Meta (Gerenciador)', 'metaPage', 'url', 'Link da conta no Gerenciador de Anúncios')}
        <label for="p-owner">Responsável</label><div><select class="field" id="p-owner" data-change="client-field" data-id="${c.id}" data-field="owner"><option value="">—</option>${[...new Set([...team(), c.owner].filter(Boolean))].map((n) => `<option ${n === c.owner ? 'selected' : ''}>${e(n)}</option>`).join('')}</select></div>
        <label for="p-status">Status</label><div><select class="field" id="p-status" data-change="client-field" data-id="${c.id}" data-field="status">${M.CLIENT_STATUSES.map((x) => `<option value="${x.id}" ${x.id === c.status ? 'selected' : ''}>${x.label}</option>`).join('')}</select></div>
        ${f('Teto de investimento (R$)', 'investmentCap', 'number')}${f('Meta de CPL (R$)', 'goals.cpl', 'number')}
        <label for="p-notes">Observações</label><div><textarea class="field" id="p-notes" rows="4" data-change="client-field" data-id="${c.id}" data-field="notes" placeholder="Combinados, restrições, como o cliente gosta de receber relatório…">${e(c.notes || '')}</textarea></div>
        ${f('Planilha antiga do diário', 'diarySheetUrl', 'url')}${f('Pasta no ClickUp', 'clickupUrl', 'url')}
        <label>Excluir cliente</label><div><button class="btn btn-sm btn-danger" data-action="delete-client" data-id="${c.id}">${I('trash', 14)}Excluir ${e(c.name)}</button></div>
      </div></section>`;
    } else {
      const h = heat12(c.id);
      const d14days = Ads.chartDays('14d');
      const d14 = Ads.has(c.id) ? d14days.map((d) => Ads.day(c.id, d)[1]) : [];
      const mx = Math.max(...d14, 1);
      const ents = entries(c.id);
      body = `<div class="cdiary">
        <div class="col">
          <section class="glass reg" id="composer" data-client="${c.id}">
            <div class="row" style="flex-wrap:wrap"><h2>Registro de hoje</h2><span class="small dim">${wdName(T())}, ${U.fmtDate(T())} · ontem + 7 dias</span>${doneToday(c.id) ? '<span class="pill good" style="margin-left:auto">registrado hoje</span>' : ''}</div>
            <input type="hidden" name="impact" value="">
            <div class="results">${[['positivo', 'Bom', '#3DD68C', 'rgba(61,214,140,.22)'], ['neutro', 'Neutro', '#8A8DA0', 'rgba(138,141,160,.22)'], ['negativo', 'Ruim', '#FF6B5E', 'rgba(255,107,94,.22)']].map(([k, label, col, bg]) => `<button type="button" data-action="pick-res" data-k="${k}" style="--c:${col};--bgc:${bg}"><span class="dot" style="background:${col}"></span>${label}</button>`).join('')}</div>
            <textarea class="field" name="analysis" id="cp-a" rows="3" placeholder="Análise"></textarea>
            <div class="two"><textarea class="field" name="planned" id="cp-p" rows="1" placeholder="Ações programadas"></textarea><textarea class="field" name="actionsDone" id="cp-d" rows="1" placeholder="Ações realizadas"></textarea></div>
            <div class="row" style="flex-wrap:wrap"><label class="row small" style="color:var(--text-2)"><input type="checkbox" name="plannedTask" id="cp-t" style="width:18px;height:18px;accent-color:#7C5CFF"> Virar tarefa</label><span style="flex:1"></span>
              <button class="btn" data-action="skip-client" data-id="${c.id}">Pular</button><button class="btn-gold" data-action="save-entry" data-id="${c.id}">Salvar e ir pro próximo</button></div>
          </section>
          <section class="glass tl">${ents.slice(0, 40).map((x) => { const rr = resOf(x); const d = U.parse(x.date); return `<div class="e" data-action="edit-log" data-id="${x.id}">
            <span class="d">${d.getDate()} ${U.MONTHS[d.getMonth()]}</span><span class="k" style="--c:${RC[rr]};--bgc:${RB[rr]}"><i></i></span>
            <div><div class="row">${C.resPill(rr)}<span class="small dim">${wdName(x.date)}</span>${x.author ? `<span class="small dim">· ${e(x.author)}</span>` : ''}</div>
              <div class="tx">${e(x.analysis || [x.title, x.body].filter(Boolean).join(' — ') || '—')}</div>
              ${x.planned ? `<div class="pl">Programado: ${e(x.planned)}</div>` : ''}${x.actionsDone ? `<div class="ac">Feito: ${e(x.actionsDone)}</div>` : ''}</div></div>`; }).join('') || C.empty('Nenhum registro ainda', 'Faça o primeiro registro acima.')}
            ${ents.length > 40 ? `<div class="small dim" style="padding:10px 0">+ ${ents.length - 40} registros mais antigos</div>` : ''}</section>
        </div>
        <div class="col">
          <section class="glass panel panel-pad" style="gap:12px"><b>Últimos 12 dias úteis</b><div class="heat">${h.cells}</div>
            <div class="row mono small dim" style="justify-content:space-between"><span>${U.fmtDate(h.days[0])}</span><span>${U.fmtDate(h.days[11])}</span></div>
            <div class="cnt3"><div style="background:rgba(61,214,140,.1)"><b style="color:#3DD68C">${h.nb}</b><small>bom</small></div><div style="background:rgba(255,255,255,.05)"><b>${h.nn}</b><small>neutro</small></div><div style="background:rgba(255,107,94,.1)"><b style="color:#FF6B5E">${h.nr}</b><small>ruim</small></div></div></section>
          ${d14.length ? `<section class="glass panel panel-pad" style="gap:12px"><b>Leads · 14 dias</b><div class="mbars">${d14.map((v, i) => `<span title="${dm(d14days[i])} · ${v} leads" style="height:${Math.round((v / mx) * 100)}%"></span>`).join('')}</div>
            <div class="row mono small dim" style="justify-content:space-between"><span>${U.fmtDate(d14days[0])}</span><span>${U.fmtDate(d14days[13])}</span></div></section>` : ''}
          <section class="glass panel panel-pad" style="gap:10px"><div class="row"><b>Demandas</b><span style="flex:1"></span><a href="#/c/${c.id}/dem" class="small">ver →</a></div>
            ${openT.slice(0, 4).map((t) => `<div class="task-mini" data-action="open-task" data-id="${t.id}"><b>${e(t.title)}</b><span class="small" style="color:${isLate(t) ? 'var(--red-text)' : t.due ? 'var(--amber)' : 'var(--dim)'}">${e(t.assignee || 'Sem responsável')} · ${t.due ? e(U.fmtDue(t.due)) : 'sem prazo'}</span></div>`).join('') || '<span class="small dim">Nada pendente.</span>'}</section>
        </div>
      </div>`;
    }
    return {
      rail: tab === 'diario' ? 'diario' : 'clientes',
      top: topbar({ title: c.name, back: `<a class="back" href="#/clientes">${I('back', 15)}Clientes</a>` }),
      body: `<div class="cpage">
        <aside class="glass clist">${clientList(c.id)}</aside>
        <div class="col">
          <section class="glass up chero">
            <div class="top-r"><span class="pill" style="background:${RB[r]};color:${RC[r]}"><span class="dot" style="background:${RC[r]}"></span>Diário: ${RL[r]}${l ? ' · ' + U.fmtDate(l.date) : ''}</span>
              <span class="pill">${e((M.clientStatus[c.status] || {}).label || '')}</span>${c.niche ? `<span class="pill">${e(c.niche)}</span>` : ''}
              <div class="links">${links.map(([u, t]) => `<a href="${e(url(u))}" target="_blank" rel="noopener">${t}↗</a>`).join('')}</div></div>
            <h1>${e(c.name)}</h1>
            <div class="ckpi">
              <div><small>Investido · ${lbl || '—'}</small><b>${s ? brl(s.s) : '—'}</b><em>${s ? s.w.label : 'sem conta ligada'}</em></div>
              <div><small>Leads · ${lbl || '—'}</small><b>${s ? s.l : '—'}</b><em>${s && s.prev ? `${s.w.prev}: ${s.prev.l}` : ''}</em></div>
              <div><small>CPL · ${lbl || '—'}</small><b>${s && s.cpl ? brl(s.cpl) : '—'}</b><em style="color:${s && s.dCpl > 0 ? 'var(--red-text)' : 'var(--green-text)'}">${s && s.dCpl != null ? `${s.dCpl > 0 ? '+' : ''}${s.dCpl}% vs ${s.w.prev}` : ''}</em></div>
              <div><small>Demandas</small><b>${openT.length}</b><em>${openT.filter(isLate).length ? `<span style="color:var(--red-text)">${openT.filter(isLate).length} atrasadas</span>` : 'abertas'}</em></div>
            </div>
            <div class="ctabs">${tabs.map(([k, t, col]) => `<button class="${tab === k ? 'on' : ''}" style="--c:${col}" data-action="ctab" data-id="${c.id}" data-k="${k}">${t}</button>`).join('')}</div>
          </section>
          ${body}
        </div></div>`,
    };
  };

  /* ============================== Equipe ============================== */
  const equipePage = () => {
    const open = work(Store.state.tasks);
    const names = [...new Set([...team(), ...open.map((t) => t.assignee || '')])];
    const max = Math.max(...names.map((n) => open.filter((t) => (t.assignee || '') === n).length), 1);
    const cards = names.map((n, i) => {
      const ts = Store.sortTasks(open.filter((t) => (t.assignee || '') === n));
      const late = ts.filter(isLate).length;
      return `<div class="glass up lift tcard ${VS.person === (n || '__none') ? 'on' : ''}" style="animation-delay:${i * 0.05}s" data-action="person" data-k="${e(n || '__none')}">
        <div class="hd">${C.avatar(n, 'lg')}<div><b>${e(n || 'Sem responsável')}</b><span class="small" style="color:${late ? 'var(--red-text)' : ts.length ? 'var(--muted)' : 'var(--green-text)'}">${late ? late + ' atrasadas' : ts.length ? 'em dia' : 'livre'}</span></div><strong>${ts.length}</strong></div>
        <div class="load"><span style="width:${(late / max) * 100}%"></span><span style="width:${((ts.length - late) / max) * 100}%"></span></div>
        ${ts.slice(0, 2).map((t) => `<div class="tk"><small>${e(Store.client(t.clientId)?.name || 'Interno')}</small><b>${e(t.title)}</b></div>`).join('')}
      </div>`;
    }).join('');
    const p = VS.person;
    const sel = p ? Store.sortTasks(open.filter((t) => (p === '__none' ? !t.assignee : t.assignee === p))) : null;
    return {
      rail: 'equipe',
      top: topbar({ title: 'Equipe', period: false }),
      body: `<div class="row" style="flex-wrap:wrap"><span class="small dim">Demandas abertas por pessoa (sem as rotinas de acompanhamento diário). Clique em alguém para ver tudo o que está com ele.</span><span style="flex:1"></span><button class="btn btn-sm" data-action="new-task">${I('plus', 15)}Nova demanda</button></div>
        <div class="tgrid">${cards}</div>
        ${sel ? `<section class="glass up panel"><div class="sec-h" style="padding:18px 22px"><h2>${e(p === '__none' ? 'Sem responsável' : p)}</h2><span class="pill">${sel.length}</span><span style="flex:1"></span><button class="ibtn" data-action="person" data-k="${e(p)}" title="Fechar">${I('x', 16)}</button></div>
          ${sel.map((t) => `<div class="dem" data-action="open-task" data-id="${t.id}"><button class="chk" data-action="done-task" data-id="${t.id}" aria-label="Concluir">${I('check', 12, 3)}</button><span style="min-width:0"><b class="ell">${e(t.title)}</b><small>${e(Store.client(t.clientId)?.name || 'Interno')} · ${e((M.status[t.status] || {}).label || '')}</small></span><span></span>${C.duePill(t)}</div>`).join('') || C.empty('Nada pendente')}</section>` : ''}`,
    };
  };

  /* ============================== Criativos ============================== */
  const KINDS = [
    { k: 'roteiro', name: 'Roteiro', color: '#F4C04E', cover: 'linear-gradient(135deg,#3A2A12,#F4C04E)', badge: 'roteiro' },
    { k: 'video', name: 'Edição de vídeo', color: '#7C5CFF', cover: 'linear-gradient(135deg,#3B2A8C,#7C5CFF 60%,#F472B6)', badge: 'vídeo' },
    { k: 'estatico', name: 'Estático', color: '#22D3EE', cover: 'linear-gradient(135deg,#0E4D5C,#22D3EE)', badge: 'estático' },
  ];
  const kindOf = (t) => {
    if (t.lane) return t.lane;
    const s = U.norm(t.title);
    if (/roteiro/.test(s)) return 'roteiro';
    if (/estatic/.test(s)) return 'estatico';
    const tags = (t.tags || []).map(U.norm);
    if (tags.includes('estatico')) return 'estatico';
    if (tags.includes('roteiro')) return 'roteiro';
    return 'video';
  };
  const criativosPage = () => {
    const ts = Store.sortTasks(Store.state.tasks.filter((t) => t.status !== 'done' && (t.tags || []).includes('Produção de criativos')));
    return {
      rail: 'criativos',
      top: topbar({ title: 'Criativos', period: false }),
      body: `<div class="lanes">${KINDS.map((K, li) => { const items = ts.filter((t) => kindOf(t) === K.k); return `
        <section class="glass up lane" style="animation-delay:${li * 0.08}s" data-drop-kind="${K.k}">
          <div class="lane-h"><i style="background:${K.color}"></i><b>${K.name}</b><span>${items.length}</span></div>
          ${items.map((t) => `<div class="kcard" draggable="true" data-drag-task="${t.id}" data-action="open-task" data-id="${t.id}">
            <div class="cover" style="background:${K.cover}"><span>${K.badge}</span></div>
            <small>${e(Store.client(t.clientId)?.name || 'Interno')}</small><b>${e(t.title)}</b>
            <div class="ft">${C.avatar(t.assignee)}${C.duePill(t)}</div></div>`).join('') || '<div class="small dim" style="padding:6px">Nada nesta etapa.</div>'}
          <button class="btn btn-sm" style="justify-content:flex-start" data-action="new-task" data-defaults='${e(JSON.stringify({ tags: ['Produção de criativos', K.badge] }))}'>${I('plus', 14)}Novo ${K.name.toLowerCase()}</button>
        </section>`; }).join('')}</div>`,
    };
  };

  /* ============================== Ajustes ============================== */
  const ajustesPage = () => {
    const s = Store.settings;
    const f = (label, field, val) => `<label for="s-${field}">${label}</label><div><input class="field" id="s-${field}" value="${e(val || '')}" data-change="setting" data-field="${field}"></div>`;
    return {
      rail: 'ajustes',
      top: topbar({ title: 'Ajustes', period: false }),
      body: `<section class="glass up panel" style="max-width:820px"><div class="props">
        ${f('Nome da agência', 'workspaceName', s.workspaceName)}${f('Seu nome', 'userName', s.userName)}
        <label for="s-team">Equipe (um nome por linha)</label><div><textarea class="field" id="s-team" rows="6" data-change="setting-team">${e(team().join('\n'))}</textarea></div>
        <label>Backup</label><div class="row" style="flex-wrap:wrap"><button class="btn btn-sm" data-action="export-json">Exportar backup</button><label class="btn btn-sm" style="cursor:pointer">Importar backup<input type="file" accept=".json" hidden data-change="import-json"></label></div>
        <label>Dados de anúncios</label><div class="small muted">${Ads.data ? `Meta Ads atualizado em ${U.fmtLong(Ads.today)} (${Ads.ids().length} contas). Os números são atualizados a cada nova publicação.` : 'Sem dados de anúncios nesta versão.'}</div>
        <label>Dados deste navegador</label><div class="row" style="flex-wrap:wrap"><span class="small dim">${Store.state.clients.length} clientes · ${Store.state.tasks.length} tarefas · ${Store.state.logs.length} registros</span><button class="btn btn-sm btn-danger" data-action="reset-all">Apagar tudo</button></div>
      </div></section>`,
    };
  };

  /* ============================== Copiloto ============================== */
  const aiAnswer = (q) => {
    const n = U.norm(q);
    const row = (c, mid, right) => `<div class="ai-row" data-action="open-client" data-id="${c.id}"><span class="ell">${e(c.name)}</span><span class="mono">${mid}</span>${right || ''}</div>`;
    if (/diario|registro/.test(n)) {
      const p = pendingList();
      return `<div class="ai-a">${p.length} cliente(s) ainda sem registro no diário hoje:${p.slice(0, 12).map((c) => row(c, lastLabel(lastEntry(c.id)))).join('')}</div>`;
    }
    if (/atras|demanda|tarefa/.test(n)) {
      const late = work(Store.state.tasks).filter(isLate).sort((a, b) => a.due.localeCompare(b.due));
      return `<div class="ai-a">${late.length} demanda(s) atrasada(s):${late.slice(0, 10).map((t) => `<div class="ai-row" data-action="open-task" data-id="${t.id}"><span class="ell">${e(t.title)}</span><span class="mono">${e(U.fmtDate(t.due))}</span></div>`).join('')}</div>`;
    }
    if (!Ads.data) return '<div class="ai-a">Esta versão não tem dados de anúncios para responder isso.</div>';
    const all30 = Store.clients().filter((c) => Ads.has(c.id)).map((c) => ({ c, s: Ads.stats(c.id, '30d') }));
    if (/sem lead|zero|gast/.test(n)) {
      const z = all30.filter((x) => x.s.s > 100 && x.s.l === 0);
      return `<div class="ai-a">${z.length ? `${z.length} cliente(s) investiram nos últimos 30 dias sem gerar lead:` : 'Nenhum cliente investiu sem gerar lead nos últimos 30 dias.'}${z.map((x) => row(x.c, kk(x.s.s))).join('')}</div>`;
    }
    if (/melhor|barat/.test(n)) {
      const b = all30.filter((x) => x.s.l >= 5).sort((a, b2) => a.s.cpl - b2.s.cpl).slice(0, 6);
      return `<div class="ai-a">Menores CPLs nos últimos 30 dias:${b.map((x) => row(x.c, brl(x.s.cpl))).join('')}</div>`;
    }
    const up = all30.filter((x) => x.s.dCpl != null && x.s.dCpl > 40 && x.s.l >= 3).sort((a, b) => b.s.dCpl - a.s.dCpl);
    return `<div class="ai-a">${up.length ? `CPL subiu mais de 40% em ${up.length} cliente(s), últimos 30 dias contra os 30 anteriores:` : 'Nenhum cliente com CPL subindo mais de 40% nos últimos 30 dias.'}${up.map((x) => row(x.c, `${brl(x.s.prev.cpl).replace('R$ ', '')} → ${brl(x.s.cpl).replace('R$ ', '')}`, `<b style="color:var(--red-text);font-family:var(--mono);font-size:12.5px">+${x.s.dCpl}%</b>`)).join('')}</div>`;
  };
  const aiPanel = () => {
    const q = VS.aiQ || 'Quem piorou o CPL esse mês?';
    return `<div class="ai-panel" role="dialog" aria-label="Copiloto">
      <div class="ai-h"><i></i><b>Copiloto</b><span style="flex:1"></span><button class="ibtn" data-action="ai" title="Fechar">${I('x', 16)}</button></div>
      <div class="ai-q">${e(q)}</div>${aiAnswer(q)}
      <div class="ai-sug">${['Quem piorou o CPL esse mês?', 'Quem está sem diário hoje?', 'Demandas atrasadas', 'Quem gastou sem lead?', 'Melhores CPLs'].map((x) => `<button data-action="ai-ask" data-q="${e(x)}">${e(x)}</button>`).join('')}</div>
      <div class="ai-in"><input id="ai-input" placeholder="Pergunte sobre clientes, campanhas, equipe" data-enter="ai-ask"><button data-action="ai-ask-input" aria-label="Perguntar">${I('send', 16, 2.2)}</button></div>
      <div class="small dim">Respostas montadas a partir dos dados do app (Meta Ads, diário e demandas).</div>
    </div>`;
  };

  /* ============================== Janelas ============================== */
  const sel = (name, opts, cur) => `<select class="field" name="${name}" id="f-${name}">${opts.map(([v, l]) => `<option value="${e(v)}" ${v === cur ? 'selected' : ''}>${e(l)}</option>`).join('')}</select>`;
  const clientOpts = () => [['', 'Interno'], ...Store.clients({ includeClosed: false }).map((c) => [c.id, c.name])];
  const Forms = {};
  Forms.task = (d = {}) => `<div class="modal-h"><h2>Nova demanda</h2><span style="flex:1"></span><button class="ibtn" data-modal-close>${I('x', 16)}</button></div>
    <div class="modal-b" id="task-form" data-tags='${e(JSON.stringify(d.tags || []))}'>
      <input class="field" name="title" id="f-title" placeholder="O que precisa ser feito?" style="font-size:16px" autofocus>
      <div class="tprops"><label>Cliente${sel('clientId', clientOpts(), d.clientId || '')}</label><label>Responsável${sel('assignee', [['', 'Ninguém'], ...team().map((n) => [n, n])], d.assignee ?? Store.settings.userName)}</label>
        <label>Vencimento<input class="field" type="date" name="due" id="f-due" value="${e(d.due || '')}"></label><label>Prioridade${sel('priority', M.PRIORITIES.map((p) => [p.id, p.label]), d.priority || 'normal')}</label></div>
      <textarea class="field" name="description" id="f-desc" rows="3" placeholder="Detalhes (opcional)"></textarea>
    </div><div class="modal-f"><button class="btn" data-modal-close>Cancelar</button><button class="btn btn-violet" data-action="save-task-form">Criar demanda</button></div>`;
  Forms.client = () => `<div class="modal-h"><h2>Novo cliente</h2><span style="flex:1"></span><button class="ibtn" data-modal-close>${I('x', 16)}</button></div>
    <div class="modal-b" id="client-form">
      <input class="field" name="name" id="n-name" placeholder="Nome do cliente" autofocus>
      <input class="field" name="niche" id="n-niche" placeholder="O que ele mexe (ex.: Gestão de passivos)">
      <input class="field" name="metaPage" id="n-meta" placeholder="Link da conta no Gerenciador de Anúncios">
      <div class="tprops"><label>Responsável${sel('owner', [['', '—'], ...team().map((n) => [n, n])], '')}</label><label>Status${sel('status', M.CLIENT_STATUSES.map((s) => [s.id, s.label]), 'onboarding')}</label></div>
    </div><div class="modal-f"><button class="btn" data-modal-close>Cancelar</button><button class="btn btn-violet" data-action="save-client-form">Criar cliente</button></div>`;
  Forms.log = (l) => `<div class="modal-h"><h2>Registro do diário</h2><span style="flex:1"></span><button class="ibtn" data-modal-close>${I('x', 16)}</button></div>
    <div class="modal-b" id="log-form" data-id="${l.id}">
      <div class="tprops"><label>Data<input class="field" type="date" name="date" id="l-date" value="${e(l.date)}"></label><label>Resultado${sel('impact', [['positivo', 'Bom'], ['neutro', 'Neutro'], ['negativo', 'Ruim']], l.impact || 'neutro')}</label></div>
      <label class="lbl" for="l-a">Análise</label><textarea class="field" name="analysis" id="l-a" rows="3">${e(l.analysis || [l.title, l.body].filter(Boolean).join('\n'))}</textarea>
      <div class="two"><div><label class="lbl" for="l-p">Ações programadas</label><textarea class="field" name="planned" id="l-p" rows="3" style="margin-top:10px">${e(l.planned || '')}</textarea></div><div><label class="lbl" for="l-d">Ações realizadas</label><textarea class="field" name="actionsDone" id="l-d" rows="3" style="margin-top:10px">${e(l.actionsDone || '')}</textarea></div></div>
    </div><div class="modal-f"><button class="btn btn-danger" style="margin-right:auto" data-action="delete-log" data-id="${l.id}">${I('trash', 15)}Excluir</button><button class="btn" data-modal-close>Cancelar</button><button class="btn btn-violet" data-action="save-log-form">Salvar</button></div>`;
  Forms.taskView = (t) => {
    const done = t.checklist.filter((i) => i.done).length;
    const feed = [...t.activity.map((a) => ({ at: a.at, h: `<div class="ev">${e(a.text)} · ${U.timeAgo(a.at)}</div>` })), ...t.comments.map((cm) => ({ at: cm.at, h: `<div class="cm"><div class="small dim">${e(cm.author || '')} · ${U.timeAgo(cm.at)}</div>${U.rich(cm.text)}</div>` }))].sort((a, b) => b.at - a.at);
    return `<div class="modal-h"><span class="small dim ell">${e(Store.client(t.clientId)?.name || 'Interno')}</span>${t.clickupUrl ? `<a class="small" href="${e(t.clickupUrl)}" target="_blank" rel="noopener">ClickUp↗</a>` : ''}<span style="flex:1"></span>
        <button class="ibtn" data-action="duplicate-task" data-id="${t.id}" title="Duplicar">${I('copy', 16)}</button><button class="ibtn" data-action="delete-task" data-id="${t.id}" title="Excluir">${I('trash', 16)}</button><button class="ibtn" data-modal-close title="Fechar">${I('x', 16)}</button></div>
      <div class="modal-b" id="task-view" data-id="${t.id}">
        <textarea class="field" id="t-title" rows="2" style="font-size:19px;font-weight:600;border:0;background:transparent;padding:0;resize:none" data-change="task-field" data-id="${t.id}" data-field="title">${e(t.title)}</textarea>
        <div class="tprops">
          <label>Status<select class="field" id="t-status" data-change="task-field" data-id="${t.id}" data-field="status">${M.STATUSES.map((s) => `<option value="${s.id}" ${s.id === t.status ? 'selected' : ''}>${e(s.label)}</option>`).join('')}</select></label>
          <label>Responsável<select class="field" id="t-assignee" data-change="task-field" data-id="${t.id}" data-field="assignee"><option value="">Ninguém</option>${[...new Set([...team(), t.assignee].filter(Boolean))].map((n) => `<option ${n === t.assignee ? 'selected' : ''}>${e(n)}</option>`).join('')}</select></label>
          <label>Vencimento<input class="field" type="date" id="t-due" value="${e(t.due || '')}" data-change="task-field" data-id="${t.id}" data-field="due"></label>
          <label>Prioridade<select class="field" id="t-prio" data-change="task-field" data-id="${t.id}" data-field="priority">${M.PRIORITIES.map((p) => `<option value="${p.id}" ${p.id === t.priority ? 'selected' : ''}>${e(p.label)}</option>`).join('')}</select></label>
          <label>Cliente<select class="field" id="t-client" data-change="task-field" data-id="${t.id}" data-field="clientId">${clientOpts().map(([v, l]) => `<option value="${e(v)}" ${v === (t.clientId || '') ? 'selected' : ''}>${e(l)}</option>`).join('')}</select></label>
          <label>Etiquetas<input class="field" id="t-tags" value="${e((t.tags || []).join(', '))}" data-change="task-tags" data-id="${t.id}"></label>
        </div>
        <textarea class="field" id="t-desc" rows="4" placeholder="Descrição" data-change="task-field" data-id="${t.id}" data-field="description">${e(t.description || '')}</textarea>
        <div class="lbl" style="margin:4px 0 0">Checklist ${done}/${t.checklist.length}</div>
        ${t.checklist.map((i) => `<div class="ck ${i.done ? 'done' : ''}"><input type="checkbox" style="width:17px;height:17px;accent-color:#7C5CFF" data-action="toggle-check" data-id="${t.id}" data-item="${i.id}" ${i.done ? 'checked' : ''}><span class="grow">${e(i.text)}</span><button class="ibtn" data-action="remove-check" data-id="${t.id}" data-item="${i.id}" title="Remover">${I('x', 14)}</button></div>`).join('')}
        <input class="field" id="t-check" placeholder="+ Adicionar item e Enter" data-enter="add-check" data-id="${t.id}">
        <div class="lbl" style="margin:4px 0 0">Comentários e atividade</div>
        <input class="field" id="t-comment" placeholder="Escreva um comentário e Enter" data-enter="add-comment" data-id="${t.id}">
        <div class="feed">${feed.map((f) => f.h).join('')}</div>
      </div>
      <div class="modal-f">${t.status === 'done' ? `<button class="btn" data-action="reopen-task" data-id="${t.id}">Reabrir</button>` : `<button class="btn btn-violet" data-action="done-task" data-id="${t.id}">${I('check', 15, 2.4)}Concluir</button>`}</div>`;
  };

  window.VS = VS;
  window.Views = { painel, clientes: clientesPage, cliente: clientePage, equipe: equipePage, criativos: criativosPage, ajustes: ajustesPage, rail, aiPanel, pendingList, entries, kindOf, KINDS };
  window.Forms = Forms;
})();
