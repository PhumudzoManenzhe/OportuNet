import { db } from "../FireStore_db/firebase.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const OPPORTUNITY_TYPE = "Internship";

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-internships");
    const searchButton = document.querySelector(".search-area button");

    loadInternships("").catch((error) => {
        console.error("Unable to load internships.", error);
        renderStatusMessage("Internships could not be loaded right now.");
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            filterAndRender(searchInput.value);
        });
    }

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", () => {
            filterAndRender(searchInput.value);
        });
    }
});

let allInternships = [];

async function loadInternships(searchTerm) {
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
    const internships = activeJobs.map(({ id, job }) => {
        return {
            id,
            title: job.title || "Internship Opportunity",
            companyName: getCompanyName(job, recruiterNames.get(job.ownerUid)),
            location: job.location || "Not specified",
            duration: job.duration || "Not specified",
            stipend: job.stipend || "Not specified",
            description: job.description || "",
            closingDate: job.closingDate || "Not specified",
            requirements: Array.isArray(job.requirements) ? job.requirements : [],
            postedDate: formatIsoDate(job.postedAt || job.updatedAt || "")
        };
    });

    allInternships = internships.sort((left, right) => new Date(right.postedDate || 0) - new Date(left.postedDate || 0));
    renderInternships(filterInternships(searchTerm));
}

function filterAndRender(searchTerm) {
    renderInternships(filterInternships(searchTerm));
}

function filterInternships(searchTerm) {
    const normalizedTerm = String(searchTerm || "").trim().toLowerCase();
    if (!normalizedTerm) return allInternships;

    return allInternships.filter((internship) => {
        return internship.title.toLowerCase().includes(normalizedTerm)
            || internship.companyName.toLowerCase().includes(normalizedTerm)
            || internship.location.toLowerCase().includes(normalizedTerm);
    });
}

function renderInternships(internships) {
    const container = document.getElementById("internship-list");
    if (!container) return;

    if (internships.length === 0) {
        renderStatusMessage("No internships found.");
        return;
    }

    container.innerHTML = internships.map((internship) => `
        <article class="internship-card">
          <header class="card-header">
            <h4>${escapeHtml(internship.title)}</h4>
            <p>${escapeHtml(internship.companyName)}</p>
          </header>

          <section class="card-details">
            <p><strong>Location:</strong> ${escapeHtml(internship.location)}</p>
            <p><strong>Duration:</strong> ${escapeHtml(internship.duration)}</p>
            <p><strong>Stipend:</strong> ${escapeHtml(internship.stipend)}</p>
          </section>

          <section class="card-description">
            <p>${escapeHtml(internship.description || "No description provided.")}</p>
          </section>

          <footer class="card-footer">
            <button type="button" class="details-btn" data-role="details" data-id="${escapeHtml(String(internship.id))}">View More Details</button>
            <button type="button" class="apply-btn" data-role="apply" data-id="${escapeHtml(String(internship.id))}">Apply</button>
          </footer>
        </article>
    `).join("");

    bindCardActions();
}

function bindCardActions() {
    const container = document.getElementById("internship-list");
    if (!container) return;

    container.querySelectorAll('[data-role="details"]').forEach((button) => {
        button.addEventListener("click", () => {
            const internship = findInternship(button.dataset.id);
            if (!internship) return;

            const requirementText = internship.requirements.length > 0
                ? internship.requirements.map((requirement) => `- ${requirement}`).join("\n")
                : "No requirements specified.";

            alert(
                `${internship.title}\n${internship.companyName}\n\n`
                + `Location: ${internship.location}\n`
                + `Duration: ${internship.duration}\n`
                + `Stipend: ${internship.stipend}\n`
                + `Closing Date: ${internship.closingDate}\n\n`
                + `${internship.description || "No description provided."}\n\n`
                + `Requirements:\n${requirementText}`
            );
        });
    });

    container.querySelectorAll('[data-role="apply"]').forEach((button) => {
        button.addEventListener("click", () => {
            const internship = findInternship(button.dataset.id);
            if (!internship) return;

            alert(`Application started for ${internship.title} at ${internship.companyName}.`);
        });
    });
}

function findInternship(id) {
    return allInternships.find((internship) => String(internship.id) === String(id));
}

function renderStatusMessage(message) {
    const container = document.getElementById("internship-list");
    if (!container) return;

    container.innerHTML = `<p class="status-message">${escapeHtml(message)}</p>`;
}

function formatIsoDate(value) {
    return value ? String(value).split("T")[0] : "";
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
