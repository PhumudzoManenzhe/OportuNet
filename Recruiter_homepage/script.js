import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const DASHBOARD_FIELD = "recruiterHomepage";
const OPPORTUNITIES_COLLECTION = "opportunities";
const APPLICATIONS_COLLECTION = "applications";

// ========== DATA STORAGE ==========
let jobs = [];
let applications = [];
let notifications = [];
let currentFilter = "pending";
let searchTerm = "";
let currentSort = "date";
let currentPage = 1;
const jobsPerPage = 5;
let selectedJobs = new Set();
let bulkMode = false;
let editingJobId = null;
let pendingDeleteJobId = null;
let activeApplicationsJobId = "";
let activeApplicationsJobTitle = "";
let isSubmittingJob = false;
let isDeletingJob = false;
let confirmActionHandler = null;
let currentRecruiter = {
    uid: "",
    email: "",
    displayName: "Recruiter",
    companyName: "Recruiter"
};

// ========== HELPER FUNCTIONS ==========
function normalizeOpportunityType(value) {
    const normalized = String(value || "").trim().toLowerCase();

    if (normalized === "internship") return "Internship";
    if (normalized === "learnership") return "Learnership";
    if (normalized === "apprenticeship") return "Apprenticeship";
    return "";
}

function inferOpportunityType(job) {
    const explicitType = normalizeOpportunityType(job?.opportunityType);
    if (explicitType) return explicitType;

    const title = String(job?.title || "").toLowerCase();
    if (title.endsWith(" internship") || title.includes(" internship")) return "Internship";
    if (title.endsWith(" learnership") || title.includes(" learnership")) return "Learnership";
    if (title.endsWith(" apprenticeship") || title.includes(" apprenticeship")) return "Apprenticeship";
    return "";
}

function formatIsoDate(value) {
    return value ? String(value).split("T")[0] : "";
}

function getRecruiterCompanyName(userData, user) {
    return getDisplayName(
        userData?.recruiterProfile?.companyName,
        userData?.recruiterProfile?.organisationName,
        userData?.recruiterProfile?.organizationName,
        userData?.companyName,
        userData?.displayName,
        user?.displayName
    );
}

function getRecruiterDisplayName(userData, user) {
    return getDisplayName(
        userData?.recruiterProfile?.contactName,
        userData?.recruiterProfile?.fullName,
        userData?.displayName,
        userData?.recruiterProfile?.companyName,
        userData?.companyName,
        user?.displayName
    );
}

function getDisplayName(...values) {
    const name = values
        .map((value) => String(value || "").trim())
        .find((value) => value && !isEmailLike(value));

    return name || "Recruiter";
}

function isEmailLike(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function mapOpportunitySnapshot(snapshot) {
    const job = snapshot.data();
    return {
        id: snapshot.id,
        ownerUid: job.ownerUid || "",
        title: job.title || "",
        opportunityType: inferOpportunityType(job),
        companyName: job.companyName || "",
        location: job.location || "",
        stipend: job.stipend || "",
        duration: job.duration || "",
        closingDate: job.closingDate || "",
        nqfLevel: job.nqfLevel || "",
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        description: job.description || "",
        postedAt: job.postedAt || "",
        updatedAt: job.updatedAt || "",
        postedDate: formatIsoDate(job.postedAt),
        status: job.status === "closed" ? "closed" : "active"
    };
}

function mapApplicationSnapshot(snapshot) {
    const application = snapshot.data();
    return {
        id: snapshot.id,
        applicantId: application.applicantId || "",
        applicantEmail: application.applicantEmail || "",
        companyName: application.companyName || "",
        jobId: application.jobId || "",
        recruiterId: application.recruiterId || "",
        applicantName: application.applicantName || "Unknown applicant",
        cvFileName: application.cvFileName || "",
        cvFileUrl: application.cvFileUrl || "",
        qualifications: application.qualifications || "Not provided",
        opportunityTitle: application.opportunityTitle || "",
        opportunityType: application.opportunityType || "",
        status: application.status || "pending",
        appliedAt: application.appliedAt || "",
        statusUpdatedAt: application.statusUpdatedAt || application.appliedAt || "",
        appliedDate: formatIsoDate(application.appliedAt)
    };
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>]/g, (match) => {
        if (match === "&") return "&amp;";
        if (match === "<") return "&lt;";
        return "&gt;";
    });
}

function escapeAttribute(value) {
    return String(value || "").replace(/["&'<>]/g, (match) => {
        if (match === "&") return "&amp;";
        if (match === "<") return "&lt;";
        if (match === ">") return "&gt;";
        if (match === '"') return "&quot;";
        return "&#39;";
    });
}

function formatJobTitle(field, type) {
    return `${field} ${type}`;
}

function getPaginatedJobs(jobs, currentPage) {
    const startIndex = (currentPage - 1) * jobsPerPage;
    return jobs.slice(startIndex, startIndex + jobsPerPage);
}

function getTotalPages(jobs) {
    return Math.ceil(jobs.length / jobsPerPage);
}

function filterJobsBySearch(jobs, searchTerm) {
    if (!searchTerm) return jobs;
    const normalizedTerm = searchTerm.toLowerCase();
    return jobs.filter(job => 
        String(job.title || "").toLowerCase().includes(normalizedTerm) ||
        String(job.location || "").toLowerCase().includes(normalizedTerm)
    );
}

function getApplicantCount(jobId) {
    return applications.filter(app => app.jobId === jobId).length;
}

function getPendingApplicantCount(jobId) {
    return applications.filter(app => app.jobId === jobId && app.status === "pending").length;
}

function getAcceptedApplicantCount(jobId) {
    return applications.filter((app) => app.jobId === jobId && app.status === "accepted").length;
}

function pushRecruiterNotification(title, message, createdAt = new Date().toISOString()) {
    notifications.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title,
        message,
        createdAt,
        read: false
    });
}

function formatRelativeTime(value) {
    if (!value) return "Recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    return formatIsoDate(value) || "Recently";
}

function buildReminderNotifications() {
    const reminders = [];
    const pendingApplications = applications.filter((application) => application.status === "pending");

    if (pendingApplications.length > 0) {
        const latestPending = pendingApplications
            .map((application) => application.statusUpdatedAt || application.appliedAt)
            .filter(Boolean)
            .sort()
            .slice(-1)[0];

        reminders.push({
            id: "system-pending-review",
            title: "Applications ready to review",
            message: `${pendingApplications.length} application${pendingApplications.length === 1 ? "" : "s"} are waiting for your review.`,
            createdAt: latestPending || new Date().toISOString(),
            isSystem: true,
            read: false
        });
    }

    jobs
        .filter((job) => job.status === "active" && job.closingDate)
        .forEach((job) => {
            const closingDate = new Date(job.closingDate);
            if (Number.isNaN(closingDate.getTime())) return;

            const diffDays = Math.ceil((closingDate.getTime() - Date.now()) / 86400000);
            if (diffDays < 0 || diffDays > 3) return;

            reminders.push({
                id: `system-closing-${job.id}`,
                title: "Post closing soon",
                message: `"${job.title}" closes ${diffDays === 0 ? "today" : `in ${diffDays} day${diffDays === 1 ? "" : "s"}`}.`,
                createdAt: closingDate.toISOString(),
                isSystem: true,
                read: false
            });
        });

    return reminders;
}

function getCombinedNotifications() {
    return [...buildReminderNotifications(), ...notifications]
        .map((notification) => ({
            ...notification,
            createdAt: notification.createdAt || ""
        }))
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
}

function updateDashboardMetrics() {
    const metrics = {
        applicants: applications.length,
        successRate: applications.length === 0
            ? "0%"
            : `${Math.round((applications.filter((application) => application.status === "accepted").length / applications.length) * 100)}%`,
        totalPosts: jobs.length
    };

    const totalPostsMetric = document.getElementById("totalPostsMetric");
    const applicantsMetric = document.getElementById("applicantsMetric");
    const successRateMetric = document.getElementById("successRateMetric");

    if (totalPostsMetric) totalPostsMetric.textContent = String(metrics.totalPosts);
    if (applicantsMetric) applicantsMetric.textContent = String(metrics.applicants);
    if (successRateMetric) successRateMetric.textContent = metrics.successRate;
}

