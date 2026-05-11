const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PAGES = [
    {
        containerId: "internship-list",
        defaultTitle: "Internship Opportunity",
        emptyMessage: "No internships found.",
        errorPrefix: "Unable to load internships.",
        loadErrorMessage: "Internships could not be loaded right now.",
        loadFn: "loadInternships",
        itemsVar: "allInternships",
        findFn: "findInternship",
        filterFn: "filterInternships",
        name: "internship",
        opportunityType: "Internship",
        renderFn: "renderInternships",
        scriptPath: "../INTERNSHIPS_PAGE/script.js",
        searchInputId: "search-internships"
    },
    {
        containerId: "learnerships-list",
        defaultTitle: "Learnership Opportunity",
        emptyMessage: "No learnerships found.",
        errorPrefix: "Unable to load learnerships.",
        loadErrorMessage: "Learnerships could not be loaded right now.",
        loadFn: "loadOpportunities",
        itemsVar: "allOpportunities",
        findFn: "findOpportunity",
        filterFn: "filterOpportunities",
        name: "learnership",
        opportunityType: "Learnership",
        renderFn: "renderOpportunities",
        scriptPath: "../LEARNERSHIPS_PAGE/script.js",
        searchInputId: "search-Learnerships"
    },
    {
        containerId: "apprenticeships-list",
        defaultTitle: "Apprenticeship Opportunity",
        emptyMessage: "No apprenticeships found.",
        errorPrefix: "Unable to load apprenticeships.",
        loadErrorMessage: "Apprenticeships could not be loaded right now.",
        loadFn: "loadOpportunities",
        itemsVar: "allOpportunities",
        findFn: "findOpportunity",
        filterFn: "filterOpportunities",
        name: "apprenticeship",
        opportunityType: "Apprenticeship",
        renderFn: "renderOpportunities",
        scriptPath: "../APPRENTICESHIPS_PAGE/script.js",
        searchInputId: "search-Apprenticeships"
    }
];

function stripImports(source) {
    return source.replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];\s*$/gm, "");
}

function flushAsyncWork(cycles = 5) {
    return Array.from({ length: cycles }).reduce(
        (promise) => promise.then(() => Promise.resolve()),
        Promise.resolve()
    );
}

function createFakeNode(initial = {}) {
    const listeners = {};

    return {
        listeners,
        value: "",
        addEventListener: jest.fn((eventName, handler) => {
            listeners[eventName] = handler;
        }),
        ...initial
    };
}

function createActionButton(role, id) {
    const listeners = {};

    return {
        dataset: { id, role },
        disabled: false,
        listeners,
        textContent: role === "apply" ? "Apply" : "View More Details",
        addEventListener: jest.fn((eventName, handler) => {
            listeners[eventName] = handler;
        })
    };
}

function parseActionButtons(html) {
    const groupedButtons = { apply: [], details: [] };
    const actionPattern = /data-role="(details|apply)" data-id="([^"]+)"/g;
    let match = actionPattern.exec(html);

    while (match) {
        groupedButtons[match[1]].push(createActionButton(match[1], match[2]));
        match = actionPattern.exec(html);
    }

    return groupedButtons;
}

function createOpportunityContainer(initialHtml = "") {
    const container = {
        __buttons: { apply: [], details: [] },
        __html: "",
        querySelectorAll: jest.fn((selector) => {
            if (selector === '[data-role="details"]') {
                return container.__buttons.details;
            }

            if (selector === '[data-role="apply"]') {
                return container.__buttons.apply;
            }

            return [];
        }),
        getRenderedButtons: (role) => container.__buttons[role] || []
    };

    Object.defineProperty(container, "innerHTML", {
        configurable: true,
        enumerable: true,
        get() {
            return container.__html;
        },
        set(value) {
            container.__html = String(value);
            container.__buttons = parseActionButtons(container.__html);
        }
    });

    container.innerHTML = initialHtml;
    return container;
}

function createFirestoreSnapshots(entries) {
    return {
        forEach(callback) {
            entries.forEach((entry) => callback(entry));
        }
    };
}

function createSnapshot(id, data) {
    return {
        data: () => data,
        id
    };
}

