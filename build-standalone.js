'use strict';
/* Builds a fully self-contained single-file HTML app (no server, no network).
   Inlines CSS + seed + app + views, and swaps the REST client for a
   localStorage-backed local API. */
const fs = require('fs'), path = require('path');
const R = '/home/user/flexknit-link';

const css = fs.readFileSync(path.join(R, 'public/styles.css'), 'utf8');
const seed = fs.readFileSync(path.join(R, 'server/seed.js'), 'utf8');
let app = fs.readFileSync(path.join(R, 'public/app.js'), 'utf8');
const views = fs.readFileSync(path.join(R, 'public/views.js'), 'utf8');

function patch(src, from, to, label) {
  if (!src.includes(from)) { console.error('PATCH FAILED (not found): ' + label); process.exit(1); }
  return src.replace(from, to);
}

/* ---- 1. seed: drop module.exports ---- */
const seedInline = patch(seed, "module.exports = { build, VERSION: SEED_VERSION };", "var FlexSeed = { build, VERSION: SEED_VERSION };", 'seed exports');

/* ---- 2. app: local API instead of fetch ---- */
const API_BLOCK = `async function api(path, opts = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}`;
const LOCAL_API = `/* ---- local, in-browser API (standalone build: no server needed) ---- */
const LS_KEY = 'fk-standalone-state-v1';
function lsOk() { try { localStorage.setItem('__fk_t', '1'); localStorage.removeItem('__fk_t'); return true; } catch (e) { return false; } }
function loadState() {
  let saved = null;
  if (lsOk()) { try { const raw = localStorage.getItem(LS_KEY); if (raw) saved = JSON.parse(raw); } catch (e) {} }
  if (saved && saved.meta && saved.meta.mode === 'custom' && Array.isArray(saved.users) && saved.users.length) { S.state = saved; return saved; }
  const stale = !saved || !saved.meta || !Array.isArray(saved.users) || !saved.users.length
    || !saved.meta.seededAt || saved.meta.seededAt.slice(0, 10) !== todayISO()
    || +(saved.meta.seedVersion || 0) !== +FlexSeed.VERSION;
  if (!stale) { S.state = saved; return saved; }
  const st = FlexSeed.build();
  if (saved && Array.isArray(saved.users) && saved.users.length) {
    const names = new Set(st.users.map(u => String(u.name).toLowerCase()));
    saved.users.forEach(u => {
      if (u && u.name && !names.has(String(u.name).toLowerCase())) { st.users.push(u); names.add(String(u.name).toLowerCase()); }
    });
  }
  S.state = st; saveState();
  return st;
}
function saveState(st) { if (lsOk()) { try { localStorage.setItem(LS_KEY, JSON.stringify(st || S.state)); } catch (e) {} } }
function logAct(module, refId, action, detail, userId) {
  S.state.activity.unshift({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6), ts: new Date().toISOString(), userId: userId || null, module, refId, action, detail: detail || '' });
  if (S.state.activity.length > 400) S.state.activity = S.state.activity.slice(0, 400);
}
function nextIdLocal(kind, prefix, pad) {
  let max = 0;
  S.state[kind].forEach(x => { const m = /(\\d+)$/.exec(x.id); if (m) max = Math.max(max, +m[1]); });
  return prefix + String(max + 1).padStart(pad || 4, '0');
}
const CSV_MAP = {
  shipments: { head: ['ID','PO','Buyer','Supplier','Commodity','Qty (kg)','Value (USD)','Incoterm','Mode','POL','POD','Via','Carrier','Vessel','Container','ETD','ETA','ATA','Status','Delayed','DelayReason','Progress %','MBL/AWB','Docs ready'],
    row: s => [s.id, s.po, s.buyer, s.supplier.name, s.commodity, s.qtyKg, s.valueUsd, s.incoterm, s.mode, s.pol, s.pod, s.via || '', s.carrier, s.vessel, s.container, s.etd, s.eta, s.ata || '', s.status, s.delayed ? 'YES' : '', s.delayReason || '', s.progress, s.mbl, Object.values(s.docs).filter(Boolean).length + '/6'] },
  samples: { head: ['ID','Style','Name','Buyer','Season','Type','Qty','Requested','Due','Status','Courier','Tracking'],
    row: s => [s.id, s.style, s.styleName, s.buyer, s.season, s.type, s.qty, s.requestDate, s.dueDate, s.status, s.courier || '', s.tracking || ''] },
  accessories: { head: ['ID','Item','Spec','Supplier','PO','Ordered','Received','Unit','Order date','Required date','Status','Linked shipment'],
    row: a => [a.id, a.item, a.spec, a.supplier, a.po, a.ordered, a.received, a.unit, a.orderDate, a.requiredDate, a.status, a.shipmentId || ''] }
};
function downloadCSV(module) {
  const C = CSV_MAP[module]; if (!C) return;
  const esc = v => { v = String(v ?? ''); return /[",\\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const csv = [C.head.map(esc).join(','), ...S.state[module].map(it => C.row(it).map(esc).join(','))].join('\\n');
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'flexknit-' + module + '-' + todayISO() + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    toast('CSV downloaded');
  } catch (e) { toast('Download blocked in this embedded preview — download the HTML file and open it in your browser', 'err'); }
}
async function api(path, opts = {}) {
  await new Promise(r => setTimeout(r, 90)); // tiny latency so spinners/toasts feel real
  const method = opts.method || 'GET';
  const b = opts.body ? JSON.parse(opts.body) : {};
  if (method === 'GET' && path === '/api/state') { if (!S.state) loadState(); return S.state; }
  if (method === 'POST' && path === '/api/reset') {
    const actor = S.state.users.find(u => u.id === b.userId);
    if (!actor || !['superadmin', 'admin', 'logistics'].includes(actor.role)) throw new Error('Not allowed.');
    const keepUsers = S.state.users;
    S.state = FlexSeed.build(); S.state.users = keepUsers; saveState(); return { ok: true, mode: 'demo' };
  }
  if (method === 'POST' && path === '/api/login') {
    const u = S.state.users.find(x => x.id === b.id);
    if (!u || !b.passHash || u.passHash !== b.passHash) throw new Error('Wrong password for this account.');
    return { ok: true, user: u };
  }
  if (method === 'POST' && path === '/api/users') {
    const actor = S.state.users.find(u => u.id === b.userId);
    if (!actor || actor.role !== 'superadmin') throw new Error('Only the Super Admin can add users.');
    const nu = b.user || {};
    if (!nu.name || !nu.role) throw new Error('Name and role are required.');
    if (S.state.users.some(x => x.name.toLowerCase() === String(nu.name).toLowerCase())) throw new Error('A user with this name already exists.');
    const palette = ['#0d9488', '#0284c7', '#d97706', '#7c3aed', '#db2777', '#4f46e5', '#c2410c', '#15803d', '#be185d', '#475569'];
    let mx = 0; S.state.users.forEach(x => { const n = +String(x.id).replace(/\\D/g, '') || 0; if (n > mx) mx = n; });
    const item = { id: 'u' + (mx + 1), name: String(nu.name).slice(0, 60), role: nu.role, title: String(nu.title || '').slice(0, 80), color: palette[Math.floor(Math.random() * palette.length)], passHash: nu.passHash || DEFAULT_HASH };
    S.state.users.push(item);
    logAct('system', item.id, 'User added', item.name + ' — ' + item.role, b.userId);
    saveState(); return { user: item };
  }
  let um = path.match(/^\\/api\\/users\\/([^/]+)\\/pass$/);
  if (um && method === 'POST') {
    const target = S.state.users.find(x => x.id === decodeURIComponent(um[1]));
    if (!target) throw new Error('user not found');
    if (b.userId !== target.id) {
      const actor = S.state.users.find(u => u.id === b.userId);
      if (!actor || actor.role !== 'superadmin') throw new Error('Not allowed.');
    }
    if (!b.passHash || String(b.passHash).length !== 64) throw new Error('Invalid password hash.');
    target.passHash = b.passHash;
    logAct('system', target.id, 'Password changed', 'Password updated for ' + target.name, b.userId);
    saveState(); return { ok: true };
  }
  if (method === 'POST' && path === '/api/clear') {
    const actor = S.state.users.find(u => u.id === b.userId);
    if (!actor || !['superadmin', 'admin'].includes(actor.role)) throw new Error('Only the Super Admin or Management can clear the workspace.');
    S.state.shipments = []; S.state.samples = []; S.state.accessories = []; S.state.activity = [];
    logAct('system', 'workspace', 'Workspace cleared', 'Demo data removed — ready for your own test data.', b.userId);
    S.state.meta.mode = 'custom'; S.state.meta.clearedAt = new Date().toISOString();
    saveState(); return { ok: true, mode: 'custom' };
  }
  if (method === 'POST' && path === '/api/import') {
    const actor = S.state.users.find(u => u.id === b.userId);
    if (!actor || !['superadmin', 'admin'].includes(actor.role)) throw new Error('Only the Super Admin or Management can import data.');
    const st = b.state;
    if (!st || typeof st !== 'object' || !Array.isArray(st.users) || !st.users.length || !Array.isArray(st.shipments) || !Array.isArray(st.samples) || !Array.isArray(st.accessories) || !st.catalog) throw new Error('Invalid backup file.');
    st.meta = st.meta || {}; st.meta.mode = 'custom'; st.meta.importedAt = new Date().toISOString();
    S.state = st; saveState(); return { ok: true, mode: 'custom' };
  }

  let m;
  if (method === 'POST' && path === '/api/shipments') {
    const v = b.data || {};
    if (!v.po || !v.buyer || !v.supplier || !v.commodity || !v.etd || !v.eta) throw new Error('PO, buyer, supplier, commodity, ETD and ETA are required.');
    const item = {
      id: nextIdLocal('shipments', 'SHP-2026-'), po: v.po, buyer: v.buyer,
      supplier: typeof v.supplier === 'string' ? { name: v.supplier, country: 'China', city: '' } : v.supplier,
      commodity: v.commodity, qtyKg: +v.qtyKg || 0, valueUsd: +v.valueUsd || 0, incoterm: v.incoterm || 'FOB', mode: v.mode || 'Sea',
      pol: v.pol || 'CNNGB', pod: v.pod || 'MGTMM', via: v.via || null, carrier: v.carrier || '', vessel: v.vessel || '', container: v.container || 'Pending',
      etd: v.etd, eta: v.eta, ata: null, status: v.status || 'Booked', delayed: false, delayReason: null, delayNote: '', progress: 8,
      mbl: v.mbl || '', docs: { ci: false, pl: false, bl: false, co: false, msds: false, sgs: false },
      etaHistory: [{ eta: v.eta, on: todayISO(), by: b.userId || null, note: 'Initial schedule' }], comments: []
    };
    S.state.shipments.unshift(item);
    logAct('shipment', item.id, 'Shipment created', item.supplier.name + ' → ' + item.pod + ' · ETA ' + item.eta, b.userId);
    saveState(); return { item };
  }
  if ((m = path.match(/^\\/api\\/shipments\\/([^/]+)$/)) && method === 'PATCH') {
    const s = S.state.shipments.find(x => x.id === decodeURIComponent(m[1]));
    if (!s) throw new Error('shipment not found');
    const p = b.patch || {};
    const prevStatus = s.status, prevEta = s.eta;
    if (p.eta && p.eta !== prevEta) {
      (s.etaHistory = s.etaHistory || []).push({ eta: p.eta, on: todayISO(), by: b.userId || null, note: b.note || '' });
      logAct('shipment', s.id, 'ETA updated', 'ETA ' + prevEta + ' → ' + p.eta + (b.note ? ' · ' + b.note : ''), b.userId);
    }
    if (p.delayed === true && !p.delayReason && !s.delayReason) throw new Error('A delay reason code is required to flag a shipment as delayed.');
    if (p.delayed === false) { p.delayReason = null; p.delayNote = ''; }
    if (p.docs) { s.docs = Object.assign({}, s.docs, p.docs); delete p.docs; }
    Object.assign(s, p);
    if (p.status && p.status !== prevStatus) logAct('shipment', s.id, 'Status changed', prevStatus + ' → ' + p.status, b.userId);
    if (p.delayed === true) logAct('shipment', s.id, 'Delay reported', (p.delayReason || s.delayReason || '') + ' · ' + ((p.delayNote || s.delayNote || '').slice(0, 90)), b.userId);
    saveState(); return { item: s };
  }
  if (method === 'POST' && path === '/api/samples') {
    const v = b.data || {};
    if (!v.style || !v.buyer || !v.type || !v.dueDate) throw new Error('Style, buyer, type and due date are required.');
    const item = {
      id: nextIdLocal('samples', 'SMP-26-', 3), style: v.style, styleName: v.styleName || '', buyer: v.buyer,
      season: v.season || 'FW26', type: v.type, qty: v.qty || '1 pc', requestedBy: b.userId || null,
      requestDate: todayISO(), dueDate: v.dueDate, status: 'Requested', courier: null, tracking: null, comments: []
    };
    S.state.samples.unshift(item);
    logAct('sample', item.id, 'Sample requested', item.type + ' · ' + item.buyer + ' · ' + item.style + ' ' + item.styleName, b.userId);
    saveState(); return { item };
  }
  if ((m = path.match(/^\\/api\\/samples\\/([^/]+)$/)) && method === 'PATCH') {
    const s = S.state.samples.find(x => x.id === decodeURIComponent(m[1]));
    if (!s) throw new Error('sample not found');
    const p = b.patch || {}; const prev = s.status;
    Object.assign(s, p);
    if (p.status && p.status !== prev) logAct('sample', s.id, 'Status changed', prev + ' → ' + p.status + (s.courier ? ' (' + s.courier + ' ' + (s.tracking || '') + ')' : ''), b.userId);
    saveState(); return { item: s };
  }
  if (method === 'POST' && path === '/api/accessories') {
    const v = b.data || {};
    if (!v.item || !v.supplier || !v.requiredDate) throw new Error('Item, supplier and required date are required.');
    const item = {
      id: nextIdLocal('accessories', 'ACC-26-', 3), item: v.item, spec: v.spec || '', supplier: v.supplier,
      po: v.po || 'TR-' + Math.floor(88000 + Math.random() * 999), ordered: +v.ordered || 0, received: 0, unit: v.unit || 'pcs',
      orderDate: todayISO(), requiredDate: v.requiredDate, status: v.status || 'Ordered', shipmentId: v.shipmentId || null
    };
    S.state.accessories.unshift(item);
    logAct('accessory', item.id, 'PO created', item.item + ' · ' + item.ordered.toLocaleString() + ' ' + item.unit + ' · ' + item.supplier, b.userId);
    saveState(); return { item };
  }
  if ((m = path.match(/^\\/api\\/accessories\\/([^/]+)$/)) && method === 'PATCH') {
    const a = S.state.accessories.find(x => x.id === decodeURIComponent(m[1]));
    if (!a) throw new Error('accessory not found');
    const p = b.patch || {}; const prev = a.status;
    if (p.received != null) p.received = Math.max(0, Math.min(+p.received, a.ordered));
    Object.assign(a, p);
    if (p.received != null) logAct('accessory', a.id, 'Receipt updated', a.received.toLocaleString() + ' / ' + a.ordered.toLocaleString() + ' ' + a.unit + ' received', b.userId);
    if (p.status && p.status !== prev) logAct('accessory', a.id, 'Status changed', prev + ' → ' + p.status, b.userId);
    saveState(); return { item: a };
  }
  if ((m = path.match(/^\\/api\\/(shipments|samples)\\/([^/]+)\\/comments$/)) && method === 'POST') {
    const list = m[1] === 'shipments' ? S.state.shipments : S.state.samples;
    const item = list.find(x => x.id === decodeURIComponent(m[2]));
    if (!item) throw new Error('not found');
    const text = String(b.text || '').trim();
    if (!text) throw new Error('empty comment');
    (item.comments = item.comments || []).push({ id: 'c' + Date.now(), by: b.userId || null, text: text.slice(0, 800), at: new Date().toISOString() });
    logAct(m[1] === 'shipments' ? 'shipment' : 'sample', item.id, 'Commented', text.slice(0, 120), b.userId);
    saveState(); return { item };
  }
  if (path.startsWith('/api/export')) { downloadCSV(new URLSearchParams(path.split('?')[1] || '').get('module') || 'shipments'); return { ok: true }; }
  throw new Error('Unknown route: ' + path);
}`;
app = patch(app, API_BLOCK, LOCAL_API, 'api block');

