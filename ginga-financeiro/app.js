const STORAGE_KEY = 'ginga_financeiro_transactions_v1';
const els = {};
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let lastSavedId = null;

function qs(id) { return document.getElementById(id); }
function money(value) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)||0); }
function dateTimeBR(iso) { return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso)); }
function isoLocal(date = new Date()) {
  const pad = n => String(n).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function sameLocalDay(a,b=new Date()) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  setTimeout(()=>els.toast.classList.remove('show'),2200);
}

function initElements() {
  ['transactionForm','amount','client','analyst','status','origin','datetime','notes','messagePreview','copyMessageBtn','openEmailBtn','historyBody','emptyState','filterType','searchInput','clearHistoryBtn','clearFormBtn','exportBtn','clock','sidebarDate','countdownMidnight','todayDepositValue','todayDepositCount','todayWithdrawValue','todayWithdrawCount','todayNetValue','rolling24Value','rolling24Count','rollingDeposit','rollingWithdraw','donutTotal','flowChart','donutChart','toast'].forEach(id=>els[id]=qs(id));
}

function todayTransactions() {
  const now = new Date();
  return transactions.filter(t => sameLocalDay(new Date(t.datetime), now));
}
function rolling24Transactions() {
  const cutoff = Date.now() - 24*60*60*1000;
  return transactions.filter(t => new Date(t.datetime).getTime() >= cutoff);
}
function sum(list,type=null) {
  return list.filter(t=>!type || t.type===type).reduce((acc,t)=>acc+Number(t.amount),0);
}

function updateDashboard() {
  const day = todayTransactions();
  const rolling = rolling24Transactions();
  const depDay = day.filter(t=>t.type==='deposito');
  const witDay = day.filter(t=>t.type==='saque');
  const dep24 = rolling.filter(t=>t.type==='deposito');
  const wit24 = rolling.filter(t=>t.type==='saque');

  els.todayDepositValue.textContent = money(sum(depDay));
  els.todayDepositCount.textContent = depDay.length;
  els.todayWithdrawValue.textContent = money(sum(witDay));
  els.todayWithdrawCount.textContent = witDay.length;
  els.todayNetValue.textContent = money(sum(depDay)-sum(witDay));
  els.rolling24Value.textContent = money(sum(rolling));
  els.rolling24Count.textContent = rolling.length;
  els.rollingDeposit.textContent = money(sum(dep24));
  els.rollingWithdraw.textContent = money(sum(wit24));
  els.donutTotal.textContent = compactMoney(sum(rolling));
  drawFlowChart(rolling);
  drawDonut(sum(dep24),sum(wit24));
}

function compactMoney(v) {
  if (v>=1000000) return `R$ ${(v/1000000).toFixed(1)} mi`;
  if (v>=1000) return `R$ ${(v/1000).toFixed(1)} mil`;
  return `R$ ${Math.round(v)}`;
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(300, rect.width || canvas.width);
  const height = parseFloat(getComputedStyle(canvas).height) || canvas.height;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio,0,0,ratio,0,0);
  return {ctx,width,height};
}

function drawFlowChart(data) {
  const {ctx,width,height} = prepareCanvas(els.flowChart);
  ctx.clearRect(0,0,width,height);
  const pad = {l:42,r:14,t:18,b:34};
  const chartW = width-pad.l-pad.r, chartH = height-pad.t-pad.b;
  const now = new Date();
  const buckets = [];
  for(let i=23;i>=0;i--) {
    const end = new Date(now.getTime()-i*3600000);
    const start = new Date(end.getTime()-3600000);
    buckets.push({label:`${String(end.getHours()).padStart(2,'0')}h`,start,end,deposito:0,saque:0});
  }
  data.forEach(t=>{
    const dt = new Date(t.datetime);
    const b = buckets.find(x=>dt>x.start && dt<=x.end);
    if(b) b[t.type]+=Number(t.amount);
  });
  const max = Math.max(100, ...buckets.flatMap(b=>[b.deposito,b.saque]));
  ctx.strokeStyle='rgba(148,163,184,.12)'; ctx.lineWidth=1;
  ctx.fillStyle='#71839a'; ctx.font='10px system-ui';
  for(let i=0;i<=4;i++) {
    const y=pad.t+(chartH/4)*i;
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(width-pad.r,y);ctx.stroke();
    const val=max-(max/4)*i;
    ctx.fillText(compactAxis(val),4,y+3);
  }
  const step=chartW/(buckets.length-1 || 1);
  function line(type,color,fill) {
    ctx.beginPath();
    buckets.forEach((b,i)=>{
      const x=pad.l+i*step; const y=pad.t+chartH-(b[type]/max)*chartH;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    });
    ctx.strokeStyle=color;ctx.lineWidth=2.3;ctx.stroke();
    if(fill){
      ctx.lineTo(pad.l+chartW,pad.t+chartH);ctx.lineTo(pad.l,pad.t+chartH);ctx.closePath();
      const g=ctx.createLinearGradient(0,pad.t,0,pad.t+chartH);g.addColorStop(0,fill);g.addColorStop(1,'rgba(32,227,162,0)');ctx.fillStyle=g;ctx.fill();
    }
  }
  line('deposito','#20e3a2','rgba(32,227,162,.16)');
  line('saque','#ff667d',null);
  ctx.fillStyle='#71839a';ctx.font='10px system-ui';
  buckets.forEach((b,i)=>{ if(i%4===0 || i===23){ const x=pad.l+i*step; ctx.fillText(b.label,x-8,height-10); }});
}
function compactAxis(v){ if(v>=1000000)return `${(v/1000000).toFixed(1)}m`;if(v>=1000)return `${Math.round(v/1000)}k`;return `${Math.round(v)}`; }

