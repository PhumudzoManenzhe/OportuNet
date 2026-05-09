import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeApplicantHomepage().catch((error) => {
        console.error("Unable to load the applicant homepage.", error);
        applyApplicantBranding("Applicant");
    });
});

async function initializeApplicantHomepage() {
    bindApplicantShell();
    const applicantName = await loadApplicantDisplayName();
    applyApplicantBranding(applicantName);
}

function bindApplicantShell() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const openBtn = document.getElementById("hamburgerBtn");
    const closeBtn = document.getElementById("sidebarCloseBtn");
    const deleteAccountBtn = document.getElementById("sidebarDeleteAccountBtn");
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

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", startDeleteAccountFlow);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarState(false);
        }
    });
}

async function startDeleteAccountFlow() {
    try {
        const module = await import("../shared/account-actions.js");
        await module.startDeleteAccountFlow({ loginHref: "../SignUp_LogIn_pages/logIn.html" });
    } catch (error) {
        console.error("Unable to start account deletion.", error);
        alert("Account deletion could not be started.");
    }
}

async function loadApplicantDisplayName() {
    const user = await resolveCurrentUser();
    if (!user) return "Applicant";

    const userSnapshot = await getDoc(doc(db, "users", user.uid));
    const userData = userSnapshot.exists() ? userSnapshot.data() : {};
    return getApplicantDisplayName(userData, user);
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
