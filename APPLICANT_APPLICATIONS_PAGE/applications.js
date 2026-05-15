import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, doc, getDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const APPLICATIONS_COLLECTION = "applications";
const OPPORTUNITIES_COLLECTION = "opportunities";

let allApplications = [];
let currentFilter = "all";
let unsubscribeApplications = null;

document.addEventListener("DOMContentLoaded", () => {
  bindFilters();
  initializeApplicationsPage().catch((error) => {
    console.error("Unable to load applicant applications.", error);
    renderEmptyState("Your applications could not be loaded right now.");
    setMetaMessage("Applications unavailable");
  });
});

async function initializeApplicationsPage() {
  const user = await resolveCurrentUser();
  if (!user) {
    renderEmptyState("Please log in to view your applications.");
    setMetaMessage("No signed-in applicant");
    updateSummaryCounts([]);
    return;
  }

  const applicationsQuery = query(
    collection(db, APPLICATIONS_COLLECTION),
    where("applicantId", "==", user.uid)
  );

  if (unsubscribeApplications) {
    unsubscribeApplications();
  }

  unsubscribeApplications = onSnapshot(applicationsQuery, async (snapshots) => {
    const rawApplications = snapshots.docs.map((snapshot) => mapApplicationSnapshot(snapshot));
    const applicationsWithOpportunityDetails = await hydrateApplications(rawApplications);

    allApplications = applicationsWithOpportunityDetails.sort((left, right) => {
      return new Date(right.appliedAt || 0) - new Date(left.appliedAt || 0);
    });

    updateSummaryCounts(allApplications);
    renderApplications();
  }, (error) => {
    console.error("Unable to subscribe to applicant applications.", error);
    renderEmptyState("Your applications could not be loaded right now.");
    setMetaMessage("Applications unavailable");
    updateSummaryCounts([]);
  });
}

function bindFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter || "all";
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderApplications();
    });
  });
}

async function hydrateApplications(applications) {
  return Promise.all(applications.map(async (application) => {
    if (!application.jobId) {
      return application;
    }

    try {
      const opportunitySnapshot = await getDoc(doc(db, OPPORTUNITIES_COLLECTION, application.jobId));
      if (!opportunitySnapshot.exists()) {
        return application;
      }

      const job = opportunitySnapshot.data();
      return {
        ...application,
        companyName: application.companyName || job.companyName || "",
        location: job.location || "",
        opportunityType: application.opportunityType || job.opportunityType || "",
        stipend: job.stipend || ""
      };
    } catch (error) {
      console.error("Unable to load opportunity details for applicant application.", error);
      return application;
    }
  }));
}

function renderApplications() {
  const filteredApplications = filterApplications(allApplications, currentFilter);
  const container = document.getElementById("applicationsList");
  if (!container) return;

  setMetaMessage(buildMetaMessage(filteredApplications.length));

  if (filteredApplications.length === 0) {
    const emptyMessage = allApplications.length === 0
      ? "You have not submitted any applications yet. Start exploring internships, learnerships, and apprenticeships to begin tracking them here."
      : "No applications match this filter right now.";
    renderEmptyState(emptyMessage);
    return;
  }

  container.innerHTML = filteredApplications.map((application) => `
    <article class="application-card">
      <header class="application-card-header">
        <div>
          <p class="application-company">${escapeHtml(application.companyName || "Opportunity update")}</p>
          <h3>${escapeHtml(application.opportunityTitle || "Opportunity")}</h3>
        </div>
        <span class="status-pill ${application.statusKey}">${escapeHtml(application.statusLabel)}</span>
      </header>

      <section class="application-meta-grid">
        <article class="meta-card">
          <span class="meta-label">Applied</span>
          <strong class="meta-value">${escapeHtml(application.appliedDate || "Not available")}</strong>
        </article>
        <article class="meta-card">
          <span class="meta-label">Location</span>
          <strong class="meta-value">${escapeHtml(application.location || "Not specified")}</strong>
        </article>
        <article class="meta-card">
          <span class="meta-label">Type</span>
          <strong class="meta-value">${escapeHtml(application.opportunityType || "Opportunity")}</strong>
        </article>
      </section>

      <p class="application-summary">${escapeHtml(application.statusSummary)}</p>
    </article>
  `).join("");
}

function filterApplications(applications, filterKey) {
  if (filterKey === "all") return applications;
  return applications.filter((application) => application.statusKey === filterKey);
}

function mapApplicationSnapshot(snapshot) {
  const application = snapshot.data();
  const statusPresentation = getStatusPresentation(application.status);

  return {
    id: snapshot.id,
    applicantId: application.applicantId || "",
    appliedAt: application.appliedAt || "",
    appliedDate: formatIsoDate(application.appliedAt),
    companyName: application.companyName || "",
    jobId: application.jobId || "",
    opportunityTitle: application.opportunityTitle || "Opportunity",
    opportunityType: application.opportunityType || "",
    rawStatus: application.status || "pending",
    statusKey: statusPresentation.key,
    statusLabel: statusPresentation.label,
    statusSummary: statusPresentation.summary
  };
}

function getStatusPresentation(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (normalizedStatus === "pending") {
    return {
      key: "pending",
      label: "Pending",
      summary: "Your application has been submitted successfully and is waiting for recruiter review."
    };
  }

  if (normalizedStatus === "shortlisted" || normalizedStatus === "wishlisted" || normalizedStatus === "wish listed") {
    return {
      key: "wishlisted",
      label: "Wish listed",
      summary: "Good news. A recruiter has moved your application forward for closer consideration."
    };
  }

  if (normalizedStatus === "accepted") {
    return {
      key: "accepted",
      label: "Accepted",
      summary: "Congratulations. Your application has been accepted and is ready for the next step."
    };
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "declined") {
    return {
      key: "rejected",
      label: "Rejected",
      summary: "This application was not selected this time, but you can keep applying to new opportunities."
    };
  }

  return {
    key: "other",
    label: normalizedStatus ? capitalize(normalizedStatus) : "Update",
    summary: "There has been an update on this application."
  };
}

function updateSummaryCounts(applications) {
  setCount("pendingCount", applications.filter((item) => item.statusKey === "pending").length);
  setCount("wishListedCount", applications.filter((item) => item.statusKey === "wishlisted").length);
  setCount("acceptedCount", applications.filter((item) => item.statusKey === "accepted").length);
  setCount("rejectedCount", applications.filter((item) => item.statusKey === "rejected").length);
}

function setCount(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = String(value);
}

function buildMetaMessage(count) {
  if (allApplications.length === 0) {
    return "No applications submitted yet";
  }

  if (count === 1) {
    return "1 application shown";
  }

  return `${count} applications shown`;
}

function setMetaMessage(message) {
  const element = document.getElementById("applicationsMeta");
  if (!element) return;
  element.textContent = message;
}

function renderEmptyState(message) {
  const container = document.getElementById("applicationsList");
  if (!container) return;
  container.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function formatIsoDate(value) {
  return value ? String(value).split("T")[0] : "";
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
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
