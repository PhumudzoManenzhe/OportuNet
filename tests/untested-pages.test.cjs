const fs = require("fs");
const path = require("path");
const vm = require("vm");

const APPLICANT_APPLICATIONS_PATH = path.resolve(__dirname, "../APPLICANT_APPLICATIONS_PAGE/applications.js");
const APPLICANT_NOTIFICATIONS_PATH = path.resolve(__dirname, "../APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.js");
const APPLICANT_SETTINGS_PATH = path.resolve(__dirname, "../APPLICANT_SETTINGS_PAGE/settings.js");
const ACCOUNT_ACTIONS_PATH = path.resolve(__dirname, "../shared/account-actions.js");
const QUALIFICATIONS_PATH = path.resolve(__dirname, "../Applicant_Editable_Profile/choosing_qualification.js");
const RECRUITER_NOTIFICATIONS_PATH = path.resolve(__dirname, "../RECRUITER_NOTIFICATION_PAGE/recruiter_notifications_page.js");

function stripImports(source) {
    return source.replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];\s*$/gm, "");
}

function stripExports(source) {
    return stripImports(source).replace(/\bexport\s+(?=(async\s+)?function|const|let|var|class)/g, "");
}

function flushAsyncWork(cycles = 8) {
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

    return {
        checked: false,
        classList: createClassList(),
        dataset: {},
        disabled: false,
        hidden: false,
        href: "",
        id: "",
        innerHTML: "",
        listeners,
        textContent: "",
        value: "",
        addEventListener: jest.fn((type, handler) => {
            listeners[type] = handler;
        }),
        appendChild: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        ...initial
    };
}

function createSnapshot(id, data) {
    return {
        data: () => data,
        id
    };
}

function createDocSnapshot(data, exists = true) {
    return {
        data: () => data,
        exists: () => exists
    };
}

function loadApplicantApplicationsPage(options = {}) {
    const elements = {
        acceptedCount: createFakeNode(),
        applicationsList: createFakeNode(),
        applicationsMeta: createFakeNode(),
        pendingCount: createFakeNode(),
        rejectedCount: createFakeNode(),
        wishListedCount: createFakeNode(),
        ...(options.elements || {})
    };
    const filterButtons = (options.filters || ["all", "pending", "accepted"]).map((filter) =>
        createFakeNode({ dataset: { filter } })
    );
    const documentListeners = {};
    const documentMock = {
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null),
        querySelectorAll: jest.fn((selector) => {
            if (selector === "[data-filter]") return filterButtons;
            return [];
        })
    };
    const auth = {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : { uid: "applicant-123" }
    };
    const db = { service: "db" };
    const collection = jest.fn((dbArg, collectionName) => ({ collectionName, db: dbArg }));
    const doc = jest.fn((dbArg, collectionName, id) => ({ collectionName, db: dbArg, id }));
    const where = jest.fn((field, operator, value) => ({ field, operator, value }));
    const query = jest.fn((collectionRef, whereRef) => ({ collectionRef, whereRef }));
    const getDoc = options.getDoc || jest.fn((docRef) => {
        const data = options.opportunityDocs?.[docRef.id];

        return Promise.resolve(createDocSnapshot(data || {}, Boolean(data)));
    });
    const onSnapshot = options.onSnapshot || jest.fn((_queryRef, onNext) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onNext({ docs: options.snapshots || [] }));
        return unsubscribe;
    });
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onUser(auth.currentUser));
        return unsubscribe;
    });
    const consoleMock = { error: jest.fn() };
    const context = vm.createContext({
        auth,
        collection,
        console: consoleMock,
        db,
        doc,
        document: documentMock,
        getDoc,
        onAuthStateChanged,
        onSnapshot,
        query,
        where
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(APPLICANT_APPLICATIONS_PATH, "utf8"))}
globalThis.__testExports = {
    bindFilters,
    buildMetaMessage,
    escapeHtml,
    filterApplications,
    formatIsoDate,
    getStatusPresentation,
    hydrateApplications,
    initializeApplicationsPage,
    mapApplicationSnapshot,
    renderApplications,
    renderEmptyState,
    resolveCurrentUser,
    setMetaMessage,
    updateSummaryCounts,
    get allApplications() { return allApplications; },
    set allApplications(value) { allApplications = value; },
    get currentFilter() { return currentFilter; },
    set currentFilter(value) { currentFilter = value; }
};`;

    new vm.Script(source, { filename: APPLICANT_APPLICATIONS_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            collection,
            consoleMock,
            db,
            doc,
            documentListeners,
            documentMock,
            elements,
            filterButtons,
            getDoc,
            onAuthStateChanged,
            onSnapshot,
            query,
            where
        }
    };
}

function loadApplicantNotificationsPage(options = {}) {
    const elements = {
        notificationList: createFakeNode(),
        notificationsMeta: createFakeNode(),
        ...(options.elements || {})
    };
    const documentListeners = {};
    const documentMock = {
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null)
    };
    const auth = {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : { uid: "applicant-123" }
    };
    const db = { service: "db" };
    const collection = jest.fn((dbArg, collectionName) => ({ collectionName, db: dbArg }));
    const where = jest.fn((field, operator, value) => ({ field, operator, value }));
    const query = jest.fn((collectionRef, whereRef) => ({ collectionRef, whereRef }));
    const onSnapshot = options.onSnapshot || jest.fn((_queryRef, onNext) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onNext({ docs: options.snapshots || [] }));
        return unsubscribe;
    });
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onUser(auth.currentUser));
        return unsubscribe;
    });
    const consoleMock = { error: jest.fn() };
    const context = vm.createContext({
        Date,
        auth,
        collection,
        console: consoleMock,
        db,
        document: documentMock,
        onAuthStateChanged,
        onSnapshot,
        query,
        where
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(APPLICANT_NOTIFICATIONS_PATH, "utf8"))}
globalThis.__testExports = {
    buildMetaMessage,
    buildNotificationFromApplication,
    escapeHtml,
    formatNotificationTime,
    initializeNotificationFeed,
    renderEmptyState,
    renderNotifications,
    resolveCurrentUser,
    setMetaMessage
};`;

    new vm.Script(source, { filename: APPLICANT_NOTIFICATIONS_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            collection,
            consoleMock,
            db,
            documentListeners,
            elements,
            onAuthStateChanged,
            onSnapshot,
            query,
            where
        }
    };
}