function drawDonut(dep,wit){
  const {ctx,width,height}=prepareCanvas(els.donutChart);
  ctx.clearRect(0,0,width,height);
  const cx=width/2,cy=height/2,r=Math.min(width,height)*.35,line=25,total=dep+wit;
  ctx.lineWidth=line;ctx.lineCap='round';
  ctx.strokeStyle='rgba(148,163,184,.12)';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  if(total<=0)return;
  const start=-Math.PI/2;
  const depAngle=Math.PI*2*(dep/total);
  ctx.strokeStyle='#20e3a2';ctx.beginPath();ctx.arc(cx,cy,r,start,start+depAngle);ctx.stroke();
  if(wit>0){ctx.strokeStyle='#ff667d';ctx.beginPath();ctx.arc(cx,cy,r,start+depAngle+.045,start+Math.PI*2-.045);ctx.stroke();}
}

function renderHistory(){
  const type=els.filterType.value; const q=els.searchInput.value.trim().toLowerCase();
  const filtered=[...transactions].sort((a,b)=>new Date(b.datetime)-new Date(a.datetime)).filter(t=>{
    const matchType=type==='todos'||t.type===type;
    const hay=`${t.client} ${t.analyst} ${t.status} ${t.origin} ${t.notes||''}`.toLowerCase();
    return matchType && hay.includes(q);
  });
  els.historyBody.innerHTML='';
  filtered.forEach(t=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${dateTimeBR(t.datetime)}</td>
      <td><span class="badge ${t.type}">${t.type==='deposito'?'Depósito':'Saque'}</span></td>
      <td>${escapeHtml(t.client)}</td>
      <td><strong>${money(t.amount)}</strong></td>
      <td><span class="badge status-badge">${escapeHtml(t.status)}</span></td>
      <td>${escapeHtml(t.analyst)}</td>
      <td>${escapeHtml(t.origin)}</td>
      <td><button class="row-delete" title="Excluir" data-id="${t.id}">×</button></td>`;
    els.historyBody.appendChild(tr);
  });
  els.emptyState.style.display=filtered.length?'none':'block';
  document.querySelectorAll('.row-delete').forEach(btn=>btn.addEventListener('click',()=>deleteTransaction(btn.dataset.id)));
}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));}
function deleteTransaction(id){
  transactions=transactions.filter(t=>t.id!==id);persist();renderAll();toast('Movimentação removida.');
}

function buildMessage(t){
  if(!t)return 'Nenhum registro salvo ainda.';
  const icon=t.type==='deposito'?'🟢':'🔴';
  const title=t.type==='deposito'?'DEPÓSITO':'SAQUE';
  return `${icon} *GINGA | ${title}*\n\n💰 Valor: *${money(t.amount)}*\n👤 Cliente/ID: ${t.client}\n📌 Status: *${t.status}*\n🏦 Origem: ${t.origin}\n👨‍💻 Analista: ${t.analyst}\n🕒 Data/Hora: ${dateTimeBR(t.datetime)}${t.notes?`\n📝 Obs.: ${t.notes}`:''}`;
}
function updateMessagePreview(){
  const t=transactions.find(x=>x.id===lastSavedId)||[...transactions].sort((a,b)=>new Date(b.datetime)-new Date(a.datetime))[0];
  els.messagePreview.textContent=buildMessage(t);
}

function handleSubmit(e){
  e.preventDefault();
  const type=document.querySelector('input[name="type"]:checked').value;
  const item={
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type,
    amount:Number(els.amount.value),
    client:els.client.value.trim(),analyst:els.analyst.value.trim(),status:els.status.value,origin:els.origin.value,
    datetime:new Date(els.datetime.value).toISOString(),notes:els.notes.value.trim(),createdAt:new Date().toISOString()
  };
  transactions.push(item); lastSavedId=item.id; persist();
  renderAll(); toast(`${type==='deposito'?'Depósito':'Saque'} salvo com sucesso.`);
  els.amount.value=''; els.client.value=''; els.notes.value=''; els.datetime.value=isoLocal();
}

async function copyMessage(){
  const text=els.messagePreview.textContent;
  if(text.startsWith('Nenhum')) return toast('Salve uma movimentação primeiro.');
  try { await navigator.clipboard.writeText(text); toast('Mensagem copiada.'); }
  catch { toast('Não foi possível copiar automaticamente.'); }
}
function openEmail(){
  const t=transactions.find(x=>x.id===lastSavedId)||[...transactions].sort((a,b)=>new Date(b.datetime)-new Date(a.datetime))[0];
  if(!t) return toast('Salve uma movimentação primeiro.');

  const recipients = [
    'kauanluz@ginga.bet.br',
    'victorfernandes@ginga.bet.br',
    'leandroarcres@gmail.com'
  ].join(',');

  const typeLabel = t.type==='deposito' ? 'Depósito' : 'Saque';
  const subject = `Ginga Financeiro | ${typeLabel} | ${money(t.amount)} | ${t.client}`;
  const body = `GINGA ANALYTICS | FINANCEIRO\n\n` +
    `Tipo: ${typeLabel}\n` +
    `Valor: ${money(t.amount)}\n` +
    `Cliente/ID: ${t.client}\n` +
    `Status: ${t.status}\n` +
    `Origem: ${t.origin}\n` +
    `Analista: ${t.analyst}\n` +
    `Data/Hora: ${dateTimeBR(t.datetime)}` +
    (t.notes ? `\nObservação: ${t.notes}` : '') +
    `\n\nRegistro gerado pelo painel Ginga Analytics.`;

  window.location.href = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function exportCSV(){
  if(!transactions.length)return toast('Não há dados para exportar.');
  const headers=['data_hora','tipo','cliente','valor','status','analista','origem','observacao'];
  const rows=transactions.map(t=>[t.datetime,t.type,t.client,t.amount,t.status,t.analyst,t.origin,t.notes].map(csvEscape).join(';'));
  const blob=new Blob(['\ufeff'+headers.join(';')+'\n'+rows.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ginga-financeiro-${isoLocal().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
}
function csvEscape(v){ const s=String(v??'').replace(/"/g,'""'); return `"${s}"`; }

function updateClock(){
  const now=new Date();
  els.clock.textContent=now.toLocaleTimeString('pt-BR');
  els.sidebarDate.textContent=now.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
  const midnight=new Date(now);midnight.setHours(24,0,0,0);
  const diff=midnight-now; const h=Math.floor(diff/3600000); const m=Math.floor((diff%3600000)/60000); const s=Math.floor((diff%60000)/1000);
  els.countdownMidnight.textContent=`zera em ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function renderAll(){ updateDashboard(); renderHistory(); updateMessagePreview(); }

window.addEventListener('DOMContentLoaded',()=>{
  initElements(); els.datetime.value=isoLocal(); updateClock(); renderAll();
  els.transactionForm.addEventListener('submit',handleSubmit);
  els.copyMessageBtn.addEventListener('click',copyMessage);
  els.openEmailBtn.addEventListener('click',openEmail);
  els.filterType.addEventListener('change',renderHistory);
  els.searchInput.addEventListener('input',renderHistory);
  els.clearFormBtn.addEventListener('click',()=>{els.transactionForm.reset();els.datetime.value=isoLocal();});
  els.clearHistoryBtn.addEventListener('click',()=>{
    if(confirm('Apagar todo o histórico salvo neste navegador?')){transactions=[];persist();lastSavedId=null;renderAll();toast('Histórico apagado.');}
  });
  els.exportBtn.addEventListener('click',exportCSV);
  setInterval(()=>{updateClock();updateDashboard();},1000);
  window.addEventListener('resize',()=>{clearTimeout(window.__chartResize);window.__chartResize=setTimeout(updateDashboard,120);});
});
