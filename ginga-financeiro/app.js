const STORAGE_KEY = 'ginga_financeiro_transactions_v2';
const LEGACY_KEY = 'ginga_financeiro_transactions_v1';
const EMAILS = [
  'kauanluz@ginga.bet.br',
  'victorfernandes@ginga.bet.br',
  'leandroarcres@gmail.com'
];

const els = {};
let transactions = loadTransactions();
let lastSavedId = null;

function qs(id) { return document.getElementById(id); }

function parseBRL(value) {
  let raw = String(value ?? '').trim().replace(/\s/g, '').replace(/^R\$?/i, '');
  if (!raw) return NaN;
  raw = raw.replace(/[^0-9.,-]/g, '');

  // Padrão BR: 128.715,50 / 250000,75
  if (raw.includes(',')) {
    const lastComma = raw.lastIndexOf(',');
    const integerPart = raw.slice(0, lastComma).replace(/[.]/g, '');
    const decimalPart = raw.slice(lastComma + 1).replace(/[.,]/g, '').slice(0, 2);
    const normalized = `${integerPart}.${decimalPart.padEnd(2, '0')}`;
    return Number(normalized);
  }

  // Apenas ponto:
  // 128.715 => 128715
  // 128.75 => 128.75
  // 128.71550 => 128715.50 (milhar + centavos digitados ao final)
  if (raw.includes('.')) {
    const parts = raw.split('.');
    const digits = raw.replace(/\./g, '');

    if (parts.length > 2) {
      const last = parts[parts.length - 1];
      if (last.length === 2) {
        return Number(parts.slice(0, -1).join('') + '.' + last);
      }
      return Number(digits);
    }

    const afterDot = parts[1] || '';
    if (afterDot.length <= 2) return Number(raw);
    if (afterDot.length === 3) return Number(digits);
    if (afterDot.length > 3) {
      return Number(digits.slice(0, -2) + '.' + digits.slice(-2));
    }
  }

  return Number(raw);
}

function safeAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = parseBRL(value);
  return Number.isFinite(n) ? n : 0;
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeAmount(value));
}

function normalizeAmountField() {
  const parsed = parseBRL(els.amount.value);
  if (!Number.isFinite(parsed)) return;
  els.amount.value = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parsed);
}

function dateTimeBR(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

function isoLocal(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function sameLocalDay(a, b = new Date()) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function loadTransactions() {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) raw = localStorage.getItem(LEGACY_KEY);
  let list = [];
  try { list = JSON.parse(raw || '[]'); } catch { list = []; }
  if (!Array.isArray(list)) list = [];

  return list.map(t => ({
    ...t,
    amount: safeAmount(t?.amount),
    client: t?.client || t?.reference || 'Total operacional',
    analyst: t?.analyst || '',
    status: t?.status || 'Processado',
    origin: t?.origin || 'PIX',
    notes: t?.notes || ''
  })).filter(t => t && t.datetime && ['deposito', 'saque'].includes(t.type));
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 2500);
}

function initElements() {
  [
    'transactionForm','amount','client','analyst','status','origin','datetime','notes',
    'messagePreview','copyMessageBtn','openEmailBtn','historyBody','emptyState','filterType',
    'searchInput','clearHistoryBtn','clearFormBtn','exportBtn','clock','sidebarDate',
    'countdownMidnight','todayDepositValue','todayDepositCount','todayWithdrawValue',
    'todayWithdrawCount','todayNetValue','todayDiffText','rolling24Value','rolling24Count',
    'rollingDeposit','rollingWithdraw','rollingDiff','donutTotal','flowChart','donutChart','toast'
  ].forEach(id => els[id] = qs(id));
}

function todayTransactions() {
  const now = new Date();
  return transactions.filter(t => {
    const d = new Date(t.datetime);
    return !Number.isNaN(d.getTime()) && sameLocalDay(d, now);
  });
}