async function saveToLocalStorage() {
    const user = await resolveCurrentUser();
    if (!user) {
        throw new Error("Please log in before managing recruiter opportunities.");
    }

    await setDoc(doc(db, "users", user.uid), {
        email: user.email || "",
        [DASHBOARD_FIELD]: {
            notifications
        }
    }, { merge: true });
}

async function loadFromLocalStorage() {
    const user = await resolveCurrentUser();

    if (!user) {
        currentRecruiter = { uid: "", email: "", displayName: "Recruiter", companyName: "Recruiter" };
        jobs = [];
        applications = [];
        notifications = [];
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const recruiterJobsQuery = query(collection(db, OPPORTUNITIES_COLLECTION), where("ownerUid", "==", user.uid));
    const recruiterApplicationsQuery = query(collection(db, APPLICATIONS_COLLECTION), where("recruiterId", "==", user.uid));

    const userSnapshot = await getDoc(userRef);
    let jobsSnapshot = { docs: [] };
    let applicationsSnapshot = { docs: [] };

    const userData = userSnapshot.exists() ? userSnapshot.data() : {};
    const dashboardData = userData?.[DASHBOARD_FIELD] || {};

    currentRecruiter = {
        uid: user.uid,
        email: user.email || "",
        displayName: getRecruiterDisplayName(userData, user),
        companyName: getRecruiterCompanyName(userData, user)
    };

    try {
        jobsSnapshot = await getDocs(recruiterJobsQuery);
        jobs = jobsSnapshot.docs.map(mapOpportunitySnapshot);
    } catch (error) {
        jobs = [];
        console.error("Unable to load recruiter opportunities.", error);
        if (!isPermissionError(error)) {
            throw error;
        }
    }

    try {
        applicationsSnapshot = await getDocs(recruiterApplicationsQuery);
        applications = applicationsSnapshot.docs.map(mapApplicationSnapshot);
    } catch (error) {
        applications = [];
        console.error("Unable to load recruiter applications.", error);
        if (!isPermissionError(error)) {
            throw error;
        }
    }

    notifications = Array.isArray(dashboardData?.notifications)
        ? dashboardData.notifications.map((notification) => ({
            ...notification,
            createdAt: notification?.createdAt || ""
        }))
        : [];
}

function isPermissionError(error) {
    return error?.code === "permission-denied" || /insufficient permissions/i.test(String(error?.message || ""));
}

async function saveOpportunity(jobData) {
    const user = await resolveCurrentUser();
    if (!user) {
        throw new Error("Please log in before managing recruiter opportunities.");
    }

    const opportunityRef = doc(db, OPPORTUNITIES_COLLECTION, jobData.id);
    const recruiterName = getDisplayName(currentRecruiter.displayName, currentRecruiter.companyName);
    const companyName = getDisplayName(currentRecruiter.companyName, currentRecruiter.displayName);

    await setDoc(opportunityRef, {
        ownerUid: user.uid,
        recruiterName,
        postedByName: recruiterName,
        title: jobData.title,
        opportunityType: inferOpportunityType(jobData),
        companyName,
        location: jobData.location,
        duration: jobData.duration,
        stipend: jobData.stipend,
        closingDate: jobData.closingDate,
        nqfLevel: jobData.nqfLevel,
        description: jobData.description,
        requirements: Array.isArray(jobData.requirements) ? jobData.requirements : [],
        status: jobData.status === "closed" ? "closed" : "active",
        postedAt: jobData.postedAt,
        updatedAt: jobData.updatedAt
    });
}

async function deleteApplicationsForJob(jobId) {
    const relatedApplications = applications.filter((application) => application.jobId === jobId);
    await Promise.all(relatedApplications.map((application) => deleteDoc(doc(db, APPLICATIONS_COLLECTION, String(application.id)))));
}

function sortJobs(jobsArray) {
    const sorted = [...jobsArray];
    if (currentSort === "date") {
        sorted.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else {
        sorted.sort((a, b) => getApplicantCount(b.id) - getApplicantCount(a.id));
    }
    return sorted;
}

function updateApplicationsTabBadge() {
    const totalPending = applications.filter(app => app.status === 'pending').length;
    const btn = document.getElementById('applicationsBtn');
    if (btn) {
        if (totalPending > 0) {
            btn.innerHTML = `<i class="fa-solid fa-file-lines"></i><span>Applications <span class="badge-pending" style="background:#dc2626; color:white; border-radius:999px; padding:2px 8px; font-size:11px; margin-left:6px;">${totalPending}</span></span>`;
        } else {
            btn.innerHTML = `<i class="fa-solid fa-file-lines"></i><span>Applications</span>`;
        }
    }
}

function renderOpportunities() {
    const container = document.getElementById("opportunitiesList");
    if (!container) return;

    let filteredJobs = filterJobsBySearch(jobs, searchTerm);
    filteredJobs = sortJobs(filteredJobs);

    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    if (totalPages > 0 && currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (totalPages === 0) {
        currentPage = 1;
    }
    const startIndex = (currentPage - 1) * jobsPerPage;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const pageInfo = document.getElementById("pageInfo");

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;

    if (paginatedJobs.length === 0) {
        if (jobs.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>You haven\'t posted any opportunities yet.</p><p>Click "Post New Opportunity" to create your first learnership, internship or apprenticeship.</p></div>';
        } else {
            container.innerHTML = `<div class="empty-state"><p>No opportunities match "${escapeHtml(searchTerm)}"</p><p>Try a different search term.</p></div>`;
        }
        return;
    }

    let html = "";
    paginatedJobs.forEach(job => {
        const jobId = escapeAttribute(job.id);
        const isSelected = selectedJobs.has(job.id);
        const statusClass = job.status === "closed" ? "closed" : "active";
        const statusText = job.status === "closed" ? "Closed" : "Active";
        const applicantCount = getApplicantCount(job.id);
        const pendingCount = getPendingApplicantCount(job.id);
        const needsAttention = applicantCount > 0 && job.status === 'active';
        const attentionBadge = needsAttention ? '<span class="status-badge needs-attention">Needs Attention</span>' : '';
        const reviewButton = applicantCount > 0 ? `<button class="review-btn" onclick="reviewApplicants('${jobId}')">Review ${applicantCount} Applicant${applicantCount !== 1 ? 's' : ''}</button>` : '<button class="review-btn" disabled style="background:#94a3b8; cursor:not-allowed;">No applicants yet</button>';
        const statusToggleLabel = job.status === "active" ? "Close Post" : "Reactivate Post";

        html += `
            <article class="opportunity-card ${statusClass}">
                <header class="card-header">
                    <div class="card-header-main">
                        ${bulkMode ? `<input type="checkbox" class="card-checkbox" data-id="${job.id}" ${isSelected ? "checked" : ""}>` : ""}
                        <span class="opportunity-kicker">Opportunity Post</span>
                        <h3>${escapeHtml(job.title)}</h3>
                        <p class="opportunity-posted-date">Posted ${job.postedDate}</p>
                    </div>
                    <details class="card-menu">
                        <summary class="card-menu-toggle" aria-label="Open opportunity actions menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </summary>
                        <div class="card-menu-list">
                            <button type="button" class="card-menu-item edit-job-btn" onclick="editJob('${jobId}')">Edit</button>
                            <button type="button" class="card-menu-item delete-job-btn" onclick="confirmDeleteJob('${jobId}')">Delete</button>
                        </div>
                    </details>
                </header>
                <div class="opportunity-meta">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span class="applicant-count">${applicantCount} applicant${applicantCount !== 1 ? 's' : ''}</span>
                    ${pendingCount > 0 ? `<span class="pending-count">${pendingCount} pending</span>` : ''}
                    ${attentionBadge}
                    <button class="status-toggle" onclick="toggleJobStatus('${jobId}')">${statusToggleLabel}</button>
                </div>
                <dl class="opportunity-details">
                    <div>
                        <dt>Location</dt>
                        <dd>${escapeHtml(job.location)}</dd>
                    </div>
                    <div>
                        <dt>Compensation</dt>
                        <dd>${escapeHtml(job.stipend)}</dd>
                    </div>
                    <div>
                        <dt>Duration</dt>
                        <dd>${escapeHtml(job.duration)}</dd>
                    </div>
                    <div>
                        <dt>Closing Date</dt>
                        <dd>${job.closingDate}</dd>
                    </div>
                    <div>
                        <dt>NQF Level (SAQA)</dt>
                        <dd>${job.nqfLevel ? `NQF Level ${job.nqfLevel}` : 'Not specified'}</dd>
                    </div>
                </dl>
                ${job.description ? `<p class="opportunity-summary">${escapeHtml(job.description)}</p>` : ""}
                <div class="action-buttons-group">
                    <button class="view-details-btn" onclick="viewJobDetails('${jobId}')">View Details</button>
                    ${reviewButton}
                </div>
            </article>
        `;
    });
    container.innerHTML = html;
    updateDashboardMetrics();
    updateSortButtons();
    updateBulkModeButton();
    updateApplicationsTabBadge();

    if (bulkMode) {
        document.querySelectorAll(".card-checkbox").forEach(cb => {
            cb.addEventListener("change", function() {
                const id = this.dataset.id;
                if (this.checked) {
                    selectedJobs.add(id);
                } else {
                    selectedJobs.delete(id);
                }
                updateBulkDeleteBar();
            });
        });
    }
}

function getApplicationStatusLabel(status) {
    const normalizedStatus = String(status || "").trim().toLowerCase();
    if (!normalizedStatus) return "Pending";
    return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
}

function buildApplicationProfileHref(applicantId) {
    if (!applicantId) return "#";
    return `../Applicant_profile_page/global_profile.html?applicantId=${encodeURIComponent(applicantId)}&viewer=recruiter`;
}

function buildApplicationDetailCard(title, metaLines = [], description = "") {
    const meta = metaLines
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" • ");
    const descriptionMarkup = description
        ? `<p class="application-detail-description">${escapeHtml(description)}</p>`
        : "";

    return `
        <article class="application-detail-card">
            <h4>${escapeHtml(title || "Untitled")}</h4>
            ${meta ? `<p class="application-detail-meta">${escapeHtml(meta)}</p>` : ""}
            ${descriptionMarkup}
        </article>
    `;
}

function renderApplicationSkills(profile = {}) {
    const softSkills = Array.isArray(profile?.skills?.softSkills) ? profile.skills.softSkills : [];
    const technicalSkills = Array.isArray(profile?.skills?.technicalSkills) ? profile.skills.technicalSkills : [];
    const skills = [...technicalSkills, ...softSkills]
        .map((skill) => String(skill || "").trim())
        .filter(Boolean);

    if (skills.length === 0) {
        return '<p class="application-empty-copy">No skills listed yet.</p>';
    }

    return skills.slice(0, 10).map((skill) => `<span class="application-skill-pill">${escapeHtml(skill)}</span>`).join("");
}

function renderApplicationQualifications(profile = {}) {
    const items = Array.isArray(profile?.qualifications?.items) ? profile.qualifications.items : [];
    if (items.length === 0) {
        return '<p class="application-empty-copy">No qualifications added yet.</p>';
    }

    return items.slice(0, 4).map((item) => {
        const dates = [item?.issueDate, item?.expiryDate].filter(Boolean).join(" - ");
        const metaLines = [item?.type, item?.subtitle, item?.dates || dates];
        return buildApplicationDetailCard(item?.title || "Qualification", metaLines, item?.description || "");
    }).join("");
}

function renderApplicationHighlights(profile = {}) {
    const educationItems = Array.isArray(profile?.education) ? profile.education : [];
    const experienceItems = Array.isArray(profile?.experience) ? profile.experience : [];
    const items = [];

    if (educationItems[0]) {
        const education = educationItems[0];
        items.push(buildApplicationDetailCard(
            education.school || "Education",
            [education.level, education.field, education.performance],
            education.description || ""
        ));
    }

    if (experienceItems[0]) {
        const experience = experienceItems[0];
        items.push(buildApplicationDetailCard(
            experience.title || "Experience",
            [experience.company, experience.employmentType, experience.dates || experience.duration],
            experience.description || ""
        ));
    }

    if (!items.length && profile?.about) {
        const aboutText = [profile.about.intro, profile.about.passion]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
            .join(" ");
        if (aboutText) {
            items.push(buildApplicationDetailCard("About the applicant", [], aboutText));
        }
    }

    return items.join("") || '<p class="application-empty-copy">No additional profile details available yet.</p>';
}

function setApplicationViewLinks(app, profile = {}) {
    const profileLink = document.getElementById("applicationViewProfileLink");
    const cvLink = document.getElementById("applicationViewCvLink");

    if (profileLink) {
        const href = buildApplicationProfileHref(app.applicantId);
        profileLink.href = href;
        profileLink.setAttribute("aria-disabled", String(!app.applicantId));
        profileLink.classList.toggle("is-disabled", !app.applicantId);
    }

    if (cvLink) {
        const fileUrl = profile?.cv?.fileUrl || app.cvFileUrl || "";
        const fileName = profile?.cv?.fileName || app.cvFileName || "";
        cvLink.hidden = !fileUrl;

        if (fileUrl) {
            cvLink.href = fileUrl;
            if (fileName) {
                cvLink.download = fileName;
            } else {
                cvLink.removeAttribute("download");
            }
        } else {
            cvLink.removeAttribute("href");
            cvLink.removeAttribute("download");
        }
    }
}

function renderApplicationView(app, profile = {}) {
    const job = jobs.find((item) => item.id === app.jobId);
    const applicantName = profile?.profile?.name || app.applicantName || "Unknown applicant";
    const applicantEmail = profile?.personalDetails?.email || app.applicantEmail || "Not provided";
    const aboutText = [profile?.about?.intro, profile?.about?.passion]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" ");
    const subtitleParts = [
        job?.title || app.opportunityTitle || "Opportunity",
        aboutText || "Profile details ready for recruiter review."
    ].filter(Boolean);

    const title = document.getElementById("applicationViewTitle");
    const subtitle = document.getElementById("applicationViewSubtitle");
    const status = document.getElementById("applicationViewStatus");
    const appliedDate = document.getElementById("applicationViewAppliedDate");
    const opportunity = document.getElementById("applicationViewOpportunity");
    const email = document.getElementById("applicationViewEmail");
    const qualifications = document.getElementById("applicationViewQualifications");
    const skills = document.getElementById("applicationViewSkills");
    const qualificationItems = document.getElementById("applicationViewQualificationItems");
    const highlights = document.getElementById("applicationViewHighlights");

    if (title) title.textContent = applicantName;
    if (subtitle) subtitle.textContent = subtitleParts.join(" • ");
    if (status) status.textContent = getApplicationStatusLabel(app.status);
    if (appliedDate) appliedDate.textContent = app.appliedDate || "Not available";
    if (opportunity) opportunity.textContent = job?.title || app.opportunityTitle || "Unknown opportunity";
    if (email) email.textContent = applicantEmail;
    if (qualifications) qualifications.textContent = app.qualifications || "No summary provided yet.";
    if (skills) skills.innerHTML = renderApplicationSkills(profile);
    if (qualificationItems) qualificationItems.innerHTML = renderApplicationQualifications(profile);
    if (highlights) highlights.innerHTML = renderApplicationHighlights(profile);

    setApplicationViewLinks(app, profile);
}

function openApplicationViewModal() {
    const modal = document.getElementById("applicationViewModal");
    if (!modal) return;

    if (typeof modal.showModal === "function") {
        modal.showModal();
        return;
    }

    modal.setAttribute("open", "open");
    modal.style.display = "flex";
}

function closeApplicationViewModal() {
    const modal = document.getElementById("applicationViewModal");
    if (!modal) return;

    if (typeof modal.close === "function") {
        modal.close();
    }

    modal.style.display = "none";
    modal.removeAttribute("open");
}

function renderOpportunityView(job) {
    if (!job) return;

    const title = document.getElementById("opportunityViewTitle");
    const subtitle = document.getElementById("opportunityViewSubtitle");
    const status = document.getElementById("opportunityViewStatus");
    const applicants = document.getElementById("opportunityViewApplicants");
    const postedDate = document.getElementById("opportunityViewPostedDate");
    const closingDate = document.getElementById("opportunityViewClosingDate");
    const meta = document.getElementById("opportunityViewMeta");
    const description = document.getElementById("opportunityViewDescription");
    const requirements = document.getElementById("opportunityViewRequirements");
    const reviewApplicantsBtn = document.getElementById("opportunityReviewApplicantsBtn");

    if (title) title.textContent = job.title || "Opportunity details";
    if (subtitle) subtitle.textContent = `${job.companyName || "Recruiter"} | ${job.opportunityType || "Opportunity"}`;
    if (status) status.textContent = getApplicationStatusLabel(job.status);
    if (applicants) applicants.textContent = `${getApplicantCount(job.id)} applicant${getApplicantCount(job.id) === 1 ? "" : "s"}`;
    if (postedDate) postedDate.textContent = job.postedDate || "Not available";
    if (closingDate) closingDate.textContent = job.closingDate || "Not specified";
    if (description) description.textContent = job.description || "No description provided for this opportunity yet.";

    if (meta) {
        meta.innerHTML = [
            { label: "Location", value: job.location || "Not specified" },
            { label: "Compensation", value: job.stipend || "Not specified" },
            { label: "Duration", value: job.duration || "Not specified" },
            { label: "NQF Level", value: job.nqfLevel ? `NQF Level ${job.nqfLevel}` : "Not specified" }
        ].map((item) => `
            <article class="opportunity-meta-card">
                <span class="overview-label">${escapeHtml(item.label)}</span>
                <strong class="overview-value">${escapeHtml(item.value)}</strong>
            </article>
        `).join("");
    }

    if (requirements) {
        requirements.innerHTML = Array.isArray(job.requirements) && job.requirements.length > 0
            ? job.requirements.map((item) => `
                <article class="application-detail-card">
                    <h4>${escapeHtml(item)}</h4>
                </article>
            `).join("")
            : '<p class="application-empty-copy">No requirements have been listed for this opportunity.</p>';
    }

    if (reviewApplicantsBtn) {
        reviewApplicantsBtn.disabled = getApplicantCount(job.id) === 0;
        reviewApplicantsBtn.textContent = getApplicantCount(job.id) === 0 ? "No Applicants Yet" : "Review Applicants";
        reviewApplicantsBtn.onclick = () => reviewApplicants(job.id);
    }
}

function openOpportunityViewModal() {
    const modal = document.getElementById("opportunityViewModal");
    if (!modal) return;

    if (typeof modal.showModal === "function") {
        modal.showModal();
        return;
    }

    modal.setAttribute("open", "open");
    modal.style.display = "flex";
}

function closeOpportunityViewModal() {
    const modal = document.getElementById("opportunityViewModal");
    if (!modal) return;

    if (typeof modal.close === "function") {
        modal.close();
    }

    modal.style.display = "none";
    modal.removeAttribute("open");
}

async function loadApplicantProfileForReview(applicantId) {
    if (!applicantId) {
        return null;
    }

    try {
        const userSnapshot = await getDoc(doc(db, "users", applicantId));
        if (!userSnapshot.exists()) {
            return null;
        }

        return userSnapshot.data()?.applicantProfile || null;
    } catch (error) {
        console.error("Unable to load applicant profile for recruiter review.", error);
        return null;
    }
}

function reviewApplicants(jobId) {
    const job = jobs.find((item) => item.id === jobId);
    activeApplicationsJobId = jobId || "";
    activeApplicationsJobTitle = job?.title || "this opportunity";
    setApplicationStatusFilter("all");
    closeOpportunityViewModal();
    switchTab("applications");
}

function clearApplicationsJobContext() {
    activeApplicationsJobId = "";
    activeApplicationsJobTitle = "";
}

function setApplicationStatusFilter(filterValue) {
    currentFilter = filterValue;
    document.querySelectorAll(".filter-btn").forEach((button) => {
        button.classList.toggle("active", button.id === `filter${filterValue.charAt(0).toUpperCase()}${filterValue.slice(1)}`);
    });
}

function renderApplicationsContext() {
    const contextCopy = document.getElementById("applicationsContextCopy");

    if (!contextCopy) return;

    if (!activeApplicationsJobId) {
        contextCopy.textContent = "Pending applications are shown first, and reviewed applicants move into their own status lists.";
        return;
    }

    contextCopy.textContent = "Only applicants linked to the selected opportunity card are shown below.";
}

function updateBulkDeleteBar() {
    const bar = document.getElementById("bulkDeleteBar");
    const countSpan = document.getElementById("selectedCount");
    if (bar && countSpan) {
        if (selectedJobs.size > 0) {
            bar.style.display = "flex";
            countSpan.textContent = selectedJobs.size;
        } else {
            bar.style.display = "none";
        }
    }
}

function toggleBulkMode() {
    bulkMode = !bulkMode;
    if (!bulkMode) {
        selectedJobs.clear();
        updateBulkDeleteBar();
    }
    updateBulkModeButton();
    renderOpportunities();
}

function updateBulkModeButton() {
    const selectPostsBtn = document.getElementById("selectPostsBtn");
    if (!selectPostsBtn) return;

    selectPostsBtn.textContent = bulkMode ? "Done Selecting" : "Select Posts";
    selectPostsBtn.classList.toggle("is-active", bulkMode);
}

async function bulkDelete() {
    if (selectedJobs.size === 0) return;

    const deletedCount = selectedJobs.size;
    const previousJobs = [...jobs];
    const previousApplications = [...applications];
    const previousNotifications = [...notifications];

    try {
        await Promise.all(
            [...selectedJobs].map(async (jobId) => {
                await deleteDoc(doc(db, OPPORTUNITIES_COLLECTION, String(jobId)));
                await deleteApplicationsForJob(String(jobId));
            })
        );

        jobs = jobs.filter(job => !selectedJobs.has(job.id));
        applications = applications.filter(app => !selectedJobs.has(app.jobId));
        pushRecruiterNotification("Bulk Delete", `You deleted ${deletedCount} opportunities`);

        selectedJobs.clear();
        bulkMode = false;
        updateBulkDeleteBar();
        renderOpportunities();
        renderApplications();
        renderNotifications();
        await saveToLocalStorage();
        alert(`Deleted ${deletedCount} opportunities`);
    } catch (error) {
        jobs = previousJobs;
        applications = previousApplications;
        notifications = previousNotifications;
        renderOpportunities();
        renderApplications();
        renderNotifications();
        alert(error?.message || "These opportunities could not be deleted.");
    }
}

async function toggleJobStatus(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const previousStatus = job.status;

    try {
        if (job.status === "active") {
            job.status = "closed";
            job.updatedAt = new Date().toISOString();
            await updateDoc(doc(db, OPPORTUNITIES_COLLECTION, String(job.id)), {
                status: "closed",
                updatedAt: job.updatedAt
            });
            pushRecruiterNotification("Job Closed", `You closed "${job.title}"`, job.updatedAt);
            alert(`"${job.title}" has been closed.`);
        } else if (job.status === "closed") {
            job.status = "active";
            job.updatedAt = new Date().toISOString();
            await updateDoc(doc(db, OPPORTUNITIES_COLLECTION, String(job.id)), {
                status: "active",
                updatedAt: job.updatedAt
            });
            pushRecruiterNotification("Job Reactivated", `You reactivated "${job.title}"`, job.updatedAt);
            alert(`"${job.title}" has been reactivated.`);
        }

        await saveToLocalStorage();
        renderOpportunities();
        renderNotifications();
    } catch (error) {
        job.status = previousStatus;
        alert(error?.message || "This opportunity status could not be updated.");
    }
}

function renderApplications() {
    const container = document.getElementById("applicationsList");
    if (!container) return;

    renderApplicationsContext();

    if (applications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No applications yet.</p><p>When students apply to your opportunities, they will appear here.</p></div>';
        return;
    }

    let filteredApps = applications;
    if (activeApplicationsJobId) {
        filteredApps = filteredApps.filter((application) => application.jobId === activeApplicationsJobId);
    }
    if (currentFilter !== "all") {
        if (currentFilter === "reviewed") {
            filteredApps = filteredApps.filter((application) => application.status !== "pending");
        } else {
            filteredApps = filteredApps.filter((application) => application.status === currentFilter);
        }
    }

    if (filteredApps.length === 0) {
        container.innerHTML = activeApplicationsJobId
            ? `<div class="empty-state"><p>No applications for "${escapeHtml(activeApplicationsJobTitle)}" match this filter yet.</p><p>Try another application status view or return to all applications.</p></div>`
            : '<div class="empty-state"><p>No applications match this filter yet.</p><p>Try another application status view.</p></div>';
        return;
    }

    let html = '<table><thead><tr><th>Name</th><th>Opportunity</th><th>Date</th><th>Qualifications</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    filteredApps.forEach(app => {
        const job = jobs.find(j => j.id === app.jobId);
        const isAccepted = app.status === "accepted";
        const isRejected = app.status === "rejected";
        const isShortlisted = app.status === "shortlisted";

        html += `<tr><td data-label="Name">${escapeHtml(app.applicantName)}</td><td data-label="Opportunity">${escapeHtml(job?.title || app.opportunityTitle || "Unknown")}</td><td data-label="Date">${app.appliedDate}</td><td data-label="Qualifications">${escapeHtml(app.qualifications)}</td><td data-label="Status">${escapeHtml(getApplicationStatusLabel(app.status))}</td><td data-label="Actions" class="action-buttons"><button class="application-action-btn view-application-btn" onclick="viewApplicant('${app.id}')">View</button><button class="application-action-btn shortlist-application-btn" onclick="shortlistApplicant('${app.id}')" ${isShortlisted || isAccepted ? "disabled" : ""}>Shortlist</button><button class="application-action-btn accept-application-btn" onclick="acceptApplicant('${app.id}')" ${isAccepted ? "disabled" : ""}>Accept</button><button class="application-action-btn reject-application-btn" onclick="rejectApplicant('${app.id}')" ${isRejected ? "disabled" : ""}>Reject</button></td></tr>`;
    });
    html += "</tbody></table>";
    container.innerHTML = html;
}

