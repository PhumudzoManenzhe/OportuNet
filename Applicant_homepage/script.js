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
    bindApplicantShell();
    const user = await resolveCurrentUser();
    const homeData = await loadApplicantHomeData(user);
    const applicantName = getApplicantDisplayName(homeData.userData, user);

    applyApplicantBranding(applicantName);
    renderApplicantSnapshot(buildApplicantSnapshot(homeData));
}

function bindApplicantShell() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const openBtn = document.getElementById("hamburgerBtn");
    const closeBtn = document.getElementById("sidebarCloseBtn");
    const logoutBtn = document.getElementById("sidebarLogoutBtn");

    function setSidebarState(isOpen) {
        if (!sidebar || !backdrop) return;
        sidebar.classList.toggle("is-open", isOpen);
        sidebar.setAttribute("aria-hidden", String(!isOpen));
        backdrop.hidden = !isOpen;
        document.body.classList.toggle("sidebar-open", isOpen);
    }

    if (openBtn) {
        openBtn.addEventListener("click", () => setSidebarState(true));
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => setSidebarState(false));
    }

    if (backdrop) {
        backdrop.addEventListener("click", () => setSidebarState(false));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            const isConfirmed = window.confirm("Are you sure you want to log out?");
            if (!isConfirmed) return;

            localStorage.removeItem("recruiter_jobs");
            localStorage.removeItem("recruiter_applications");
            sessionStorage.clear();
            window.location.href = "../SignUp_LogIn_pages/logIn.html";
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarState(false);
        }
    });
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
    const sidebarName = document.querySelector(".sidebar-brand .user-name");

    if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome ${name}`;
    }

    if (sidebarName) {
        sidebarName.textContent = name;
    }
}

function buildApplicantSnapshot({ user, userData, applications }) {
    const normalizedApplications = Array.isArray(applications) ? applications : [];
    const profile = userData?.applicantProfile || {};
    const pendingCount = normalizedApplications.filter((application) => normalizeApplicationStatus(application?.status) === "pending").length;
    const shortlistedCount = normalizedApplications.filter((application) => normalizeApplicationStatus(application?.status) === "shortlisted").length;
    const acceptedCount = normalizedApplications.filter((application) => normalizeApplicationStatus(application?.status) === "accepted").length;
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
            shortlistedCount: 0,
            totalApplications: 0,
            cvStatusLabel: "CV status unavailable"
        };
    }

    return {
        acceptedCount,
        latestActivityLabel: latestActivity || "No applications yet",
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
        shortlistedCount,
        totalApplications: normalizedApplications.length,
        cvStatusLabel: hasCv ? "CV ready to share" : "Add your CV"
    };
}

function renderApplicantSnapshot(snapshot) {
    setMetricText("totalApplicationsMetric", snapshot.totalApplications);
    setMetricText("pendingApplicationsMetric", snapshot.pendingCount);
    setMetricText("shortlistedApplicationsMetric", snapshot.shortlistedCount);
    setMetricText("acceptedApplicationsMetric", snapshot.acceptedCount);
    setMetricText("focusPanelHeading", `${snapshot.profileCompletion}%`);
    setMetricText("snapshotLead", snapshot.lead);
    setMetricText("cvStatusPill", snapshot.cvStatusLabel);
    setMetricText("latestActivityPill", snapshot.latestActivityLabel);
}

function setMetricText(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = String(value ?? "");
}

function normalizeApplicationStatus(status) {
    const normalizedStatus = String(status || "").trim().toLowerCase();

    if (normalizedStatus === "wishlisted" || normalizedStatus === "wish listed") {
        return "shortlisted";
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
        return "Complete your profile and upload your CV to make your next application stronger.";
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
