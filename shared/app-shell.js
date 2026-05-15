(function () {
    const body = document.body;
    if (!body) return;

    const role = body.dataset.shellRole;
    const active = body.dataset.shellActive;
    const base = body.dataset.shellBase || "..";
    const profileHrefOverride = body.dataset.shellProfileHref;

    if (!role) return;

    const loginHref = `${base}/SignUp_LogIn_pages/logIn.html`;

    function logOutUser() {
        const isConfirmed = window.confirm("Are you sure you want to log out?");
        if (!isConfirmed) return;

        localStorage.removeItem("recruiter_jobs");
        localStorage.removeItem("recruiter_applications");
        sessionStorage.clear();
        window.location.href = loginHref;
    }

    async function deleteAccount() {
        try {
            const module = await import(`${base}/shared/account-actions.js`);
            await module.startDeleteAccountFlow({ loginHref });
        } catch (error) {
            console.error("Unable to load account deletion flow.", error);
            alert("Account deletion could not be started.");
        }
    }

    const shellConfig = {
        applicant: {
            caption: "Applicant",
            profileHref: profileHrefOverride || `${base}/Applicant_profile_page/global_profile.html`,
            notificationHref: `${base}/APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html`,
            links: [
                { key: "home", label: "Home", href: `${base}/Applicant_homepage/index.html` },
                { key: "internships", label: "Internships", href: `${base}/INTERNSHIPS_PAGE/Internships_page.html` },
                { key: "learnerships", label: "Learnerships", href: `${base}/LEARNERSHIPS_PAGE/Learnerships_page.html` },
                { key: "apprenticeships", label: "Apprenticeships", href: `${base}/APPRENTICESHIPS_PAGE/Apprenticeships_page.html` },
                { key: "applications", label: "My Applications", href: `${base}/APPLICANT_APPLICATIONS_PAGE/applications.html` },
                { key: "profile", label: "Profile", href: profileHrefOverride || `${base}/Applicant_profile_page/global_profile.html` },
                { key: "notifications", label: "Notifications", href: `${base}/APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html` },
                { key: "settings", label: "Settings", href: `${base}/APPLICANT_SETTINGS_PAGE/settings.html` }
            ]
        },
        recruiter: {
            caption: "Recruiter",
            profileHref: `${base}/Applicant_profile_page/global_profile.html`,
            notificationHref: `${base}/RECRUITER_NOTIFICATION_PAGE/recruiter_notifications_page.html`,
            links: [
                { key: "home", label: "Home", href: `${base}/Recruiter_homepage/index.html` },
                { key: "posts", label: "My Posts", href: `${base}/Recruiter_homepage/index.html#opportunitiesSection` },
                { key: "notifications", label: "Notifications", href: `${base}/RECRUITER_NOTIFICATION_PAGE/recruiter_notifications_page.html` }
            ]
        }
    };

    const config = shellConfig[role];
    if (!config) return;

    const header = document.createElement("header");
    header.className = "app-shell-topbar";
    header.innerHTML = `
        <div class="app-shell-nav-left">
            <button class="app-shell-icon-btn app-shell-menu-btn" id="appShellMenuBtn" type="button" aria-label="Open sidebar">
                <i class="fa-solid fa-bars"></i>
            </button>
        </div>
        <div class="app-shell-nav-right">
            ${role === "applicant" ? `
            <a class="app-shell-icon-btn" href="${config.profileHref}" aria-label="Go to profile page">
                <i class="fa-regular fa-user"></i>
            </a>
            ` : ""}
            <a class="app-shell-icon-btn" href="${config.notificationHref}" aria-label="Go to notifications page">
                <i class="fa-regular fa-bell"></i>
            </a>
        </div>
    `;

    const sidebar = document.createElement("aside");
    sidebar.className = "app-shell-sidebar";
    sidebar.id = "appShellSidebar";
    sidebar.setAttribute("aria-hidden", "true");
    sidebar.innerHTML = `
        <div class="app-shell-sidebar-header">
            <div class="app-shell-profile app-shell-brand">
                <div class="app-shell-avatar" aria-hidden="true">
                    <span class="app-shell-orbit app-shell-orbit-one"></span>
                    <span class="app-shell-orbit app-shell-orbit-two"></span>
                    <span class="app-shell-node"></span>
                </div>
                <div class="app-shell-profile-info">
                    <span class="app-shell-user-name">OpportuNet</span>
                    <span class="app-shell-caption">${config.caption} portal</span>
                </div>
            </div>
            <button class="app-shell-sidebar-close" id="appShellCloseBtn" type="button" aria-label="Close sidebar">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <nav class="app-shell-sidebar-nav" aria-label="Primary navigation">
            ${config.links.map((link) => `
                <a href="${link.href}" class="app-shell-sidebar-link${active === link.key ? " active" : ""}">${link.label}</a>
            `).join("")}
        </nav>
        <div class="app-shell-sidebar-footer">
            <button class="app-shell-sidebar-link app-shell-delete-account-btn" id="appShellDeleteAccountBtn" type="button">Delete Account</button>
            <button class="app-shell-sidebar-link app-shell-logout-btn" id="appShellLogoutBtn" type="button">Log Out</button>
        </div>
    `;

    const backdrop = document.createElement("div");
    backdrop.className = "app-shell-backdrop";
    backdrop.id = "appShellBackdrop";
    backdrop.hidden = true;

    body.prepend(backdrop);
    body.prepend(sidebar);
    body.prepend(header);

    if (parseFloat(window.getComputedStyle(body).paddingTop) < 80) {
        body.classList.add("app-shell-offset");
    }

    const menuBtn = document.getElementById("appShellMenuBtn");
    const closeBtn = document.getElementById("appShellCloseBtn");
    const deleteAccountBtn = document.getElementById("appShellDeleteAccountBtn");
    const logoutBtn = document.getElementById("appShellLogoutBtn");

    function setSidebarState(isOpen) {
        sidebar.classList.toggle("is-open", isOpen);
        sidebar.setAttribute("aria-hidden", String(!isOpen));
        backdrop.hidden = !isOpen;
        body.classList.toggle("app-shell-open", isOpen);
    }

    if (menuBtn) {
        menuBtn.addEventListener("click", () => setSidebarState(true));
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => setSidebarState(false));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logOutUser);
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", deleteAccount);
    }

    backdrop.addEventListener("click", () => setSidebarState(false));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarState(false);
        }
    });
})();
