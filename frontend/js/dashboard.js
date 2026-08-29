// Global Chart Instances
let chartStatus = null;
let chartCategory = null;
let chartMonthly = null;
let chartPriority = null;

// All complaints currently loaded for live table search
let currentComplaintsList = [];

// Base API URL
const API_BASE_URL = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
  ? window.location.origin
  : "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  // Set print date
  const printDateEl = document.getElementById("printReportDate");
  if (printDateEl) {
    printDateEl.textContent = `Generated on: ${new Date().toLocaleString()}`;
  }

  // Load initial data
  loadDashboard();

  // Event Listeners
  const filterForm = document.getElementById("filterForm");
  if (filterForm) {
    filterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      loadDashboard();
    });
  }

  const btnReset = document.getElementById("btnResetFilter");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      filterForm.reset();
      loadDashboard();
    });
  }

  const btnRefresh = document.getElementById("btnRefresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      loadDashboard();
    });
  }

  const btnExportCSV = document.getElementById("btnExportCSV");
  if (btnExportCSV) {
    btnExportCSV.addEventListener("click", exportCSV);
  }

  const btnExportPDF = document.getElementById("btnExportPDF");
  if (btnExportPDF) {
    btnExportPDF.addEventListener("click", () => {
      window.print();
    });
  }

  const tableSearch = document.getElementById("tableSearch");
  if (tableSearch) {
    tableSearch.addEventListener("input", (e) => {
      filterTableData(e.target.value);
    });
  }
});

// Helper: Get Current Filter Parameters
function getFilterQueryParams() {
  const status = document.getElementById("filterStatus")?.value || "All";
  const category = document.getElementById("filterCategory")?.value || "All";
  const priority = document.getElementById("filterPriority")?.value || "All";
  const startDate = document.getElementById("filterStartDate")?.value || "";
  const endDate = document.getElementById("filterEndDate")?.value || "";

  const params = new URLSearchParams();
  if (status !== "All") params.append("status", status);
  if (category !== "All") params.append("category", category);
  if (priority !== "All") params.append("priority", priority);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  return params.toString();
}

// Load All Dashboard Components
async function loadDashboard() {
  const queryStr = getFilterQueryParams();
  await Promise.all([
    fetchStats(queryStr),
    fetchCharts(queryStr),
  ]);
}

// 1. Fetch & Render Summary Statistics
async function fetchStats(queryStr) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/stats?${queryStr}`);
    const result = await res.json();

    if (result.success && result.data) {
      const { summary, recentComplaints } = result.data;
      
      document.getElementById("statTotal").textContent = summary.total ?? 0;
      document.getElementById("statPending").textContent = summary.pending ?? 0;
      document.getElementById("statInProgress").textContent = summary.inProgress ?? 0;
      document.getElementById("statResolved").textContent = summary.resolved ?? 0;
      document.getElementById("statRejected").textContent = summary.rejected ?? 0;
      document.getElementById("statResolutionRate").textContent = summary.resolutionRate ?? "0%";

      currentComplaintsList = recentComplaints || [];
      renderComplaintsTable(currentComplaintsList);
    }
  } catch (err) {
    console.warn("Could not load stats from API, using fallback demo view:", err);
    renderComplaintsTable([]);
  }
}

// 2. Fetch & Render Visual Charts
async function fetchCharts(queryStr) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/charts?${queryStr}`);
    const result = await res.json();

    if (result.success && result.data) {
      const { statusDistribution, categoryDistribution, monthlyTrends, priorityDistribution } = result.data;

      renderStatusChart(statusDistribution);
      renderCategoryChart(categoryDistribution);
      renderMonthlyTrendChart(monthlyTrends);
      renderPriorityChart(priorityDistribution);
    }
  } catch (err) {
    console.warn("Could not load charts from API:", err);
  }
}

// Render Status Doughnut Chart
function renderStatusChart(data = []) {
  const ctx = document.getElementById("chartStatus")?.getContext("2d");
  if (!ctx) return;

  const defaultStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];
  const countsMap = { Pending: 0, "In Progress": 0, Resolved: 0, Rejected: 0 };

  data.forEach((item) => {
    if (countsMap[item.status] !== undefined) {
      countsMap[item.status] = item.count;
    }
  });

  const chartData = {
    labels: defaultStatuses,
    datasets: [{
      data: defaultStatuses.map(s => countsMap[s]),
      backgroundColor: ["#f59e0b", "#0ea5e9", "#10b981", "#ef4444"],
      borderWidth: 2,
      borderColor: "#ffffff",
    }]
  };

  if (chartStatus) chartStatus.destroy();

  chartStatus = new Chart(ctx, {
    type: "doughnut",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
      cutout: "68%",
    }
  });
}

