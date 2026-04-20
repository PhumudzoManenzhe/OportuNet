const path = require("path");

const SCRIPT_PATH = path.resolve(__dirname, "../Applicant_homepage/script.js");
const GLOBAL_NAMES = ["window", "document", "localStorage", "sessionStorage"];

let restoreEnvironment = null;

afterEach(() => {
    restoreEnvironment?.();
    restoreEnvironment = null;
    jest.resetModules();
    jest.clearAllMocks();
});

function snapshotGlobals() {
    return Object.fromEntries(
        GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(global, name)])
    );
}

function restoreGlobals(snapshot) {
    Object.entries(snapshot).forEach(([name, descriptor]) => {
        if (descriptor) {
            Object.defineProperty(global, name, descriptor);
            return;
        }

        delete global[name];
    });
}

function setGlobal(name, value) {
    Object.defineProperty(global, name, {
        configurable: true,
        writable: true,
        value
    });
}

function createClassList() {
    const tokens = new Set();

    return {
        add: (...names) => names.forEach((name) => tokens.add(name)),
        remove: (...names) => names.forEach((name) => tokens.delete(name)),
        toggle: (name, force) => {
            const shouldAdd = force === undefined ? !tokens.has(name) : force;
            shouldAdd ? tokens.add(name) : tokens.delete(name);
            return shouldAdd;
        },
        contains: (name) => tokens.has(name)
    };
}

function createFakeNode(initial = {}) {
    const listeners = {};
    const attributes = { ...(initial.attributes || {}) };
    const node = {
        attributes,
        classList: createClassList(),
        hidden: false,
        listeners,
        addEventListener: jest.fn((type, handler) => {
            listeners[type] = handler;
        }),
        getAttribute: jest.fn((name) => attributes[name]),
        setAttribute: jest.fn((name, value) => {
            attributes[name] = String(value);
        }),
        ...initial
    };

    delete node.attributes;
    return node;
}

function createFakeDocument(options = {}) {
    const elements = {
        appSidebar: options.withSidebar === false ? null : createFakeNode({ attributes: { "aria-hidden": "true" } }),
        hamburgerBtn: options.withOpenButton === false ? null : createFakeNode(),
        sidebarBackdrop: options.withBackdrop === false ? null : createFakeNode({ hidden: true }),
        sidebarCloseBtn: options.withCloseButton === false ? null : createFakeNode(),
        sidebarLogoutBtn: options.withLogoutButton === false ? null : createFakeNode()
    };
    const documentListeners = {};
    const documentMock = {
        body: createFakeNode(),
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null)
    };

    return { documentListeners, documentMock, elements };
}

function loadApplicantHomepage(options = {}) {
    const snapshot = snapshotGlobals();
    restoreEnvironment = () => restoreGlobals(snapshot);

    const { documentListeners, documentMock, elements } = createFakeDocument(options);
    const windowMock = {
        confirm: jest.fn(() => true),
        location: { href: "about:blank" }
    };
    const localStorageMock = {
        removeItem: jest.fn()
    };
    const sessionStorageMock = {
        clear: jest.fn()
    };

    setGlobal("document", documentMock);
    setGlobal("window", windowMock);
    setGlobal("localStorage", localStorageMock);
    setGlobal("sessionStorage", sessionStorageMock);

    jest.resetModules();
    jest.isolateModules(() => {
        require(SCRIPT_PATH);
    });

    return {
        documentListeners,
        documentMock,
        elements,
        localStorageMock,
        sessionStorageMock,
        windowMock
    };
}

