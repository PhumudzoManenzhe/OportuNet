import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const PROFILE_FIELD = "applicantProfile";
const routeContext = getRouteContext();

const initialPageData = Object.freeze({
    profile: {
        name: "",
        photoUrl: ""
    },
    about: {
        intro: "",
        passion: ""
    },
    personalDetails: {
        phone: "",
        email: "",
        address: ""
    },
    cv: {
        fileName: "",
        fileUrl: ""
    },
    experience: [],
    education: [],
    qualifications: {
        items: []
    },
    skills: {
        softSkills: [],
        technicalSkills: []
    },
    projects: {
        items: []
    },
    achievements: {
        items: []
    }
});

function cloneData(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

function getRouteContext() {
    const search = typeof window !== "undefined" && window?.location?.search
        ? String(window.location.search)
        : "";

    if (typeof URLSearchParams === "function") {
        const params = new URLSearchParams(search);
        return {
            applicantId: params.get("applicantId") || "",
            viewer: params.get("viewer") || ""
        };
    }

    return {
        applicantId: readQueryParam(search, "applicantId"),
        viewer: readQueryParam(search, "viewer")
    };
}

function readQueryParam(search, key) {
    const normalizedSearch = String(search || "").replace(/^\?/, "");
    if (!normalizedSearch || !key) return "";

    const parts = normalizedSearch.split("&");
    for (const part of parts) {
        const [rawKey, rawValue = ""] = part.split("=");
        if (decodeQueryValue(rawKey) === key) {
            return decodeQueryValue(rawValue);
        }
    }

    return "";
}

function decodeQueryValue(value) {
    try {
        return decodeURIComponent(String(value || "").replace(/\+/g, " "));
    } catch (_error) {
        return String(value || "");
    }
}

const profileGateway = {
    async fetchPageData() {
        const defaultPageData = cloneData(initialPageData);

        try {
            const targetApplicantId = routeContext.applicantId;
            const user = targetApplicantId ? null : await resolveCurrentUser();

            if (!targetApplicantId && !user) {
                return defaultPageData;
            }

            const userSnapshot = await getDoc(doc(db, "users", targetApplicantId || user.uid));

            if (!userSnapshot.exists()) {
                return defaultPageData;
            }

            return mergeProfileData(defaultPageData, userSnapshot.data()?.[PROFILE_FIELD]);
        } catch (error) {
            console.error("Unable to load applicant profile data from Firebase.", error);
            return defaultPageData;
        }
    }
};

const state = {
    feedbackTimer: null,
    pageData: null
};

const elements = {
    aboutSection: document.getElementById("about-section"),
    aboutIntro: document.getElementById("about-intro"),
    aboutPassion: document.getElementById("about-passion"),
    achievementsList: document.getElementById("achievements-list"),
    achievementsSection: document.getElementById("achievements-section"),
    avatarFallback: document.getElementById("avatar-fallback"),
    cvFileName: document.getElementById("cv-file-name"),
    cvFileNote: document.getElementById("cv-file-note"),
    cvSection: document.getElementById("cv-section"),
    closeProfilePictureButton: document.getElementById("close-profile-picture-button"),
    educationList: document.getElementById("education-list"),
    educationSection: document.getElementById("education-section"),
    educationTemplate: document.getElementById("education-item-template"),
    experienceList: document.getElementById("experience-list"),
    experienceSection: document.getElementById("experience-section"),
    feedback: document.getElementById("page-feedback"),
    personalAddress: document.getElementById("personal-address"),
    personalDetailsSection: document.getElementById("personal-details-section"),
    personalEmail: document.getElementById("personal-email"),
    personalPhone: document.getElementById("personal-phone"),
    profileBackButton: document.getElementById("profile-back-button"),
    profileName: document.getElementById("profile-name"),
    profilePictureButton: document.getElementById("profile-picture-button"),
    profilePictureFallback: document.getElementById("profile-picture-fallback"),
    profilePictureModal: document.getElementById("profile-picture-modal"),
    profilePicturePreview: document.getElementById("profile-picture-preview"),
    profilePhoto: document.getElementById("profile-photo"),
    profileSearchForm: document.getElementById("profile-search-form"),
    projectsList: document.getElementById("projects-list"),
    projectsSection: document.getElementById("projects-section"),
    qualificationsList: document.getElementById("qualifications-list"),
    qualificationsSection: document.getElementById("qualifications-section"),
    resumeTemplate: document.getElementById("resume-item-template"),
    skillsList: document.getElementById("skills-list"),
    skillsSection: document.getElementById("skills-section"),
    skillGroupTemplate: document.getElementById("skill-group-template"),
    viewCvLink: document.getElementById("view-cv-link")
};

document.addEventListener("DOMContentLoaded", initializePage);

async function initializePage() {
    bindEvents();

    try {
        state.pageData = await profileGateway.fetchPageData();
        renderPage();
    } catch (error) {
        console.error("Unable to load the profile page.", error);
        setFeedback("The profile could not be loaded.");
    }
}

function bindEvents() {
    if (elements.profileBackButton) {
        elements.profileBackButton.addEventListener("click", handleBackNavigation);
    }

    if (elements.profileSearchForm) {
        elements.profileSearchForm.addEventListener("submit", handleSearchSubmit);
    }

    if (elements.profilePictureButton) {
        elements.profilePictureButton.addEventListener("click", openProfilePictureViewer);
    }

    if (elements.closeProfilePictureButton) {
        elements.closeProfilePictureButton.addEventListener("click", closeProfilePictureViewer);
    }

    if (elements.profilePictureModal) {
        elements.profilePictureModal.addEventListener("click", ({ target }) => {
            if (target === elements.profilePictureModal) closeProfilePictureViewer();
        });
    }

    document.addEventListener("keydown", ({ key }) => {
        if (key === "Escape" && isPictureViewerOpen()) closeProfilePictureViewer();
    });
}

function handleBackNavigation() {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    if (routeContext.viewer === "recruiter") {
        window.location.href = "../Recruiter_homepage/index.html#applicationsSection";
        return;
    }

    window.location.href = "../Applicant_homepage/index.html";
}

function handleSearchSubmit(event) {
    event.preventDefault();
    setFeedback("Search will be connected to the wider application shell.");
}

function renderPage() {
    if (!state.pageData) {
        return;
    }

    renderProfile();
    renderAbout();
    renderEducation();
    renderExperience();
    renderSupplementalSection("qualifications", elements.qualificationsSection, elements.qualificationsList);
    renderSkills();
    renderSupplementalSection("projects", elements.projectsSection, elements.projectsList);
    renderSupplementalSection("achievements", elements.achievementsSection, elements.achievementsList);
    renderPersonalDetails();
    renderCv();
}

function renderProfile() {
    const { profile } = state.pageData;

    elements.profileName.textContent = profile.name;

    if (profile.photoUrl) {
        elements.profilePhoto.src = profile.photoUrl;
        elements.profilePhoto.hidden = false;
        elements.avatarFallback.hidden = true;
        return;
    }

    elements.profilePhoto.hidden = true;
    elements.profilePhoto.removeAttribute("src");
    elements.avatarFallback.hidden = false;
    elements.avatarFallback.textContent = getInitials(profile.name);
}

function renderAbout() {
    const aboutText = [state.pageData.about.intro, state.pageData.about.passion].filter(Boolean).join("\n\n");
    elements.aboutSection.hidden = !aboutText;
    elements.aboutIntro.textContent = aboutText;
    elements.aboutIntro.hidden = !aboutText;
    elements.aboutPassion.hidden = Boolean(aboutText);
}

function renderEducation() {
    renderEducationItems(state.pageData.education, elements.educationList);
    elements.educationSection.hidden = state.pageData.education.length === 0;
}

function renderExperience() {
    renderExperienceItems(state.pageData.experience, elements.experienceList);
    elements.experienceSection.hidden = state.pageData.experience.length === 0;
}

function renderSupplementalSection(sectionKey, sectionElement, listElement) {
    const sectionData = state.pageData[sectionKey];
    const items = Array.isArray(sectionData?.items) ? sectionData.items : [];

    renderSharedItems(items, listElement);
    sectionElement.hidden = items.length === 0;
}

function renderSkills() {
    const skillGroups = [];
    const { softSkills, technicalSkills } = state.pageData.skills;

    if (softSkills.length > 0) {
        skillGroups.push({
            id: "skills-soft",
            logo: "S",
            title: "Soft skills",
            items: softSkills
        });
    }

    if (technicalSkills.length > 0) {
        skillGroups.push({
            id: "skills-technical",
            logo: "T",
            title: "Technical skills",
            items: technicalSkills
        });
    }

    elements.skillsList.replaceChildren();
    elements.skillsSection.hidden = skillGroups.length === 0;

    skillGroups.forEach((group) => {
        const fragment = elements.skillGroupTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const skillList = fragment.querySelector(".grouped-skill-list");

        listItem.dataset.entryId = group.id;
        logo.textContent = group.logo;
        title.textContent = group.title;

        group.items.forEach((item) => {
            const skillItem = document.createElement("li");
            skillItem.textContent = item;
            skillList.append(skillItem);
        });

        elements.skillsList.append(fragment);
    });
}

function renderPersonalDetails() {
    const { phone, email, address } = state.pageData.personalDetails;
    const hasDetails = Boolean(phone || email || address);

    elements.personalDetailsSection.hidden = !hasDetails;
    setDetailText(elements.personalPhone, phone);
    setDetailText(elements.personalEmail, email);
    setDetailText(elements.personalAddress, address);
}

function renderCv() {
    const { fileName, fileUrl } = state.pageData.cv;
    const hasCv = Boolean(fileUrl);

    elements.cvSection.hidden = !hasCv;
    elements.viewCvLink.hidden = !hasCv;

    if (!hasCv) {
        elements.viewCvLink.removeAttribute("href");
        elements.viewCvLink.removeAttribute("download");
        return;
    }

    elements.cvFileName.textContent = fileName || "View uploaded CV";
    elements.cvFileNote.textContent = "PDF uploaded and ready to view.";
    elements.viewCvLink.href = fileUrl;
    elements.viewCvLink.download = fileName || "";
}

function renderEducationItems(items, targetList) {
    targetList.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.educationTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const field = fragment.querySelector(".education-field-line");
        const dates = fragment.querySelector(".education-date-line");
        const performance = fragment.querySelector(".education-performance-line");
        const description = fragment.querySelector(".education-description-line");
        const fieldText = [item.level, item.field].filter(Boolean).join(" - ");

        listItem.dataset.entryId = item.id;
        logo.textContent = item.logo || createLogoFromText(item.school);
        title.textContent = item.school;
        setOptionalText(field, fieldText);
        setOptionalText(dates, formatEducationDateRange(item));
        setOptionalText(performance, item.performance);
        setOptionalText(description, item.description);

        targetList.append(fragment);
    });
}

