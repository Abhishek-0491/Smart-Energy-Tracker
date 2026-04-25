// ═══════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS  = Array.from({length:24}, (_, i) => i);

const monthlyKwh  = [312,290,305,287,0,0,0,0,0,0,0,0];
const monthlyCo2  = [256,238,250,235,0,0,0,0,0,0,0,0];
const monthlyCost = [2028,1885,1983,1866,0,0,0,0,0,0,0,0];
const prev_kwh    = [298,310,280,312,0,0,0,0,0,0,0,0];

const appliances = [
  {name:'Air Conditioner', icon:'❄️', w:1500, pct:41, color:'#00f5a0'},
  {name:'Lighting',        icon:'💡', w:200,  pct:24, color:'#00c3ff'},
  {name:'Washing Machine', icon:'🧺', w:500,  pct:15, color:'#ff6b35'},
  {name:'Computer',        icon:'🖥️', w:300,  pct:12, color:'#a78bfa'},
  {name:'Television',      icon:'📺', w:120,  pct:5,  color:'#ffbe0b'},
  {name:'Microwave',       icon:'🍳', w:1200, pct:2,  color:'#ff3d57'},
  {name:'Water Heater',    icon:'🚿', w:2000, pct:1,  color:'#34d399'},
];

const dailyData = Array.from({length:30}, (_, i) => ({
  kwh:  10 + Math.random()*12 + Math.sin(i/3.5)*3,
  co2:  (10 + Math.random()*12) * 0.82,
  cost: (10 + Math.random()*12) * 6.5,
}));

// ── rt state ──
let rtPaused = false;
let rtBuffer = Array(60).fill(800);
let rtWatts  = 800;
let rtKwh    = 3.42;
let rtCost   = 22.23;   // FIX: was undeclared (missing `let`)
let rtInterval;

// ── chart mode ──
let chartMode = 'kwh';

// ════════════════ NAVIGATION ════════════════
function nav(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  el.classList.add('active');

  const titles = {
    dashboard:'Dashboard', realtime:'Real-Time Monitor', analytics:'Deep Analytics',
    compare:'Compare', entry:'Log Usage', savings:'Savings Plan', report:'Monthly Report'
  };
  document.getElementById('topbarTitle').textContent = titles[id] || id;

  if (id === 'analytics') initAnalytics();
  if (id === 'compare')   initCompare();
  if (id === 'realtime')  initRealtime();
  if (id === 'savings')   initSavings();
  if (id === 'report')    initReport();
}

// ════════════════ BG CANVAS ════════════════
(function () {
  const c = document.getElementById('bgCanvas');
  const ctx = c.getContext('2d');
  let particles = [];

  function resize() { c.width = innerWidth; c.height = innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random()*innerWidth, y: Math.random()*innerHeight,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
      r: Math.random()*1.5+0.5, a: Math.random()*0.4+0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = c.width;  if (p.x > c.width)  p.x = 0;
      if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(0,245,160,${p.a})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ════════════════ SPARKLINES ════════════════
function drawSparkline(id, data, color) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.offsetWidth || 150, H = 32;
  c.width = W; c.height = H;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  ctx.clearRect(0, 0, W, H);
  const pts = data.map((v, i) => [i/(data.length-1)*W, H-(v-min)/range*(H-4)-2]);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color+'44'); grad.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.moveTo(pts[0][0], H);
  pts.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(pts[pts.length-1][0], H);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
}

// ════════════════ DASHBOARD INIT ════════════════
function initDashboard() {
  animNum('kpi-kwh',   15.1, 1);
  animNum('kpi-co2',   12.4, 1);
  animNum('kpi-score', 74,   0);
  setTimeout(() => { document.getElementById('kpi-bill').textContent = '₹98'; }, 600);

  const sparkData1 = Array.from({length:20}, (_, i) => 10 + Math.random()*8  + Math.sin(i)*2);
  const sparkData2 = Array.from({length:20}, (_, i) => 8  + Math.random()*6  + Math.cos(i)*1.5);
  const sparkData3 = Array.from({length:20}, (_, i) => 60 + Math.random()*40);
  const sparkData4 = Array.from({length:20}, (_, i) => 60 + i*0.7 + Math.random()*5);
  drawSparkline('spark1', sparkData1, '#00f5a0');
  drawSparkline('spark2', sparkData2, '#00c3ff');
  drawSparkline('spark3', sparkData3, '#ff6b35');
  drawSparkline('spark4', sparkData4, '#a78bfa');

  drawMainChart();
  drawDonut();

  // Target gauge
  setTimeout(() => { document.getElementById('targetGauge').style.width = '95.7%'; }, 300);

  // Carbon ring
  setTimeout(() => {
    const arc  = document.getElementById('ringArc');
    const pct  = 235/400;
    const circ = 2 * Math.PI * 64;
    arc.setAttribute('stroke-dasharray', `${pct*circ} ${circ}`);
    document.getElementById('ringPct').textContent = Math.round(pct*100) + '%';
  }, 500);

  // Quick wins
  const qw = document.getElementById('quickWins');
  const wins = [
    {icon:'❄️', text:'Raise AC to 26°C',       save:'₹50 today'},
    {icon:'🔌', text:'Unplug TV standby',       save:'₹3 today'},
    {icon:'💡', text:'Use natural light 2h',    save:'₹8 today'},
  ];
  qw.innerHTML = wins.map(w => `
    <div class="flex-between" style="padding:9px 0;border-bottom:1px solid var(--border);">
      <div class="flex gap-2"><span>${w.icon}</span><span style="font-size:13px">${w.text}</span></div>
      <span class="badge badge-g mono">${w.save}</span>
    </div>
  `).join('');
}

// ════════════════ MAIN CHART ════════════════
function drawMainChart() {
  const c = document.getElementById('mainChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  // FIX: use clientWidth/parentElement width to avoid 0 on hidden pages
  const W = c.parentElement.clientWidth || 600, H = 180;
  c.width = W; c.height = H;
  const data   = dailyData.map(d => d[chartMode]);
  const max    = Math.max(...data) * 1.1, min = 0;
  const pad    = {t:10, r:10, b:28, l:40};
  const iW     = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  // Grid lines + Y labels
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + iH * (1 - i/4);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+iW, y);
    ctx.strokeStyle = 'rgba(30,49,82,0.8)'; ctx.lineWidth = 1; ctx.stroke();
    const v = (max * i / 4).toFixed(chartMode === 'cost' ? 0 : 1);
    ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(chartMode === 'cost' ? '₹'+v : v, pad.l-4, y+3);
  }

  // Points
  const pts = data.map((v, i) => [pad.l + (i/(data.length-1))*iW, pad.t + iH*(1-(v-min)/(max-min))]);
  const colors = {kwh:'#00f5a0', co2:'#00c3ff', cost:'#ff6b35'};
  const col = colors[chartMode];

  // Area gradient
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t+iH);
  grad.addColorStop(0, col+'40'); grad.addColorStop(1, col+'05');
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pad.t+iH);
  pts.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(pts[pts.length-1][0], pad.t+iH);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

  // X labels — FIX: correct x position calculation
  ctx.textAlign = 'center'; ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono';
  [1,7,14,21,28,30].forEach(d => {
    const idx = d - 1;
    ctx.fillText(d, pts[idx][0], H - 8);
  });

  // Dots on last 3 points
  pts.slice(-3).forEach(p => {
    ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI*2);
    ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, Math.PI*2);
    ctx.fillStyle = '#060b18'; ctx.fill();
  });
}

