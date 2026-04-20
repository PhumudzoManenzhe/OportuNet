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
let currentFilter = "all";
let searchTerm = "";
let currentSort = "date";
let currentPage = 1;
const jobsPerPage = 5;
let selectedJobs = new Set();
let bulkMode = false;
let editingJobId = null;
let pendingDeleteJobId = null;
let isSubmittingJob = false;
let isDeletingJob = false;
let currentRecruiter = {
    uid: "",
    email: "",
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
    return userData?.recruiterProfile?.companyName
        || userData?.recruiterProfile?.organisationName
        || userData?.recruiterProfile?.organizationName
        || userData?.displayName
        || userData?.companyName
        || user?.email
        || "Recruiter";
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
        jobId: application.jobId || "",
        recruiterId: application.recruiterId || "",
        applicantName: application.applicantName || "Unknown applicant",
        qualifications: application.qualifications || "Not provided",
        opportunityTitle: application.opportunityTitle || "",
        status: application.status || "pending",
        appliedAt: application.appliedAt || "",
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
    return jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
}

function getApplicantCount(jobId) {
    return applications.filter(app => app.jobId === jobId).length;
}

function getPendingApplicantCount(jobId) {
    return applications.filter(app => app.jobId === jobId && app.status === "pending").length;
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
        currentRecruiter = { uid: "", email: "", companyName: "Recruiter" };
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

    notifications = Array.isArray(dashboardData?.notifications) ? dashboardData.notifications : [];
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
    await setDoc(opportunityRef, {
        ownerUid: user.uid,
        title: jobData.title,
        opportunityType: inferOpportunityType(jobData),
        companyName: currentRecruiter.companyName || user.email || "Recruiter",
        location: jobData.location,
        duration: jobData.duration,
        stipend: jobData.stipend,
        closingDate: jobData.closingDate,
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

    let filteredJobs = jobs.filter(job => searchTerm === "" || job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.location.toLowerCase().includes(searchTerm.toLowerCase()));
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

function reviewApplicants(jobId) {
    const job = jobs.find(j => j.id === jobId);
    const applicantCount = getApplicantCount(jobId);
    const pendingCount = getPendingApplicantCount(jobId);
    
    if (job && applicantCount > 0) {
        alert(`Reviewing "${job.title}"\n\nTotal Applicants: ${applicantCount}\nPending Review: ${pendingCount}\n\nThis opens the applications view for this job.`);
        switchTab('applications');
    } else {
        alert(`No applicants to review for "${job?.title || 'this job'}" yet.`);
    }
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
    renderOpportunities();
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
        notifications.unshift({
            id: Date.now(),
            title: "Bulk Delete",
            message: `You deleted ${deletedCount} opportunities`,
            time: "Just now",
            read: false
        });

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
            notifications.unshift({ id: Date.now(), title: "Job Closed", message: `You closed "${job.title}"`, time: "Just now", read: false });
            alert(`"${job.title}" has been closed.`);
        } else if (job.status === "closed") {
            job.status = "active";
            job.updatedAt = new Date().toISOString();
            await updateDoc(doc(db, OPPORTUNITIES_COLLECTION, String(job.id)), {
                status: "active",
                updatedAt: job.updatedAt
            });
            notifications.unshift({ id: Date.now(), title: "Job Reactivated", message: `You reactivated "${job.title}"`, time: "Just now", read: false });
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

    if (applications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No applications yet.</p><p>When students apply to your opportunities, they will appear here.</p></div>';
        return;
    }

    let filteredApps = applications;
    if (currentFilter === "pending") {
        filteredApps = applications.filter(a => a.status === "pending");
    } else if (currentFilter === "reviewed") {
        filteredApps = applications.filter(a => a.status !== "pending");
    }

    let html = '<table><thead><tr><th>Name</th><th>Opportunity</th><th>Date</th><th>Qualifications</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    filteredApps.forEach(app => {
        const job = jobs.find(j => j.id === app.jobId);
        html += `<tr><td>${escapeHtml(app.applicantName)}</td><td>${escapeHtml(job?.title || app.opportunityTitle || 'Unknown')}</td><td>${app.appliedDate}</td><td>${escapeHtml(app.qualifications)}</td><td>${app.status}</td><td class="action-buttons"><button onclick="viewApplicant('${app.id}')">View</button><button onclick="shortlistApplicant('${app.id}')">Shortlist</button><button onclick="rejectApplicant('${app.id}')">Reject</button></td></tr>`;
    });
    html += "</tbody></table>";
    container.innerHTML = html;
}

function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No notifications.</p></div>';
        return;
    }

    let html = "";
    notifications.forEach(n => {
        html += `<div class="notification-item ${n.read ? "" : "unread"}"><div><div class="notification-title">${escapeHtml(n.title)}</div><div class="notification-message">${escapeHtml(n.message)}</div><div class="notification-time">${n.time}</div></div>${!n.read ? `<button class="notification-read-btn" onclick="markNotificationRead(${n.id})">Mark read</button>` : ""}</div>`;
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
    renderOpportunities();
}

function setSortByApplicants() {
    currentSort = "applicants";
    currentPage = 1;
    renderOpportunities();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderOpportunities();
    }
}