function moveApplicationToStatus(app, statusValue, successMessage, notificationTitle) {
    if (!app) return Promise.resolve();

    const previousStatus = app.status;
    const previousStatusUpdatedAt = app.statusUpdatedAt;
    const statusUpdatedAt = new Date().toISOString();

    return updateDoc(doc(db, APPLICATIONS_COLLECTION, String(app.id)), {
        status: statusValue,
        statusUpdatedAt
    }).then(async () => {
        app.status = statusValue;
        app.statusUpdatedAt = statusUpdatedAt;
        setApplicationStatusFilter(statusValue);
        pushRecruiterNotification(notificationTitle, successMessage, statusUpdatedAt);
        await saveToLocalStorage();
        renderApplications();
        updateDashboardMetrics();
        renderNotifications();
        alert(successMessage);
    }).catch((error) => {
        app.status = previousStatus;
        app.statusUpdatedAt = previousStatusUpdatedAt;
        throw error;
    });
}

function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    const feed = getCombinedNotifications();

    if (feed.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No notifications.</p></div>';
        return;
    }

    let html = "";
    feed.forEach((notification) => {
        html += `<div class="notification-item ${notification.read ? "" : "unread"}"><div><div class="notification-title">${escapeHtml(notification.title)}</div><div class="notification-message">${escapeHtml(notification.message)}</div><div class="notification-time">${escapeHtml(formatRelativeTime(notification.createdAt || notification.time))}</div></div>${!notification.read && !notification.isSystem ? `<button class="notification-read-btn" onclick="markNotificationRead('${escapeAttribute(notification.id)}')">Mark read</button>` : ""}</div>`;
    });
    container.innerHTML = html;
}

