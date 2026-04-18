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

// Sample notifications
notifications = [
    { id: 1, title: "Welcome!", message: "Post your first opportunity using the button above", time: "Just now", read: false }
];

// ========== HELPER FUNCTIONS ==========
function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>]/g, (match) => {
        if (match === "&") return "&amp;";
        if (match === "<") return "&lt;";
        return "&gt;";
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

function saveToLocalStorage() {
    localStorage.setItem("recruiter_jobs", JSON.stringify(jobs));
    localStorage.setItem("recruiter_applications", JSON.stringify(applications));
}

function loadFromLocalStorage() {
    const savedJobs = localStorage.getItem("recruiter_jobs");
    const savedApps = localStorage.getItem("recruiter_applications");
    if (savedJobs) jobs = JSON.parse(savedJobs);
    if (savedApps) applications = JSON.parse(savedApps);
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
            container.innerHTML = '<div class="empty-state"><p>📌 You haven\'t posted any opportunities yet.</p><p>Click "Post New Opportunity" to create your first learnership, internship or apprenticeship.</p></div>';
        } else {
            container.innerHTML = `<div class="empty-state"><p>🔍 No opportunities match "${escapeHtml(searchTerm)}"</p><p>Try a different search term.</p></div>`;
        }
        return;
    }

    let html = "";
    paginatedJobs.forEach(job => {
        const isSelected = selectedJobs.has(job.id);
        const statusClass = job.status === "draft" ? "draft" : (job.status === "closed" ? "closed" : "active");
        const statusText = job.status === "draft" ? "📝 Draft" : (job.status === "closed" ? "🔒 Closed" : "✅ Active");
        const applicantCount = getApplicantCount(job.id);
        const pendingCount = getPendingApplicantCount(job.id);
        const needsAttention = applicantCount > 0 && job.status === 'active';
        const attentionBadge = needsAttention ? '<span class="status-badge needs-attention">⚠️ Needs Attention</span>' : '';
        const reviewButton = applicantCount > 0 ? `<button class="review-btn" onclick="reviewApplicants(${job.id})">📋 Review ${applicantCount} Applicant${applicantCount !== 1 ? 's' : ''}</button>` : '<button class="review-btn" disabled style="background:#94a3b8; cursor:not-allowed;">No applicants yet</button>';

        html += `
            <article class="opportunity-card ${statusClass}">
                <header class="card-header">
                    <div>
                        ${bulkMode ? `<input type="checkbox" class="card-checkbox" data-id="${job.id}" ${isSelected ? "checked" : ""}>` : ""}
                        <h3>${escapeHtml(job.title)}</h3>
                    </div>
                    <div>
                        <button class="duplicate-job-btn" onclick="duplicateJob(${job.id})">📋 Copy</button>
                        <button class="edit-job-btn" onclick="editJob(${job.id})">✏️ Edit</button>
                        <button class="delete-job-btn" onclick="confirmDeleteJob(${job.id})">🗑️ Delete</button>
                    </div>
                </header>
                <div class="opportunity-meta">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span class="applicant-count">👥 ${applicantCount} applicant${applicantCount !== 1 ? 's' : ''}</span>
                    ${pendingCount > 0 ? `<span class="pending-count">⏳ ${pendingCount} pending</span>` : ''}
                    ${attentionBadge}
                    <button class="status-toggle" onclick="toggleJobStatus(${job.id})">${job.status === "active" ? "🔒 Close" : (job.status === "draft" ? "✅ Publish" : "✅ Reactivate")}</button>
                </div>
                <div class="location-info">📍 ${escapeHtml(job.location)}</div>
                <div class="stipend-info">💰 ${escapeHtml(job.stipend)}</div>
                <div class="closing-date">📅 Closing: ${job.closingDate}</div>
                <div class="action-buttons-group">
                    <button class="view-details-btn" onclick="viewJobDetails(${job.id})">View Details</button>
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
                const id = parseInt(this.dataset.id);
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
        alert(`📋 Reviewing "${job.title}"\n\nTotal Applicants: ${applicantCount}\nPending Review: ${pendingCount}\n\nThis will open the full applicant management page in Sprint 2.`);
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

function bulkDelete() {
    if (selectedJobs.size === 0) return;

    const deletedCount = selectedJobs.size;
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
    saveToLocalStorage();
    alert(`✅ Deleted ${deletedCount} opportunities`);
}

function toggleJobStatus(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    if (job.status === "active") {
        job.status = "closed";
        notifications.unshift({ id: Date.now(), title: "Job Closed", message: `You closed "${job.title}"`, time: "Just now", read: false });
        alert(`🔒 "${job.title}" has been closed.`);
    } else if (job.status === "closed") {
        job.status = "active";
        notifications.unshift({ id: Date.now(), title: "Job Reactivated", message: `You reactivated "${job.title}"`, time: "Just now", read: false });
        alert(`✅ "${job.title}" has been reactivated.`);
    } else {
        job.status = "active";
        notifications.unshift({ id: Date.now(), title: "Job Published", message: `You published "${job.title}"`, time: "Just now", read: false });
        alert(`✅ "${job.title}" has been published.`);
    }

    saveToLocalStorage();
    renderOpportunities();
    renderNotifications();
}

function duplicateJob(jobId) {
    const original = jobs.find(j => j.id === jobId);
    if (!original) return;

    const newJob = {
        ...original,
        id: Date.now(),
        title: `${original.title} (Copy)`,
        postedDate: new Date().toISOString().split("T")[0],
        status: "draft"
    };

    jobs.push(newJob);
    saveToLocalStorage();
    renderOpportunities();
    notifications.unshift({ id: Date.now(), title: "Job Duplicated", message: `You duplicated "${original.title}"`, time: "Just now", read: false });
    renderNotifications();
    alert(`✅ "${original.title}" has been duplicated as a draft.`);
}

function renderApplications() {
    const container = document.getElementById("applicationsList");
    if (!container) return;

    if (applications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>📭 No applications yet.</p><p>When students apply to your opportunities, they will appear here.</p></div>';
        return;
    }

    let filteredApps = applications;
    if (currentFilter === "pending") {
        filteredApps = applications.filter(a => a.status === "pending");
    } else if (currentFilter === "reviewed") {
        filteredApps = applications.filter(a => a.status === "reviewed");
    }

    let html = '<table><thead><tr><th>Name</th><th>Opportunity</th><th>Date</th><th>Qualifications</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    filteredApps.forEach(app => {
        const job = jobs.find(j => j.id === app.jobId);
        html += `<tr><td>${escapeHtml(app.applicantName)}</td><td>${escapeHtml(job?.title || 'Unknown')}</td><td>${app.appliedDate}</td><td>${escapeHtml(app.qualifications)}</td><td>${app.status}</td><td class="action-buttons"><button onclick="viewApplicant(${app.id})">👤 View</button><button onclick="shortlistApplicant(${app.id})">✓ Shortlist</button><button onclick="rejectApplicant(${app.id})">✗ Reject</button>NonNullable侧`;
    });
    html += "</tbody></table>";
    container.innerHTML = html;
}

function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>🔔 No notifications.</p></div>';
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
    document.getElementById("sortByDateBtn").classList.add("active");
    document.getElementById("sortByApplicantsBtn").classList.remove("active");
    renderOpportunities();
}

function setSortByApplicants() {
    currentSort = "applicants";
    currentPage = 1;
    document.getElementById("sortByApplicantsBtn").classList.add("active");
    document.getElementById("sortByDateBtn").classList.remove("active");
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

function saveAsDraft() {
    const titleField = document.getElementById("jobTitleField").value.trim();
    const titleType = document.getElementById("jobTitleType").value;
    const fullTitle = titleField && titleType ? `${titleField} ${titleType}` : (titleField || "Untitled Draft");
    
    const draftJob = {
        id: editingJobId || Date.now(),
        title: fullTitle,
        location: document.getElementById("jobLocation").value.trim() || "TBD",
        stipend: document.getElementById("jobStipend").value.trim() || "TBD",
        duration: document.getElementById("jobDuration").value.trim() || "TBD",
        closingDate: document.getElementById("jobClosingDate").value || "2026-12-31",
        requirements: document.getElementById("jobRequirements").value.trim().split("\n").filter(l => l.trim()),
        description: document.getElementById("jobDescription").value,
        postedDate: new Date().toISOString().split("T")[0],
        status: "draft"
    };
    
    if (editingJobId) {
        const idx = jobs.findIndex(j => j.id === editingJobId);
        if (idx !== -1) jobs[idx] = draftJob;
        alert("💾 Draft updated successfully");
    } else {
        jobs.push(draftJob);
        alert("💾 Job saved as draft");
    }
    
    saveToLocalStorage();
    closePostJobModal();
    switchTab("opportunities");
    renderNotifications();
}

function postJob(event) {
    event.preventDefault();
    if (!validateJobForm()) return;
    
    const titleField = document.getElementById("jobTitleField").value.trim();
    const titleType = document.getElementById("jobTitleType").value;
    const fullTitle = `${titleField} ${titleType}`;
    
    const jobData = {
        id: editingJobId || Date.now(),
        title: fullTitle,
        location: document.getElementById("jobLocation").value.trim(),
        stipend: document.getElementById("jobStipend").value.trim(),
        duration: document.getElementById("jobDuration").value.trim(),
        closingDate: document.getElementById("jobClosingDate").value,
        requirements: document.getElementById("jobRequirements").value.trim().split("\n").filter(l => l.trim()),
        description: document.getElementById("jobDescription").value,
        postedDate: new Date().toISOString().split("T")[0],
        status: document.getElementById("jobStatus").value === "draft" ? "draft" : "active"
    };
    
    if (editingJobId) {
        const idx = jobs.findIndex(j => j.id === editingJobId);
        if (idx !== -1) jobs[idx] = jobData;
        alert(`✅ Job updated successfully: ${fullTitle}`);
    } else {
        jobs.push(jobData);
        alert(`✅ Job posted successfully: ${fullTitle}`);
    }
    
    saveToLocalStorage();
    closePostJobModal();
    switchTab("opportunities");
    renderNotifications();
    editingJobId = null;
}

function editJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    editingJobId = jobId;
    
    let titleField = job.title;
    let titleType = "";
    
    if (job.title.endsWith(" Learnership")) {
        titleType = "Learnership";
        titleField = job.title.replace(" Learnership", "");
    } else if (job.title.endsWith(" Internship")) {
        titleType = "Internship";
        titleField = job.title.replace(" Internship", "");
    } else if (job.title.endsWith(" Apprenticeship")) {
        titleType = "Apprenticeship";
        titleField = job.title.replace(" Apprenticeship", "");
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

function confirmDeleteJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (job && confirm(`Are you sure you want to delete "${job.title}"?`)) {
        jobs = jobs.filter(j => j.id !== jobId);
        applications = applications.filter(a => a.jobId !== jobId);
        saveToLocalStorage();
        renderOpportunities();
        renderApplications();
        notifications.unshift({ id: Date.now(), title: "Job Deleted", message: `You deleted "${job.title}"`, time: "Just now", read: false });
        renderNotifications();
        alert(`✅ "${job.title}" deleted`);
    }
}

function viewJobDetails(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    let reqText = job.requirements.map(r => `- ${r}`).join("\n");
    alert(`📋 ${job.title}\n\n📍 Location: ${job.location}\n💰 Stipend: ${job.stipend}\n📅 Duration: ${job.duration}\n📆 Closing: ${job.closingDate}\n👥 Applicants: ${getApplicantCount(jobId)}\n📌 Status: ${job.status}\n\n📝 Requirements:\n${reqText}\n\n${job.description || "No description"}`);
}

function viewApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        alert(`👤 ${app.applicantName}\n📋 ${app.opportunityTitle}\n📅 ${app.appliedDate}\n📚 ${app.qualifications}\n📌 Status: ${app.status}`);
    }
}

function shortlistApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        app.status = "shortlisted";
        renderApplications();
        notifications.unshift({ id: Date.now(), title: "Shortlisted", message: `You shortlisted ${app.applicantName}`, time: "Just now", read: false });
        renderNotifications();
        alert(`✅ ${app.applicantName} shortlisted`);
    }
}

function rejectApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        app.status = "rejected";
        renderApplications();
        notifications.unshift({ id: Date.now(), title: "Rejected", message: `You rejected ${app.applicantName}`, time: "Just now", read: false });
        renderNotifications();
        alert(`❌ ${app.applicantName} rejected`);
    }
}

function markNotificationRead(id) {
    const n = notifications.find(n => n.id === id);
    if (n) {
        n.read = true;
        renderNotifications();
    }
}

function markAllNotificationsRead() {
    notifications.forEach(n => n.read = true);
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
    loadFromLocalStorage();
    setupCharCounter();
    
    const opportunitiesBtn = document.getElementById("opportunitiesBtn");
    const applicationsBtn = document.getElementById("applicationsBtn");
    const topNotificationBtn = document.getElementById("topNotificationBtn");
    const settingsOnlyBtn = document.getElementById("settingsOnlyBtn");
    const settingsNavBtn = document.getElementById("settingsNavBtn");
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const hamburgerMenu = document.getElementById("hamburgerMenu");
    
    if (opportunitiesBtn) opportunitiesBtn.addEventListener("click", () => switchTab("opportunities"));
    if (applicationsBtn) applicationsBtn.addEventListener("click", () => switchTab("applications"));
    if (topNotificationBtn) topNotificationBtn.addEventListener("click", () => alert("🔔 Notifications - Full functionality coming in Sprint 2"));
    if (settingsOnlyBtn) settingsOnlyBtn.addEventListener("click", (e) => { e.preventDefault(); alert("⚙️ Settings - Coming in Sprint 2"); });
    if (settingsNavBtn) settingsNavBtn.addEventListener("click", () => alert("⚙️ Settings - Coming in Sprint 2"));
    
    if (hamburgerBtn && hamburgerMenu) {
        hamburgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            hamburgerMenu.classList.toggle("show");
        });
        document.addEventListener("click", () => hamburgerMenu.classList.remove("show"));
    }
    
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.addEventListener("input", searchOpportunities);
    
    const postJobBtn = document.getElementById("postJobBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const postJobForm = document.getElementById("postJobForm");
    const saveDraftBtn = document.getElementById("saveDraftBtn");
    const markAllReadBtn = document.getElementById("markAllReadBtn");
    const exportJobsBtn = document.getElementById("exportJobsBtn");
    const sortByDateBtn = document.getElementById("sortByDateBtn");
    const sortByApplicantsBtn = document.getElementById("sortByApplicantsBtn");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
    const cancelBulkBtn = document.getElementById("cancelBulkBtn");
    const filterAll = document.getElementById("filterAll");
    const filterPending = document.getElementById("filterPending");
    const filterReviewed = document.getElementById("filterReviewed");
    
    if (postJobBtn) postJobBtn.addEventListener("click", openPostJobModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closePostJobModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closePostJobModal);
    if (postJobForm) postJobForm.addEventListener("submit", postJob);
    if (saveDraftBtn) saveDraftBtn.addEventListener("click", saveAsDraft);
    if (markAllReadBtn) markAllReadBtn.addEventListener("click", markAllNotificationsRead);
    if (exportJobsBtn) exportJobsBtn.addEventListener("click", exportJobsToCSV);
    if (sortByDateBtn) sortByDateBtn.addEventListener("click", setSortByDate);
    if (sortByApplicantsBtn) sortByApplicantsBtn.addEventListener("click", setSortByApplicants);
    if (prevPageBtn) prevPageBtn.addEventListener("click", prevPage);
    if (nextPageBtn) nextPageBtn.addEventListener("click", nextPage);
    if (bulkDeleteBtn) bulkDeleteBtn.addEventListener("click", bulkDelete);
    if (cancelBulkBtn) cancelBulkBtn.addEventListener("click", () => toggleBulkMode());
    
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
    
    switchTab("opportunities");
});
