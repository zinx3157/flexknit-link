'use strict';
/* ============================================================
   FlexKnit Link — core engine: state, helpers, icons, charts,
   notifications, router shell, delegated events.
   View templates live in views.js.
   ============================================================ */

const S = { state: null, user: null, route: 'dashboard', q: '', f: {}, shipTab: 'overview', notifOpen: false, modal: null };

/* ---------------- helpers ---------------- */
const $  = (sel, el) => (el || document).querySelector(sel);
const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function parseD(s) { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function diffDays(a, b) { return Math.round((parseD(a) - parseD(b)) / 864e5); }
function todayISO() { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }
function fmtDate(s) { if (!s) return '—'; return parseD(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); }
function fmtDateY(s) { if (!s) return '—'; return parseD(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtDT(iso) { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 6e4);
  if (m < 1) return 'just now'; if (m < 60) return m + 'm ago';
  const h = Math.round(m / 60); if (h < 24) return h + 'h ago';
  const dd = Math.round(h / 24); if (dd < 7) return dd + 'd ago';
  return fmtDT(iso);
}
const num = n => (+n || 0).toLocaleString('en-US');
const money = n => n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : '$' + Math.round(n).toLocaleString();
const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

async function api(path, opts = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
/* storage-safe helpers (localStorage throws in sandboxed/opaque-origin contexts) */
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
async function refresh() {
  S.state = await api('/api/state');
  if (S.user) renderView();
  updateBadges();
}

/* ---------------- icons ---------------- */
const IC = {
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/>',
  ship: '<path d="M4 8.5h16v6.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M7.5 8.5V6A2 2 0 0 1 9.5 4h5A2 2 0 0 1 16.5 6v2.5"/><path d="M4 13h16"/><path d="M8.5 8.5v11M12 8.5v11M15.5 8.5v11" opacity=".55"/>',
  shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  bar: '<path d="M3 3v18h18"/><path d="M8 17v-6M13 17V7M18 17v-9"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  anchor: '<circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
  truck: '<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  flag: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.5 2 1.3 0 2.4-.3 3.1-.6a.5.5 0 0 1 .7.5V13a1 1 0 0 1-.4.8A6 6 0 0 1 15.5 15c-3 0-5-2-7.5-2-1.3 0-2.4.3-3.1.6"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  edit: '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  knit: '<path d="M4 9l5-5 5 5 5-5 5 5" transform="scale(0.88) translate(1,2)"/><path d="M4 17l5-5 5 5 5-5 5 5" transform="scale(0.88) translate(1,2)"/>'
};
const icon = (name, size = 17) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[name] || ''}</svg>`;

/* ---------------- domain meta ---------------- */
const SHIP_ST = {
  'Booked': 'slate', 'In Production': 'indigo', 'Ready to Ship': 'blue', 'In Transit': 'teal',
  'Transshipment': 'cyan', 'Customs – Toamasina': 'amber', 'Customs – Ivato': 'amber',
  'Cleared – Inland': 'green', 'Received': 'green'
};
const SAMPLE_ST = { 'Requested': 'slate', 'In Development': 'indigo', 'Courier Out': 'blue', 'Under Review': 'amber', 'Approved': 'green', 'Redo': 'red' };
const ACC_ST = { 'Planned': 'slate', 'Ordered': 'indigo', 'In Transit': 'teal', 'Received': 'green', 'Shortage': 'red' };
const chip = (label, color, extra) => `<span class="chip chip-${color}${extra || ''}">${label}</span>`;
const stChip = s => chip(esc(s), SHIP_ST[s] || 'slate');
const smChip = s => chip(esc(s), SAMPLE_ST[s] || 'slate');
const acChip = s => chip(esc(s), ACC_ST[s] || 'slate');

const catalog = () => S.state.catalog;
const user = id => S.state.users.find(u => u.id === id);
const roleLabel = r => ({ superadmin: 'Super Admin', logistics: 'Logistics', merchandising: 'Merchandising', admin: 'Management', system: 'System' }[r] || (r || 'System'));
const avatar = (u, cls) => `<span class="avatar ${cls || ''}" style="background:${u.color}" title="${esc(u.name)}">${initials(u.name)}</span>`;
const can = () => S.user && S.user.role !== 'merchandising'; // logistics & admin can operate
const delayLabel = code => { const r = catalog().delayReasons.find(d => d.code === code); return r ? `${r.code} · ${r.label}` : (code || '—'); };

function delayDays(s) {
  if (s.status === 'Received') return Math.max(0, diffDays(s.ata, s.eta));
  return Math.max(0, -diffDays(s.eta, todayISO()));
}
function etaChipHtml(s) {
  if (s.status === 'Received') {
    const late = delayDays(s);
    return late ? chip(`${late}d late`, 'red') : chip('On time', 'green');
  }
  const drem = diffDays(s.eta, todayISO());
  const label = drem > 0 ? `ETA in ${drem}d` : drem === 0 ? 'ETA today' : `${-drem}d past ETA`;
  const tone = s.delayed ? 'red' : drem <= 3 ? 'amber' : 'slate';
  return chip(label + (s.delayed ? ' · delayed' : ''), tone, s.delayed ? ' chip-pulse' : '');
}
function docsReady(s) { return Object.values(s.docs).filter(Boolean).length; }
function polName(code) { const p = catalog().pols.find(x => x.code === code); return p ? p.name : code; }
function podName(code) { const p = catalog().pods.find(x => x.code === code); return p ? p.name : code; }
function viaName(code) { const p = catalog().vias.find(x => x.code === code); return p ? p.name : code; }

/* ---------------- charts (hand-rolled SVG) ---------------- */
function donut(pct, color, size = 40, sw = 5) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return `<svg class="docring" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="#e9edf2" stroke-width="${sw}" fill="none"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-dasharray="${(pct / 100) * c} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}
function spark(points, w = 92, h = 34, color = '#0d9488') {
  if (!points.length) points = [0, 0];
  const mx = Math.max(...points, 1), mn = Math.min(...points, 0);
  const px = i => (i / (points.length - 1)) * (w - 4) + 2;
  const py = v => h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 8);
  const line = points.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  return `<svg class="sparkline" width="${w}" height="${h}"><path d="${line} L${px(points.length - 1)} ${h} L${px(0)} ${h} Z" fill="${color}" opacity=".1"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function hbars(items, colorFn) {
  const mx = Math.max(...items.map(i => i.value), 1);
  return items.map(it => {
    const w = Math.max(6, (it.value / mx) * 100);
    return `<div class="hbar-row">
      <div style="font-weight:600;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(it.label)}">${esc(it.label)}</div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;background:${colorFn(it)}">${it.value}</div></div>
      <div style="text-align:right;color:var(--mut);font-variant-numeric:tabular-nums">${it.suffix || ''}</div>
    </div>`;
  }).join('');
}
function lineChart(series, w = 560, h = 190, color = '#0d9488') {
  const pad = { l: 34, r: 14, t: 14, b: 26 };
  const mx = Math.max(...series.map(s => s.v), 1), mn = 0;
  const px = i => pad.l + (i / (series.length - 1 || 1)) * (w - pad.l - pad.r);
  const py = v => pad.t + (1 - (v - mn) / (mx - mn || 1)) * (h - pad.t - pad.b);
  const line = series.map((s, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(s.v).toFixed(1)}`).join(' ');
  const grid = [0, .5, 1].map(f => {
    const y = pad.t + f * (h - pad.t - pad.b), val = Math.round(mx - f * (mx - mn));
    return `<line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}" stroke="#eef1f6"/><text x="${pad.l - 7}" y="${y + 3.5}" text-anchor="end" font-size="9.5" fill="#a3adb8">${val}%</text>`;
  }).join('');
  const dots = series.map((s, i) => `<circle cx="${px(i)}" cy="${py(s.v)}" r="3.4" fill="#fff" stroke="${color}" stroke-width="2.2"/><text x="${px(i)}" y="${h - 8}" text-anchor="middle" font-size="9.5" fill="#a3adb8">${s.m}</text>`).join('');
  const area = `${line} L${px(series.length - 1)} ${h - pad.b} L${px(0)} ${h - pad.b} Z`;
  return `<svg width="100%" viewBox="0 0 ${w} ${h}"><path d="${area}" fill="${color}" opacity=".08"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${grid}${dots}</svg>`;
}

