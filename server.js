'use strict';
/* FlexKnit Link — zero-dependency Node server (static hosting + JSON REST API). */

const http = require('http'), fs = require('fs'), path = require('path');
const PUB = path.join(__dirname, 'public');
const DBP = path.join(__dirname, 'data', 'db.json');
const seed = require('./server/seed');

let db;
function load() {
  try { db = JSON.parse(fs.readFileSync(DBP, 'utf8')); }
  catch (e) { db = seed.build(); persist(); }
}
function persist() {
  fs.mkdirSync(path.dirname(DBP), { recursive: true });
  fs.writeFileSync(DBP, JSON.stringify(db));
}
const today = () => new Date().toISOString().slice(0, 10);

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let c = '';
    req.on('data', ch => { c += ch; if (c.length > 1e6) { reject(new Error('payload too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(c ? JSON.parse(c) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
function userName(id) { const u = db.users.find(v => v.id === id); return u ? u.name : (id || 'System'); }
function validateState(s) {
  if (!s || typeof s !== 'object') return 'Invalid file: not a FlexKnit Link backup.';
  if (!Array.isArray(s.users) || !s.users.length) return 'Invalid backup: users missing.';
  if (!Array.isArray(s.shipments) || !Array.isArray(s.samples) || !Array.isArray(s.accessories)) return 'Invalid backup: shipments/samples/accessories lists missing.';
  if (!s.catalog || typeof s.catalog !== 'object') return 'Invalid backup: catalog missing.';
  if (JSON.stringify(s).length > 4e6) return 'Backup too large (max ~4 MB).';
  return null;
}
function log(module, refId, action, detail, userId) {
  db.activity.unshift({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6), ts: new Date().toISOString(), userId: userId || null, module, refId, action, detail: detail || '' });
  if (db.activity.length > 400) db.activity = db.activity.slice(0, 400);
}
function nextId(kind, prefix, pad) {
  let max = 0;
  db[kind].forEach(x => { const m = /(\d+)$/.exec(x.id); if (m) max = Math.max(max, +m[1]); });
  return prefix + String(max + 1).padStart(pad || 4, '0');
}
const S = db => db.shipments, P = db => db.samples, A = db => db.accessories; // readability aliases (unused if stripped)

/* ---------- module handlers ---------- */
function patchShipment(req, res, id) {
  return body(req).then(({ userId, patch, note }) => {
    const s = db.shipments.find(x => x.id === id);
    if (!s) return json(res, 404, { error: 'shipment not found' });
    const p = patch || {};
    const prevStatus = s.status, prevEta = s.eta;

    if (p.eta && p.eta !== prevEta) {
      s.etaHistory = s.etaHistory || [];
      s.etaHistory.push({ eta: p.eta, on: today(), by: userId || null, note: note || '' });
      log('shipment', id, 'ETA updated', `ETA ${prevEta} → ${p.eta}${note ? ' · ' + note : ''}`, userId);
    }
    if (p.delayed === true && !p.delayReason && !s.delayReason)
      return json(res, 400, { error: 'A delay reason code is required to flag a shipment as delayed.' });
    if (p.delayed === false) { p.delayReason = null; p.delayNote = ''; }
    if (p.docs) { s.docs = Object.assign({}, s.docs, p.docs); delete p.docs; }

    Object.assign(s, p);
    if (p.status && p.status !== prevStatus) log('shipment', id, 'Status changed', `${prevStatus} → ${p.status}`, userId);
    if (p.delayed === true) log('shipment', id, 'Delay reported', `${p.delayReason || s.delayReason} · ${(p.delayNote || s.delayNote || '').slice(0, 90)}`, userId);
    if (p.delayed === false && prevStatus !== s.status) { /* already logged above if status moved */ }
    persist();
    json(res, 200, { item: s });
  }).catch(e => json(res, 400, { error: String(e.message || e) }));
}
function patchSample(req, res, id) {
  return body(req).then(({ userId, patch }) => {
    const s = db.samples.find(x => x.id === id);
    if (!s) return json(res, 404, { error: 'sample not found' });
    const p = patch || {}; const prev = s.status;
    Object.assign(s, p);
    if (p.status && p.status !== prev) log('sample', id, 'Status changed', `${prev} → ${p.status}${s.courier ? ' (' + s.courier + ' ' + (s.tracking || '') + ')' : ''}`, userId);
    persist(); json(res, 200, { item: s });
  }).catch(e => json(res, 400, { error: String(e.message || e) }));
}
function patchAccessory(req, res, id) {
  return body(req).then(({ userId, patch }) => {
    const a = db.accessories.find(x => x.id === id);
    if (!a) return json(res, 404, { error: 'accessory not found' });
    const p = patch || {}; const prev = a.status;
    if (p.received != null) { p.received = Math.max(0, Math.min(+p.received, a.ordered)); }
    Object.assign(a, p);
    if (p.received != null) log('accessory', id, 'Receipt updated', `${a.received.toLocaleString()} / ${a.ordered.toLocaleString()} ${a.unit} received`, userId);
    if (p.status && p.status !== prev) log('accessory', id, 'Status changed', `${prev} → ${p.status}`, userId);
    persist(); json(res, 200, { item: a });
  }).catch(e => json(res, 400, { error: String(e.message || e) }));
}
function addComment(req, res, module, id) {
  return body(req).then(({ userId, text }) => {
    const list = module === 'shipment' ? db.shipments : db.samples;
    const item = list.find(x => x.id === id);
    if (!item) return json(res, 404, { error: 'not found' });
    if (!text || !String(text).trim()) return json(res, 400, { error: 'empty comment' });
    item.comments = item.comments || [];
    item.comments.push({ id: 'c' + Date.now(), by: userId || null, text: String(text).trim().slice(0, 800), at: new Date().toISOString() });
    log(module, id, 'Commented', String(text).trim().slice(0, 120), userId);
    persist(); json(res, 200, { item });
  }).catch(e => json(res, 400, { error: String(e.message || e) }));
}

const CSV = {
  shipments: () => ({
    head: ['ID', 'PO', 'Buyer', 'Supplier', 'Commodity', 'Qty (kg)', 'Value (USD)', 'Incoterm', 'Mode', 'POL', 'POD', 'Via', 'Carrier', 'Vessel', 'Container', 'ETD', 'ETA', 'ATA', 'Status', 'Delayed', 'DelayReason', 'Progress %', 'MBL/AWB', 'Docs ready'],
    row: s => [s.id, s.po, s.buyer, s.supplier.name, s.commodity, s.qtyKg, s.valueUsd, s.incoterm, s.mode, s.pol, s.pod, s.via || '', s.carrier, s.vessel, s.container, s.etd, s.eta, s.ata || '', s.status, s.delayed ? 'YES' : '', s.delayReason || '', s.progress, s.mbl, Object.values(s.docs).filter(Boolean).length + '/6']
  }),
  samples: () => ({
    head: ['ID', 'Style', 'Name', 'Buyer', 'Season', 'Type', 'Qty', 'Requested', 'Due', 'Status', 'Courier', 'Tracking'],
    row: s => [s.id, s.style, s.styleName, s.buyer, s.season, s.type, s.qty, s.requestDate, s.dueDate, s.status, s.courier || '', s.tracking || '']
  }),
  accessories: () => ({
    head: ['ID', 'Item', 'Spec', 'Supplier', 'PO', 'Ordered', 'Received', 'Unit', 'Order date', 'Required date', 'Status', 'Linked shipment'],
    row: a => [a.id, a.item, a.spec, a.supplier, a.po, a.ordered, a.received, a.unit, a.orderDate, a.requiredDate, a.status, a.shipmentId || '']
  })
};

/* ---------- router ---------- */
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;

  try {
    if (p.startsWith('/api/')) {
      /* ---- state ---- */
      if (req.method === 'GET' && p === '/api/state') return json(res, 200, db);

      const actorCan = (userId, roles) => { const u = db.users.find(x => x.id === userId); return u && roles.includes(u.role); };

      if (req.method === 'POST' && p === '/api/reset') {
        return body(req).then(({ userId }) => {
          if (!actorCan(userId, ['superadmin', 'admin', 'logistics'])) return json(res, 403, { error: 'Not allowed.' });
          db = seed.build(); db.meta.mode = 'demo'; persist();
          return json(res, 200, { ok: true, mode: 'demo' });
        }).catch(e => json(res, 400, { error: String(e.message || e) }));
      }

      /* ---- auth ---- */
      if (req.method === 'POST' && p === '/api/login') {
        return body(req).then(({ id, passHash }) => {
          const u = db.users.find(x => x.id === id);
          if (!u || !passHash || u.passHash !== passHash) return json(res, 401, { error: 'Wrong password for this account.' });
          json(res, 200, { ok: true, user: u });
        }).catch(e => json(res, 400, { error: String(e.message || e) }));
      }

      /* ---- user management (Super Admin) ---- */
      if (req.method === 'POST' && p === '/api/users') {
        return body(req).then(({ userId, user: nu }) => {
          if (!actorCan(userId, ['superadmin'])) return json(res, 403, { error: 'Only the Super Admin can add users.' });
          if (!nu || !nu.name || !nu.role) return json(res, 400, { error: 'Name and role are required.' });
          if (db.users.some(x => x.name.toLowerCase() === String(nu.name).toLowerCase())) return json(res, 400, { error: 'A user with this name already exists.' });
          const palette = ['#0d9488', '#0284c7', '#d97706', '#7c3aed', '#db2777', '#4f46e5', '#c2410c', '#15803d', '#be185d', '#475569'];
          const item = {
            id: 'u' + (Math.max(0, ...db.users.map(x => +String(x.id).replace(/\D/g, '') || 0)) + 1),
            name: String(nu.name).slice(0, 60), role: nu.role, title: String(nu.title || '').slice(0, 80),
            color: palette[Math.floor(Math.random() * palette.length)],
            passHash: nu.passHash || '11d3bf68eeac637c516d4f7eda95442f327ec53d316fedad315877f8b0e57c04'
          };
          db.users.push(item);
          log('system', item.id, 'User added', `${item.name} — ${item.role}`, userId);
          persist(); return json(res, 200, { user: item });
        }).catch(e => json(res, 400, { error: String(e.message || e) }));
      }
      const um = p.match(/^\/api\/users\/([^/]+)\/pass$/);
      if (um && req.method === 'POST') {
        return body(req).then(({ userId, passHash }) => {
          const target = db.users.find(x => x.id === decodeURIComponent(um[1]));
          if (!target) return json(res, 404, { error: 'user not found' });
          if (userId !== target.id && !actorCan(userId, ['superadmin'])) return json(res, 403, { error: 'Not allowed.' });
          if (!passHash || String(passHash).length !== 64) return json(res, 400, { error: 'Invalid password hash.' });
          target.passHash = passHash;
          log('system', target.id, 'Password changed', `Password updated for ${target.name}`, userId);
          persist(); return json(res, 200, { ok: true });
        }).catch(e => json(res, 400, { error: String(e.message || e) }));
      }

      /* ---- data: clear to own workspace / import ---- */
      if (req.method === 'POST' && p === '/api/clear') {
        return body(req).then(({ userId }) => {
          if (!actorCan(userId, ['superadmin', 'admin'])) return json(res, 403, { error: 'Only the Super Admin or Management can clear the workspace.' });
          db.shipments = []; db.samples = []; db.accessories = []; db.activity = [];
          log('system', 'workspace', 'Workspace cleared', 'Demo data removed — ready for your own test data.', userId);
          db.meta.mode = 'custom'; db.meta.clearedAt = new Date().toISOString();
          persist(); return json(res, 200, { ok: true, mode: 'custom' });
        }).catch(e => json(res, 400, { error: String(e.message || e) }));
      }
      if (req.method === 'POST' && p === '/api/import') {
        return body(req).then(({ userId, state }) => {
          if (!actorCan(userId, ['superadmin', 'admin'])) return json(res, 403, { error: 'Only the Super Admin or Management can import data.' });
          const err = validateState(state);
          if (err) return json(res, 400, { error: err });
          state.meta = state.meta || {};
          state.meta.mode = 'custom';
          state.meta.importedAt = new Date().toISOString();
          db = state; persist(); return json(res, 200, { ok: true, mode: 'custom' });
        }).catch(e => json(res, 400, { error: String(e.message || e) }));
      }

      /* ---- shipments ---- */
      let m;
      if (req.method === 'POST' && p === '/api/shipments') {
        const { userId, data } = await body(req);
        const v = data || {};
        if (!v.po || !v.buyer || !v.supplier || !v.commodity || !v.etd || !v.eta)
          return json(res, 400, { error: 'PO, buyer, supplier, commodity, ETD and ETA are required.' });
        const item = {
          id: nextId('shipments', 'SHP-2026-'), po: v.po, buyer: v.buyer,
          supplier: typeof v.supplier === 'string' ? { name: v.supplier, country: 'China', city: '' } : v.supplier,
          commodity: v.commodity, qtyKg: +v.qtyKg || 0, valueUsd: +v.valueUsd || 0, incoterm: v.incoterm || 'FOB', mode: v.mode || 'Sea',
          pol: v.pol || 'CNNGB', pod: v.pod || 'MGTMM', via: v.via || null, carrier: v.carrier || '', vessel: v.vessel || '', container: v.container || 'Pending',
          etd: v.etd, eta: v.eta, ata: null, status: v.status || 'Booked', delayed: false, delayReason: null, delayNote: '', progress: 8,
          mbl: v.mbl || '', docs: { ci: false, pl: false, bl: false, co: false, msds: false, sgs: false },
          etaHistory: [{ eta: v.eta, on: today(), by: userId || null, note: 'Initial schedule' }], comments: []
        };
        db.shipments.unshift(item);
        log('shipment', item.id, 'Shipment created', `${item.supplier.name} → ${item.pod} · ETA ${item.eta}`, userId);
        persist(); return json(res, 200, { item });
      }
      if (p.match(/^\/api\/shipments\/[^/]+$/) && req.method === 'PATCH') return patchShipment(req, res, decodeURIComponent(p.split('/')[3]));

      /* ---- samples ---- */
      if (req.method === 'POST' && p === '/api/samples') {
        const { userId, data } = await body(req);
        const v = data || {};
        if (!v.style || !v.buyer || !v.type || !v.dueDate)
          return json(res, 400, { error: 'Style, buyer, type and due date are required.' });
        const item = {
          id: nextId('samples', 'SMP-26-', 3), style: v.style, styleName: v.styleName || '', buyer: v.buyer,
          season: v.season || 'FW26', type: v.type, qty: v.qty || '1 pc', requestedBy: userId || null,
          requestDate: today(), dueDate: v.dueDate, status: 'Requested', courier: null, tracking: null, comments: []
        };
        db.samples.unshift(item);
        log('sample', item.id, 'Sample requested', `${item.type} · ${item.buyer} · ${item.style} ${item.styleName}`, userId);
        persist(); return json(res, 200, { item });
      }
      if (p.match(/^\/api\/samples\/[^/]+$/) && req.method === 'PATCH') return patchSample(req, res, decodeURIComponent(p.split('/')[3]));

      /* ---- accessories ---- */
      if (req.method === 'POST' && p === '/api/accessories') {
        const { userId, data } = await body(req);
        const v = data || {};
        if (!v.item || !v.supplier || !v.requiredDate)
          return json(res, 400, { error: 'Item, supplier and required date are required.' });
        const item = {
          id: nextId('accessories', 'ACC-26-', 3), item: v.item, spec: v.spec || '', supplier: v.supplier,
          po: v.po || 'TR-' + Math.floor(88000 + Math.random() * 999), ordered: +v.ordered || 0, received: 0, unit: v.unit || 'pcs',
          orderDate: today(), requiredDate: v.requiredDate, status: v.status || 'Ordered', shipmentId: v.shipmentId || null
        };
        db.accessories.unshift(item);
        log('accessory', item.id, 'PO created', `${item.item} · ${item.ordered.toLocaleString()} ${item.unit} · ${item.supplier}`, userId);
        persist(); return json(res, 200, { item });
      }
      if (p.match(/^\/api\/accessories\/[^/]+$/) && req.method === 'PATCH') return patchAccessory(req, res, decodeURIComponent(p.split('/')[3]));

      /* ---- comments (unified) ---- */
      if (p.match(/^\/api\/(shipments|samples)\/[^/]+\/comments$/) && req.method === 'POST') {
        const parts = p.split('/');
        const mod = parts[2] === 'shipments' ? 'shipment' : 'sample';
        return addComment(req, res, mod, decodeURIComponent(parts[3]));
      }

      /* ---- export ---- */
      if (p === '/api/export' && req.method === 'GET') {
        const mod = u.searchParams.get('module') || 'shipments';
        if (mod === 'json') {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="flexknit-backup-${today()}.json"`,
            'Cache-Control': 'no-store'
          });
          return res.end(JSON.stringify(db, null, 2));
        }
        const gen = CSV[mod]; if (!gen) return json(res, 400, { error: 'unknown module' });
        const { head, row } = gen();
        const esc = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
        const data = db[mod].map(row).map(r => r.map(esc).join(','));
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="flexknit-${mod}-${today()}.csv"`,
          'Cache-Control': 'no-store'
        });
        return res.end([head.map(esc).join(','), ...data].join('\n'));
      }

      return json(res, 404, { error: 'unknown API route' });
    }

    /* ---------- static ---------- */
    let fp = path.normalize(path.join(PUB, p === '/' ? 'index.html' : p));
    if (!fp.startsWith(PUB)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(PUB, 'index.html');
    const ext = path.extname(fp).slice(1);
    const mime = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'application/javascript', svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon', json: 'application/json' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
  } catch (e) {
    json(res, 500, { error: String((e && e.message) || e) });
  }
});

load();
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`FlexKnit Link running on http://0.0.0.0:${PORT}`));
