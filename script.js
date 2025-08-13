let currentPage = 1;
let totalPages = 10;

function renderPageNumbers() {
    const pageNumbers = document.getElementById("pageNumbers");
    pageNumbers.innerHTML = "";

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        let span = document.createElement("span");
        span.textContent = i;
        span.style.fontWeight = (i === currentPage) ? "bold" : "normal";
        span.onclick = () => goToPage(i);
        pageNumbers.appendChild(span);
    }
}

function goToPage(page) {
    currentPage = page;
    renderPageNumbers();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPageNumbers();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderPageNumbers();
    }
}

function searchJobs() {
    alert("Searching jobs...");
}

document.addEventListener("DOMContentLoaded", () => {
    renderPageNumbers();
});