function setChartMode(mode, btn) {
  chartMode = mode;
  document.querySelectorAll('#dashboard .seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  drawMainChart();
}

// ════════════════ DONUT ════════════════
function drawDonut() {
  const c = document.getElementById('donutChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width = 200, H = c.height = 200, cx = 100, cy = 100, R = 70, r = 48;
  ctx.clearRect(0, 0, W, H);

  let start = -Math.PI/2;
  appliances.forEach(a => {
    const sweep = (a.pct/100) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, start+sweep);
    ctx.closePath(); ctx.fillStyle = a.color; ctx.fill();
    start += sweep;
  });

  // Inner circle (hole)
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = '#0f1e35'; ctx.fill();

  // Center text
  ctx.font = 'bold 16px Syne,sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#dceeff'; ctx.fillText('287', cx, cy-4);
  ctx.font = '11px Outfit,sans-serif'; ctx.fillStyle = '#4a6380';
  ctx.fillText('kWh', cx, cy+14);

  // Legend
  document.getElementById('donutLegend').innerHTML = appliances.map(a => `
    <div class="app-bar-row" style="margin-bottom:6px">
      <div style="width:8px;height:8px;border-radius:50%;background:${a.color};flex-shrink:0"></div>
      <span class="app-bar-name" style="width:auto;flex:1;font-size:12px">${a.name}</span>
      <span class="mono" style="font-size:11px;color:var(--text-dim)">${a.pct}%</span>
    </div>
  `).join('');
}

// ════════════════ REALTIME ════════════════
function initRealtime() {
  if (rtInterval) return;
  rtInterval = setInterval(() => {
    if (rtPaused) return;
    rtWatts += (Math.random()-0.48) * 150;
    rtWatts  = Math.max(200, Math.min(3200, rtWatts));
    rtKwh   += rtWatts / 3600000;
    rtCost  += (rtWatts / 3600000) * 6.5;
    rtBuffer.push(rtWatts); rtBuffer.shift();
    document.getElementById('rt-watts').textContent = Math.round(rtWatts) + ' W';
    document.getElementById('rt-kwh').textContent   = rtKwh.toFixed(3);
    document.getElementById('rt-cost').textContent  = '₹' + rtCost.toFixed(2);
    drawRTChart();
    if (Math.random() < 0.05) addRTLog();
  }, 1000);
  buildRTAppliances();
  buildRTLog();
  drawRTChart();
}

function drawRTChart() {
  const c = document.getElementById('rtChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.parentElement.clientWidth || 700, H = 200;
  c.width = W; c.height = H;
  const data = rtBuffer, max = Math.max(...data, 1500), min = 0;
  const pad  = {t:12, r:12, b:28, l:50};
  const iW   = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  [0,1,2,3].forEach(i => {
    const y = pad.t + iH*(1-i/3);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+iW, y);
    ctx.strokeStyle = 'rgba(30,49,82,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right'; ctx.fillText(Math.round(max*i/3)+'W', pad.l-4, y+3);
  });

  const pts = data.map((v, i) => [pad.l+(i/(data.length-1))*iW, pad.t+iH*(1-(v-min)/(max-min))]);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,245,160,0.25)'); grad.addColorStop(1, 'rgba(0,245,160,0.0)');
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pad.t+iH);
  pts.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(pts[pts.length-1][0], pad.t+iH);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle = '#00f5a0'; ctx.lineWidth = 2; ctx.stroke();

  // Current dot with pulse ring
  const lp = pts[pts.length-1];
  ctx.beginPath(); ctx.arc(lp[0], lp[1], 9, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(0,245,160,0.3)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(lp[0], lp[1], 5, 0, Math.PI*2);
  ctx.fillStyle = '#00f5a0'; ctx.fill();

  // X labels — FIX: correct seconds labels
  ctx.textAlign = 'center'; ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono';
  [0,15,30,45,59].forEach(i => {
    ctx.fillText(-(59-i)+'s', pts[i][0], H-8);
  });
}

function buildRTAppliances() {
  const list = [
    {name:'Air Conditioner', icon:'❄️', w:1450, active:true},
    {name:'Computer',        icon:'🖥️', w:280,  active:true},
    {name:'Lighting',        icon:'💡', w:160,  active:true},
    {name:'TV',              icon:'📺', w:0,    active:false},
  ];
  document.getElementById('rtAppliances').innerHTML = list.map(a => `
    <div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div class="flex gap-2">${a.icon} <span style="font-size:13px">${a.name}</span></div>
      <div class="flex gap-2">
        <span class="mono text-sm ${a.active?'green':'muted'}">${a.active ? a.w+'W' : 'Off'}</span>
        <div style="width:8px;height:8px;border-radius:50%;background:${a.active?'var(--accent)':'var(--border2)'};margin-top:4px;${a.active?'box-shadow:0 0 6px var(--accent)':''}"></div>
      </div>
    </div>
  `).join('');
}