/* ---------------- notifications ---------------- */
function notifs() {
  const T = todayISO(), out = [];
  db => null;
  S.state.shipments.forEach(s => {
    if (s.delayed && s.status !== 'Received')
      out.push({ tone: 'red', icon: 'alert', t: `${s.id} delayed — ${delayLabel(s.delayReason)}`, s: `${s.supplier.name} → ${podName(s.pod)} · ETA ${fmtDate(s.eta)}`, go: 'shipments', ref: s.id });
    if (!s.delayed && s.status !== 'Received' && diffDays(s.eta, T) >= 0 && diffDays(s.eta, T) <= 3 && docsReady(s) < 6)
      out.push({ tone: 'amber', icon: 'doc', t: `${s.id} arrives soon — docs ${docsReady(s)}/6`, s: `${s.buyer} · ${s.commodity}`, go: 'shipments', ref: s.id });
    const lastEta = (s.etaHistory || []).slice(-1)[0];
    if (lastEta && lastEta.on >= T && !s.delayed === false) { /* noop guard */ }
    if (lastEta && diffDays(T, lastEta.on) <= 2 && lastEta.on >= T)
      out.push({ tone: 'violet', icon: 'clock', t: `ETA changed on ${s.id} → ${fmtDate(s.eta)}`, s: lastEta.note || 'Review impact on production plan', go: 'shipments', ref: s.id });
  });
  S.state.samples.forEach(s => {
    const dd = diffDays(s.dueDate, T);
    if (dd < 0 && !['Approved'].includes(s.status))
      out.push({ tone: 'red', icon: 'shirt', t: `${s.id} overdue by ${-dd}d`, s: `${s.style} ${s.styleName} · ${s.buyer} · ${s.status}`, go: 'samples', ref: s.id });
    else if (dd >= 0 && dd <= 2 && ['Requested', 'In Development'].includes(s.status))
      out.push({ tone: 'amber', icon: 'shirt', t: `${s.id} due ${fmtDate(s.dueDate)}`, s: `${s.type} · ${s.buyer}`, go: 'samples', ref: s.id });
  });
  S.state.accessories.forEach(a => {
    const dd = diffDays(a.requiredDate, T);
    if (a.status === 'Shortage' || (a.received < a.ordered && dd < 0))
      out.push({ tone: 'red', icon: 'tag', t: `${a.id} shortage — ${a.received < a.ordered ? num(a.ordered - a.received) + ' ' + a.unit + ' missing' : 'flagged'}`, s: `${a.item} · required ${fmtDate(a.requiredDate)}`, go: 'accessories', ref: a.id });
    else if (a.received < a.ordered && dd <= 3 && dd >= 0)
      out.push({ tone: 'amber', icon: 'tag', t: `${a.id} needed in ${dd}d`, s: `${a.item} · ${a.status}`, go: 'accessories', ref: a.id });
  });
  const order = { red: 0, amber: 1, violet: 2 };
  return out.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 14);
}

