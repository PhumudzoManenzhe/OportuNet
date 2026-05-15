import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeApplicantHomepage().catch((error) => {
        console.error("Unable to load the applicant homepage.", error);
        applyApplicantBranding("Applicant");
    });
});

async function initializeApplicantHomepage() {
    const user = await resolveCurrentUser();
    const homeData = await loadApplicantHomeData(user);
    const applicantName = getApplicantDisplayName(homeData.userData, user);

    applyApplicantBranding(applicantName);
    renderApplicantSnapshot(buildApplicantSnapshot(homeData));
}

async function loadApplicantDisplayName() {
    const user = await resolveCurrentUser();
    if (!user) return "Applicant";

    const userSnapshot = await getDoc(doc(db, "users", user.uid));
    const userData = userSnapshot.exists() ? userSnapshot.data() : {};
    return getApplicantDisplayName(userData, user);
}

async function loadApplicantHomeData(user) {
    if (!user) {
        return {
            user,
            userData: {},
            applications: []
        };
    }

    const userDocPromise = getDoc(doc(db, "users", user.uid));
    const applicationsPromise = getDocs(
        query(collection(db, "applications"), where("applicantId", "==", user.uid))
    );

    const [userSnapshot, applicationsSnapshot] = await Promise.all([userDocPromise, applicationsPromise]);

    return {
        user,
        userData: userSnapshot.exists() ? userSnapshot.data() : {},
        applications: applicationsSnapshot.docs.map((snapshot) => snapshot.data())
    };
}

function getApplicantDisplayName(userData, user = {}) {
    return userData?.applicantProfile?.profile?.name
        || userData?.displayName
        || userData?.fullName
        || user?.displayName
        || "Applicant";
}

function applyApplicantBranding(applicantName = "Applicant") {
    const name = applicantName || "Applicant";
    const welcomeHeading = document.querySelector(".welcome h1");

    if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome ${name}`;
    }
}

function buildApplicantSnapshot({ user, userData, applications }) {
    const normalizedApplications = Array.isArray(applications) ? applications : [];
    const profile = userData?.applicantProfile || {};
    const pendingCount = normalizedApplications.filter((application) => normalizeApplicationStatus(application?.status) === "pending").length;
    const shortlistedCount = normalizedApplications.filter((application) => normalizeApplicationStatus(application?.status) === "shortlisted").length;
    const acceptedCount = normalizedApplications.filter((application) => normalizeApplicationStatus(application?.status) === "accepted").length;
    const rejectedCount = normalizedApplications.filter((application) => normalizeApplicationStatus(application?.status) === "rejected").length;
    const profileCompletion = calculateProfileCompletion(profile);
    const hasCv = Boolean(profile?.cv?.fileUrl);
    const latestActivity = getLatestApplicationDate(normalizedApplications);

    if (!user) {
        return {
            acceptedCount: 0,
            latestActivityLabel: "Log in to track progress",
            lead: "Sign in to see your applications, profile readiness, and next best step.",
            pendingCount: 0,
            profileCompletion,
            rejectedCount: 0,
            shortlistedCount: 0,
            totalApplications: 0,
            cvStatusLabel: "CV status unavailable"
        };
    }

    return {
        acceptedCount,
        latestActivityLabel: latestActivity || "",
        lead: buildSnapshotLead({
            acceptedCount,
            hasCv,
            pendingCount,
            profileCompletion,
            shortlistedCount,
            totalApplications: normalizedApplications.length
        }),
        pendingCount,
        profileCompletion,
        rejectedCount,
        shortlistedCount,
        totalApplications: normalizedApplications.length,
        cvStatusLabel: hasCv ? "CV ready to share" : ""
    };
}

function renderApplicantSnapshot(snapshot) {
    setMetricText("totalApplicationsMetric", snapshot.totalApplications);
    setMetricText("pendingApplicationsMetric", snapshot.pendingCount);
    setMetricText("shortlistedApplicationsMetric", snapshot.shortlistedCount);
    setMetricText("acceptedApplicationsMetric", snapshot.acceptedCount);
    setMetricText("rejectedApplicationsMetric", snapshot.rejectedCount);
    setOptionalText("snapshotLead", snapshot.lead);
    setOptionalText("cvStatusPill", snapshot.cvStatusLabel);
    setOptionalText("latestActivityPill", snapshot.latestActivityLabel);

    updateProfileStrength(snapshot.profileCompletion);
}

function updateProfileStrength(profileCompletion) {
    const focusPanel = document.querySelector(".focus-panel");
    const profileStrength = Math.max(0, Math.min(100, Number(profileCompletion) || 0));
    setMetricText("focusPanelHeading", `${profileStrength}%`);

    if (!focusPanel) return;

    focusPanel.style?.setProperty("--profile-strength", `${profileStrength}%`);
}

function setMetricText(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = String(value ?? "");
}

function setOptionalText(id, value) {
    const element = document.getElementById(id);
    if (!element) return;

    const text = String(value ?? "").trim();
    element.textContent = text;
    element.hidden = text.length === 0;
}

function normalizeApplicationStatus(status) {
    const normalizedStatus = String(status || "").trim().toLowerCase();

    if (normalizedStatus === "wishlisted" || normalizedStatus === "wish listed") {
        return "shortlisted";
    }

    if (normalizedStatus === "declined") {
        return "rejected";
    }

    return normalizedStatus;
}

function calculateProfileCompletion(profile) {
    const checks = [
        Boolean(profile?.profile?.name),
        Boolean(profile?.about?.intro),
        Boolean(profile?.personalDetails?.phone),
        Boolean(profile?.personalDetails?.email),
        Array.isArray(profile?.education) && profile.education.length > 0,
        hasApplicantSkills(profile?.skills),
        Boolean(profile?.cv?.fileUrl)
    ];
    const completedChecks = checks.filter(Boolean).length;
    return Math.round((completedChecks / checks.length) * 100);
}

function hasApplicantSkills(skills) {
    return Boolean(
        (Array.isArray(skills?.softSkills) && skills.softSkills.length > 0)
        || (Array.isArray(skills?.technicalSkills) && skills.technicalSkills.length > 0)
    );
}

function buildSnapshotLead({ acceptedCount, hasCv, pendingCount, profileCompletion, shortlistedCount, totalApplications }) {
    if (acceptedCount > 0) {
        return `You already have ${acceptedCount} accepted application${acceptedCount === 1 ? "" : "s"}. Keep your profile polished for the next step.`;
    }

    if (shortlistedCount > 0) {
        return `${shortlistedCount} application${shortlistedCount === 1 ? " is" : "s are"} moving forward. Stay ready for recruiter follow-up.`;
    }

    if (pendingCount > 0) {
        return `${pendingCount} application${pendingCount === 1 ? " is" : "s are"} currently waiting for review.`;
    }

    if (profileCompletion < 70 || !hasCv) {
        return "";
    }

    if (totalApplications === 0) {
        return "Your profile is in a good place. Start exploring opportunities and submit your first application.";
    }

    return "You are in a strong position. Keep applying to opportunities that match your goals.";
}

function getLatestApplicationDate(applications) {
    const latestTimestamp = applications
        .map((application) => application?.statusUpdatedAt || application?.appliedAt || "")
        .filter(Boolean)
        .sort()
        .slice(-1)[0];

    if (!latestTimestamp) {
        return "";
    }

    return `Last update ${formatIsoDate(latestTimestamp)}`;
}

function formatIsoDate(value) {
    return value ? String(value).split("T")[0] : "";
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
