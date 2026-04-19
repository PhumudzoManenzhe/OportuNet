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
let currentUser = null;

// ========== FIREBASE AUTH CHECK ==========
function checkAuthAndLoad() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = user;
        
        // Check if user has recruiter role
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userRole = userDoc.data()?.role;
            
            if (userRole !== 'recruiter') {
                window.location.href = 'applicant.html';
                return;
            }
            
            // Update welcome message with company name
            const companyName = userDoc.data()?.companyName || 'Provider Co.';
            const recruiterNameSpan = document.getElementById('recruiterName');
            if (recruiterNameSpan) {
                recruiterNameSpan.textContent = companyName;
            }
            
            // Load data from Firebase
            await loadJobsFromFirebase();
            await loadApplicationsFromFirebase();
            await loadNotificationsFromFirebase();
            
            renderOpportunities();
            renderApplications();
            renderNotifications();
            
        } catch (error) {
            console.error("Error checking user role:", error);
        }
    });
}

// ========== FIREBASE CRUD OPERATIONS ==========
async function loadJobsFromFirebase() {
    try {
        const snapshot = await db.collection('jobs')
            .where('recruiterId', '==', currentUser.uid)
            .get();
        
        jobs = [];
        snapshot.forEach(doc => {
            jobs.push({ id: doc.id, ...doc.data() });
        });
        
        renderOpportunities();
    } catch (error) {
        console.error("Error loading jobs:", error);
    }
}

async function loadApplicationsFromFirebase() {
    try {
        const snapshot = await db.collection('applications').get();
        applications = [];
        snapshot.forEach(doc => {
            applications.push({ id: doc.id, ...doc.data() });
        });
        renderApplications();
    } catch (error) {
        console.error("Error loading applications:", error);
    }
}

async function loadNotificationsFromFirebase() {
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', currentUser.uid)
            .get();
        
        notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() });
        });
        renderNotifications();
    } catch (error) {
        console.error("Error loading notifications:", error);
    }
}

async function saveJobToFirebase(jobData) {
    try {
        if (jobData.id && jobData.id.length > 10) {
            // Update existing job
            await db.collection('jobs').doc(jobData.id).update(jobData);
        } else {
            // Create new job
            const docRef = await db.collection('jobs').add(jobData);
            jobData.id = docRef.id;
        }
        await loadJobsFromFirebase();
        return true;
    } catch (error) {
        console.error("Error saving job:", error);
        alert("Error saving job. Please try again.");
        return false;
    }
}

async function deleteJobFromFirebase(jobId) {
    try {
        await db.collection('jobs').doc(jobId).delete();
        
        // Also delete related applications
        const appsSnapshot = await db.collection('applications').where('jobId', '==', jobId).get();
        appsSnapshot.forEach(async (doc) => {
            await db.collection('applications').doc(doc.id).delete();
        });
        
        await loadJobsFromFirebase();
        await loadApplicationsFromFirebase();
        return true;
    } catch (error) {
        console.error("Error deleting job:", error);
        alert("Error deleting job. Please try again.");
        return false;
    }
}

async function updateApplicationStatus(applicationId, newStatus) {
    try {
        await db.collection('applications').doc(applicationId).update({ status: newStatus });
        await loadApplicationsFromFirebase();
        return true;
    } catch (error) {
        console.error("Error updating application:", error);
        return false;
    }
}

// ========== HELPER FUNCTIONS ==========
function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>]/g, (match) => {
        if (match === "&") return "&amp;";
        if (match === "<") return "&lt;";
        return "&gt;";
    });
}

function getApplicantCount(jobId) {
    return applications.filter(app => app.jobId === jobId).length;
}

