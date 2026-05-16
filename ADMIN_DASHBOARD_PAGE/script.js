import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const state = {
  adminEvents: [],
  applications: [],
  currentUser: null,
  opportunities: [],
  userFilter: "all",
  opportunityFilter: "all",
  users: []
};

const elements = {
  acceptedMetric: document.getElementById("acceptedMetric"),
  activityFeed: document.getElementById("activityFeed"),
  adminFeedback: document.getElementById("adminFeedback"),
  applicationsMetric: document.getElementById("applicationsMetric"),
  dashboardMeta: document.getElementById("dashboardMeta"),
  heroTitle: document.getElementById("heroTitle"),
  opportunitiesTable: document.getElementById("opportunitiesTable"),
  opportunityFilterGroup: document.getElementById("opportunityFilterGroup"),
  usersMetric: document.getElementById("usersMetric"),
  usersTable: document.getElementById("usersTable"),
  userFilterGroup: document.getElementById("userFilterGroup"),
  activeOpportunitiesMetric: document.getElementById("activeOpportunitiesMetric")
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initializeAdminDashboard().catch((error) => {
    console.error("Unable to load admin dashboard.", error);
    setFeedback("The admin dashboard could not be loaded.");
    renderUnauthorizedState("Admin tools are unavailable right now.");
  });
});

function bindEvents() {
  elements.userFilterGroup?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    state.userFilter = button.dataset.filter || "all";
    updateActiveFilter(elements.userFilterGroup, state.userFilter);
    renderUsers();
  });

  elements.opportunityFilterGroup?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    state.opportunityFilter = button.dataset.filter || "all";
    updateActiveFilter(elements.opportunityFilterGroup, state.opportunityFilter);
    renderOpportunities();
  });

  elements.usersTable?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-user-action]");
    if (!button) return;

    const userId = button.dataset.userId || "";
    if (!userId) return;

    await toggleUserStatus(userId);
  });

  elements.opportunitiesTable?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-opportunity-action]");
    if (!button) return;

    const opportunityId = button.dataset.opportunityId || "";
    if (!opportunityId) return;

    await toggleOpportunityStatus(opportunityId);
  });
}

async function initializeAdminDashboard() {
  const user = await resolveCurrentUser();
  state.currentUser = user;

  if (!user) {
    renderUnauthorizedState("Please log in with an admin account to continue.");
    return;
  }

  const adminSnapshot = await getDoc(doc(db, "users", user.uid));
  const adminData = adminSnapshot.exists() ? adminSnapshot.data() : {};
  if (String(adminData?.role || "").toLowerCase() !== "admin") {
    renderUnauthorizedState("This account does not have admin access.");
    return;
  }

  applyAdminBranding(pickDisplayName(adminData?.displayName, adminData?.fullName, user.displayName, user.email));

  const [usersSnapshot, opportunitiesSnapshot, applicationsSnapshot] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "opportunities")),
    getDocs(collection(db, "applications"))
  ]);

  state.users = usersSnapshot.docs.map(mapUserSnapshot);
  state.opportunities = opportunitiesSnapshot.docs.map(mapOpportunitySnapshot);
  state.applications = applicationsSnapshot.docs.map(mapApplicationSnapshot);

  renderDashboard();
}

function renderDashboard() {
  renderMetrics();
  renderUsers();
  renderOpportunities();
  renderActivity();
  setMetaMessage();
}

function renderMetrics() {
  const totalUsers = state.users.length;
  const activeOpportunities = state.opportunities.filter((item) => item.status === "active").length;
  const totalApplications = state.applications.length;
  const acceptedApplications = state.applications.filter((item) => item.status === "accepted").length;

  setText(elements.usersMetric, totalUsers);
  setText(elements.activeOpportunitiesMetric, activeOpportunities);
  setText(elements.applicationsMetric, totalApplications);
  setText(elements.acceptedMetric, acceptedApplications);
}

