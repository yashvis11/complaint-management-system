const API_BASE = "https://complaint-management-system-o899.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const profileUrl = `${API_BASE}/api/profile/staff`;
  const assignedUrl = `${API_BASE}/api/complaints/assigned`;

  const welcomeName = document.getElementById("welcomeName");
  const staffName = document.getElementById("staffName");
  const staffEmail = document.getElementById("staffEmail");
  const staffDepartment = document.getElementById("staffDepartment");

  const totalAssigned = document.getElementById("totalAssigned");
  const pendingCount = document.getElementById("pendingCount");
  const inProgressCount = document.getElementById("inProgressCount");
  const resolvedCount = document.getElementById("resolvedCount");

  const complaintsBody = document.getElementById("assignedComplaintsBody");
  const searchInput = document.getElementById("complaintSearch");
  const statusFilter = document.getElementById("statusFilter");
  const refreshButton = document.getElementById("btnRefresh");
  const logoutButton = document.getElementById("btnLogout");
  const messageBox = document.getElementById("dashboardMessage");

  let allComplaints = [];

  // Display messages on the dashboard
  function showMessage(message, type = "danger") {
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `alert alert-${type}`;
    messageBox.classList.remove("d-none");
  }

  function hideMessage() {
    if (!messageBox) return;

    messageBox.textContent = "";
    messageBox.classList.add("d-none");
  }

  // Fetch data from the backend
  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
      },
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("The server returned an invalid response.");
    }

    if (response.status === 401 || response.status === 403) {
      window.location.href = "login.html";
      throw new Error(
        result.message || "Please log in with an approved staff account.",
      );
    }

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || "Something went wrong. Please try again.",
      );
    }

    return result;
  }

  // Extract complaints from the API response
  function getArrayFromResponse(result) {
    if (Array.isArray(result.data)) {
      return result.data;
    }

    if (Array.isArray(result.data?.complaints)) {
      return result.data.complaints;
    }

    if (Array.isArray(result.complaints)) {
      return result.complaints;
    }

    return [];
  }

  // Format complaint date
  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Create status and priority badges
  function makeBadge(value, kind) {
    const badge = document.createElement("span");

    const normalized = String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    const classes = {
      status: {
        pending: "bg-warning text-dark",
        "in-progress": "bg-info text-dark",
        resolved: "bg-success",
        rejected: "bg-danger",
      },

      priority: {
        low: "bg-success",
        medium: "bg-warning text-dark",
        high: "bg-danger",
      },
    };

    badge.className = `badge ${classes[kind]?.[normalized] || "bg-secondary"}`;

    badge.textContent = value || "—";

    return badge;
  }

  // Add a normal table cell
  function addCell(row, value) {
    const cell = document.createElement("td");

    cell.textContent = value ?? "—";

    row.appendChild(cell);

    return cell;
  }

  // Display assigned complaints in the table
  function renderComplaints() {
    if (!complaintsBody) return;

    complaintsBody.replaceChildren();

    const searchTerm = (searchInput?.value || "").trim().toLowerCase();

    const selectedStatus = statusFilter?.value || "";

    const filtered = allComplaints.filter((complaint) => {
      const searchableText = [
        complaint.id,
        complaint.title,
        complaint.description,
        complaint.category,
        complaint.priority,
        complaint.status,
        complaint.user_name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm);

      const matchesStatus =
        !selectedStatus || complaint.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 8;
      cell.className = "text-center text-muted py-4";

      cell.textContent = allComplaints.length
        ? "No complaints match your search."
        : "No complaints have been assigned to you yet.";

      row.appendChild(cell);
      complaintsBody.appendChild(row);

      return;
    }

    filtered.forEach((complaint) => {
      const row = document.createElement("tr");

      addCell(row, complaint.id);
      addCell(row, complaint.title);
      addCell(row, complaint.description);
      addCell(row, complaint.category);

      const priorityCell = document.createElement("td");
      priorityCell.appendChild(makeBadge(complaint.priority, "priority"));
      row.appendChild(priorityCell);

      const statusCell = document.createElement("td");
      statusCell.appendChild(makeBadge(complaint.status, "status"));
      row.appendChild(statusCell);

      addCell(row, complaint.user_name || complaint.name || "—");

      addCell(row, formatDate(complaint.created_at));

      complaintsBody.appendChild(row);
    });
  }

  // Calculate dashboard statistics
  function updateStatistics() {
    const total = allComplaints.length;

    const pending = allComplaints.filter((c) => c.status === "Pending").length;

    const inProgress = allComplaints.filter(
      (c) => c.status === "In Progress",
    ).length;

    const resolved = allComplaints.filter(
      (c) => c.status === "Resolved",
    ).length;

    if (totalAssigned) {
      totalAssigned.textContent = total;
    }

    if (pendingCount) {
      pendingCount.textContent = pending;
    }

    if (inProgressCount) {
      inProgressCount.textContent = inProgress;
    }

    if (resolvedCount) {
      resolvedCount.textContent = resolved;
    }
  }

  // Load staff profile
  async function loadStaffProfile() {
    const result = await fetchJson(profileUrl);

    const profile = result.data || result.user || result;

    const name = profile.name || "Staff Member";

    if (welcomeName) {
      welcomeName.textContent = name;
    }

    if (staffName) {
      staffName.textContent = name;
    }

    if (staffEmail) {
      staffEmail.textContent = profile.email || "—";
    }

    if (staffDepartment) {
      staffDepartment.textContent = profile.department || "—";
    }
  }

  // Load complaints assigned to the logged-in staff member
  async function loadAssignedComplaints() {
    const result = await fetchJson(assignedUrl);

    allComplaints = getArrayFromResponse(result);

    updateStatistics();
    renderComplaints();
  }

  // Load the complete dashboard
  async function loadDashboard() {
    hideMessage();

    if (refreshButton) {
      refreshButton.disabled = true;

      refreshButton.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    }

    try {
      await Promise.all([loadStaffProfile(), loadAssignedComplaints()]);
    } catch (error) {
      console.error("Staff dashboard error:", error);

      showMessage(error.message || "Unable to load the staff dashboard.");
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;

        refreshButton.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
      }
    }
  }

  // Logout
  async function logout() {
    try {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("Logout endpoint returned:", response.status);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    window.location.href = "login.html";
  }

  // Search complaints
  if (searchInput) {
    searchInput.addEventListener("input", renderComplaints);
  }

  // Filter complaints by status
  if (statusFilter) {
    statusFilter.addEventListener("change", renderComplaints);
  }

  // Refresh dashboard
  if (refreshButton) {
    refreshButton.addEventListener("click", loadDashboard);
  }

  // Logout button
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  // Initial dashboard load
  loadDashboard();
});
