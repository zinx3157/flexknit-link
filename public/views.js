'use strict';
/* ============================================================
   FlexKnit Link — views & modals
   ============================================================ */

/* ============================ LOGIN ============================ */
function viewLogin() {
  const groups = [
    { key: 'superadmin', label: 'Super Admin', color: '#c2410c' },
    { key: 'logistics', label: 'Logistics & Import desk', color: '#0d9488' },
    { key: 'merchandising', label: 'Merchandising', color: '#7c3aed' },
    { key: 'admin', label: 'Management', color: '#475569' }
  ];
  return `
  <div class="login">
    <div class="login-brand">
      <div class="login-logo">
        <span class="logo-mark">${icon('knit', 24)}</span>
        <div><div style="font-weight:800;font-size:16px;letter-spacing:.02em">FLEXKNIT <span style="color:#2dd4bf">LINK</span></div>
        <div style="font-size:11px;color:#6d829c">Factories · Antananarivo</div></div>
      </div>
      <h1>One control tower for <em>logistics</em> &amp; <em>merchandising</em>.</h1>
      <p class="sub">Share live data on yarn imports, samples, accessories and ETAs — with delay reasons every merchandiser can act on. Built the way the world's top knitwear mills run their supply chain: Consinee, ERDOS, Newtimes, Xinao, Crystal.</p>
      <div class="login-feats">
        <div class="login-feat"><span class="ic">${icon('ship', 16)}</span><span><b>Import tracking</b> — Ningbo / Shanghai / Qingdao → Toamasina, docs checklist, ETA change history.</span></div>
        <div class="login-feat"><span class="ic">${icon('shirt', 16)}</span><span><b>Sample pipeline</b> — Proto, Fit, PP, TOP, size sets with courier tracking &amp; approvals.</span></div>
        <div class="login-feat"><span class="ic">${icon('tag', 16)}</span><span><b>Trims coverage</b> — buttons, zips, labels and hangtags against the line-loading plan.</span></div>
        <div class="login-feat"><span class="ic">${icon('bar', 16)}</span><span><b>Delay analytics</b> — coded reasons (customs holds, transshipment congestion, weather…) with on-time trends.</span></div>
      </div>
      <div class="login-foot">© ${new Date().getFullYear()} FlexKnit Factories SARL — internal ops platform · demo workspace</div>
    </div>
    <div class="login-panel"><div class="login-box">
      <h2>Sign in to your workspace</h2>
      <p class="hint">Demo mode — pick a user to explore the platform with their permissions.</p>
      ${groups.map(g => `
        <div class="team-head"><span class="dot" style="background:${g.color}"></span>${g.label}</div>
        ${S.state.users.filter(u => u.role === g.key).map(u => `
          <button class="user-pick" data-action="login" data-id="${u.id}">
            ${avatar(u)}
            <span><span class="up-name">${esc(u.name)}</span><br><span class="up-title">${esc(u.title)}</span></span>
            <span class="up-go">${icon('arrow', 16)}</span>
          </button>`).join('')}
      `).join('')}
      <div class="login-note"><b>Roles:</b> the Super Admin sees and does everything. Logistics updates ETAs, logs delays, ticks documents and books couriers. Merchandising comments, raises sample requests and tracks anything affecting the production plan.</div>
    </div></div>
  </div>`;
}