function renderExperienceItems(items, targetList) {
    targetList.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.resumeTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const companyLine = fragment.querySelector(".resume-company-line");
        const dateLine = fragment.querySelector(".resume-date-line");
        const locationLine = fragment.querySelector(".resume-location-line");
        const description = fragment.querySelector(".resume-description");

        listItem.dataset.entryId = item.id;
        logo.textContent = item.logo || createLogoFromText(item.title);
        title.textContent = item.title;
        setOptionalText(companyLine, [item.company, item.employmentType].filter(Boolean).join(" · "));
        setOptionalText(dateLine, [item.dates, item.duration].filter(Boolean).join(" · "));
        setOptionalText(locationLine, item.locationType);
        setOptionalText(description, item.description);

        targetList.append(fragment);
    });
}

function renderSharedItems(items, targetList) {
    targetList.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.resumeTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const companyLine = fragment.querySelector(".resume-company-line");
        const dateLine = fragment.querySelector(".resume-date-line");
        const locationLine = fragment.querySelector(".resume-location-line");
        const description = fragment.querySelector(".resume-description");

        listItem.dataset.entryId = item.id;
        logo.textContent = item.logo || createLogoFromText(item.title);
        title.textContent = item.title;
        const details = getQualificationDisplay(item);

        setOptionalText(companyLine, details.subtitle);
        setOptionalText(dateLine, details.dates);
        setOptionalText(locationLine, "");
        setOptionalText(description, item.description);

        targetList.append(fragment);
    });
}