/* ---------------- toast ---------------- */
function toast(msg, tone = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${tone}`;
  el.innerHTML = `<span class="t-ic">${icon(tone === 'ok' ? 'check' : 'alert', 16)}</span><span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.transition = '.3s'; el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; setTimeout(() => el.remove(), 300); }, 3400);
}

/* ---------------- modal ---------------- */
function openModal(html, cls) { $('#modal-root').innerHTML = `<div class="ovl" data-ovl="1"><div class="modal ${cls || ''}">${html}</div></div>`; document.body.classList.add('locked'); }
function closeModal() { $('#modal-root').innerHTML = ''; document.body.classList.remove('locked'); S.modal = null; }

/* ---------------- shell ---------------- */
const NAV = [
  { sec: 'Operations' },
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'imports', label: 'Import Timeline', icon: 'box', badge: () => S.state.shipments.filter(s => s.delayed && s.status !== 'Received').length + S.state.accessories.filter(a => a.status === 'Shortage' || (a.received < a.ordered && diffDays(a.requiredDate, todayISO()) < 0)).length },
  { id: 'shipments', label: 'Imports & Shipments', icon: 'ship', badge: () => S.state.shipments.filter(s => s.delayed && s.status !== 'Received').length },
  { id: 'samples', label: 'Sample Tracker', icon: 'shirt', badge: () => S.state.samples.filter(s => diffDays(s.dueDate, todayISO()) < 0 && s.status !== 'Approved').length },
  { id: 'accessories', label: 'Accessories & Trims', icon: 'tag', badge: () => S.state.accessories.filter(a => a.status === 'Shortage').length },
  { sec: 'Insight' },
  { id: 'analytics', label: 'Delay Analytics', icon: 'bar' },
  { id: 'activity', label: 'Activity Feed', icon: 'pulse' }
];
const TITLES = {
  dashboard: ['Control Tower', 'FlexKnit Factories · Antananarivo — live import & sample visibility'],
  imports: ['Import Timeline — Yarn & Accessories', 'Everything inbound, in one merchandising view — kept live by the shipping desk'],
  shipments: ['Imports & Shipments', 'Yarn, trims & accessories inbound via Toamasina and Ivato'],
  samples: ['Sample Tracker', 'Proto · Fit · PP · TOP pipeline between merchandising and buyers'],
  accessories: ['Accessories & Trims', 'Trims PO coverage against knitting & finishing plan'],
  analytics: ['Delay Analytics', 'Root causes, carrier performance and on-time trend'],
  activity: ['Activity Feed', 'Everything logistics and merchandising touched, in one stream']
};

