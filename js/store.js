/* Estado, persistência (localStorage), regras de negócio e dados de exemplo. */
(function () {
  const KEY = 'bordo:data:v1';

  const DEFAULT_STATUSES = [
    { id: 'todo', label: 'Para fazer', color: '#8b93a7' },
    { id: 'doing', label: 'Em andamento', color: '#2f7de1' },
    { id: 'waiting', label: 'Aguardando cliente', color: '#d88a06' },
    { id: 'review', label: 'Em revisão', color: '#9333ea' },
    { id: 'done', label: 'Concluído', color: '#12a36b' },
  ];
  const PRIORITIES = [
    { id: 'urgent', label: 'Urgente', color: '#e0443e', weight: 4 },
    { id: 'high', label: 'Alta', color: '#ea7a0c', weight: 3 },
    { id: 'normal', label: 'Normal', color: '#2f7de1', weight: 2 },
    { id: 'low', label: 'Baixa', color: '#94a3b8', weight: 1 },
  ];
  const LOG_TYPES = [
    { id: 'analise', label: 'Análise diária', icon: '🔎' },
    { id: 'otimizacao', label: 'Otimização', icon: '🛠️' },
    { id: 'campanha', label: 'Campanha', icon: '🎯' },
    { id: 'criativo', label: 'Criativo', icon: '🎨' },
    { id: 'reuniao', label: 'Reunião', icon: '📞' },
    { id: 'contato', label: 'Contato', icon: '💬' },
    { id: 'relatorio', label: 'Relatório', icon: '📊' },
    { id: 'resultado', label: 'Resultado', icon: '🏆' },
    { id: 'problema', label: 'Problema', icon: '⚠️' },
    { id: 'insight', label: 'Insight', icon: '💡' },
    { id: 'nota', label: 'Nota', icon: '📝' },
    { id: 'tarefa', label: 'Tarefa concluída', icon: '✅' },
  ];
  const CLIENT_STATUSES = [
    { id: 'onboarding', label: 'Onboarding', color: '#2f7de1' },
    { id: 'ativo', label: 'Ativo', color: '#12a36b' },
    { id: 'pausado', label: 'Pausado', color: '#d88a06' },
    { id: 'encerrado', label: 'Encerrado', color: '#8b93a7' },
  ];
  const RECURRENCES = [
    { id: 'none', label: 'Não repete' },
    { id: 'daily', label: 'Todo dia (úteis)' },
    { id: 'weekly', label: 'Toda semana' },
    { id: 'biweekly', label: 'A cada 2 semanas' },
    { id: 'monthly', label: 'Todo mês' },
  ];
  const CLIENT_COLORS = ['#5b5bd6', '#12a36b', '#e0443e', '#d88a06', '#2f7de1', '#c2410c', '#9333ea', '#0891b2', '#db2777', '#4d7c0f', '#475569'];

  const DEFAULT_SETTINGS = {
    userName: 'Você',
    workspaceName: 'Agência',
    team: ['Você'],
    theme: 'auto',
    staleDays: 7,
    autoLog: true,
    demo: false,
    onboardingTemplate: [
      'Reunião de kickoff e alinhamento de expectativas',
      'Receber acessos (BM, conta de anúncios, página, Instagram)',
      'Configurar pixel / API de conversões',
      'Definir público, oferta e verba inicial',
      'Produzir primeiros criativos',
      'Montar formulário / LP de captação',
      'Subir campanhas iniciais',
      'Primeiro registro de resultados no diário (7 dias)',
    ],
  };

  const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
  const META = {
    DEFAULT_STATUSES, STATUSES: DEFAULT_STATUSES, PRIORITIES, LOG_TYPES, CLIENT_STATUSES, RECURRENCES, CLIENT_COLORS,
    status: byId(DEFAULT_STATUSES), priority: byId(PRIORITIES), logType: byId(LOG_TYPES),
    clientStatus: byId(CLIENT_STATUSES), recurrence: byId(RECURRENCES),
  };

  const S = {
    META,
    state: null,
    listeners: [],

    load() {
      let data = null;
      try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { data = null; }
      // Página privada pode trazer os dados reais da agência (window.BORDO_SEED); substitui os dados de exemplo.
      const seed = window.BORDO_SEED;
      if (seed && (!data || !Array.isArray(data.clients) || data.settings?.demo || (data.settings?.seedVersion || 0) < (seed.settings?.seedVersion || 0) && !data.settings?.touched)) data = JSON.parse(JSON.stringify(seed));
      if (!data || !Array.isArray(data.clients)) data = Seed.build();
      this.state = this.normalize(data);
      if (seed && (this.state.settings.seedVersion || 0) < (seed.settings?.seedVersion || 0)) this.mergeSeed(seed);
      this.refreshMeta();
      this.processRecurring();
    },

    /** Traz dados novos da agência sem apagar o que já foi registrado neste navegador. */
    mergeSeed(seed) {
      const st = this.state;
      const has = (arr) => new Set(arr.map((x) => x.id));
      const cIds = has(st.clients), tIds = has(st.tasks), lIds = has(st.logs);
      seed.clients.forEach((sc) => {
        const c = st.clients.find((x) => x.id === sc.id);
        if (!c) { st.clients.push(JSON.parse(JSON.stringify(sc))); return; }
        ['metaPage', 'adAccount', 'niche', 'owner', 'diarySheetUrl', 'clickupUrl'].forEach((k) => { if (!c[k] && sc[k]) c[k] = sc[k]; });
      });
      seed.tasks.forEach((t) => { if (!tIds.has(t.id)) st.tasks.push(JSON.parse(JSON.stringify(t))); });
      seed.logs.forEach((l) => { if (!lIds.has(l.id) && (cIds.has(l.clientId) || st.clients.some((c) => c.id === l.clientId))) st.logs.push(JSON.parse(JSON.stringify(l))); });
      st.settings.seedVersion = seed.settings.seedVersion;
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (err) { /* ignora */ }
    },

    /** Status de tarefa são configuráveis (ex.: os mesmos do ClickUp). O id 'done' é sempre o status final. */
    refreshMeta() {
      const list = Array.isArray(this.settings.statuses) && this.settings.statuses.some((x) => x.id === 'done') ? this.settings.statuses : DEFAULT_STATUSES;
      META.STATUSES = list;
      META.status = byId(list);
    },

    normalize(d) {
      return {
        version: 1,
        clients: (d.clients || []).map((c) => ({ links: [], access: [], goals: {}, contact: {}, contract: {}, notes: '', tags: [], metaPage: '', instagram: '', owner: '', adAccount: '', ...c })),
        tasks: (d.tasks || []).map((t) => ({ tags: [], checklist: [], comments: [], activity: [], timeSpent: 0, recurrence: 'none', priority: 'normal', status: 'todo', description: '', ...t })),
        logs: (d.logs || []).map((l) => ({ tags: [], metrics: {}, impact: 'neutro', type: 'nota', ...l })),
        metrics: d.metrics || [],
        settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
      };
    },

    save() {
      this.state.settings.touched = true;
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) {
        window.UI && UI.toast('Não foi possível salvar no navegador (armazenamento cheio ou bloqueado).');
      }
      this.listeners.forEach((fn) => fn());
    },

    onChange(fn) { this.listeners.push(fn); },

    get settings() { return this.state.settings; },

    /* ---------------- Clientes ---------------- */
    client(id) { return this.state.clients.find((c) => c.id === id); },
    clients({ includeClosed = true } = {}) {
      const order = { ativo: 0, onboarding: 1, pausado: 2, encerrado: 3 };
      return this.state.clients
        .filter((c) => includeClosed || c.status !== 'encerrado')
        .slice()
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || order[a.status] - order[b.status] || a.name.localeCompare(b.name));
    },
    addClient(data, { withOnboarding = false } = {}) {
      const used = this.state.clients.map((c) => c.color);
      const color = data.color || CLIENT_COLORS.find((c) => !used.includes(c)) || U.hashColor(data.name);
      const c = {
        id: U.uid(), name: 'Novo cliente', company: '', niche: '', status: 'onboarding', color,
        contact: {}, contract: {}, goals: {}, links: [], access: [], notes: '', tags: [],
        createdAt: Date.now(), ...data,
      };
      c.color = color;
      this.state.clients.push(c);
      if (withOnboarding) {
        const tmpl = this.settings.onboardingTemplate || [];
        const t = this.addTask({
          clientId: c.id, title: `Onboarding — ${c.name}`, priority: 'high', due: U.addDays(U.today(), 7),
          checklist: tmpl.map((text) => ({ id: U.uid(), text, done: false })),
          description: 'Checklist padrão de entrada do cliente. Edite o modelo em Configurações.',
        }, { silent: true });
        t.activity.push({ at: Date.now(), text: 'Criada a partir do modelo de onboarding' });
      }
      this.addLog({ clientId: c.id, type: 'nota', title: 'Cliente cadastrado', body: `Início do diário de bordo de ${c.name}.`, auto: true }, { silent: true });
      this.save();
      return c;
    },
    updateClient(id, patch) {
      const c = this.client(id); if (!c) return;
      Object.assign(c, patch);
      this.save();
    },
    removeClient(id) {
      const snapshot = {
        client: this.client(id),
        tasks: this.state.tasks.filter((t) => t.clientId === id),
        logs: this.state.logs.filter((l) => l.clientId === id),
        metrics: this.state.metrics.filter((m) => m.clientId === id),
      };
      this.state.clients = this.state.clients.filter((c) => c.id !== id);
      this.state.tasks = this.state.tasks.filter((t) => t.clientId !== id);
      this.state.logs = this.state.logs.filter((l) => l.clientId !== id);
      this.state.metrics = this.state.metrics.filter((m) => m.clientId !== id);
      this.save();
      return snapshot;
    },
    restoreClient(snap) {
      this.state.clients.push(snap.client);
      this.state.tasks.push(...snap.tasks);
      this.state.logs.push(...snap.logs);
      this.state.metrics.push(...snap.metrics);
      this.save();
    },

    /* ---------------- Tarefas ---------------- */
    task(id) { return this.state.tasks.find((t) => t.id === id); },
    tasks(filter = {}) {
      return this.state.tasks.filter((t) => {
        if (filter.clientId !== undefined && filter.clientId !== '' && t.clientId !== filter.clientId) return false;
        if (filter.status && t.status !== filter.status) return false;
        if (filter.open && t.status === 'done') return false;
        if (filter.priority && t.priority !== filter.priority) return false;
        if (filter.assignee && t.assignee !== filter.assignee) return false;
        if (filter.q) {
          const c = t.clientId ? this.client(t.clientId) : null;
          const hay = [t.title, t.description, (t.tags || []).join(' '), c ? c.name : ''].join(' ');
          if (!U.match(hay, filter.q)) return false;
        }
        return true;
      });
    },
    sortTasks(list) {
      const pw = (t) => (META.priority[t.priority] || META.priority.normal).weight;
      return list.slice().sort((a, b) => {
        const ad = a.status === 'done', bd = b.status === 'done';
        if (ad !== bd) return ad ? 1 : -1;
        if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
        if (!!a.due !== !!b.due) return a.due ? -1 : 1;
        return pw(b) - pw(a) || (a.createdAt || 0) - (b.createdAt || 0);
      });
    },
    isOverdue(t) { return t.status !== 'done' && t.due && t.due < U.today(); },
    addTask(data, { silent = false } = {}) {
      const t = {
        id: U.uid(), title: 'Nova tarefa', description: '', status: 'todo', priority: 'normal',
        clientId: '', assignee: this.settings.userName, due: '', tags: [], checklist: [], comments: [],
        activity: [], timeSpent: 0, recurrence: 'none', createdAt: Date.now(), ...data,
      };
      t.activity = [{ at: Date.now(), text: 'Tarefa criada' }, ...(t.activity || [])];
      this.state.tasks.push(t);
      if (!silent) this.save();
      return t;
    },
    updateTask(id, patch, { log = true } = {}) {
      const t = this.task(id); if (!t) return;
      const before = { ...t };
      Object.assign(t, patch);
      if (log) {
        if (patch.status && patch.status !== before.status) {
          t.activity.push({ at: Date.now(), text: `Status: ${META.status[before.status]?.label} → ${META.status[patch.status]?.label}` });
        }
        if (patch.due !== undefined && patch.due !== before.due) t.activity.push({ at: Date.now(), text: patch.due ? `Prazo definido para ${U.fmtDate(patch.due)}` : 'Prazo removido' });
        if (patch.priority && patch.priority !== before.priority) t.activity.push({ at: Date.now(), text: `Prioridade: ${META.priority[patch.priority]?.label}` });
        if (patch.assignee !== undefined && patch.assignee !== before.assignee) t.activity.push({ at: Date.now(), text: `Responsável: ${patch.assignee || 'ninguém'}` });
        if (patch.clientId !== undefined && patch.clientId !== before.clientId) t.activity.push({ at: Date.now(), text: `Cliente: ${this.client(patch.clientId)?.name || 'Interno'}` });
      }
      let spawned = null;
      if (patch.status === 'done' && before.status !== 'done') {
        t.completedAt = Date.now();
        spawned = this.onComplete(t);
      } else if (patch.status && patch.status !== 'done') {
        t.completedAt = null;
      }
      this.save();
      return spawned;
    },
    onComplete(t) {
      if (this.settings.autoLog && t.clientId) {
        const done = t.checklist.filter((i) => i.done).length;
        const extra = t.checklist.length ? `\nChecklist: ${done}/${t.checklist.length} itens` : '';
        const time = t.timeSpent ? `\nTempo registrado: ${U.fmtMinutes(t.timeSpent)}` : '';
        this.addLog({ clientId: t.clientId, type: 'tarefa', title: t.title, body: (t.description ? t.description.split('\n')[0] : '') + extra + time, taskId: t.id, auto: true }, { silent: true });
      }
      if (t.recurrence && t.recurrence !== 'none') {
        const base = t.due || U.today();
        let next;
        if (t.recurrence === 'daily') { next = U.addDays(base, 1); while ([0, 6].includes(U.parse(next).getDay())) next = U.addDays(next, 1); }
        else if (t.recurrence === 'weekly') next = U.addDays(base, 7);
        else if (t.recurrence === 'biweekly') next = U.addDays(base, 14);
        else next = U.addMonths(base, 1);
        const copy = this.addTask({
          title: t.title, description: t.description, priority: t.priority, clientId: t.clientId,
          assignee: t.assignee, tags: [...t.tags], recurrence: t.recurrence, due: next,
          checklist: t.checklist.map((i) => ({ id: U.uid(), text: i.text, done: false })),
        }, { silent: true });
        t.recurrence = 'none';
        t.activity.push({ at: Date.now(), text: `Próxima recorrência criada para ${U.fmtDate(next)}` });
        return copy;
      }
      return null;
    },
    /** Garante que tarefas recorrentes antigas não se percam (nada a fazer por enquanto; ganchos futuros). */
    processRecurring() {},
    removeTask(id) {
      const t = this.task(id);
      this.state.tasks = this.state.tasks.filter((x) => x.id !== id);
      this.save();
      return t;
    },
    restoreTask(t) { this.state.tasks.push(t); this.save(); },
    duplicateTask(id) {
      const t = this.task(id); if (!t) return;
      const copy = JSON.parse(JSON.stringify(t));
      Object.assign(copy, { id: U.uid(), title: t.title + ' (cópia)', status: 'todo', completedAt: null, createdAt: Date.now(), comments: [], activity: [] });
      copy.checklist.forEach((i) => { i.id = U.uid(); i.done = false; });
      return this.addTask(copy);
    },

    /* ---------------- Diário de bordo ---------------- */
    log(id) { return this.state.logs.find((l) => l.id === id); },
    logs(filter = {}) {
      return this.state.logs.filter((l) => {
        if (filter.clientId && l.clientId !== filter.clientId) return false;
        if (filter.type && l.type !== filter.type) return false;
        if (filter.from && l.date < filter.from) return false;
        if (filter.to && l.date > filter.to) return false;
        if (filter.hideAuto && l.auto) return false;
        if (filter.impact && l.impact !== filter.impact) return false;
        if (filter.q && !U.match([l.title, l.body, l.analysis, l.planned, l.actionsDone, (l.tags || []).join(' ')].join(' '), filter.q)) return false;
        return true;
      }).sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')) || b.createdAt - a.createdAt);
    },
    addLog(data, { silent = false } = {}) {
      const l = {
        id: U.uid(), clientId: '', date: U.today(), time: U.nowTime(), type: 'nota', title: '', body: '', analysis: '', planned: '', actionsDone: '',
        impact: 'neutro', tags: [], metrics: {}, author: this.settings.userName, createdAt: Date.now(), ...data,
      };
      this.state.logs.push(l);
      if (!silent) this.save();
      return l;
    },
    updateLog(id, patch) { const l = this.log(id); if (!l) return; Object.assign(l, { editedAt: Date.now() }, patch); this.save(); },
    removeLog(id) { const l = this.log(id); this.state.logs = this.state.logs.filter((x) => x.id !== id); this.save(); return l; },
    restoreLog(l) { this.state.logs.push(l); this.save(); },
    lastLog(clientId, { manualOnly = true } = {}) {
      return this.logs({ clientId }).find((l) => !manualOnly || !l.auto) || null;
    },

    /* ---------------- Métricas ---------------- */
    metricsFor(clientId) {
      return this.state.metrics.filter((m) => m.clientId === clientId).sort((a, b) => a.week.localeCompare(b.week));
    },
    upsertMetric(data) {
      const existing = this.state.metrics.find((m) => m.clientId === data.clientId && m.week === data.week && m.id !== data.id);
      if (existing && !data.id) { Object.assign(existing, data, { id: existing.id }); this.save(); return existing; }
      if (data.id) { const m = this.state.metrics.find((x) => x.id === data.id); Object.assign(m, data); this.save(); return m; }
      const m = { id: U.uid(), createdAt: Date.now(), ...data };
      this.state.metrics.push(m);
      this.save();
      return m;
    },
    removeMetric(id) { const m = this.state.metrics.find((x) => x.id === id); this.state.metrics = this.state.metrics.filter((x) => x.id !== id); this.save(); return m; },
    restoreMetric(m) { this.state.metrics.push(m); this.save(); },
    derive(m) {
      if (!m) return {};
      const cpl = m.leads ? m.spend / m.leads : null;
      const cpq = m.qualified ? m.spend / m.qualified : null;
      const cpc = m.contracts ? m.spend / m.contracts : null;
      const roas = m.spend && m.revenue ? m.revenue / m.spend : null;
      const conv = m.leads && m.contracts != null ? m.contracts / m.leads : null;
      return { cpl, cpq, cpc, roas, conv };
    },
    monthSpend(clientId, monthIso = U.monthStart(U.today())) {
      const month = monthIso.slice(0, 7);
      return this.metricsFor(clientId).filter((m) => m.week.slice(0, 7) === month).reduce((s, m) => s + (m.spend || 0), 0);
    },

    /* ---------------- Saúde do cliente ---------------- */
    health(client) {
      const reasons = [];
      let score = 100;
      if (client.status === 'encerrado') return { score: null, level: 'none', reasons: ['Cliente encerrado'] };
      const open = this.tasks({ clientId: client.id, open: true });
      const overdue = open.filter((t) => this.isOverdue(t));
      if (overdue.length) {
        score -= Math.min(40, overdue.length * 12);
        reasons.push(`${overdue.length} tarefa(s) atrasada(s)`);
      }
      const last = this.lastLog(client.id);
      const stale = this.settings.staleDays || 7;
      const since = last ? U.diffDays(U.today(), last.date) : 999;
      if (since > stale && client.status !== 'pausado') {
        score -= since > stale * 2 ? 30 : 18;
        reasons.push(last ? `Sem registro no diário há ${since} dias` : 'Diário de bordo vazio');
      }
      const ms = this.metricsFor(client.id);
      const lastM = ms[ms.length - 1];
      if (lastM && client.goals?.cpl) {
        const cpl = this.derive(lastM).cpl;
        if (cpl != null && cpl > client.goals.cpl * 1.15) { score -= 22; reasons.push(`CPL ${U.fmtMoney(cpl)} acima da meta (${U.fmtMoney(client.goals.cpl)})`); }
        else if (cpl != null && cpl > client.goals.cpl) { score -= 10; reasons.push('CPL levemente acima da meta'); }
      }
      if (lastM && U.diffDays(U.today(), lastM.week) > 14 && client.status === 'ativo') { score -= 10; reasons.push('Métricas desatualizadas'); }
      if (!lastM && client.status === 'ativo') { score -= 8; reasons.push('Nenhuma métrica registrada'); }
      const negatives = this.logs({ clientId: client.id, from: U.addDays(U.today(), -14), impact: 'negativo' }).length;
      if (negatives >= 2) { score -= 8; reasons.push(`${negatives} registros negativos em 14 dias`); }
      if (client.contract?.renewal) {
        const d = U.diffDays(client.contract.renewal, U.today());
        if (d >= 0 && d <= 15) reasons.push(`Renovação de contrato em ${d} dia(s)`);
      }
      score = Math.max(0, Math.min(100, score));
      const level = score >= 80 ? 'good' : score >= 55 ? 'warn' : 'bad';
      if (!reasons.length) reasons.push('Tudo em dia');
      return { score, level, reasons };
    },

    /* ---------------- Backup ---------------- */
    exportJSON() { return JSON.stringify({ app: 'bordo', exportedAt: new Date().toISOString(), ...this.state }, null, 2); },
    importJSON(text) {
      const d = JSON.parse(text);
      if (!d || !Array.isArray(d.clients)) throw new Error('Arquivo inválido');
      this.state = this.normalize(d);
      this.refreshMeta();
      this.save();
    },
    reset(withDemo) {
      const keep = { ...this.settings, demo: false };
      this.state = withDemo ? this.normalize(Seed.build()) : this.normalize({ clients: [], tasks: [], logs: [], metrics: [], settings: keep });
      if (withDemo) this.state.settings = { ...this.state.settings, userName: keep.userName, team: keep.team, theme: keep.theme, statuses: null };
      this.refreshMeta();
      this.save();
    },
  };

  /* ---------------- Dados de exemplo ---------------- */
  const Seed = {
    build() {
      const T = U.today();
      const d = (n) => U.addDays(T, n);
      const wk = (n) => U.addDays(U.weekStart(T), n * 7);
      const now = Date.now();
      const clients = [
        {
          id: 'c1', name: 'Almeida & Rocha Advogados', company: 'Almeida & Rocha Sociedade de Advogados', niche: 'Gestão de passivos (PJ)', status: 'ativo', color: '#5b5bd6', pinned: true,
          contact: { name: 'Dr. Ricardo Almeida', phone: '(11) 98888-1234', email: 'ricardo@almeidarocha.adv.br', role: 'Sócio' },
          contract: { fee: 3500, budget: 6000, start: U.addMonths(T, -5), renewal: d(12), payday: 10 },
          goals: { cpl: 45, leads: 35, contracts: 4 },
          links: [
            { label: 'Gerenciador de Anúncios', url: 'https://adsmanager.facebook.com' },
            { label: 'Planilha de leads', url: 'https://docs.google.com' },
            { label: 'Landing page', url: 'https://example.com' },
          ],
          access: [{ label: 'Conta de anúncios', value: 'act_0000000000' }, { label: 'Página FB', value: 'Almeida & Rocha' }],
          notes: 'Cliente prefere receber relatório **toda segunda até 10h** pelo WhatsApp.\n- Não usar imagens de dinheiro nos criativos\n- Foco: empresário com dívida bancária acima de R$ 100 mil',
          tags: ['Meta Ads', 'Premium'], createdAt: now - 150 * 864e5, metaPage: 'https://facebook.com/', owner: 'Você', adAccount: 'act_000000001',
        },
        {
          id: 'c2', name: 'Costa Direito Bancário', company: 'Costa & Lima Advocacia', niche: 'Golpe PIX / fraude bancária', status: 'ativo', color: '#12a36b',
          contact: { name: 'Dra. Fernanda Costa', phone: '(21) 97777-5678', email: 'fernanda@costalima.adv.br', role: 'Sócia' },
          contract: { fee: 2800, budget: 4500, start: U.addMonths(T, -3), renewal: U.addMonths(T, 3), payday: 5 },
          goals: { cpl: 30, leads: 40, contracts: 6 },
          links: [{ label: 'Gerenciador de Anúncios', url: 'https://adsmanager.facebook.com' }],
          access: [], notes: 'Atendimento dos leads é feito pela secretária Paula (horário comercial).', tags: ['Meta Ads'], createdAt: now - 90 * 864e5,
        },
        {
          id: 'c3', name: 'Ribeiro Agro Jurídico', company: 'Ribeiro Advocacia Agrária', niche: 'Produtor rural', status: 'ativo', color: '#d88a06',
          contact: { name: 'Dr. Paulo Ribeiro', phone: '(62) 96666-4321', email: 'paulo@ribeiroagro.adv.br', role: 'Titular' },
          contract: { fee: 3000, budget: 5000, start: U.addMonths(T, -8), renewal: U.addMonths(T, 4), payday: 15 },
          goals: { cpl: 60, leads: 20, contracts: 3 },
          links: [], access: [], notes: '', tags: ['Meta Ads', 'Google Ads'], createdAt: now - 240 * 864e5,
        },
        {
          id: 'c4', name: 'Moura Trabalhista', company: 'Moura Advocacia', niche: 'Direito trabalhista', status: 'onboarding', color: '#db2777',
          contact: { name: 'Dra. Juliana Moura', phone: '(31) 95555-8765', email: 'juliana@moura.adv.br', role: 'Titular' },
          contract: { fee: 2200, budget: 3000, start: d(-6), renewal: U.addMonths(T, 6), payday: 20 },
          goals: { cpl: 25, leads: 30, contracts: 5 },
          links: [], access: [], notes: '', tags: ['Meta Ads'], createdAt: now - 6 * 864e5,
        },
        {
          id: 'c5', name: 'Pereira Previdenciário', company: 'Pereira Advogados', niche: 'Previdenciário', status: 'pausado', color: '#0891b2',
          contact: { name: 'Dr. Marcos Pereira', phone: '(41) 94444-1111', email: 'marcos@pereira.adv.br' },
          contract: { fee: 1800, budget: 2000, start: U.addMonths(T, -10) },
          goals: { cpl: 20 }, links: [], access: [], notes: 'Pausado a pedido do cliente (equipe sem capacidade de atendimento). Retomar contato em 30 dias.', tags: [], createdAt: now - 300 * 864e5,
        },
      ];

      let n = 0;
      const task = (o) => ({
        id: 't' + (++n), description: '', status: 'todo', priority: 'normal', assignee: 'Você', tags: [], checklist: [], comments: [],
        activity: [{ at: now - 3 * 864e5, text: 'Tarefa criada' }], timeSpent: 0, recurrence: 'none', createdAt: now - (20 - n) * 36e5, ...o,
      });
      const ck = (...items) => items.map((x) => ({ id: U.uid(), text: x.replace(/^\+/, ''), done: x.startsWith('+') }));
      const tasks = [
        task({ clientId: 'c1', title: 'Enviar relatório semanal ao cliente', priority: 'high', due: T, recurrence: 'weekly', tags: ['Relatório'], checklist: ck('+Puxar métricas do Gerenciador', '+Cruzar com planilha de leads', 'Escrever análise', 'Enviar no WhatsApp') }),
        task({ clientId: 'c1', title: 'Trocar criativos com frequência > 3', status: 'doing', priority: 'urgent', due: d(-1), tags: ['Criativo'], description: 'Frequência do conjunto "Empresários SP" passou de 3,2. Subir 3 variações novas.', timeSpent: 45 }),
        task({ clientId: 'c1', title: 'Testar público semelhante 1% de leads qualificados', priority: 'normal', due: d(3), tags: ['Teste'] }),
        task({ clientId: 'c1', title: 'Reunião mensal de resultados', status: 'waiting', priority: 'high', due: d(2), description: 'Aguardando o cliente confirmar horário.', tags: ['Reunião'] }),
        task({ clientId: 'c2', title: 'Ajustar formulário: nova pergunta sobre valor do golpe', status: 'review', priority: 'high', due: d(1), tags: ['Formulário'], checklist: ck('+Criar pergunta', '+Testar envio', 'Aprovação da Dra. Fernanda') }),
        task({ clientId: 'c2', title: 'Duplicar campanha vencedora para escala', priority: 'normal', due: d(4), tags: ['Escala'] }),
        task({ clientId: 'c2', title: 'Conferir leads que não chegaram na planilha', priority: 'urgent', due: d(-2), tags: ['Integração'], description: 'Cliente relatou 3 leads no Gerenciador que não apareceram na planilha do Make.' }),
        task({ clientId: 'c3', title: 'Gravar roteiro de vídeo com o Dr. Paulo', status: 'waiting', priority: 'normal', due: d(6), tags: ['Criativo'] }),
        task({ clientId: 'c3', title: 'Análise de CPL por região', status: 'done', priority: 'normal', due: d(-3), completedAt: now - 2 * 864e5, tags: ['Análise'] }),
        task({ clientId: 'c4', title: 'Onboarding — Moura Trabalhista', priority: 'high', due: d(1), status: 'doing', checklist: ck('+Reunião de kickoff e alinhamento de expectativas', '+Receber acessos (BM, conta de anúncios, página, Instagram)', 'Configurar pixel / API de conversões', 'Definir público, oferta e verba inicial', 'Produzir primeiros criativos', 'Montar formulário / LP de captação', 'Subir campanhas iniciais') }),
        task({ clientId: 'c4', title: 'Criar 5 criativos iniciais', priority: 'normal', due: d(3), tags: ['Criativo'] }),
        task({ clientId: 'c5', title: 'Retomar contato para reativação', priority: 'low', due: d(20), tags: ['Comercial'] }),
        task({ clientId: '', title: 'Revisar processo de relatórios da agência', priority: 'low', due: d(8), tags: ['Interno'] }),
        task({ clientId: '', title: 'Emitir notas fiscais do mês', priority: 'high', due: d(5), recurrence: 'monthly', tags: ['Financeiro'] }),
        task({ clientId: 'c2', title: 'Enviar relatório semanal ao cliente', status: 'done', priority: 'high', due: d(-7), completedAt: now - 7 * 864e5, tags: ['Relatório'] }),
        task({ clientId: 'c1', title: 'Configurar API de conversões', status: 'done', priority: 'normal', due: d(-5), completedAt: now - 5 * 864e5 }),
        task({ clientId: 'c2', title: 'Novo criativo em vídeo — depoimento', status: 'done', priority: 'normal', due: d(-1), completedAt: now - 1 * 864e5 }),
      ];

      let k = 0;
      const log = (o) => ({ id: 'l' + (++k), tags: [], metrics: {}, impact: 'neutro', author: 'Você', createdAt: now - k * 1000, time: '10:00', ...o });
      const logs = [
        log({ clientId: 'c1', date: T, time: '09:12', type: 'otimizacao', title: 'Pausado conjunto "Empresários RJ"', body: 'CPL de R$ 78 nos últimos 5 dias, bem acima da meta de R$ 45.\n- Verba realocada para "Empresários SP" (+R$ 40/dia)\n- Manter monitoramento por 72h', impact: 'positivo', tags: ['verba'] }),
        log({ clientId: 'c1', date: d(-1), time: '16:40', type: 'reuniao', title: 'Call de alinhamento com Dr. Ricardo', body: 'Cliente satisfeito com volume, mas quer **mais leads acima de R$ 300 mil** de dívida.\nCombinado: ajustar a pergunta de faixa no formulário e testar criativo focado em empresas maiores.', impact: 'positivo', tags: ['alinhamento'] }),
        log({ clientId: 'c1', date: d(-3), time: '11:05', type: 'resultado', title: 'Fechou 2 contratos de leads da campanha', body: 'Os dois vieram do criativo "carrossel dívida bancária". Ticket médio informado: R$ 12 mil.', impact: 'positivo', metrics: { spend: 1450, leads: 34 } }),
        log({ clientId: 'c1', date: d(-6), time: '14:20', type: 'criativo', title: 'Subidos 3 criativos novos (vídeo + 2 estáticos)', body: 'Hooks testados: "Sua empresa está no cheque especial?", "Banco ligando todo dia?"', impact: 'neutro' }),
        log({ clientId: 'c1', date: d(-9), time: '10:00', type: 'relatorio', title: 'Relatório semanal enviado', body: 'Investimento R$ 1.390 · 31 leads · CPL R$ 44,84', impact: 'neutro', metrics: { spend: 1390, leads: 31 } }),
        log({ clientId: 'c2', date: d(-1), time: '18:02', type: 'problema', title: 'Leads não chegando na planilha', body: 'Cliente avisou que 3 leads do dia não apareceram. Suspeita: cenário do Make pausado após erro de token.', impact: 'negativo', tags: ['integração'] }),
        log({ clientId: 'c2', date: d(-2), time: '09:30', type: 'campanha', title: 'Nova campanha de cadastro ativada', body: 'Objetivo: leads (formulário instantâneo). Verba R$ 150/dia. Público aberto 30-60 anos, RJ + SP.', impact: 'neutro' }),
        log({ clientId: 'c2', date: d(-5), time: '15:15', type: 'insight', title: 'Leads à noite convertem melhor', body: 'Cruzando com a planilha: 60% dos contratos vieram de leads entre 19h e 23h. Avaliar programação de anúncios.', impact: 'positivo' }),
        log({ clientId: 'c2', date: d(-8), time: '10:10', type: 'contato', title: 'Cliente pediu pausa no fim de semana', body: 'Equipe não atende sábado/domingo. Programação ajustada.', impact: 'neutro' }),
        log({ clientId: 'c3', date: d(-11), time: '13:00', type: 'otimizacao', title: 'Exclusão de regiões com CPL alto', body: 'Removido Norte e Nordeste do conjunto principal.', impact: 'positivo' }),
        log({ clientId: 'c3', date: d(-2), time: '17:30', type: 'tarefa', title: 'Análise de CPL por região', body: '', impact: 'neutro', auto: true, taskId: 't9' }),
        log({ clientId: 'c4', date: d(-6), time: '10:00', type: 'nota', title: 'Cliente cadastrado', body: 'Início do diário de bordo de Moura Trabalhista.', auto: true }),
        log({ clientId: 'c4', date: d(-5), time: '15:00', type: 'reuniao', title: 'Kickoff realizado', body: 'Público: trabalhadores demitidos nos últimos 2 anos.\n- Oferta: análise gratuita de rescisão\n- Verba inicial: R$ 100/dia', impact: 'positivo' }),
        log({ clientId: 'c5', date: d(-25), time: '11:00', type: 'contato', title: 'Cliente pediu pausa das campanhas', body: 'Equipe de atendimento sobrecarregada. Retomar em ~30 dias.', impact: 'negativo' }),
      ];

      let mm = 0;
      const met = (clientId, w, spend, leads, qualified, meetings, contracts, revenue) => ({ id: 'm' + (++mm), clientId, week: wk(w), spend, leads, qualified, meetings, contracts, revenue, createdAt: now });
      const metrics = [
        met('c1', -5, 1200, 22, 16, 7, 1, 9000), met('c1', -4, 1310, 26, 19, 8, 1, 11000), met('c1', -3, 1390, 31, 22, 9, 2, 21000),
        met('c1', -2, 1450, 34, 25, 11, 2, 24000), met('c1', -1, 1480, 29, 21, 8, 1, 12000),
        met('c2', -4, 900, 35, 22, 10, 3, 9000), met('c2', -3, 980, 38, 25, 12, 4, 13000), met('c2', -2, 1020, 30, 18, 8, 2, 7000), met('c2', -1, 1050, 27, 15, 6, 2, 6500),
        met('c3', -3, 1100, 17, 12, 5, 1, 15000), met('c3', -2, 1150, 19, 14, 6, 1, 18000),
        met('c5', -8, 480, 26, 15, 5, 1, 3000),
      ];

      return { clients, tasks, logs, metrics, settings: { ...DEFAULT_SETTINGS, demo: true } };
    },
  };

  window.Store = S;
  window.META = META;
})();
