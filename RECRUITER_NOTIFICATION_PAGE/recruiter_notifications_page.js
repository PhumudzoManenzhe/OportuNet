import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const DASHBOARD_FIELD = "recruiterHomepage";

document.addEventListener("DOMContentLoaded", () => {
  initializeRecruiterNotifications().catch((error) => {
    console.error("Unable to load recruiter notifications.", error);
    renderEmptyState("Your recruiter notifications could not be loaded right now.");
    setMetaMessage("Notifications unavailable");
  });
});

async function initializeRecruiterNotifications() {
  const user = await resolveCurrentUser();
  if (!user) {
    renderEmptyState("Please log in to review recruiter updates.");
    setMetaMessage("No signed-in recruiter");
    return;
  }

  const userSnapshot = await getDoc(doc(db, "users", user.uid));
  const userData = userSnapshot.exists() ? userSnapshot.data() : {};
  const savedNotifications = Array.isArray(userData?.[DASHBOARD_FIELD]?.notifications)
    ? userData[DASHBOARD_FIELD].notifications
    : [];
  const opportunitiesSnapshot = await getDocs(
    query(collection(db, "opportunities"), where("ownerUid", "==", user.uid))
  );
  const applicationsSnapshot = await getDocs(
    query(collection(db, "applications"), where("recruiterId", "==", user.uid))
  );

  const jobs = opportunitiesSnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
  const applications = applicationsSnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));

  const notifications = [
    ...buildSystemNotifications(jobs, applications),
    ...savedNotifications.map((notification) => ({
      ...notification,
      createdAt: notification?.createdAt || ""
    }))
  ].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

  setMetaMessage(buildMetaMessage(notifications.length));

  if (notifications.length === 0) {
    renderEmptyState("No recruiter updates yet. Activity around your posts will appear here.");
    return;
  }

  renderNotifications(notifications);
}

function buildSystemNotifications(jobs, applications) {
  const results = [];
  const pendingApplications = applications.filter((application) => application.status === "pending");
  const acceptedApplications = applications.filter((application) => application.status === "accepted");

  if (pendingApplications.length > 0) {
    results.push({
      id: "system-pending-review",
      title: "Applications ready to review",
      message: `${pendingApplications.length} application${pendingApplications.length === 1 ? "" : "s"} are waiting for your review.`,
      createdAt: pendingApplications[0]?.statusUpdatedAt || pendingApplications[0]?.appliedAt || new Date().toISOString(),
      tone: "positive",
      unread: true
    });
  }

  jobs
    .filter((job) => job.status === "active" && job.closingDate)
    .forEach((job) => {
      const closingDate = new Date(job.closingDate);
      if (Number.isNaN(closingDate.getTime())) return;

      const diffDays = Math.ceil((closingDate.getTime() - Date.now()) / 86400000);
      if (diffDays < 0 || diffDays > 3) return;

      results.push({
        id: `system-closing-${job.id}`,
        title: "Post closing soon",
        message: `"${job.title || "Opportunity"}" closes ${diffDays === 0 ? "today" : `in ${diffDays} day${diffDays === 1 ? "" : "s"}`}.`,
        createdAt: closingDate.toISOString(),
        tone: "neutral",
        unread: diffDays <= 1
      });
    });

  if (acceptedApplications.length > 0) {
    results.push({
      id: "system-accepted-applications",
      title: "Placement progress",
      message: `${acceptedApplications.length} application${acceptedApplications.length === 1 ? " has" : "s have"} already reached accepted status.`,
      createdAt: acceptedApplications[0]?.statusUpdatedAt || acceptedApplications[0]?.appliedAt || new Date().toISOString(),
      tone: "positive",
      unread: false
    });
  }

  return results;
}

function renderNotifications(notifications) {
  const container = document.getElementById("notificationList");
  if (!container) return;

  container.innerHTML = notifications.map((notification) => `
    <article class="notification-card ${notification.unread ? "unread" : ""} ${notification.tone === "positive" ? "positive" : ""}">
      <h2>${escapeHtml(notification.title || "Notification")}</h2>
      <p>${escapeHtml(notification.message || "There is a new update on your dashboard.")}</p>
      <span class="notification-time">${escapeHtml(formatRelativeTime(notification.createdAt))}</span>
    </article>
  `).join("");
}

function renderEmptyState(message) {
  const container = document.getElementById("notificationList");
  if (!container) return;

  container.innerHTML = `
    <article class="notification-card">
      <h2>No notifications yet</h2>
      <p>${escapeHtml(message)}</p>
    </article>
  `;
}

function buildMetaMessage(count) {
  if (count === 0) return "No recruiter updates";
  if (count === 1) return "1 recruiter update";
  return `${count} recruiter updates`;
}

function setMetaMessage(message) {
  const element = document.getElementById("notificationsMeta");
  if (!element) return;
  element.textContent = message;
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

  return value.split("T")[0] || "Recently";
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>]/g, (match) => {
    if (match === "&") return "&amp;";
    if (match === "<") return "&lt;";
    return "&gt;";
  });
}

async function resolveCurrentUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (typeof onAuthStateChanged !== "function") {
    return null;
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
