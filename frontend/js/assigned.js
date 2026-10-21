// =========================================================
// ASSIGNED TO ME PAGE JAVASCRIPT (staff)
// =========================================================

const API_BASE_URL = "http://localhost:3000";

const assignedRows = document.getElementById("assignedRows");
const errorMessage = document.getElementById("errorMessage");

const detailEmpty = document.getElementById("detailEmpty");
const detailPanel = document.getElementById("detailPanel");

let assignedComplaints = [];

// =========================================================
// HELPERS
// =========================================================

function escapeHtml(value) {
  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}

function getPriorityClass(priority) {
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

function getStatusClass(status) {
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

// =========================================================
// LOAD ASSIGNED COMPLAINTS
// =========================================================

async function loadAssigned() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/complaints/assigned`, {
      credentials: "include",
    });

    // Not logged in -> go to login page
    if (response.status === 401) {
      window.location.href = "login.html";

      return;
    }

    const result = await response.json();

    console.log("Assigned Complaints API:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load assigned complaints.");
    }

    assignedComplaints = result.complaints;

    renderRows();
  } catch (error) {
    console.error("Error loading assigned complaints:", error);

    assignedRows.innerHTML = "";

    errorMessage.textContent =
      error.message || "Something went wrong while loading your complaints.";

    errorMessage.classList.remove("d-none");
  }
}

// =========================================================
// TABLE
// =========================================================

function renderRows() {
  if (assignedComplaints.length === 0) {
    assignedRows.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    No complaints are assigned to you yet.
                </td>
            </tr>
        `;

    return;
  }

  assignedRows.innerHTML = assignedComplaints
    .map(
      (c) => `
        <tr data-id="${c.id}">
            <td><strong>#${escapeHtml(c.id)}</strong></td>
            <td>${escapeHtml(c.title)}</td>
            <td>${escapeHtml(c.user_name)}</td>
            <td>
                <span class="badge ${getPriorityClass(c.priority)}">
                    ${escapeHtml(c.priority)}
                </span>
            </td>
            <td>
                <span class="badge ${getStatusClass(c.status)}">
                    ${escapeHtml(c.status)}
                </span>
            </td>
        </tr>
    `,
    )
    .join("");
}

assignedRows.addEventListener("click", function (event) {
  const row = event.target.closest("tr[data-id]");

  if (row) {
    showDetails(Number(row.dataset.id));
  }
});

// =========================================================
// DETAILS
// =========================================================

function showDetails(id) {
  const c = assignedComplaints.find((item) => item.id === id);

  if (!c) {
    return;
  }

  document.getElementById("detailTitle").textContent = c.title;

  document.getElementById("detailMeta").textContent =
    `${c.category} · submitted by ${c.user_name} · ` +
    new Date(c.created_at).toLocaleDateString("en-GB");

  document.getElementById("detailDescription").textContent = c.description;

  const image = document.getElementById("detailImage");

  if (c.image_path) {
    image.src = `${API_BASE_URL}/${c.image_path}`;
    image.classList.remove("d-none");
  } else {
    image.classList.add("d-none");
  }

  detailEmpty.classList.add("d-none");
  detailPanel.classList.remove("d-none");
}

// =========================================================
// START
// =========================================================

loadAssigned();