function nextPage() {
    const total = jobs.filter(j => searchTerm === "" || j.title.toLowerCase().includes(searchTerm.toLowerCase())).length;
    const totalPages = Math.ceil(total / jobsPerPage);
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
    const requirements = document.getElementById("jobRequirements");
    
    if (!titleField.value.trim()) { alert("Please enter a job title field"); return false; }
    if (!titleType.value) { alert("Please select a job type (Learnership, Internship, or Apprenticeship)"); return false; }
    if (!location.value.trim()) { alert("Please enter a location"); return false; }
    if (!stipend.value.trim()) { alert("Please enter stipend/salary"); return false; }
    if (!duration.value.trim()) { alert("Please enter duration"); return false; }
    if (!closingDate.value) { alert("Please select closing date"); return false; }
    if (!requirements.value.trim()) { alert("Please enter requirements"); return false; }
    
    return true;
}

function openPostJobModal() {
    document.getElementById("postJobForm").reset();
    editingJobId = null;
    document.getElementById("modalTitle").textContent = "Post New Opportunity";
    document.getElementById("submitJobBtn").textContent = "Post Opportunity";
    document.getElementById("jobStatus").value = "active";
    document.getElementById("postJobModal").style.display = "flex";
}

function closePostJobModal() {
    document.getElementById("postJobModal").style.display = "none";
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
        } else {
            jobs = [jobData, ...jobs];
        }
        currentPage = 1;
        closePostJobModal();
        switchTab("opportunities");
        renderNotifications();
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
    
    document.getElementById("jobTitleField").value = titleField;
    document.getElementById("jobTitleType").value = titleType;
    document.getElementById("jobLocation").value = job.location;
    document.getElementById("jobStipend").value = job.stipend;
    document.getElementById("jobDuration").value = job.duration;
    document.getElementById("jobClosingDate").value = job.closingDate;
    document.getElementById("jobRequirements").value = job.requirements.join("\n");
    document.getElementById("jobDescription").value = job.description || "";
    document.getElementById("jobStatus").value = job.status;
    document.getElementById("modalTitle").textContent = "Edit Opportunity";
    document.getElementById("submitJobBtn").textContent = "Update Opportunity";
    document.getElementById("postJobModal").style.display = "flex";
}

function openDeleteModal(jobTitle) {
    const confirmModal = document.getElementById("confirmModal");
    const confirmMessage = document.getElementById("confirmMessage");

    if (confirmMessage) {
        confirmMessage.textContent = `Are you sure you want to delete "${jobTitle}"?`;
    }

    if (confirmModal?.showModal) {
        confirmModal.showModal();
    } else if (confirmModal) {
        confirmModal.setAttribute("open", "open");
        confirmModal.style.display = "flex";
    }
}

function closeDeleteModal() {
    const confirmModal = document.getElementById("confirmModal");
    pendingDeleteJobId = null;

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

    const job = jobs.find(j => j.id === pendingDeleteJobId);
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
        await deleteDoc(doc(db, OPPORTUNITIES_COLLECTION, String(pendingDeleteJobId)));
        await deleteApplicationsForJob(String(pendingDeleteJobId));

        jobs = jobs.filter(j => j.id !== pendingDeleteJobId);
        applications = applications.filter(a => a.jobId !== pendingDeleteJobId);
        selectedJobs.delete(pendingDeleteJobId);
        notifications.unshift({ id: Date.now(), title: "Job Deleted", message: `You deleted "${job.title}"`, time: "Just now", read: false });

        closeDeleteModal();
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
    
    let reqText = job.requirements.map(r => `- ${r}`).join("\n");
    alert(`${job.title}\n\nLocation: ${job.location}\nStipend: ${job.stipend}\nDuration: ${job.duration}\nClosing: ${job.closingDate}\nApplicants: ${getApplicantCount(jobId)}\nStatus: ${job.status}\n\nRequirements:\n${reqText}\n\n${job.description || "No description"}`);
}

function viewApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        alert(`${app.applicantName}\n${app.opportunityTitle || "Opportunity"}\n${app.appliedDate}\n${app.qualifications}\nStatus: ${app.status}`);
    }
}

async function shortlistApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        const previousStatus = app.status;
        try {
            await updateDoc(doc(db, APPLICATIONS_COLLECTION, String(app.id)), { status: "shortlisted" });
            app.status = "shortlisted";
            notifications.unshift({ id: Date.now(), title: "Shortlisted", message: `You shortlisted ${app.applicantName}`, time: "Just now", read: false });
            await saveToLocalStorage();
            renderApplications();
            renderNotifications();
            alert(`${app.applicantName} shortlisted`);
        } catch (error) {
            app.status = previousStatus;
            alert(error?.message || "This application could not be updated.");
        }
    }
}

async function rejectApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        const previousStatus = app.status;
        try {
            await updateDoc(doc(db, APPLICATIONS_COLLECTION, String(app.id)), { status: "rejected" });
            app.status = "rejected";
            notifications.unshift({ id: Date.now(), title: "Rejected", message: `You rejected ${app.applicantName}`, time: "Just now", read: false });
            await saveToLocalStorage();
            renderApplications();
            renderNotifications();
            alert(`${app.applicantName} rejected`);
        } catch (error) {
            app.status = previousStatus;
            alert(error?.message || "This application could not be updated.");
        }
    }
}

async function markNotificationRead(id) {
    const n = notifications.find(n => n.id === id);
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
    
    let csv = "Job Title,Location,Stipend,Duration,Closing Date,Posted Date,Status,Applicants\n";
    jobs.forEach(job => {
        csv += `"${job.title}","${job.location}","${job.stipend}","${job.duration}","${job.closingDate}","${job.postedDate}","${job.status}",${getApplicantCount(job.id)}\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`✅ Exported ${jobs.length} jobs`);
}

function setupCharCounter() {
    const ta = document.getElementById("jobRequirements");
    const counter = document.getElementById("charCounter");
    if (ta && counter) {
        ta.addEventListener("input", () => {
            counter.textContent = `${ta.value.length} characters`;
            counter.style.color = ta.value.length > 500 ? "#f59e0b" : "#64748b";
        });
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

    const opportunitiesBtn = document.getElementById("opportunitiesBtn");
    const applicationsBtn = document.getElementById("applicationsBtn");
    const settingsOnlyBtn = document.getElementById("settingsOnlyBtn");
    const settingsNavBtn = document.getElementById("settingsNavBtn");
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("appSidebar");
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");

    if (opportunitiesBtn) opportunitiesBtn.addEventListener("click", () => switchTab("opportunities"));
    if (applicationsBtn) applicationsBtn.addEventListener("click", () => switchTab("applications"));
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
        logoutBtn.addEventListener("click", () => {
            const isConfirmed = window.confirm("Are you sure you want to log out?");
            if (!isConfirmed) return;

            localStorage.removeItem("recruiter_jobs");
            localStorage.removeItem("recruiter_applications");
            sessionStorage.clear();
            window.location.href = "../SignUp_LogIn_pages/logIn.html";
        });
    }

    document.querySelectorAll(".sidebar-link[href^='#']").forEach((link) => {
        link.addEventListener("click", (event) => {
            const target = event.currentTarget.getAttribute("href");
            if (target === "#applicationsSection") {
                event.preventDefault();
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
    const confirmModal = document.getElementById("confirmModal");
    const filterAll = document.getElementById("filterAll");
    const filterPending = document.getElementById("filterPending");
    const filterReviewed = document.getElementById("filterReviewed");

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
    if (confirmOkBtn) confirmOkBtn.addEventListener("click", performDeleteJob);
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

    if (filterAll) filterAll.addEventListener("click", () => {
        currentFilter = "all";
        document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        filterAll.classList.add("active");
        renderApplications();
    });

    if (filterPending) filterPending.addEventListener("click", () => {
        currentFilter = "pending";
        document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        filterPending.classList.add("active");
        renderApplications();
    });

    if (filterReviewed) filterReviewed.addEventListener("click", () => {
        currentFilter = "reviewed";
        document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        filterReviewed.classList.add("active");
        renderApplications();
    });

    if (!window.location.hash) {
        switchTab("opportunities");
    }
}

function applyRecruiterBranding() {
    const recruiterName = currentRecruiter.companyName || currentRecruiter.email || "Recruiter";
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
