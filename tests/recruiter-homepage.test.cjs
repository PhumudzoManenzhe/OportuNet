const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SCRIPT_PATH = path.resolve(__dirname, "../Recruiter_homepage/script.js");

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
        checked: false,
        children: [],
        classList: createClassList(),
        dataset: {},
        disabled: false,
        hidden: false,
        href: "",
        innerHTML: "",
        listeners,
        open: false,
        style: {},
        textContent: "",
        value: "",
        addEventListener: jest.fn((type, handler) => {
            listeners[type] = handler;
        }),
        append: jest.fn((child) => {
            node.children.push(child);
        }),
        click: jest.fn(),
        close: jest.fn(() => {
            node.open = false;
        }),
        getAttribute: jest.fn((name) => attributes[name]),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        removeAttribute: jest.fn((name) => {
            delete attributes[name];
            delete node[name];
        }),
        reset: jest.fn(),
        setAttribute: jest.fn((name, value) => {
            attributes[name] = String(value);
            node[name] = value;
        }),
        showModal: jest.fn(() => {
            node.open = true;
        }),
        ...initial
    };

    delete node.attributes;
    return node;
}

function createSidebarLink(target) {
    const link = createFakeNode();
    link.getAttribute = jest.fn((name) => {
        if (name === "href") {
            return target;
        }

        return undefined;
    });
    return link;
}

function createSnapshot(id, data) {
    return {
        data: () => data,
        id
    };
}

function createDocsSnapshot(entries) {
    return {
        docs: entries
    };
}

