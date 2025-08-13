// === CONFIG ===
const SHEET_ID = "19Iktmli0N9ECNHL33lPVuzM2dd3fD5dFqg5NqlBrt8Q";
const SHEET_GID = ""; // set if your data is not on the first tab

// Expected columns: Name | Website | Address | Email | Phone | State | City | Zip

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
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&range=A2:H`;
  return SHEET_GID ? `${base}&gid=${SHEET_GID}` : base;
}

function parseGviz(text){
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s);
  if (match && match[1]) return JSON.parse(match[1]);
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) return JSON.parse(text.slice(start, end + 1));
  throw new Error('Unrecognized GViz response');
}

// === LOAD ===
async function loadPrograms() {
  const status = by("status");
  status.textContent = "Loading programs…";
  try {
    const res = await fetch(gvizUrl(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parseGviz(await res.text());
    const rows = data?.table?.rows || [];
    // DEBUG: show raw rows and state column before mapping
console.log("Raw GViz rows count:", rows.length);
rows.forEach((r, i) => {
  const stateVal = r.c[5]?.v; // State column in A=0, so A=0,B=1,...F=5
  console.log(`Row ${i + 1} state raw value:`, JSON.stringify(stateVal));
});

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
    }); // keep all rows, even if name is blank
    // Debug: log all programs and their states
console.log("Loaded programs:", programs.map(p => [p.name, p.state]));
    

    if (!programs.length) {
      status.textContent = "No programs found. Check sharing, column order, or gid.";
      return;
    }

    status.remove();
    populateStateFilter();
    applyFilters();
  } catch (e) {
    console.error(e);
    status.textContent = "Error loading programs. Ensure the sheet is public and columns match.";
  }
}

// === FILTERS ===
function populateStateFilter() {
  const states = [...new Set(programs.map(p => p.state).filter(Boolean))].sort();
  const stateSel = by("stateFilter");
  stateSel.innerHTML = '<option value="">All States</option>';
  states.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s; opt.textContent = s;
    stateSel.appendChild(opt);
  });
  updateCityFilter();
}

function updateCityFilter() {
  const selectedState = norm(by("stateFilter").value);
  let cities = programs
    .filter(p => !selectedState || norm(p.state) === selectedState)
    .map(p => p.city).filter(Boolean);
  cities = [...new Set(cities)].sort();

  const citySel = by("cityFilter");
  citySel.innerHTML = '<option value="">All Cities</option>';
  cities.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    citySel.appendChild(opt);
  });
}

function applyFilters() {
  const q  = norm(by("search").value);
  const st = norm(by("stateFilter").value);
  const ct = norm(by("cityFilter").value);

  filtered = programs.filter(p => {
    const matchesText = !q || norm(p.name).includes(q);
    const matchesState = !st || norm(p.state) === st;
    const matchesCity  = !ct || norm(p.city) === ct;
    return matchesText && matchesState && matchesCity;
  });

  currentPage = 1;
  render();
}

// === RENDER ===
function render() { renderList(); renderPagination(); }

function renderList() {
  const root = by("programList");
  root.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "status";
    empty.textContent = "No matching programs.";
    root.appendChild(empty); return;
  }

  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  pageItems.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    const website = p.website && /^https?:\/\//i.test(p.website) ? p.website : (p.website ? `https://${p.website}` : "");

    const emailClass = p.email && p.email.length > 25 ? "meta long-email" : "meta";
    const emailText  = p.email || "—";

    card.innerHTML = `
      <h3>${p.name}</h3>
      <p class="meta"><strong>Address:</strong> ${p.address || "—"}</p>
      <p class="meta"><strong>Phone:</strong> ${p.phone || "—"}</p>
      <p class="${emailClass}"><strong>Email:</strong> <span class="email-text">${emailText}</span></p>
      ${website ? `<p style="margin-top:12px;"><a target="_blank" rel="noopener" href="${website}">Visit Website</a></p>` : ""}
    `;
    root.appendChild(card);
  });
}

function renderPagination() {
  const total = Math.ceil(filtered.length / perPage);
  const nav = by("pagination");
  nav.innerHTML = "";
  if (total <= 1) return;

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = currentPage === 1;
  prev.onclick = () => { currentPage--; render(); };
  nav.appendChild(prev);

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

// === EVENTS ===
by("search").addEventListener("input", applyFilters);
by("stateFilter").addEventListener("change", () => { updateCityFilter(); applyFilters(); });
by("cityFilter").addEventListener("change", applyFilters);

// === INIT ===
loadPrograms();