function getPendingApplicantCount(jobId) {
    return applications.filter(app => app.jobId === jobId && app.status === "pending").length;
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
        const reviewButton = applicantCount > 0 ? `<button class="review-btn" onclick="reviewApplicants('${job.id}')">📋 Review ${applicantCount} Applicant${applicantCount !== 1 ? 's' : ''}</button>` : '<button class="review-btn" disabled style="background:#94a3b8; cursor:not-allowed;">No applicants yet</button>';

        html += `
            <article class="opportunity-card ${statusClass}">
                <header class="card-header">
                    <div>
                        ${bulkMode ? `<input type="checkbox" class="card-checkbox" data-id="${job.id}" ${isSelected ? "checked" : ""}>` : ""}
                        <h3>${escapeHtml(job.title)}</h3>
                    </div>
                    <div>
                        <button class="duplicate-job-btn" onclick="duplicateJob('${job.id}')">📋 Copy</button>
                        <button class="edit-job-btn" onclick="editJob('${job.id}')">✏️ Edit</button>
                        <button class="delete-job-btn" onclick="confirmDeleteJob('${job.id}')">🗑️ Delete</button>
                    </div>
                </header>
                <div class="opportunity-meta">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span class="applicant-count">👥 ${applicantCount} applicant${applicantCount !== 1 ? 's' : ''}</span>
                    ${pendingCount > 0 ? `<span class="pending-count">⏳ ${pendingCount} pending</span>` : ''}
                    ${attentionBadge}
                    <button class="status-toggle" onclick="toggleJobStatus('${job.id}')">${job.status === "active" ? "🔒 Close" : (job.status === "draft" ? "✅ Publish" : "✅ Reactivate")}</button>
                </div>
                <div class="location-info">📍 ${escapeHtml(job.location)}</div>
                <div class="stipend-info">💰 ${escapeHtml(job.stipend)}</div>
                <div class="closing-date">📅 Closing: ${job.closingDate}</div>
                <div class="action-buttons-group">
                    <button class="view-details-btn" onclick="viewJobDetails('${job.id}')">View Details</button>
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

async function bulkDelete() {
    if (selectedJobs.size === 0) return;

    const deletedCount = selectedJobs.size;
    const confirmed = confirm(`Are you sure you want to delete ${deletedCount} opportunities?`);
    
    if (confirmed) {
        for (const jobId of selectedJobs) {
            await deleteJobFromFirebase(jobId);
        }
        
        selectedJobs.clear();
        bulkMode = false;
        updateBulkDeleteBar();
        alert(`✅ Deleted ${deletedCount} opportunities`);
    }
}

async function toggleJobStatus(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    let newStatus;
    let message;
    
    if (job.status === "active") {
        newStatus = "closed";
        message = `🔒 "${job.title}" has been closed.`;
    } else if (job.status === "closed") {
        newStatus = "active";
        message = `✅ "${job.title}" has been reactivated.`;
    } else {
        newStatus = "active";
        message = `✅ "${job.title}" has been published.`;
    }
    
    try {
        await db.collection('jobs').doc(jobId).update({ status: newStatus });
        await loadJobsFromFirebase();
        alert(message);
    } catch (error) {
        console.error("Error updating job status:", error);
        alert("Error updating job status. Please try again.");
    }
}

async function duplicateJob(jobId) {
    const original = jobs.find(j => j.id === jobId);
    if (!original) return;

    const newJob = {
        title: `${original.title} (Copy)`,
        location: original.location,
        stipend: original.stipend,
        duration: original.duration,
        closingDate: original.closingDate,
        requirements: original.requirements,
        description: original.description,
        postedDate: new Date().toISOString().split("T")[0],
        status: "draft",
        recruiterId: currentUser.uid,
        recruiterEmail: currentUser.email,
        type: original.type
    };
    
    await saveJobToFirebase(newJob);
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
        html += `<tr><td>${escapeHtml(app.applicantName)}</td><td>${escapeHtml(job?.title || 'Unknown')}</td><td>${app.appliedDate}</td><td>${escapeHtml(app.qualifications)}</td><td>${app.status}</td><td class="action-buttons"><button onclick="viewApplicant('${app.id}')">👤 View</button><button onclick="shortlistApplicant('${app.id}')">✓ Shortlist</button><button onclick="rejectApplicant('${app.id}')">✗ Reject</button></td></tr>`;
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
        html += `<div class="notification-item ${n.read ? "" : "unread"}"><div><div class="notification-title">${escapeHtml(n.title)}</div><div class="notification-message">${escapeHtml(n.message)}</div><div class="notification-time">${n.time}</div></div>${!n.read ? `<button class="notification-read-btn" onclick="markNotificationRead('${n.id}')">Mark read</button>` : ""}</div>`;
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

async function saveAsDraft() {
    const titleField = document.getElementById("jobTitleField").value.trim();
    const titleType = document.getElementById("jobTitleType").value;
    const fullTitle = titleField && titleType ? `${titleField} ${titleType}` : (titleField || "Untitled Draft");
    
    const draftJob = {
        title: fullTitle,
        location: document.getElementById("jobLocation").value.trim() || "TBD",
        stipend: document.getElementById("jobStipend").value.trim() || "TBD",
        duration: document.getElementById("jobDuration").value.trim() || "TBD",
        closingDate: document.getElementById("jobClosingDate").value || "2026-12-31",
        requirements: document.getElementById("jobRequirements").value.trim().split("\n").filter(l => l.trim()),
        description: document.getElementById("jobDescription").value,
        postedDate: new Date().toISOString().split("T")[0],
        status: "draft",
        recruiterId: currentUser.uid,
        recruiterEmail: currentUser.email,
        type: titleType
    };
    
    if (editingJobId) {
        await db.collection('jobs').doc(editingJobId).update(draftJob);
        alert("💾 Draft updated successfully");
    } else {
        await db.collection('jobs').add(draftJob);
        alert("💾 Job saved as draft");
    }
    
    await loadJobsFromFirebase();
    closePostJobModal();
    switchTab("opportunities");
}

async function postJob(event) {
    event.preventDefault();
    if (!validateJobForm()) return;
    
    const titleField = document.getElementById("jobTitleField").value.trim();
    const titleType = document.getElementById("jobTitleType").value;
    const fullTitle = `${titleField} ${titleType}`;
    
    const jobData = {
        title: fullTitle,
        location: document.getElementById("jobLocation").value.trim(),
        stipend: document.getElementById("jobStipend").value.trim(),
        duration: document.getElementById("jobDuration").value.trim(),
        closingDate: document.getElementById("jobClosingDate").value,
        requirements: document.getElementById("jobRequirements").value.trim().split("\n").filter(l => l.trim()),
        description: document.getElementById("jobDescription").value,
        postedDate: new Date().toISOString().split("T")[0],
        status: document.getElementById("jobStatus").value === "draft" ? "draft" : "active",
        recruiterId: currentUser.uid,
        recruiterEmail: currentUser.email,
        type: titleType
    };
    
    if (editingJobId) {
        await db.collection('jobs').doc(editingJobId).update(jobData);
        alert(`✅ Job updated successfully: ${fullTitle}`);
    } else {
        await db.collection('jobs').add(jobData);
        alert(`✅ Job posted successfully: ${fullTitle}`);
    }
    
    await loadJobsFromFirebase();
    closePostJobModal();
    switchTab("opportunities");
    editingJobId = null;
}

async function editJob(jobId) {
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

async function confirmDeleteJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (job && confirm(`Are you sure you want to delete "${job.title}"?`)) {
        await deleteJobFromFirebase(jobId);
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

async function shortlistApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        await updateApplicationStatus(id, "shortlisted");
        alert(`✅ ${app.applicantName} shortlisted`);
    }
}

async function rejectApplicant(id) {
    const app = applications.find(a => a.id === id);
    if (app) {
        await updateApplicationStatus(id, "rejected");
        alert(`❌ ${app.applicantName} rejected`);
    }
}

async function markNotificationRead(id) {
    try {
        await db.collection('notifications').doc(id).update({ read: true });
        await loadNotificationsFromFirebase();
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}

async function markAllNotificationsRead() {
    for (const notif of notifications) {
        if (!notif.read) {
            await db.collection('notifications').doc(notif.id).update({ read: true });
        }
    }
    await loadNotificationsFromFirebase();
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

// ========== EVENT LISTENERS ==========
document.addEventListener("DOMContentLoaded", () => {
    setupCharCounter();
    checkAuthAndLoad();
    
    const opportunitiesBtn = document.getElementById("opportunitiesBtn");
    const applicationsBtn = document.getElementById("applicationsBtn");
    const topNotificationBtn = document.getElementById("topNotificationBtn");
    const settingsOnlyBtn = document.getElementById("settingsOnlyBtn");
    const settingsNavBtn = document.getElementById("settingsNavBtn");
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const hamburgerMenu = document.getElementById("hamburgerMenu");
    const searchInput = document.getElementById("searchInput");
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
    
    if (searchInput) searchInput.addEventListener("input", searchOpportunities);
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
});