function loadRecruiterHomepage(options = {}) {
    const elements = {
        appSidebar: createFakeNode({ attributes: { "aria-hidden": "true" } }),
        applicationsBtn: createFakeNode(),
        applicationsList: createFakeNode(),
        applicationsSection: createFakeNode({ style: { display: "none" } }),
        bulkDeleteBar: createFakeNode({ style: { display: "none" } }),
        bulkDeleteBtn: createFakeNode(),
        cancelBulkBtn: createFakeNode(),
        cancelModalBtn: createFakeNode(),
        charCounter: createFakeNode(),
        closeModalBtn: createFakeNode(),
        confirmCancelBtn: createFakeNode(),
        confirmMessage: createFakeNode(),
        confirmModal: createFakeNode({ style: { display: "none" } }),
        confirmOkBtn: createFakeNode(),
        filterAll: createFakeNode(),
        filterPending: createFakeNode(),
        filterReviewed: createFakeNode(),
        hamburgerBtn: createFakeNode(),
        jobClosingDate: createFakeNode(),
        jobDescription: createFakeNode(),
        jobDuration: createFakeNode(),
        jobLocation: createFakeNode(),
        jobRequirements: createFakeNode(),
        jobStatus: createFakeNode({ value: "active" }),
        jobStipend: createFakeNode(),
        jobTitleField: createFakeNode(),
        jobTitleType: createFakeNode(),
        markAllReadBtn: createFakeNode(),
        modalTitle: createFakeNode(),
        nextPageBtn: createFakeNode(),
        notificationsList: createFakeNode(),
        notificationsSection: createFakeNode({ style: { display: "none" } }),
        opportunitiesBtn: createFakeNode(),
        opportunitiesList: createFakeNode(),
        opportunitiesSection: createFakeNode({ style: { display: "block" } }),
        pageInfo: createFakeNode(),
        postJobBtn: createFakeNode(),
        postJobForm: createFakeNode(),
        postJobModal: createFakeNode({ style: { display: "none" } }),
        prevPageBtn: createFakeNode(),
        searchInput: createFakeNode(),
        selectedCount: createFakeNode(),
        settingsNavBtn: createFakeNode(),
        settingsOnlyBtn: createFakeNode(),
        sidebarBackdrop: createFakeNode({ hidden: true }),
        sidebarCloseBtn: createFakeNode(),
        sidebarLogoutBtn: createFakeNode(),
        submitJobBtn: createFakeNode(),
        topNotificationBtn: createFakeNode()
    };
    const welcomeHeading = createFakeNode();
    const sidebarName = createFakeNode();
    const filterButtons = [elements.filterAll, elements.filterPending, elements.filterReviewed];
    const sidebarLinks = [
        createSidebarLink("#opportunitiesSection"),
        createSidebarLink("#applicationsSection")
    ];
    const documentListeners = {};
    const documentMock = {
        body: createFakeNode(),
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        createElement: jest.fn(() => createFakeNode()),
        getElementById: jest.fn((id) => elements[id] || null),
        querySelector: jest.fn((selector) => {
            if (selector === ".welcome h1") {
                return welcomeHeading;
            }

            if (selector === ".sidebar-brand .user-name") {
                return sidebarName;
            }

            return null;
        }),
        querySelectorAll: jest.fn((selector) => {
            if (selector === ".filter-btn") {
                return filterButtons;
            }

            if (selector === ".sidebar-link[href^='#']") {
                return sidebarLinks;
            }

            if (selector === ".card-checkbox") {
                return [];
            }

            return [];
        })
    };
    const windowMock = {
        confirm: jest.fn(() => true),
        history: {
            back: jest.fn(),
            length: 1
        },
        location: {
            hash: options.hash || "",
            href: "about:blank"
        }
    };
    const localStorageMock = {
        removeItem: jest.fn()
    };
    const sessionStorageMock = {
        clear: jest.fn()
    };
    const alert = jest.fn();
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
    const query = jest.fn((collectionRef, ...clauses) => ({ clauses, collectionRef }));
    const where = jest.fn((field, operator, value) => ({ field, operator, value }));
    const doc = options.doc || jest.fn((...args) => {
        if (args.length === 1) {
            return { id: options.generatedOpportunityId || "generated-opportunity-id" };
        }

        return {
            collectionName: args[1],
            db: args[0],
            id: args[2]
        };
    });
    const getDoc = options.getDoc || jest.fn(() =>
        Promise.resolve({
            data: () => options.userDocData || {},
            exists: () => Boolean(options.userDocExists)
        })
    );
    const getDocs = options.getDocs || jest.fn(async (queryRef) => {
        const collectionName = queryRef.collectionRef.collectionName;
        if (collectionName === "opportunities") {
            return createDocsSnapshot(options.opportunityDocs || []);
        }

        if (collectionName === "applications") {
            return createDocsSnapshot(options.applicationDocs || []);
        }

        return createDocsSnapshot([]);
    });
    const setDoc = options.setDoc || jest.fn(() => Promise.resolve());
    const updateDoc = options.updateDoc || jest.fn(() => Promise.resolve());
    const deleteDoc = options.deleteDoc || jest.fn(() => Promise.resolve());
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onUser(options.authStateUser ?? null));
        return unsubscribe;
    });
    const context = vm.createContext({
        URL: {
            createObjectURL: jest.fn(() => "blob:jobs"),
            revokeObjectURL: jest.fn()
        },
        alert,
        auth,
        collection,
        console: consoleMock,
        db,
        deleteDoc,
        doc,
        document: documentMock,
        getDoc,
        getDocs,
        localStorage: localStorageMock,
        onAuthStateChanged,
        query,
        sessionStorage: sessionStorageMock,
        setDoc,
        updateDoc,
        where,
        window: windowMock
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(SCRIPT_PATH, "utf8"))}
globalThis.__testExports = {
    applyRecruiterBranding,
    escapeAttribute,
    escapeHtml,
    filterJobsBySearch,
    formatIsoDate,
    formatJobTitle,
    getApplicantCount,
    getPendingApplicantCount,
    getPaginatedJobs,
    getRecruiterCompanyName,
    getRecruiterDisplayName,
    getTotalPages,
    inferOpportunityType,
    initializeRecruiterHomepage,
    isPermissionError,
    loadFromLocalStorage,
    mapApplicationSnapshot,
    mapOpportunitySnapshot,
    nextPage,
    normalizeOpportunityType,
    openPostJobModal,
    closePostJobModal,
    postJob,
    prevPage,
    renderApplications,
    renderNotifications,
    renderOpportunities,
    resolveCurrentUser,
    reviewApplicants,
    saveOpportunity,
    saveToLocalStorage,
    searchOpportunities,
    setSortByApplicants,
    setSortByDate,
    setupCharCounter,
    sortJobs,
    switchTab,
    updateApplicationsTabBadge,
    validateJobForm,
    editJob,
    getJobs: () => jobs,
    setJobs: (value) => { jobs = value; },
    getApplications: () => applications,
    setApplications: (value) => { applications = value; },
    getNotifications: () => notifications,
    setNotifications: (value) => { notifications = value; },
    getCurrentRecruiter: () => currentRecruiter,
    setCurrentRecruiter: (value) => { currentRecruiter = value; },
    getCurrentFilter: () => currentFilter,
    setCurrentFilter: (value) => { currentFilter = value; },
    getSearchTerm: () => searchTerm,
    setSearchTerm: (value) => { searchTerm = value; },
    getCurrentSort: () => currentSort,
    setCurrentSort: (value) => { currentSort = value; },
    getCurrentPage: () => currentPage,
    setCurrentPage: (value) => { currentPage = value; },
    getEditingJobId: () => editingJobId,
    setEditingJobId: (value) => { editingJobId = value; },
    setSelectedJobs: (value) => { selectedJobs = new Set(value); },
    getSelectedJobs: () => Array.from(selectedJobs)
};`;

    new vm.Script(source, { filename: SCRIPT_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            alert,
            applicationDocs: options.applicationDocs || [],
            collection,
            consoleMock,
            db,
            deleteDoc,
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
            setDoc,
            sidebarLinks,
            updateDoc,
            welcomeHeading,
            where,
            windowMock,
            sidebarName
        }
    };
}

describe("Recruiter homepage helpers", () => {
    test("registers the DOMContentLoaded handler and exposes the helper API", () => {
        const { api, mocks } = loadRecruiterHomepage();

        expect(api).toEqual(
            expect.objectContaining({
                applyRecruiterBranding: expect.any(Function),
                escapeAttribute: expect.any(Function),
                escapeHtml: expect.any(Function),
                filterJobsBySearch: expect.any(Function),
                getRecruiterDisplayName: expect.any(Function),
                initializeRecruiterHomepage: expect.any(Function),
                loadFromLocalStorage: expect.any(Function),
                mapApplicationSnapshot: expect.any(Function),
                mapOpportunitySnapshot: expect.any(Function),
                renderApplications: expect.any(Function),
                renderNotifications: expect.any(Function),
                renderOpportunities: expect.any(Function),
                saveToLocalStorage: expect.any(Function),
                validateJobForm: expect.any(Function)
            })
        );
        expect(mocks.documentMock.addEventListener).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function)
        );
    });

    test("normalizes opportunity data and supports the recruiter helper utilities", () => {
        const { api } = loadRecruiterHomepage();

        expect(api.normalizeOpportunityType(" internship ")).toBe("Internship");
        expect(api.normalizeOpportunityType("LEARNERSHIP")).toBe("Learnership");
        expect(api.inferOpportunityType({ title: "Software Development Apprenticeship" })).toBe("Apprenticeship");
        expect(api.formatIsoDate("2026-04-20T12:00:00Z")).toBe("2026-04-20");
        expect(api.getRecruiterCompanyName({ recruiterProfile: { companyName: "Acme Labs" } }, { email: "owner@example.com" })).toBe("Acme Labs");
        expect(api.getRecruiterDisplayName({ recruiterProfile: { contactName: "Mpho Dlamini", companyName: "Acme Labs" } }, { email: "owner@example.com" })).toBe("Mpho Dlamini");
        expect(api.getRecruiterCompanyName({}, { email: "owner@example.com" })).toBe("Recruiter");
        expect(api.getRecruiterDisplayName({}, { email: "owner@example.com" })).toBe("Recruiter");
        expect(api.getRecruiterCompanyName({ companyName: "owner@example.com", displayName: "Mpho Dlamini" }, { email: "owner@example.com" })).toBe("Mpho Dlamini");
        expect(api.escapeHtml("A&B<C>")).toBe("A&amp;B&lt;C&gt;");
        expect(api.escapeAttribute(`A&B"'<>`)).toBe("A&amp;B&quot;&#39;&lt;&gt;");
        expect(api.formatJobTitle("Software Development", "Internship")).toBe("Software Development Internship");
        expect(api.getPaginatedJobs([1, 2, 3, 4, 5, 6], 2)).toEqual([6]);
        expect(api.getTotalPages([1, 2, 3, 4, 5, 6])).toBe(2);
        expect(api.filterJobsBySearch([
            { location: "Cape Town", title: "Frontend Internship" },
            { location: "Durban", title: "Analyst Learnership" }
        ], "cape")).toEqual([
            { location: "Cape Town", title: "Frontend Internship" }
        ]);
        expect(api.isPermissionError({ code: "permission-denied" })).toBe(true);
        expect(api.isPermissionError({ message: "Insufficient permissions for this request" })).toBe(true);
    });

    test("maps opportunity and application snapshots into recruiter dashboard records", () => {
        const { api } = loadRecruiterHomepage();

        expect(
            api.mapOpportunitySnapshot(createSnapshot("job-1", {
                closingDate: "2026-05-01",
                companyName: "Acme Labs",
                description: "Grow quickly",
                duration: "12 months",
                location: "Johannesburg",
                ownerUid: "recruiter-1",
                postedAt: "2026-04-01T12:00:00Z",
                requirements: ["Matric"],
                status: "closed",
                stipend: "R8000",
                title: "Software Development Internship"
            }))
        ).toEqual(
            expect.objectContaining({
                companyName: "Acme Labs",
                id: "job-1",
                opportunityType: "Internship",
                postedDate: "2026-04-01",
                status: "closed"
            })
        );

        expect(
            api.mapApplicationSnapshot(createSnapshot("application-1", {
                applicantId: "applicant-1",
                applicantName: "Naledi Mokoena",
                appliedAt: "2026-04-05T08:00:00Z",
                jobId: "job-1",
                qualifications: "Diploma in IT",
                recruiterId: "recruiter-1",
                status: "shortlisted"
            }))
        ).toEqual(
            expect.objectContaining({
                applicantName: "Naledi Mokoena",
                appliedDate: "2026-04-05",
                id: "application-1",
                status: "shortlisted"
            })
        );
    });

    test("loadFromLocalStorage resets the recruiter dashboard state when there is no logged-in user", async () => {
        const { api, mocks } = loadRecruiterHomepage({ authStateUser: null });

        api.setJobs([{ id: "job-1" }]);
        api.setApplications([{ id: "application-1" }]);
        api.setNotifications([{ id: 1 }]);

        await api.loadFromLocalStorage();

        expect(mocks.getDoc).not.toHaveBeenCalled();
        expect(api.getJobs()).toEqual([]);
        expect(api.getApplications()).toEqual([]);
        expect(api.getNotifications()).toEqual([]);
        expect(api.getCurrentRecruiter()).toEqual({
            companyName: "Recruiter",
            displayName: "Recruiter",
            email: "",
            uid: ""
        });
    });

    test("loadFromLocalStorage loads recruiter jobs, applications, and notifications from Firestore", async () => {
        const { api, mocks } = loadRecruiterHomepage({
            currentUser: {
                email: "recruiter@example.com",
                uid: "recruiter-123"
            },
            applicationDocs: [
                createSnapshot("application-1", {
                    applicantName: "Naledi Mokoena",
                    appliedAt: "2026-04-05T08:00:00Z",
                    jobId: "job-1",
                    qualifications: "Diploma in IT",
                    recruiterId: "recruiter-123",
                    status: "pending"
                })
            ],
            opportunityDocs: [
                createSnapshot("job-1", {
                    closingDate: "2026-05-01",
                    companyName: "Acme Labs",
                    duration: "12 months",
                    location: "Johannesburg",
                    ownerUid: "recruiter-123",
                    postedAt: "2026-04-01T12:00:00Z",
                    requirements: ["Matric"],
                    status: "active",
                    stipend: "R8000",
                    title: "Software Development Internship"
                })
            ],
            userDocData: {
                recruiterHomepage: {
                    notifications: [{ id: 99, message: "Reminder", read: false, time: "Now", title: "Check applicants" }]
                },
                recruiterProfile: {
                    contactName: "Mpho Dlamini",
                    companyName: "Acme Labs"
                }
            },
            userDocExists: true
        });

        await api.loadFromLocalStorage();

        expect(mocks.where).toHaveBeenCalledWith("ownerUid", "==", "recruiter-123");
        expect(mocks.where).toHaveBeenCalledWith("recruiterId", "==", "recruiter-123");
        expect(api.getJobs()[0]).toEqual(
            expect.objectContaining({
                id: "job-1",
                opportunityType: "Internship",
                postedDate: "2026-04-01"
            })
        );
        expect(api.getApplications()[0]).toEqual(
            expect.objectContaining({
                applicantName: "Naledi Mokoena",
                status: "pending"
            })
        );
        expect(api.getNotifications()).toEqual([
            { id: 99, message: "Reminder", read: false, time: "Now", title: "Check applicants" }
        ]);
        expect(api.getCurrentRecruiter()).toEqual({
            companyName: "Acme Labs",
            displayName: "Mpho Dlamini",
            email: "recruiter@example.com",
            uid: "recruiter-123"
        });
    });

    test("saveToLocalStorage persists recruiter notifications and requires login", async () => {
        const loggedOutPage = loadRecruiterHomepage({ authStateUser: null });
        const loggedInPage = loadRecruiterHomepage({
            currentUser: {
                email: "recruiter@example.com",
                uid: "recruiter-123"
            }
        });

        await expect(loggedOutPage.api.saveToLocalStorage()).rejects.toThrow(
            "Please log in before managing recruiter opportunities."
        );

        loggedInPage.api.setNotifications([{ id: 1, message: "Reminder", read: false, time: "Now", title: "Check applicants" }]);
        await loggedInPage.api.saveToLocalStorage();

        expect(loggedInPage.mocks.setDoc).toHaveBeenCalledWith(
            {
                collectionName: "users",
                db: loggedInPage.mocks.db,
                id: "recruiter-123"
            },
            {
                email: "recruiter@example.com",
                recruiterHomepage: {
                    notifications: [{ id: 1, message: "Reminder", read: false, time: "Now", title: "Check applicants" }]
                }
            },
            { merge: true }
        );
    });

    test("validateJobForm reports missing recruiter opportunity fields and accepts valid input", () => {
        const { api, mocks } = loadRecruiterHomepage();

        expect(api.validateJobForm()).toBe(false);
        expect(mocks.alert).toHaveBeenCalledWith("Please enter a job title field");

        mocks.alert.mockClear();
        mocks.elements.jobTitleField.value = "Software Development";
        mocks.elements.jobTitleType.value = "Internship";
        mocks.elements.jobLocation.value = "Johannesburg";
        mocks.elements.jobStipend.value = "R8000";
        mocks.elements.jobDuration.value = "12 months";
        mocks.elements.jobClosingDate.value = "2026-05-01";
        mocks.elements.jobRequirements.value = "Matric\nCV";

        expect(api.validateJobForm()).toBe(true);
        expect(mocks.alert).not.toHaveBeenCalled();
    });
});