function searchOpportunities() {
    const input = document.getElementById("searchInput");
    if (input) {
        searchTerm = input.value;
        currentPage = 1;
        renderOpportunities();
    }
}

function setSortByDate() {
    currentSort = "date";
    currentPage = 1;
    updateSortButtons();
    renderOpportunities();
}

function setSortByApplicants() {
    currentSort = "applicants";
    currentPage = 1;
    updateSortButtons();
    renderOpportunities();
}

function updateSortButtons() {
    const sortDateBtn = document.getElementById("sortDateBtn");
    const sortApplicantsBtn = document.getElementById("sortApplicantsBtn");

    if (sortDateBtn) sortDateBtn.classList.toggle("active", currentSort === "date");
    if (sortApplicantsBtn) sortApplicantsBtn.classList.toggle("active", currentSort === "applicants");
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderOpportunities();
    }
}

function nextPage() {
    const totalPages = getTotalPages(sortJobs(filterJobsBySearch(jobs, searchTerm)));
    if (currentPage < totalPages) {
        currentPage++;
        renderOpportunities();
    }
}

function switchTab(tab) {
    const oppSec = document.getElementById("opportunitiesSection");
    const appSec = document.getElementById("applicationsSection");
    const notSec = document.getElementById("notificationsSection");
    
    if (oppSec) oppSec.style.display = tab === "opportunities" ? "block" : "none";
    if (appSec) appSec.style.display = tab === "applications" ? "block" : "none";
    if (notSec) notSec.style.display = tab === "notifications" ? "block" : "none";
    
    if (tab === "opportunities") renderOpportunities();
    if (tab === "applications") renderApplications();
    if (tab === "notifications") renderNotifications();
}

