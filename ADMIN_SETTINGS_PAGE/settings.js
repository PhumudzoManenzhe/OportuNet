import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const SETTINGS_FIELD = "adminSettings";

const DEFAULT_SETTINGS = Object.freeze({
  alerts: {
    suspendedAlerts: true,
    moderationAlerts: true,
    applicationTrendAlerts: true
  },
  dashboard: {
    prioritizeSuspended: true,
    showClosedPosts: true,
    reducedMotion: false
  },
  visibility: {
    landingSection: "dashboard"
  }
});

const state = {
  currentUser: null,
  feedbackTimer: null
};

const elements = {
  accountEmail: document.getElementById("accountEmail"),
  accountSummary: document.getElementById("accountSummary"),
  applicationTrendAlerts: document.getElementById("applicationTrendAlerts"),
  dashboardBtn: document.getElementById("openDashboardBtn"),
  feedback: document.getElementById("settingsFeedback"),
  form: document.getElementById("settingsForm"),
  landingDashboard: document.getElementById("landingDashboard"),
  landingOpportunities: document.getElementById("landingOpportunities"),
  landingUsers: document.getElementById("landingUsers"),
  moderationAlerts: document.getElementById("moderationAlerts"),
  opportunitiesBtn: document.getElementById("openOpportunitiesBtn"),
  prioritizeSuspended: document.getElementById("prioritizeSuspended"),
  reducedMotion: document.getElementById("reducedMotion"),
  resetSettingsBtn: document.getElementById("resetSettingsBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  settingsMeta: document.getElementById("settingsMeta"),
  showClosedPosts: document.getElementById("showClosedPosts"),
  suspendedAlerts: document.getElementById("suspendedAlerts"),
  usersBtn: document.getElementById("openUsersBtn")
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initializeSettingsPage().catch((error) => {
    console.error("Unable to load admin settings.", error);
    setMeta("Settings unavailable");
    setFeedback("Your admin settings could not be loaded.");
  });
});

function bindEvents() {
  elements.form?.addEventListener("submit", handleSave);
  elements.resetSettingsBtn?.addEventListener("click", resetDefaults);
  elements.dashboardBtn?.addEventListener("click", () => {
    window.location.href = "../ADMIN_DASHBOARD_PAGE/index.html";
  });
  elements.usersBtn?.addEventListener("click", () => {
    window.location.href = "../ADMIN_DASHBOARD_PAGE/index.html#usersSection";
  });
  elements.opportunitiesBtn?.addEventListener("click", () => {
    window.location.href = "../ADMIN_DASHBOARD_PAGE/index.html#opportunitiesSection";
  });
}

async function initializeSettingsPage() {
  const user = await resolveCurrentUser();
  state.currentUser = user;

  if (!user) {
    renderAccountSummary(null);
    renderSettings(DEFAULT_SETTINGS);
    disableForm(true);
    setMeta("No signed-in admin");
    setFeedback("Please log in to manage your settings.");
    return;
  }

  const userSnapshot = await getDoc(doc(db, "users", user.uid));
  const userData = userSnapshot.exists() ? userSnapshot.data() : {};

  renderAccountSummary(userData, user);
  renderSettings(mergeSettings(DEFAULT_SETTINGS, userData?.[SETTINGS_FIELD]));
  disableForm(false);
  setMeta("Your admin preferences are ready");
}

function renderAccountSummary(userData, user = null) {
  const displayName = pickDisplayName(userData?.displayName, userData?.fullName, user?.displayName, user?.email);

  if (elements.accountSummary) {
    elements.accountSummary.textContent = user
      ? `${displayName} can control dashboard defaults, moderation alerts, and admin landing preferences here.`
      : "Log in with an admin account to manage dashboard and moderation preferences.";
  }

  if (elements.accountEmail) {
    elements.accountEmail.textContent = user?.email || userData?.email || "No email available";
  }
}

function renderSettings(settings) {
  setChecked(elements.suspendedAlerts, settings.alerts.suspendedAlerts);
  setChecked(elements.moderationAlerts, settings.alerts.moderationAlerts);
  setChecked(elements.applicationTrendAlerts, settings.alerts.applicationTrendAlerts);
  setChecked(elements.prioritizeSuspended, settings.dashboard.prioritizeSuspended);
  setChecked(elements.showClosedPosts, settings.dashboard.showClosedPosts);
  setChecked(elements.reducedMotion, settings.dashboard.reducedMotion);

  const landing = settings.visibility.landingSection || "dashboard";
  setChecked(elements.landingDashboard, landing === "dashboard");
  setChecked(elements.landingUsers, landing === "users");
  setChecked(elements.landingOpportunities, landing === "opportunities");
}

function collectSettings() {
  return {
    alerts: {
      suspendedAlerts: Boolean(elements.suspendedAlerts?.checked),
      moderationAlerts: Boolean(elements.moderationAlerts?.checked),
      applicationTrendAlerts: Boolean(elements.applicationTrendAlerts?.checked)
    },
    dashboard: {
      prioritizeSuspended: Boolean(elements.prioritizeSuspended?.checked),
      showClosedPosts: Boolean(elements.showClosedPosts?.checked),
      reducedMotion: Boolean(elements.reducedMotion?.checked)
    },
    visibility: {
      landingSection: elements.landingUsers?.checked
        ? "users"
        : elements.landingOpportunities?.checked
          ? "opportunities"
          : "dashboard"
    }
  };
}

async function handleSave(event) {
  event.preventDefault();

  if (!state.currentUser) {
    setFeedback("Please log in before saving settings.");
    return;
  }

  const nextSettings = collectSettings();

  try {
    await setDoc(doc(db, "users", state.currentUser.uid), {
      email: state.currentUser.email || "",
      [SETTINGS_FIELD]: nextSettings
    }, { merge: true });

    setMeta("Settings saved");
    setFeedback("Your admin settings were saved.");
  } catch (error) {
    console.error("Unable to save admin settings.", error);
    setFeedback(error?.message || "Your settings could not be saved.");
  }
}

function resetDefaults() {
  renderSettings(DEFAULT_SETTINGS);
  setFeedback("Default settings restored. Save to keep them.");
}

function disableForm(disabled) {
  elements.form?.querySelectorAll("input, button").forEach((element) => {
    element.disabled = disabled;
  });

  if (elements.resetSettingsBtn) {
    elements.resetSettingsBtn.disabled = disabled;
  }

  if (elements.saveSettingsBtn) {
    elements.saveSettingsBtn.disabled = disabled;
  }
}

function setChecked(element, value) {
  if (element) {
    element.checked = Boolean(value);
  }
}

function setMeta(message) {
  if (elements.settingsMeta) {
    elements.settingsMeta.textContent = message;
  }
}

function setFeedback(message) {
  if (!elements.feedback) return;

  window.clearTimeout(state.feedbackTimer);
  elements.feedback.textContent = message;
  elements.feedback.hidden = !message;

  if (!message) return;

  state.feedbackTimer = window.setTimeout(() => {
    elements.feedback.hidden = true;
    elements.feedback.textContent = "";
  }, 3200);
}

function pickDisplayName(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "Admin";
}

function mergeSettings(defaults, saved) {
  const next = JSON.parse(JSON.stringify(defaults));
  if (!saved || typeof saved !== "object") return next;

  Object.keys(next).forEach((groupKey) => {
    if (!saved[groupKey] || typeof saved[groupKey] !== "object") return;
    next[groupKey] = { ...next[groupKey], ...saved[groupKey] };
  });

  return next;
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