function createSettingsElements() {
    const inputs = [
        "applicationUpdates",
        "acceptanceAlerts",
        "closingReminders",
        "prefApprenticeships",
        "prefInternships",
        "prefLearnerships",
        "profileVisible",
        "reducedMotion",
        "rememberFilters",
        "shareContactsAfterShortlist",
        "shareCv",
        "shortlistAlerts"
    ].reduce((accumulator, id) => {
        accumulator[id] = createFakeNode({ id });
        return accumulator;
    }, {});
    const resetSettingsBtn = createFakeNode({ id: "resetSettingsBtn" });
    const saveSettingsBtn = createFakeNode({ id: "saveSettingsBtn" });
    const settingsDeleteAccountBtn = createFakeNode({ id: "settingsDeleteAccountBtn" });
    const formControls = [
        ...Object.values(inputs),
        resetSettingsBtn,
        saveSettingsBtn,
        settingsDeleteAccountBtn
    ];

    const feedback = createFakeNode({ hidden: true });
    const form = createFakeNode({
        id: "settingsForm",
        querySelectorAll: jest.fn(() => formControls)
    });

    return {
        ...inputs,
        accountEmail: createFakeNode(),
        accountSummary: createFakeNode(),
        feedback,
        form,
        openApplicationsBtn: createFakeNode(),
        openNotificationsBtn: createFakeNode(),
        openProfileBtn: createFakeNode(),
        resetSettingsBtn,
        saveSettingsBtn,
        settingsDeleteAccountBtn,
        settingsFeedback: feedback,
        settingsForm: form,
        settingsMeta: createFakeNode()
    };
}

function loadApplicantSettingsPage(options = {}) {
    const elements = {
        ...createSettingsElements(),
        ...(options.elements || {})
    };
    const documentListeners = {};
    const documentMock = {
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null)
    };
    const auth = {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : { displayName: "Auth Name", email: "applicant@example.com", uid: "applicant-123" }
    };
    const db = { service: "db" };
    const doc = jest.fn((dbArg, collectionName, id) => ({ collectionName, db: dbArg, id }));
    const getDoc = options.getDoc || jest.fn(() =>
        Promise.resolve(createDocSnapshot(options.userData || {}, Boolean(options.userData)))
    );
    const setDoc = options.setDoc || jest.fn(() => Promise.resolve());
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onUser(auth.currentUser));
        return unsubscribe;
    });
    const startDeleteAccountFlow = jest.fn();
    const consoleMock = { error: jest.fn() };
    const windowMock = {
        clearTimeout: jest.fn(),
        location: { href: "about:blank" },
        setTimeout: jest.fn(() => "feedback-timer")
    };
    const context = vm.createContext({
        auth,
        console: consoleMock,
        db,
        doc,
        document: documentMock,
        getDoc,
        onAuthStateChanged,
        setDoc,
        startDeleteAccountFlow,
        structuredClone: (value) => JSON.parse(JSON.stringify(value)),
        window: windowMock
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(APPLICANT_SETTINGS_PATH, "utf8"))}
globalThis.__testExports = {
    DEFAULT_SETTINGS,
    bindEvents,
    cloneData,
    collectSettingsFromForm,
    disableForm,
    handleSave,
    initializeSettingsPage,
    isPlainObject,
    mergeInto,
    mergeSettings,
    pickDisplayName,
    renderAccountSummary,
    renderSettings,
    resetFormToDefaults,
    resolveCurrentUser,
    setFeedback,
    setMeta,
    state
};`;

    new vm.Script(source, { filename: APPLICANT_SETTINGS_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            consoleMock,
            db,
            doc,
            documentListeners,
            elements,
            getDoc,
            onAuthStateChanged,
            setDoc,
            startDeleteAccountFlow,
            windowMock
        }
    };
}

function loadRecruiterNotificationsPage(options = {}) {
    const elements = {
        notificationList: createFakeNode(),
        notificationsMeta: createFakeNode(),
        ...(options.elements || {})
    };
    const documentListeners = {};
    const documentMock = {
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null)
    };
    const auth = {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : { uid: "recruiter-123" }
    };
    const db = { service: "db" };
    const collection = jest.fn((dbArg, collectionName) => ({ collectionName, db: dbArg }));
    const doc = jest.fn((dbArg, collectionName, id) => ({ collectionName, db: dbArg, id }));
    const where = jest.fn((field, operator, value) => ({ field, operator, value }));
    const query = jest.fn((collectionRef, whereRef) => ({ collectionRef, whereRef }));
    const getDoc = options.getDoc || jest.fn(() =>
        Promise.resolve(createDocSnapshot(options.userData || {}, Boolean(options.userData)))
    );
    const getDocs = options.getDocs || jest.fn((queryRef) => {
        const collectionName = queryRef.collectionRef.collectionName;
        const docs = collectionName === "opportunities"
            ? options.opportunityDocs || []
            : options.applicationDocs || [];

        return Promise.resolve({ docs });
    });
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onUser(auth.currentUser));
        return unsubscribe;
    });
    const consoleMock = { error: jest.fn() };
    const context = vm.createContext({
        Date,
        auth,
        collection,
        console: consoleMock,
        db,
        doc,
        document: documentMock,
        getDoc,
        getDocs,
        onAuthStateChanged,
        query,
        where
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(RECRUITER_NOTIFICATIONS_PATH, "utf8"))}
globalThis.__testExports = {
    buildMetaMessage,
    buildSystemNotifications,
    escapeHtml,
    formatRelativeTime,
    initializeRecruiterNotifications,
    renderEmptyState,
    renderNotifications,
    resolveCurrentUser,
    setMetaMessage
};`;

    new vm.Script(source, { filename: RECRUITER_NOTIFICATIONS_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            collection,
            consoleMock,
            db,
            doc,
            documentListeners,
            elements,
            getDoc,
            getDocs,
            onAuthStateChanged,
            query,
            where
        }
    };
}