function renderUsers() {
  if (!elements.usersTable) return;

  const filteredUsers = state.users.filter((user) => {
    if (state.userFilter === "all") return true;
    if (state.userFilter === "suspended") return user.accountStatus === "suspended";
    return user.role === state.userFilter;
  });

  if (filteredUsers.length === 0) {
    elements.usersTable.innerHTML = `<div class="empty-state">No users match this filter yet.</div>`;
    return;
  }

  elements.usersTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${filteredUsers.map((user) => {
          const isCurrentAdmin = user.id === state.currentUser?.uid;
          const nextAction = user.accountStatus === "suspended" ? "Activate" : "Suspend";
          const actionClass = user.accountStatus === "suspended" ? "action-btn-secondary" : "action-btn-danger";

          return `
            <tr>
              <td>${escapeHtml(user.displayName)}</td>
              <td>${escapeHtml(user.email)}</td>
              <td><span class="role-pill">${escapeHtml(capitalize(user.role || "user"))}</span></td>
              <td><span class="status-pill ${escapeHtml(user.accountStatus)}">${escapeHtml(capitalize(user.accountStatus))}</span></td>
              <td>
                <div class="action-row">
                  <button
                    class="action-btn ${actionClass}"
                    type="button"
                    data-user-action="toggle-status"
                    data-user-id="${escapeHtml(user.id)}"
                    ${isCurrentAdmin ? "disabled" : ""}
                  >
                    ${isCurrentAdmin ? "Current account" : nextAction}
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderOpportunities() {
  if (!elements.opportunitiesTable) return;

  const filteredOpportunities = state.opportunities.filter((item) => {
    if (state.opportunityFilter === "all") return true;
    return item.status === state.opportunityFilter;
  });

  if (filteredOpportunities.length === 0) {
    elements.opportunitiesTable.innerHTML = `<div class="empty-state">No opportunities match this filter yet.</div>`;
    return;
  }

  elements.opportunitiesTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Opportunity</th>
          <th>Owner</th>
          <th>Status</th>
          <th>Applicants</th>
          <th>Closing Date</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${filteredOpportunities.map((item) => {
          const applicantCount = state.applications.filter((application) => application.jobId === item.id).length;
          const nextAction = item.status === "closed" ? "Reopen post" : "Close post";
          const actionClass = item.status === "closed" ? "action-btn-secondary" : "action-btn-danger";

          return `
            <tr>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.companyName || "Recruiter")}</td>
              <td><span class="status-pill ${escapeHtml(item.status)}">${escapeHtml(capitalize(item.status))}</span></td>
              <td>${applicantCount}</td>
              <td>${escapeHtml(item.closingDate || "Not set")}</td>
              <td>
                <div class="action-row">
                  <button
                    class="action-btn ${actionClass}"
                    type="button"
                    data-opportunity-action="toggle-status"
                    data-opportunity-id="${escapeHtml(item.id)}"
                  >
                    ${nextAction}
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderActivity() {
  if (!elements.activityFeed) return;

  const applicationEvents = state.applications.map((application) => ({
    createdAt: application.statusUpdatedAt || application.appliedAt || "",
    label: application.status === "accepted" ? "Accepted" : application.status === "pending" ? "Pending" : "Application",
    message: `${application.applicantName} is ${application.status || "pending"} for ${application.opportunityTitle || "an opportunity"}.`
  }));

  const events = [...state.adminEvents, ...applicationEvents]
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 8);

  if (events.length === 0) {
    elements.activityFeed.innerHTML = `<div class="empty-state">No platform activity has been recorded yet.</div>`;
    return;
  }

  elements.activityFeed.innerHTML = events.map((event) => `
    <article class="activity-card">
      <div class="activity-card-top">
        <span class="activity-pill">${escapeHtml(event.label || "Update")}</span>
        <span class="activity-time">${escapeHtml(formatRelativeTime(event.createdAt))}</span>
      </div>
      <p>${escapeHtml(event.message || "Platform activity will appear here.")}</p>
    </article>
  `).join("");
}

async function toggleUserStatus(userId) {
  const targetUser = state.users.find((user) => user.id === userId);
  if (!targetUser) return;

  const nextStatus = targetUser.accountStatus === "suspended" ? "active" : "suspended";

  try {
    await updateDoc(doc(db, "users", userId), {
      accountStatus: nextStatus,
      updatedAt: new Date().toISOString()
    });

    targetUser.accountStatus = nextStatus;
    state.adminEvents.unshift({
      createdAt: new Date().toISOString(),
      label: "User update",
      message: `${targetUser.displayName} was marked as ${nextStatus}.`
    });

    renderDashboard();
    setFeedback(`Updated ${targetUser.displayName} to ${nextStatus}.`);
  } catch (error) {
    console.error("Unable to update user status.", error);
    setFeedback("That user could not be updated.");
  }
}

async function toggleOpportunityStatus(opportunityId) {
  const targetOpportunity = state.opportunities.find((item) => item.id === opportunityId);
  if (!targetOpportunity) return;

  const nextStatus = targetOpportunity.status === "closed" ? "active" : "closed";

  try {
    await updateDoc(doc(db, "opportunities", opportunityId), {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });

    targetOpportunity.status = nextStatus;
    state.adminEvents.unshift({
      createdAt: new Date().toISOString(),
      label: "Post update",
      message: `${targetOpportunity.title} was moved to ${nextStatus} status.`
    });

    renderDashboard();
    setFeedback(`Updated ${targetOpportunity.title} to ${nextStatus}.`);
  } catch (error) {
    console.error("Unable to update opportunity status.", error);
    setFeedback("That opportunity could not be updated.");
  }
}

function renderUnauthorizedState(message) {
  setText(elements.heroTitle, "Admin access required");
  setText(elements.dashboardMeta, message);
  setText(elements.usersMetric, 0);
  setText(elements.activeOpportunitiesMetric, 0);
  setText(elements.applicationsMetric, 0);
  setText(elements.acceptedMetric, 0);

  if (elements.usersTable) {
    elements.usersTable.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }
  if (elements.opportunitiesTable) {
    elements.opportunitiesTable.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }
  if (elements.activityFeed) {
    elements.activityFeed.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }
}

function applyAdminBranding(name) {
  setText(elements.heroTitle, `Welcome back, ${name}`);
}

function setMetaMessage() {
  const applicants = state.users.filter((user) => user.role === "applicant").length;
  const recruiters = state.users.filter((user) => user.role === "recruiter").length;
  const suspended = state.users.filter((user) => user.accountStatus === "suspended").length;
  setText(
    elements.dashboardMeta,
    `${state.users.length} users across ${applicants} applicants and ${recruiters} recruiters, with ${suspended} suspended account${suspended === 1 ? "" : "s"}.`
  );
}

function updateActiveFilter(container, activeFilter) {
  container?.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === activeFilter);
  });
}

