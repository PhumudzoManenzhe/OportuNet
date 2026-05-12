import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const APPLICATIONS_COLLECTION = "applications";

let unsubscribeNotifications = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeNotificationFeed().catch((error) => {
    console.error("Unable to load applicant notifications.", error);
    renderEmptyState("Your notifications could not be loaded right now.");
    setMetaMessage("Notifications unavailable");
  });
});

async function initializeNotificationFeed() {
  const user = await resolveCurrentUser();
  if (!user) {
    renderEmptyState("Please log in to see your application updates.");
    setMetaMessage("No signed-in applicant");
    return;
  }

  const applicationsQuery = query(
    collection(db, APPLICATIONS_COLLECTION),
    where("applicantId", "==", user.uid)
  );

  if (unsubscribeNotifications) {
    unsubscribeNotifications();
  }

  unsubscribeNotifications = onSnapshot(applicationsQuery, (snapshot) => {
    const notifications = snapshot.docs
      .map((docSnapshot) => buildNotificationFromApplication(docSnapshot.data()))
      .filter(Boolean)
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

    setMetaMessage(buildMetaMessage(notifications.length));

    if (notifications.length === 0) {
      renderEmptyState("No status updates yet. When a recruiter reviews one of your applications, the update will appear here.");
      return;
    }

    renderNotifications(notifications);
  }, (error) => {
    console.error("Unable to subscribe to applicant notifications.", error);
    renderEmptyState("Your notifications could not be loaded right now.");
    setMetaMessage("Notifications unavailable");
  });
}

function buildNotificationFromApplication(application) {
  const status = String(application?.status || "").trim().toLowerCase();
  const createdAt = application?.statusUpdatedAt || application?.appliedAt || "";
  const opportunityTitle = application?.opportunityTitle || "Opportunity";
  const companyName = application?.companyName ? ` at ${application.companyName}` : "";

  if (status === "shortlisted") {
    return {
      createdAt,
      title: "Wish listed update",
      message: `Your application for ${opportunityTitle}${companyName} has been wish listed by the recruiter.`,
      tone: "positive"
    };
  }

  if (status === "accepted") {
    return {
      createdAt,
      title: "Application accepted",
      message: `Your application for ${opportunityTitle}${companyName} has been accepted.`,
      tone: "positive"
    };
  }

  if (status === "rejected") {
    return {
      createdAt,
      title: "Application update",
      message: `Your application for ${opportunityTitle}${companyName} was not selected this time.`,
      tone: "neutral"
    };
  }

  return null;
}

function renderNotifications(notifications) {
  const container = document.getElementById("notificationList");
  if (!container) return;

  container.innerHTML = notifications.map((notification) => `
    <article class="notification-card ${notification.tone === "positive" ? "notification-card-positive unread" : ""}">
      <div class="notification-card-top">
        <h2>${escapeHtml(notification.title)}</h2>
        <span class="notification-time">${escapeHtml(formatNotificationTime(notification.createdAt))}</span>
      </div>
      <p>${escapeHtml(notification.message)}</p>
    </article>
  `).join("");
}

function renderEmptyState(message) {
  const container = document.getElementById("notificationList");
  if (!container) return;

  container.innerHTML = `
    <article class="notification-card notification-card-empty">
      <h2>No notifications yet</h2>
      <p>${escapeHtml(message)}</p>
    </article>
  `;
}

function setMetaMessage(message) {
  const element = document.getElementById("notificationsMeta");
  if (!element) return;
  element.textContent = message;
}

function buildMetaMessage(count) {
  if (count === 0) return "No new status updates";
  if (count === 1) return "1 status update";
  return `${count} status updates`;
}

function formatNotificationTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toISOString().split("T")[0];
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
