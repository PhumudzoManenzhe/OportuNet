import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const OPPORTUNITY_TYPE = "Learnership";
const APPLICATIONS_COLLECTION = "applications";

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-Learnerships");
    const searchButton = document.querySelector(".search-area button");

    loadOpportunities("").catch((error) => {
        console.error("Unable to load learnerships.", error);
        renderStatusMessage("Learnerships could not be loaded right now.");
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderOpportunities(filterOpportunities(searchInput.value));
        });
    }

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", () => {
            renderOpportunities(filterOpportunities(searchInput.value));
        });
    }
});

let allOpportunities = [];

async function loadOpportunities(searchTerm) {
    const snapshots = await getDocs(
        query(
            collection(db, "opportunities"),
            where("opportunityType", "==", OPPORTUNITY_TYPE)
        )
    );
    const activeJobs = [];

    snapshots.forEach((snapshot) => {
        const job = snapshot.data();
        if (job.status !== "active") return;
        activeJobs.push({ id: snapshot.id, job });
    });

    const recruiterNames = await loadRecruiterNames(activeJobs);
    const opportunities = activeJobs.map(({ id, job }) => {
        return {
            id,
            title: job.title || "Learnership Opportunity",
            companyName: getCompanyName(job, recruiterNames.get(job.ownerUid)),
            location: job.location || "Not specified",
            duration: job.duration || "Not specified",
            stipend: job.stipend || "Not specified",
            description: job.description || "",
            closingDate: job.closingDate || "Not specified",
            requirements: Array.isArray(job.requirements) ? job.requirements : [],
            postedDate: formatIsoDate(job.postedAt || job.updatedAt || ""),
            recruiterId: job.ownerUid || ""
        };
    });

    allOpportunities = opportunities.sort((left, right) => new Date(right.postedDate || 0) - new Date(left.postedDate || 0));
    renderOpportunities(filterOpportunities(searchTerm));
}

function filterOpportunities(searchTerm) {
    const normalizedTerm = String(searchTerm || "").trim().toLowerCase();
    if (!normalizedTerm) return allOpportunities;

    return allOpportunities.filter((opportunity) => {
        return opportunity.title.toLowerCase().includes(normalizedTerm)
            || opportunity.companyName.toLowerCase().includes(normalizedTerm)
            || opportunity.location.toLowerCase().includes(normalizedTerm);
    });
}

function renderOpportunities(opportunities) {
    const container = document.getElementById("learnerships-list");
    if (!container) return;

    if (opportunities.length === 0) {
        renderStatusMessage("No learnerships found.");
        return;
    }

    container.innerHTML = opportunities.map((opportunity) => `
        <article class="Learnerships-card">
          <header class="card-header">
            <h4>${escapeHtml(opportunity.title)}</h4>
            <p>${escapeHtml(opportunity.companyName)}</p>
          </header>

          <section class="card-details">
            <p><strong>Location:</strong> ${escapeHtml(opportunity.location)}</p>
            <p><strong>Duration:</strong> ${escapeHtml(opportunity.duration)}</p>
            <p><strong>Stipend:</strong> ${escapeHtml(opportunity.stipend)}</p>
          </section>

          <section class="card-description">
            <p>${escapeHtml(opportunity.description || "No description provided.")}</p>
          </section>

          <footer class="card-footer">
            <button type="button" class="details-btn" data-role="details" data-id="${escapeHtml(String(opportunity.id))}">View More Details</button>
            <button type="button" class="apply-btn" data-role="apply" data-id="${escapeHtml(String(opportunity.id))}">Apply</button>
          </footer>
        </article>
    `).join("");

    bindCardActions();
}

function bindCardActions() {
    const container = document.getElementById("learnerships-list");
    if (!container) return;

    container.querySelectorAll('[data-role="details"]').forEach((button) => {
        button.addEventListener("click", () => {
            const opportunity = findOpportunity(button.dataset.id);
            if (!opportunity) return;

            const requirementText = opportunity.requirements.length > 0
                ? opportunity.requirements.map((requirement) => `- ${requirement}`).join("\n")
                : "No requirements specified.";

            alert(
                `${opportunity.title}\n${opportunity.companyName}\n\n`
                + `Location: ${opportunity.location}\n`
                + `Duration: ${opportunity.duration}\n`
                + `Stipend: ${opportunity.stipend}\n`
                + `Closing Date: ${opportunity.closingDate}\n\n`
                + `${opportunity.description || "No description provided."}\n\n`
                + `Requirements:\n${requirementText}`
            );
        });
    });

    container.querySelectorAll('[data-role="apply"]').forEach((button) => {
        button.addEventListener("click", async () => {
            const opportunity = findOpportunity(button.dataset.id);
            if (!opportunity) return;

            await applyForOpportunity(opportunity, button);
        });
    });
}

function findOpportunity(id) {
    return allOpportunities.find((opportunity) => String(opportunity.id) === String(id));
}

function formatIsoDate(value) {
    return value ? String(value).split("T")[0] : "";
}

function renderStatusMessage(message) {
    const container = document.getElementById("learnerships-list");
    if (!container) return;

    container.innerHTML = `<p class="status-message">${escapeHtml(message)}</p>`;
}

