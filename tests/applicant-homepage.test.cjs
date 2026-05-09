const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SCRIPT_PATH = path.resolve(__dirname, "../Applicant_homepage/script.js");

function stripImports(source) {
    return source.replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];\s*$/gm, "");
}

function flushAsyncWork(cycles = 5) {
    return Array.from({ length: cycles }).reduce(
        (promise) => promise.then(() => Promise.resolve()),
        Promise.resolve()
    );
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
        textContent: "",
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
    const welcomeHeading = createFakeNode();
    const sidebarName = createFakeNode();
    const documentListeners = {};
    const documentMock = {
        body: createFakeNode(),
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null),
        querySelector: jest.fn((selector) => {
            if (selector === ".welcome h1") return welcomeHeading;
            if (selector === ".sidebar-brand .user-name") return sidebarName;
            return null;
        })
    };

    return { documentListeners, documentMock, elements, sidebarName, welcomeHeading };
}

function loadApplicantHomepage(options = {}) {
    const { documentListeners, documentMock, elements, sidebarName, welcomeHeading } = createFakeDocument(options);
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
    const consoleMock = {
        error: jest.fn()
    };
    const auth = options.auth || {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : null
    };
    const db = { service: "db" };
    const doc = jest.fn((dbArg, collectionName, id) => ({ collectionName, db: dbArg, id }));
    const getDoc = options.getDoc || jest.fn(() =>
        Promise.resolve({
            data: () => options.userDocData || {},
            exists: () => Boolean(options.userDocExists)
        })
    );
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser, onError) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => {
            if (options.authStateError) {
                onError(options.authStateError);
                return;
            }

            onUser(options.authStateUser ?? null);
        });
        return unsubscribe;
    });
    const context = vm.createContext({
        auth,
        console: consoleMock,
        db,
        doc,
        document: documentMock,
        getDoc,
        localStorage: localStorageMock,
        onAuthStateChanged,
        sessionStorage: sessionStorageMock,
        window: windowMock
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(SCRIPT_PATH, "utf8"))}
globalThis.__testExports = {
    applyApplicantBranding,
    bindApplicantShell,
    getApplicantDisplayName,
    initializeApplicantHomepage,
    loadApplicantDisplayName,
    resolveCurrentUser
};`;

    new vm.Script(source, { filename: SCRIPT_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        documentListeners,
        documentMock,
        elements,
        localStorageMock,
        sessionStorageMock,
        windowMock,
        mocks: {
            consoleMock,
            db,
            doc,
            documentListeners,
            documentMock,
            elements,
            getDoc,
            localStorageMock,
            onAuthStateChanged,
            sessionStorageMock,
            sidebarName,
            welcomeHeading,
            windowMock
        }
    };
}

describe("Applicant homepage script", () => {
    test("registers the DOMContentLoaded handler and wires the homepage controls", async () => {
        const { documentListeners, documentMock, elements } = loadApplicantHomepage();

        expect(documentMock.addEventListener).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function)
        );

        documentListeners.DOMContentLoaded();
        await flushAsyncWork();

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

    test("loads the applicant profile name and applies it to the welcome and sidebar text", async () => {
        const { api, mocks } = loadApplicantHomepage({
            currentUser: {
                displayName: "Auth Name",
                email: "applicant@example.com",
                uid: "applicant-123"
            },
            userDocData: {
                applicantProfile: {
                    profile: {
                        name: "Naledi Mokoena"
                    }
                },
                displayName: "Stored Name"
            },
            userDocExists: true
        });

        await api.initializeApplicantHomepage();

        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "users", "applicant-123");
        expect(mocks.welcomeHeading.textContent).toBe("Welcome Naledi Mokoena");
        expect(mocks.sidebarName.textContent).toBe("Naledi Mokoena");
    });

    test("applicant display names never fall back to the user's email address", () => {
        const { api } = loadApplicantHomepage();

        expect(api.getApplicantDisplayName({ displayName: "Stored Name" })).toBe("Stored Name");
        expect(api.getApplicantDisplayName({ fullName: "Full Name" })).toBe("Full Name");
        expect(api.getApplicantDisplayName({}, { displayName: "Auth Name" })).toBe("Auth Name");
        expect(api.getApplicantDisplayName({ email: "applicant@example.com" }, { email: "applicant@example.com" })).toBe("Applicant");
    });

    test("opens the sidebar from the hamburger button and closes it with the close button", async () => {
        const { documentListeners, elements, documentMock } = loadApplicantHomepage();

        documentListeners.DOMContentLoaded();
        await flushAsyncWork();

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

    test("closes the sidebar from the backdrop or Escape key and ignores other keys", async () => {
        const { documentListeners, elements, documentMock } = loadApplicantHomepage();

        documentListeners.DOMContentLoaded();
        await flushAsyncWork();

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

    test("does not log out when the user cancels the confirmation prompt", async () => {
        const { documentListeners, elements, localStorageMock, sessionStorageMock, windowMock } = loadApplicantHomepage();
        windowMock.confirm.mockReturnValue(false);

        documentListeners.DOMContentLoaded();
        await flushAsyncWork();
        elements.sidebarLogoutBtn.listeners.click();

        expect(windowMock.confirm).toHaveBeenCalledWith("Are you sure you want to log out?");
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
        expect(sessionStorageMock.clear).not.toHaveBeenCalled();
        expect(windowMock.location.href).toBe("about:blank");
    });

    test("logs out confirmed users, clears applicant session data, and redirects to login", async () => {
        const { documentListeners, elements, localStorageMock, sessionStorageMock, windowMock } = loadApplicantHomepage();

        documentListeners.DOMContentLoaded();
        await flushAsyncWork();
        elements.sidebarLogoutBtn.listeners.click();

        expect(windowMock.confirm).toHaveBeenCalledWith("Are you sure you want to log out?");
        expect(localStorageMock.removeItem).toHaveBeenNthCalledWith(1, "recruiter_jobs");
        expect(localStorageMock.removeItem).toHaveBeenNthCalledWith(2, "recruiter_applications");
        expect(sessionStorageMock.clear).toHaveBeenCalledTimes(1);
        expect(windowMock.location.href).toBe("../SignUp_LogIn_pages/logIn.html");
    });

    test("safely no-ops when sidebar state elements are missing", async () => {
        const { documentListeners, elements, documentMock } = loadApplicantHomepage({
            withBackdrop: false,
            withSidebar: false
        });

        documentListeners.DOMContentLoaded();
        await flushAsyncWork();

        expect(() => elements.hamburgerBtn.listeners.click()).not.toThrow();
        expect(() => documentListeners.keydown({ key: "Escape" })).not.toThrow();
        expect(documentMock.body.classList.contains("sidebar-open")).toBe(false);
    });
});