function renderLogin() { $('#root').innerHTML = viewLogin(); }
function renderShell() {
  const u = S.user;
  $('#root').innerHTML = `
  <div class="shell">
    <aside class="side">
      <div class="side-logo">
        <span class="logo-mark">${icon('knit', 24)}</span>
        <span class="t"><b>FLEXKNIT <span style="color:#2dd4bf">LINK</span></b><span>Logistics × Merch Ops</span></span>
      </div>
      <nav class="side-nav">
        ${NAV.map(n => n.sec
          ? `<div class="nav-sec">${n.sec}</div>`
          : `<button class="nav-it ${S.route === n.id ? 'on' : ''}" data-action="nav" data-nav="${n.id}">${icon(n.icon)}<span class="nl">${n.label}</span><span class="nv-badge" data-navbadge="${n.id}" style="display:none"></span></button>`
        ).join('')}
      </nav>
      <div class="side-foot">
        <button class="who" data-action="logout" title="Switch user">
          ${avatar(u)}<span><span class="wn">${esc(u.name)}</span><span class="wr">${roleLabel(u.role)}</span></span>
          <span class="out">${icon('out', 16)}</span>
        </button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div class="tb-title"><h1 id="tb-h"></h1><p id="tb-p"></p></div>
        <div class="tb-right">
          <label class="gsearch">${icon('search', 15)}<input id="gq" placeholder="Search PO, shipment, style…" data-input="gq"></label>
          <span class="demo-chip">DEMO DATA</span>
          <div style="position:relative">
            <button class="icon-btn" data-action="notifs">${icon('bell')}<span class="nb" id="notif-n" style="display:none"></span></button>
            <div id="notif-pop"></div>
          </div>
          <button class="btn btn-primary btn-sm" data-action="quick-add">${icon('plus', 15)} New</button>
        </div>
      </header>
      <section class="view" id="view"></section>
    </div>
  </div>`;
  updateBadges(); renderView();
}
function updateBadges() {
  if (!S.user) return;
  NAV.forEach(n => { if (!n.badge) return; const el = $(`[data-navbadge="${n.id}"]`); if (!el) return; const v = n.badge(); el.style.display = v ? '' : 'none'; el.textContent = v; });
  const ns = notifs().length, nb = $('#notif-n');
  if (nb) { nb.style.display = ns ? '' : 'none'; nb.textContent = ns > 9 ? '9+' : ns; }
}
function renderView() {
  if (!S.user) return renderLogin();
  const [h, p] = TITLES[S.route] || TITLES.dashboard;
  const th = $('#tb-h'), tp = $('#tb-p');
  if (th) { th.textContent = h; tp.textContent = p; }
  $$('.nav-it').forEach(el => el.classList.toggle('on', el.dataset.nav === S.route));
  const V = { dashboard: viewDashboard, imports: viewImports, shipments: viewShipments, samples: viewSamples, accessories: viewAccessories, analytics: viewAnalytics, activity: viewActivity };
  $('#view').innerHTML = (V[S.route] || viewDashboard)();
  updateBadges();
}
function setRoute(r) { S.route = r; S.q = ''; const g = $('#gq'); if (g) g.value = ''; renderView(); }