function validateJobForm() {
    const titleField = document.getElementById("jobTitleField");
    const titleType = document.getElementById("jobTitleType");
    const location = document.getElementById("jobLocation");
    const stipend = document.getElementById("jobStipend");
    const duration = document.getElementById("jobDuration");
    const closingDate = document.getElementById("jobClosingDate");
    const nqfLevel = document.getElementById("nqfLevel");
    const requirements = document.getElementById("jobRequirements");
    
    if (!titleField?.value.trim()) { alert("Please enter a job title field"); return false; }
    if (!titleType?.value) { alert("Please select a job type (Learnership, Internship, or Apprenticeship)"); return false; }
    if (!location?.value.trim()) { alert("Please enter a location"); return false; }
    if (!stipend?.value.trim()) { alert("Please enter stipend/salary"); return false; }
    if (!duration?.value.trim()) { alert("Please enter duration"); return false; }
    if (closingDate && !closingDate.value) { alert("Please select closing date"); return false; }
    if (nqfLevel && !nqfLevel.value) { alert("Please select the minimum NQF Level (SAQA requirement)"); return false; }
    if (!requirements?.value.trim()) { alert("Please enter requirements"); return false; }
    
    return true;
}

function openPostJobModal() {
    document.getElementById("postJobForm")?.reset();
    editingJobId = null;
    const modalTitle = document.getElementById("modalTitle");
    const submitJobBtn = document.getElementById("submitJobBtn");
    const jobStatus = document.getElementById("jobStatus");
    const postJobModal = document.getElementById("postJobModal");
    if (modalTitle) modalTitle.textContent = "Post New Opportunity";
    if (submitJobBtn) submitJobBtn.textContent = "Post Opportunity";
    if (jobStatus) jobStatus.value = "active";
    if (postJobModal) postJobModal.style.display = "flex";
}

