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

// Sample data
notifications = [
    { id: 1, title: "Welcome!", message: "Post your first opportunity using the button above", time: "Just now", read: false }
];

// Sample applications for testing
applications = [
    { id: 101, jobId: 1, applicantName: "Thabo Nkosi", appliedDate: "2026-04-10", qualifications: "Matric with Maths - 78%", status: "pending" },
    { id: 102, jobId: 1, applicantName: "Lerato Molefe", appliedDate: "2026-04-09", qualifications: "Matric with Maths - 65%", status: "pending" },
    { id: 103, jobId: 2, applicantName: "Sipho Dlamini", appliedDate: "2026-04-08", qualifications: "IT Diploma", status: "reviewed" }
];

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>]/g, (match) => {
        if (match === "&") return "&amp;";
        if (match === "<") return "&lt;";
        return "&gt;";
    });
}

function getApplicantCount(jobId) {
    return applications.filter((application) => application.jobId === jobId).length;
}

function getPendingApplicantCount(jobId) {
    return applications.filter((application) => application.jobId === jobId && application.status === "pending").length;
}

function saveToLocalStorage() {
    localStorage.setItem("recruiter_jobs", JSON.stringify(jobs));
    localStorage.setItem("recruiter_applications", JSON.stringify(applications));
}

function loadFromLocalStorage() {
    const savedJobs = localStorage.getItem("recruiter_jobs");
    const savedApps = localStorage.getItem("recruiter_applications");
    if (savedJobs) {
        jobs = JSON.parse(savedJobs);
    }
    if (savedApps) {
        applications = JSON.parse(savedApps);
    }
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

function updateBottomNav(tab) {
    const navMap = {
        opportunities: "opportunitiesBtn",
        applications: "applicationsBtn",
        notifications: "notificationsBtn"
    };
    document.querySelectorAll(".bottom-nav .nav-item").forEach((item) => item.classList.remove("active"));
    if (navMap[tab]) {
        const activeButton = document.getElementById(navMap[tab]);
        if (activeButton) {
            activeButton.classList.add("active");
        }
    }
}

function updateApplicationsTabBadge() {
    const totalPending = applications.filter(app => app.status === 'pending').length;
    const applicationsBtn = document.getElementById('applicationsBtn');
    if (applicationsBtn) {
        if (totalPending > 0) {
            applicationsBtn.innerHTML = `<i class="fa-solid fa-file-lines"></i><span>Applications <span class="badge-pending">${totalPending}</span></span>`;
        } else {
            applicationsBtn.innerHTML = `<i class="fa-solid fa-file-lines"></i><span>Applications</span>`;
        }
    }
}

function renderOpportunities() {
    const container = document.getElementById("opportunitiesList");
    if (!container) return;

    let filteredJobs = jobs.filter((job) => {
        const matchesSearch = searchTerm === "" || job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

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
            container.innerHTML = '<div class="empty-state"><p>📌 You haven\'t posted any opportunities yet.</p><p>Click "Post New Opportunity" to create your first learnership.</p><p>💡 Once you post a job and receive applications, they will appear here with a "Needs Attention" badge.</p></div>';
        } else {
            container.innerHTML = `<div class="empty-state"><p>🔍 No opportunities match "${escapeHtml(searchTerm)}"</p><p>Try a different search term.</p></div>`;
        }
        return;
    }

    let html = "";
    paginatedJobs.forEach((job) => {
        const isSelected = selectedJobs.has(job.id);
        const statusClass = job.status === "draft" ? "draft" : (job.status === "closed" ? "closed" : "active");
        const statusText = job.status === "draft" ? "📝 Draft" : (job.status === "closed" ? "🔒 Closed" : "✅ Active");
        const applicantCount = getApplicantCount(job.id);
        const pendingCount = getPendingApplicantCount(job.id);
        const needsAttention = applicantCount > 0 && job.status === 'active';
        const highPriority = applicantCount > 10;
        
        const attentionBadge = needsAttention ? '<span class="status-badge needs-attention">⚠️ Needs Attention</span>' : '';
        const priorityIcon = highPriority ? '<i class="fa-solid fa-circle-exclamation" style="color: #dc2626; margin-left: 8px;" title="High volume of applicants"></i>' : '';
        const reviewButton = applicantCount > 0 ? `<button class="review-btn" onclick="reviewApplicants(${job.id})">📋 Review ${applicantCount} Applicant${applicantCount !== 1 ? 's' : ''}</button>` : '<button class="review-btn disabled" disabled style="background-color: #94a3b8;">No applicants yet</button>';

        html += `
            <article class="opportunity-card ${statusClass}">
                <header class="card-header">
                    <div>
                        ${bulkMode ? `<input type="checkbox" class="card-checkbox" data-id="${job.id}" ${isSelected ? "checked" : ""}>` : ""}
                        <h3>${escapeHtml(job.title)}${priorityIcon}</h3>
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
        document.querySelectorAll(".card-checkbox").forEach((checkbox) => {
            checkbox.addEventListener("change", function () {
                const id = Number.parseInt(this.dataset.id, 10);
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
    if (!bar || !countSpan) return;

    if (selectedJobs.size > 0) {
        bar.style.display = "flex";
        countSpan.textContent = selectedJobs.size;
    } else {
        bar.style.display = "none";
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
    jobs = jobs.filter((job) => !selectedJobs.has(job.id));
    applications = applications.filter((application) => !selectedJobs.has(application.jobId));

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
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;

    if (job.status === "active") {
        job.status = "closed";
        notifications.unshift({ id: Date.now(), title: "Job Closed", message: `You closed "${job.title}"`, time: "Just now", read: false });
    } else if (job.status === "closed") {
        job.status = "active";
        notifications.unshift({ id: Date.now(), title: "Job Reactivated", message: `You reactivated "${job.title}"`, time: "Just now", read: false });
    } else {
        job.status = "active";
        notifications.unshift({ id: Date.now(), title: "Job Published", message: `You published "${job.title}"`, time: "Just now", read: false });
    }

    saveToLocalStorage();
    renderOpportunities();
    renderNotifications();
}

function duplicateJob(jobId) {
    const original = jobs.find((job) => job.id === jobId);
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
    alert(`✅ "${original.title}" has been duplicated as a draft`);
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
        filteredApps = applications.filter((app) => app.status === "pending");
    } else if (currentFilter === "reviewed") {
        filteredApps = applications.filter((app) => app.status === "reviewed");
    }

    let html = '<table><thead><tr><th>Applicant Name</th><th>Opportunity</th><th>Applied Date</th><th>Qualifications</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

    filteredApps.forEach((app) => {
        const job = jobs.find((item) => item.id === app.jobId);
        const jobTitle = job ? job.title : "Unknown";
        html += `<tr><td>${escapeHtml(app.applicantName)}</td><td>${escapeHtml(jobTitle)}</td><td>${app.appliedDate}</td><td>${escapeHtml(app.qualifications)}</td><td>${escapeHtml(app.status)}</td><td class="action-buttons"><button onclick="viewApplicant(${app.id})">👤 View</button><button onclick="shortlistApplicant(${app.id})">✓ Shortlist</button><button onclick="rejectApplicant(${app.id})">✗ Reject</button></td></tr>`;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}

function renderNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>🔔 No new notifications.</p></div>';
        return;
    }

    let html = "";
    notifications.forEach((notification) => {
        const unreadClass = notification.read ? "" : "unread";
        html += `
            <div class="notification-item ${unreadClass}">
                <div class="notification-content">
                    <div class="notification-title">${escapeHtml(notification.title)}</div>
                    <div class="notification-message">${escapeHtml(notification.message)}</div>
                    <div class="notification-time">${escapeHtml(notification.time)}</div>
                </div>
                ${!notification.read ? `<button class="notification-read-btn" onclick="markNotificationRead(${notification.id})">Mark read</button>` : ""}
            </div>
        `;
    });

    container.innerHTML = html;
}

function searchOpportunities() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    searchTerm = searchInput.value;
    currentPage = 1;
    renderOpportunities();
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
        currentPage -= 1;
        renderOpportunities();
    }
}

function nextPage() {
    const totalJobs = jobs.filter((job) =>
        searchTerm === "" ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
    ).length;
    const totalPages = Math.ceil(totalJobs / jobsPerPage);

    if (currentPage < totalPages) {
        currentPage += 1;
        renderOpportunities();
    }
}

function switchTab(tab) {
    const opportunitiesSection = document.getElementById("opportunitiesSection");
    const applicationsSection = document.getElementById("applicationsSection");
    const notificationsSection = document.getElementById("notificationsSection");

    if (opportunitiesSection) opportunitiesSection.style.display = tab === "opportunities" ? "block" : "none";
    if (applicationsSection) applicationsSection.style.display = tab === "applications" ? "block" : "none";
    if (notificationsSection) notificationsSection.style.display = tab === "notifications" ? "block" : "none";

    updateBottomNav(tab);

    if (tab === "opportunities") renderOpportunities();
    if (tab === "applications") renderApplications();
    if (tab === "notifications") renderNotifications();
}

function getInitialTab() {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "applications" || requestedTab === "notifications") {
        return requestedTab;
    }
    return "opportunities";
}

function validateJobForm() {
    const fields = ["jobTitle", "jobLocation", "jobStipend", "jobDuration", "jobClosingDate", "jobRequirements"];
    return fields.every((id) => {
        const element = document.getElementById(id);
        return element && element.value.trim();
    });
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
    const title = document.getElementById("jobTitle").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const stipend = document.getElementById("jobStipend").value.trim();
    const duration = document.getElementById("jobDuration").value.trim();
    const closingDate = document.getElementById("jobClosingDate").value;
    const requirementsText = document.getElementById("jobRequirements").value.trim();
    const description = document.getElementById("jobDescription").value;

    if (!title && !location && !stipend && !duration && !closingDate && !requirementsText) {
        alert("Please fill at least some fields before saving as draft");
        return;
    }

    const requirements = requirementsText ? requirementsText.split("\n").filter((line) => line.trim() !== "") : [];

    const draftJob = {
        id: editingJobId || Date.now(),
        title: title || "Untitled Draft",
        location: location || "TBD",
        stipend: stipend || "TBD",
        duration: duration || "TBD",
        closingDate: closingDate || "2026-12-31",
        requirements,
        description,
        postedDate: new Date().toISOString().split("T")[0],
        status: "draft"
    };

    if (editingJobId) {
        const index = jobs.findIndex((job) => job.id === editingJobId);
        if (index !== -1) jobs[index] = draftJob;
        notifications.unshift({ id: Date.now(), title: "Draft Updated", message: `You updated draft "${draftJob.title}"`, time: "Just now", read: false });
    } else {
        jobs.push(draftJob);
        notifications.unshift({ id: Date.now(), title: "Draft Saved", message: `You saved "${draftJob.title}" as draft`, time: "Just now", read: false });
    }

    saveToLocalStorage();
    closePostJobModal();
    switchTab("opportunities");
    renderNotifications();
    alert("💾 Job saved as draft");
}

function postJob(event) {
    event.preventDefault();
    if (!validateJobForm()) {
        alert("Please fill in all required fields");
        return;
    }

    const title = document.getElementById("jobTitle").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const stipend = document.getElementById("jobStipend").value.trim();
    const duration = document.getElementById("jobDuration").value.trim();
    const closingDate = document.getElementById("jobClosingDate").value;
    const requirementsText = document.getElementById("jobRequirements").value.trim();
    const description = document.getElementById("jobDescription").value;
    const status = document.getElementById("jobStatus").value;
    const requirements = requirementsText.split("\n").filter((line) => line.trim() !== "");

    const jobData = {
        id: editingJobId || Date.now(),
        title,
        location,
        stipend,
        duration,
        closingDate,
        requirements,
        description,
        postedDate: editingJobId ? jobs.find((job) => job.id === editingJobId)?.postedDate || new Date().toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        status: status === "draft" ? "draft" : "active"
    };

    if (editingJobId) {
        const index = jobs.findIndex((job) => job.id === editingJobId);
        if (index !== -1) jobs[index] = jobData;
        notifications.unshift({ id: Date.now(), title: "Job Updated", message: `You updated "${title}"`, time: "Just now", read: false });
        alert("✅ Job updated successfully");
    } else {
        jobs.push(jobData);
        notifications.unshift({ id: Date.now(), title: "Job Posted", message: `You posted "${title}"`, time: "Just now", read: false });
        alert("✅ Job posted successfully");
    }

    saveToLocalStorage();
    closePostJobModal();
    switchTab("opportunities");
    renderNotifications();
    editingJobId = null;
}

function editJob(jobId) {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;

    editingJobId = jobId;
    document.getElementById("jobTitle").value = job.title;
    document.getElementById("jobLocation").value = job.location;
    document.getElementById("jobStipend").value = job.stipend;
    document.getElementById("jobDuration").value = job.duration;
    document.getElementById("jobClosingDate").value = job.closingDate;
    document.getElementById("jobRequirements").value = job.requirements.join("\n");
    document.getElementById("jobDescription").value = job.description || "";
    document.getElementById("jobStatus").value = job.status || "active";
    document.getElementById("modalTitle").textContent = "Edit Opportunity";
    document.getElementById("submitJobBtn").textContent = "Update Opportunity";
    document.getElementById("postJobModal").style.display = "flex";
}

function confirmDeleteJob(jobId) {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;

    if (confirm(`Are you sure you want to delete "${job.title}"?`)) {
        jobs = jobs.filter((item) => item.id !== jobId);
        applications = applications.filter((application) => application.jobId !== jobId);
        saveToLocalStorage();
        renderOpportunities();
        renderApplications();
        notifications.unshift({ id: Date.now(), title: "Job Deleted", message: `You deleted "${job.title}"`, time: "Just now", read: false });
        renderNotifications();
        alert(`✅ "${job.title}" deleted`);
    }
}

function viewJobDetails(jobId) {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;

    const requirementsText = job.requirements.map((requirement) => `- ${requirement}`).join("\n");
    alert(`📋 ${job.title}\n\n📍 Location: ${job.location}\n💰 Stipend: ${job.stipend}\n📅 Duration: ${job.duration}\n📆 Closing: ${job.closingDate}\n👥 Applicants: ${getApplicantCount(job.id)}\n⏳ Pending: ${getPendingApplicantCount(job.id)}\n📌 Status: ${job.status}\n\n📝 Requirements:\n${requirementsText}\n\n${job.description || "No description"}`);
}

function viewApplicant(appId) {
    const application = applications.find((item) => item.id === appId);
    if (!application) return;

    alert(`👤 ${application.applicantName}\n📋 ${application.opportunityTitle}\n📅 ${application.appliedDate}\n📚 ${application.qualifications}\n📌 Status: ${application.status}`);
}

function shortlistApplicant(appId) {
    const application = applications.find((item) => item.id === appId);
    if (!application) return;

    application.status = "shortlisted";
    renderApplications();
    notifications.unshift({ id: Date.now(), title: "Shortlisted", message: `You shortlisted ${application.applicantName}`, time: "Just now", read: false });
    renderNotifications();
    alert(`✅ ${application.applicantName} shortlisted`);
}

function rejectApplicant(appId) {
    const application = applications.find((item) => item.id === appId);
    if (!application) return;

    application.status = "rejected";
    renderApplications();
    notifications.unshift({ id: Date.now(), title: "Rejected", message: `You rejected ${application.applicantName}`, time: "Just now", read: false });
    renderNotifications();
    alert(`❌ ${application.applicantName} rejected`);
}

function markNotificationRead(id) {
    const notification = notifications.find((item) => item.id === id);
    if (notification) {
        notification.read = true;
    }
    renderNotifications();
}

function markAllNotificationsRead() {
    notifications.forEach((notification) => {
        notification.read = true;
    });
    renderNotifications();
    alert("All notifications marked as read");
}

function exportJobsToCSV() {
    if (jobs.length === 0) {
        alert("No jobs to export");
        return;
    }

    let csv = "Job Title,Location,Stipend,Duration,Closing Date,Posted Date,Status,Applicants,Pending\n";
    jobs.forEach((job) => {
        csv += `"${job.title}","${job.location}","${job.stipend}","${job.duration}","${job.closingDate}","${job.postedDate}","${job.status}",${getApplicantCount(job.id)},${getPendingApplicantCount(job.id)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jobs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    alert(`✅ Exported ${jobs.length} jobs`);
}

function setupCharCounter() {
    const textarea = document.getElementById("jobRequirements");
    const counter = document.getElementById("charCounter");
    if (!textarea || !counter) return;

    textarea.addEventListener("input", function () {
        const count = this.value.length;
        counter.textContent = `${count} characters`;
        counter.style.color = count > 500 ? "#f59e0b" : "#64748b";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();

    const opportunitiesBtn = document.getElementById("opportunitiesBtn");
    const applicationsBtn = document.getElementById("applicationsBtn");
    const notificationsBtn = document.getElementById("notificationsBtn");
    const topNotificationBtn = document.getElementById("topNotificationBtn");
    const settingsNavBtn = document.getElementById("settingsNavBtn");
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
    const dropdownTrigger = document.getElementById("dropdownTrigger");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const profileBtn = document.getElementById("profileBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const privacyBtn = document.getElementById("privacyBtn");
    const helpBtn = document.getElementById("helpBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (opportunitiesBtn) opportunitiesBtn.addEventListener("click", () => switchTab("opportunities"));
    if (applicationsBtn) applicationsBtn.addEventListener("click", () => alert("Applications page - Coming in Sprint 2"));
    if (notificationsBtn) notificationsBtn.addEventListener("click", () => alert("Notifications page - Coming in Sprint 2"));
    if (topNotificationBtn) topNotificationBtn.addEventListener("click", () => alert("Notifications - Coming in Sprint 2"));
    if (settingsNavBtn) settingsNavBtn.addEventListener("click", () => alert("Settings - Coming in Sprint 2"));

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
        document.querySelectorAll(".filter-btn").forEach((button) => button.classList.remove("active"));
        filterAll.classList.add("active");
        renderApplications();
    });

    if (filterPending) filterPending.addEventListener("click", () => {
        currentFilter = "pending";
        document.querySelectorAll(".filter-btn").forEach((button) => button.classList.remove("active"));
        filterPending.classList.add("active");
        renderApplications();
    });

    if (filterReviewed) filterReviewed.addEventListener("click", () => {
        currentFilter = "reviewed";
        document.querySelectorAll(".filter-btn").forEach((button) => button.classList.remove("active"));
        filterReviewed.classList.add("active");
        renderApplications();
    });

    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener("click", (event) => {
            event.stopPropagation();
            dropdownMenu.classList.toggle("show");
        });
    }

    document.addEventListener("click", () => {
        if (dropdownMenu) dropdownMenu.classList.remove("show");
    });

    if (profileBtn) profileBtn.addEventListener("click", () => {
        if (dropdownMenu) {
            dropdownMenu.classList.remove("show");
        }
    });
    if (settingsBtn) settingsBtn.addEventListener("click", (event) => { event.preventDefault(); alert("Settings - Sprint 2"); });
    if (privacyBtn) privacyBtn.addEventListener("click", (event) => { event.preventDefault(); alert("Privacy - Sprint 2"); });
    if (helpBtn) helpBtn.addEventListener("click", (event) => { event.preventDefault(); alert("Help - Sprint 2"); });
    if (logoutBtn) logoutBtn.addEventListener("click", (event) => { event.preventDefault(); alert("Logged out"); });

    setupCharCounter();
    switchTab(getInitialTab());
});
