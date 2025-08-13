const SHEET_ID = "19Iktmli0N9ECNHL33lPVuzM2dd3fD5dFqg5NqlBrt8Q";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let programs = [];

fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47, text.length - 2)); // strip Google Sheets JSONP
    const rows = json.table.rows;

    programs = rows.map(row => ({
      name: row.c[0]?.v || "",
      website: row.c[1]?.v || "",
      address: row.c[2]?.v || "",
      email: row.c[3]?.v || "",
      phone: row.c[4]?.v || "",
      state: row.c[5]?.v || "",
      city: row.c[6]?.v || ""
    }));

    populateFilters();
    renderResults(programs);
  });

function populateFilters() {
  const stateSelect = document.getElementById("stateFilter");
  const citySelect = document.getElementById("cityFilter");

  const states = [...new Set(programs.map(p => p.state).filter(Boolean))].sort();
  states.forEach(state => {
    let option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });

  stateSelect.addEventListener("change", () => {
    const selectedState = stateSelect.value;
    const filteredCities = [...new Set(programs
      .filter(p => !selectedState || p.state === selectedState)
      .map(p => p.city)
      .filter(Boolean)
    )].sort();

    citySelect.innerHTML = "<option value=''>All Cities</option>";
    filteredCities.forEach(city => {
      let option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });

    filterResults();
  });

  citySelect.addEventListener("change", filterResults);
  document.getElementById("search").addEventListener("input", filterResults);
}

function filterResults() {
  const query = document.getElementById("search").value.toLowerCase();
  const state = document.getElementById("stateFilter").value;
  const city = document.getElementById("cityFilter").value;

  const filtered = programs.filter(p =>
    (!state || p.state === state) &&
    (!city || p.city === city) &&
    (p.name.toLowerCase().includes(query) ||
     p.address.toLowerCase().includes(query))
  );

  renderResults(filtered);
}

function renderResults(list) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>No programs found.</p>";
    return;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p><a href="${p.website}" target="_blank">${p.website}</a></p>
      <p>${p.address}</p>
      <p>${p.city}, ${p.state}</p>
      <p>${p.phone}</p>
      <p><a href="mailto:${p.email}">${p.email}</a></p>
    `;
    container.appendChild(card);
  });
}