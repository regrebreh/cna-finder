// === CONFIG ===
const SHEET_ID = "19Iktmli0N9ECNHL33lPVuzM2dd3fD5dFqg5NqlBrt8Q";
// If your data isn't on the first sheet/tab, set its gid below (from the sheet URL). Otherwise leave "".
const SHEET_GID = ""; // e.g., "0" or "123456789"

// Expected columns (left to right): Name | Website | Address | Email | Phone | State | City | Zip

// === STATE ===
let programs = [];
let filtered = [];
let currentPage = 1;
const perPage = 12;

// === HELPERS ===
const by = id => document.getElementById(id);
const safe = v => (v ?? "").toString().trim();
const norm = v => safe(v).toLowerCase();

function gvizUrl() {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
  return SHEET_GID ? `${base}&gid=${SHEET_GID}` : base;
}

function parseGviz(text){
  // Try robust regex capture first
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s);
  if (match && match[1]) {
    return JSON.parse(match[1]);
  }
  // Fallback: slice first { to last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return JSON.parse(text.slice(start, end + 1));
  }
  throw new Error('Unrecognized GViz response');
}

// === FETCH & PARSE ===
async function loadPrograms() {
  const status = by("status");
  status.textContent = "Loading programs…";
  try {
    const res = await fetch(gvizUrl(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const data = parseGviz(text);

    const rows = data?.table?.rows || [];
    console.log("[CNA] rows fetched:", rows.length);

    programs = rows.map(r => {
      const c = r.c || [];
      const name   = safe(c[0]?.v);
      const site   = safe(c[1]?.v);
      const street = safe(c[2]?.v);
      const email  = safe(c[3]?.v);
      const phone  = safe(c[4]?.v);
      const state  = safe(c[5]?.v);
      const city   = safe(c[6]?.v);
      const zip    = safe(c[7]?.v);
      const address = [street, city, state, zip].filter(Boolean).join(", ");
      return { name, website: site, address, email, phone, state, city, zip };
    }).filter(p => p.name);

    if (!programs.length) {
      status.textContent = "No programs found. Check: (1) Sheet sharing is 'Anyone with link can view', (2) Column order matches, (3) Correct sheet tab (gid).";
      return;
    }

    status.remove();
    populateFilters();
    applyFilters();
  } catch (err) {
    console.error("[CNA] fetch/parse error:", err);
    by("status").textContent = "Error loading programs. Make sure the Google Sheet is public and the column order is correct.";
  }
}

// === FILTERS ===
function populateFilters() {
  const states = [...new Set(programs.map(p => p.state).filter(Boolean))].sort();
  const stateSel = by("stateFilter");
  stateSel.innerHTML = '<option value="">All States</option>';
  states.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    stateSel.appendChild(opt);
  });

  const cities = [...new Set(programs.map(p => p.city).filter(Boolean))].sort();
  const citySel = by("cityFilter");
  citySel.innerHTML = '<option value="">All Cities</option>';
  cities.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    citySel.appendChild(opt);
  });
}

function applyFilters() {
  const q = norm(by("search").value);
  const st = norm(by("stateFilter").value);
  const ct = norm(by("cityFilter").value);

  filtered = programs.filter(p => {
    const matchesText =
      !q ||
      norm(p.name).includes(q) ||
      norm(p.address).includes(q) ||
      norm(p.city).includes(q) ||
      norm(p.state).includes(q) ||
      norm(p.zip).includes(q);

    const matchesState = !st || norm(p.state) === st;
    const matchesCity  = !ct || norm(p.city) === ct;
    return matchesText && matchesState && matchesCity;
  });

  currentPage = 1;
  render();
}

// === RENDER ===
function render() {
  renderList();
  renderPagination();
}

function renderList() {
  const root = by("programList");
  root.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "status";
    empty.textContent = "No matching programs.";
    root.appendChild(empty);
    return;
  }

  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  pageItems.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    const website = p.website && /^https?:\/\//i.test(p.website) ? p.website : (p.website ? `https://${p.website}` : "");
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p class="meta"><strong>Address:</strong> ${p.address || "—"}</p>
      <p class="meta"><strong>Phone:</strong> ${p.phone || "—"}</p>
      <p class="meta"><strong>Email:</strong> ${p.email ? `<a href="mailto:${p.email}">${p.email}</a>` : "—"}</p>
      ${website ? `<p><a target="_blank" rel="noopener" href="${website}">Visit Website</a></p>` : ""}
    `;
    root.appendChild(card);
  });
}

function renderPagination() {
  const total = Math.ceil(filtered.length / perPage);
  const nav = by("pagination");
  nav.innerHTML = "";
  if (total <= 1) return;

  // Prev
  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = currentPage === 1;
  prev.onclick = () => { currentPage--; render(); };
  nav.appendChild(prev);

  // Show only 3 numbers max, sliding window with ellipses at edges
  const maxVis = 3;
  let start = Math.max(1, currentPage - 1);
  let end = Math.min(total, start + maxVis - 1);
  if (end - start + 1 < maxVis) start = Math.max(1, end - maxVis + 1);

  if (start > 1) {
    nav.appendChild(makePageBtn(1));
    if (start > 2) addEllipsis(nav);
  }

  for (let i = start; i <= end; i++) nav.appendChild(makePageBtn(i));

  if (end < total) {
    if (end < total - 1) addEllipsis(nav);
    nav.appendChild(makePageBtn(total));
  }

  // Next
  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = currentPage === total;
  next.onclick = () => { currentPage++; render(); };
  nav.appendChild(next);
}

function makePageBtn(i){
  const b = document.createElement("button");
  b.className = "page-num" + (i === currentPage ? " active" : "");
  b.textContent = i;
  b.onclick = () => { currentPage = i; render(); };
  return b;
}
function addEllipsis(nav){
  const el = document.createElement("span");
  el.className = "page-ellipsis";
  el.textContent = "…";
  nav.appendChild(el);
}

// === WIRE EVENTS ===
by("search").addEventListener("input", applyFilters);
by("stateFilter").addEventListener("change", applyFilters);
by("cityFilter").addEventListener("change", applyFilters);

// === INIT ===
loadPrograms();