/* ---------------- events ---------------- */
document.addEventListener('click', e => {
  const ov = e.target.closest('[data-ovl]');
  if (ov && e.target === ov) return closeModal();
  const el = e.target.closest('[data-action]');
  if (!el) { if (S.notifOpen && !e.target.closest('#notif-pop') && !e.target.closest('[data-action="notifs"]')) { S.notifOpen = false; $('#notif-pop').innerHTML = ''; } return; }
  const act = el.dataset.action, id = el.dataset.id;
  const A = {
    'nav': () => setRoute(el.dataset.nav),
    'login': () => { S.user = S.state.users.find(u => u.id === el.dataset.id); lsSet('fk-user', S.user.id); renderShell(); toast(`Welcome, ${S.user.name.split(' ')[0]} — signed in as ${roleLabel(S.user.role)}`); },
    'logout': () => { S.user = null; lsDel('fk-user'); renderLogin(); },
    'notifs': () => { S.notifOpen = !S.notifOpen; $('#notif-pop').innerHTML = S.notifOpen ? notifPopHtml() : ''; },
    'notif-go': () => {
      S.notifOpen = false; $('#notif-pop').innerHTML = '';
      const go = el.dataset.go, ref = el.dataset.ref;
      setRoute(go);
      if (ref) setTimeout(() => { if (go === 'shipments') openShipModal(ref); else if (go === 'samples') openSampleModal(ref); else if (go === 'accessories') openAccModal(ref); }, 40);
    },
    'close': () => closeModal(),
    'quick-add': () => { S.route === 'samples' ? openSampleForm() : S.route === 'accessories' ? openAccForm() : openShipmentForm(); },
    'new-shipment': () => openShipmentForm(),
    'new-sample': () => openSampleForm(),
    'new-acc': () => openAccForm(),
    'export': () => window.open('/api/export?module=' + el.dataset.module, '_blank'),
    'reset-demo': async () => { await api('/api/reset', { method: 'POST' }); toast('Demo data reset'); closeModal(); await refresh(); },
    'open-ship': () => openShipModal(id),
    'open-sample': () => openSampleModal(id),
    'open-acc': () => openAccModal(id),
    'ship-tab': () => { S.shipTab = el.dataset.tab; renderView(); const m = $('#ship-modal'); if (m) openShipModal(m.dataset.id); },
    'eta-form': () => openEtaForm(id),
    'delay-form': () => openDelayForm(id),
    'receive': async () => {
      if (!confirm('Mark this shipment as Received at factory?')) return;
      await api(`/api/shipments/${id}`, { method: 'PATCH', body: JSON.stringify({ userId: S.user.id, patch: { status: 'Received', ata: todayISO(), delayed: false, progress: 100 } }) });
      toast('Shipment marked as received'); await refresh(); openShipModal(id);
    },
    'toggle-doc': async () => {
      if (!can()) return toast('Only logistics users can edit document status', 'err');
      await api(`/api/shipments/${el.dataset.ship}`, { method: 'PATCH', body: JSON.stringify({ userId: S.user.id, patch: { docs: { [el.dataset.doc]: el.dataset.on !== '1' } } }) });
      await refresh(); openShipModal(el.dataset.ship);
    },
    'move-sample': async () => {
      const to = el.dataset.to, s = S.state.samples.find(x => x.id === id);
      if (to === 'Courier Out') return openCourierForm(id);
      await api(`/api/samples/${id}`, { method: 'PATCH', body: JSON.stringify({ userId: S.user.id, patch: { status: to } }) });
      toast(`${s.id} → ${to}`); await refresh(); openSampleModal(id);
    },
    'reset-filters': () => { S.f = {}; S.q = ''; const g = $('#gq'); if (g) g.value = ''; renderView(); },
    'buyer-filter': () => { S.f.impBuyer = el.dataset.buyer; setRoute('imports'); }
  };
  if (A[act]) A[act]();
});

