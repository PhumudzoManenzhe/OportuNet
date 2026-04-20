document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const openBtn = document.getElementById("hamburgerBtn");
    const closeBtn = document.getElementById("sidebarCloseBtn");
    const logoutBtn = document.getElementById("sidebarLogoutBtn");

    function setSidebarState(isOpen) {
        if (!sidebar || !backdrop) return;
        sidebar.classList.toggle("is-open", isOpen);
        sidebar.setAttribute("aria-hidden", String(!isOpen));
        backdrop.hidden = !isOpen;
        document.body.classList.toggle("sidebar-open", isOpen);
    }

    if (openBtn) {
        openBtn.addEventListener("click", () => setSidebarState(true));
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => setSidebarState(false));
    }

    if (backdrop) {
        backdrop.addEventListener("click", () => setSidebarState(false));
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

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarState(false);
        }
    });
});