function closePostJobModal() {
    const postJobModal = document.getElementById("postJobModal");
    if (postJobModal) postJobModal.style.display = "none";
}

async function postJob(event) {
    event.preventDefault();
    if (isSubmittingJob || !validateJobForm()) return;

    isSubmittingJob = true;
    const submitButton = document.getElementById("submitJobBtn");
    if (submitButton) submitButton.disabled = true;
    
    const titleField = document.getElementById("jobTitleField").value.trim();
    const titleType = document.getElementById("jobTitleType").value;
    const fullTitle = `${titleField} ${titleType}`;
    const existingJob = editingJobId ? jobs.find((job) => job.id === editingJobId) : null;
    const now = new Date().toISOString();
    
    const jobData = {
        id: editingJobId || doc(collection(db, OPPORTUNITIES_COLLECTION)).id,
        ownerUid: currentRecruiter.uid,
        companyName: currentRecruiter.companyName,
        title: fullTitle,
        location: document.getElementById("jobLocation").value.trim(),
        stipend: document.getElementById("jobStipend").value.trim(),
        duration: document.getElementById("jobDuration").value.trim(),
        closingDate: document.getElementById("jobClosingDate").value,
        nqfLevel: document.getElementById("nqfLevel").value,
        requirements: document.getElementById("jobRequirements").value.trim().split("\n").filter(l => l.trim()),
        description: document.getElementById("jobDescription").value,
        postedAt: existingJob?.postedAt || now,
        updatedAt: now,
        postedDate: formatIsoDate(existingJob?.postedAt || now),
        status: document.getElementById("jobStatus").value === "closed" ? "closed" : "active",
        opportunityType: normalizeOpportunityType(titleType)
    };

    try {
        await saveOpportunity(jobData);
        if (editingJobId) {
            jobs = jobs.map((job) => job.id === editingJobId ? jobData : job);
            pushRecruiterNotification("Opportunity Updated", `"${fullTitle}" was updated.`, now);
        } else {
            jobs = [jobData, ...jobs];
            pushRecruiterNotification("Opportunity Posted", `"${fullTitle}" is now live on your dashboard.`, now);
        }
        currentPage = 1;
        closePostJobModal();
        switchTab("opportunities");
        updateDashboardMetrics();
        renderNotifications();
        saveToLocalStorage().catch((error) => console.error("Unable to save recruiter dashboard state.", error));
        alert(editingJobId ? `Job updated successfully: ${fullTitle}` : `Job posted successfully: ${fullTitle}`);
        editingJobId = null;
    } catch (error) {
        alert(error?.message || "This opportunity could not be saved.");
    } finally {
        isSubmittingJob = false;
        if (submitButton) submitButton.disabled = false;
    }
}

function editJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    editingJobId = jobId;
    
    const titleType = inferOpportunityType(job);
    let titleField = job.title;

    if (titleType) {
        const suffix = ` ${titleType}`;
        if (titleField.endsWith(suffix)) {
            titleField = titleField.slice(0, -suffix.length);
        }
    }
    
    const jobTitleField = document.getElementById("jobTitleField");
    const jobTitleType = document.getElementById("jobTitleType");
    const jobLocation = document.getElementById("jobLocation");
    const jobStipend = document.getElementById("jobStipend");
    const jobDuration = document.getElementById("jobDuration");
    const jobClosingDate = document.getElementById("jobClosingDate");
    const nqfLevel = document.getElementById("nqfLevel");
    const jobRequirements = document.getElementById("jobRequirements");
    const jobDescription = document.getElementById("jobDescription");
    const jobStatus = document.getElementById("jobStatus");
    const modalTitle = document.getElementById("modalTitle");
    const submitJobBtn = document.getElementById("submitJobBtn");
    const postJobModal = document.getElementById("postJobModal");

    if (jobTitleField) jobTitleField.value = titleField;
    if (jobTitleType) jobTitleType.value = titleType;
    if (jobLocation) jobLocation.value = job.location;
    if (jobStipend) jobStipend.value = job.stipend;
    if (jobDuration) jobDuration.value = job.duration;
    if (jobClosingDate) jobClosingDate.value = job.closingDate || "";
    if (nqfLevel) nqfLevel.value = job.nqfLevel || "";
    if (jobRequirements) jobRequirements.value = job.requirements.join("\n");
    if (jobDescription) jobDescription.value = job.description || "";
    if (jobStatus) jobStatus.value = job.status;
    if (modalTitle) modalTitle.textContent = "Edit Opportunity";
    if (submitJobBtn) submitJobBtn.textContent = "Update Opportunity";
    if (postJobModal) postJobModal.style.display = "flex";
}

function openDeleteModal(jobTitle) {
    const confirmModal = document.getElementById("confirmModal");
    const confirmTitle = document.getElementById("confirmTitle");
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmOkBtn = document.getElementById("confirmOkBtn");
    const confirmIcon = document.getElementById("confirmIcon");
    const confirmIconGlyph = document.getElementById("confirmIconGlyph");

    confirmActionHandler = performDeleteJob;

    if (confirmTitle) {
        confirmTitle.textContent = "Delete opportunity?";
    }

    if (confirmMessage) {
        confirmMessage.textContent = `Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`;
    }

    if (confirmOkBtn) {
        confirmOkBtn.textContent = "Yes, Delete";
        confirmOkBtn.classList.remove("btn-primary");
        confirmOkBtn.classList.add("btn-danger");
        confirmOkBtn.disabled = false;
    }

    if (confirmIcon) {
        confirmIcon.classList.remove("is-primary");
        confirmIcon.classList.add("is-danger");
    }

    if (confirmIconGlyph) {
        confirmIconGlyph.className = "fa-solid fa-trash";
    }

    if (confirmModal?.showModal) {
        confirmModal.showModal();
    } else if (confirmModal) {
        confirmModal.setAttribute("open", "open");
        confirmModal.style.display = "flex";
    }
}

function closeDeleteModal(forceClose = false) {
    const confirmModal = document.getElementById("confirmModal");
    if (isDeletingJob && !forceClose) return;

    pendingDeleteJobId = null;
    confirmActionHandler = null;

    if (confirmModal?.close) {
        confirmModal.close();
    }
    if (confirmModal) {
        confirmModal.style.display = "none";
        confirmModal.removeAttribute("open");
    }
}

function confirmDeleteJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    pendingDeleteJobId = jobId;
    openDeleteModal(job.title);
}

async function performDeleteJob() {
    if (pendingDeleteJobId === null || isDeletingJob) return;

    const jobIdToDelete = pendingDeleteJobId;
    const job = jobs.find(j => j.id === jobIdToDelete);
    if (!job) {
        closeDeleteModal();
        return;
    }

    isDeletingJob = true;
    const confirmOkBtn = document.getElementById("confirmOkBtn");
    const previousJobs = [...jobs];
    const previousApplications = [...applications];
    const previousNotifications = [...notifications];
    const previousSelectedJobs = new Set(selectedJobs);

    if (confirmOkBtn) confirmOkBtn.disabled = true;

    try {
        await deleteDoc(doc(db, OPPORTUNITIES_COLLECTION, String(jobIdToDelete)));
        await deleteApplicationsForJob(String(jobIdToDelete));

        jobs = jobs.filter(j => j.id !== jobIdToDelete);
        applications = applications.filter(a => a.jobId !== jobIdToDelete);
        selectedJobs.delete(jobIdToDelete);
        pushRecruiterNotification("Job Deleted", `You deleted "${job.title}"`);

        closeDeleteModal(true);
        updateBulkDeleteBar();
        renderOpportunities();
        renderApplications();
        renderNotifications();
        await saveToLocalStorage();
        alert(`"${job.title}" deleted successfully.`);
    } catch (error) {
        jobs = previousJobs;
        applications = previousApplications;
        notifications = previousNotifications;
        selectedJobs = previousSelectedJobs;
        updateBulkDeleteBar();
        renderOpportunities();
        renderApplications();
        renderNotifications();
        alert(error?.message || "This opportunity could not be deleted.");
    } finally {
        isDeletingJob = false;
        if (confirmOkBtn) confirmOkBtn.disabled = false;
    }
}