describe("Recruiter homepage DOM behavior", () => {
    test("renders recruiter opportunities with pagination, badge counts, and empty states", () => {
        const { api, mocks } = loadRecruiterHomepage();

        api.setJobs([]);
        api.renderOpportunities();
        expect(mocks.elements.opportunitiesList.innerHTML).toContain("You haven't posted any opportunities yet.");

        api.setJobs([
            {
                closingDate: "2026-05-01",
                description: "Role one",
                duration: "12 months",
                id: "job-1",
                location: "Cape Town",
                postedDate: "2026-04-01",
                status: "active",
                stipend: "R8000",
                title: "Frontend Internship"
            },
            {
                closingDate: "2026-05-02",
                description: "Role two",
                duration: "6 months",
                id: "job-2",
                location: "Johannesburg",
                postedDate: "2026-04-02",
                status: "closed",
                stipend: "R7000",
                title: "Analyst Learnership"
            }
        ]);
        api.setApplications([
            { id: "application-1", jobId: "job-1", status: "pending" },
            { id: "application-2", jobId: "job-1", status: "shortlisted" }
        ]);
        api.setSearchTerm("cape");
        api.renderOpportunities();

        expect(mocks.elements.opportunitiesList.innerHTML).toContain("Frontend Internship");
        expect(mocks.elements.opportunitiesList.innerHTML).not.toContain("Analyst Learnership");
        expect(mocks.elements.pageInfo.textContent).toBe("Page 1 of 1");
        expect(mocks.elements.prevPageBtn.disabled).toBe(true);
        expect(mocks.elements.nextPageBtn.disabled).toBe(true);
        expect(mocks.elements.applicationsBtn.innerHTML).toContain("Applications");
        expect(mocks.elements.applicationsBtn.innerHTML).toContain(">1<");

        api.setSearchTerm("durban");
        api.renderOpportunities();
        expect(mocks.elements.opportunitiesList.innerHTML).toContain('No opportunities match "durban"');
    });

    test("renders recruiter applications and notifications and can switch tabs or review applicants", () => {
        const { api, mocks } = loadRecruiterHomepage();

        api.setJobs([
            { id: "job-1", title: "Frontend Internship" }
        ]);
        api.setApplications([
            {
                applicantName: "Naledi Mokoena",
                appliedDate: "2026-04-05",
                id: "application-1",
                jobId: "job-1",
                opportunityTitle: "Frontend Internship",
                qualifications: "Diploma in IT",
                status: "pending"
            },
            {
                applicantName: "Aphiwe Dlamini",
                appliedDate: "2026-04-06",
                id: "application-2",
                jobId: "job-1",
                opportunityTitle: "Frontend Internship",
                qualifications: "BSc Computer Science",
                status: "shortlisted"
            }
        ]);
        api.setNotifications([
            { id: 1, message: "New application received", read: false, time: "Now", title: "Application update" }
        ]);

        api.setCurrentFilter("pending");
        api.renderApplications();
        expect(mocks.elements.applicationsList.innerHTML).toContain("Naledi Mokoena");
        expect(mocks.elements.applicationsList.innerHTML).not.toContain("Aphiwe Dlamini");

        api.renderNotifications();
        expect(mocks.elements.notificationsList.innerHTML).toContain("New application received");
        expect(mocks.elements.notificationsList.innerHTML).toContain("Mark read");

        api.switchTab("applications");
        expect(mocks.elements.opportunitiesSection.style.display).toBe("none");
        expect(mocks.elements.applicationsSection.style.display).toBe("block");

        api.reviewApplicants("job-1");
        expect(mocks.alert).toHaveBeenCalledWith(
            'Reviewing "Frontend Internship"\n\nTotal Applicants: 2\nPending Review: 1\n\nThis opens the applications view for this job.'
        );
        expect(mocks.elements.applicationsSection.style.display).toBe("block");
    });

    test("opens, closes, and populates the recruiter opportunity modal for editing", () => {
        const { api, mocks } = loadRecruiterHomepage();

        api.openPostJobModal();
        expect(mocks.elements.postJobModal.style.display).toBe("flex");
        expect(mocks.elements.modalTitle.textContent).toBe("Post New Opportunity");
        expect(mocks.elements.submitJobBtn.textContent).toBe("Post Opportunity");
        expect(mocks.elements.jobStatus.value).toBe("active");

        api.setJobs([
            {
                closingDate: "2026-05-01",
                description: "Grow quickly",
                duration: "12 months",
                id: "job-1",
                location: "Johannesburg",
                requirements: ["Matric", "CV"],
                status: "closed",
                stipend: "R8000",
                title: "Software Development Internship"
            }
        ]);
        api.editJob("job-1");

        expect(api.getEditingJobId()).toBe("job-1");
        expect(mocks.elements.jobTitleField.value).toBe("Software Development");
        expect(mocks.elements.jobTitleType.value).toBe("Internship");
        expect(mocks.elements.jobRequirements.value).toBe("Matric\nCV");
        expect(mocks.elements.modalTitle.textContent).toBe("Edit Opportunity");
        expect(mocks.elements.submitJobBtn.textContent).toBe("Update Opportunity");

        api.closePostJobModal();
        expect(mocks.elements.postJobModal.style.display).toBe("none");
    });

    test("posts a new recruiter opportunity through Firestore and updates the in-memory dashboard", async () => {
        const { api, mocks } = loadRecruiterHomepage({
            currentUser: {
                email: "recruiter@example.com",
                uid: "recruiter-123"
            },
            generatedOpportunityId: "generated-job-id"
        });

        api.setCurrentRecruiter({
            companyName: "Acme Labs",
            email: "recruiter@example.com",
            uid: "recruiter-123"
        });
        mocks.elements.jobTitleField.value = "Software Development";
        mocks.elements.jobTitleType.value = "Internship";
        mocks.elements.jobLocation.value = "Johannesburg";
        mocks.elements.jobStipend.value = "R8000";
        mocks.elements.jobDuration.value = "12 months";
        mocks.elements.jobClosingDate.value = "2026-05-01";
        mocks.elements.jobRequirements.value = "Matric\nCV";
        mocks.elements.jobDescription.value = "Grow quickly";
        mocks.elements.jobStatus.value = "active";

        await api.postJob({ preventDefault: jest.fn() });

        expect(mocks.setDoc).toHaveBeenCalledWith(
            {
                collectionName: "opportunities",
                db: mocks.db,
                id: "generated-job-id"
            },
            expect.objectContaining({
                companyName: "Acme Labs",
                location: "Johannesburg",
                opportunityType: "Internship",
                ownerUid: "recruiter-123",
                postedByName: "Acme Labs",
                recruiterName: "Acme Labs",
                requirements: ["Matric", "CV"],
                title: "Software Development Internship"
            })
        );
        expect(api.getJobs()[0]).toEqual(
            expect.objectContaining({
                id: "generated-job-id",
                opportunityType: "Internship",
                title: "Software Development Internship"
            })
        );
        expect(mocks.alert).toHaveBeenCalledWith(
            "Job posted successfully: Software Development Internship"
        );
        expect(mocks.elements.submitJobBtn.disabled).toBe(false);
    });

    test("initializeRecruiterHomepage wires sidebar behavior, logout flow, branding, and filters", async () => {
        const { api, mocks } = loadRecruiterHomepage({
            authStateUser: null,
            hash: "#applicationsSection"
        });

        await api.initializeRecruiterHomepage();

        expect(mocks.welcomeHeading.textContent).toBe("Welcome back, Recruiter");
        expect(mocks.sidebarName.textContent).toBe("Recruiter");
        expect(mocks.elements.applicationsSection.style.display).toBe("block");

        mocks.elements.hamburgerBtn.listeners.click();
        expect(mocks.elements.appSidebar.classList.contains("is-open")).toBe(true);
        expect(mocks.elements.sidebarBackdrop.hidden).toBe(false);
        expect(mocks.documentMock.body.classList.contains("sidebar-open")).toBe(true);

        mocks.elements.sidebarCloseBtn.listeners.click();
        expect(mocks.elements.appSidebar.classList.contains("is-open")).toBe(false);
        expect(mocks.elements.sidebarBackdrop.hidden).toBe(true);

        mocks.elements.hamburgerBtn.listeners.click();
        mocks.documentListeners.keydown({ key: "Escape" });
        expect(mocks.elements.appSidebar.classList.contains("is-open")).toBe(false);

        mocks.windowMock.confirm.mockReturnValue(false);
        mocks.elements.sidebarLogoutBtn.listeners.click();
        expect(mocks.localStorageMock.removeItem).not.toHaveBeenCalled();
        expect(mocks.sessionStorageMock.clear).not.toHaveBeenCalled();

        mocks.windowMock.confirm.mockReturnValue(true);
        mocks.elements.sidebarLogoutBtn.listeners.click();
        expect(mocks.localStorageMock.removeItem).toHaveBeenCalledWith("recruiter_jobs");
        expect(mocks.localStorageMock.removeItem).toHaveBeenCalledWith("recruiter_applications");
        expect(mocks.sessionStorageMock.clear).toHaveBeenCalledTimes(1);
        expect(mocks.windowMock.location.href).toBe("../SignUp_LogIn_pages/logIn.html");

        mocks.elements.jobRequirements.value = "Matric";
        mocks.elements.jobRequirements.listeners.input();
        expect(mocks.elements.charCounter.textContent).toBe("6 characters");

        mocks.elements.filterPending.listeners.click();
        expect(api.getCurrentFilter()).toBe("pending");
        expect(mocks.elements.filterPending.classList.contains("active")).toBe(true);

        const applicationsLink = mocks.sidebarLinks[1];
        const sidebarEvent = { currentTarget: applicationsLink, preventDefault: jest.fn() };
        applicationsLink.listeners.click(sidebarEvent);
        expect(sidebarEvent.preventDefault).toHaveBeenCalled();
        expect(mocks.elements.applicationsSection.style.display).toBe("block");
    });
});