// Render Category Bar Chart
function renderCategoryChart(data = []) {
  const ctx = document.getElementById("chartCategory")?.getContext("2d");
  if (!ctx) return;

  const labels = data.map(d => d.category);
  const counts = data.map(d => d.count);

  if (chartCategory) chartCategory.destroy();

  chartCategory = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.length ? labels : ["No Data"],
      datasets: [{
        label: "Number of Complaints",
        data: counts.length ? counts : [0],
        backgroundColor: "#4f46e5",
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Render Monthly Trends Line Chart
function renderMonthlyTrendChart(data = []) {
  const ctx = document.getElementById("chartMonthly")?.getContext("2d");
  if (!ctx) return;

  const labels = data.map(d => d.monthLabel);
  const totals = data.map(d => d.total);
  const resolved = data.map(d => d.resolved);

  if (chartMonthly) chartMonthly.destroy();

  chartMonthly = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length ? labels : ["Current"],
      datasets: [
        {
          label: "Total Complaints Logged",
          data: totals.length ? totals : [0],
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
        },
        {
          label: "Complaints Resolved",
          data: resolved.length ? resolved : [0],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: { position: "top" }
      }
    }
  });
}

// Render Priority Polar/Pie Chart
function renderPriorityChart(data = []) {
  const ctx = document.getElementById("chartPriority")?.getContext("2d");
  if (!ctx) return;

  const priorities = ["High", "Medium", "Low"];
  const countsMap = { High: 0, Medium: 0, Low: 0 };

  data.forEach((item) => {
    if (countsMap[item.priority] !== undefined) {
      countsMap[item.priority] = item.count;
    }
  });

  if (chartPriority) chartPriority.destroy();

  chartPriority = new Chart(ctx, {
    type: "pie",
    data: {
      labels: priorities,
      datasets: [{
        data: priorities.map(p => countsMap[p]),
        backgroundColor: ["#ef4444", "#f97316", "#94a3b8"],
        borderWidth: 2,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// Render Complaints Table
function renderComplaintsTable(complaints = []) {
  const tbody = document.getElementById("complaintsTableBody");
  if (!tbody) return;

  if (complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No complaints found matching current filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = complaints.map(c => {
    const statusClass = getStatusBadgeClass(c.status);
    const priorityClass = getPriorityBadgeClass(c.priority);
    const formattedDate = c.created_at ? new Date(c.created_at).toLocaleDateString() : "N/A";

    return `
      <tr>
        <td class="fw-bold">#${c.id}</td>
        <td>
          <div class="fw-semibold text-dark">${escapeHtml(c.title)}</div>
          <small class="text-muted text-truncate d-inline-block" style="max-width: 250px;">
            ${escapeHtml(c.description || "")}
          </small>
        </td>
        <td>
          <div class="small fw-semibold">${escapeHtml(c.user_name || "N/A")}</div>
          <small class="text-muted">${escapeHtml(c.user_email || "")}</small>
        </td>
        <td><span class="badge bg-light text-dark border">${escapeHtml(c.category)}</span></td>
        <td><span class="badge ${priorityClass}">${escapeHtml(c.priority)}</span></td>
        <td><span class="badge ${statusClass}">${escapeHtml(c.status)}</span></td>
        <td class="text-muted small">${formattedDate}</td>
      </tr>
    `;
  }).join("");
}

// Client-Side Live Filter on Recent Complaints Table
function filterTableData(searchTerm = "") {
  const query = searchTerm.toLowerCase().trim();
  if (!query) {
    renderComplaintsTable(currentComplaintsList);
    return;
  }

  const filtered = currentComplaintsList.filter(c => 
    (c.title && c.title.toLowerCase().includes(query)) ||
    (c.category && c.category.toLowerCase().includes(query)) ||
    (c.user_name && c.user_name.toLowerCase().includes(query)) ||
    (c.status && c.status.toLowerCase().includes(query)) ||
    String(c.id).includes(query)
  );

  renderComplaintsTable(filtered);
}

// Export CSV Report
function exportCSV() {
  const queryStr = getFilterQueryParams();
  const exportUrl = `${API_BASE_URL}/api/dashboard/export/csv?${queryStr}`;
  window.open(exportUrl, "_blank");
}

// Helper Badge Classes
function getStatusBadgeClass(status) {
  switch (status) {
    case "Pending": return "badge-status-pending";
    case "In Progress": return "badge-status-in-progress";
    case "Resolved": return "badge-status-resolved";
    case "Rejected": return "badge-status-rejected";
    default: return "bg-secondary";
  }
}

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case "High": return "badge-priority-high";
    case "Medium": return "badge-priority-medium";
    case "Low": return "badge-priority-low";
    default: return "bg-light text-dark";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