function viewJobDetails(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    renderOpportunityView(job);
    openOpportunityViewModal();
}

function openLogoutModal() {
    const confirmModal = document.getElementById("confirmModal");
    const confirmTitle = document.getElementById("confirmTitle");
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmOkBtn = document.getElementById("confirmOkBtn");
    const confirmIcon = document.getElementById("confirmIcon");
    const confirmIconGlyph = document.getElementById("confirmIconGlyph");

    confirmActionHandler = performLogout;

    if (confirmTitle) {
        confirmTitle.textContent = "Log out now?";
    }

    if (confirmMessage) {
        confirmMessage.textContent = "You will be signed out of the recruiter dashboard and returned to the login page.";
    }

    if (confirmOkBtn) {
        confirmOkBtn.textContent = "Log Out";
        confirmOkBtn.classList.remove("btn-danger");
        confirmOkBtn.classList.add("btn-primary");
        confirmOkBtn.disabled = false;
    }

    if (confirmIcon) {
        confirmIcon.classList.remove("is-danger");
        confirmIcon.classList.add("is-primary");
    }

    if (confirmIconGlyph) {
        confirmIconGlyph.className = "fa-solid fa-right-from-bracket";
    }

    if (confirmModal?.showModal) {
        confirmModal.showModal();
    } else if (confirmModal) {
        confirmModal.setAttribute("open", "open");
        confirmModal.style.display = "flex";
    }
}

function performLogout() {
    closeDeleteModal();
    localStorage.removeItem("recruiter_jobs");
    localStorage.removeItem("recruiter_applications");
    sessionStorage.clear();
    window.location.href = "../SignUp_LogIn_pages/logIn.html";
}

function handleConfirmModalAction() {
    if (typeof confirmActionHandler === "function") {
        confirmActionHandler();
    }
}

async function viewApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        const profile = await loadApplicantProfileForReview(app.applicantId);
        renderApplicationView(app, profile || {});
        openApplicationViewModal();
    }
}

async function shortlistApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        try {
            await moveApplicationToStatus(
                app,
                "shortlisted",
                `${app.applicantName} shortlisted`,
                "Shortlisted"
            );
        } catch (error) {
            alert(error?.message || "This application could not be updated.");
        }
    }
}

async function acceptApplicant(id) {
    const app = applications.find((application) => application.id === id);
    if (app) {
        try {
            await moveApplicationToStatus(
                app,
                "accepted",
                `${app.applicantName} accepted`,
                "Application Accepted"
            );
        } catch (error) {
            alert(error?.message || "This application could not be updated.");
        }
    }
}

async function rejectApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        try {
            await moveApplicationToStatus(
                app,
                "rejected",
                `${app.applicantName} rejected`,
                "Rejected"
            );
        } catch (error) {
            alert(error?.message || "This application could not be updated.");
        }
    }
}

async function markNotificationRead(id) {
    const n = notifications.find((notification) => String(notification.id) === String(id));
    if (n) {
        n.read = true;
        await saveToLocalStorage();
        renderNotifications();
    }
}

async function markAllNotificationsRead() {
    notifications.forEach(n => n.read = true);
    await saveToLocalStorage();
    renderNotifications();
    alert("All notifications marked as read");
}

