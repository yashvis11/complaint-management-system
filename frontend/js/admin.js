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

// Pending staff elements
const pendingStaffRows = document.getElementById("pendingStaffRows");
const pendingStaffCount = document.getElementById("pendingStaffCount");
const staffLoading = document.getElementById("staffLoading");
const noPendingStaff = document.getElementById("noPendingStaff");
const pendingStaffTableContainer = document.getElementById(
  "pendingStaffTableContainer",
);

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

function showSuccess(message) {
  errorMessage.classList.add("d-none");

  successMessage.textContent = message;
  successMessage.classList.remove("d-none");
}

// API wrapper
async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/admin${path}`, {
    credentials: "include",

    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    window.location.href = "login.html";
    throw new Error("Please login first.");
  }

  if (response.status === 403) {
    window.location.href = "dashboard.html";
    throw new Error("Admin access required.");
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

                <div class="text-muted small">
                    ${escapeHtml(label)}
                </div>

                <div class="fs-3">
                    ${Number(value) || 0}
                </div>

            </div>

        </div>

    `,
    )
    .join("");
}

// =========================================================
// PENDING STAFF APPROVALS
// =========================================================

async function loadPendingStaff() {
  staffLoading.classList.remove("d-none");

  noPendingStaff.classList.add("d-none");

  pendingStaffTableContainer.classList.add("d-none");

  try {
    const { data } = await api("/staff/pending");

    pendingStaffRows.innerHTML = "";

    pendingStaffCount.textContent = `${data.length} Pending`;

    staffLoading.classList.add("d-none");

    if (!data || data.length === 0) {
      noPendingStaff.classList.remove("d-none");

      return;
    }

    pendingStaffTableContainer.classList.remove("d-none");

    data.forEach((staff) => {
      const row = document.createElement("tr");

      row.innerHTML = `

                <td>${escapeHtml(staff.name)}</td>

                <td>${escapeHtml(staff.email)}</td>

                <td>${escapeHtml(staff.department)}</td>

                <td>
                    ${
                      staff.created_at
                        ? new Date(staff.created_at).toLocaleDateString("en-IN")
                        : "—"
                    }
                </td>

                <td>

                    <div class="d-flex gap-2">

                        <button
                            class="btn btn-success btn-sm approveStaff"
                            data-id="${Number(staff.id)}"
                        >
                            Approve
                        </button>

                        <button
                            class="btn btn-danger btn-sm rejectStaff"
                            data-id="${Number(staff.id)}"
                        >
                            Reject
                        </button>

                    </div>

                </td>

            `;

      pendingStaffRows.appendChild(row);
    });
  } catch (error) {
    staffLoading.classList.add("d-none");

    throw error;
  }
}

// Approve or reject staff
pendingStaffRows.addEventListener("click", async function (event) {
  const approveButton = event.target.closest(".approveStaff");
  const rejectButton = event.target.closest(".rejectStaff");

  if (!approveButton && !rejectButton) {
    return;
  }

  const button = approveButton || rejectButton;

  const staffId = button.dataset.id;

  const action = approveButton ? "Approved" : "Rejected";

  const staffName = button.closest("tr").children[0].textContent;

  const confirmed = confirm(
    `Are you sure you want to ${action.toLowerCase()} ${staffName}?`,
  );

  if (!confirmed) {
    return;
  }

  button.disabled = true;

  try {
    await api(`/staff/${staffId}/verify`, {
      method: "PATCH",

      body: JSON.stringify({
        action: action,
      }),
    });

    if (action === "Approved") {
      showSuccess(`${staffName} has been approved successfully.`);
    } else {
      showSuccess(`${staffName} has been rejected.`);
    }

    // Refresh pending staff list
    await loadPendingStaff();

    // Refresh staff available for complaint assignment
    await loadStaff();
  } catch (error) {
    console.error("Staff verification error:", error);

    showError(error.message);

    button.disabled = false;
  }
});

// =========================================================
// COMPLAINT LIST
// =========================================================

async function loadComplaints() {
  const { data } = await api("/complaints");

  if (data.length === 0) {
    complaintRows.innerHTML = `
            <tr>
                <td colspan="4" class="text-muted">
                    No complaints yet.
                </td>
            </tr>
        `;

    return;
  }

  complaintRows.innerHTML = data
    .map(
      (c) => `

        <tr
            data-id="${Number(c.id)}"
            class="${c.id === selectedId ? "table-active" : ""}"
        >

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
    openComplaint(Number(row.dataset.id)).catch((error) =>
      showError(error.message),
    );
  }
});

// =========================================================
// COMPLAINT DETAILS
// =========================================================

async function loadStaff() {
  const { data } = await api("/staff");

  assignedTo.innerHTML = `
        <option value="">Unassigned</option>
    `;

  data.forEach((staff) => {
    const option = document.createElement("option");

    option.value = staff.id;
    option.textContent = staff.name;

    assignedTo.appendChild(option);
  });
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

  // Highlight selected complaint
  document.querySelectorAll("#complaintRows tr").forEach((row) => {
    row.classList.toggle("table-active", Number(row.dataset.id) === id);
  });
}

// =========================================================
// SAVE COMPLAINT CHANGES
// =========================================================

updateForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  errorMessage.classList.add("d-none");

  successMessage.classList.add("d-none");

  if (!selectedId) {
    showError("Please select a complaint first.");

    return;
  }

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

    // Refresh dashboard information
    await Promise.all([
      loadStats(),

      loadComplaints(),

      openComplaint(selectedId),
    ]);

    showSuccess("Complaint updated successfully!");
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

async function initializeAdminPanel() {
  try {
    await Promise.all([
      loadStats(),

      loadComplaints(),

      loadStaff(),

      loadPendingStaff(),
    ]);
  } catch (error) {
    console.error("Admin panel loading error:", error);

    showError(error.message);
  }
}

initializeAdminPanel();
