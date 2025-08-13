const sheetID = "19Iktmli0N9ECNHL33lPVuzM2dd3fD5dFqg5NqlBrt8Q";
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

let programs = [];
let filteredPrograms = [];
let currentPage = 1;
const itemsPerPage = 12;

async function fetchPrograms() {
  try {
    const res = await fetch(sheetURL);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));
    programs = json.table.rows.map(row => ({
      name: row.c[0]?.v || "",
      website: row.c[1]?.v || "",
      address: row.c[2]?.v || "",
      email: row.c[3]?.v || "",
      phone: row.c[4]?.v || "",
      state: row.c[5]?.v || "",
      city: row.c[6]?.v || "",
      zip: row.c[7]?.v || ""
    }));
    filteredPrograms = [...programs];
    populateFilters();
    displayPrograms();
  } catch (error) {
    console.error("Error fetching programs:", error);
  }
}

function populateFilters() {
  const states = [...new Set(programs.map(p => p.state).filter(Boolean))].sort();
  const stateFilter = document.getElementById("stateFilter");
  states.forEach(state => {
    const opt = document.createElement("option");
    opt.value = state;
    opt.textContent = state;
    stateFilter.appendChild(opt);
  });

  const cities = [...new Set(programs.map(p => p.city).filter(Boolean))].sort();
  const cityFilter = document.getElementById("cityFilter");
  cities.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    cityFilter.appendChild(opt);
  });
}

function displayPrograms() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = filteredPrograms.slice(start, end);

  const container = document.getElementById("programList");
  container.innerHTML = "";

  paginated.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p><strong>Address:</strong> ${p.address}, ${p.city}, ${p.state} ${p.zip}</p>
      <p><strong>Phone:</strong> ${p.phone}</p>
      <p><strong>Email:</strong> <a href="mailto:${p.email}">${p.email}</a></p>
      <p><a href="${p.website}" target="_blank">Visit Website</a></p>
    `;
    container.appendChild(card);
  });

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    displayPrograms();
  };
  pagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    if (i === currentPage) {
      pageBtn.classList.add("active");
    }
    pageBtn.onclick = () => {
      currentPage = i;
      displayPrograms();
    };
    pagination.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    displayPrograms();
  };
  pagination.appendChild(nextBtn);
}

function filterPrograms() {
  const search = document.getElementById("search").value.toLowerCase();
  const state = document.getElementById("stateFilter").value;
  const city = document.getElementById("cityFilter").value;

  filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(search) &&
    (state === "" || p.state === state) &&
    (city === "" || p.city === city)
  );

  currentPage = 1;
  displayPrograms();
}

document.getElementById("search").addEventListener("input", filterPrograms);
document.getElementById("stateFilter").addEventListener("change", filterPrograms);
document.getElementById("cityFilter").addEventListener("change", filterPrograms);

fetchPrograms();
