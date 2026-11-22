// =========================================================
// ASSIGNED TO ME PAGE JAVASCRIPT (STAFF)
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
// RESOLVE BUTTON
// =========================================================

// Create the button dynamically.
// This avoids needing to change assigned.html.

const resolveButton = document.createElement("button");

resolveButton.type = "button";
resolveButton.className = "btn btn-success mt-3";
resolveButton.textContent = "Mark as Resolved";
resolveButton.id = "resolveComplaintButton";

resolveButton.addEventListener("click", resolveComplaint);

// Add button to the complaint details panel
detailPanel.appendChild(resolveButton);

// =========================================================
// LOAD ASSIGNED COMPLAINTS
// =========================================================

async function loadAssigned() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/complaints/assigned`, {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (response.status === 403) {
      window.location.href = "dashboard.html";
      return;
    }

    const result = await response.json();

    console.log("Assigned Complaints API:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load assigned complaints.");
    }

    assignedComplaints = result.complaints || [];

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
            <tr data-id="${Number(c.id)}">

                <td>
                    <strong>#${escapeHtml(c.id)}</strong>
                </td>

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

// Click a complaint to view its details
assignedRows.addEventListener("click", function (event) {
  const row = event.target.closest("tr[data-id]");

  if (row) {
    showDetails(Number(row.dataset.id));
  }
});

// =========================================================
// COMPLAINT DETAILS
// =========================================================

function showDetails(id) {
  const c = assignedComplaints.find((item) => Number(item.id) === Number(id));

  if (!c) {
    return;
  }

  document.getElementById("detailTitle").textContent = c.title;

  document.getElementById("detailMeta").textContent =
    `${c.category} · submitted by ${c.user_name} · ` +
    new Date(c.created_at).toLocaleDateString("en-GB");

  document.getElementById("detailDescription").textContent = c.description;

  const image = document.getElementById("detailImage");

  if (image) {
    if (c.image_path) {
      image.src = `${API_BASE_URL}/${c.image_path}`;
      image.classList.remove("d-none");
    } else {
      image.src = "";
      image.classList.add("d-none");
    }
  }

  detailEmpty.classList.add("d-none");
  detailPanel.classList.remove("d-none");

  // Show the button only when the complaint can be resolved
  if (c.status === "Pending" || c.status === "In Progress") {
    resolveButton.classList.remove("d-none");
    resolveButton.disabled = false;
    resolveButton.textContent = "Mark as Resolved";
  } else {
    resolveButton.classList.add("d-none");
  }

  // Highlight selected complaint
  document.querySelectorAll("#assignedRows tr").forEach((row) => {
    row.classList.toggle("table-active", Number(row.dataset.id) === Number(id));
  });
}

// =========================================================
// MARK COMPLAINT AS RESOLVED
// =========================================================

async function resolveComplaint() {
  const selectedComplaint = assignedComplaints.find((item) => {
    const title = document.getElementById("detailTitle").textContent;
    return (
      item.title === title &&
      (item.status === "Pending" || item.status === "In Progress")
    );
  });

  // Use the selected table row to identify the complaint
  const selectedRow = document.querySelector("#assignedRows tr.table-active");

  if (!selectedRow) {
    return;
  }

  const complaintId = Number(selectedRow.dataset.id);

  const complaint = assignedComplaints.find(
    (item) => Number(item.id) === complaintId,
  );

  if (!complaint) {
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to mark complaint #${complaintId} as resolved?`,
  );

  if (!confirmed) {
    return;
  }

  resolveButton.disabled = true;
  resolveButton.textContent = "Updating...";

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/complaints/${complaintId}/resolve`,
      {
        method: "PATCH",
        credentials: "include",
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to resolve complaint.");
    }

    // Update the complaint list from the backend
    await loadAssigned();

    // Display the updated complaint details
    showDetails(complaintId);

    alert("Complaint marked as resolved successfully!");
  } catch (error) {
    console.error("Resolve complaint error:", error);

    errorMessage.textContent = error.message;
    errorMessage.classList.remove("d-none");

    resolveButton.disabled = false;
    resolveButton.textContent = "Mark as Resolved";
  }
}

// =========================================================
// START
// =========================================================

loadAssigned();