function loadOpportunityPage(config, options = {}) {
    const scriptPath = path.resolve(__dirname, config.scriptPath);
    const searchInput = options.withSearchInput === false ? null : createFakeNode();
    const searchButton = options.withSearchButton === false ? null : createFakeNode();
    const container = options.withContainer === false
        ? null
        : createOpportunityContainer(`<p class="status-message">Loading ${config.name}s...</p>`);
    const elements = {
        [config.containerId]: container,
        [config.searchInputId]: searchInput
    };
    const documentListeners = {};
    const documentMock = {
        addEventListener: jest.fn((eventName, handler) => {
            documentListeners[eventName] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null),
        querySelector: jest.fn((selector) => {
            if (selector === ".search-area button") {
                return searchButton;
            }

            return null;
        })
    };
    const db = { service: "db" };
    const auth = {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : {
                displayName: "Naledi Mokoena",
                email: "naledi@example.com",
                uid: "applicant-123"
            }
    };
    const collection = jest.fn((dbArg, collectionName) => ({ collectionName, db: dbArg }));
    const doc = jest.fn((dbArg, collectionName, id) => ({ collectionName, db: dbArg, id }));
    const where = jest.fn((field, operator, value) => ({ field, operator, value }));
    const query = jest.fn((collectionRef, whereRef) => ({ collectionRef, whereRef }));
    const getDocs = options.getDocs || jest.fn(() =>
        Promise.resolve(createFirestoreSnapshots(options.snapshots || []))
    );
    const getDoc = options.getDoc || jest.fn((docRef) => {
        const documentGroup = docRef.collectionName === "applications"
            ? options.applicationDocs
            : options.userDocs;
        const documentData = documentGroup?.[docRef.id];

        return Promise.resolve({
            data: () => documentData || {},
            exists: () => Boolean(documentData)
        });
    });
    const setDoc = options.setDoc || jest.fn(() => Promise.resolve());
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onUser(auth.currentUser));
        return unsubscribe;
    });
    const alert = jest.fn();
    const consoleMock = { error: jest.fn() };
    const source = `${stripImports(fs.readFileSync(scriptPath, "utf8"))}
globalThis.__testExports = {
    bindCardActions,
    escapeHtml,
    filterData: ${config.filterFn},
    findItem: ${config.findFn},
    formatIsoDate,
    getCompanyName,
    loadData: ${config.loadFn},
    renderData: ${config.renderFn},
    renderStatusMessage,
    type: OPPORTUNITY_TYPE,
    get items() { return ${config.itemsVar}; },
    set items(value) { ${config.itemsVar} = value; }
};`;
    const context = vm.createContext({
        alert,
        auth,
        collection,
        console: consoleMock,
        db,
        doc,
        getDoc,
        document: documentMock,
        getDocs,
        onAuthStateChanged,
        query,
        setDoc,
        where
    });

    context.globalThis = context;

    new vm.Script(source, { filename: scriptPath }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            alert,
            collection,
            consoleMock,
            container,
            db,
            doc,
            documentListeners,
            documentMock,
            elements,
            getDoc,
            getDocs,
            onAuthStateChanged,
            query,
            searchButton,
            searchInput,
            setDoc,
            where
        }
    };
}

