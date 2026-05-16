import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { startDeleteAccountFlow } from "../shared/account-actions.js";

const SETTINGS_FIELD = "recruiterSettings";
const PROFILE_FIELD = "recruiterProfile";

const DEFAULT_SETTINGS = Object.freeze({
  notifications: {
    newApplications: true,
    shortlistReminders: true,
    closingDateAlerts: true,
    placementProgress: true
  },
  workflow: {
    prioritizePending: true,
    separateReviewedQueues: true,
    showApplicantContacts: true,
    rememberReviewFilters: true
  },
  posting: {
    preferredTypes: {
      internships: true,
      learnerships: true,
      apprenticeships: true
    },
    rememberPostingDrafts: true,
    reducedMotion: false
  }
});

const state = {
  currentUser: null,
  feedbackTimer: null,
  settings: cloneData(DEFAULT_SETTINGS)
};

const elements = {
  accountEmail: document.getElementById("accountEmail"),
  accountSummary: document.getElementById("accountSummary"),
  closingDateAlerts: document.getElementById("closingDateAlerts"),
  feedback: document.getElementById("settingsFeedback"),
  form: document.getElementById("settingsForm"),
  newApplications: document.getElementById("newApplications"),
  openApplicationsBtn: document.getElementById("openApplicationsBtn"),
  openDashboardBtn: document.getElementById("openDashboardBtn"),
  openNotificationsBtn: document.getElementById("openNotificationsBtn"),
  openPostsBtn: document.getElementById("openPostsBtn"),
  placementProgress: document.getElementById("placementProgress"),
  prefApprenticeships: document.getElementById("prefApprenticeships"),
  prefInternships: document.getElementById("prefInternships"),
  prefLearnerships: document.getElementById("prefLearnerships"),
  prioritizePending: document.getElementById("prioritizePending"),
  reducedMotion: document.getElementById("reducedMotion"),
  rememberPostingDrafts: document.getElementById("rememberPostingDrafts"),
  rememberReviewFilters: document.getElementById("rememberReviewFilters"),
  resetSettingsBtn: document.getElementById("resetSettingsBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  separateReviewedQueues: document.getElementById("separateReviewedQueues"),
  settingsDeleteAccountBtn: document.getElementById("settingsDeleteAccountBtn"),
  settingsMeta: document.getElementById("settingsMeta"),
  shortlistReminders: document.getElementById("shortlistReminders"),
  showApplicantContacts: document.getElementById("showApplicantContacts")
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initializeSettingsPage().catch((error) => {
    console.error("Unable to load recruiter settings.", error);
    setMeta("Settings unavailable");
    setFeedback("Your recruiter settings could not be loaded.");
  });
});

function bindEvents() {
  elements.form?.addEventListener("submit", handleSave);
  elements.resetSettingsBtn?.addEventListener("click", resetFormToDefaults);
  elements.openDashboardBtn?.addEventListener("click", () => {
    window.location.href = "../Recruiter_homepage/index.html";
  });
  elements.openPostsBtn?.addEventListener("click", () => {
    window.location.href = "../Recruiter_homepage/index.html#opportunitiesSection";
  });
  elements.openApplicationsBtn?.addEventListener("click", () => {
    window.location.href = "../Recruiter_homepage/index.html#applicationsSection";
  });
  elements.openNotificationsBtn?.addEventListener("click", () => {
    window.location.href = "../RECRUITER_NOTIFICATION_PAGE/recruiter_notifications_page.html";
  });
  elements.settingsDeleteAccountBtn?.addEventListener("click", () => {
    startDeleteAccountFlow({ loginHref: "../SignUp_LogIn_pages/logIn.html" });
  });
}

async function initializeSettingsPage() {
  const user = await resolveCurrentUser();
  state.currentUser = user;

  if (!user) {
    setMeta("No signed-in recruiter");
    renderAccountSummary(null, null);
    renderSettings(DEFAULT_SETTINGS);
    disableForm(true);
    setFeedback("Please log in to manage your settings.");
    return;
  }

  const userSnapshot = await getDoc(doc(db, "users", user.uid));
  const userData = userSnapshot.exists() ? userSnapshot.data() : {};
  const recruiterProfile = userData?.[PROFILE_FIELD] || {};
  const recruiterSettings = mergeSettings(DEFAULT_SETTINGS, userData?.[SETTINGS_FIELD]);

  state.settings = recruiterSettings;
  renderAccountSummary(user, recruiterProfile);
  renderSettings(recruiterSettings);
  disableForm(false);
  setMeta("Your recruiter workspace preferences are ready");
}