const rtLogs = [];
function buildRTLog() {
  const el = document.getElementById('rtLog');
  if (!el) return;
  el.innerHTML = rtLogs.map(l => `<div style="padding:4px 0;border-bottom:1px solid var(--border);color:var(--text-dim)">${l}</div>`).join('');
}
function addRTLog() {
  const events = ['AC cycle started','Lighting dimmed','Fridge compressor on','Surge detected: +400W','AC cycle ended'];
  const t = new Date();
  const ts = t.getHours()+':'+String(t.getMinutes()).padStart(2,'0')+':'+String(t.getSeconds()).padStart(2,'0');
  rtLogs.unshift('<span style="color:var(--text-muted)">'+ts+'</span> ' + events[Math.floor(Math.random()*events.length)]);
  if (rtLogs.length > 20) rtLogs.pop();
  buildRTLog();
}

function toggleRTPause() {
  rtPaused = !rtPaused;
  document.getElementById('rtPauseBtn').textContent = rtPaused ? '▶ Resume' : '⏸ Pause';
}

// ════════════════ ANALYTICS ════════════════
function initAnalytics() {
  const c = document.getElementById('trendChart');
  if (!c || c.dataset.done) return;
  c.dataset.done = 1;
  drawTrendChart();
  drawHourlyChart();
  buildApplianceDeep();
  buildCompRows();
  drawCostBar();
}

function drawTrendChart() {
  const c = document.getElementById('trendChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.parentElement.clientWidth || 400, H = 180;
  c.width = W; c.height = H;
  const months = ['Nov','Dec','Jan','Feb','Mar','Apr'];
  const data   = [298,320,312,290,305,287];
  const ma     = [null,null,309,307,302,294];
  const max = Math.max(...data)*1.1, min = 220;
  const pad = {t:10, r:12, b:28, l:36};
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  [0,1,2,3].forEach(i => {
    const y = pad.t + iH*(1-i/3);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+iW, y);
    ctx.strokeStyle = 'rgba(30,49,82,0.8)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(min+(max-min)*i/3), pad.l-3, y+3);
  });

  const pts = data.map((v, i) => [pad.l+(i/5)*iW, pad.t+iH*(1-(v-min)/(max-min))]);

  // Bars
  data.forEach((v, i) => {
    const x = pts[i][0], y = pts[i][1];
    const bw = iW/6*0.55;
    const grad = ctx.createLinearGradient(0, y, 0, pad.t+iH);
    grad.addColorStop(0, 'rgba(0,195,255,0.4)'); grad.addColorStop(1, 'rgba(0,195,255,0.05)');
    ctx.fillStyle = grad;
    ctx.fillRect(x-bw/2, y, bw, pad.t+iH-y);
    ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText(months[i], x, H-8);
  });

  // Moving avg line
  const mapts = ma.map((v, i) => v ? [pts[i][0], pad.t+iH*(1-(v-min)/(max-min))] : null).filter(Boolean);
  ctx.beginPath(); mapts.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle = '#ff6b35'; ctx.setLineDash([5,4]); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
}

function drawHourlyChart() {
  const c = document.getElementById('hourlyChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.parentElement.clientWidth || 400, H = 180;
  c.width = W; c.height = H;
  const data = HOURS.map(h =>
    0.3 + Math.sin((h-6)*0.4)*0.8 + Math.random()*0.3 +
    (h>=7&&h<=9?0.8:0) + (h>=12&&h<=14?0.6:0) + (h>=18&&h<=22?1.2:0)
  );
  const max = Math.max(...data);
  const pad = {t:10, r:12, b:28, l:36};
  const iW  = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);
  const bw = iW/24 * 0.7;

  data.forEach((v, i) => {
    const x = pad.l + (i/23)*iW, barH = iH*(v/max);
    const isHigh = v > 1.5;
    const grad = ctx.createLinearGradient(0, pad.t+iH-barH, 0, pad.t+iH);
    grad.addColorStop(0, isHigh ? 'rgba(255,107,53,0.8)' : 'rgba(0,245,160,0.6)');
    grad.addColorStop(1, isHigh ? 'rgba(255,107,53,0.1)' : 'rgba(0,245,160,0.05)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x-bw/2, pad.t+iH-barH, bw, barH, 2);
    ctx.fill();
  });

  ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
  [0,6,12,18,23].forEach(h => ctx.fillText(h+'h', pad.l+(h/23)*iW, H-8));
}

function buildApplianceDeep() {
  const el = document.getElementById('applianceDeep');
  if (!el) return;
  el.innerHTML = appliances.map(a => {
    const kwh = (287 * a.pct / 100).toFixed(1);
    return `<div class="app-bar-row">
      <span class="app-bar-name">${a.icon} ${a.name}</span>
      <div class="app-bar-track"><div class="app-bar-fill" style="width:${a.pct}%;background:${a.color}"></div></div>
      <span class="app-bar-pct" style="color:${a.color}">${a.pct}%</span>
      <span class="app-bar-kwh">${kwh} kWh</span>
    </div>`;
  }).join('');
}

function buildCompRows() {
  const months = ['Jan','Feb','Mar','Apr'];
  const data   = [{kwh:312,co2:256},{kwh:290,co2:238},{kwh:305,co2:250},{kwh:287,co2:235}];
  const mMax   = Math.max(...data.map(d => d.kwh));
  const el     = document.getElementById('compRows');
  if (!el) return;
  el.innerHTML = data.map((d, i) => {
    const prev = data[i-1];
    const diff = prev ? ((d.kwh-prev.kwh)/prev.kwh*100).toFixed(1) : null;
    const badge = diff === null ? '' : diff > 0
      ? `<span class="badge badge-r">↑${diff}%</span>`
      : `<span class="badge badge-g">↓${Math.abs(diff)}%</span>`;
    return `<div class="comp-row">
      <span class="comp-month">${months[i]}</span>
      <div class="comp-bar-wrap">
        <div class="comp-bar-bg"><div class="comp-bar-fg" style="width:${d.kwh/mMax*100}%;background:var(--accent2)"></div></div>
        <div class="comp-bar-bg"><div class="comp-bar-fg" style="width:${d.co2/256*100}%;background:var(--accent3)"></div></div>
      </div>
      <span class="comp-vals">${d.kwh}kWh ${badge}</span>
    </div>`;
  }).join('');
}

function drawCostBar() {
  const c = document.getElementById('costBar');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.parentElement.clientWidth || 600, H = 160;
  c.width = W; c.height = H;
  const data = appliances.map(a => ({label:a.name, cost:Math.round(287*a.pct/100*6.5), color:a.color}));
  const max  = Math.max(...data.map(d => d.cost));
  const pad  = {t:10, r:12, b:40, l:12};
  const iW   = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const bw   = iW/data.length * 0.6;
  ctx.clearRect(0, 0, W, H);

  data.forEach((d, i) => {
    const x = pad.l + (i+0.5)/data.length*iW, barH = iH*(d.cost/max);
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t+iH);
    grad.addColorStop(0, d.color); grad.addColorStop(1, d.color+'22');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(x-bw/2, pad.t+iH-barH, bw, barH, 4); ctx.fill();
    ctx.fillStyle = d.color; ctx.font = 'bold 11px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText('₹'+d.cost, x, pad.t+iH-barH-5);
    ctx.fillStyle = '#4a6380'; ctx.font = '10px Outfit,sans-serif';
    const parts = d.label.split(' ');
    ctx.fillText(parts[0], x, H-22);
    ctx.fillText(parts.slice(1).join(' ') || '', x, H-10);
  });
}

