const sheetId = "19Iktmli0N9ECNHL33lPVuzM2dd3fD5dFqg5NqlBrt8Q";
const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

let programs = [];
let filteredPrograms = [];
let currentPage = 1;
const itemsPerPage = 12;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Fetching data from Google Sheet...");
  fetch(sheetUrl)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text.substr(47).slice(0, -2));
      programs = json.table.rows.map(row => ({
        name: row.c[0]?.v || "",
        website: row.c[1]?.v || "",
        address: `${row.c[2]?.v || ''}, ${row.c[6]?.v || ''}, ${row.c[5]?.v || ''} ${row.c[7]?.v || ''}`,
        email: row.c[3]?.v || "",
        phone: row.c[4]?.v || "",
        state: row.c[5]?.v || "",
        city: row.c[6]?.v || "",
        zip: row.c[7]?.v || ""
      }));
      console.log("Programs loaded:", programs.length);
      populateFilters();
      applyFilters();
    })
    .catch(err => {
      console.error("Error fetching data:", err);
      document.getElementById("programList").innerHTML = "<p>Error loading programs.</p>";
    });

  document.getElementById("stateFilter").addEventListener("change", applyFilters);
  document.getElementById("cityFilter").addEventListener("change", applyFilters);
  document.getElementById("searchBox").addEventListener("input", applyFilters);
});

function populateFilters() {
  const stateSelect = document.getElementById("stateFilter");
  const citySelect = document.getElementById("cityFilter");

  const states = [...new Set(programs.map(p => p.state).filter(Boolean))].sort();
  const cities = [...new Set(programs.map(p => p.city).filter(Boolean))].sort();

  states.forEach(state => {
    const opt = document.createElement("option");
    opt.value = state;
    opt.textContent = state;
    stateSelect.appendChild(opt);
  });

  cities.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    citySelect.appendChild(opt);
  });
}

function applyFilters() {
  const state = document.getElementById("stateFilter").value.toLowerCase();
  const city = document.getElementById("cityFilter").value.toLowerCase();
  const search = document.getElementById("searchBox").value.toLowerCase();

  filteredPrograms = programs.filter(p =>
    (!state || p.state.toLowerCase() === state) &&
    (!city || p.city.toLowerCase() === city) &&
    (!search || p.name.toLowerCase().includes(search) ||
      p.address.toLowerCase().includes(search) ||
      p.city.toLowerCase().includes(search) ||
      p.state.toLowerCase().includes(search) ||
      p.zip.toLowerCase().includes(search))
  );

  currentPage = 1;
  renderPrograms();
}

function renderPrograms() {
  const programList = document.getElementById("programList");
  programList.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredPrograms.slice(startIndex, startIndex + itemsPerPage);

  paginatedItems.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p><strong>Address:</strong> ${p.address}</p>
      <p><strong>City:</strong> ${p.city}</p>
      <p><strong>State:</strong> ${p.state}</p>
      <p><strong>Zip:</strong> ${p.zip}</p>
      <p><strong>Phone:</strong> ${p.phone}</p>
      <p><strong>Email:</strong> <a href="mailto:${p.email}">${p.email}</a></p>
      <p><a href="${p.website}" target="_blank">Visit Website</a></p>
    `;
    programList.appendChild(card);
  });

  renderPagination();
}


function renderPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const maxVisible = 3;
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => { currentPage--; renderPrograms(); };
  pagination.appendChild(prevBtn);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => { currentPage = i; renderPrograms(); };
    pagination.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => { currentPage++; renderPrograms(); };
  pagination.appendChild(nextBtn);
}
);
    pagination.appendChild(btn);
  }
}