describe("Applicant homepage script", () => {
    test("registers the DOMContentLoaded handler and wires the homepage controls", () => {
        const { documentListeners, documentMock, elements } = loadApplicantHomepage();

        expect(documentMock.addEventListener).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function)
        );

        documentListeners.DOMContentLoaded();

        expect(elements.hamburgerBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );
        expect(elements.sidebarCloseBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );
        expect(elements.sidebarBackdrop.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );
        expect(elements.sidebarLogoutBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );
        expect(documentMock.addEventListener).toHaveBeenCalledWith(
            "keydown",
            expect.any(Function)
        );
    });

    test("opens the sidebar from the hamburger button and closes it with the close button", () => {
        const { documentListeners, elements, documentMock } = loadApplicantHomepage();

        documentListeners.DOMContentLoaded();

        elements.hamburgerBtn.listeners.click();
        expect(elements.appSidebar.classList.contains("is-open")).toBe(true);
        expect(elements.appSidebar.getAttribute("aria-hidden")).toBe("false");
        expect(elements.sidebarBackdrop.hidden).toBe(false);
        expect(documentMock.body.classList.contains("sidebar-open")).toBe(true);

        elements.sidebarCloseBtn.listeners.click();
        expect(elements.appSidebar.classList.contains("is-open")).toBe(false);
        expect(elements.appSidebar.getAttribute("aria-hidden")).toBe("true");
        expect(elements.sidebarBackdrop.hidden).toBe(true);
        expect(documentMock.body.classList.contains("sidebar-open")).toBe(false);
    });

    test("closes the sidebar from the backdrop or Escape key and ignores other keys", () => {
        const { documentListeners, elements, documentMock } = loadApplicantHomepage();

        documentListeners.DOMContentLoaded();

        elements.hamburgerBtn.listeners.click();
        documentListeners.keydown({ key: "Enter" });
        expect(elements.appSidebar.classList.contains("is-open")).toBe(true);
        expect(documentMock.body.classList.contains("sidebar-open")).toBe(true);

        documentListeners.keydown({ key: "Escape" });
        expect(elements.appSidebar.classList.contains("is-open")).toBe(false);
        expect(documentMock.body.classList.contains("sidebar-open")).toBe(false);

        elements.hamburgerBtn.listeners.click();
        elements.sidebarBackdrop.listeners.click();
        expect(elements.appSidebar.classList.contains("is-open")).toBe(false);
        expect(elements.sidebarBackdrop.hidden).toBe(true);
    });

    test("does not log out when the user cancels the confirmation prompt", () => {
        const { documentListeners, elements, localStorageMock, sessionStorageMock, windowMock } = loadApplicantHomepage();
        windowMock.confirm.mockReturnValue(false);

        documentListeners.DOMContentLoaded();
        elements.sidebarLogoutBtn.listeners.click();

        expect(windowMock.confirm).toHaveBeenCalledWith("Are you sure you want to log out?");
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
        expect(sessionStorageMock.clear).not.toHaveBeenCalled();
        expect(windowMock.location.href).toBe("about:blank");
    });

    test("logs out confirmed users, clears applicant session data, and redirects to login", () => {
        const { documentListeners, elements, localStorageMock, sessionStorageMock, windowMock } = loadApplicantHomepage();

        documentListeners.DOMContentLoaded();
        elements.sidebarLogoutBtn.listeners.click();

        expect(windowMock.confirm).toHaveBeenCalledWith("Are you sure you want to log out?");
        expect(localStorageMock.removeItem).toHaveBeenNthCalledWith(1, "recruiter_jobs");
        expect(localStorageMock.removeItem).toHaveBeenNthCalledWith(2, "recruiter_applications");
        expect(sessionStorageMock.clear).toHaveBeenCalledTimes(1);
        expect(windowMock.location.href).toBe("../SignUp_LogIn_pages/logIn.html");
    });

    test("safely no-ops when sidebar state elements are missing", () => {
        const { documentListeners, elements, documentMock } = loadApplicantHomepage({
            withBackdrop: false,
            withSidebar: false
        });

        documentListeners.DOMContentLoaded();

        expect(() => elements.hamburgerBtn.listeners.click()).not.toThrow();
        expect(() => documentListeners.keydown({ key: "Escape" })).not.toThrow();
        expect(documentMock.body.classList.contains("sidebar-open")).toBe(false);
    });
});