// ════════════════ COMPARE ════════════════
function initCompare() {
  const c = document.getElementById('yoyChart');
  if (!c || c.dataset.done) return;
  c.dataset.done = 1;

  const ctx = c.getContext('2d');
  const W = c.parentElement.clientWidth || 700, H = 200;
  c.width = W; c.height = H;

  const m2025  = [310,325,315,320,290,270,310,330,280,265,300,340];
  const m2026  = [298,315,312,287];
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const max = 360, min = 240;
  const pad = {t:12, r:12, b:28, l:36};
  const iW  = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  [0,1,2,3].forEach(i => {
    const y = pad.t + iH*(1-i/3);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+iW, y);
    ctx.strokeStyle = 'rgba(30,49,82,0.7)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(min+(max-min)*i/3), pad.l-3, y+3);
  });

  const xp = i => pad.l + (i/11)*iW;
  const yp = v => pad.t + iH*(1-(v-min)/(max-min));

  // 2025 line
  const p25 = m2025.map((v, i) => [xp(i), yp(v)]);
  ctx.beginPath(); p25.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle = 'rgba(74,99,128,0.7)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);

  // 2026 area + line
  const p26 = m2026.map((v, i) => [xp(i), yp(v)]);
  const g = ctx.createLinearGradient(0, pad.t, 0, pad.t+iH);
  g.addColorStop(0, 'rgba(0,245,160,0.2)'); g.addColorStop(1, 'rgba(0,245,160,0)');
  ctx.beginPath(); ctx.moveTo(p26[0][0], pad.t+iH);
  p26.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(p26[p26.length-1][0], pad.t+iH); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); p26.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle = '#00f5a0'; ctx.lineWidth = 2; ctx.stroke();

  // X labels
  ctx.fillStyle = '#4a6380'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
  months.forEach((m, i) => ctx.fillText(m, xp(i), H-8));

  // Neighbourhood comparison
  const nbh = [
    {label:'Your Home',     kwh:287, badge:'badge-g'},
    {label:'Neighbours Avg',kwh:412, badge:'badge-o'},
    {label:'City Avg',      kwh:380, badge:'badge-o'},
    {label:'National Avg',  kwh:445, badge:'badge-r'},
  ];
  const nbhEl = document.getElementById('neighbourComp');
  if (nbhEl) nbhEl.innerHTML = nbh.map(n => `
    <div class="comp-row">
      <span style="font-size:13px;flex:1">${n.label}</span>
      <div class="comp-bar-wrap" style="max-width:160px">
        <div class="comp-bar-bg"><div class="comp-bar-fg" style="width:${n.kwh/445*100}%;background:var(--accent)"></div></div>
      </div>
      <span class="mono text-sm" style="min-width:55px;text-align:right">${n.kwh} kWh</span>
    </div>
  `).join('');

  drawRadar();
}

function drawRadar() {
  const c = document.getElementById('radarChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width = 260, H = c.height = 260, cx = 130, cy = 130, R = 90;
  ctx.clearRect(0, 0, W, H);
  const axes = ['Summer','Winter','Monsoon','Weekday','Weekend','Night'];
  const vals = [0.85,0.55,0.65,0.72,0.90,0.40];
  const n = axes.length;

  // Web rings
  [0.25,0.5,0.75,1].forEach(r => {
    ctx.beginPath();
    axes.forEach((_, i) => {
      const a  = (i/n)*Math.PI*2 - Math.PI/2;
      const px = cx + Math.cos(a)*R*r, py = cy + Math.sin(a)*R*r;
      i ? ctx.lineTo(px,py) : ctx.moveTo(px,py);
    });
    ctx.closePath(); ctx.strokeStyle = 'rgba(30,49,82,0.8)'; ctx.lineWidth = 1; ctx.stroke();
  });

  // Axes + labels
  axes.forEach((_, i) => {
    const a = (i/n)*Math.PI*2 - Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*R, cy+Math.sin(a)*R);
    ctx.strokeStyle = 'rgba(30,49,82,0.8)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#4a6380'; ctx.font = '11px Outfit'; ctx.textAlign = 'center';
    ctx.fillText(axes[i], cx+Math.cos(a)*(R+18), cy+Math.sin(a)*(R+18)+4);
  });

  // Data polygon
  ctx.beginPath();
  vals.forEach((v, i) => {
    const a  = (i/n)*Math.PI*2 - Math.PI/2;
    const px = cx + Math.cos(a)*R*v, py = cy + Math.sin(a)*R*v;
    i ? ctx.lineTo(px,py) : ctx.moveTo(px,py);
  });
  ctx.closePath();
  const g = ctx.createRadialGradient(cx,cy,0,cx,cy,R);
  g.addColorStop(0, 'rgba(0,245,160,0.3)'); g.addColorStop(1, 'rgba(0,245,160,0.05)');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 2; ctx.stroke();
}

