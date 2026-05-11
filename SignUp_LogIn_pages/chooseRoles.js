import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const PROFILE_FIELD = "applicantProfile";

const applicantBtn = document.getElementById("applicantBtn");
const recruiterBtn = document.getElementById("recruiterBtn");
const applicantDetailsForm = document.getElementById("applicantDetailsForm");
const recruiterDetailsForm = document.getElementById("recruiterDetailsForm");
const cancelApplicantDetailsBtn = document.getElementById("cancelApplicantDetailsBtn");
const cancelRecruiterDetailsBtn = document.getElementById("cancelRecruiterDetailsBtn");
const saveApplicantDetailsBtn = document.getElementById("saveApplicantDetailsBtn");
const saveRecruiterDetailsBtn = document.getElementById("saveRecruiterDetailsBtn");
const roleFeedback = document.getElementById("roleFeedback");

const applicantFields = {
    fullName: document.getElementById("applicantFullName"),
    email: document.getElementById("applicantEmail"),
    phone: document.getElementById("applicantPhone"),
    address: document.getElementById("applicantAddress")
};

const recruiterFields = {
    fullName: document.getElementById("recruiterFullName"),
    organisationName: document.getElementById("recruiterOrganisationName")
};

prefillRoleDetails();

function showApplicantDetails() {
    prefillRoleDetails();
    if (applicantDetailsForm) applicantDetailsForm.hidden = false;
    if (recruiterDetailsForm) recruiterDetailsForm.hidden = true;
    if (applicantBtn) {
        applicantBtn.classList.add("role-btn-selected");
        applicantBtn.setAttribute("aria-expanded", "true");
    }
    if (recruiterBtn) {
        recruiterBtn.classList.remove("role-btn-selected");
        recruiterBtn.setAttribute("aria-expanded", "false");
    }
    setFeedback("Complete your applicant details. Address is optional.");
    focusFirstInvalidApplicantField();
}

function showRecruiterDetails() {
    prefillRoleDetails();
    if (recruiterDetailsForm) recruiterDetailsForm.hidden = false;
    if (applicantDetailsForm) applicantDetailsForm.hidden = true;
    if (recruiterBtn) {
        recruiterBtn.classList.add("role-btn-selected");
        recruiterBtn.setAttribute("aria-expanded", "true");
    }
    if (applicantBtn) {
        applicantBtn.classList.remove("role-btn-selected");
        applicantBtn.setAttribute("aria-expanded", "false");
    }
    setFeedback("Add your name so your dashboard can greet you properly.");
    focusFirstInvalidRecruiterField();
}

function hideRoleForms() {
    if (applicantDetailsForm) applicantDetailsForm.hidden = true;
    if (recruiterDetailsForm) recruiterDetailsForm.hidden = true;
    if (applicantBtn) {
        applicantBtn.classList.remove("role-btn-selected");
        applicantBtn.setAttribute("aria-expanded", "false");
    }
    if (recruiterBtn) {
        recruiterBtn.classList.remove("role-btn-selected");
        recruiterBtn.setAttribute("aria-expanded", "false");
    }
    setFeedback("");
}

async function setRole(role, providedDetails = null) {
    const user = await resolveCurrentUser();

    if (!user) {
        alert("User not logged in");
        return;
    }

    const userData = {
        email: user.email || "",
        role
    };

    if (role === "applicant") {
        const applicantDetails = providedDetails || readApplicantDetails();
        if (!validateApplicantDetails(applicantDetails)) return;

        userData.email = applicantDetails.email || user.email || "";
        userData.displayName = applicantDetails.fullName;
        userData[PROFILE_FIELD] = buildApplicantProfile(applicantDetails);
    }

    if (role === "recruiter") {
        const recruiterDetails = providedDetails || readRecruiterDetails();
        if (!validateRecruiterDetails(recruiterDetails)) return;

        userData.displayName = recruiterDetails.fullName;
        userData.companyName = recruiterDetails.organisationName || recruiterDetails.fullName;
        userData.recruiterProfile = buildRecruiterProfile(recruiterDetails);
    }

    const docRef = doc(db, "users", user.uid);
    setSavingState(true);

    try {
        await setDoc(docRef, userData, { merge: true });
        window.location.href = role === "applicant"
            ? "../Applicant_homepage/index.html"
            : "../Recruiter_homepage/index.html";
    } catch (error) {
        console.error(error);
        alert("Error saving role");
    } finally {
        setSavingState(false);
    }
}