app = patch(app,
`async function refresh() {
  S.state = await api('/api/state');
  if (S.user) renderView();
  updateBadges();
}`,
`async function refresh() {
  if (!S.state) S.state = loadState();
  if (S.user) renderView();
  updateBadges();
}`, 'refresh');

app = patch(app,
`'export': () => window.open('/api/export?module=' + el.dataset.module, '_blank'),`,
`'export': () => downloadCSV(el.dataset.module),`, 'export action');

app = patch(app,
`    S.state = await api('/api/state');`,
`    S.state = loadState();`, 'boot');

/* confirm() is blocked in sandboxed preview iframes — drop it in the standalone build */
app = patch(app,
`      if (!confirm('Mark this shipment as Received at factory?')) return;\n`,
``, 'confirm removal');

/* ---- 3. assemble ---- */
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FlexKnit Link — Logistics × Merchandising Control Tower (standalone)</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230d9488'/%3E%3Cpath d='M6 13l5-6 5 6 5-6 5 6M6 21l5-6 5 6 5-6 5 6' fill='none' stroke='white' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<style>
${css}
</style>
</head>
<body>
<div id="root"></div>
<div id="modal-root"></div>
<div id="toasts"></div>
<script>
/* ==================== SEED DATA (generated fresh each day) ==================== */
${seedInline}
</script>
<script>
/* ==================== VIEWS ==================== */
${views}
</script>
<script>
/* ==================== APP ENGINE (boots on DOMContentLoaded) ==================== */
${app}
</script>
</body>
</html>`;

const OUT = '/home/user/FlexKnit-Link-Demo.html';
fs.writeFileSync(OUT, html);
console.log('written', OUT, (html.length / 1024).toFixed(0) + ' KB');