document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form, fd = Object.fromEntries(new FormData(f).entries());
  const uid = S.user.id;
  try {
    if (kind === 'comment-ship') {
      await api(`/api/shipments/${fd.id}/comments`, { method: 'POST', body: JSON.stringify({ userId: uid, text: fd.text }) });
      await refresh(); openShipModal(fd.id);
      return;
    }
    if (kind === 'comment-sample') {
      await api(`/api/samples/${fd.id}/comments`, { method: 'POST', body: JSON.stringify({ userId: uid, text: fd.text }) });
      await refresh(); openSampleModal(fd.id);
      return;
    }
    if (kind === 'eta') {
      await api(`/api/shipments/${fd.id}`, { method: 'PATCH', body: JSON.stringify({ userId: uid, patch: { eta: fd.eta }, note: fd.note }) });
      toast(`ETA updated → ${fmtDate(fd.eta)}`); closeModal(); await refresh(); openShipModal(fd.id);
      return;
    }
    if (kind === 'delay') {
      const patch = { delayed: fd.delayed === '1', delayReason: fd.delayed === '1' ? fd.reason : null, delayNote: fd.delayed === '1' ? fd.note : '' };
      if (fd.revisedEta) patch.eta = fd.revisedEta;
      await api(`/api/shipments/${fd.id}`, { method: 'PATCH', body: JSON.stringify({ userId: uid, patch }) });
      toast(patch.delayed ? 'Delay logged — merchandising notified' : 'Delay cleared'); closeModal(); await refresh(); openShipModal(fd.id);
      return;
    }
    if (kind === 'new-shipment') {
      await api('/api/shipments', { method: 'POST', body: JSON.stringify({ userId: uid, data: fd }) });
      toast('Shipment created'); closeModal(); setRoute('shipments'); await refresh();
      return;
    }
    if (kind === 'new-sample') {
      await api('/api/samples', { method: 'POST', body: JSON.stringify({ userId: uid, data: fd }) });
      toast('Sample request raised — logistics notified'); closeModal(); setRoute('samples'); await refresh();
      return;
    }
    if (kind === 'courier') {
      await api(`/api/samples/${fd.id}`, { method: 'PATCH', body: JSON.stringify({ userId: uid, patch: { status: 'Courier Out', courier: fd.courier, tracking: fd.tracking } }) });
      toast('Courier booked — buyer dispatch updated'); closeModal(); await refresh(); openSampleModal(fd.id);
      return;
    }
    if (kind === 'new-acc') {
      await api('/api/accessories', { method: 'POST', body: JSON.stringify({ userId: uid, data: fd }) });
      toast('Trims PO created'); closeModal(); setRoute('accessories'); await refresh();
      return;
    }
    if (kind === 'acc-receive') {
      await api(`/api/accessories/${fd.id}`, { method: 'PATCH', body: JSON.stringify({ userId: uid, patch: { received: +fd.received, status: fd.status } }) });
      toast('Receipt updated'); closeModal(); await refresh(); openAccModal(fd.id);
      return;
    }
  } catch (err) { toast(err.message || 'Something went wrong', 'err'); }
});

document.addEventListener('input', e => {
  if (e.target.matches('[data-input="gq"]')) {
    S.q = e.target.value.toLowerCase();
    const V = { shipments: viewShipments, samples: viewSamples, accessories: viewAccessories, imports: viewImports };
    if (V[S.route]) {
      const inView = !!e.target.closest('#view');
      $('#view').innerHTML = V[S.route]();
      const again = $('#view input[data-input="gq"]');
      const top = $('#gq');
      if (top && again) top.value = again.value = S.q;
      if (inView && again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    }
  }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-filter]');
  if (el) { S.f[el.dataset.filter] = el.value; const V = { shipments: viewShipments, samples: viewSamples, accessories: viewAccessories, analytics: viewAnalytics, imports: viewImports }; if (V[S.route]) $('#view').innerHTML = V[S.route](); return; }
  const st = e.target.closest('[data-status-of]');
  if (st) {
    (async () => {
      try {
        const what = st.dataset.statusWhat;
        if (what === 'ship') { await api(`/api/shipments/${st.dataset.statusOf}`, { method: 'PATCH', body: JSON.stringify({ userId: S.user.id, patch: { status: st.value } }) }); toast('Status updated'); await refresh(); openShipModal(st.dataset.statusOf); }
        if (what === 'acc') { await api(`/api/accessories/${st.dataset.statusOf}`, { method: 'PATCH', body: JSON.stringify({ userId: S.user.id, patch: { status: st.value } }) }); toast('Status updated'); await refresh(); openAccModal(st.dataset.statusOf); }
      } catch (err) { toast(err.message, 'err'); }
    })();
  }
});

window.addEventListener('hashchange', () => { const r = location.hash.replace('#/', ''); if (r && r !== S.route) setRoute(r); });

/* ---------------- boot ---------------- */
function boot() {
  (async () => {
    try {
      S.state = await api('/api/state');
      const saved = lsGet('fk-user');
      S.user = S.state.users.find(u => u.id === saved) || null;
      S.user ? renderShell() : renderLogin();
    } catch (err) {
      $('#root').innerHTML = `<div style="padding:60px;text-align:center;color:#75808e">Failed to start FlexKnit Link.<br><br><code>${esc(err.message)}</code></div>`;
    }
  })();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