function rolling24Transactions() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return transactions.filter(t => {
    const ts = new Date(t.datetime).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function sum(list, type = null) {
  return list
    .filter(t => !type || t.type === type)
    .reduce((acc, t) => acc + safeAmount(t.amount), 0);
}

function differenceLabel(dep, wit) {
  const diff = dep - wit;
  if (dep === 0 && wit === 0) return 'Sem movimentações no período';
  if (diff === 0) return 'Depósitos e saques estão iguais';
  const base = Math.max(Math.min(dep, wit), 1);
  const pct = Math.abs(diff) / base * 100;
  return diff > 0
    ? `Depósitos ${pct.toFixed(1).replace('.', ',')}% acima dos saques`
    : `Saques ${pct.toFixed(1).replace('.', ',')}% acima dos depósitos`;
}

function updateDashboard() {
  const day = todayTransactions();
  const rolling = rolling24Transactions();
  const depDay = day.filter(t => t.type === 'deposito');
  const witDay = day.filter(t => t.type === 'saque');
  const dep24 = rolling.filter(t => t.type === 'deposito');
  const wit24 = rolling.filter(t => t.type === 'saque');

  const depDaySum = sum(depDay);
  const witDaySum = sum(witDay);
  const dep24Sum = sum(dep24);
  const wit24Sum = sum(wit24);

  els.todayDepositValue.textContent = money(depDaySum);
  els.todayDepositCount.textContent = depDay.length;
  els.todayWithdrawValue.textContent = money(witDaySum);
  els.todayWithdrawCount.textContent = witDay.length;
  els.todayNetValue.textContent = money(depDaySum - witDaySum);
  els.todayDiffText.textContent = differenceLabel(depDaySum, witDaySum);

  els.rolling24Value.textContent = money(dep24Sum + wit24Sum);
  els.rolling24Count.textContent = rolling.length;
  els.rollingDeposit.textContent = money(dep24Sum);
  els.rollingWithdraw.textContent = money(wit24Sum);
  els.rollingDiff.textContent = money(dep24Sum - wit24Sum);
  els.donutTotal.textContent = compactMoney(dep24Sum + wit24Sum);

  drawFlowChart(rolling);
  drawDonut(dep24Sum, wit24Sum);
}

function compactMoney(v) {
  const n = safeAmount(v);
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1).replace('.', ',')} mi`;
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1).replace('.', ',')} mil`;
  return money(n);
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(300, rect.width || canvas.width);
  const height = parseFloat(getComputedStyle(canvas).height) || canvas.height;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

function drawFlowChart(data) {
  const { ctx, width, height } = prepareCanvas(els.flowChart);
  ctx.clearRect(0, 0, width, height);
  const pad = { l: 52, r: 14, t: 18, b: 34 };
  const chartW = width - pad.l - pad.r;
  const chartH = height - pad.t - pad.b;
  const now = new Date();
  const buckets = [];

  for (let i = 23; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 3600000);
    const start = new Date(end.getTime() - 3600000);
    buckets.push({ label: `${String(end.getHours()).padStart(2, '0')}h`, start, end, deposito: 0, saque: 0 });
  }

  data.forEach(t => {
    const dt = new Date(t.datetime);
    if (Number.isNaN(dt.getTime())) return;
    const b = buckets.find(x => dt > x.start && dt <= x.end);
    if (b && ['deposito', 'saque'].includes(t.type)) b[t.type] += safeAmount(t.amount);
  });

  const values = buckets.flatMap(b => [safeAmount(b.deposito), safeAmount(b.saque)]).filter(Number.isFinite);
  const max = Math.max(100, ...(values.length ? values : [0]));

  ctx.strokeStyle = 'rgba(148,163,184,.12)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#71839a';
  ctx.font = '10px system-ui';

  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(width - pad.r, y); ctx.stroke();
    const val = max - (max / 4) * i;
    ctx.fillText(compactAxis(val), 4, y + 3);
  }

  const step = chartW / (buckets.length - 1 || 1);

  function line(type, color, fill) {
    ctx.beginPath();
    buckets.forEach((b, i) => {
      const x = pad.l + i * step;
      const y = pad.t + chartH - (safeAmount(b[type]) / max) * chartH;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2.3; ctx.stroke();
    if (fill) {
      ctx.lineTo(pad.l + chartW, pad.t + chartH); ctx.lineTo(pad.l, pad.t + chartH); ctx.closePath();
      const g = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
      g.addColorStop(0, fill); g.addColorStop(1, 'rgba(32,227,162,0)');
      ctx.fillStyle = g; ctx.fill();
    }
  }

  line('deposito', '#20e3a2', 'rgba(32,227,162,.16)');
  line('saque', '#ff667d', null);

  ctx.fillStyle = '#71839a';
  ctx.font = '10px system-ui';
  buckets.forEach((b, i) => {
    if (i % 4 === 0 || i === 23) {
      const x = pad.l + i * step;
      ctx.fillText(b.label, x - 8, height - 10);
    }
  });
}

function compactAxis(v) {
  const n = safeAmount(v);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return `${Math.round(n)}`;
}

function drawDonut(dep, wit) {
  const { ctx, width, height } = prepareCanvas(els.donutChart);
  ctx.clearRect(0, 0, width, height);
  dep = safeAmount(dep); wit = safeAmount(wit);
  const cx = width / 2, cy = height / 2, r = Math.min(width, height) * .35, line = 25, total = dep + wit;
  ctx.lineWidth = line; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(148,163,184,.12)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  if (total <= 0) return;

  const start = -Math.PI / 2;
  const depAngle = Math.PI * 2 * (dep / total);
  ctx.strokeStyle = '#20e3a2';
  ctx.beginPath(); ctx.arc(cx, cy, r, start, start + depAngle); ctx.stroke();
  if (wit > 0) {
    ctx.strokeStyle = '#ff667d';
    ctx.beginPath(); ctx.arc(cx, cy, r, start + depAngle + .045, start + Math.PI * 2 - .045); ctx.stroke();
  }
}

function renderHistory() {
  const type = els.filterType.value;
  const q = els.searchInput.value.trim().toLowerCase();
  const filtered = [...transactions]
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
    .filter(t => {
      const matchType = type === 'todos' || t.type === type;
      const hay = `${t.client} ${t.analyst} ${t.status} ${t.origin} ${t.notes || ''}`.toLowerCase();
      return matchType && hay.includes(q);
    });

  els.historyBody.innerHTML = '';
  filtered.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dateTimeBR(t.datetime)}</td>
      <td><span class="badge ${t.type}">${t.type === 'deposito' ? 'Depósito' : 'Saque'}</span></td>
      <td>${escapeHtml(t.client || 'Total operacional')}</td>
      <td><strong>${money(t.amount)}</strong></td>
      <td><span class="badge status-badge">${escapeHtml(t.status)}</span></td>
      <td>${escapeHtml(t.analyst)}</td>
      <td>${escapeHtml(t.origin)}</td>
      <td><button class="row-delete" title="Excluir" data-id="${t.id}">×</button></td>`;
    els.historyBody.appendChild(tr);
  });

  els.emptyState.style.display = filtered.length ? 'none' : 'block';
  document.querySelectorAll('.row-delete').forEach(btn => btn.addEventListener('click', () => deleteTransaction(btn.dataset.id)));
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[c]));
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  persist();
  renderAll();
  toast('Movimentação removida.');
}

function buildMessage(t) {
  if (!t) return 'Nenhum registro salvo ainda.';
  const icon = t.type === 'deposito' ? '🟢' : '🔴';
  const title = t.type === 'deposito' ? 'DEPÓSITO' : 'SAQUE';
  return `${icon} GINGA | ${title}\n\n💰 Valor: ${money(t.amount)}\n📊 Referência: ${t.client || 'Total operacional'}\n📌 Status: ${t.status}\n🏦 Origem: ${t.origin}\n👨‍💻 Analista: ${t.analyst}\n🕒 Data/Hora: ${dateTimeBR(t.datetime)}${t.notes ? `\n📝 Obs.: ${t.notes}` : ''}`;
}

function updateMessagePreview() {
  const t = transactions.find(x => x.id === lastSavedId) || [...transactions].sort((a, b) => new Date(b.datetime) - new Date(a.datetime))[0];
  els.messagePreview.textContent = buildMessage(t);
}

function handleSubmit(e) {
  e.preventDefault();
  const type = document.querySelector('input[name="type"]:checked').value;
  const parsedAmount = parseBRL(els.amount.value);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return toast('Digite um valor válido. Ex.: 128.715,50');
  }

  const dt = new Date(els.datetime.value);
  if (Number.isNaN(dt.getTime())) return toast('Informe uma data e horário válidos.');

  const item = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type,
    amount: parsedAmount,
    client: els.client.value.trim() || 'Total operacional',
    analyst: els.analyst.value.trim(),
    status: els.status.value,
    origin: els.origin.value,
    datetime: dt.toISOString(),
    notes: els.notes.value.trim(),
    createdAt: new Date().toISOString()
  };

  transactions.push(item);
  lastSavedId = item.id;
  persist();
  renderAll();
  toast(`${type === 'deposito' ? 'Depósito' : 'Saque'} salvo: ${money(parsedAmount)}`);

  els.amount.value = '';
  els.client.value = '';
  els.notes.value = '';
  els.datetime.value = isoLocal();
}

async function copyMessage() {
  const text = els.messagePreview.textContent;
  if (text.startsWith('Nenhum')) return toast('Salve uma movimentação primeiro.');
  try {
    await navigator.clipboard.writeText(text);
    toast('Mensagem copiada.');
  } catch {
    toast('Não foi possível copiar automaticamente.');
  }
}

function openEmail() {
  const t = transactions.find(x => x.id === lastSavedId) || [...transactions].sort((a, b) => new Date(b.datetime) - new Date(a.datetime))[0];
  if (!t) return toast('Salve uma movimentação primeiro.');

  const typeLabel = t.type === 'deposito' ? 'Depósito' : 'Saque';
  const subject = `Ginga Financeiro | ${typeLabel} | ${money(t.amount)} | ${t.client || 'Total operacional'}`;
  const body = buildMessage(t).replaceAll('*', '');
  const to = EMAILS.join(',');

  // Abre o Gmail Web já preenchido. O usuário ainda precisa clicar em "Enviar".
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, '_blank', 'noopener');
}

function exportCSV() {
  if (!transactions.length) return toast('Não há dados para exportar.');
  const headers = ['data_hora','tipo','referencia','valor','status','analista','origem','observacao'];
  const rows = transactions.map(t => [t.datetime,t.type,t.client,safeAmount(t.amount).toFixed(2),t.status,t.analyst,t.origin,t.notes].map(csvEscape).join(';'));
  const blob = new Blob(['\ufeff' + headers.join(';') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ginga-financeiro-${isoLocal().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function csvEscape(v) {
  const s = String(v ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function updateClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString('pt-BR');
  els.sidebarDate.textContent = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  els.countdownMidnight.textContent = `zera em ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderAll() {
  updateDashboard();
  renderHistory();
  updateMessagePreview();
}

window.addEventListener('DOMContentLoaded', () => {
  initElements();
  persist(); // salva a migração/sanitização do histórico antigo
  els.datetime.value = isoLocal();
  updateClock();
  renderAll();

  els.transactionForm.addEventListener('submit', handleSubmit);
  els.amount.addEventListener('blur', normalizeAmountField);
  els.copyMessageBtn.addEventListener('click', copyMessage);
  els.openEmailBtn.addEventListener('click', openEmail);
  els.filterType.addEventListener('change', renderHistory);
  els.searchInput.addEventListener('input', renderHistory);
  els.clearFormBtn.addEventListener('click', () => {
    els.transactionForm.reset();
    els.datetime.value = isoLocal();
  });
  els.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Apagar todo o histórico salvo neste navegador?')) {
      transactions = [];
      persist();
      lastSavedId = null;
      renderAll();
      toast('Histórico apagado.');
    }
  });
  els.exportBtn.addEventListener('click', exportCSV);
  setInterval(() => { updateClock(); updateDashboard(); }, 1000);
  window.addEventListener('resize', () => {
    clearTimeout(window.__chartResize);
    window.__chartResize = setTimeout(updateDashboard, 120);
  });
});