/* ============================ SHARED BITS ============================ */
function routeViz(s) {
  const modeIc = s.mode === 'Air' ? icon('plane', 15) : icon('anchor', 15);
  return `<div class="routeviz">
    <div class="rv-node"><div class="rv-code">${esc(s.pol)}</div><div class="rv-name">${esc(polName(s.pol))}</div></div>
    <div class="rv-line">${modeIc}</div>
    ${s.via ? `<span class="rv-via">via ${esc(s.via)} · ${esc(viaName(s.via))}</span><div class="rv-line"></div>` : ''}
    <div class="rv-node"><div class="rv-code">${esc(s.pod)}</div><div class="rv-name">${esc(podName(s.pod))}</div></div>
    <span class="rv-via" style="border-style:solid;background:var(--accent-soft);border-color:#bfe3df;color:var(--accent-ink)">${icon('truck', 12)}&nbsp; Factory · Antananarivo</span>
  </div>`;
}
function shipmentFiltersHtml() {
  const c = catalog(), f = S.f;
  const opt = (v, l, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(l)}</option>`;
  return `
    <label class="tsearch">${icon('search', 14)}<input placeholder="Search shipment, PO, supplier…" value="${esc(S.q)}" data-input="gq"></label>
    <select class="tsel" data-filter="shipStatus">${opt('All', 'All statuses', !f.shipStatus || f.shipStatus === 'All')}${c.shipmentStatuses.map(s => opt(s, s, f.shipStatus === s)).join('')}</select>
    <select class="tsel" data-filter="buyer">${opt('All', 'All buyers', !f.buyer || f.buyer === 'All')}${c.buyers.map(b => opt(b, b, f.buyer === b)).join('')}</select>
    <select class="tsel" data-filter="mode">${opt('All', 'Sea + Air', !f.mode || f.mode === 'All')}${opt('Sea', 'Sea', f.mode === 'Sea')}${opt('Air', 'Air', f.mode === 'Air')}</select>
    <select class="tsel" data-filter="flag">${opt('all', 'All shipments', !f.flag || f.flag === 'all')}${opt('delayed', 'Delayed only', f.flag === 'delayed')}${opt('watch', 'ETA ≤ 7 days', f.flag === 'watch')}</select>`;
}
function filterShipments(list) {
  const f = S.f, T = todayISO();
  return list.filter(s =>
    (!f.shipStatus || f.shipStatus === 'All' || s.status === f.shipStatus) &&
    (!f.buyer || f.buyer === 'All' || s.buyer === f.buyer) &&
    (!f.mode || f.mode === 'All' || s.mode === f.mode) &&
    (!f.flag || f.flag === 'all' || (f.flag === 'delayed' ? s.delayed : (!s.delayed && s.status !== 'Received' && diffDays(s.eta, T) <= 7))) &&
    (!S.q || [s.id, s.po, s.buyer, s.supplier.name, s.commodity, s.carrier, s.vessel, s.container, s.mbl].join(' ').toLowerCase().includes(S.q))
  );
}
function shipmentRow(s) {
  const dr = docsReady(s);
  return `<tr class="click" data-action="open-ship" data-id="${s.id}">
    <td><div class="td-main mono">${s.id}</div><div class="td-sub">${esc(s.po)} · ${esc(s.buyer)}</div></td>
    <td><div class="td-main">${esc(s.supplier.name)}</div><div class="td-sub">${esc(s.commodity)}</div></td>
    <td><span class="route">${esc(s.pol)} <span class="sep">${s.mode === 'Air' ? icon('plane', 12) : icon('anchor', 12)}›</span> ${esc(s.pod)}</span></td>
    <td><div>${esc(s.carrier)}</div><div class="td-sub">${esc(s.vessel || '—')}</div></td>
    <td class="mono">${fmtDate(s.etd)}</td>
    <td><div class="mono" style="font-weight:700">${fmtDate(s.eta)}</div><div style="margin-top:3px">${etaChipHtml(s)}</div></td>
    <td class="mono">${s.ata ? fmtDate(s.ata) : '—'}</td>
    <td>${stChip(s)}</td>
    <td>${s.delayed ? chip(delayLabel(s.delayReason).split(' · ')[1] || 'Delayed', 'red', ' chip-pulse') : '<span class="text-mut">—</span>'}</td>
    <td><div class="prog ${s.delayed ? 'warn' : ''}"><i style="width:${s.progress}%"></i></div><div class="td-sub num" style="text-align:left">${s.progress}%</div></td>
    <td>${donut(Math.round(dr / 6 * 100), dr === 6 ? '#16a34a' : dr >= 3 ? '#d97706' : '#dc2626', 34, 4.5)}<span>${dr}/6</span></td>
  </tr>`;
}

/* ============================ DASHBOARD ============================ */
function viewDashboard() {
  const T = todayISO();
  const sh = S.state.shipments, sp = S.state.samples, ac = S.state.accessories;
  const active = sh.filter(s => s.status !== 'Received');
  const delayed = active.filter(s => s.delayed);
  const received = sh.filter(s => s.status === 'Received' && s.ata);
  const onTimePct = received.length ? Math.round(received.filter(s => diffDays(s.ata, s.eta) <= 0).length / received.length * 100) : 100;
  const inCbm = active.filter(s => s.mode === 'Sea').length;
  const samplesOpen = sp.filter(s => !['Approved'].includes(s.status)).length;
  const samplesOverdue = sp.filter(s => diffDays(s.dueDate, T) < 0 && s.status !== 'Approved').length;
  const valueMoving = active.reduce((a, s) => a + s.valueUsd, 0);

  // ETA groups
  const upcoming = active.filter(s => diffDays(s.eta, T) >= -2).sort((a, b) => a.eta.localeCompare(b.eta));
  const weeks = [
    { label: 'This week', lo: -2, hi: 6 }, { label: 'Next week', lo: 7, hi: 13 }, { label: 'Week after', lo: 14, hi: 21 }, { label: 'Later', lo: 22, hi: 999 }
  ].map(w => ({ ...w, items: upcoming.filter(s => { const dd = diffDays(s.eta, T); return dd >= w.lo && dd <= w.hi; }) })).filter(w => w.items.length);

  // watchlist = nearest ETA
  const watch = upcoming.slice(0, 6);

  // needs action
  const needs = [];
  delayed.forEach(s => needs.push({ tone: 'red', ic: 'alert', t: `${s.id} — ${delayLabel(s.delayReason)}`, s: `${s.supplier.name} → ${podName(s.pod)} · ETA ${fmtDate(s.eta)}`, btn: 'Open', act: 'open-ship', id: s.id }));
  sp.filter(s => diffDays(s.dueDate, T) < 0 && s.status !== 'Approved').forEach(s => needs.push({ tone: 'red', ic: 'shirt', t: `${s.id} sample overdue (${s.style} ${s.styleName})`, s: `${s.buyer} · ${s.type} · due ${fmtDate(s.dueDate)}`, btn: 'Open', act: 'open-sample', id: s.id }));
  ac.filter(a => a.status === 'Shortage').forEach(a => needs.push({ tone: 'red', ic: 'tag', t: `${a.id} shortage — ${num(a.ordered - a.received)} ${a.unit} missing`, s: `${a.item} · required ${fmtDate(a.requiredDate)}`, btn: 'Open', act: 'open-acc', id: a.id }));
  active.filter(s => diffDays(s.eta, T) <= 7 && docsReady(s) < 6).forEach(s => needs.push({ tone: 'amber', ic: 'doc', t: `${s.id} — docs ${docsReady(s)}/6 before arrival`, s: `${s.buyer} · ETA ${fmtDate(s.eta)}`, btn: 'Docs', act: 'open-ship', id: s.id }));
  ac.filter(a => a.received < a.ordered && a.status !== 'Shortage' && diffDays(a.requiredDate, T) <= 7 && diffDays(a.requiredDate, T) >= 0).forEach(a => needs.push({ tone: 'amber', ic: 'tag', t: `${a.id} needed in ${diffDays(a.requiredDate, T)}d — ${a.status}`, s: `${a.item} · ${num(a.ordered - a.received)} ${a.unit} outstanding`, btn: 'Open', act: 'open-acc', id: a.id }));

  // delay pareto mini
  const rc = {};
  sh.filter(s => s.delayReason).forEach(s => { rc[s.delayReason] = (rc[s.delayReason] || 0) + 1; });
  const pareto = Object.entries(rc).map(([code, n]) => ({ label: delayLabel(code), value: n })).sort((a, b) => b.value - a.value).slice(0, 5);

  const feed = S.state.activity.slice(0, 8);

  return `
  <div class="kpis">
    <div class="kpi" style="--kc:#0d9488"><span class="k-label">Shipments in motion</span>
      <div class="k-row"><span class="k-num">${active.length}</span>${chip(`${inCbm} sea · ${active.length - inCbm} air`, 'teal')}</div>
      <span class="k-sub">${money(valueMoving)} of yarn &amp; trims inbound</span>
      <span class="k-spark">${spark([4, 6, 5, 8, 7, 9, active.length])}</span></div>
    <div class="kpi" style="--kc:#15803d"><span class="k-label">On-time arrival</span>
      <div class="k-row"><span class="k-num">${onTimePct}%</span>${chip(`${received.length} deliveries YTD`, 'green')}</div>
      <span class="k-sub">ATA vs promised ETA, last 6 months</span>
      <span class="k-spark">${spark([62, 70, 66, 78, 74, onTimePct], 92, 34, '#16a34a')}</span></div>
    <div class="kpi" style="--kc:#dc2626"><span class="k-label">Delayed now</span>
      <div class="k-row"><span class="k-num">${delayed.length}</span>${delayed.length ? chip(`avg ${Math.max(...delayed.map(delayDays))}d slip`, 'red', ' chip-pulse') : chip('none', 'green')}</div>
      <span class="k-sub">Top cause: ${pareto[0] ? esc(pareto[0].label) : '—'}</span>
      <span class="k-spark">${spark([1, 3, 2, 4, 3, delayed.length], 92, 34, '#dc2626')}</span></div>
    <div class="kpi" style="--kc:#7c3aed"><span class="k-label">Samples in play</span>
      <div class="k-row"><span class="k-num">${samplesOpen}</span>${samplesOverdue ? chip(`${samplesOverdue} overdue`, 'red') : chip('all on time', 'green')}</div>
      <span class="k-sub">${ac.filter(a => a.status === 'Shortage').length} trims shortage${ac.filter(a => a.status === 'Shortage').length === 1 ? '' : 's'} flagged</span>
      <span class="k-spark">${spark([8, 6, 9, 7, 8, samplesOpen], 92, 34, '#7c3aed')}</span></div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>ETA timeline</h3><span class="sub">next arrivals at Toamasina &amp; Ivato — click a card for detail</span>
      <div class="right"><button class="btn btn-ghost btn-sm" data-action="nav" data-nav="shipments">All shipments ${icon('arrow', 13)}</button></div></div>
    <div class="card-b">
      ${weeks.length ? `<div class="eta-strip">${weeks.map(w => `
        <div class="eta-week"><h4><span class="wnum">${w.items.length}</span>${w.label}</h4>
          <div class="eta-chips">${w.items.slice(0, 5).map(s => `
            <button class="eta-chip" data-action="open-ship" data-id="${s.id}">
              <div><div class="ec-id">${s.id}</div><div class="ec-sub">${esc(s.supplier.name)} · ${esc(s.buyer)}</div></div>
              <div class="ec-right">${s.mode === 'Air' ? icon('plane', 14) : icon('anchor', 14)}<div class="days-chip" style="color:${s.delayed ? 'var(--red)' : 'var(--accent-ink)'}">${fmtDate(s.eta)}</div></div>
            </button>`).join('')}
            ${w.items.length > 5 ? `<div class="td-sub" style="padding:2px 4px">+${w.items.length - 5} more…</div>` : ''}
          </div></div>`).join('')}</div>`
      : '<div class="empty">No upcoming ETAs in the window.</div>'}
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-h"><h3>Arrival watchlist</h3><span class="sub">nearest ETAs · docs readiness</span></div>
      <div class="tablewrap"><table>
        <thead><tr><th>Shipment</th><th>Route</th><th>ETA</th><th>Status</th><th>Docs</th><th>Progress</th></tr></thead>
        <tbody>${watch.map(s => `<tr class="click" data-action="open-ship" data-id="${s.id}">
          <td><div class="td-main mono">${s.id}</div><div class="td-sub">${esc(s.buyer)} · ${esc(s.carrier)}</div></td>
          <td><span class="route">${esc(s.pol)} › ${esc(s.pod)}</span></td>
          <td><div class="mono" style="font-weight:700">${fmtDate(s.eta)}</div><div style="margin-top:3px">${etaChipHtml(s)}</div></td>
          <td>${stChip(s)}</td>
          <td style="min-width:52px"><span style="position:relative">${donut(Math.round(docsReady(s) / 6 * 100), docsReady(s) === 6 ? '#16a34a' : '#d97706', 34, 4.5)}<span>${docsReady(s)}/6</span></span></td>
          <td><div class="prog ${s.delayed ? 'warn' : ''}"><i style="width:${s.progress}%"></i></div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>
    <div class="card">
      <div class="card-h"><h3>Needs action</h3><span class="sub">${needs.length} open item${needs.length === 1 ? '' : 's'}</span></div>
      <div class="act-list">
        ${needs.length ? needs.slice(0, 7).map(n => `
          <div class="act-it">
            <span class="ai-ic ai-${n.tone}">${icon(n.ic, 15)}</span>
            <span style="min-width:0"><span class="ai-t">${esc(n.t)}</span><br><span class="ai-s">${esc(n.s)}</span></span>
            <button class="btn btn-ghost btn-sm ai-btn" data-action="${n.act}" data-id="${n.id}">${n.btn}</button>
          </div>`).join('') : '<div class="empty">All clear — nothing needs action today. 🎉</div>'}
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Imports by buyer</h3><span class="sub">what's inbound for each account — yarn + trims, next arrival first</span>
      <div class="right"><button class="btn btn-ghost btn-sm" data-action="nav" data-nav="imports">Full import timeline ${icon('arrow', 13)}</button></div></div>
    <div class="card-b" style="display:flex;flex-wrap:wrap;gap:10px">
      ${(() => {
        const buyers = {};
        active.forEach(s => {
          const b = buyers[s.buyer] = buyers[s.buyer] || { yarn: 0, trims: 0, next: null, issues: 0 };
          b.yarn++; if (s.delayed) b.issues++;
          if (!b.next || s.eta < b.next) b.next = s.eta;
        });
        S.state.accessories.forEach(a => {
          if (a.received >= a.ordered) return;
          const link = a.shipmentId ? S.state.shipments.find(x => x.id === a.shipmentId) : null;
          if (!link) return;
          const b = buyers[link.buyer] = buyers[link.buyer] || { yarn: 0, trims: 0, next: null, issues: 0 };
          b.trims++; if (a.status === 'Shortage' || diffDays(a.requiredDate, T) < 0) b.issues++;
          if (!b.next || a.requiredDate < b.next) b.next = a.requiredDate;
        });
        const entries = Object.entries(buyers).sort((x, y) => (x[1].next || '').localeCompare(y[1].next || ''));
        return entries.length ? entries.map(([name, b]) => `
          <button class="eta-chip" style="min-width:215px" data-action="buyer-filter" data-buyer="${esc(name)}" title="Show import timeline for ${esc(name)}">
            <div><div class="ec-id" style="font-family:inherit;font-size:13.5px">${esc(name)}</div>
            <div class="ec-sub">${b.yarn} yarn · ${b.trims} trims inbound</div></div>
            <div class="ec-right">
              ${b.issues ? chip(b.issues + ' issue' + (b.issues > 1 ? 's' : ''), 'red') : chip('clear', 'green')}
              <div class="td-sub" style="margin-top:3px">next ${fmtDate(b.next)}</div>
            </div>
          </button>`).join('') : '<div class="empty">No inbound imports.</div>';
      })()}
    </div>
  </div>

  <div class="grid-2e">
    <div class="card">
      <div class="card-h"><h3>Top delay reasons</h3><span class="sub">all shipments, coded</span>
        <div class="right"><button class="btn btn-ghost btn-sm" data-action="nav" data-nav="analytics">Analytics ${icon('arrow', 13)}</button></div></div>
      <div class="card-b">
        ${pareto.length ? hbars(pareto.map(p => ({ ...p, suffix: p.value + '×' })), () => 'linear-gradient(90deg,#f59e0b,#dc2626)') : '<div class="empty">No delays recorded.</div>'}
      </div>
    </div>
    <div class="card">
      <div class="card-h"><h3>Latest activity</h3><span class="sub">logistics × merchandising</span>
        <div class="right"><button class="btn btn-ghost btn-sm" data-action="nav" data-nav="activity">Full feed ${icon('arrow', 13)}</button></div></div>
      <div class="act-list">${feedHtml(feed, true)}</div>
    </div>
  </div>`;
}

/* ============================ SHIPMENTS ============================ */
function viewShipments() {
  let list = filterShipments(S.state.shipments);
  const sortKey = S.f.sort || 'eta';
  list = [...list].sort((a, b) => sortKey === 'eta' ? a.eta.localeCompare(b.eta) : sortKey === 'value' ? b.valueUsd - a.valueUsd : a.id.localeCompare(b.id));
  const totalVal = list.reduce((a, s) => a + s.valueUsd, 0);
  return `
  <div class="toolbar">
    ${shipmentFiltersHtml()}
    <select class="tsel" data-filter="sort">
      <option value="eta"${sortKey === 'eta' ? ' selected' : ''}>Sort: ETA</option>
      <option value="id"${sortKey === 'id' ? ' selected' : ''}>Sort: Newest</option>
      <option value="value"${sortKey === 'value' ? ' selected' : ''}>Sort: Value</option>
    </select>
    ${can() ? `<button class="btn btn-primary" data-action="new-shipment">${icon('plus', 15)} New shipment</button>` : ''}
    <button class="btn btn-ghost" data-action="export" data-module="shipments">${icon('download', 15)} CSV</button>
    <span class="count">${list.length} shipment${list.length === 1 ? '' : 's'} · ${money(totalVal)} · <span class="link" data-action="reset-demo">reset demo data</span></span>
  </div>
  <div class="card tablewrap"><table>
    <thead><tr><th>Shipment</th><th>Supplier / commodity</th><th>Route</th><th>Carrier / vessel</th><th>ETD</th><th>ETA</th><th>ATA</th><th>Status</th><th>Delay reason</th><th>Progress</th><th>Docs</th></tr></thead>
    <tbody>${list.length ? list.map(shipmentRow).join('') : `<tr><td colspan="11"><div class="empty">No shipments match your filters.</div></td></tr>`}</tbody>
  </table></div>`;
}

/* ---- shipment detail modal ---- */
function openShipModal(id) {
  const s = S.state.shipments.find(x => x.id === id);
  if (!s) return;
  if (!(S.modal && S.modal.type === 'ship' && S.modal.id === id)) S.shipTab = 'overview';
  S.modal = { type: 'ship', id };
  const dr = docsReady(s), u = user;
  const tab = S.shipTab || 'overview';
  const bodyHtml = tab === 'overview' ? shipOverview(s) : tab === 'docs' ? shipDocs(s) : shipComments(s);
  openModal(`
    <div class="m-h" id="ship-modal" data-id="${s.id}">
      <div style="min-width:0">
        <h2><span class="mono">${s.id}</span> ${stChip(s)} ${s.delayed ? chip(delayLabel(s.delayReason), 'red', ' chip-pulse') : ''}</h2>
        <div class="m-sub">${esc(s.po)} · ${esc(s.buyer)} · ${esc(s.supplier.name)} (${esc(s.supplier.city || '')}) · ${esc(s.commodity)}</div>
      </div>
      <button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button>
    </div>
    <div class="tabs">
      ${[['overview', 'Overview', ''], ['docs', 'Documents', `${dr}/6`], ['comments', 'Discussion', s.comments.length || '']].map(([k, l, n]) =>
        `<button class="tab ${tab === k ? 'on' : ''}" data-action="ship-tab" data-tab="${k}">${l}${n ? `<span class="tn">${n}</span>` : ''}</button>`).join('')}
      <div style="margin-left:auto;display:flex;gap:8px;padding:8px 0">
        ${can() ? `
          <button class="btn btn-soft btn-sm" data-action="eta-form" data-id="${s.id}">${icon('clock', 14)} Update ETA</button>
          <button class="btn ${s.delayed ? 'btn-ghost' : 'btn-danger'} btn-sm" data-action="delay-form" data-id="${s.id}">${icon('alert', 14)} ${s.delayed ? 'Edit delay' : 'Report delay'}</button>
          ${s.status !== 'Received' ? `<button class="btn btn-ghost btn-sm" data-action="receive" data-id="${s.id}">${icon('check', 14)} Receive</button>` : ''}`
        : `<span class="lock-tip" style="padding:8px 4px">${icon('lock', 13)} read-only — logistics updates ETAs &amp; delays</span>`}
      </div>
    </div>
    <div class="m-b">${bodyHtml}</div>`);
}
function shipOverview(s) {
  const lastEta = (s.etaHistory || []).slice(-1)[0];
  return `
    <div class="facts">
      <div class="fact"><div class="f-k">Supplier</div><div class="f-v">${esc(s.supplier.name)}</div></div>
      <div class="fact"><div class="f-k">Buyer / PO</div><div class="f-v">${esc(s.buyer)} · <span class="mono">${esc(s.po)}</span></div></div>
      <div class="fact"><div class="f-k">Commodity</div><div class="f-v">${esc(s.commodity)}</div></div>
      <div class="fact"><div class="f-k">Quantity</div><div class="f-v">${num(s.qtyKg)} kg</div></div>
      <div class="fact"><div class="f-k">Value · Incoterm</div><div class="f-v">${money(s.valueUsd)} · ${esc(s.incoterm)}</div></div>
      <div class="fact"><div class="f-k">Mode</div><div class="f-v">${s.mode === 'Air' ? icon('plane', 14) + ' Air freight' : icon('anchor', 14) + ' Sea freight'}</div></div>
      <div class="fact"><div class="f-k">Carrier / vessel</div><div class="f-v">${esc(s.carrier)}<br><span class="td-sub">${esc(s.vessel || '—')}</span></div></div>
      <div class="fact"><div class="f-k">Container / AWB</div><div class="f-v mono" style="font-size:12.5px">${esc(s.container)}</div></div>
      <div class="fact"><div class="f-k">MBL / HAWB</div><div class="f-v mono" style="font-size:12.5px">${esc(s.mbl || '—')}</div></div>
      <div class="fact"><div class="f-k">ETD</div><div class="f-v mono">${fmtDateY(s.etd)}</div></div>
      <div class="fact"><div class="f-k">ETA ${lastEta && lastEta.on !== s.etaHistory[0]?.on ? '· changed' : ''}</div><div class="f-v mono">${fmtDateY(s.eta)} ${etaChipHtml(s)}</div></div>
      <div class="fact"><div class="f-k">ATA</div><div class="f-v mono">${s.ata ? fmtDateY(s.ata) : '—'}</div></div>
    </div>
    ${routeViz(s)}
    ${s.delayed ? `<div style="margin-top:14px;background:var(--red-bg);border:1px solid #f5caca;border-radius:12px;padding:13px 16px;display:flex;gap:11px;align-items:flex-start">
      <span style="color:var(--red);padding-top:1px">${icon('alert', 16)}</span>
      <div><b style="color:var(--red-ink)">Delay — ${delayLabel(s.delayReason)}</b><div style="font-size:12.5px;color:var(--red-ink);margin-top:2px">${esc(s.delayNote || 'No note added.')}</div></div>
    </div>` : ''}
    ${(s.etaHistory || []).length ? `
      <h4 style="margin:20px 0 4px;font-size:13px;font-weight:800">ETA history</h4>
      <div class="tl">${[...s.etaHistory].reverse().map((h, i) => `
        <div class="tl-it"><span class="tl-dot ${i === 0 ? '' : 'old'}"></span>
          <div><div class="tl-t">ETA <b>${fmtDateY(h.eta)}</b> — set ${fmtDate(h.on)} by ${esc(user(h.by)?.name || 'System')}</div>
          ${h.note ? `<div class="tl-s">${esc(h.note)}</div>` : ''}</div></div>`).join('')}</div>` : ''}`;
}
function shipDocs(s) {
  return `
  <div style="display:flex;gap:22px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
    <div style="position:relative">${donut(Math.round(docsReady(s) / 6 * 100), docsReady(s) === 6 ? '#16a34a' : '#d97706', 74, 8)}<span style="position:absolute;inset:0;display:grid;place-items:center;font-weight:800;font-size:16px">${docsReady(s)}/6</span></div>
    <div style="font-size:13px;color:var(--mut);max-width:430px">Customs pre-alert at <b>Toamasina</b> requires the full set before arrival. ${can() ? 'Tick documents as the carrier or supplier releases them.' : 'Logistics ticks documents as they are released.'}</div>
  </div>
  ${catalog().docs.map(ddoc => {
    const on = !!s.docs[ddoc.key];
    return `<label class="doc-row ${on ? 'done' : ''}" style="cursor:${can() ? 'pointer' : 'default'}">
      <span class="doc-check">${on ? icon('check', 13) : ''}<input type="checkbox" ${on ? 'checked' : ''} ${can() ? `data-action="toggle-doc" data-doc="${ddoc.key}" data-on="${on ? 1 : 0}" data-ship="${s.id}"` : 'disabled'}></span>
      <span class="doc-name">${esc(ddoc.label)}</span>
      <span style="margin-left:auto">${on ? chip('received', 'green') : chip('pending', 'slate')}</span>
    </label>`;
  }).join('')}`;
}
function shipComments(s) {
  return `<div>${s.comments.length ? s.comments.map(cm).join('') : '<div class="empty">No discussion yet — ask logistics a question here.</div>'}</div>
  <form class="cm-input" data-form="comment-ship">
    ${avatar(S.user)}
    <textarea name="text" placeholder="${S.user.role === 'merchandising' ? 'Ask logistics about this shipment…' : 'Reply to merchandising…'}" required></textarea>
    <input type="hidden" name="id" value="${s.id}">
    <button class="btn btn-primary btn-sm" style="align-self:flex-end">Send</button>
  </form>`;
}
function cm(c) {
  const u = user(c.by) || { name: 'System', color: '#94a3b8', role: 'system' };
  return `<div class="cm">${avatar(u)}
    <div class="cm-bubble"><div class="cm-h"><b>${esc(u.name)}</b><span class="role-badge role-${u.role}">${esc(roleLabel(u.role))}</span><time>${ago(c.at)}</time></div>${esc(c.text)}</div>
  </div>`;
}

/* ---- forms ---- */
function openEtaForm(id) {
  const s = S.state.shipments.find(x => x.id === id);
  openModal(`
    <div class="m-h"><h2>${icon('clock', 18)} Update ETA — <span class="mono">${s.id}</span></h2><button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button></div>
    <form data-form="eta" class="m-b frm">
      <input type="hidden" name="id" value="${s.id}">
      <div class="frow">
        <div class="fld"><label>Current ETA</label><input value="${fmtDateY(s.eta)}" disabled></div>
        <div class="fld"><label>New ETA <span class="req">*</span></label><input type="date" name="eta" required value="${s.eta}"><div class="fhelp">Merchandising sees this instantly + gets a notification.</div></div>
      </div>
      <div class="fld"><label>Reason for change</label><input name="note" placeholder="e.g. +3d — Colombo feeder rollover" value="${s.delayed ? esc(s.delayNote) : ''}"></div>
      <div class="m-f"><button type="button" class="btn btn-ghost" data-action="close">Cancel</button><button class="btn btn-primary">Save new ETA</button></div>
    </form>`, 'narrow');
}
function openDelayForm(id) {
  const s = S.state.shipments.find(x => x.id === id);
  const c = catalog();
  openModal(`
    <div class="m-h"><h2>${icon('alert', 18)} ${s.delayed ? 'Edit delay' : 'Report delay'} — <span class="mono">${s.id}</span></h2><button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button></div>
    <form data-form="delay" class="m-b frm">
      <input type="hidden" name="id" value="${s.id}">
      <div class="fld"><label>Delay status</label>
        <select name="delayed">
          <option value="1"${s.delayed ? ' selected' : ''}>Delayed — notify merchandising</option>
          <option value="0"${!s.delayed ? ' selected' : ''}>Resolved — clear delay flag</option>
        </select></div>
      <div class="fld"><label>Delay reason code <span class="req">*</span></label>
        <select name="reason" required>
          <option value="">Select a reason…</option>
          ${c.delayReasons.map(r => `<option value="${r.code}"${s.delayReason === r.code ? ' selected' : ''}>${r.code} · ${r.label} (${r.cat})</option>`).join('')}
        </select></div>
      <div class="fld"><label>Detail for merchandising</label><textarea name="note" rows="3" placeholder="What happened, impact on plan, next checkpoint…">${esc(s.delayNote)}</textarea></div>
      <div class="fld"><label>Revised ETA (optional)</label><input type="date" name="revisedEta" value="${s.eta}"></div>
      <div class="m-f"><button type="button" class="btn btn-ghost" data-action="close">Cancel</button><button class="btn btn-primary">Log update</button></div>
    </form>`, 'narrow');
}
function openShipmentForm() {
  const c = catalog();
  openModal(`
    <div class="m-h"><h2>${icon('plus', 18)} New import shipment</h2><button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button></div>
    <form data-form="new-shipment" class="m-b frm">
      <div class="frow">
        <div class="fld"><label>PO number <span class="req">*</span></label><input name="po" required placeholder="PO-26xxx"></div>
        <div class="fld"><label>Buyer <span class="req">*</span></label><select name="buyer" required>${c.buyers.map(b => `<option>${b}</option>`).join('')}</select></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Supplier <span class="req">*</span></label><select name="supplier" required>${c.suppliers.map(s => `<option>${esc(s.name)} — ${esc(s.city)}</option>`).join('')}</select></div>
        <div class="fld"><label>Commodity <span class="req">*</span></label><input name="commodity" required placeholder="e.g. Cashmere 2/26 · camel"></div>
      </div>
      <div class="frow frow">
        <div class="fld"><label>Quantity (kg)</label><input name="qtyKg" type="number" min="0" placeholder="6000"></div>
        <div class="fld"><label>Value (USD)</label><input name="valueUsd" type="number" min="0" placeholder="250000"></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Port of loading</label><select name="pol">${c.pols.map(p => `<option value="${p.code}">${p.code} · ${p.name}</option>`).join('')}</select></div>
        <div class="fld"><label>Port of discharge</label><select name="pod">${c.pods.map(p => `<option value="${p.code}">${p.code} · ${p.name}</option>`).join('')}</select></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Transshipment via</label><select name="via"><option value="">Direct</option>${c.vias.map(v => `<option value="${v.code}">${v.code} · ${v.name}</option>`).join('')}</select></div>
        <div class="fld"><label>Mode</label><select name="mode"><option>Sea</option><option>Air</option></select></div>
      </div>
      <div class="frow">
        <div class="fld"><label>ETD <span class="req">*</span></label><input type="date" name="etd" required></div>
        <div class="fld"><label>ETA <span class="req">*</span></label><input type="date" name="eta" required></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Carrier</label><input name="carrier" placeholder="Maersk / MSC / Ethiopian Cargo"></div>
        <div class="fld"><label>Incoterm</label><select name="incoterm"><option>FOB</option><option>CIF</option><option>EXW</option><option>DAP</option></select></div>
      </div>
      <div class="m-f"><button type="button" class="btn btn-ghost" data-action="close">Cancel</button><button class="btn btn-primary">Create shipment</button></div>
    </form>`, 'mid');
}

/* ============================ SAMPLES ============================ */
const SAMPLE_COLS = ['Requested', 'In Development', 'Courier Out', 'Under Review', 'Approved', 'Redo'];
function viewSamples() {
  let list = S.state.samples;
  if (S.f.buyer && S.f.buyer !== 'All') list = list.filter(s => s.buyer === S.f.buyer);
  if (S.f.sampleStatus && S.f.sampleStatus !== 'All') list = list.filter(s => s.status === S.f.sampleStatus);
  if (S.q) list = list.filter(s => [s.id, s.style, s.styleName, s.buyer, s.type, s.courier, s.tracking].join(' ').toLowerCase().includes(S.q));
  const T = todayISO();
  return `
  <div class="toolbar">
    <label class="tsearch">${icon('search', 14)}<input placeholder="Search style, buyer, tracking…" value="${esc(S.q)}" data-input="gq"></label>
    <select class="tsel" data-filter="buyer"><option value="All">All buyers</option>${catalog().buyers.map(b => `<option${S.f.buyer === b ? ' selected' : ''}>${b}</option>`).join('')}</select>
    <button class="btn btn-primary" data-action="new-sample">${icon('plus', 15)} Request sample</button>
    <button class="btn btn-ghost" data-action="export" data-module="samples">${icon('download', 15)} CSV</button>
    <span class="count">${list.length} sample${list.length === 1 ? '' : 's'} in pipeline</span>
  </div>
  <div class="board">
    ${SAMPLE_COLS.map(col => {
      const items = list.filter(s => s.status === col);
      const tone = { Requested: '#64748b', 'In Development': '#4f46e5', 'Courier Out': '#0369a1', 'Under Review': '#d97706', Approved: '#15803d', Redo: '#dc2626' }[col];
      return `<div class="bcol">
        <div class="bcol-h"><span class="bdot" style="background:${tone}"></span>${col}<span class="cnt">${items.length}</span></div>
        ${items.map(s => {
          const dd = diffDays(s.dueDate, T);
          const cls = s.status === 'Approved' ? 'ok' : dd < 0 ? 'overdue' : dd <= 3 ? 'due-soon' : 'ok';
          return `<div class="scard ${cls}" data-action="open-sample" data-id="${s.id}">
            <div class="sc-top"><span class="sc-id">${s.id}</span>${chip(s.type, 'violet')}</div>
            <div class="sc-name">${esc(s.styleName)}</div>
            <div class="sc-style">${esc(s.style)} · ${esc(s.season)} · ${esc(s.qty)}</div>
            <div class="sc-meta">${chip(esc(s.buyer), 'outline')}${dd < 0 && s.status !== 'Approved' ? chip(`${-dd}d overdue`, 'red') : chip(`due ${fmtDate(s.dueDate)}`, dd <= 3 && s.status !== 'Approved' ? 'amber' : 'slate')}</div>
            ${s.courier ? `<div class="sc-foot">${icon('truck', 13)} ${esc(s.courier)} <span class="mono" style="margin-left:auto">${esc(s.tracking || '')}</span></div>` : `<div class="sc-foot">${avatar(user(s.requestedBy) || { name: '?', color: '#94a3b8' }, 'sm')} requested ${fmtDate(s.requestDate)}</div>`}
          </div>`;
        }).join('') || '<div style="text-align:center;color:var(--faint);font-size:12px;padding:14px 0">—</div>'}
      </div>`;
    }).join('')}
  </div>`;
}
function openSampleModal(id) {
  const s = S.state.samples.find(x => x.id === id);
  if (!s) return;
  const nextCols = SAMPLE_COLS.filter(c => c !== s.status);
  openModal(`
    <div class="m-h">
      <div style="min-width:0">
        <h2><span class="mono">${s.id}</span> ${smChip(s.status)} ${chip(s.type, 'violet')}</h2>
        <div class="m-sub">${esc(s.style)} — ${esc(s.styleName)} · ${esc(s.buyer)} · ${esc(s.season)} · ${esc(s.qty)}</div>
      </div>
      <button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button>
    </div>
    <div class="m-b">
      <div class="facts" style="grid-template-columns:repeat(4,1fr)">
        <div class="fact"><div class="f-k">Requested</div><div class="f-v mono">${fmtDate(s.requestDate)}</div></div>
        <div class="fact"><div class="f-k">Due to buyer</div><div class="f-v mono">${fmtDate(s.dueDate)}</div></div>
        <div class="fact"><div class="f-k">Requested by</div><div class="f-v">${esc(user(s.requestedBy)?.name || '—')}</div></div>
        <div class="fact"><div class="f-k">Courier</div><div class="f-v">${s.courier ? `${esc(s.courier)}<br><span class="td-sub mono">${esc(s.tracking || '')}</span>` : '—'}</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
        ${nextCols.map(c => `<button class="btn btn-ghost btn-sm" data-action="move-sample" data-id="${s.id}" data-to="${c}">${icon('arrow', 13)} Move to ${c}</button>`).join('')}
      </div>
      <hr class="mut-line">
      ${s.comments.length ? s.comments.map(cm).join('') : '<div class="empty" style="padding:16px">No notes yet.</div>'}
      <form class="cm-input" data-form="comment-sample">
        ${avatar(S.user)}
        <textarea name="text" placeholder="Add a note for the team (fit changes, buyer feedback, chase-ups)…" required></textarea>
        <input type="hidden" name="id" value="${s.id}">
        <button class="btn btn-primary btn-sm" style="align-self:flex-end">Send</button>
      </form>
    </div>`, 'mid');
}
function openSampleForm() {
  const c = catalog();
  openModal(`
    <div class="m-h"><h2>${icon('shirt', 18)} New sample request</h2><button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button></div>
    <form data-form="new-sample" class="m-b frm">
      <div class="frow">
        <div class="fld"><label>Style code <span class="req">*</span></label><input name="style" required placeholder="FK-26xx"></div>
        <div class="fld"><label>Style name</label><input name="styleName" placeholder="Cable crewneck 12GG"></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Buyer <span class="req">*</span></label><select name="buyer" required>${c.buyers.map(b => `<option>${b}</option>`).join('')}</select></div>
        <div class="fld"><label>Season</label><select name="season"><option>FW26</option><option>SS27</option><option>FW27</option></select></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Sample type <span class="req">*</span></label><select name="type" required>${c.sampleTypes.map(t => `<option>${t}</option>`).join('')}</select></div>
        <div class="fld"><label>Quantity</label><input name="qty" placeholder="3 pcs · S/M/L" value="1 pc"></div>
      </div>
      <div class="fld"><label>Due to buyer <span class="req">*</span></label><input type="date" name="dueDate" required><div class="fhelp">Logistics books the courier and updates tracking against this date.</div></div>
      <div class="m-f"><button type="button" class="btn btn-ghost" data-action="close">Cancel</button><button class="btn btn-primary">Raise request</button></div>
    </form>`, 'narrow');
}
function openCourierForm(id) {
  const s = S.state.samples.find(x => x.id === id);
  openModal(`
    <div class="m-h"><h2>${icon('truck', 18)} Book courier — <span class="mono">${s.id}</span></h2><button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button></div>
    <form data-form="courier" class="m-b frm">
      <input type="hidden" name="id" value="${s.id}">
      <div class="frow">
        <div class="fld"><label>Courier</label><select name="courier"><option>DHL</option><option>FedEx</option><option>UPS</option><option>EMS</option></select></div>
        <div class="fld"><label>Tracking number</label><input name="tracking" required placeholder="JD0146 00x xxx xx"></div>
      </div>
      <div class="m-f"><button type="button" class="btn btn-ghost" data-action="close">Cancel</button><button class="btn btn-primary">Mark courier out</button></div>
    </form>`, 'narrow');
}

/* ============================ ACCESSORIES ============================ */
function viewAccessories() {
  let list = S.state.accessories;
  if (S.f.accStatus && S.f.accStatus !== 'All') list = list.filter(a => a.status === S.f.accStatus);
  if (S.q) list = list.filter(a => [a.id, a.item, a.spec, a.supplier, a.po].join(' ').toLowerCase().includes(S.q));
  const T = todayISO();
  const sortNum = { Received: 0, 'In Transit': 1, Ordered: 2, Planned: 3, Shortage: -1 };
  list = [...list].sort((a, b) => sortNum[a.status] - sortNum[b.status] || a.requiredDate.localeCompare(b.requiredDate));
  return `
  <div class="toolbar">
    <label class="tsearch">${icon('search', 14)}<input placeholder="Search item, supplier, PO…" value="${esc(S.q)}" data-input="gq"></label>
    <select class="tsel" data-filter="accStatus"><option value="All">All statuses</option>${catalog().accStatuses.map(st => `<option${S.f.accStatus === st ? ' selected' : ''}>${st}</option>`).join('')}</select>
    ${can() ? `<button class="btn btn-primary" data-action="new-acc">${icon('plus', 15)} New trims PO</button>` : ''}
    <button class="btn btn-ghost" data-action="export" data-module="accessories">${icon('download', 15)} CSV</button>
    <span class="count">${list.length} item${list.length === 1 ? '' : 's'}</span>
  </div>
  <div class="card tablewrap"><table>
    <thead><tr><th>Item</th><th>Supplier / PO</th><th>Ordered / received</th><th>Coverage</th><th>Required</th><th>Status</th><th>Linked import</th></tr></thead>
    <tbody>${list.length ? list.map(a => {
      const dd = diffDays(a.requiredDate, T);
      const pct = a.ordered ? Math.round(a.received / a.ordered * 100) : 0;
      const crit = a.received < a.ordered && dd <= 7;
      return `<tr class="click" data-action="open-acc" data-id="${a.id}">
        <td><div class="td-main">${esc(a.item)}</div><div class="td-sub">${esc(a.spec)}</div></td>
        <td><div>${esc(a.supplier)}</div><div class="td-sub mono">${esc(a.po)}</div></td>
        <td class="mono">${num(a.received)} / ${num(a.ordered)} ${esc(a.unit)}</td>
        <td><div class="prog ${crit ? 'warn' : ''}" style="width:120px"><i style="width:${pct}%"></i></div></td>
        <td><div class="mono" style="font-weight:700">${fmtDate(a.requiredDate)}</div>
            <div style="margin-top:3px">${a.received >= a.ordered ? chip('covered', 'green') : dd < 0 ? chip(`${-dd}d overdue`, 'red', ' chip-pulse') : dd <= 7 ? chip(`in ${dd}d`, 'amber') : chip(`in ${dd}d`, 'slate')}</div></td>
        <td>${acChip(a.status)}</td>
        <td>${a.shipmentId ? `<span class="link mono" data-action="open-ship" data-id="${a.shipmentId}">${a.shipmentId}</span>` : '<span class="text-mut">—</span>'}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="7"><div class="empty">No trims POs match.</div></td></tr>`}</tbody>
  </table></div>`;
}
function openAccModal(id) {
  const a = S.state.accessories.find(x => x.id === id);
  if (!a) return;
  openModal(`
    <div class="m-h">
      <div style="min-width:0">
        <h2><span class="mono">${a.id}</span> ${acChip(a.status)}</h2>
        <div class="m-sub">${esc(a.item)} — ${esc(a.spec)}</div>
      </div>
      <button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button>
    </div>
    <div class="m-b">
      <div class="facts" style="grid-template-columns:repeat(4,1fr)">
        <div class="fact"><div class="f-k">Supplier</div><div class="f-v">${esc(a.supplier)}</div></div>
        <div class="fact"><div class="f-k">PO</div><div class="f-v mono">${esc(a.po)}</div></div>
        <div class="fact"><div class="f-k">Ordered</div><div class="f-v mono">${num(a.ordered)} ${esc(a.unit)}</div></div>
        <div class="fact"><div class="f-k">Received</div><div class="f-v mono">${num(a.received)} ${esc(a.unit)}</div></div>
        <div class="fact"><div class="f-k">Ordered on</div><div class="f-v mono">${fmtDate(a.orderDate)}</div></div>
        <div class="fact"><div class="f-k">Required on floor</div><div class="f-v mono">${fmtDate(a.requiredDate)}</div></div>
        <div class="fact"><div class="f-k">Linked import</div><div class="f-v">${a.shipmentId ? `<span class="link mono" data-action="open-ship" data-id="${a.shipmentId}">${a.shipmentId}</span>` : '—'}</div></div>
        <div class="fact"><div class="f-k">Gap</div><div class="f-v">${a.received >= a.ordered ? '<span class="text-green">Fully covered</span>' : `<span class="text-red">${num(a.ordered - a.received)} ${esc(a.unit)} short</span>`}</div></div>
      </div>
      ${can() ? `
      <hr class="mut-line">
      <form class="frm" data-form="acc-receive">
        <input type="hidden" name="id" value="${a.id}">
        <div class="frow">
          <div class="fld"><label>Register receipt (received qty)</label><input type="number" name="received" min="0" max="${a.ordered}" value="${a.received}"></div>
          <div class="fld"><label>Status</label><select name="status">${catalog().accStatuses.map(st => `<option${a.status === st ? ' selected' : ''}>${st}</option>`).join('')}</select></div>
        </div>
        <div style="display:flex;justify-content:flex-end"><button class="btn btn-primary btn-sm">Save receipt</button></div>
      </form>` : `<div class="lock-tip" style="margin-top:14px">${icon('lock', 13)} read-only — logistics records receipts</div>`}
    </div>`, 'mid');
}
function openAccForm() {
  openModal(`
    <div class="m-h"><h2>${icon('tag', 18)} New trims / accessories PO</h2><button class="icon-btn m-x" data-action="close">${icon('x', 16)}</button></div>
    <form data-form="new-acc" class="m-b frm">
      <div class="frow">
        <div class="fld"><label>Item <span class="req">*</span></label><input name="item" required placeholder="Corozo buttons 20L"></div>
        <div class="fld"><label>Specification</label><input name="spec" placeholder="Tagua nut, matte finish"></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Supplier <span class="req">*</span></label><select name="supplier" required>${catalog().suppliers.map(s => `<option>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="fld"><label>PO ref</label><input name="po" placeholder="auto-generated if empty"></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Ordered qty <span class="req">*</span></label><input type="number" name="ordered" min="1" required placeholder="24000"></div>
        <div class="fld"><label>Unit</label><select name="unit"><option>pcs</option><option>m</option><option>sets</option><option>kg</option></select></div>
      </div>
      <div class="frow">
        <div class="fld"><label>Required on floor <span class="req">*</span></label><input type="date" name="requiredDate" required></div>
        <div class="fld"><label>Linked import shipment</label><select name="shipmentId"><option value="">— none —</option>${S.state.shipments.filter(s => s.status !== 'Received').map(s => `<option value="${s.id}">${s.id} · ${esc(s.supplier.name)}</option>`).join('')}</select></div>
      </div>
      <div class="m-f"><button type="button" class="btn btn-ghost" data-action="close">Cancel</button><button class="btn btn-primary">Create PO</button></div>
    </form>`, 'narrow');
}

/* ============================ ANALYTICS ============================ */
function viewAnalytics() {
  const T = todayISO();
  const sh = S.state.shipments;
  const received = sh.filter(s => s.status === 'Received' && s.ata);
  const onTimePct = received.length ? Math.round(received.filter(s => diffDays(s.ata, s.eta) <= 0).length / received.length * 100) : 100;
  const late = received.filter(s => diffDays(s.ata, s.eta) > 0);
  const avgLate = late.length ? (late.reduce((a, s) => a + diffDays(s.ata, s.eta), 0) / late.length).toFixed(1) : '0';
  const activeDelayed = sh.filter(s => s.delayed && s.status !== 'Received');

  // Pareto by count + total days lost
  const agg = {};
  sh.filter(s => s.delayReason).forEach(s => {
    const r = agg[s.delayReason] = agg[s.delayReason] || { count: 0, days: 0 };
    r.count++; r.days += s.status === 'Received' ? Math.max(0, diffDays(s.ata, s.eta)) : delayDays(s) || 3;
  });
  const pareto = Object.entries(agg).map(([code, r]) => ({ code, ...r, label: delayLabel(code) })).sort((a, b) => b.count - a.count);

  // monthly on-time trend (last 6 months incl. current)
  const months = [];
  for (let i = 5; i >= 0; i--) { const d0 = new Date(); d0.setDate(1); d0.setMonth(d0.getMonth() - i); months.push(d0); }
  const trend = months.map(m0 => {
    const next = new Date(m0); next.setMonth(next.getMonth() + 1);
    const k = s => parseD(s.ata) >= m0 && parseD(s.ata) < next;
    const rec = received.filter(k);
    const pctv = rec.length ? Math.round(rec.filter(s => diffDays(s.ata, s.eta) <= 0).length / rec.length * 100) : null;
    return { m: m0.toLocaleDateString('en-GB', { month: 'short' }), v: pctv == null ? 0 : pctv, n: rec.length };
  });

  const f = S.f;
  const tableRows = activeDelayed.filter(s => (!f.buyer || f.buyer === 'All' || s.buyer === f.buyer)).sort((a, b) => b.eta.localeCompare(a.eta));

  return `
  <div class="kpis">
    <div class="kpi" style="--kc:#15803d"><span class="k-label">On-time arrivals</span><div class="k-row"><span class="k-num">${onTimePct}%</span>${chip(`${received.length} received`, 'green')}</div><span class="k-sub">last 6 months · ATA vs ETA</span></div>
    <div class="kpi" style="--kc:#d97706"><span class="k-label">Avg slip when late</span><div class="k-row"><span class="k-num">${avgLate}d</span>${chip(`${late.length} late arrivals`, 'amber')}</div><span class="k-sub">planning buffer benchmark</span></div>
    <div class="kpi" style="--kc:#dc2626"><span class="k-label">Days lost YTD</span><div class="k-row"><span class="k-num">${pareto.reduce((a, p) => a + p.days, 0)}</span>${chip('days', 'red')}</div><span class="k-sub">cumulative delay across shipments</span></div>
    <div class="kpi" style="--kc:#7c3aed"><span class="k-label">Top root cause</span><div class="k-row" style="flex-direction:column;align-items:flex-start"><span style="font-size:15px;font-weight:800;line-height:1.3">${pareto[0] ? esc(delayLabel(pareto[0].code)) : '—'}</span></div><span class="k-sub">${pareto[0] ? `${pareto[0].count} occurrence${pareto[0].count > 1 ? 's' : ''} · ${pareto[0].days}d lost` : ''}</span></div>
  </div>

  <div class="grid-2e">
    <div class="card">
      <div class="card-h"><h3>Delay Pareto — coded reasons</h3><span class="sub">count of shipments · days lost</span></div>
      <div class="card-b">
        ${pareto.length ? hbars(pareto.map(p => ({ label: delayLabel(p.code), value: p.count, days: p.days, suffix: `${p.days}d lost` })), it => it.days > 10 ? 'linear-gradient(90deg,#ef4444,#b91c1c)' : 'linear-gradient(90deg,#f59e0b,#d97706)') : '<div class="empty">No delay data yet.</div>'}
        <hr class="mut-line"><div class="kv-inline">Codes: ${catalog().delayReasons.map(r => `<b title="${esc(r.cat)}">${r.code}</b> ${esc(r.label)}`).join(' · ')}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><h3>On-time trend</h3><span class="sub">% arrivals on or before ETA</span></div>
      <div class="card-b">${lineChart(trend)}
        <div class="kv-inline" style="margin-top:8px">Months with no arrivals are shown at 0. Target ≥ 85% — world-class knitwear mills run 92–96%.</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h"><h3>Active delays — action board</h3><span class="sub">logistics assigns the reason code; merchandising sees the impact instantly</span>
      <div class="right"><select class="tsel" data-filter="buyer"><option value="All">All buyers</option>${catalog().buyers.map(b => `<option${f.buyer === b ? ' selected' : ''}>${b}</option>`).join('')}</select></div></div>
    <div class="tablewrap"><table>
      <thead><tr><th>Shipment</th><th>Buyer</th><th>ETA</th><th>Days late</th><th>Status</th><th>Reason code</th><th>Detail</th></tr></thead>
      <tbody>${tableRows.length ? tableRows.map(s => `
        <tr>
          <td class="click" data-action="open-ship" data-id="${s.id}"><span class="td-main mono link">${s.id}</span><div class="td-sub">${esc(s.po)}</div></td>
          <td>${chip(esc(s.buyer), 'outline')}</td>
          <td class="mono">${fmtDate(s.eta)}</td>
          <td><b class="days-chip text-red">${delayDays(s) || '—'}d</b></td>
          <td>${stChip(s)}</td>
          <td>${can() ? `<select class="tsel" style="padding:5px 8px;font-size:12px" data-status-of="${s.id}" data-status-what="ship-delay">
              <option value="">— assign —</option>
              ${catalog().delayReasons.map(r => `<option value="${r.code}"${s.delayReason === r.code ? ' selected' : ''}>${r.code} · ${r.label}</option>`).join('')}
            </select>` : `<span class="chip chip-red">${delayLabel(s.delayReason)}</span>`}</td>
          <td style="max-width:340px"><span class="td-sub" style="display:block;white-space:normal">${esc(s.delayNote || '—')}</span></td>
        </tr>`).join('') : `<tr><td colspan="7"><div class="empty">No active delays — every inbound is on schedule. 🎯</div></td></tr>`}</tbody>
    </table></div>
  </div>`;
}

/* ============================ ACTIVITY ============================ */
const MODULE_META = {
  shipment: { ic: 'ship', cls: 'ai-teal', name: 'Shipment' },
  sample: { ic: 'shirt', cls: 'ai-violet', name: 'Sample' },
  accessory: { ic: 'tag', cls: 'ai-amber', name: 'Trims' },
  system: { ic: 'refresh', cls: 'ai-slate', name: 'System' }
};
function feedHtml(items, compact) {
  let lastDay = '';
  return items.map(a => {
    const m = MODULE_META[a.module] || MODULE_META.system;
    const u = user(a.userId) || { name: 'System', color: '#94a3b8', role: 'system' };
    const day = new Date(a.ts).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
    const dayHead = !compact && day !== lastDay ? `<div class="feed-day">${day === new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) ? 'Today' : day}</div>` : '';
    lastDay = day;
    const refRoute = a.module === 'accessory' ? 'open-acc' : a.module === 'sample' ? 'open-sample' : 'open-ship';
    return `${dayHead}<div class="feed-it">
      <span class="f-ic ${m.cls}">${icon(m.ic, 14)}</span>
      <span class="f-txt"><b>${esc(u.name)}</b> <span style="color:var(--mut)">${esc(a.action)}</span> <span class="f-ref" data-action="${refRoute}" data-id="${esc(a.refId)}">${esc(a.refId)}</span><br>${esc(a.detail)}</span>
      <span class="f-time">${ago(a.ts)}</span>
    </div>`;
  }).join('');
}
function viewActivity() {
  return `<div class="card">${feedHtml(S.state.activity)}</div>`;
}

/* ============================ IMPORT TIMELINE (YARN + TRIMS) ============================ */
function importRows() {
  const T = todayISO(), rows = [];
  S.state.shipments.forEach(s => {
    if (s.status === 'Received' && s.ata && -diffDays(s.ata, T) > 14) return; // hide received older than 2 weeks
    rows.push({
      kind: 'Yarn', ref: s.id, title: s.commodity, sub: `${s.supplier.name} · ${s.mode}`,
      supplier: s.supplier.name, buyer: s.buyer, po: s.po, date: s.eta, dateLabel: 'ETA',
      status: s.status, statusChip: stChip(s), countChip: etaChipHtml(s),
      delayed: s.delayed, delayText: s.delayed ? delayLabel(s.delayReason) : '',
      progress: s.progress, progTitle: docsReady(s) + '/6 docs ready', pulse: s.delayed,
      act: 'open-ship', src: s
    });
  });
  S.state.accessories.forEach(a => {
    if (a.received >= a.ordered) return; // fully covered → not inbound
    const link = a.shipmentId ? S.state.shipments.find(x => x.id === a.shipmentId) : null;
    const dd = diffDays(a.requiredDate, T), over = dd < 0;
    rows.push({
      kind: 'Trims', ref: a.id, title: a.item, sub: a.spec || a.po,
      supplier: a.supplier, buyer: link ? link.buyer : 'Shared', po: a.po, date: a.requiredDate, dateLabel: 'Needed on floor',
      status: a.status, statusChip: acChip(a.status),
      countChip: over ? chip(`${-dd}d overdue`, 'red', ' chip-pulse') : chip(`in ${dd}d`, dd <= 7 ? 'amber' : 'slate'),
      delayed: a.status === 'Shortage' || over,
      delayText: a.status === 'Shortage' ? 'Shortage flagged' : over ? 'Past required date' : '',
      progress: a.ordered ? Math.round(a.received / a.ordered * 100) : 0,
      progTitle: `${num(a.received)}/${num(a.ordered)} ${a.unit} received`, pulse: over,
      act: 'open-acc', src: a
    });
  });
  return rows;
}
function viewImports() {
  const f = S.f, T = todayISO();
  let rows = importRows();
  if (f.importType && f.importType !== 'All') rows = rows.filter(r => r.kind === f.importType);
  if (f.impBuyer && f.impBuyer !== 'All') rows = rows.filter(r => r.buyer === f.impBuyer);
  if (f.importFlag && f.importFlag !== 'all') {
    if (f.importFlag === 'delayed') rows = rows.filter(r => r.delayed);
    else if (f.importFlag === 'soon') rows = rows.filter(r => !r.src.ata && diffDays(r.date, T) >= 0 && diffDays(r.date, T) <= 7);
    else if (f.importFlag === 'customs') rows = rows.filter(r => String(r.status).indexOf('Customs') === 0);
  }
  if (S.q) rows = rows.filter(r => [r.ref, r.title, r.sub, r.supplier, r.buyer, r.po].join(' ').toLowerCase().includes(S.q));
  rows.sort((a, b) => (a.delayed === b.delayed ? a.date.localeCompare(b.date) : a.delayed ? -1 : 1));

  const yarnN = rows.filter(r => r.kind === 'Yarn').length;
  const trimN = rows.filter(r => r.kind === 'Trims').length;
  const delN = rows.filter(r => r.delayed).length;
  const opt = (v, l, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(l)}</option>`;
  return `
  <div class="toolbar">
    <label class="tsearch">${icon('search', 14)}<input placeholder="Search item, ref, supplier, buyer…" value="${esc(S.q)}" data-input="gq"></label>
    <select class="tsel" data-filter="importType">${opt('All', 'Yarn + Trims', !f.importType || f.importType === 'All')}${opt('Yarn', 'Yarn only', f.importType === 'Yarn')}${opt('Trims', 'Trims only', f.importType === 'Trims')}</select>
    <select class="tsel" data-filter="impBuyer">${opt('All', 'All buyers', !f.impBuyer || f.impBuyer === 'All')}${catalog().buyers.map(b => opt(b, b, f.impBuyer === b)).join('')}</select>
    <select class="tsel" data-filter="importFlag">${opt('all', 'All statuses', !f.importFlag || f.importFlag === 'all')}${opt('delayed', 'Delayed / shortages', f.importFlag === 'delayed')}${opt('soon', 'Arriving ≤ 7 days', f.importFlag === 'soon')}${opt('customs', 'In customs', f.importFlag === 'customs')}</select>
    <button class="btn btn-ghost" data-action="export" data-module="shipments">${icon('download', 15)} Yarn CSV</button>
    <button class="btn btn-ghost" data-action="export" data-module="accessories">${icon('download', 15)} Trims CSV</button>
    <span class="count">${yarnN} yarn · ${trimN} trims inbound · <b class="${delN ? 'text-red' : 'text-green'}">${delN} delayed / issue${delN === 1 ? '' : 's'}</b></span>
  </div>
  <div class="card tablewrap"><table>
    <thead><tr><th>Import</th><th>Item</th><th>Supplier</th><th>Buyer / PO</th><th>Date</th><th>Countdown</th><th>Status</th><th>Delay / issue</th><th>Progress</th></tr></thead>
    <tbody>${rows.length ? rows.map(r => `
      <tr class="click" data-action="${r.act}" data-id="${r.ref}">
        <td><span class="chip ${r.kind === 'Yarn' ? 'chip-teal' : 'chip-amber'}">${r.kind}</span><div class="td-main mono" style="margin-top:4px;font-size:12px">${r.ref}</div></td>
        <td><div class="td-main">${esc(r.title)}</div><div class="td-sub">${esc(r.sub)}</div></td>
        <td>${esc(r.supplier)}</td>
        <td>${chip(esc(r.buyer), 'outline')}<div class="td-sub mono" style="margin-top:3px">${esc(r.po)}</div></td>
        <td><div class="mono" style="font-weight:700">${fmtDate(r.date)}</div><div class="td-sub">${r.dateLabel}</div></td>
        <td>${r.countChip}</td>
        <td>${r.statusChip}</td>
        <td>${r.delayed ? `<span class="chip chip-red${r.pulse ? ' chip-pulse' : ''}">${esc(r.delayText)}</span>` : '<span class="text-mut">—</span>'}</td>
        <td><div class="prog ${r.delayed ? 'warn' : ''}"><i style="width:${r.progress}%"></i></div><div class="td-sub" style="margin-top:3px">${r.progTitle}</div></td>
      </tr>`).join('') : `<tr><td colspan="9"><div class="empty">Nothing inbound matches your filters.</div></td></tr>`}</tbody>
  </table></div>
  <div class="kv-inline" style="margin-top:10px">Merchandising view — click any row for full detail, ETA history, documents and discussion. The shipping desk keeps ETAs, delay codes, documents and receipts up to date; this page reflects it instantly.</div>`;
}

/* ---------------- notif dropdown ---------------- */
function notifPopHtml() {
  const ns = notifs();
  return `<div class="notif-pop">
    <div class="np-h">Notifications <span class="chip chip-slate">${ns.length}</span></div>
    <div class="np-list">${ns.length ? ns.map(n => `
      <div class="np-it" data-action="notif-go" data-go="${n.go}" data-ref="${n.ref || ''}">
        <span class="ai-ic ai-${n.tone}" style="flex:0 0 30px;height:30px;border-radius:8px;display:grid;place-items:center">${icon(n.icon, 14)}</span>
        <span><span class="np-t">${esc(n.t)}</span><br><span class="np-s">${esc(n.s)}</span></span>
      </div>`).join('') : '<div class="empty">Nothing needs attention.</div>'}</div>
  </div>`;
}