function setText(element, value) {
  if (!element) return;
  element.textContent = String(value ?? "");
}

function setFeedback(message) {
  if (!elements.adminFeedback) return;

  elements.adminFeedback.textContent = message;
  elements.adminFeedback.hidden = !message;

  if (!message) return;

  window.clearTimeout(setFeedback.feedbackTimer);
  setFeedback.feedbackTimer = window.setTimeout(() => {
    elements.adminFeedback.hidden = true;
    elements.adminFeedback.textContent = "";
  }, 3200);
}

function mapUserSnapshot(snapshot) {
  const user = snapshot.data();
  return {
    id: snapshot.id,
    accountStatus: normalizeStatus(user.accountStatus || "active"),
    displayName: pickDisplayName(
      user?.applicantProfile?.profile?.name,
      user?.recruiterProfile?.contactName,
      user?.displayName,
      user?.fullName,
      user?.companyName,
      user?.email
    ),
    email: user.email || "No email available",
    role: String(user.role || "user").toLowerCase()
  };
}

function mapOpportunitySnapshot(snapshot) {
  const opportunity = snapshot.data();
  return {
    id: snapshot.id,
    closingDate: opportunity.closingDate || "",
    companyName: opportunity.companyName || "",
    status: normalizeStatus(opportunity.status || "active"),
    title: opportunity.title || "Untitled opportunity"
  };
}

function mapApplicationSnapshot(snapshot) {
  const application = snapshot.data();
  return {
    id: snapshot.id,
    applicantName: application.applicantName || "Unknown applicant",
    appliedAt: application.appliedAt || "",
    jobId: application.jobId || "",
    opportunityTitle: application.opportunityTitle || "Opportunity",
    status: normalizeStatus(application.status || "pending"),
    statusUpdatedAt: application.statusUpdatedAt || application.appliedAt || ""
  };
}

function normalizeStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "declined") return "rejected";
  return normalized || "active";
}

function pickDisplayName(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "Admin";
}

function capitalize(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatRelativeTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return String(value).split("T")[0] || "Recently";
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"]/g, (match) => {
    if (match === "&") return "&amp;";
    if (match === "<") return "&lt;";
    if (match === ">") return "&gt;";
    return "&quot;";
  });
}

async function resolveCurrentUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, (error) => {
      unsubscribe();
      reject(error);
    });
  });
}
