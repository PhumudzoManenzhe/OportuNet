(function () {
    const body = document.body;
    if (!body) return;

    const role = body.dataset.shellRole;
    const active = body.dataset.shellActive;
    const base = body.dataset.shellBase || "..";

    if (!role) return;

    const shellConfig = {
        applicant: {
            caption: "Applicant",
            profileHref: `${base}/Applicant_profile_page/global_profile.html`,
            notificationHref: `${base}/APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html`,
            links: [
                { key: "home", label: "Home", href: `${base}/Applicant_homepage/index.html` },
                { key: "internships", label: "Internships", href: `${base}/INTERNSHIPS_PAGE/Internships_page.html` },
                { key: "learnerships", label: "Learnerships", href: `${base}/LEARNERSHIPS_PAGE/Learnerships_page.html` },
                { key: "apprenticeships", label: "Apprenticeships", href: `${base}/APPRENTICESHIPS_PAGE/Apprenticeships_page.html` },
                { key: "profile", label: "Profile", href: `${base}/Applicant_profile_page/global_profile.html` },
                { key: "notifications", label: "Notifications", href: `${base}/APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html` }
            ]
        },
        recruiter: {
            caption: "Recruiter",
            profileHref: `${base}/Applicant_profile_page/global_profile.html`,
            notificationHref: `${base}/APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html`,
            links: [
                { key: "home", label: "Home", href: `${base}/Recruiter_homepage/index.html` },
                { key: "posts", label: "My Posts", href: `${base}/Recruiter_homepage/index.html#opportunitiesSection` },
                { key: "profile", label: "Profile", href: `${base}/Applicant_profile_page/global_profile.html` },
                { key: "notifications", label: "Notifications", href: `${base}/APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html` }
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
            <a class="app-shell-icon-btn" href="${config.profileHref}" aria-label="Go to profile page">
                <i class="fa-regular fa-user"></i>
            </a>
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
            <div class="app-shell-profile">
                <div class="app-shell-avatar">PC</div>
                <div class="app-shell-profile-info">
                    <span class="app-shell-user-name">Provider Co.</span>
                    <span class="app-shell-caption">${config.caption}</span>
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

    backdrop.addEventListener("click", () => setSidebarState(false));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarState(false);
        }
    });
})();
