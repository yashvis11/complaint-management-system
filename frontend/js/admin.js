// =========================================================
// ADMIN PANEL JAVASCRIPT
// =========================================================

const API_BASE_URL = "http://localhost:3000";

const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const statsRow = document.getElementById("statsRow");
const complaintRows = document.getElementById("complaintRows");

const detailEmpty = document.getElementById("detailEmpty");
const detailPanel = document.getElementById("detailPanel");
const updateForm = document.getElementById("updateForm");
const saveButton = document.getElementById("saveButton");
const assignedTo = document.getElementById("assignedTo");

let selectedId = null;

// =========================================================
// HELPERS
// =========================================================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function showError(message) {
  successMessage.classList.add("d-none");
  errorMessage.textContent = message;
  errorMessage.classList.remove("d-none");
}

// Wrapper: sends the cookie, redirects if not allowed, returns result.data
async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/admin${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (response.status === 401) {
    window.location.href = "login.html";
    throw new Error("Please login first");
  }

  if (response.status === 403) {
    window.location.href = "dashboard.html";
    throw new Error("Admin access required");
  }

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
}

// =========================================================
// STATISTICS
// =========================================================

async function loadStats() {
  const { data } = await api("/stats");

  const cards = [
    ["Total", data.total],
    ["Pending", data["Pending"]],
    ["In Progress", data["In Progress"]],
    ["Resolved", data["Resolved"]],
  ];

  statsRow.innerHTML = cards
    .map(
      ([label, value]) => `
        <div class="col-6 col-md-3">
            <div class="card card-body shadow-sm">
                <div class="text-muted small">${label}</div>
                <div class="fs-3">${value}</div>
            </div>
        </div>
    `,
    )
    .join("");
}

// =========================================================
// COMPLAINT LIST
// =========================================================

async function loadComplaints() {
  const { data } = await api("/complaints");

  if (data.length === 0) {
    complaintRows.innerHTML = `<tr><td colspan="4" class="text-muted">No complaints yet.</td></tr>`;
    return;
  }

  complaintRows.innerHTML = data
    .map(
      (c) => `
        <tr data-id="${c.id}" class="${c.id === selectedId ? "table-active" : ""}">
            <td>${escapeHtml(c.title)}</td>
            <td>${escapeHtml(c.user_name)}</td>
            <td>${escapeHtml(c.priority)}</td>
            <td>${escapeHtml(c.status)}</td>
        </tr>
    `,
    )
    .join("");
}

complaintRows.addEventListener("click", function (event) {
  const row = event.target.closest("tr[data-id]");

  if (row) {
    openComplaint(Number(row.dataset.id)).catch((e) => showError(e.message));
  }
});

// =========================================================
// COMPLAINT DETAILS
// =========================================================

async function loadStaff() {
  const { data } = await api("/staff");

  assignedTo.innerHTML =
    `<option value="">Unassigned</option>` +
    data
      .map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`)
      .join("");
}

async function openComplaint(id) {
  selectedId = id;

  const { data: c } = await api(`/complaints/${id}`);

  document.getElementById("detailTitle").textContent = c.title;
  document.getElementById("detailMeta").textContent =
    `${c.user_name} (${c.user_email}) · ${c.category} · ${new Date(c.created_at).toLocaleString()}`;
  document.getElementById("detailDescription").textContent = c.description;

  document.getElementById("status").value = c.status;
  document.getElementById("priority").value = c.priority;
  assignedTo.value = c.assigned_to ?? "";

  detailEmpty.classList.add("d-none");
  detailPanel.classList.remove("d-none");

  // Highlight the selected row
  document.querySelectorAll("#complaintRows tr").forEach((row) => {
    row.classList.toggle("table-active", Number(row.dataset.id) === id);
  });
}

// =========================================================
// SAVE CHANGES
// =========================================================

updateForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  errorMessage.classList.add("d-none");
  successMessage.classList.add("d-none");

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    await api(`/complaints/${selectedId}`, {
      method: "PUT",
      body: JSON.stringify({
        status: document.getElementById("status").value,
        priority: document.getElementById("priority").value,
        assigned_to: assignedTo.value ? Number(assignedTo.value) : null,
      }),
    });

    // Refresh statistics, the list and the open record
    await Promise.all([
      loadStats(),
      loadComplaints(),
      openComplaint(selectedId),
    ]);

    successMessage.textContent = "Complaint updated successfully!";
    successMessage.classList.remove("d-none");
  } catch (error) {
    console.error("Error updating complaint:", error);
    showError(error.message);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save changes";
  }
});

// =========================================================
// PAGE LOAD
// =========================================================

Promise.all([loadStats(), loadComplaints(), loadStaff()]).catch((error) =>
  showError(error.message),
);