// ════════════════ LOG USAGE ════════════════
const appList = [
  {name:'Air Conditioner', icon:'❄️', w:1500},
  {name:'Ceiling Fan',     icon:'🌀', w:75},
  {name:'Lighting (5x)',   icon:'💡', w:200},
  {name:'Television',      icon:'📺', w:120},
  {name:'Washing Machine', icon:'🧺', w:500},
  {name:'Computer/Laptop', icon:'🖥️', w:300},
  {name:'Microwave',       icon:'🍳', w:1200},
  {name:'Water Heater',    icon:'🚿', w:2000},
  {name:'Refrigerator',    icon:'🧊', w:150},
  {name:'Iron Box',        icon:'👕', w:1000},
  {name:'Mixer/Grinder',   icon:'🥤', w:750},
  {name:'WiFi Router',     icon:'📶', w:15},
];

const appHours = {};

function buildApplianceInputs() {
  const el = document.getElementById('applianceInputs');
  if (!el) return;
  el.innerHTML = appList.map((a, i) => {
    appHours[i] = 0;
    return `<div class="app-input-card">
      <div class="app-info">
        <div class="app-emoji">${a.icon}</div>
        <div><div class="app-n">${a.name}</div><div class="app-w">${a.w}W</div></div>
      </div>
      <div class="stepper">
        <button class="step-btn" onclick="stepHour(${i},-0.5)">−</button>
        <span class="step-val" id="sv${i}">0</span>
        <button class="step-btn" onclick="stepHour(${i},0.5)">+</button>
      </div>
    </div>`;
  }).join('');
}

function stepHour(i, d) {
  appHours[i] = Math.max(0, Math.min(24, +(appHours[i]+d).toFixed(1)));
  document.getElementById('sv'+i).textContent = appHours[i];
}