function renderAccountSummary(user, recruiterProfile) {
  const displayName = pickDisplayName(
    recruiterProfile?.contactName,
    recruiterProfile?.fullName,
    recruiterProfile?.companyName,
    recruiterProfile?.organisationName,
    recruiterProfile?.organizationName,
    user?.displayName,
    user?.email
  );
  const companyName = pickDisplayName(
    recruiterProfile?.companyName,
    recruiterProfile?.organisationName,
    recruiterProfile?.organizationName,
    displayName
  );

  if (elements.accountSummary) {
    elements.accountSummary.textContent = user
      ? `${displayName} can manage recruiter alerts, review defaults, and posting preferences for ${companyName}.`
      : "Log in to manage recruiter notifications, review workflow, and posting preferences.";
  }

  if (elements.accountEmail) {
    elements.accountEmail.textContent = user?.email || "No email available";
  }
}

function renderSettings(settings) {
  setChecked(elements.newApplications, settings.notifications.newApplications);
  setChecked(elements.shortlistReminders, settings.notifications.shortlistReminders);
  setChecked(elements.closingDateAlerts, settings.notifications.closingDateAlerts);
  setChecked(elements.placementProgress, settings.notifications.placementProgress);

  setChecked(elements.prioritizePending, settings.workflow.prioritizePending);
  setChecked(elements.separateReviewedQueues, settings.workflow.separateReviewedQueues);
  setChecked(elements.showApplicantContacts, settings.workflow.showApplicantContacts);
  setChecked(elements.rememberReviewFilters, settings.workflow.rememberReviewFilters);

  setChecked(elements.prefInternships, settings.posting.preferredTypes.internships);
  setChecked(elements.prefLearnerships, settings.posting.preferredTypes.learnerships);
  setChecked(elements.prefApprenticeships, settings.posting.preferredTypes.apprenticeships);
  setChecked(elements.rememberPostingDrafts, settings.posting.rememberPostingDrafts);
  setChecked(elements.reducedMotion, settings.posting.reducedMotion);
}

function collectSettingsFromForm() {
  return {
    notifications: {
      newApplications: Boolean(elements.newApplications?.checked),
      shortlistReminders: Boolean(elements.shortlistReminders?.checked),
      closingDateAlerts: Boolean(elements.closingDateAlerts?.checked),
      placementProgress: Boolean(elements.placementProgress?.checked)
    },
    workflow: {
      prioritizePending: Boolean(elements.prioritizePending?.checked),
      separateReviewedQueues: Boolean(elements.separateReviewedQueues?.checked),
      showApplicantContacts: Boolean(elements.showApplicantContacts?.checked),
      rememberReviewFilters: Boolean(elements.rememberReviewFilters?.checked)
    },
    posting: {
      preferredTypes: {
        internships: Boolean(elements.prefInternships?.checked),
        learnerships: Boolean(elements.prefLearnerships?.checked),
        apprenticeships: Boolean(elements.prefApprenticeships?.checked)
      },
      rememberPostingDrafts: Boolean(elements.rememberPostingDrafts?.checked),
      reducedMotion: Boolean(elements.reducedMotion?.checked)
    }
  };
}

async function handleSave(event) {
  event.preventDefault();

  if (!state.currentUser) {
    setFeedback("Please log in before saving settings.");
    return;
  }

  const nextSettings = collectSettingsFromForm();

  try {
    await setDoc(doc(db, "users", state.currentUser.uid), {
      email: state.currentUser.email || "",
      [SETTINGS_FIELD]: nextSettings
    }, { merge: true });

    state.settings = nextSettings;
    setMeta("Settings saved");
    setFeedback("Your recruiter settings were saved.");
  } catch (error) {
    console.error("Unable to save recruiter settings.", error);
    setFeedback(error?.message || "Your settings could not be saved.");
  }
}

function resetFormToDefaults() {
  renderSettings(DEFAULT_SETTINGS);
  setFeedback("Default settings restored. Save to keep them.");
}

function disableForm(disabled) {
  elements.form?.querySelectorAll("input, button").forEach((element) => {
    if (element.id === "settingsDeleteAccountBtn") {
      element.disabled = disabled;
      return;
    }

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

function pickDisplayName(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "Recruiter";
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeSettings(defaults, saved) {
  const next = cloneData(defaults);
  if (!saved || typeof saved !== "object") return next;

  Object.keys(next).forEach((groupKey) => {
    const groupValue = next[groupKey];
    const savedGroup = saved[groupKey];

    if (!savedGroup || typeof savedGroup !== "object") return;

    Object.keys(groupValue).forEach((settingKey) => {
      if (groupValue[settingKey] && typeof groupValue[settingKey] === "object" && !Array.isArray(groupValue[settingKey])) {
        groupValue[settingKey] = {
          ...groupValue[settingKey],
          ...savedGroup[settingKey]
        };
        return;
      }

      if (Object.prototype.hasOwnProperty.call(savedGroup, settingKey)) {
        groupValue[settingKey] = savedGroup[settingKey];
      }
    });
  });

  return next;
}