function setOptionalText(element, value) {
    const hasValue = Boolean(value);
    element.textContent = hasValue ? value : "";
    element.hidden = !hasValue;
}

function setDetailText(element, value) {
    const hasValue = Boolean(value);
    element.textContent = hasValue ? value : "";
    element.hidden = !hasValue;
}

function createLogoFromText(value) {
    const match = value.trim().match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : "?";
}

function openProfilePictureViewer() {
    const profile = state.pageData?.profile || {};
    const hasPhoto = Boolean(profile.photoUrl);

    if (hasPhoto) {
        elements.profilePicturePreview.src = profile.photoUrl;
        elements.profilePicturePreview.hidden = false;
        elements.profilePictureFallback.hidden = true;
    } else {
        elements.profilePicturePreview.hidden = true;
        elements.profilePicturePreview.removeAttribute("src");
        elements.profilePictureFallback.hidden = false;
        elements.profilePictureFallback.textContent = getInitials(profile.name);
    }

    if (typeof elements.profilePictureModal.showModal === "function") {
        elements.profilePictureModal.showModal();
        return;
    }

    elements.profilePictureModal.hidden = false;
}

function closeProfilePictureViewer() {
    if (!elements.profilePictureModal) return;

    if (typeof elements.profilePictureModal.close === "function" && elements.profilePictureModal.open) {
        elements.profilePictureModal.close();
        return;
    }

    elements.profilePictureModal.hidden = true;
}