describe.each(PAGES)("$name page", (config) => {
    test("loads active opportunities, queries the correct Firestore type, and renders escaped cards", async () => {
        const { api, mocks } = loadOpportunityPage(config, {
            snapshots: [
                createSnapshot("old", {
                    closingDate: "2026-02-01",
                    companyName: "Recruiter",
                    description: "First chance",
                    duration: "",
                    location: "Cape Town",
                    ownerUid: "owner-1",
                    postedAt: "2026-01-01T08:00:00Z",
                    requirements: "CV only",
                    status: "active",
                    stipend: "",
                    title: ""
                }),
                createSnapshot("new", {
                    closingDate: "2026-04-01",
                    companyName: "A & B",
                    description: "Grow > learn",
                    duration: "12 months",
                    location: "Johannesburg",
                    postedAt: "2026-03-01T09:00:00Z",
                    requirements: ["CV", "ID"],
                    status: "active",
                    stipend: "R8000",
                    title: "Launch <Build>"
                }),
                createSnapshot("inactive", {
                    companyName: "Ignore Me",
                    location: "Remote",
                    status: "closed",
                    title: "Should Not Render"
                })
            ],
            userDocs: {
                "owner-1": {
                    recruiterProfile: {
                        contactName: "Mpho Dlamini",
                        companyName: "Owner Careers"
                    }
                }
            }
        });

        await api.loadData("");

        expect(api.type).toBe(config.opportunityType);
        expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "opportunities");
        expect(mocks.where).toHaveBeenCalledWith("opportunityType", "==", config.opportunityType);
        expect(api.items.map((item) => item.id)).toEqual(["new", "old"]);
        expect(api.items[1].title).toBe(config.defaultTitle);
        expect(api.items[1].companyName).toBe("Owner Careers");
        expect(api.items[1].duration).toBe("Not specified");
        expect(api.items[1].stipend).toBe("Not specified");
        expect(api.items[1].requirements).toEqual([]);
        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "users", "owner-1");
        expect(mocks.getDoc).toHaveBeenCalledWith({
            collectionName: "users",
            db: mocks.db,
            id: "owner-1"
        });
        expect(mocks.container.innerHTML).toContain("Launch &lt;Build&gt;");
        expect(mocks.container.innerHTML).toContain("A &amp; B");
        expect(mocks.container.innerHTML).toContain("Grow &gt; learn");
        expect(mocks.container.innerHTML).not.toContain("Should Not Render");
    });

    test("filters by title, company, and location and exposes the shared formatting helpers", () => {
        const { api } = loadOpportunityPage(config);

        api.items = [
            {
                companyName: "Acme Careers",
                id: "1",
                location: "Pretoria",
                title: "Developer Track"
            },
            {
                companyName: "Bright Future",
                id: "2",
                location: "Cape Town",
                title: "Operations Path"
            }
        ];

        expect(api.filterData("developer").map((item) => item.id)).toEqual(["1"]);
        expect(api.filterData("bright").map((item) => item.id)).toEqual(["2"]);
        expect(api.filterData("cape").map((item) => item.id)).toEqual(["2"]);
        expect(api.filterData("").map((item) => item.id)).toEqual(["1", "2"]);
        expect(api.formatIsoDate("2026-04-20T12:34:56Z")).toBe("2026-04-20");
        expect(api.formatIsoDate("")).toBe("");
        expect(api.getCompanyName({ organizationName: "Fallback Org" })).toBe("Fallback Org");
        expect(api.getCompanyName({ recruiterName: "Mpho Dlamini" })).toBe("Mpho Dlamini");
        expect(api.getCompanyName({ companyName: "Recruiter" }, "Mpho Dlamini")).toBe("Mpho Dlamini");
        expect(api.getCompanyName({ companyName: "recruiter@example.com", recruiterName: "Mpho Dlamini" })).toBe("Mpho Dlamini");
        expect(api.getCompanyName({ ownerEmail: "recruiter@example.com" })).toBe("Recruiter");
        expect(api.getCompanyName({})).toBe("Recruiter");
        expect(api.escapeHtml("A&B<C>")).toBe("A&amp;B&lt;C&gt;");
    });

    test("renders cards, shows details and submits applications, and supports the empty state", async () => {
        const { api, mocks } = loadOpportunityPage(config, {
            userDocs: {
                "applicant-123": {
                    applicantProfile: {
                        cv: {
                            fileName: "Naledi-CV.pdf",
                            fileUrl: "https://example.com/cv.pdf"
                        },
                        profile: {
                            name: "Naledi Mokoena"
                        },
                        qualifications: {
                            items: [
                                { title: "Diploma in IT" }
                            ]
                        },
                        skills: {
                            softSkills: ["Communication"],
                            technicalSkills: ["JavaScript", "React"]
                        }
                    }
                }
            }
        });

        api.items = [
            {
                closingDate: "2026-05-01",
                companyName: "Bright Future",
                description: "Hands-on work",
                duration: "12 months",
                id: "1",
                location: "Soweto",
                requirements: ["CV", "Matric"],
                recruiterId: "recruiter-456",
                stipend: "R7000",
                title: "Frontend Role"
            }
        ];

        api.renderData(api.items);

        const detailsButton = mocks.container.getRenderedButtons("details")[0];
        const applyButton = mocks.container.getRenderedButtons("apply")[0];

        detailsButton.listeners.click();
        await applyButton.listeners.click();

        expect(mocks.alert).toHaveBeenNthCalledWith(
            1,
            "Frontend Role\nBright Future\n\n"
            + "Location: Soweto\n"
            + "Duration: 12 months\n"
            + "Stipend: R7000\n"
            + "Closing Date: 2026-05-01\n\n"
            + "Hands-on work\n\n"
            + "Requirements:\n- CV\n- Matric"
        );
        expect(mocks.alert).toHaveBeenNthCalledWith(
            2,
            "Application submitted for Frontend Role at Bright Future."
        );
        expect(mocks.setDoc).toHaveBeenCalledWith(
            {
                collectionName: "applications",
                db: mocks.db,
                id: "applicant-123_1"
            },
            expect.objectContaining({
                applicantEmail: "naledi@example.com",
                applicantId: "applicant-123",
                applicantName: "Naledi Mokoena",
                companyName: "Bright Future",
                cvFileName: "Naledi-CV.pdf",
                cvFileUrl: "https://example.com/cv.pdf",
                jobId: "1",
                opportunityTitle: "Frontend Role",
                opportunityType: config.opportunityType,
                qualifications: "Diploma in IT | Skills: JavaScript, React",
                recruiterId: "recruiter-456",
                status: "pending"
            })
        );
        expect(applyButton.disabled).toBe(true);
        expect(applyButton.textContent).toBe("Applied");

        api.renderData([]);
        expect(mocks.container.innerHTML).toContain(config.emptyMessage);
    });

    test("handles missing requirements, permission errors, and ignores card actions when the item cannot be found", async () => {
        const { api, mocks } = loadOpportunityPage(config, {
            setDoc: jest.fn(() => Promise.reject({
                code: "permission-denied",
                message: "Missing or insufficient permissions."
            }))
        });

        api.items = [
            {
                closingDate: "Not specified",
                companyName: "Studio",
                description: "",
                duration: "3 months",
                id: "no-requirements",
                location: "Durban",
                requirements: [],
                recruiterId: "recruiter-999",
                stipend: "R0",
                title: "Support Role"
            }
        ];

        api.renderData(api.items);
        mocks.container.getRenderedButtons("details")[0].listeners.click();
        await mocks.container.getRenderedButtons("apply")[0].listeners.click();

        expect(mocks.alert).toHaveBeenNthCalledWith(
            1,
            "Support Role\nStudio\n\n"
            + "Location: Durban\n"
            + "Duration: 3 months\n"
            + "Stipend: R0\n"
            + "Closing Date: Not specified\n\n"
            + "No description provided.\n\n"
            + "Requirements:\nNo requirements specified."
        );
        expect(mocks.alert).toHaveBeenNthCalledWith(
            2,
            "Firestore permissions are blocking application submissions right now."
        );
        expect(mocks.setDoc).toHaveBeenCalled();
        expect(api.findItem("missing-id")).toBeUndefined();

        mocks.container.innerHTML = `
            <button type="button" data-role="details" data-id="missing-id">Details</button>
            <button type="button" data-role="apply" data-id="missing-id">Apply</button>
        `;
        mocks.alert.mockClear();

        api.bindCardActions();
        mocks.container.getRenderedButtons("details")[0].listeners.click();
        mocks.container.getRenderedButtons("apply")[0].listeners.click();

        expect(mocks.alert).not.toHaveBeenCalled();
    });

    test("wires the search controls on DOMContentLoaded and shows a status message when loading fails", async () => {
        const loadError = new Error("network offline");
        const successPage = loadOpportunityPage(config, {
            snapshots: [
                createSnapshot("cape", {
                    companyName: "Cape Careers",
                    description: "Coastal opportunity",
                    duration: "6 months",
                    location: "Cape Town",
                    postedAt: "2026-03-10T08:00:00Z",
                    requirements: [],
                    status: "active",
                    stipend: "R5000",
                    title: "Designer Role"
                }),
                createSnapshot("joburg", {
                    companyName: "Metro Works",
                    description: "City placement",
                    duration: "12 months",
                    location: "Johannesburg",
                    postedAt: "2026-03-11T08:00:00Z",
                    requirements: [],
                    status: "active",
                    stipend: "R6500",
                    title: "Analyst Role"
                })
            ]
        });

        successPage.mocks.documentListeners.DOMContentLoaded();
        await flushAsyncWork();

        expect(successPage.mocks.searchInput.addEventListener).toHaveBeenCalledWith(
            "input",
            expect.any(Function)
        );
        expect(successPage.mocks.searchButton.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );

        successPage.mocks.searchInput.value = "cape";
        successPage.mocks.searchInput.listeners.input();
        expect(successPage.mocks.container.innerHTML).toContain("Designer Role");
        expect(successPage.mocks.container.innerHTML).not.toContain("Analyst Role");

        successPage.mocks.searchInput.value = "johannesburg";
        successPage.mocks.searchButton.listeners.click();
        expect(successPage.mocks.container.innerHTML).toContain("Analyst Role");
        expect(successPage.mocks.container.innerHTML).not.toContain("Designer Role");

        const failingPage = loadOpportunityPage(config, {
            getDocs: jest.fn(() => Promise.reject(loadError))
        });

        failingPage.mocks.documentListeners.DOMContentLoaded();
        await flushAsyncWork();

        expect(failingPage.mocks.consoleMock.error).toHaveBeenCalledWith(
            config.errorPrefix,
            loadError
        );
        expect(failingPage.mocks.container.innerHTML).toContain(config.loadErrorMessage);
    });
});