function calculate() {
  let totalWh = 0;
  appList.forEach((a, i) => totalWh += appHours[i] * a.w);
  const direct  = parseFloat(document.getElementById('directKwh').value) || 0;
  const kwh     = (totalWh/1000) + direct;
  const factor  = parseFloat(document.getElementById('gridSelect').value);
  const tariff  = parseFloat(document.getElementById('tariff').value) || 6.5;
  const carbon  = kwh * factor;
  const cost    = kwh * tariff;
  const trees   = (carbon / 21.77).toFixed(1);
  const pct     = Math.min(carbon/25*100, 100);
  const level   = pct < 35 ? '🟢 Low' : pct < 65 ? '🟡 Moderate' : '🔴 High';
  const tips    = {
    low:  'Excellent! Your footprint is low today. Keep monitoring!',
    mod:  'Moderate usage. Reducing AC by 1h could save ~1.5 kWh.',
    high: 'High usage! Consider delaying heavy appliances to off-peak hours.'
  };
  const tip = pct < 35 ? tips.low : pct < 65 ? tips.mod : tips.high;

  const resultEl = document.getElementById('calcResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="result-box">
      <div class="card-title" style="margin-bottom:14px">📊 Analysis Results</div>
      <div class="res-row"><span class="res-label">Total Consumption</span><span class="res-val green">${kwh.toFixed(2)} kWh</span></div>
      <div class="res-row"><span class="res-label">Carbon Footprint</span><span class="res-val orange">${carbon.toFixed(2)} kg CO₂</span></div>
      <div class="res-row"><span class="res-label">Estimated Cost</span><span class="res-val blue">₹${cost.toFixed(2)}</span></div>
      <div class="res-row"><span class="res-label">Trees to Offset</span><span class="res-val purple">🌳 ${trees}/yr</span></div>
      <div style="margin-top:14px">
        <div class="flex-between text-sm muted" style="margin-bottom:6px"><span>Carbon Level</span><span>${level}</span></div>
        <div class="spectrum"><div class="spectrum-thumb" id="sThumb" style="left:${pct}%"></div></div>
        <div class="flex-between" style="margin-top:4px"><span class="text-xs muted">Low</span><span class="text-xs muted">High</span></div>
      </div>
      <div style="background:rgba(0,245,160,0.06);border-radius:10px;padding:12px;margin-top:12px;font-size:13px;color:var(--text-dim);line-height:1.6">${tip}</div>
      <button class="btn btn-primary btn-full" style="margin-top:14px" onclick="saveEntry(${kwh.toFixed(2)},${carbon.toFixed(2)},${cost.toFixed(2)})">💾 Save Entry</button>
    </div>`;
}

function saveEntry(kwh, co2, cost) {
  const date = document.getElementById('logDate').value;
  const logs = JSON.parse(localStorage.getItem('wwLogs') || '[]');
  logs.push({date, kwh, co2, cost});
  localStorage.setItem('wwLogs', JSON.stringify(logs));
  showToast('✅ Saved: ' + kwh + ' kWh on ' + date, '✅');
}

// ════════════════ SAVINGS PLAN ════════════════
function initSavings() {
  const el = document.getElementById('savingsCards');
  if (!el || el.dataset.done) return;
  el.dataset.done = 1;

  const cards = [
    {icon:'❄️', title:'Smart AC Scheduling',    desc:'Set AC to 26°C and auto-off after midnight. Use timer mode during peak hours.',            priority:'high', save:'₹320', co2:'28 kg', period:'Monthly'},
    {icon:'💡', title:'Full LED Transition',     desc:'Replace all remaining 60W bulbs with 9W LEDs. Same brightness, 85% less power.',           priority:'med',  save:'₹140', co2:'12 kg', period:'Monthly'},
    {icon:'🌙', title:'Off-Peak Load Shifting',  desc:'Run washing machine, dishwasher between 10 PM – 6 AM to avoid peak tariffs.',              priority:'med',  save:'₹180', co2:'15 kg', period:'Monthly'},
    {icon:'🔌', title:'Eliminate Standby Waste', desc:'Use smart power strips to kill standby power. Average home wastes 10% to phantom loads.',   priority:'low',  save:'₹85',  co2:'7 kg',  period:'Monthly'},
    {icon:'☀️', title:'Solar Rooftop (5kW)',     desc:'1-time install. Covers ~80% of usage. Payback: 4.5 years. ₹28,000 subsidy available.',      priority:'high', save:'₹1,200',co2:'95 kg', period:'Monthly'},
    {icon:'🪟', title:'Window Film Insulation',  desc:'Reflective window film reduces heat gain by 35%, directly cutting AC load in summer.',      priority:'low',  save:'₹95',  co2:'8 kg',  period:'Monthly'},
  ];

  el.innerHTML = cards.map(c => `
    <div class="saving-card">
      <div class="saving-icon">${c.icon}</div>
      <div class="priority-tag priority-${c.priority}">${c.priority==='high'?'🔴 High Impact':c.priority==='med'?'🟡 Medium':'🟢 Quick Win'}</div>
      <div class="saving-title">${c.title}</div>
      <div class="saving-desc">${c.desc}</div>
      <div class="saving-amounts">
        <div class="saving-chip"><div class="saving-chip-val">${c.save}</div><div class="saving-chip-lbl">${c.period}</div></div>
        <div class="saving-chip"><div class="saving-chip-val" style="color:var(--accent2)">${c.co2}</div><div class="saving-chip-lbl">CO₂ saved</div></div>
      </div>
    </div>
  `).join('');
}

// ════════════════ REPORT ════════════════

// Per-period data — each key maps to real distinct numbers
const REPORT_DATA = {
  apr2026: {
    label:'April 2026', short:'Apr 2026', type:'monthly',
    kwh:287.4, co2:235.7, bill:1868, score:74,
    prevKwh:305.2, prevBill:1983,
    peakDay:'Apr 14 — 22.4 kWh', solar:0,
    appliances:[
      ['Air Conditioner',41,117.8,766],['Lighting',24,68.9,448],
      ['Washing Machine',15,43.1,280],['Computer',12,34.5,224],['Others',8,23.1,150]
    ],
    recs:[
      {icon:'❄️', text:'Raise AC to 26°C', save:'−₹320/mo'},
      {icon:'💡', text:'Full LED transition', save:'−₹140/mo'},
      {icon:'🌙', text:'Off-peak load shift', save:'−₹180/mo'},
    ],
    note:'You emitted <strong>41% less CO₂</strong> than the national average. 235.7 kg vs 400 kg benchmark.'
  },
  mar2026: {
    label:'March 2026', short:'Mar 2026', type:'monthly',
    kwh:305.2, co2:250.3, bill:1983, score:68,
    prevKwh:290.1, prevBill:1885,
    peakDay:'Mar 8 — 24.1 kWh', solar:0,
    appliances:[
      ['Air Conditioner',38,115.9,754],['Lighting',25,76.3,496],
      ['Washing Machine',16,48.8,318],['Computer',13,39.7,258],['Others',8,24.5,160]
    ],
    recs:[
      {icon:'❄️', text:'AC timer scheduling', save:'−₹290/mo'},
      {icon:'🔌', text:'Eliminate standby loads', save:'−₹85/mo'},
      {icon:'💡', text:'Switch to LED bulbs', save:'−₹140/mo'},
    ],
    note:'March usage was <strong>6% higher</strong> than February. Hot spell mid-month drove AC usage up.'
  },
  feb2026: {
    label:'February 2026', short:'Feb 2026', type:'monthly',
    kwh:290.1, co2:238.0, bill:1885, score:71,
    prevKwh:312.0, prevBill:2028,
    peakDay:'Feb 19 — 21.8 kWh', solar:0,
    appliances:[
      ['Air Conditioner',35,101.5,660],['Lighting',26,75.4,490],
      ['Washing Machine',17,49.3,321],['Computer',13,37.7,245],['Others',9,26.2,170]
    ],
    recs:[
      {icon:'🌙', text:'Shift heavy loads to off-peak', save:'−₹160/mo'},
      {icon:'❄️', text:'Service AC filters', save:'−₹95/mo'},
      {icon:'🔌', text:'Smart power strips', save:'−₹70/mo'},
    ],
    note:'February was your <strong>best month</strong> this quarter — 7% below January consumption.'
  },
  jan2026: {
    label:'January 2026', short:'Jan 2026', type:'monthly',
    kwh:312.0, co2:256.0, bill:2028, score:62,
    prevKwh:298.0, prevBill:1937,
    peakDay:'Jan 3 — 26.7 kWh', solar:0,
    appliances:[
      ['Air Conditioner',44,137.3,893],['Lighting',23,71.8,467],
      ['Washing Machine',14,43.7,284],['Computer',11,34.3,223],['Others',8,25.0,163]
    ],
    recs:[
      {icon:'❄️', text:'Reduce AC runtime by 1h/day', save:'−₹350/mo'},
      {icon:'☀️', text:'Consider solar rooftop (5kW)', save:'−₹1,200/mo'},
      {icon:'🪟', text:'Window film insulation', save:'−₹95/mo'},
    ],
    note:'January was the <strong>highest usage month</strong> so far this year — peak summer heat drove AC to 44% of total.'
  },
  q1_2026: {
    label:'Q1 2026 (Jan–Mar)', short:'Q1 2026', type:'quarterly',
    kwh:907.3, co2:744.0, bill:5896, score:67,
    prevKwh:945.0, prevBill:6143,
    peakDay:'Jan 3 — 26.7 kWh', solar:0,
    appliances:[
      ['Air Conditioner',39,353.8,2300],['Lighting',25,226.8,1474],
      ['Washing Machine',16,145.2,944],['Computer',12,108.9,708],['Others',8,72.6,472]
    ],
    recs:[
      {icon:'❄️', text:'AC scheduling across all months', save:'−₹960/qtr'},
      {icon:'💡', text:'Full LED transition', save:'−₹420/qtr'},
      {icon:'☀️', text:'Solar rooftop investment', save:'−₹3,600/qtr'},
    ],
    note:'Q1 total was <strong>4% below Q1 2025</strong> (945 kWh). Consistent improvement trend observed.'
  }
};

function getReportData() {
  const period = document.getElementById('reportPeriod')?.value || 'apr2026';
  return REPORT_DATA[period];
}

function buildPreviewHTML(d, format) {
  const isSummary = format === 'summary';
  const isCSV     = format === 'csv';
  const pctVsLast = ((d.kwh - d.prevKwh) / d.prevKwh * 100).toFixed(1);
  const vsLabel   = pctVsLast > 0
    ? `↑ ${pctVsLast}% Higher`
    : `↓ ${Math.abs(pctVsLast)}% Better`;

  const kv = (k, v) =>
    `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e5e7eb;font-size:13px;color:#333">
      <span>${k}</span><span style="font-weight:600;color:#111">${v}</span>
    </div>`;

  if (isCSV) {
    return `
      <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#059669;margin-bottom:10px;">⚡ WattWise Pro</div>
      <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:12px;">Data Export — ${d.label}</div>
      <div style="background:#f9fafb;border-radius:8px;padding:14px;font-family:monospace;font-size:11px;color:#374151;line-height:1.8;white-space:pre;">Appliance,Pct,kWh,Cost_INR
${d.appliances.map(a=>`${a[0]},${a[1]}%,${a[2]},${a[3]}`).join('\n')}

Summary,,,
Total kWh,${d.kwh},,
Carbon kg CO2,${d.co2},,
Bill INR,${d.bill},,
Efficiency Score,${d.score}/100,,</div>
      <div style="font-size:11px;color:#6b7280;margin-top:10px;">⬇ Click Generate to download as CSV file</div>`;
  }

  const summaryRows = `
    ${kv('Total Consumption', d.kwh.toFixed(1) + ' kWh')}
    ${kv('Carbon Footprint',  d.co2.toFixed(1) + ' kg CO₂')}
    ${kv('Estimated Bill',    '₹' + d.bill.toLocaleString())}
    ${kv('vs Previous Period', vsLabel)}
    ${kv('Efficiency Score',  d.score + ' / 100')}
    ${kv('Peak Day',          d.peakDay)}
    ${kv('Solar Offset',      d.solar + ' kWh')}
    ${kv('Potential Savings', '₹' + Math.round(d.recs.reduce((s,r)=>s + parseInt(r.save.replace(/[^0-9]/g,'')),0)/3 * d.recs.length) + ' / ' + (d.type==='quarterly'?'qtr':'month'))}
  `;

  const appTable = isSummary ? '' : `
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;border-bottom:2px solid #059669;padding-bottom:5px;margin:16px 0 10px;">Appliance Breakdown</div>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f9fafb;"><th style="text-align:left;padding:7px;font-size:12px;border-bottom:1px solid #e5e7eb;">Appliance</th><th style="padding:7px;font-size:12px;border-bottom:1px solid #e5e7eb;">%</th><th style="padding:7px;font-size:12px;border-bottom:1px solid #e5e7eb;">kWh</th><th style="padding:7px;font-size:12px;border-bottom:1px solid #e5e7eb;">Cost ₹</th></tr>
      ${d.appliances.map(a=>`<tr><td style="padding:7px;font-size:12px;border-bottom:1px solid #f3f4f6;">${a[0]}</td><td style="padding:7px;font-size:12px;border-bottom:1px solid #f3f4f6;text-align:center;">${a[1]}%</td><td style="padding:7px;font-size:12px;border-bottom:1px solid #f3f4f6;text-align:center;">${a[2]}</td><td style="padding:7px;font-size:12px;border-bottom:1px solid #f3f4f6;text-align:center;">₹${a[3]}</td></tr>`).join('')}
    </table>`;

  const recRows = isSummary ? '' : `
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;border-bottom:2px solid #059669;padding-bottom:5px;margin:16px 0 10px;">Recommendations</div>
    ${d.recs.map(r=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e5e7eb;font-size:13px;"><span>${r.icon} ${r.text}</span><span style="color:#059669;font-weight:600;">${r.save}</span></div>`).join('')}`;

  return `
    <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#059669;margin-bottom:6px;">⚡ WattWise Pro</div>
    <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:2px;">${d.type==='quarterly'?'Quarterly':'Monthly'} Energy Report</div>
    <div style="font-size:12px;color:#666;margin-bottom:14px;border-bottom:2px solid #059669;padding-bottom:10px;">${d.label} · Arjun S. · Ahmedabad, Gujarat</div>
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;border-bottom:2px solid #059669;padding-bottom:5px;margin-bottom:10px;">Summary</div>
    ${summaryRows}${appTable}${recRows}
    <div style="background:#f0fdf4;border-radius:8px;padding:12px;margin-top:14px;font-size:12px;color:#065f46;">🌱 ${d.note}</div>`;
}

function updateReportPreview() {
  const d      = getReportData();
  const format = document.getElementById('reportFormat')?.value || 'full';
  const box    = document.getElementById('reportPreviewBox');
  const title  = document.getElementById('previewTitle');
  if (!box) return;
  if (title) title.textContent = 'Preview — ' + d.label;
  box.innerHTML = buildPreviewHTML(d, format);
}

function initReport() {
  updateReportPreview();
}

function genReport() {
  const d      = getReportData();
  const format = document.getElementById('reportFormat')?.value || 'full';
  const charts = document.getElementById('reportCharts')?.value || 'all';

  if (format === 'csv') {
    // Download as actual CSV file
    const rows = [
      ['Appliance','% Usage','kWh','Cost (INR)'],
      ...d.appliances.map(a => [a[0], a[1]+'%', a[2], a[3]]),
      [],
      ['Metric','Value','',''],
      ['Period', d.label,'',''],
      ['Total kWh', d.kwh,'',''],
      ['Carbon kg CO₂', d.co2,'',''],
      ['Bill ₹', d.bill,'',''],
      ['Efficiency Score', d.score+'/100','',''],
      ['Peak Day', d.peakDay,'',''],
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `WattWise_${d.short.replace(/ /g,'_')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('📊 CSV downloaded: ' + d.short, '📊');
    return;
  }

  showToast('📄 Generating report for ' + d.label + '…', '📄');

  const pctVsLast = ((d.kwh - d.prevKwh) / d.prevKwh * 100).toFixed(1);
  const vsLabel   = pctVsLast > 0
    ? `↑ ${pctVsLast}% Higher than previous`
    : `↓ ${Math.abs(pctVsLast)}% Better than previous`;

  const isSummary = format === 'summary';

  const appSection = (isSummary || charts === 'none') ? '' : `
    <h2>Appliance Breakdown</h2>
    <table>
      <tr><th>Appliance</th><th>% Usage</th><th>kWh</th><th>Cost ₹</th></tr>
      ${d.appliances.map(a=>`<tr><td>${a[0]}</td><td>${a[1]}%</td><td>${a[2]}</td><td>₹${a[3]}</td></tr>`).join('')}
    </table>`;

  const recSection = isSummary ? '' : `
    <h2>Recommendations</h2>
    ${d.recs.map(r=>`<div class="kv"><span>${r.icon} ${r.text}</span><span style="color:#059669"><strong>${r.save}</strong></span></div>`).join('')}`;

  setTimeout(() => {
    const w = window.open('', '_blank');
    if (!w) { showToast('⚠️ Allow pop-ups to generate report', '⚠️'); return; }
    w.document.write(`<!DOCTYPE html><html><head>
    <title>WattWise Pro — ${d.label}</title>
    <style>
      body{font-family:Arial,sans-serif;max-width:740px;margin:40px auto;color:#111;line-height:1.5;}
      h1{color:#059669;margin-bottom:4px;}
      h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #059669;padding-bottom:6px;margin-top:28px;color:#059669;}
      .kv{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px;}
      .badge{background:#d1fae5;color:#065f46;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:bold;}
      .badge-r{background:#fee2e2;color:#991b1b;}
      table{width:100%;border-collapse:collapse;margin-top:8px;}
      th,td{text-align:left;padding:8px;border-bottom:1px solid #eee;font-size:13px;}
      th{background:#f9fafb;font-weight:600;}
      .note{background:#ecfdf5;border-radius:8px;padding:14px;margin-top:20px;font-size:13px;color:#065f46;}
      .meta{color:#6b7280;font-size:13px;margin-bottom:4px;}
      .print-btn{background:#059669;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;margin-top:20px;}
      @media print{.print-btn{display:none}}
    </style></head><body>
    <h1>⚡ WattWise Pro</h1>
    <p class="meta">${d.type==='quarterly'?'Quarterly':'Monthly'} Energy Report — ${d.label} | Arjun S. | Ahmedabad, Gujarat</p>
    <h2>Summary</h2>
    <div class="kv"><span>Total Consumption</span><span><strong>${d.kwh.toFixed(1)} kWh</strong></span></div>
    <div class="kv"><span>Carbon Footprint</span><span><strong>${d.co2.toFixed(1)} kg CO₂</strong></span></div>
    <div class="kv"><span>Estimated Bill</span><span><strong>₹${d.bill.toLocaleString()}</strong></span></div>
    <div class="kv"><span>vs Previous Period</span><span><span class="badge ${pctVsLast > 0 ? 'badge-r' : ''}">${vsLabel}</span></span></div>
    <div class="kv"><span>Efficiency Score</span><span><strong>${d.score} / 100</strong></span></div>
    <div class="kv"><span>Peak Day</span><span><strong>${d.peakDay}</strong></span></div>
    ${appSection}${recSection}
    <div class="note">🌱 ${d.note}</div>
    <br><button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
    </body></html>`);
    w.document.close();
  }, 800);
}

// ════════════════ UTILITIES ════════════════
function animNum(id, target, dec) {
  const el = document.getElementById(id);
  if (!el) return;
  let v = 0;
  const step = target / 45;
  const t = setInterval(() => {
    v += step;
    if (v >= target) { el.textContent = target.toFixed(dec); clearInterval(t); return; }
    el.textContent = v.toFixed(dec);
  }, 25);
}

function showToast(msg, icon='✅') {
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ════════════════ LIVE CLOCK ════════════════
setInterval(() => {
  const t  = new Date();
  const ts = t.getHours() + ':' + String(t.getMinutes()).padStart(2,'0') + ':' + String(t.getSeconds()).padStart(2,'0');
  const pill = document.querySelector('.live-pill');
  if (pill) pill.innerHTML = '<div class="live-dot"></div>LIVE — ' + ts;
}, 1000);

// ════════════════ WINDOW RESIZE — redraw visible charts ════════════════
// FIX: redraw charts when window is resized to prevent squished/empty canvases
window.addEventListener('resize', () => {
  const active = document.querySelector('.page.active');
  if (!active) return;
  const id = active.id;
  if (id === 'dashboard') { drawMainChart(); drawDonut(); }
  if (id === 'realtime')  { drawRTChart(); }
  if (id === 'analytics') { drawTrendChart(); drawHourlyChart(); drawCostBar(); }
  if (id === 'compare') {
    const yoy = document.getElementById('yoyChart');
    if (yoy) delete yoy.dataset.done;
    initCompare();
  }
});

// ════════════════ INIT ════════════════
window.addEventListener('load', () => {
  initDashboard();
  buildApplianceInputs();
  // Set today's date as default log date
  const logDate = document.getElementById('logDate');
  if (logDate) logDate.value = new Date().toISOString().split('T')[0];
});