function isPictureViewerOpen() {
    if (!elements.profilePictureModal) return false;
    if (elements.profilePictureModal.open) return true;
    return typeof elements.profilePictureModal.showModal !== "function" && elements.profilePictureModal.hidden === false;
}

function formatDateForDisplay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "";

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function formatEducationDateRange(item) {
    if (!item) return "";
    if (item.startDate) {
        const start = formatDateForDisplay(item.startDate);
        const end = item.current ? "Present" : formatDateForDisplay(item.endDate);
        return [start, end].filter(Boolean).join(" - ");
    }

    return formatLegacyDateRange(item.dates);
}

function formatLegacyDateRange(value) {
    if (!value) return "";
    return value
        .split(" - ")
        .map((part) => part === "Present" || part === "No Expiry" ? part : formatDateForDisplay(part))
        .join(" - ");
}

function getQualificationDates(issueDate, expiryDate, noExpiry) {
    if (noExpiry) return `${issueDate} - No Expiry`;
    return [issueDate, expiryDate].filter(Boolean).join(" - ");
}

function getQualificationDisplay(item) {
    return {
        subtitle: [item.type, item.subtitle].filter(Boolean).join(" - "),
        dates: formatLegacyDateRange(item.dates || getQualificationDates(item.issueDate, item.expiryDate, item.noExpiry))
    };
}

function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function setFeedback(message) {
    window.clearTimeout(state.feedbackTimer);
    elements.feedback.textContent = message;
    elements.feedback.hidden = !message;

    if (!message) {
        return;
    }

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

function mergeProfileData(base, override) {
    if (!override || typeof override !== "object" || Array.isArray(override)) {
        return cloneData(base);
    }

    const merged = cloneData(base);
    mergeInto(merged, override);
    return merged;
}

function mergeInto(target, source) {
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