function exportJobsToCSV() {
    if (jobs.length === 0) {
        alert("No jobs to export");
        return;
    }
    
    let csv = "Job Title,Location,Stipend,Duration,Closing Date,Posted Date,Status,NQF Level,Applicants\n";
    jobs.forEach(job => {
        csv += `"${job.title}","${job.location}","${job.stipend}","${job.duration}","${job.closingDate}","${job.postedDate}","${job.status}","${job.nqfLevel || 'Not specified'}",${getApplicantCount(job.id)}\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`Exported ${jobs.length} jobs`);
}

function exportAnalyticsToPdf() {
    if (jobs.length === 0 && applications.length === 0) {
        alert("No analytics data is available to export yet.");
        return;
    }

    if (typeof window.open !== "function") {
        alert("PDF export is not available in this environment.");
        return;
    }

    const reportWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
    if (!reportWindow) {
        alert("Please allow pop-ups to export the dashboard report.");
        return;
    }

    const acceptedApplications = applications.filter((application) => application.status === "accepted").length;
    const placementRate = applications.length === 0
        ? "0%"
        : `${Math.round((acceptedApplications / applications.length) * 100)}%`;
    const rows = jobs.map((job) => `
        <tr>
            <td>${escapeHtml(job.title)}</td>
            <td>${escapeHtml(job.opportunityType || "Opportunity")}</td>
            <td>${escapeHtml(job.location)}</td>
            <td>${escapeHtml(job.status)}</td>
            <td>${getApplicantCount(job.id)}</td>
            <td>${getAcceptedApplicantCount(job.id)}</td>
        </tr>
    `).join("");

    reportWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Recruiter Dashboard Report</title>
    <style>
        body { font-family: Arial, sans-serif; color: #162033; padding: 32px; }
        h1 { margin-bottom: 8px; }
        p { color: #475569; }
        .metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
        .metric { border: 1px solid #dbe3ef; border-radius: 12px; padding: 16px; }
        .metric strong { display: block; margin-top: 10px; font-size: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #dbe3ef; padding: 10px; text-align: left; }
        th { background: #f8fbff; }
    </style>
</head>
<body>
    <h1>Recruiter Dashboard Report</h1>
    <p>Generated on ${new Date().toLocaleDateString("en-ZA")}.</p>
    <section class="metrics">
        <article class="metric"><span>Total Posts</span><strong>${jobs.length}</strong></article>
        <article class="metric"><span>Applications</span><strong>${applications.length}</strong></article>
        <article class="metric"><span>Placement Rate</span><strong>${placementRate}</strong></article>
    </section>
    <table>
        <thead>
            <tr>
                <th>Opportunity</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applicants</th>
                <th>Accepted</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
</body>
</html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
}

function setupCharCounter() {
    const ta = document.getElementById("jobRequirements");
    const counter = document.getElementById("charCounter");
    if (ta && counter) {
        const updateCounter = () => {
            counter.textContent = `${ta.value.length} characters`;
            counter.style.color = ta.value.length > 500 ? "#f59e0b" : "#64748b";
        };
        ta.addEventListener("input", updateCounter);
        updateCounter();
    }
}

// ========== EXPORT FUNCTIONS FOR TESTING ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        formatJobTitle,
        getPaginatedJobs,
        getTotalPages,
        filterJobsBySearch,
        getApplicantCount,
        getPendingApplicantCount,
        getRecruiterDisplayName,
        sortJobs,
        validateJobForm,
        saveToLocalStorage,
        loadFromLocalStorage
    };
}

// ========== EVENT LISTENERS ==========
document.addEventListener("DOMContentLoaded", () => {
    initializeRecruiterHomepage().catch((error) => {
        console.error("Unable to load the recruiter homepage.", error);
        if (isPermissionError(error)) {
            alert('Firestore permissions are blocking access to the new "opportunities" or "applications" collections.');
            return;
        }
        alert(error?.message || "The recruiter homepage could not be loaded.");
    });
});

async function initializeRecruiterHomepage() {
    await loadFromLocalStorage();
    setupCharCounter();
    applyRecruiterBranding();
    updateDashboardMetrics();

    const opportunitiesBtn = document.getElementById("opportunitiesBtn");
    const applicationsBtn = document.getElementById("applicationsBtn");
    const sortDateBtn = document.getElementById("sortDateBtn");
    const sortApplicantsBtn = document.getElementById("sortApplicantsBtn");
    const selectPostsBtn = document.getElementById("selectPostsBtn");
    const settingsOnlyBtn = document.getElementById("settingsOnlyBtn");
    const settingsNavBtn = document.getElementById("settingsNavBtn");
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("appSidebar");
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const deleteAccountBtn = document.getElementById("sidebarDeleteAccountBtn");
    const logoutBtn = document.getElementById("sidebarLogoutBtn");

    if (opportunitiesBtn) opportunitiesBtn.addEventListener("click", () => switchTab("opportunities"));
    if (applicationsBtn) applicationsBtn.addEventListener("click", () => {
        clearApplicationsJobContext();
        setApplicationStatusFilter("pending");
        switchTab("applications");
    });
    if (sortDateBtn) sortDateBtn.addEventListener("click", setSortByDate);
    if (sortApplicantsBtn) sortApplicantsBtn.addEventListener("click", setSortByApplicants);
    if (selectPostsBtn) selectPostsBtn.addEventListener("click", toggleBulkMode);
    if (settingsOnlyBtn) settingsOnlyBtn.addEventListener("click", (e) => { e.preventDefault(); alert("⚙️ Settings - Coming in Sprint 2"); });
    if (settingsNavBtn) settingsNavBtn.addEventListener("click", () => alert("⚙️ Settings - Coming in Sprint 2"));

    function setSidebarState(isOpen) {
        if (!sidebar || !sidebarBackdrop) return;
        sidebar.classList.toggle("is-open", isOpen);
        sidebar.setAttribute("aria-hidden", String(!isOpen));
        sidebarBackdrop.hidden = !isOpen;
        document.body.classList.toggle("sidebar-open", isOpen);
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener("click", () => setSidebarState(true));
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener("click", () => setSidebarState(false));
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener("click", () => setSidebarState(false));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", openLogoutModal);
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", startDeleteAccountFlow);
    }

    document.querySelectorAll(".sidebar-link[href^='#']").forEach((link) => {
        link.addEventListener("click", (event) => {
            const target = event.currentTarget.getAttribute("href");
            if (target === "#applicationsSection") {
                event.preventDefault();
                clearApplicationsJobContext();
                setApplicationStatusFilter("pending");
                switchTab("applications");
            } else if (target === "#opportunitiesSection") {
                event.preventDefault();
                switchTab("opportunities");
            }
            setSidebarState(false);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarState(false);
        }
    });

    if (window.location.hash === "#applicationsSection") {
        setApplicationStatusFilter("pending");
        switchTab("applications");
    } else if (window.location.hash === "#notificationsSection") {
        switchTab("notifications");
    }

    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.addEventListener("input", searchOpportunities);

    const postJobBtn = document.getElementById("postJobBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const postJobForm = document.getElementById("postJobForm");
    const markAllReadBtn = document.getElementById("markAllReadBtn");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
    const cancelBulkBtn = document.getElementById("cancelBulkBtn");
    const confirmCancelBtn = document.getElementById("confirmCancelBtn");
    const confirmOkBtn = document.getElementById("confirmOkBtn");
    const confirmCloseBtn = document.getElementById("confirmCloseBtn");
    const confirmModal = document.getElementById("confirmModal");
    const applicationViewModal = document.getElementById("applicationViewModal");
    const opportunityViewModal = document.getElementById("opportunityViewModal");
    const closeApplicationViewModalBtn = document.getElementById("closeApplicationViewModalBtn");
    const closeApplicationViewFooterBtn = document.getElementById("closeApplicationViewFooterBtn");
    const closeOpportunityViewModalBtn = document.getElementById("closeOpportunityViewModalBtn");
    const closeOpportunityViewFooterBtn = document.getElementById("closeOpportunityViewFooterBtn");
    const filterAll = document.getElementById("filterAll");
    const filterPending = document.getElementById("filterPending");
    const filterShortlisted = document.getElementById("filterShortlisted");
    const filterAccepted = document.getElementById("filterAccepted");
    const filterRejected = document.getElementById("filterRejected");

    if (postJobBtn) postJobBtn.addEventListener("click", openPostJobModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closePostJobModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closePostJobModal);
    if (postJobForm) postJobForm.addEventListener("submit", postJob);
    if (markAllReadBtn) markAllReadBtn.addEventListener("click", markAllNotificationsRead);
    if (prevPageBtn) prevPageBtn.addEventListener("click", prevPage);
    if (nextPageBtn) nextPageBtn.addEventListener("click", nextPage);
    if (bulkDeleteBtn) bulkDeleteBtn.addEventListener("click", bulkDelete);
    if (cancelBulkBtn) cancelBulkBtn.addEventListener("click", () => toggleBulkMode());
    if (confirmCancelBtn) confirmCancelBtn.addEventListener("click", closeDeleteModal);
    if (confirmCloseBtn) confirmCloseBtn.addEventListener("click", closeDeleteModal);
    if (confirmOkBtn) confirmOkBtn.addEventListener("click", handleConfirmModalAction);
    if (closeApplicationViewModalBtn) closeApplicationViewModalBtn.addEventListener("click", closeApplicationViewModal);
    if (closeApplicationViewFooterBtn) closeApplicationViewFooterBtn.addEventListener("click", closeApplicationViewModal);
    if (closeOpportunityViewModalBtn) closeOpportunityViewModalBtn.addEventListener("click", closeOpportunityViewModal);
    if (closeOpportunityViewFooterBtn) closeOpportunityViewFooterBtn.addEventListener("click", closeOpportunityViewModal);
    if (confirmModal) {
        confirmModal.addEventListener("cancel", (event) => {
            event.preventDefault();
            closeDeleteModal();
        });
        confirmModal.addEventListener("click", (event) => {
            if (event.target === confirmModal) {
                closeDeleteModal();
            }
        });
    }
    if (applicationViewModal) {
        applicationViewModal.addEventListener("cancel", (event) => {
            event.preventDefault();
            closeApplicationViewModal();
        });
        applicationViewModal.addEventListener("click", (event) => {
            if (event.target === applicationViewModal) {
                closeApplicationViewModal();
            }
        });
    }
    if (opportunityViewModal) {
        opportunityViewModal.addEventListener("cancel", (event) => {
            event.preventDefault();
            closeOpportunityViewModal();
        });
        opportunityViewModal.addEventListener("click", (event) => {
            if (event.target === opportunityViewModal) {
                closeOpportunityViewModal();
            }
        });
    }

    if (filterAll) filterAll.addEventListener("click", () => {
        setApplicationStatusFilter("all");
        renderApplications();
    });

    if (filterPending) filterPending.addEventListener("click", () => {
        setApplicationStatusFilter("pending");
        renderApplications();
    });

    if (filterShortlisted) filterShortlisted.addEventListener("click", () => {
        setApplicationStatusFilter("shortlisted");
        renderApplications();
    });

    if (filterAccepted) filterAccepted.addEventListener("click", () => {
        setApplicationStatusFilter("accepted");
        renderApplications();
    });

    if (filterRejected) filterRejected.addEventListener("click", () => {
        setApplicationStatusFilter("rejected");
        renderApplications();
    });

    if (!window.location.hash) {
        switchTab("opportunities");
    }

    updateApplicationsTabBadge();
    updateBulkModeButton();
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

function applyRecruiterBranding() {
    const recruiterName = getDisplayName(currentRecruiter.displayName, currentRecruiter.companyName);
    const welcomeHeading = document.querySelector(".welcome h1");
    const sidebarName = document.querySelector(".sidebar-brand .user-name");

    if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome back, ${recruiterName}`;
    }

    if (sidebarName) {
        sidebarName.textContent = recruiterName;
    }
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

Object.assign(window, {
    acceptApplicant,
    bulkDelete,
    confirmDeleteJob,
    editJob,
    markNotificationRead,
    rejectApplicant,
    reviewApplicants,
    shortlistApplicant,
    toggleJobStatus,
    viewApplicant,
    viewJobDetails
});
