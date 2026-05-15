const fs = require("fs");
const path = require("path");
const vm = require("vm");

const INDEX_PATH = path.resolve(__dirname, "../Applicant_homepage/index.html");
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
        style: {
            setProperty: jest.fn()
        },
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
        acceptedApplicationsMetric: createFakeNode(),
        cvStatusPill: createFakeNode(),
        focusPanelHeading: createFakeNode(),
        focusPanel: createFakeNode(),
        latestActivityPill: createFakeNode(),
        pendingApplicationsMetric: createFakeNode(),
        rejectedApplicationsMetric: createFakeNode(),
        shortlistedApplicationsMetric: createFakeNode(),
        snapshotLead: createFakeNode(),
        totalApplicationsMetric: createFakeNode()
    };
    const welcomeHeading = createFakeNode();
    const documentListeners = {};
    const documentMock = {
        body: createFakeNode(),
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null),
        querySelector: jest.fn((selector) => {
            if (selector === ".welcome h1") return welcomeHeading;
            if (selector === ".focus-panel") return elements.focusPanel;
            return null;
        })
    };

    return { documentListeners, documentMock, elements, welcomeHeading };
}

function loadApplicantHomepage(options = {}) {
    const { documentListeners, documentMock, elements, welcomeHeading } = createFakeDocument(options);
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
    const collection = jest.fn((dbArg, collectionName) => ({ collectionName, db: dbArg }));
    const doc = jest.fn((dbArg, collectionName, id) => ({ collectionName, db: dbArg, id }));
    const where = jest.fn((field, operator, value) => ({ field, operator, value }));
    const query = jest.fn((collectionRef, whereRef) => ({ collectionRef, whereRef }));
    const getDoc = options.getDoc || jest.fn(() =>
        Promise.resolve({
            data: () => options.userDocData || {},
            exists: () => Boolean(options.userDocExists)
        })
    );
    const getDocs = options.getDocs || jest.fn(() =>
        Promise.resolve({
            docs: (options.applicationDocs || []).map((application) => ({
                data: () => application
            }))
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
        collection,
        console: consoleMock,
        db,
        doc,
        document: documentMock,
        getDoc,
        getDocs,
        localStorage: localStorageMock,
        onAuthStateChanged,
        query,
        sessionStorage: sessionStorageMock,
        window: windowMock,
        where
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(SCRIPT_PATH, "utf8"))}
globalThis.__testExports = {
    applyApplicantBranding,
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
            collection,
            db,
            doc,
            documentListeners,
            documentMock,
            elements,
            getDoc,
            getDocs,
            localStorageMock,
            onAuthStateChanged,
            query,
            sessionStorageMock,
            where,
            welcomeHeading,
            windowMock
        }
    };
}

describe("Applicant homepage script", () => {
    test("uses the shared applicant app shell instead of the old custom sidebar", () => {
        const html = fs.readFileSync(INDEX_PATH, "utf8");

        expect(html).toContain("../shared/app-shell.css");
        expect(html).toContain("../shared/app-shell.js");
        expect(html).toContain('data-shell-role="applicant"');
        expect(html).toContain('data-shell-active="home"');
        expect(html).not.toContain('id="appSidebar"');
        expect(html).not.toContain('id="hamburgerBtn"');
        expect(html).not.toContain('class="navbar"');
    });

    test("registers the DOMContentLoaded handler and initializes homepage data", async () => {
        const { documentListeners, documentMock, elements, mocks } = loadApplicantHomepage();

        expect(documentMock.addEventListener).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function)
        );

        documentListeners.DOMContentLoaded();
        await flushAsyncWork();

        expect(mocks.welcomeHeading.textContent).toBe("Welcome Applicant");
        expect(elements.totalApplicationsMetric.textContent).toBe("0");
    });

    test("loads the applicant profile name and applies it to the welcome text", async () => {
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
        expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "applications");
        expect(mocks.welcomeHeading.textContent).toBe("Welcome Naledi Mokoena");
    });

    test("renders applicant statistics and profile strength from stored applications and profile data", async () => {
        const { api, mocks } = loadApplicantHomepage({
            applicationDocs: [
                { applicantId: "applicant-123", appliedAt: "2026-05-01T08:00:00.000Z", status: "pending" },
                { applicantId: "applicant-123", appliedAt: "2026-05-04T08:00:00.000Z", status: "shortlisted" },
                { applicantId: "applicant-123", statusUpdatedAt: "2026-05-10T08:00:00.000Z", status: "accepted" },
                { applicantId: "applicant-123", statusUpdatedAt: "2026-05-08T08:00:00.000Z", status: "rejected" }
            ],
            currentUser: {
                displayName: "Auth Name",
                email: "applicant@example.com",
                uid: "applicant-123"
            },
            userDocData: {
                applicantProfile: {
                    about: { intro: "Junior developer" },
                    cv: { fileUrl: "https://example.test/cv.pdf" },
                    education: [{ school: "Wits" }],
                    personalDetails: { email: "applicant@example.com", phone: "0123456789" },
                    profile: { name: "Naledi Mokoena" },
                    skills: { softSkills: ["Communication"], technicalSkills: ["JavaScript"] }
                }
            },
            userDocExists: true
        });

        await api.initializeApplicantHomepage();

        expect(mocks.elements.totalApplicationsMetric.textContent).toBe("4");
        expect(mocks.elements.pendingApplicationsMetric.textContent).toBe("1");
        expect(mocks.elements.shortlistedApplicationsMetric.textContent).toBe("1");
        expect(mocks.elements.acceptedApplicationsMetric.textContent).toBe("1");
        expect(mocks.elements.rejectedApplicationsMetric.textContent).toBe("1");
        expect(mocks.elements.focusPanelHeading.textContent).toBe("100%");
        expect(mocks.elements.focusPanel.style.setProperty).toHaveBeenCalledWith("--profile-strength", "100%");
        expect(mocks.elements.cvStatusPill.textContent).toBe("CV ready to share");
        expect(mocks.elements.latestActivityPill.textContent).toBe("Last update 2026-05-10");
    });

    test("applicant display names never fall back to the user's email address", () => {
        const { api } = loadApplicantHomepage();

        expect(api.getApplicantDisplayName({ displayName: "Stored Name" })).toBe("Stored Name");
        expect(api.getApplicantDisplayName({ fullName: "Full Name" })).toBe("Full Name");
        expect(api.getApplicantDisplayName({}, { displayName: "Auth Name" })).toBe("Auth Name");
        expect(api.getApplicantDisplayName({ email: "applicant@example.com" }, { email: "applicant@example.com" })).toBe("Applicant");
    });

});