function loadAccountActions(options = {}) {
    const auth = {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : { email: "applicant@example.com", uid: "applicant-123" }
    };
    const db = { service: "db" };
    const doc = jest.fn((dbArg, collectionName, id) => ({ collectionName, db: dbArg, id }));
    const deleteDoc = options.deleteDoc || jest.fn(() => Promise.resolve());
    const deleteUser = options.deleteUser || jest.fn(() => Promise.resolve());
    const getDoc = options.getDoc || jest.fn(() =>
        Promise.resolve(createDocSnapshot(options.previousData || { role: "applicant" }, options.snapshotExists !== false))
    );
    const setDoc = options.setDoc || jest.fn(() => Promise.resolve());
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onUser(auth.currentUser));
        return unsubscribe;
    });
    const alert = options.alert || jest.fn();
    const confirm = options.confirm || jest.fn(() => true);
    const prompt = options.prompt || jest.fn(() => auth.currentUser?.email || "");
    const localStorage = { removeItem: jest.fn() };
    const sessionStorage = { clear: jest.fn() };
    const window = { location: { href: "about:blank" } };
    const consoleMock = { error: jest.fn() };
    const context = vm.createContext({
        alert,
        auth,
        confirm,
        console: consoleMock,
        db,
        deleteDoc,
        deleteUser,
        doc,
        getDoc,
        localStorage,
        onAuthStateChanged,
        prompt,
        sessionStorage,
        setDoc,
        window
    });

    context.globalThis = context;

    const source = `${stripExports(fs.readFileSync(ACCOUNT_ACTIONS_PATH, "utf8"))}
globalThis.__testExports = {
    bindDeleteAccountButton,
    clearLocalSession,
    resolveCurrentUser,
    startDeleteAccountFlow
};`;

    new vm.Script(source, { filename: ACCOUNT_ACTIONS_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            alert,
            confirm,
            consoleMock,
            db,
            deleteDoc,
            deleteUser,
            doc,
            getDoc,
            localStorage,
            onAuthStateChanged,
            prompt,
            sessionStorage,
            setDoc,
            window
        }
    };
}

function createQualificationSelect() {
    const select = createFakeNode({
        options: [],
        selectedIndex: 0,
        appendChild: jest.fn((option) => {
            select.options.push(option);
        })
    });

    let html = "";
    Object.defineProperty(select, "innerHTML", {
        configurable: true,
        get() {
            return html;
        },
        set(value) {
            html = String(value);
            select.options = [];
        }
    });

    return select;
}

