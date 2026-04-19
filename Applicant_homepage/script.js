document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const openBtn = document.getElementById("hamburgerBtn");
    const closeBtn = document.getElementById("sidebarCloseBtn");

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

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarState(false);
        }
    });
});