function readApplicantDetails() {
    return {
        fullName: readValue(applicantFields.fullName),
        email: readValue(applicantFields.email),
        phone: readValue(applicantFields.phone),
        address: readValue(applicantFields.address)
    };
}

function readRecruiterDetails() {
    return {
        fullName: readValue(recruiterFields.fullName),
        organisationName: readValue(recruiterFields.organisationName)
    };
}

function validateApplicantDetails(details) {
    if (details.fullName && details.email && details.phone) {
        return true;
    }

    setFeedback("Please add your full name, email address, and phone number before continuing.");
    focusFirstInvalidApplicantField();
    return false;
}

function validateRecruiterDetails(details) {
    if (details.fullName) {
        return true;
    }

    setFeedback("Please add your name before continuing.");
    focusFirstInvalidRecruiterField();
    return false;
}

function buildApplicantProfile(details) {
    return {
        profile: {
            name: details.fullName,
            addSectionButton: "Add section",
            photoUrl: ""
        },
        personalDetails: {
            phone: details.phone,
            email: details.email,
            address: details.address || ""
        }
    };
}

function buildRecruiterProfile(details) {
    const companyName = details.organisationName || details.fullName;

    return {
        contactName: details.fullName,
        fullName: details.fullName,
        companyName,
        organisationName: details.organisationName || ""
    };
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

function prefillRoleDetails() {
    setFieldValueIfEmpty(applicantFields.email, auth.currentUser?.email || "");
}

function setFieldValueIfEmpty(field, value) {
    if (!field || field.value || !value) return;
    field.value = value;
}

function readValue(field) {
    return field?.value.trim() || "";
}

function focusFirstInvalidApplicantField() {
    const fields = [applicantFields.fullName, applicantFields.email, applicantFields.phone];
    for (const field of fields) {
        if (field && !readValue(field)) {
            field.focus();
            return;
        }
    }
}

function focusFirstInvalidRecruiterField() {
    if (recruiterFields.fullName && !readValue(recruiterFields.fullName)) {
        recruiterFields.fullName.focus();
    }
}

function setFeedback(message) {
    if (!roleFeedback) return;
    roleFeedback.textContent = message;
    roleFeedback.hidden = !message;
}

function setSavingState(isSaving) {
    const buttons = [applicantBtn, recruiterBtn, saveApplicantDetailsBtn, saveRecruiterDetailsBtn];
    for (const button of buttons) {
        if (button) {
            button.disabled = isSaving;
        }
    }
}

function handleApplicantSubmit(event) {
    event.preventDefault();
    setRole("applicant");
}

function handleRecruiterSubmit(event) {
    event.preventDefault();
    setRole("recruiter");
}

if (applicantBtn) applicantBtn.addEventListener("click", showApplicantDetails);
if (recruiterBtn) recruiterBtn.addEventListener("click", showRecruiterDetails);
if (applicantDetailsForm) applicantDetailsForm.addEventListener("submit", handleApplicantSubmit);
if (recruiterDetailsForm) recruiterDetailsForm.addEventListener("submit", handleRecruiterSubmit);
if (cancelApplicantDetailsBtn) cancelApplicantDetailsBtn.addEventListener("click", hideRoleForms);
if (cancelRecruiterDetailsBtn) cancelRecruiterDetailsBtn.addEventListener("click", hideRoleForms);