async function applyForOpportunity(opportunity, button) {
    const user = await resolveCurrentUser();
    if (!user) {
        alert("Please log in before applying.");
        return;
    }

    const applicationId = `${user.uid}_${opportunity.id}`;
    const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    const originalLabel = button?.textContent || "Apply";

    if (button) {
        button.disabled = true;
        button.textContent = "Applying...";
    }

    try {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));
        const userData = userSnapshot.exists() ? userSnapshot.data() : {};

        await setDoc(applicationRef, buildApplicationPayload(opportunity, userData, user));
        markApplyButtonComplete(button);
        alert(`Application submitted for ${opportunity.title} at ${opportunity.companyName}.`);
    } catch (error) {
        console.error("Unable to submit application.", error);
        if (button) {
            button.disabled = false;
            button.textContent = originalLabel;
        }
        alert(getApplicationErrorMessage(error));
    }
}

function buildApplicationPayload(opportunity, userData, user) {
    const applicantProfile = userData?.applicantProfile || {};

    return {
        applicantEmail: user.email || applicantProfile?.personalDetails?.email || "",
        applicantId: user.uid,
        applicantName: getApplicantName(userData, user),
        appliedAt: new Date().toISOString(),
        companyName: opportunity.companyName || "",
        cvFileName: applicantProfile?.cv?.fileName || "",
        cvFileUrl: applicantProfile?.cv?.fileUrl || "",
        jobId: opportunity.id,
        opportunityTitle: opportunity.title || "Opportunity",
        opportunityType: OPPORTUNITY_TYPE,
        qualifications: getApplicantQualificationSummary(applicantProfile),
        recruiterId: opportunity.recruiterId || "",
        status: "pending"
    };
}

function getApplicantName(userData, user = {}) {
    return userData?.applicantProfile?.profile?.name
        || userData?.displayName
        || userData?.fullName
        || user?.displayName
        || user?.email
        || "Applicant";
}

function getApplicantQualificationSummary(applicantProfile = {}) {
    const qualificationTitles = (applicantProfile?.qualifications?.items || [])
        .map((item) => String(item?.title || "").trim())
        .filter(Boolean);
    const technicalSkills = (applicantProfile?.skills?.technicalSkills || [])
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    const softSkills = (applicantProfile?.skills?.softSkills || [])
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    const summary = [];

    if (qualificationTitles.length > 0) {
        summary.push(qualificationTitles.slice(0, 2).join(", "));
    }

    if (technicalSkills.length > 0) {
        summary.push(`Skills: ${technicalSkills.slice(0, 3).join(", ")}`);
    } else if (softSkills.length > 0) {
        summary.push(`Strengths: ${softSkills.slice(0, 3).join(", ")}`);
    }

    return summary.join(" | ") || "Profile details not provided";
}

function markApplyButtonComplete(button) {
    if (!button) return;
    button.disabled = true;
    button.textContent = "Applied";
}

function getApplicationErrorMessage(error) {
    if (isPermissionError(error)) {
        return "Firestore permissions are blocking application submissions right now.";
    }

    const message = String(error?.message || "").trim();
    return message || "Your application could not be submitted right now.";
}

function isPermissionError(error) {
    return error?.code === "permission-denied"
        || /insufficient permissions|missing or insufficient permissions/i.test(String(error?.message || ""));
}

async function loadRecruiterNames(activeJobs) {
    const ownerIds = [...new Set(activeJobs.map(({ job }) => job.ownerUid).filter(Boolean))];
    const entries = await Promise.all(ownerIds.map(async (ownerUid) => {
        try {
            const userSnapshot = await getDoc(doc(db, "users", ownerUid));
            const userData = userSnapshot.exists() ? userSnapshot.data() : {};
            return [ownerUid, getRecruiterNameFromUser(userData)];
        } catch (error) {
            console.error("Unable to load recruiter name.", error);
            return [ownerUid, ""];
        }
    }));

    return new Map(entries.filter(([, name]) => name));
}

function getRecruiterNameFromUser(userData) {
    return getDisplayName(
        userData?.recruiterProfile?.companyName,
        userData?.recruiterProfile?.organisationName,
        userData?.recruiterProfile?.organizationName,
        userData?.companyName,
        userData?.recruiterProfile?.contactName,
        userData?.recruiterProfile?.fullName,
        userData?.displayName,
        userData?.fullName
    );
}

function getCompanyName(job, resolvedRecruiterName = "") {
    return getDisplayName(
        job?.companyName,
        job?.organisationName,
        job?.organizationName,
        job?.recruiterName,
        job?.postedByName,
        job?.contactName,
        job?.displayName,
        job?.fullName,
        resolvedRecruiterName
    );
}

function getDisplayName(...values) {
    const name = values
        .map((value) => String(value || "").trim())
        .find((value) => value && !isEmailLike(value) && !isGenericRecruiterName(value));

    return name || "Recruiter";
}

function isEmailLike(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isGenericRecruiterName(value) {
    return String(value || "").trim().toLowerCase() === "recruiter";
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