function loadQualificationPage(options = {}) {
    const qualificationSelect = options.qualificationSelect || createQualificationSelect();
    const selectedInfo = createFakeNode();
    const optionFactory = jest.fn(() => ({
        dataset: {},
        selected: false,
        textContent: "",
        value: ""
    }));
    const documentMock = {
        createElement: optionFactory,
        getElementById: jest.fn((id) => {
            if (id === "qualificationSelect") return qualificationSelect;
            if (id === "selectedInfo") return selectedInfo;
            return null;
        })
    };
    const auth = {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : { uid: "applicant-123" }
    };
    const db = { service: "db" };
    const collection = jest.fn((dbArg, collectionName) => ({ collectionName, db: dbArg }));
    const doc = jest.fn((dbArg, collectionName, id) => ({ collectionName, db: dbArg, id }));
    const getDoc = options.getDoc || jest.fn(() =>
        Promise.resolve(createDocSnapshot(options.userData || {}, Boolean(options.userData)))
    );
    const getDocs = options.getDocs || jest.fn(() =>
        Promise.resolve({
            forEach(callback) {
                (options.qualifications || []).forEach((qualification, index) => {
                    callback(createSnapshot(`qualification-${index}`, qualification));
                });
            }
        })
    );
    const updateDoc = options.updateDoc || jest.fn(() => Promise.resolve());
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        if (Object.prototype.hasOwnProperty.call(options, "authStateUser")) {
            Promise.resolve().then(() => onUser(options.authStateUser));
        }
        return unsubscribe;
    });
    const alert = jest.fn();
    const consoleMock = { error: jest.fn(), log: jest.fn() };
    const context = vm.createContext({
        alert,
        auth,
        collection,
        console: consoleMock,
        db,
        doc,
        document: documentMock,
        getDoc,
        getDocs,
        onAuthStateChanged,
        updateDoc
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(QUALIFICATIONS_PATH, "utf8"))}
globalThis.__testExports = {
    loadQualifications,
    qualificationSelect,
    selectedInfo
};`;

    new vm.Script(source, { filename: QUALIFICATIONS_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            alert,
            auth,
            collection,
            consoleMock,
            db,
            doc,
            documentMock,
            getDoc,
            getDocs,
            onAuthStateChanged,
            optionFactory,
            qualificationSelect,
            selectedInfo,
            updateDoc
        }
    };
}

describe("APPLICANT_APPLICATIONS_PAGE/applications.js", () => {
    test("maps statuses, updates counts, filters applications, and renders escaped cards", () => {
        const { api, mocks } = loadApplicantApplicationsPage();
        const applications = [
            {
                appliedDate: "2026-05-01",
                companyName: "A & B",
                location: "Cape <Town>",
                opportunityTitle: "Build <Apps>",
                opportunityType: "Internship",
                statusKey: "pending",
                statusLabel: "Pending",
                statusSummary: "Waiting > review"
            },
            {
                appliedDate: "2026-05-02",
                companyName: "Bright",
                location: "Durban",
                opportunityTitle: "Support",
                opportunityType: "Learnership",
                statusKey: "wishlisted",
                statusLabel: "Wish listed",
                statusSummary: "Moved forward"
            },
            {
                appliedDate: "2026-05-03",
                companyName: "Studio",
                location: "Pretoria",
                opportunityTitle: "Analyst",
                opportunityType: "Apprenticeship",
                statusKey: "accepted",
                statusLabel: "Accepted",
                statusSummary: "Accepted"
            },
            {
                appliedDate: "2026-05-04",
                companyName: "Metro",
                location: "Remote",
                opportunityTitle: "Operator",
                opportunityType: "Opportunity",
                statusKey: "rejected",
                statusLabel: "Rejected",
                statusSummary: "Not selected"
            }
        ];

        api.allApplications = applications;
        api.updateSummaryCounts(applications);
        api.renderApplications();

        expect(mocks.elements.pendingCount.textContent).toBe("1");
        expect(mocks.elements.wishListedCount.textContent).toBe("1");
        expect(mocks.elements.acceptedCount.textContent).toBe("1");
        expect(mocks.elements.rejectedCount.textContent).toBe("1");
        expect(mocks.elements.applicationsMeta.textContent).toBe("4 applications shown");
        expect(mocks.elements.applicationsList.innerHTML).toContain("Build &lt;Apps&gt;");
        expect(mocks.elements.applicationsList.innerHTML).toContain("A &amp; B");
        expect(mocks.elements.applicationsList.innerHTML).toContain("Cape &lt;Town&gt;");
        expect(mocks.elements.applicationsList.innerHTML).toContain('data-status="pending"');
        expect(api.filterApplications(applications, "accepted").map((item) => item.opportunityTitle)).toEqual(["Analyst"]);
        expect(api.getStatusPresentation("wish listed")).toMatchObject({ key: "wishlisted", label: "Wish listed" });
        expect(api.getStatusPresentation("declined")).toMatchObject({ key: "rejected", label: "Rejected" });
        expect(api.getStatusPresentation("reviewed")).toMatchObject({ key: "other", label: "Reviewed" });
        expect(api.mapApplicationSnapshot(createSnapshot("app-1", {
            applicantId: "applicant-123",
            appliedAt: "2026-04-20T10:00:00Z",
            status: "accepted"
        }))).toMatchObject({
            appliedDate: "2026-04-20",
            id: "app-1",
            opportunityTitle: "Opportunity",
            statusKey: "accepted"
        });
    });

    test("loads and hydrates the signed-in applicant's applications on DOMContentLoaded", async () => {
        const { api, mocks } = loadApplicantApplicationsPage({
            opportunityDocs: {
                "job-1": {
                    companyName: "Hydrated Careers",
                    location: "Johannesburg",
                    opportunityType: "Internship",
                    stipend: "R5000"
                }
            },
            snapshots: [
                createSnapshot("app-1", {
                    applicantId: "applicant-123",
                    appliedAt: "2026-05-01T08:00:00Z",
                    jobId: "job-1",
                    opportunityTitle: "Junior Developer",
                    status: "pending"
                })
            ]
        });

        mocks.documentListeners.DOMContentLoaded();
        await flushAsyncWork();

        expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "applications");
        expect(mocks.where).toHaveBeenCalledWith("applicantId", "==", "applicant-123");
        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "opportunities", "job-1");
        expect(api.allApplications).toHaveLength(1);
        expect(mocks.elements.applicationsList.innerHTML).toContain("Hydrated Careers");
        expect(mocks.elements.applicationsList.innerHTML).toContain("Johannesburg");
    });

    test("shows login and empty states without throwing", async () => {
        const page = loadApplicantApplicationsPage({ currentUser: null });

        await page.api.initializeApplicationsPage();

        expect(page.mocks.elements.applicationsMeta.textContent).toBe("No signed-in applicant");
        expect(page.mocks.elements.applicationsList.innerHTML).toContain("Please log in to view your applications.");

        page.api.allApplications = [{ statusKey: "pending" }];
        page.api.currentFilter = "accepted";
        page.api.renderApplications();

        expect(page.mocks.elements.applicationsMeta.textContent).toBe("0 applications shown");
        expect(page.mocks.elements.applicationsList.innerHTML).toContain("No applications match this filter right now.");
    });

    test("binds filter buttons to rerender active views", () => {
        const { api, mocks } = loadApplicantApplicationsPage({ filters: ["all", "rejected"] });

        api.allApplications = [{
            appliedDate: "",
            companyName: "Metro",
            location: "",
            opportunityTitle: "Rejected Role",
            opportunityType: "",
            statusKey: "rejected",
            statusLabel: "Rejected",
            statusSummary: "Not selected"
        }];
        api.bindFilters();
        mocks.filterButtons[1].listeners.click();

        expect(api.currentFilter).toBe("rejected");
        expect(mocks.filterButtons[1].classList.contains("active")).toBe(true);
        expect(mocks.elements.applicationsList.innerHTML).toContain("Rejected Role");
    });
});

describe("APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.js", () => {
    test("builds applicant status notifications and renders escaped messages", () => {
        const nowSpy = jest.spyOn(Date, "now").mockReturnValue(new Date("2026-05-16T12:00:00Z").getTime());
        const { api, mocks } = loadApplicantNotificationsPage();
        const notifications = [
            api.buildNotificationFromApplication({
                companyName: "A & B",
                opportunityTitle: "Build <Apps>",
                status: "accepted",
                statusUpdatedAt: "2026-05-16T11:30:00Z"
            }),
            api.buildNotificationFromApplication({
                opportunityTitle: "Support",
                status: "rejected"
            })
        ];

        api.renderNotifications(notifications);

        expect(notifications[0]).toMatchObject({
            title: "Application accepted",
            tone: "positive"
        });
        expect(api.buildNotificationFromApplication({ status: "pending" })).toBeNull();
        expect(api.buildMetaMessage(2)).toBe("2 status updates");
        expect(api.formatNotificationTime("2026-05-16T11:30:00Z")).toBe("30 min ago");
        expect(api.formatNotificationTime("bad-date")).toBe("Recently");
        expect(mocks.elements.notificationList.innerHTML).toContain("Build &lt;Apps&gt;");
        expect(mocks.elements.notificationList.innerHTML).toContain("A &amp; B");
        expect(mocks.elements.notificationList.innerHTML).toContain("notification-card-positive unread");

        nowSpy.mockRestore();
    });

    test("subscribes to signed-in applicant updates and handles empty or signed-out states", async () => {
        const signedIn = loadApplicantNotificationsPage({
            snapshots: [
                createSnapshot("app-1", {
                    companyName: "Bright",
                    opportunityTitle: "Analyst",
                    status: "shortlisted",
                    statusUpdatedAt: "2026-05-15T08:00:00Z"
                }),
                createSnapshot("app-2", {
                    opportunityTitle: "Pending Role",
                    status: "pending"
                })
            ]
        });

        signedIn.mocks.documentListeners.DOMContentLoaded();
        await flushAsyncWork();

        expect(signedIn.mocks.where).toHaveBeenCalledWith("applicantId", "==", "applicant-123");
        expect(signedIn.mocks.elements.notificationsMeta.textContent).toBe("1 status update");
        expect(signedIn.mocks.elements.notificationList.innerHTML).toContain("Wish listed update");

        const signedOut = loadApplicantNotificationsPage({ currentUser: null });
        await signedOut.api.initializeNotificationFeed();

        expect(signedOut.mocks.elements.notificationsMeta.textContent).toBe("No signed-in applicant");
        expect(signedOut.mocks.elements.notificationList.innerHTML).toContain("Please log in to see your application updates.");
    });
});

describe("APPLICANT_SETTINGS_PAGE/settings.js", () => {
    test("loads account details, merges saved settings, and wires page actions", async () => {
        const { api, mocks } = loadApplicantSettingsPage({
            userData: {
                applicantProfile: {
                    profile: { name: "Naledi Mokoena" }
                },
                applicantSettings: {
                    notifications: { applicationUpdates: false },
                    preferences: { preferredTypes: { internships: false }, reducedMotion: true },
                    privacy: { shareContactsAfterShortlist: true }
                }
            }
        });

        mocks.documentListeners.DOMContentLoaded();
        await flushAsyncWork();

        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "users", "applicant-123");
        expect(mocks.elements.accountEmail.textContent).toBe("applicant@example.com");
        expect(mocks.elements.accountSummary.textContent).toContain("Naledi Mokoena can manage");
        expect(mocks.elements.applicationUpdates.checked).toBe(false);
        expect(mocks.elements.shortlistAlerts.checked).toBe(true);
        expect(mocks.elements.prefInternships.checked).toBe(false);
        expect(mocks.elements.reducedMotion.checked).toBe(true);
        expect(mocks.elements.shareContactsAfterShortlist.checked).toBe(true);
        expect(mocks.elements.settingsMeta.textContent).toBe("Your preferences are ready to update");

        mocks.elements.openProfileBtn.listeners.click();
        expect(mocks.windowMock.location.href).toBe("../Applicant_Editable_Profile/profile_index.html");
        mocks.elements.openApplicationsBtn.listeners.click();
        expect(mocks.windowMock.location.href).toBe("../APPLICANT_APPLICATIONS_PAGE/applications.html");
        mocks.elements.openNotificationsBtn.listeners.click();
        expect(mocks.windowMock.location.href).toBe("../APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html");
        mocks.elements.settingsDeleteAccountBtn.listeners.click();
        expect(mocks.startDeleteAccountFlow).toHaveBeenCalledWith({
            loginHref: "../SignUp_LogIn_pages/logIn.html"
        });

        expect(api.pickDisplayName("", " Auth Name ", "email@example.com")).toBe("Auth Name");
        expect(api.pickDisplayName("", "", "")).toBe("Applicant");
    });

    test("collects, saves, resets, and disables settings controls", async () => {
        const { api, mocks } = loadApplicantSettingsPage();
        const event = { preventDefault: jest.fn() };

        api.state.currentUser = { email: "applicant@example.com", uid: "applicant-123" };
        api.renderSettings(api.mergeSettings(api.DEFAULT_SETTINGS, {
            notifications: { acceptanceAlerts: false },
            preferences: { preferredTypes: { apprenticeships: false } },
            unknown: { ignored: true }
        }));

        expect(mocks.elements.acceptanceAlerts.checked).toBe(false);
        expect(mocks.elements.prefApprenticeships.checked).toBe(false);

        mocks.elements.shareCv.checked = false;
        mocks.elements.rememberFilters.checked = false;
        await api.handleSave(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mocks.setDoc).toHaveBeenCalledWith(
            { collectionName: "users", db: mocks.db, id: "applicant-123" },
            expect.objectContaining({
                applicantSettings: expect.objectContaining({
                    privacy: expect.objectContaining({ shareCv: false }),
                    preferences: expect.objectContaining({ rememberFilters: false })
                }),
                email: "applicant@example.com"
            }),
            { merge: true }
        );
        expect(mocks.elements.settingsMeta.textContent).toBe("Settings saved");
        expect(mocks.elements.feedback.textContent).toBe("Your applicant settings were saved.");

        api.resetFormToDefaults();
        expect(mocks.elements.applicationUpdates.checked).toBe(true);
        expect(mocks.elements.feedback.textContent).toBe("Default settings restored. Save to keep them.");

        api.disableForm(true);
        expect(mocks.elements.applicationUpdates.disabled).toBe(true);
        expect(mocks.elements.saveSettingsBtn.disabled).toBe(true);
        expect(mocks.elements.settingsDeleteAccountBtn.disabled).toBe(true);
    });

    test("renders the signed-out state and blocks saving without a current user", async () => {
        const { api, mocks } = loadApplicantSettingsPage({ currentUser: null });
        const event = { preventDefault: jest.fn() };

        await api.initializeSettingsPage();
        await api.handleSave(event);

        expect(mocks.elements.settingsMeta.textContent).toBe("No signed-in applicant");
        expect(mocks.elements.accountSummary.textContent).toBe("Log in to manage your notification, privacy, and opportunity preferences.");
        expect(mocks.elements.feedback.textContent).toBe("Please log in before saving settings.");
        expect(mocks.setDoc).not.toHaveBeenCalled();
    });

    test("shows save errors without changing page files", async () => {
        const saveError = new Error("offline");
        const { api, mocks } = loadApplicantSettingsPage({
            setDoc: jest.fn(() => Promise.reject(saveError))
        });

        api.state.currentUser = { email: "applicant@example.com", uid: "applicant-123" };
        await api.handleSave({ preventDefault: jest.fn() });

        expect(mocks.consoleMock.error).toHaveBeenCalledWith("Unable to save applicant settings.", saveError);
        expect(mocks.elements.feedback.textContent).toBe("offline");
    });
});

describe("RECRUITER_NOTIFICATION_PAGE/recruiter_notifications_page.js", () => {
    test("builds recruiter system notifications for reviews, closing posts, and placements", () => {
        const nowSpy = jest.spyOn(Date, "now").mockReturnValue(new Date("2026-05-16T00:00:00Z").getTime());
        const { api, mocks } = loadRecruiterNotificationsPage();
        const notifications = api.buildSystemNotifications(
            [
                { closingDate: "2026-05-18T00:00:00Z", id: "job-1", status: "active", title: "QA Role" },
                { closingDate: "2026-06-01T00:00:00Z", id: "job-2", status: "active", title: "Later Role" },
                { closingDate: "bad-date", id: "job-3", status: "active", title: "Broken Role" }
            ],
            [
                { appliedAt: "2026-05-10T08:00:00Z", status: "pending" },
                { status: "accepted", statusUpdatedAt: "2026-05-11T08:00:00Z" }
            ]
        );

        api.renderNotifications([
            ...notifications,
            { message: "A & B < C", title: "Custom <Alert>", tone: "positive", unread: true }
        ]);

        expect(notifications.map((notification) => notification.id)).toEqual([
            "system-pending-review",
            "system-closing-job-1",
            "system-accepted-applications"
        ]);
        expect(notifications[1].message).toBe("\"QA Role\" closes in 2 days.");
        expect(api.buildMetaMessage(3)).toBe("3 recruiter updates");
        expect(api.formatRelativeTime("2026-05-15T23:30:00Z")).toBe("30 min ago");
        expect(api.formatRelativeTime("bad-date")).toBe("Recently");
        expect(mocks.elements.notificationList.innerHTML).toContain("Custom &lt;Alert&gt;");
        expect(mocks.elements.notificationList.innerHTML).toContain("A &amp; B &lt; C");
        expect(mocks.elements.notificationList.innerHTML).toContain("unread");

        nowSpy.mockRestore();
    });

    test("loads saved and generated recruiter notifications", async () => {
        const nowSpy = jest.spyOn(Date, "now").mockReturnValue(new Date("2026-05-16T00:00:00Z").getTime());
        const { api, mocks } = loadRecruiterNotificationsPage({
            applicationDocs: [
                createSnapshot("application-1", {
                    appliedAt: "2026-05-12T08:00:00Z",
                    status: "pending"
                })
            ],
            opportunityDocs: [
                createSnapshot("job-1", {
                    closingDate: "2026-05-17T00:00:00Z",
                    status: "active",
                    title: "Closing Role"
                })
            ],
            userData: {
                recruiterHomepage: {
                    notifications: [
                        {
                            createdAt: "2026-05-15T09:00:00Z",
                            message: "Saved dashboard message",
                            title: "Saved update"
                        }
                    ]
                }
            }
        });

        await api.initializeRecruiterNotifications();

        expect(mocks.getDoc).toHaveBeenCalledWith({ collectionName: "users", db: mocks.db, id: "recruiter-123" });
        expect(mocks.where).toHaveBeenCalledWith("ownerUid", "==", "recruiter-123");
        expect(mocks.where).toHaveBeenCalledWith("recruiterId", "==", "recruiter-123");
        expect(mocks.elements.notificationsMeta.textContent).toBe("3 recruiter updates");
        expect(mocks.elements.notificationList.innerHTML).toContain("Saved update");
        expect(mocks.elements.notificationList.innerHTML).toContain("Applications ready to review");
        expect(mocks.elements.notificationList.innerHTML).toContain("Post closing soon");

        nowSpy.mockRestore();
    });

    test("renders signed-out and empty states", async () => {
        const signedOut = loadRecruiterNotificationsPage({ currentUser: null });
        const empty = loadRecruiterNotificationsPage();

        await signedOut.api.initializeRecruiterNotifications();
        await empty.api.initializeRecruiterNotifications();

        expect(signedOut.mocks.elements.notificationsMeta.textContent).toBe("No signed-in recruiter");
        expect(signedOut.mocks.elements.notificationList.innerHTML).toContain("Please log in to review recruiter updates.");
        expect(empty.mocks.elements.notificationsMeta.textContent).toBe("No recruiter updates");
        expect(empty.mocks.elements.notificationList.innerHTML).toContain("No recruiter updates yet.");
    });
});

describe("shared/account-actions.js", () => {
    test("alerts when account deletion starts without a signed-in user", async () => {
        const { api, mocks } = loadAccountActions({ currentUser: null });

        await api.startDeleteAccountFlow();

        expect(mocks.alert).toHaveBeenCalledWith("Please log in before deleting your account.");
        expect(mocks.deleteUser).not.toHaveBeenCalled();
    });

    test("stops deletion when email verification or confirmation fails", async () => {
        const mismatch = loadAccountActions({
            prompt: jest.fn(() => "wrong@example.com")
        });
        const cancelled = loadAccountActions({
            confirm: jest.fn(() => false)
        });

        await mismatch.api.startDeleteAccountFlow();
        await cancelled.api.startDeleteAccountFlow();

        expect(mismatch.mocks.alert).toHaveBeenCalledWith("The email address does not match your account.");
        expect(mismatch.mocks.deleteUser).not.toHaveBeenCalled();
        expect(cancelled.mocks.confirm).toHaveBeenCalledWith("Delete the account for applicant@example.com? This cannot be undone.");
        expect(cancelled.mocks.deleteUser).not.toHaveBeenCalled();
    });

    test("deletes the Firestore profile, clears local session, and redirects on success", async () => {
        const { api, mocks } = loadAccountActions({
            prompt: jest.fn(() => " APPLICANT@example.com ")
        });

        await api.startDeleteAccountFlow({ loginHref: "../login.html" });

        expect(mocks.deleteDoc).toHaveBeenCalledWith({ collectionName: "users", db: mocks.db, id: "applicant-123" });
        expect(mocks.deleteUser).toHaveBeenCalledWith({ email: "applicant@example.com", uid: "applicant-123" });
        expect(mocks.localStorage.removeItem).toHaveBeenCalledWith("recruiter_jobs");
        expect(mocks.localStorage.removeItem).toHaveBeenCalledWith("recruiter_applications");
        expect(mocks.sessionStorage.clear).toHaveBeenCalledTimes(1);
        expect(mocks.window.location.href).toBe("../login.html");
    });

    test("restores profile data and redirects when Firebase requires recent login", async () => {
        const { api, mocks } = loadAccountActions({
            deleteUser: jest.fn(() => Promise.reject({ code: "auth/requires-recent-login" })),
            previousData: { role: "applicant", email: "applicant@example.com" }
        });

        await api.startDeleteAccountFlow({ loginHref: "../logIn.html" });

        expect(mocks.setDoc).toHaveBeenCalledWith(
            { collectionName: "users", db: mocks.db, id: "applicant-123" },
            { role: "applicant", email: "applicant@example.com" },
            { merge: false }
        );
        expect(mocks.alert).toHaveBeenCalledWith("For security, please log in again before deleting your account.");
        expect(mocks.window.location.href).toBe("../logIn.html");
    });

    test("binds delete buttons and clears local session directly", () => {
        const { api, mocks } = loadAccountActions();
        const button = createFakeNode();

        api.bindDeleteAccountButton(button, { loginHref: "../login.html" });
        api.clearLocalSession();

        expect(button.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
        expect(mocks.localStorage.removeItem).toHaveBeenCalledWith("recruiter_jobs");
        expect(mocks.localStorage.removeItem).toHaveBeenCalledWith("recruiter_applications");
        expect(mocks.sessionStorage.clear).toHaveBeenCalledTimes(1);
    });
});

describe("Applicant_Editable_Profile/choosing_qualification.js", () => {
    test("loads qualifications, skips broken records, and selects the saved qualification", async () => {
        const { api, mocks } = loadQualificationPage({
            qualifications: [
                { level: "5", sub_framework: "HEQSF", title: "Diploma in IT" },
                { level: "4", sub_framework: "GENFETQSF" },
                { level: "6", sub_framework: "OQSF", title: "Advanced Certificate" }
            ]
        });

        await api.loadQualifications("Diploma in IT");

        expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "qualifications");
        expect(mocks.qualificationSelect.options).toHaveLength(2);
        expect(mocks.qualificationSelect.options[0]).toMatchObject({
            selected: true,
            textContent: "Diploma in IT",
            value: "Diploma in IT"
        });
        expect(mocks.qualificationSelect.options[0].dataset).toEqual({
            framework: "HEQSF",
            level: "5"
        });
    });

    test("saves selected qualification details for the current user", async () => {
        const { api, mocks } = loadQualificationPage({
            qualifications: [
                { level: "5", sub_framework: "HEQSF", title: "Diploma in IT" }
            ]
        });

        await api.loadQualifications();
        mocks.qualificationSelect.selectedIndex = 0;
        await mocks.qualificationSelect.listeners.change();

        expect(mocks.updateDoc).toHaveBeenCalledWith(
            { collectionName: "users", db: mocks.db, id: "applicant-123" },
            {
                nqf_level: 5,
                qualification: "Diploma in IT",
                sub_framework: "HEQSF"
            }
        );
        expect(mocks.selectedInfo.innerHTML).toContain("NQF Level:");
        expect(mocks.selectedInfo.innerHTML).toContain("HEQSF");
        expect(mocks.consoleMock.log).toHaveBeenCalledWith("Qualification saved successfully");
    });

    test("does not save when signed out or when the blank option is selected", async () => {
        const signedOut = loadQualificationPage({ currentUser: null });
        const blank = loadQualificationPage();

        signedOut.mocks.qualificationSelect.options = [{ value: "Diploma in IT", dataset: { level: "5", framework: "HEQSF" } }];
        signedOut.mocks.qualificationSelect.selectedIndex = 0;
        await signedOut.mocks.qualificationSelect.listeners.change();

        blank.mocks.qualificationSelect.options = [{ value: "", dataset: {} }];
        blank.mocks.qualificationSelect.selectedIndex = 0;
        await blank.mocks.qualificationSelect.listeners.change();

        expect(signedOut.mocks.alert).toHaveBeenCalledWith("No logged-in user");
        expect(signedOut.mocks.updateDoc).not.toHaveBeenCalled();
        expect(blank.mocks.updateDoc).not.toHaveBeenCalled();
    });

    test("loads saved user qualification during auth startup and handles load failures", async () => {
        const loaded = loadQualificationPage({
            authStateUser: { uid: "applicant-123" },
            qualifications: [
                { level: "5", sub_framework: "HEQSF", title: "Diploma in IT" }
            ],
            userData: {
                nqf_level: "5",
                qualification: "Diploma in IT",
                sub_framework: "HEQSF"
            }
        });
        const failure = loadQualificationPage({
            getDocs: jest.fn(() => Promise.reject(new Error("offline")))
        });

        await flushAsyncWork();
        await failure.api.loadQualifications();

        expect(loaded.mocks.doc).toHaveBeenCalledWith(loaded.mocks.db, "users", "applicant-123");
        expect(loaded.mocks.selectedInfo.innerHTML).toContain("HEQSF");
        expect(failure.mocks.qualificationSelect.innerHTML).toBe('<option value="">Failed to load qualifications</option>');
        expect(failure.mocks.consoleMock.error).toHaveBeenCalledWith("Error loading qualifications:", expect.any(Error));
    });
});
