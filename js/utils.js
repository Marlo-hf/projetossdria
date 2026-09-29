/* Utilitários: datas, formatação, texto. */
(function () {
  const U = {};

  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

  U.pad = (n) => String(n).padStart(2, '0');

  /* ---------- Datas (sempre ISO local YYYY-MM-DD) ---------- */
  U.toISO = (d) => `${d.getFullYear()}-${U.pad(d.getMonth() + 1)}-${U.pad(d.getDate())}`;
  U.today = () => U.toISO(new Date());
  U.parse = (iso) => {
    const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  U.addDays = (iso, n) => { const d = U.parse(iso); d.setDate(d.getDate() + n); return U.toISO(d); };
  U.addMonths = (iso, n) => {
    const d = U.parse(iso);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return U.toISO(d);
  };
  /** a - b em dias */
  U.diffDays = (a, b) => Math.round((U.parse(a) - U.parse(b)) / 86400000);
  U.weekStart = (iso) => { const d = U.parse(iso); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return U.toISO(d); };
  U.monthStart = (iso) => iso.slice(0, 8) + '01';
  U.nowTime = () => { const d = new Date(); return `${U.pad(d.getHours())}:${U.pad(d.getMinutes())}`; };

  U.MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  U.MONTHS_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  U.WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  U.WD_FULL = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  U.fmtDate = (iso, withYear) => {
    if (!iso) return '—';
    const d = U.parse(iso);
    const y = withYear || d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
    return `${d.getDate()} ${U.MONTHS[d.getMonth()]}${y}`;
  };
  U.fmtLong = (iso) => {
    const d = U.parse(iso);
    return `${U.WD_FULL[d.getDay()]}, ${d.getDate()} de ${U.MONTHS_FULL[d.getMonth()]} de ${d.getFullYear()}`;
  };
  U.fmtDayLabel = (iso) => {
    const diff = U.diffDays(iso, U.today());
    const d = U.parse(iso);
    if (diff === 0) return 'Hoje';
    if (diff === -1) return 'Ontem';
    if (diff === 1) return 'Amanhã';
    const wd = U.WD_FULL[d.getDay()];
    return wd.charAt(0).toUpperCase() + wd.slice(1) + ', ' + U.fmtDate(iso);
  };
  /** Rótulo amigável para prazo */
  U.fmtDue = (iso) => {
    if (!iso) return '';
    const diff = U.diffDays(iso, U.today());
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    if (diff === -1) return 'Ontem';
    if (diff < -1 && diff > -7) return `há ${-diff} dias`;
    if (diff > 1 && diff < 7) return U.WD[U.parse(iso).getDay()];
    return U.fmtDate(iso);
  };
  U.daysAgoLabel = (iso) => {
    if (!iso) return 'nunca';
    const n = U.diffDays(U.today(), iso);
    if (n <= 0) return 'hoje';
    if (n === 1) return 'ontem';
    return `há ${n} dias`;
  };
  U.timeAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'agora';
    const m = Math.floor(s / 60); if (m < 60) return `há ${m} min`;
    const h = Math.floor(m / 60); if (h < 24) return `há ${h} h`;
    const d = Math.floor(h / 24); if (d < 30) return `há ${d} d`;
    return U.fmtDate(U.toISO(new Date(ts)));
  };

  /* ---------- Números ---------- */
  U.num = (v) => { if (v === '' || v == null) return null; const n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  U.fmtMoney = (n, compact) => {
    if (n == null || !isFinite(n)) return '—';
    if (compact && Math.abs(n) >= 10000) return 'R$ ' + (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  U.fmtNum = (n, dec = 0) => (n == null || !isFinite(n)) ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: dec });
  U.fmtPct = (n) => (n == null || !isFinite(n)) ? '—' : (n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  U.fmtMinutes = (m) => {
    m = Math.round(m || 0);
    if (!m) return '0 min';
    const h = Math.floor(m / 60), r = m % 60;
    return h ? `${h}h${r ? ' ' + U.pad(r) : ''}` : `${r} min`;
  };

  /* ---------- Texto ---------- */
  U.initials = (name) => String(name || '?').trim().split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  U.norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  U.match = (hay, q) => U.norm(hay).includes(U.norm(q));

  /** Texto rico simples: **negrito**, listas com "- ", links e quebras de linha. */
  U.rich = (text) => {
    const lines = U.esc(text || '').split('\n');
    let html = '', inList = false;
    for (const raw of lines) {
      let line = raw
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      const li = line.match(/^\s*[-•*]\s+(.*)/);
      if (li) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${li[1]}</li>`;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += line + '<br>';
      }
    }
    if (inList) html += '</ul>';
    return html.replace(/(<br>)+$/, '');
  };

  U.hashColor = (str) => {
    const colors = ['#5b5bd6', '#12a36b', '#e0443e', '#d88a06', '#2f7de1', '#c2410c', '#9333ea', '#0891b2', '#db2777', '#4d7c0f'];
    let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return colors[h % colors.length];
  };

  U.debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  U.download = (filename, text, mime = 'text/plain') => {
    // Dentro de páginas incorporadas (iframe) o download costuma ser bloqueado: mostra o conteúdo para copiar.
    let framed = false; try { framed = window.self !== window.top; } catch (err) { framed = true; }
    if (framed && window.UI) {
      const m = UI.modal(`<div class="modal-h"><h2>${U.esc(filename)}</h2><button class="ibtn" style="margin-left:auto" data-modal-close>✕</button></div>
        <div class="modal-b"><div class="small muted">Aqui o download direto não está disponível. Copie o conteúdo e salve em um arquivo com o nome acima.</div>
        <textarea class="textarea" id="download-text" readonly style="min-height:320px;font-family:monospace;font-size:12px"></textarea></div>
        <div class="modal-f"><button class="btn btn-primary" id="download-copy">Copiar conteúdo</button></div>`, { wide: true });
      const ta = m.querySelector('#download-text'); ta.value = text;
      m.querySelector('#download-copy').addEventListener('click', async () => {
        if (await U.copy(text)) UI.toast('Copiado'); else { ta.focus(); ta.select(); UI.toast('Selecionado — use Ctrl+C'); }
      });
      return;
    }
    const blob = new Blob([text], { type: mime + ';charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  U.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) { /* noop */ }
      ta.remove(); return ok;
    }
  };

  U.phoneDigits = (p) => String(p || '').replace(/\D/g, '');
  U.waLink = (p) => { let d = U.phoneDigits(p); if (!d) return ''; if (d.length <= 11) d = '55' + d; return `https://wa.me/${d}`; };

  window.U = U;
})();
