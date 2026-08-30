// ============================================================
// ComplaintMS - Dashboard Frontend JavaScript
// ============================================================

let statusChart = null;
let categoryChart = null;
let monthlyChart = null;
let priorityChart = null;

let dashboardData = [];
let filteredComplaints = [];


// ============================================================
// DASHBOARD INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

  // ============================================================
  // DOM ELEMENTS
  // ============================================================

  const statTotal =
    document.getElementById("statTotal");

  const statPending =
    document.getElementById("statPending");

  const statInProgress =
    document.getElementById("statInProgress");

  const statResolved =
    document.getElementById("statResolved");

  const statRejected =
    document.getElementById("statRejected");

  const statResolutionRate =
    document.getElementById("statResolutionRate");

  const complaintsTableBody =
    document.getElementById("complaintsTableBody");

  const tableSearch =
    document.getElementById("tableSearch");

  const filterForm =
    document.getElementById("filterForm");

  const filterStatus =
    document.getElementById("filterStatus");

  const filterCategory =
    document.getElementById("filterCategory");

  const filterPriority =
    document.getElementById("filterPriority");

  const filterStartDate =
    document.getElementById("filterStartDate");

  const filterEndDate =
    document.getElementById("filterEndDate");

  const btnRefresh =
    document.getElementById("btnRefresh");

  const btnResetFilter =
    document.getElementById("btnResetFilter");

  const btnExportCSV =
    document.getElementById("btnExportCSV");

  const btnExportPDF =
    document.getElementById("btnExportPDF");


  // ============================================================
  // BUILD FILTER QUERY
  // ============================================================

  function buildQueryString() {

    const params =
      new URLSearchParams();

    if (
      filterStatus &&
      filterStatus.value &&
      filterStatus.value !== "All"
    ) {
      params.append(
        "status",
        filterStatus.value
      );
    }

    if (
      filterCategory &&
      filterCategory.value &&
      filterCategory.value !== "All"
    ) {
      params.append(
        "category",
        filterCategory.value
      );
    }

    if (
      filterPriority &&
      filterPriority.value &&
      filterPriority.value !== "All"
    ) {
      params.append(
        "priority",
        filterPriority.value
      );
    }

    if (
      filterStartDate &&
      filterStartDate.value
    ) {
      params.append(
        "startDate",
        filterStartDate.value
      );
    }

    if (
      filterEndDate &&
      filterEndDate.value
    ) {
      params.append(
        "endDate",
        filterEndDate.value
      );
    }

    const query =
      params.toString();

    return query
      ? `?${query}`
      : "";
  }


  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  async function loadDashboard() {

    try {

      showLoading();

      const queryString =
        buildQueryString();


      console.log(
        "CURRENT FILTERS:",
        {
          status:
            filterStatus?.value || "All",

          category:
            filterCategory?.value || "All",

          priority:
            filterPriority?.value || "All",

          startDate:
            filterStartDate?.value || "",

          endDate:
            filterEndDate?.value || ""
        }
      );


      // ========================================================
      // GET STATISTICS
      // ========================================================

      const statsResponse =
        await fetch(
          `/api/dashboard/stats${queryString}`
        );


      console.log(
        "FILTERED STATS RESPONSE:",
        statsResponse
      );


      if (!statsResponse.ok) {

        throw new Error(
          `Statistics request failed: ${statsResponse.status}`
        );

      }


      const statsData =
        await statsResponse.json();


      console.log(
        "Dashboard Stats:",
        statsData
      );


      // IMPORTANT:
      // Validate response BEFORE using statsData.data
      if (
        !statsData ||
        statsData.success !== true ||
        !statsData.data ||
        !statsData.data.summary
      ) {

        throw new Error(
          statsData?.message ||
          "Invalid statistics response"
        );

      }


      // ========================================================
      // SUMMARY
      // ========================================================

      const summary =
        statsData.data.summary;


      // ========================================================
      // UPDATE STATISTICS
      // ========================================================

      updateStatistics(
        summary
      );


      // ========================================================
      // COMPLAINT DATA
      // ========================================================

      dashboardData =
        Array.isArray(
          statsData.data.recentComplaints
        )
          ? statsData.data.recentComplaints
          : [];


      filteredComplaints =
        [...dashboardData];


      renderComplaintsTable(
        filteredComplaints
      );


      // ========================================================
      // GET CHART DATA
      // ========================================================

      const chartsResponse =
        await fetch(
          `/api/dashboard/charts${queryString}`
        );


      console.log(
        "Charts Response:",
        chartsResponse
      );


      if (!chartsResponse.ok) {

        throw new Error(
          `Charts request failed: ${chartsResponse.status}`
        );

      }


      const chartsData =
        await chartsResponse.json();


      console.log(
        "Dashboard Charts:",
        chartsData
      );


      if (
        !chartsData ||
        chartsData.success !== true ||
        !chartsData.data
      ) {

        throw new Error(
          chartsData?.message ||
          "Invalid charts response"
        );

      }


      // ========================================================
      // RENDER CHARTS
      // ========================================================

      renderCharts(
        chartsData.data
      );


    } catch (error) {

      console.error(
        "Dashboard loading error:",
        error
      );


      showError(
        error?.message ||
        "Failed to load dashboard data."
      );

    }

  }


  // Make loadDashboard available in browser console
  window.loadDashboard =
    loadDashboard;


  // ============================================================
  // UPDATE STATISTICS
  // ============================================================

  function updateStatistics(summary) {

    const total =
      Number(summary?.total || 0);

    const pending =
      Number(summary?.pending || 0);

    const inProgress =
      Number(summary?.inProgress || 0);

    const resolved =
      Number(summary?.resolved || 0);

    const rejected =
      Number(summary?.rejected || 0);


    let resolutionRate =
      summary?.resolutionRate;


    if (
      resolutionRate === undefined ||
      resolutionRate === null ||
      resolutionRate === ""
    ) {

      resolutionRate =
        total > 0
          ? `${Math.round(
            (resolved / total) * 100
          )}%`
          : "0%";

    } else if (
      typeof resolutionRate === "number"
    ) {

      resolutionRate =
        `${resolutionRate}%`;

    }


    statTotal.textContent =
      total;

    statPending.textContent =
      pending;

    statInProgress.textContent =
      inProgress;

    statResolved.textContent =
      resolved;

    statRejected.textContent =
      rejected;

    statResolutionRate.textContent =
      resolutionRate;

  }


  // ============================================================
  // RENDER CHARTS
  // ============================================================

  function renderCharts(data) {

    renderStatusChart(
      data?.statusDistribution || []
    );

    renderCategoryChart(
      data?.categoryDistribution || []
    );

    renderMonthlyChart(
      data?.monthlyTrends || []
    );

    renderPriorityChart(
      data?.priorityDistribution || []
    );

  }


  // ============================================================
  // STATUS CHART
  // ============================================================

  function renderStatusChart(data) {

    const canvas =
      document.getElementById(
        "chartStatus"
      );


    if (!canvas) {
      return;
    }


    if (
      typeof Chart === "undefined"
    ) {

      console.warn(
        "Chart.js is not loaded."
      );

      return;
    }


    if (statusChart) {

      statusChart.destroy();

      statusChart = null;

    }


    const labels =
      Array.isArray(data)
        ? data.map(
          item =>
            item.status ||
            "Unknown"
        )
        : [];


    const values =
      Array.isArray(data)
        ? data.map(
          item =>
            Number(
              item.count || 0
            )
        )
        : [];


    statusChart =
      new Chart(
        canvas,
        {
          type: "doughnut",

          data: {

            labels: labels,

            datasets: [
              {
                label:
                  "Complaints",

                data:
                  values,

                borderWidth:
                  1
              }
            ]

          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            plugins: {

              legend: {
                position:
                  "bottom"
              }

            }

          }

        }
      );

  }


  // ============================================================
  // CATEGORY CHART
  // ============================================================

  function renderCategoryChart(data) {

    const canvas =
      document.getElementById(
        "chartCategory"
      );


    if (!canvas) {
      return;
    }


    if (
      typeof Chart === "undefined"
    ) {

      console.warn(
        "Chart.js is not loaded."
      );

      return;
    }


    if (categoryChart) {

      categoryChart.destroy();

      categoryChart = null;

    }


    const labels =
      Array.isArray(data)
        ? data.map(
          item =>
            item.category ||
            "Unknown"
        )
        : [];


    const values =
      Array.isArray(data)
        ? data.map(
          item =>
            Number(
              item.count || 0
            )
        )
        : [];


    categoryChart =
      new Chart(
        canvas,
        {
          type: "bar",

          data: {

            labels: labels,

            datasets: [
              {
                label:
                  "Complaints",

                data:
                  values,

                borderWidth:
                  1
              }
            ]

          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            scales: {

              y: {

                beginAtZero:
                  true,

                ticks: {
                  precision: 0
                }

              }

            },

            plugins: {

              legend: {
                display:
                  false
              }

            }

          }

        }
      );

  }


  // ============================================================
  // MONTHLY TREND CHART
  // ============================================================

  function renderMonthlyChart(data) {

    const canvas =
      document.getElementById(
        "chartMonthly"
      );


    if (!canvas) {
      return;
    }


    if (
      typeof Chart === "undefined"
    ) {

      console.warn(
        "Chart.js is not loaded."
      );

      return;
    }


    if (monthlyChart) {

      monthlyChart.destroy();

      monthlyChart = null;

    }


    const labels =
      Array.isArray(data)
        ? data.map(
          item =>
            item.monthLabel ||
            item.month ||
            "Unknown"
        )
        : [];


    const totalValues =
      Array.isArray(data)
        ? data.map(
          item =>
            Number(
              item.total || 0
            )
        )
        : [];


    const resolvedValues =
      Array.isArray(data)
        ? data.map(
          item =>
            Number(
              item.resolved || 0
            )
        )
        : [];


    monthlyChart =
      new Chart(
        canvas,
        {
          type: "line",

          data: {

            labels: labels,

            datasets: [

              {
                label:
                  "Total Complaints",

                data:
                  totalValues,

                tension:
                  0.3,

                borderWidth:
                  2,

                fill:
                  false
              },

              {
                label:
                  "Resolved",

                data:
                  resolvedValues,

                tension:
                  0.3,

                borderWidth:
                  2,

                fill:
                  false
              }

            ]

          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            scales: {

              y: {

                beginAtZero:
                  true,

                ticks: {
                  precision: 0
                }

              }

            }

          }

        }
      );

  }


  // ============================================================
  // PRIORITY CHART
  // ============================================================

  function renderPriorityChart(data) {

    const canvas =
      document.getElementById(
        "chartPriority"
      );


    if (!canvas) {
      return;
    }


    if (
      typeof Chart === "undefined"
    ) {

      console.warn(
        "Chart.js is not loaded."
      );

      return;
    }


    if (priorityChart) {

      priorityChart.destroy();

      priorityChart = null;

    }


    const labels =
      Array.isArray(data)
        ? data.map(
          item =>
            item.priority ||
            "Unknown"
        )
        : [];


    const values =
      Array.isArray(data)
        ? data.map(
          item =>
            Number(
              item.count || 0
            )
        )
        : [];


    priorityChart =
      new Chart(
        canvas,
        {
          type: "pie",

          data: {

            labels: labels,

            datasets: [
              {
                label:
                  "Complaints",

                data:
                  values,

                borderWidth:
                  1
              }
            ]

          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            plugins: {

              legend: {
                position:
                  "bottom"
              }

            }

          }

        }
      );

  }


  // ============================================================
  // COMPLAINT TABLE
  // ============================================================

  function renderComplaintsTable(
    complaints
  ) {

    if (!complaintsTableBody) {
      return;
    }


    if (
      !Array.isArray(complaints) ||
      complaints.length === 0
    ) {

      complaintsTableBody.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="text-center py-4 text-muted"
          >
            No complaints found.
          </td>
        </tr>
      `;

      return;
    }


    complaintsTableBody.innerHTML =
      "";


    complaints.forEach(
      complaint => {

        const row =
          document.createElement(
            "tr"
          );


        row.innerHTML = `

          <td>
            <strong>
              #${escapeHtml(
          complaint.id
        )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
          complaint.title ||
          "-"
        )}
          </td>

          <td>
            ${escapeHtml(
          complaint.user_name ||
          complaint.user_email ||
          "Unknown"
        )}
          </td>

          <td>
            ${escapeHtml(
          complaint.category ||
          "-"
        )}
          </td>

          <td>
            <span
              class="badge ${getPriorityClass(
          complaint.priority
        )}"
            >
              ${escapeHtml(
          complaint.priority ||
          "-"
        )}
            </span>
          </td>

          <td>
            <span
              class="badge ${getStatusClass(
          complaint.status
        )}"
            >
              ${escapeHtml(
          complaint.status ||
          "-"
        )}
            </span>
          </td>

          <td>
            ${formatDate(
          complaint.created_at
        )}
          </td>

        `;


        complaintsTableBody.appendChild(
          row
        );

      }
    );

  }


  // ============================================================
  // TABLE SEARCH
  // ============================================================

  if (tableSearch) {

    tableSearch.addEventListener(
      "input",
      function () {

        const searchTerm =
          this.value
            .trim()
            .toLowerCase();


        if (!searchTerm) {

          filteredComplaints =
            [...dashboardData];

          renderComplaintsTable(
            filteredComplaints
          );

          return;
        }


        filteredComplaints =
          dashboardData.filter(
            complaint => {

              return (

                String(
                  complaint.id || ""
                )
                  .toLowerCase()
                  .includes(
                    searchTerm
                  )

                ||

                String(
                  complaint.title || ""
                )
                  .toLowerCase()
                  .includes(
                    searchTerm
                  )

                ||

                String(
                  complaint.user_name || ""
                )
                  .toLowerCase()
                  .includes(
                    searchTerm
                  )

                ||

                String(
                  complaint.user_email || ""
                )
                  .toLowerCase()
                  .includes(
                    searchTerm
                  )

                ||

                String(
                  complaint.category || ""
                )
                  .toLowerCase()
                  .includes(
                    searchTerm
                  )

                ||

                String(
                  complaint.priority || ""
                )
                  .toLowerCase()
                  .includes(
                    searchTerm
                  )

                ||

                String(
                  complaint.status || ""
                )
                  .toLowerCase()
                  .includes(
                    searchTerm
                  )

              );

            }
          );


        renderComplaintsTable(
          filteredComplaints
        );

      }
    );

  }


  // ============================================================
  // FILTER FORM
  // ============================================================

  if (filterForm) {

    filterForm.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();

        console.log(
          "APPLY FILTER CLICKED"
        );

        loadDashboard();

      }
    );

  }


  // ============================================================
  // FILTER CHANGE LOGGING
  // ============================================================

  if (filterStatus) {

    filterStatus.addEventListener(
      "change",
      function () {

        console.log(
          "Status changed:",
          this.value
        );

      }
    );

  }


  if (filterCategory) {

    filterCategory.addEventListener(
      "change",
      function () {

        console.log(
          "Category changed:",
          this.value
        );

      }
    );

  }


  if (filterPriority) {

    filterPriority.addEventListener(
      "change",
      function () {

        console.log(
          "Priority changed:",
          this.value
        );

      }
    );

  }


  // ============================================================
  // RESET FILTER
  // ============================================================

  if (btnResetFilter) {

    btnResetFilter.addEventListener(
      "click",
      function () {

        console.log(
          "RESET FILTER CLICKED"
        );


        if (filterStatus) {
          filterStatus.value =
            "All";
        }


        if (filterCategory) {
          filterCategory.value =
            "All";
        }


        if (filterPriority) {
          filterPriority.value =
            "All";
        }


        if (filterStartDate) {
          filterStartDate.value =
            "";
        }


        if (filterEndDate) {
          filterEndDate.value =
            "";
        }


        if (tableSearch) {
          tableSearch.value =
            "";
        }


        loadDashboard();

      }
    );

  }


  // ============================================================
  // REFRESH BUTTON
  // ============================================================

  if (btnRefresh) {

    btnRefresh.addEventListener(
      "click",
      function () {

        console.log(
          "REFRESH CLICKED"
        );

        loadDashboard();

      }
    );

  }


  // ============================================================
  // CSV EXPORT
  // ============================================================

  if (btnExportCSV) {

    btnExportCSV.addEventListener(
      "click",
      function () {

        exportCSV();

      }
    );

  }


  function exportCSV() {

    if (
      !Array.isArray(
        filteredComplaints
      ) ||
      filteredComplaints.length === 0
    ) {

      alert(
        "There are no complaints to export."
      );

      return;
    }


    const headers = [
      "ID",
      "Title",
      "User",
      "Email",
      "Category",
      "Priority",
      "Status",
      "Created Date",
      "Updated Date"
    ];


    const rows =
      filteredComplaints.map(
        complaint => [

          complaint.id,

          complaint.title,

          complaint.user_name ||
          "",

          complaint.user_email ||
          "",

          complaint.category ||
          "",

          complaint.priority ||
          "",

          complaint.status ||
          "",

          complaint.created_at ||
          "",

          complaint.updated_at ||
          ""

        ]
      );


    const csvRows = [
      headers,
      ...rows
    ];


    const csvContent =
      csvRows
        .map(
          row =>
            row
              .map(
                value =>
                  `"${String(
                    value ?? ""
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(",")
        )
        .join("\n");


    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      `complaint-report-${getDateStamp()}.csv`;


    document.body.appendChild(
      link
    );


    link.click();


    document.body.removeChild(
      link
    );


    URL.revokeObjectURL(
      url
    );

  }


  // ============================================================
  // PDF / PRINT
  // ============================================================

  if (btnExportPDF) {

    btnExportPDF.addEventListener(
      "click",
      function () {

        const printDate =
          document.getElementById(
            "printReportDate"
          );


        if (printDate) {

          printDate.textContent =
            `Generated on: ${new Date().toLocaleString()}`;

        }


        window.print();

      }
    );

  }


  // ============================================================
  // HELPERS
  // ============================================================

  function escapeHtml(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    return String(value)

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#039;"
      );

  }


  function getPriorityClass(
    priority
  ) {

    switch (priority) {

      case "High":
        return "bg-danger";

      case "Medium":
        return "bg-warning text-dark";

      case "Low":
        return "bg-success";

      default:
        return "bg-secondary";

    }

  }


  function getStatusClass(
    status
  ) {

    switch (status) {

      case "Pending":
        return "bg-warning text-dark";

      case "In Progress":
        return "bg-info text-dark";

      case "Resolved":
        return "bg-success";

      case "Rejected":
        return "bg-danger";

      default:
        return "bg-secondary";

    }

  }


  function formatDate(
    dateValue
  ) {

    if (!dateValue) {
      return "-";
    }


    const date =
      new Date(
        dateValue
      );


    if (
      isNaN(
        date.getTime()
      )
    ) {

      return String(
        dateValue
      );

    }


    return date.toLocaleDateString(
      "en-GB"
    );

  }


  function getDateStamp() {

    return new Date()
      .toISOString()
      .split("T")[0];

  }


  // ============================================================
  // LOADING STATE
  // ============================================================

  function showLoading() {

    statTotal.textContent =
      "--";

    statPending.textContent =
      "--";

    statInProgress.textContent =
      "--";

    statResolved.textContent =
      "--";

    statRejected.textContent =
      "--";

    statResolutionRate.textContent =
      "--%";


    if (complaintsTableBody) {

      complaintsTableBody.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="text-center py-4 text-muted"
          >

            <i
              class="fa-solid fa-spinner fa-spin me-2"
            ></i>

            Loading complaints data...

          </td>
        </tr>
      `;

    }

  }


  // ============================================================
  // ERROR STATE
  // ============================================================

  function showError(
    message
  ) {

    console.error(
      "Dashboard error:",
      message
    );


    statTotal.textContent =
      "0";

    statPending.textContent =
      "0";

    statInProgress.textContent =
      "0";

    statResolved.textContent =
      "0";

    statRejected.textContent =
      "0";

    statResolutionRate.textContent =
      "0%";


    if (complaintsTableBody) {

      complaintsTableBody.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="text-center text-danger py-4"
          >

            Failed to load dashboard data.

            <br>

            <small>
              ${escapeHtml(
        message
      )}
            </small>

          </td>
        </tr>
      `;

    }

  }


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  loadDashboard();

});