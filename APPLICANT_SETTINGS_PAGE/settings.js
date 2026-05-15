import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { startDeleteAccountFlow } from "../shared/account-actions.js";

const SETTINGS_FIELD = "applicantSettings";
const PROFILE_FIELD = "applicantProfile";

const DEFAULT_SETTINGS = Object.freeze({
  notifications: {
    applicationUpdates: true,
    shortlistAlerts: true,
    acceptanceAlerts: true,
    closingReminders: true
  },
  privacy: {
    profileVisible: true,
    shareCv: true,
    shareContactsAfterShortlist: false
  },
  preferences: {
    preferredTypes: {
      internships: true,
      learnerships: true,
      apprenticeships: true
    },
    rememberFilters: true,
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
  applicationUpdates: document.getElementById("applicationUpdates"),
  acceptanceAlerts: document.getElementById("acceptanceAlerts"),
  closingReminders: document.getElementById("closingReminders"),
  feedback: document.getElementById("settingsFeedback"),
  form: document.getElementById("settingsForm"),
  openApplicationsBtn: document.getElementById("openApplicationsBtn"),
  openNotificationsBtn: document.getElementById("openNotificationsBtn"),
  openProfileBtn: document.getElementById("openProfileBtn"),
  prefApprenticeships: document.getElementById("prefApprenticeships"),
  prefInternships: document.getElementById("prefInternships"),
  prefLearnerships: document.getElementById("prefLearnerships"),
  profileVisible: document.getElementById("profileVisible"),
  reducedMotion: document.getElementById("reducedMotion"),
  rememberFilters: document.getElementById("rememberFilters"),
  resetSettingsBtn: document.getElementById("resetSettingsBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  settingsDeleteAccountBtn: document.getElementById("settingsDeleteAccountBtn"),
  settingsMeta: document.getElementById("settingsMeta"),
  shareContactsAfterShortlist: document.getElementById("shareContactsAfterShortlist"),
  shareCv: document.getElementById("shareCv"),
  shortlistAlerts: document.getElementById("shortlistAlerts")
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initializeSettingsPage().catch((error) => {
    console.error("Unable to load applicant settings.", error);
    setMeta("Settings unavailable");
    setFeedback("Your settings could not be loaded.");
  });
});

function bindEvents() {
  elements.form?.addEventListener("submit", handleSave);
  elements.resetSettingsBtn?.addEventListener("click", resetFormToDefaults);
  elements.openProfileBtn?.addEventListener("click", () => {
    window.location.href = "../Applicant_Editable_Profile/profile_index.html";
  });
  elements.openApplicationsBtn?.addEventListener("click", () => {
    window.location.href = "../APPLICANT_APPLICATIONS_PAGE/applications.html";
  });
  elements.openNotificationsBtn?.addEventListener("click", () => {
    window.location.href = "../APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html";
  });
  elements.settingsDeleteAccountBtn?.addEventListener("click", () => {
    startDeleteAccountFlow({ loginHref: "../SignUp_LogIn_pages/logIn.html" });
  });
}

async function initializeSettingsPage() {
  const user = await resolveCurrentUser();
  state.currentUser = user;

  if (!user) {
    setMeta("No signed-in applicant");
    renderAccountSummary(null, null);
    renderSettings(DEFAULT_SETTINGS);
    disableForm(true);
    setFeedback("Please log in to manage your settings.");
    return;
  }

  const userSnapshot = await getDoc(doc(db, "users", user.uid));
  const userData = userSnapshot.exists() ? userSnapshot.data() : {};
  const applicantProfile = userData?.[PROFILE_FIELD] || {};
  const applicantSettings = mergeSettings(DEFAULT_SETTINGS, userData?.[SETTINGS_FIELD]);

  state.settings = applicantSettings;
  renderAccountSummary(user, applicantProfile);
  renderSettings(applicantSettings);
  disableForm(false);
  setMeta("Your preferences are ready to update");
}

function renderAccountSummary(user, applicantProfile) {
  const displayName = pickDisplayName(
    applicantProfile?.profile?.name,
    user?.displayName,
    user?.email
  );

  if (elements.accountSummary) {
    elements.accountSummary.textContent = user
      ? `${displayName} can manage application alerts, privacy controls, and applicant preferences here.`
      : "Log in to manage your notification, privacy, and opportunity preferences.";
  }

  if (elements.accountEmail) {
    elements.accountEmail.textContent = user?.email || "No email available";
  }
}

function renderSettings(settings) {
  setChecked(elements.applicationUpdates, settings.notifications.applicationUpdates);
  setChecked(elements.shortlistAlerts, settings.notifications.shortlistAlerts);
  setChecked(elements.acceptanceAlerts, settings.notifications.acceptanceAlerts);
  setChecked(elements.closingReminders, settings.notifications.closingReminders);

  setChecked(elements.profileVisible, settings.privacy.profileVisible);
  setChecked(elements.shareCv, settings.privacy.shareCv);
  setChecked(elements.shareContactsAfterShortlist, settings.privacy.shareContactsAfterShortlist);

  setChecked(elements.prefInternships, settings.preferences.preferredTypes.internships);
  setChecked(elements.prefLearnerships, settings.preferences.preferredTypes.learnerships);
  setChecked(elements.prefApprenticeships, settings.preferences.preferredTypes.apprenticeships);
  setChecked(elements.rememberFilters, settings.preferences.rememberFilters);
  setChecked(elements.reducedMotion, settings.preferences.reducedMotion);
}

function collectSettingsFromForm() {
  return {
    notifications: {
      applicationUpdates: Boolean(elements.applicationUpdates?.checked),
      shortlistAlerts: Boolean(elements.shortlistAlerts?.checked),
      acceptanceAlerts: Boolean(elements.acceptanceAlerts?.checked),
      closingReminders: Boolean(elements.closingReminders?.checked)
    },
    privacy: {
      profileVisible: Boolean(elements.profileVisible?.checked),
      shareCv: Boolean(elements.shareCv?.checked),
      shareContactsAfterShortlist: Boolean(elements.shareContactsAfterShortlist?.checked)
    },
    preferences: {
      preferredTypes: {
        internships: Boolean(elements.prefInternships?.checked),
        learnerships: Boolean(elements.prefLearnerships?.checked),
        apprenticeships: Boolean(elements.prefApprenticeships?.checked)
      },
      rememberFilters: Boolean(elements.rememberFilters?.checked),
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
    setFeedback("Your applicant settings were saved.");
  } catch (error) {
    console.error("Unable to save applicant settings.", error);
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

function mergeSettings(base, override) {
  const merged = cloneData(base);
  mergeInto(merged, override);
  return merged;
}

function mergeInto(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (!(key in target)) {
      return;
    }

    if (Array.isArray(value)) {
      target[key] = cloneData(value);
      return;
    }

    if (isPlainObject(value) && isPlainObject(target[key])) {
      mergeInto(target[key], value);
      return;
    }

    target[key] = value;
  });
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneData(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function pickDisplayName(...values) {
  const match = values
    .map((value) => String(value || "").trim())
    .find(Boolean);

  return match || "Applicant";
}
