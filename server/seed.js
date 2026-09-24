'use strict';
/* FlexKnit Link — demo seed data generator.
   All dates are generated relative to "today" so the demo always looks live. */

const DAY = 864e5;
const d = (off) => { const t = new Date(); t.setHours(12, 0, 0, 0); return new Date(t.getTime() + off * DAY).toISOString().slice(0, 10); };
const ts = (h) => new Date(Date.now() - h * 36e5).toISOString();

function build() {
  const users = [
    { id: 'u1', name: 'Hery Randria',   role: 'logistics',     title: 'Logistics Lead',            color: '#0d9488' },
    { id: 'u2', name: 'Miora Rakoto',   role: 'logistics',     title: 'Import Coordinator',        color: '#0284c7' },
    { id: 'u3', name: 'Naina Andriama', role: 'logistics',     title: 'Customs & Documentation',   color: '#d97706' },
    { id: 'u4', name: 'Lova Rasoa',     role: 'merchandising', title: 'Merch Manager — EU/UK',     color: '#7c3aed' },
    { id: 'u5', name: 'Tojo Rajaon',    role: 'merchandising', title: 'Merchandiser — US',         color: '#db2777' },
    { id: 'u6', name: 'Faniry Rasolo',  role: 'merchandising', title: 'Merchandiser — Knitwear',   color: '#4f46e5' },
    { id: 'u7', name: 'Rado Rakotobe',  role: 'admin',         title: 'Operations Director',       color: '#475569' }
  ];

  const catalog = {
    buyers: ['M&S', 'UNIQLO', 'H&M', 'ZARA', 'Tommy Hilfiger', 'GAP', 'Decathlon'],
    suppliers: [
      { name: 'Consinee Group',   country: 'China', city: 'Ningbo' },
      { name: 'ERDOS Group',      country: 'China', city: 'Ordos' },
      { name: 'Newtimes Group',   country: 'China', city: 'Dongguan' },
      { name: 'Zhejiang Xinao',   country: 'China', city: 'Tongxiang' },
      { name: 'YKK (Shanghai)',   country: 'China', city: 'Shanghai' },
      { name: 'SBS Zipper',       country: 'China', city: 'Xiamen' },
      { name: 'Botany Trims',     country: 'China', city: 'Wenzhou' },
      { name: 'Label One',        country: 'China', city: 'Guangzhou' },
      { name: 'MadaPack SARL',    country: 'Madagascar', city: 'Antananarivo' },
      { name: 'Papier Agencies',  country: 'Madagascar', city: 'Antananarivo' }
    ],
    pols: [
      { code: 'CNNGB', name: 'Ningbo' }, { code: 'CNSHA', name: 'Shanghai' }, { code: 'CNYTN', name: 'Yantian' },
      { code: 'CNTAO', name: 'Qingdao' }, { code: 'CNXMN', name: 'Xiamen' }, { code: 'CNWNZ', name: 'Wenzhou' }
    ],
    pods: [{ code: 'MGTMM', name: 'Toamasina' }, { code: 'TNR', name: 'Antananarivo · Ivato (air)' }],
    vias: [{ code: 'LKCMB', name: 'Colombo' }, { code: 'SGSIN', name: 'Singapore' }, { code: 'DJJIB', name: 'Djibouti' }, { code: 'MUPMR', name: 'Port Louis' }],
    shipmentStatuses: ['Booked', 'In Production', 'Ready to Ship', 'In Transit', 'Transshipment', 'Customs – Toamasina', 'Customs – Ivato', 'Cleared – Inland', 'Received'],
    delayReasons: [
      { code: 'D01', label: 'Vessel schedule change',        cat: 'Carrier' },
      { code: 'D02', label: 'Transshipment port congestion', cat: 'Carrier' },
      { code: 'D03', label: 'Customs inspection hold',       cat: 'Customs' },
      { code: 'D04', label: 'Documentation mismatch',        cat: 'Documents' },
      { code: 'D05', label: 'Yarn dye-lot / quality re-check', cat: 'Supplier' },
      { code: 'D06', label: 'Holiday backlog (CNY)',         cat: 'Calendar' },
      { code: 'D07', label: 'Weather / port closure',        cat: 'Force majeure' },
      { code: 'D08', label: 'Booking rollover',              cat: 'Carrier' },
      { code: 'D09', label: 'Inland transport breakdown',    cat: 'Local' }
    ],
    sampleTypes: ['Proto', 'Fit', 'PP', 'Size Set', 'TOP', 'SMS', 'Shipment'],
    sampleStatuses: ['Requested', 'In Development', 'Courier Out', 'Under Review', 'Approved', 'Redo'],
    accStatuses: ['Planned', 'Ordered', 'In Transit', 'Received', 'Shortage'],
    docs: [
      { key: 'ci',   label: 'Commercial Invoice' },
      { key: 'pl',   label: 'Packing List' },
      { key: 'bl',   label: 'Bill of Lading / AWB' },
      { key: 'co',   label: 'Certificate of Origin' },
      { key: 'msds', label: 'MSDS / Fiber content' },
      { key: 'sgs',  label: 'SGS Inspection Certificate' }
    ]
  };

  const shipments = [
    {
      id: 'SHP-2026-1042', po: 'PO-26118', buyer: 'M&S', supplier: { name: 'Consinee Group', country: 'China', city: 'Ningbo' },
      commodity: '100% Cashmere 28/2 · Grade A', qtyKg: 6400, valueUsd: 486000, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNNGB', pod: 'MGTMM', via: 'LKCMB', carrier: 'Maersk', vessel: 'MAERSK SELETAR V.032E', container: 'MSKU 8829147 · 1×40HQ',
      etd: d(-16), eta: d(5), ata: null, status: 'In Transit', delayed: false, delayReason: null, delayNote: '', progress: 62,
      mbl: 'MAEU-260114875', docs: { ci: true, pl: true, bl: true, co: false, msds: true, sgs: false },
      etaHistory: [
        { eta: d(1),  on: d(-20), by: 'u2', note: 'Initial carrier schedule' },
        { eta: d(5),  on: d(-6),  by: 'u2', note: '+4d — Colombo transshipment congestion (carrier advisory)' }
      ],
      comments: [
        { id: 'c1', by: 'u4', text: 'Hi team — the FW26 W39 knit slot for M&S depends on this cashmere lot. Can you confirm the revised ETA and docs status?', at: ts(120) },
        { id: 'c2', by: 'u2', text: 'Confirmed: ETA ' + d(5) + ' after Colombo congestion (+4d). Certificate of Origin pending from Consinee — requested this morning.', at: ts(96) }
      ]
    },
    {
      id: 'SHP-2026-1043', po: 'PO-26122', buyer: 'UNIQLO', supplier: { name: 'ERDOS Group', country: 'China', city: 'Ordos' },
      commodity: 'Extrafine Merino 70/2 · 19.5µ', qtyKg: 12500, valueUsd: 298000, incoterm: 'CIF', mode: 'Sea',
      pol: 'CNTAO', pod: 'MGTMM', via: 'SGSIN', carrier: 'COSCO', vessel: 'COSCO HELLAS V.118W', container: 'COSU 6412208 · 2×40HQ',
      etd: d(-9), eta: d(12), ata: null, status: 'In Transit', delayed: false, delayReason: null, delayNote: '', progress: 55,
      mbl: 'COSU-661204918', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: false },
      etaHistory: [{ eta: d(12), on: d(-14), by: 'u2', note: 'Initial carrier schedule' }],
      comments: [{ id: 'c3', by: 'u6', text: 'This covers the UNIQLO rib program. Please book the SGS inspection early this time — last lot cleared without it and we lost a week.', at: ts(60) }]
    },
    {
      id: 'SHP-2026-1044', po: 'PO-26097', buyer: 'ZARA', supplier: { name: 'Newtimes Group', country: 'China', city: 'Dongguan' },
      commodity: 'Acrylic 50/2 + Lurex blend', qtyKg: 18000, valueUsd: 121000, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNYTN', pod: 'MGTMM', via: 'DJJIB', carrier: 'CMA CGM', vessel: 'CMA CGM BALI V.0MW', container: 'CMAU 2218764 · 1×40HQ',
      etd: d(-30), eta: d(-8), ata: d(-8), status: 'Customs – Toamasina', delayed: true, delayReason: 'D03', delayNote: 'Container selected for scanner inspection — queue ~3 working days at Toamasina terminal.', progress: 85,
      mbl: 'CMDU-2481763', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: true },
      etaHistory: [
        { eta: d(-12), on: d(-45), by: 'u2', note: 'Initial carrier schedule' },
        { eta: d(-8),  on: d(-12), by: 'u2', note: '+4d — Djibouti port congestion' }
      ],
      comments: [
        { id: 'c4', by: 'u3', text: 'Container selected for scanner inspection at Toamasina — queue ~3 days. Pre-alert already filed with the broker, duty files ready.', at: ts(72) },
        { id: 'c5', by: 'u4', text: 'This acrylic lot feeds the Zara W38 loading plan. Is there a priority lane option? Please advise before Thursday.', at: ts(48) }
      ]
    },
    {
      id: 'SHP-2026-1045', po: 'PO-26130', buyer: 'Tommy Hilfiger', supplier: { name: 'YKK (Shanghai)', country: 'China', city: 'Shanghai' },
      commodity: 'Zippers & pullers — PP trim lot', qtyKg: 620, valueUsd: 18400, incoterm: 'FOB', mode: 'Air',
      pol: 'CNSHA', pod: 'TNR', via: null, carrier: 'Ethiopian Cargo', vessel: 'ET Cargo · via ADD', container: 'AWB 071-88239145',
      etd: d(-2), eta: d(2), ata: null, status: 'In Transit', delayed: false, delayReason: null, delayNote: '', progress: 75,
      mbl: '071-88239145', docs: { ci: true, pl: true, bl: true, co: false, msds: false, sgs: false },
      etaHistory: [{ eta: d(2), on: d(-6), by: 'u3', note: 'Air booking confirmed — ADD routing' }],
      comments: []
    },
    {
      id: 'SHP-2026-1046', po: 'PO-26125', buyer: 'H&M', supplier: { name: 'Zhejiang Xinao', country: 'China', city: 'Tongxiang' },
      commodity: 'Cotton slub 10/2 · BCI', qtyKg: 22000, valueUsd: 96500, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNSHA', pod: 'MGTMM', via: 'SGSIN', carrier: 'MSC', vessel: 'MSC AMBITION V.243W', container: 'MSKU 5510938 · 1×40HQ + 1×20',
      etd: d(-3), eta: d(21), ata: null, status: 'In Transit', delayed: false, delayReason: null, delayNote: '', progress: 45,
      mbl: 'MSCU-7702934', docs: { ci: true, pl: false, bl: false, co: false, msds: true, sgs: false },
      etaHistory: [{ eta: d(21), on: d(-9), by: 'u2', note: 'Initial carrier schedule' }],
      comments: []
    },
    {
      id: 'SHP-2026-1047', po: 'PO-26131', buyer: 'GAP', supplier: { name: 'SBS Zipper', country: 'China', city: 'Xiamen' },
      commodity: 'Nylon zippers 15–20cm · navy/olive', qtyKg: 3400, valueUsd: 27800, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNXMN', pod: 'MGTMM', via: 'LKCMB', carrier: 'OOCL', vessel: 'OOCL SPAIN V.041W', container: 'Booking pending',
      etd: d(9), eta: d(34), ata: null, status: 'Booked', delayed: false, delayReason: null, delayNote: '', progress: 10,
      mbl: '', docs: { ci: false, pl: false, bl: false, co: false, msds: false, sgs: false },
      etaHistory: [{ eta: d(34), on: d(-4), by: 'u2', note: 'Booking confirmed with OOCL' }],
      comments: []
    },
    {
      id: 'SHP-2026-1048', po: 'PO-26133', buyer: 'M&S', supplier: { name: 'Consinee Group', country: 'China', city: 'Ningbo' },
      commodity: 'Cashmere/Nylon 2/26 · FW26 core', qtyKg: 5100, valueUsd: 392000, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNNGB', pod: 'MGTMM', via: 'LKCMB', carrier: 'Maersk', vessel: 'Booking pending', container: 'Pending',
      etd: d(14), eta: d(46), ata: null, status: 'In Production', delayed: false, delayReason: null, delayNote: '', progress: 25,
      mbl: '', docs: { ci: false, pl: false, bl: false, co: false, msds: false, sgs: false },
      etaHistory: [{ eta: d(46), on: d(-2), by: 'u2', note: 'Estimated on production plan' }],
      comments: [{ id: 'c6', by: 'u4', text: 'Flagging early: M&S wants a mid-November floor start, so latest receipt at factory is ' + d(40) + '. Inland + QC needs 5 days after clearance.', at: ts(20) }]
    },
    {
      id: 'SHP-2026-1049', po: 'PO-26101', buyer: 'Decathlon', supplier: { name: 'Botany Trims', country: 'China', city: 'Wenzhou' },
      commodity: 'Corozo buttons 20L · walnut dye', qtyKg: 900, valueUsd: 9200, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNWNZ', pod: 'MGTMM', via: 'LKCMB', carrier: 'ONE', vessel: 'ONE COMMITMENT V.019W', container: 'ONEU 4408127 · 1×20',
      etd: d(-18), eta: d(3), ata: null, status: 'Transshipment', delayed: true, delayReason: 'D02', delayNote: 'Colombo feeder connection missed — rolled to next feeder, +3d.', progress: 68,
      mbl: 'ONEY-8831207', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: false },
      etaHistory: [
        { eta: d(0),  on: d(-30), by: 'u2', note: 'Initial carrier schedule' },
        { eta: d(3),  on: d(-5),  by: 'u2', note: '+3d — Colombo feeder rollover' }
      ],
      comments: [{ id: 'c7', by: 'u5', text: 'Buttons needed on the floor by ' + d(8) + ' for the Decathlon line loading. Will ETA ' + d(3) + ' + 2d inland + QC still make it?', at: ts(30) }]
    },
    {
      id: 'SHP-2026-1050', po: 'PO-26134', buyer: 'UNIQLO', supplier: { name: 'ERDOS Group', country: 'China', city: 'Ordos' },
      commodity: 'Yak/Cashmere blend 2/16 · capsule', qtyKg: 4200, valueUsd: 512000, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNTAO', pod: 'MGTMM', via: 'SGSIN', carrier: 'COSCO', vessel: 'Booking pending', container: 'Pending',
      etd: d(21), eta: d(55), ata: null, status: 'Booked', delayed: false, delayReason: null, delayNote: '', progress: 8,
      mbl: '', docs: { ci: false, pl: false, bl: false, co: false, msds: false, sgs: false },
      etaHistory: [{ eta: d(55), on: d(-1), by: 'u1', note: 'Provisional — FY27 capsule' }],
      comments: []
    },
    {
      id: 'SHP-2026-1051', po: 'PO-26127', buyer: 'ZARA', supplier: { name: 'Newtimes Group', country: 'China', city: 'Dongguan' },
      commodity: 'Cotton chenille 7/2 · SS27 dev', qtyKg: 9800, valueUsd: 64300, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNYTN', pod: 'MGTMM', via: 'LKCMB', carrier: 'Maersk', vessel: 'MAERSK SELETAR V.034E', container: 'Pending',
      etd: d(4), eta: d(42), ata: null, status: 'Ready to Ship', delayed: false, delayReason: null, delayNote: '', progress: 40,
      mbl: '', docs: { ci: false, pl: true, bl: false, co: false, msds: false, sgs: false },
      etaHistory: [{ eta: d(42), on: d(-3), by: 'u2', note: 'On first sailing after CNY backlog clearance' }],
      comments: []
    },
    /* ---- history (received) for KPIs & delay analytics ---- */
    {
      id: 'SHP-2026-1039', po: 'PO-26088', buyer: 'M&S', supplier: { name: 'Consinee Group', country: 'China', city: 'Ningbo' },
      commodity: 'Recycled wool 2/14 · charcoal', qtyKg: 7600, valueUsd: 154000, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNNGB', pod: 'MGTMM', via: 'LKCMB', carrier: 'Maersk', vessel: 'MAERSK SELETAR V.028E', container: 'MSKU 7710224 · 1×40HQ',
      etd: d(-52), eta: d(-12), ata: d(-14), status: 'Received', delayed: false, delayReason: null, delayNote: '', progress: 100,
      mbl: 'MAEU-2599821', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: true }, etaHistory: [], comments: []
    },
    {
      id: 'SHP-2026-1038', po: 'PO-26079', buyer: 'H&M', supplier: { name: 'Zhejiang Xinao', country: 'China', city: 'Tongxiang' },
      commodity: 'Cotton 21/2 · ecru', qtyKg: 16800, valueUsd: 88200, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNSHA', pod: 'MGTMM', via: 'SGSIN', carrier: 'MSC', vessel: 'MSC VIGILANCE V.238W', container: 'MSCU 3306814 · 1×40HQ',
      etd: d(-60), eta: d(-25), ata: d(-19), status: 'Received', delayed: true, delayReason: 'D07', delayNote: 'Shanghai port closed 3 days — typhoon weather anchorage.', progress: 100,
      mbl: 'MSCU-6612204', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: true },
      etaHistory: [{ eta: d(-25), on: d(-58), by: 'u2', note: 'Initial' }, { eta: d(-19), on: d(-30), by: 'u2', note: '+6d — typhoon closure Shanghai' }], comments: []
    },
    {
      id: 'SHP-2026-1037', po: 'PO-26071', buyer: 'Tommy Hilfiger', supplier: { name: 'Newtimes Group', country: 'China', city: 'Dongguan' },
      commodity: 'Merino 56/2 · navy melange', qtyKg: 8200, valueUsd: 171500, incoterm: 'CIF', mode: 'Sea',
      pol: 'CNYTN', pod: 'MGTMM', via: 'SGSIN', carrier: 'CMA CGM', vessel: 'CMA CGM RACINE V.0TR', container: 'CMAU 9910742 · 1×40HQ',
      etd: d(-58), eta: d(-22), ata: d(-22), status: 'Received', delayed: false, delayReason: null, delayNote: '', progress: 100,
      mbl: 'CMDU-7701128', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: true }, etaHistory: [], comments: []
    },
    {
      id: 'SHP-2026-1036', po: 'PO-26066', buyer: 'Decathlon', supplier: { name: 'ERDOS Group', country: 'China', city: 'Ordos' },
      commodity: 'Cotton/Acrylic 30/1 · heather', qtyKg: 14200, valueUsd: 79300, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNTAO', pod: 'MGTMM', via: 'DJJIB', carrier: 'COSCO', vessel: 'COSCO EUROPE V.102W', container: 'COSU 2218404 · 2×40HQ',
      etd: d(-65), eta: d(-33), ata: d(-33), status: 'Received', delayed: false, delayReason: null, delayNote: '', progress: 100,
      mbl: 'COSU-1182947', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: true }, etaHistory: [], comments: []
    },
    {
      id: 'SHP-2026-1035', po: 'PO-26058', buyer: 'ZARA', supplier: { name: 'Consinee Group', country: 'China', city: 'Ningbo' },
      commodity: 'Cashmere 2/26 · camel', qtyKg: 3800, valueUsd: 296000, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNNGB', pod: 'MGTMM', via: 'LKCMB', carrier: 'Maersk', vessel: 'MAERSK ELBA V.026E', container: 'MSKU 4108872 · 1×40HQ',
      etd: d(-84), eta: d(-48), ata: d(-41), status: 'Received', delayed: true, delayReason: 'D01', delayNote: 'Vessel omitted Colombo call — re-routed via Singapore, +7d.', progress: 100,
      mbl: 'MAEU-2581047', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: true },
      etaHistory: [{ eta: d(-48), on: d(-82), by: 'u2', note: 'Initial' }, { eta: d(-41), on: d(-55), by: 'u2', note: '+7d — Colombo omission, re-route SGSIN' }], comments: []
    },
    {
      id: 'SHP-2026-1034', po: 'PO-26049', buyer: 'GAP', supplier: { name: 'Zhejiang Xinao', country: 'China', city: 'Tongxiang' },
      commodity: 'Lambswool 3/16 · mix', qtyKg: 11400, valueUsd: 121900, incoterm: 'FOB', mode: 'Sea',
      pol: 'CNSHA', pod: 'MGTMM', via: 'SGSIN', carrier: 'MSC', vessel: 'MSC LYRA V.230W', container: 'MSCU 8803241 · 1×40HQ',
      etd: d(-91), eta: d(-56), ata: d(-52), status: 'Received', delayed: true, delayReason: 'D04', delayNote: 'CO description mismatch with CI — amended docs, customs release +4d.', progress: 100,
      mbl: 'MSCU-5512088', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: true }, etaHistory: [], comments: []
    },
    {
      id: 'SHP-2026-1033', po: 'PO-26042', buyer: 'UNIQLO', supplier: { name: 'ERDOS Group', country: 'China', city: 'Ordos' },
      commodity: 'Fine Merino 80/2 · 18.5µ', qtyKg: 9900, valueUsd: 268000, incoterm: 'CIF', mode: 'Sea',
      pol: 'CNTAO', pod: 'MGTMM', via: 'SGSIN', carrier: 'COSCO', vessel: 'COSCO PACIFIC V.096W', container: 'COSU 7719023 · 2×40HQ',
      etd: d(-98), eta: d(-63), ata: d(-61), status: 'Received', delayed: true, delayReason: 'D05', delayNote: 'Dye-lot variance flagged at SGS pre-shipment — re-check cost 2 days.', progress: 100,
      mbl: 'COSU-9011247', docs: { ci: true, pl: true, bl: true, co: true, msds: true, sgs: true }, etaHistory: [], comments: []
    }
  ];

  const samples = [
    { id: 'SMP-26-031', style: 'FK-2612', styleName: 'Cable crewneck 12GG', buyer: 'M&S', season: 'FW26', type: 'PP', qty: '3 pcs · S/M/L', requestedBy: 'u4', requestDate: d(-24), dueDate: d(6), status: 'Under Review', courier: 'FedEx', tracking: '7712 8834 5521', comments: [{ id: 'sc1', by: 'u1', text: 'PP shipped ' + d(-9) + ' via FedEx, POD scan at buyer DC.', at: ts(200) }] },
    { id: 'SMP-26-030', style: 'FK-2608', styleName: 'Raglan cardigan 7GG', buyer: 'H&M', season: 'FW26', type: 'TOP', qty: '2 pcs · M/L', requestedBy: 'u4', requestDate: d(-26), dueDate: d(2), status: 'Courier Out', courier: 'DHL', tracking: 'JD0146 003 882 19', comments: [] },
    { id: 'SMP-26-029', style: 'FK-2599', styleName: 'Turtleneck dress 5GG', buyer: 'ZARA', season: 'FW26', type: 'Fit', qty: '4 pcs · XS–L', requestedBy: 'u6', requestDate: d(-38), dueDate: d(-3), status: 'Under Review', courier: 'DHL', tracking: 'JD0146 002 114 76', comments: [{ id: 'sc2', by: 'u6', text: 'Fit changes on waist shaping — chasing Zara feedback before we cut the redo. Please hold.', at: ts(40) }] },
    { id: 'SMP-26-028', style: 'FK-2614', styleName: 'Half-zip knit 14GG', buyer: 'UNIQLO', season: 'FW26', type: 'Size Set', qty: '6 pcs · XS–XXL', requestedBy: 'u6', requestDate: d(-15), dueDate: d(10), status: 'In Development', courier: null, tracking: null, comments: [] },
    { id: 'SMP-26-027', style: 'FK-2601', styleName: 'Mohair crew · rose haze', buyer: 'Tommy Hilfiger', season: 'FW26', type: 'Proto', qty: '1 pc · M', requestedBy: 'u5', requestDate: d(0), dueDate: d(14), status: 'Requested', courier: null, tracking: null, comments: [] },
    { id: 'SMP-26-026', style: 'FK-2587', styleName: 'Cable vest 10GG', buyer: 'GAP', season: 'FW26', type: 'PP', qty: '3 pcs · S/M/L', requestedBy: 'u5', requestDate: d(-40), dueDate: d(-9), status: 'Approved', courier: 'FedEx', tracking: '7712 0021 4409', comments: [] },
    { id: 'SMP-26-025', style: 'FK-2604', styleName: 'Funnel neck 5GG fleece-blend', buyer: 'Decathlon', season: 'FW26', type: 'SMS', qty: '2 pcs · M/L', requestedBy: 'u5', requestDate: d(-12), dueDate: d(4), status: 'In Development', courier: null, tracking: null, comments: [] },
    { id: 'SMP-26-024', style: 'FK-2591', styleName: 'Rib beanie & snood set', buyer: 'M&S', season: 'FW26', type: 'Proto', qty: '3 sets', requestedBy: 'u4', requestDate: d(-45), dueDate: d(-16), status: 'Redo', courier: 'DHL', tracking: 'JD0146 001 887 30', comments: [{ id: 'sc3', by: 'u5', text: 'Redo approved: gauge off by 0.5 ppp on 12GG. New needle plan shared with the knitting floor.', at: ts(300) }] },
    { id: 'SMP-26-023', style: 'FK-2580', styleName: 'Cardigan w/ horn buttons', buyer: 'UNIQLO', season: 'FW26', type: 'TOP', qty: '2 pcs · M/L', requestedBy: 'u6', requestDate: d(-52), dueDate: d(-21), status: 'Approved', courier: 'DHL', tracking: 'JD0146 001 220 65', comments: [] },
    { id: 'SMP-26-022', style: 'FK-2576', styleName: 'Dress 8GG · asymmetric', buyer: 'ZARA', season: 'SS27', type: 'PP', qty: '3 pcs · S/M/L', requestedBy: 'u6', requestDate: d(-61), dueDate: d(-30), status: 'Approved', courier: 'FedEx', tracking: '7712 0018 7742', comments: [] }
  ];

  const accessories = [
    { id: 'ACC-26-117', item: 'Horn buttons 18L · 4-hole', spec: 'Natural horn, laser-engraved FK', supplier: 'Botany Trims', po: 'TR-88213', ordered: 48000, received: 0, unit: 'pcs', orderDate: d(-20), requiredDate: d(8), status: 'In Transit', shipmentId: 'SHP-2026-1049' },
    { id: 'ACC-26-116', item: 'YKK zip 18cm · navy', spec: 'YKK® VISLON #5, auto-lock', supplier: 'YKK (Shanghai)', po: 'TR-88190', ordered: 12000, received: 0, unit: 'pcs', orderDate: d(-12), requiredDate: d(2), status: 'In Transit', shipmentId: 'SHP-2026-1045' },
    { id: 'ACC-26-115', item: 'Woven main label · FK crest', spec: 'Damask, 30×50mm, fold-end', supplier: 'Label One', po: 'TR-88155', ordered: 60000, received: 60000, unit: 'pcs', orderDate: d(-35), requiredDate: d(-5), status: 'Received', shipmentId: null },
    { id: 'ACC-26-114', item: 'Care label set FR/EN/MG', spec: 'Satin print, 25×35mm', supplier: 'Label One', po: 'TR-88156', ordered: 80000, received: 65000, unit: 'pcs', orderDate: d(-35), requiredDate: d(6), status: 'Shortage', shipmentId: null },
    { id: 'ACC-26-113', item: 'Hangtag FW26 · recycled board', spec: '350gsm kraft, cotton cord', supplier: 'Papier Agencies', po: 'TR-88170', ordered: 25000, received: 0, unit: 'pcs', orderDate: d(-8), requiredDate: d(15), status: 'Ordered', shipmentId: null },
    { id: 'ACC-26-112', item: 'Polybag 30×40 · recycled LDPE', spec: '30µ, self-seal, vent holes', supplier: 'MadaPack SARL', po: 'TR-88168', ordered: 40000, received: 0, unit: 'pcs', orderDate: d(-6), requiredDate: d(9), status: 'Ordered', shipmentId: null },
    { id: 'ACC-26-111', item: 'Corozo buttons 20L · walnut', spec: 'Tagua nut, matte finish', supplier: 'Botany Trims', po: 'TR-88214', ordered: 24000, received: 0, unit: 'pcs', orderDate: d(-2), requiredDate: d(21), status: 'Planned', shipmentId: null },
    { id: 'ACC-26-110', item: 'Neck tape 20mm · navy', spec: 'Herringbone twill, FK jacquard', supplier: 'Label One', po: 'TR-88142', ordered: 30000, received: 0, unit: 'm', orderDate: d(-28), requiredDate: d(1), status: 'In Transit', shipmentId: 'SHP-2026-1044' },
    { id: 'ACC-26-109', item: 'Suede elbow patches', spec: 'Goat suede, ochre, 55×75mm', supplier: 'Botany Trims', po: 'TR-88101', ordered: 6000, received: 6000, unit: 'pcs', orderDate: d(-48), requiredDate: d(12), status: 'Received', shipmentId: null },
    { id: 'ACC-26-108', item: 'Knit size tabs · XS–XXL', spec: 'Woven tab, colour-coded', supplier: 'MadaPack SARL', po: 'TR-88112', ordered: 12000, received: 4000, unit: 'pcs', orderDate: d(-50), requiredDate: d(-2), status: 'Shortage', shipmentId: null }
  ];

  const activity = [
    { ts: ts(120), userId: 'u4', module: 'shipment', refId: 'SHP-2026-1042', action: 'Commented', detail: 'Asked for ETA confirmation — FW26 W39 knit slot depends on cashmere lot.' },
    { ts: ts(96),  userId: 'u2', module: 'shipment', refId: 'SHP-2026-1042', action: 'ETA updated', detail: 'ETA ' + d(1) + ' → ' + d(5) + ' · +4d Colombo congestion' },
    { ts: ts(72),  userId: 'u3', module: 'shipment', refId: 'SHP-2026-1044', action: 'Delay reported', detail: 'D03 · Customs inspection hold at Toamasina' },
    { ts: ts(60),  userId: 'u6', module: 'shipment', refId: 'SHP-2026-1043', action: 'Commented', detail: 'Requested early SGS booking for the UNIQLO rib program.' },
    { ts: ts(48),  userId: 'u4', module: 'shipment', refId: 'SHP-2026-1044', action: 'Commented', detail: 'Escalated Zara W38 loading plan dependency.' },
    { ts: ts(40),  userId: 'u6', module: 'sample',   refId: 'SMP-26-029',    action: 'Commented', detail: 'Holding redo until Zara fit feedback.' },
    { ts: ts(30),  userId: 'u5', module: 'shipment', refId: 'SHP-2026-1049', action: 'Commented', detail: 'Decathlon line loading vs button ETA check.' },
    { ts: ts(24),  userId: 'u1', module: 'sample',   refId: 'SMP-26-031',    action: 'Status changed', detail: 'Courier Out → Under Review (FedEx 7712 8834 5521)' },
    { ts: ts(20),  userId: 'u4', module: 'shipment', refId: 'SHP-2026-1048', action: 'Commented', detail: 'Set latest factory receipt deadline ' + d(40) + ' for M&S mid-Nov start.' },
    { ts: ts(12),  userId: 'u2', module: 'accessory', refId: 'ACC-26-116',   action: 'Status changed', detail: 'Ordered → In Transit (linked SHP-2026-1045, air)' },
    { ts: ts(6),   userId: 'u3', module: 'accessory', refId: 'ACC-26-114',   action: 'Shortage flagged', detail: 'Care labels 65k/80k received — balance on next Label One lot.' },
    { ts: ts(2),   userId: 'u5', module: 'sample',   refId: 'SMP-26-027',    action: 'Sample requested', detail: 'Proto · Tommy Hilfiger · mohair crew, due ' + d(14) }
  ].map((a, i) => Object.assign({ id: 'a' + i }, a));

  return {
    meta: {
      company: 'FlexKnit Factories', app: 'FlexKnit Link', tagline: 'Logistics × Merchandising Control Tower',
      site: 'Antananarivo · Madagascar', hub: 'Toamasina Port', seededAt: new Date().toISOString()
    },
    users, catalog, shipments, samples, accessories, activity
  };
}

module.exports = { build };
