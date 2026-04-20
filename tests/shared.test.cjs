const fs = require("fs");
const path = require("path");
const vm = require("vm");

const APP_SHELL_PATH = path.resolve(__dirname, "../shared/app-shell.js");
const OPPORTUNITY_ACTIONS_PATH = path.resolve(__dirname, "../shared/opportunity-actions.js");

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
    const prepended = [];
    const node = {
        attributes,
        classList: createClassList(),
        dataset: {},
        hidden: false,
        href: "",
        id: "",
        innerHTML: "",
        listeners,
        prepended,
        style: {},
        textContent: "",
        addEventListener: jest.fn((type, handler) => {
            listeners[type] = handler;
        }),
        append: jest.fn(),
        click: jest.fn(),
        getAttribute: jest.fn((name) => attributes[name]),
        prepend: jest.fn((child) => {
            prepended.unshift(child);
        }),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        removeAttribute: jest.fn((name) => {
            delete attributes[name];
            delete node[name];
        }),
        setAttribute: jest.fn((name, value) => {
            attributes[name] = String(value);
            node[name] = value;
        }),
        ...initial
    };

    delete node.attributes;
    return node;
}

function loadAppShell(options = {}) {
    const createdElements = [];
    const idMap = {
        appShellCloseBtn: createFakeNode(),
        appShellLogoutBtn: createFakeNode(),
        appShellMenuBtn: createFakeNode()
    };
    const body = options.withBody === false
        ? null
        : createFakeNode({
            dataset: {
                shellActive: options.active || "",
                shellBase: options.base || "..",
                shellRole: options.role
            }
        });
    const documentListeners = {};
    const documentMock = {
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        body,
        createElement: jest.fn((tagName) => {
            const node = createFakeNode({ tagName: tagName.toUpperCase() });
            createdElements.push(node);
            return node;
        }),
        getElementById: jest.fn((id) => idMap[id] || null)
    };
    const localStorageMock = {
        removeItem: jest.fn()
    };
    const sessionStorageMock = {
        clear: jest.fn()
    };
    const windowMock = {
        confirm: jest.fn(() => true),
        getComputedStyle: jest.fn(() => ({
            paddingTop: options.paddingTop || "0"
        })),
        location: {
            href: "about:blank"
        }
    };
    const context = vm.createContext({
        document: documentMock,
        localStorage: localStorageMock,
        sessionStorage: sessionStorageMock,
        window: windowMock
    });

    context.globalThis = context;

    new vm.Script(fs.readFileSync(APP_SHELL_PATH, "utf8"), { filename: APP_SHELL_PATH }).runInContext(context);

    return {
        createdElements,
        documentListeners,
        documentMock,
        idMap,
        localStorageMock,
        sessionStorageMock,
        windowMock
    };
}

function createCard(options = {}) {
    const detailsButton = options.withDetailsButton === false ? null : createFakeNode();
    const applyButton = options.withApplyButton === false ? null : createFakeNode();
    const titleNode = options.withTitle === false ? null : {
        textContent: Object.prototype.hasOwnProperty.call(options, "title")
            ? options.title
            : "Frontend Internship"
    };
    const companyNode = options.withCompany === false ? null : {
        textContent: Object.prototype.hasOwnProperty.call(options, "company")
            ? options.company
            : "Acme Labs"
    };
    const descriptionNode = options.withDescription === false ? null : {
        textContent: Object.prototype.hasOwnProperty.call(options, "description")
            ? options.description
            : "Hands-on experience"
    };
    const detailNodes = (options.details || ["Location: Cape Town", "Duration: 12 months"]).map((text) => ({
        textContent: text
    }));

    return {
        applyButton,
        detailsButton,
        querySelector: jest.fn((selector) => {
            if (selector === "h4") return titleNode;
            if (selector === ".card-header p") return companyNode;
            if (selector === ".card-description p") return descriptionNode;
            if (selector === '[data-role="details"]') return detailsButton;
            if (selector === '[data-role="apply"]') return applyButton;
            return null;
        }),
        querySelectorAll: jest.fn((selector) => {
            if (selector === ".card-details p") {
                return detailNodes;
            }

            return [];
        })
    };
}

function loadOpportunityActions(cards) {
    const documentListeners = {};
    const documentMock = {
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        querySelectorAll: jest.fn((selector) => {
            if (selector === ".internship-card, .Learnerships-card, .Apprenticeships-card") {
                return cards;
            }

            return [];
        })
    };
    const alert = jest.fn();
    const context = vm.createContext({
        alert,
        document: documentMock
    });

    context.globalThis = context;

    new vm.Script(fs.readFileSync(OPPORTUNITY_ACTIONS_PATH, "utf8"), {
        filename: OPPORTUNITY_ACTIONS_PATH
    }).runInContext(context);

    return { alert, documentListeners, documentMock };
}

describe("shared/app-shell.js", () => {
    test("safely returns when the page has no body or no shell role", () => {
        const noBody = loadAppShell({ withBody: false });
        const noRole = loadAppShell({ role: "" });

        expect(noBody.documentMock.createElement).not.toHaveBeenCalled();
        expect(noRole.documentMock.createElement).not.toHaveBeenCalled();
        expect(noRole.documentMock.body.prepend).not.toHaveBeenCalled();
    });

    test("renders the applicant shell, marks the active link, and handles sidebar plus logout actions", () => {
        const shell = loadAppShell({
            active: "internships",
            role: "applicant"
        });
        const [header, sidebar, backdrop] = shell.createdElements;

        expect(shell.createdElements).toHaveLength(3);
        expect(header.innerHTML).toContain("../Applicant_profile_page/global_profile.html");
        expect(header.innerHTML).toContain("../APPLICANT_NOTIFICATIONS_PAGE/Applicant_notifications_page.html");
        expect(sidebar.innerHTML).toContain("Applicant portal");
        expect(sidebar.innerHTML).toContain('class="app-shell-sidebar-link active">Internships<');
        expect(shell.documentMock.body.classList.contains("app-shell-offset")).toBe(true);

        shell.idMap.appShellMenuBtn.listeners.click();
        expect(sidebar.classList.contains("is-open")).toBe(true);
        expect(sidebar.getAttribute("aria-hidden")).toBe("false");
        expect(backdrop.hidden).toBe(false);
        expect(shell.documentMock.body.classList.contains("app-shell-open")).toBe(true);

        shell.idMap.appShellCloseBtn.listeners.click();
        expect(sidebar.classList.contains("is-open")).toBe(false);
        expect(backdrop.hidden).toBe(true);

        shell.idMap.appShellMenuBtn.listeners.click();
        backdrop.listeners.click();
        expect(sidebar.classList.contains("is-open")).toBe(false);

        shell.idMap.appShellMenuBtn.listeners.click();
        shell.documentListeners.keydown({ key: "Escape" });
        expect(sidebar.classList.contains("is-open")).toBe(false);

        shell.windowMock.confirm.mockReturnValue(false);
        shell.idMap.appShellLogoutBtn.listeners.click();
        expect(shell.localStorageMock.removeItem).not.toHaveBeenCalled();
        expect(shell.sessionStorageMock.clear).not.toHaveBeenCalled();

        shell.windowMock.confirm.mockReturnValue(true);
        shell.idMap.appShellLogoutBtn.listeners.click();
        expect(shell.localStorageMock.removeItem).toHaveBeenCalledWith("recruiter_jobs");
        expect(shell.localStorageMock.removeItem).toHaveBeenCalledWith("recruiter_applications");
        expect(shell.sessionStorageMock.clear).toHaveBeenCalledTimes(1);
        expect(shell.windowMock.location.href).toBe("../SignUp_LogIn_pages/logIn.html");
    });

    test("renders the recruiter shell with recruiter-specific links and without the applicant profile icon", () => {
        const shell = loadAppShell({
            active: "posts",
            paddingTop: "120",
            role: "recruiter"
        });
        const [header, sidebar] = shell.createdElements;

        expect(header.innerHTML).toContain("../RECRUITER_NOTIFICATION_PAGE/recruiter_notifications_page.html");
        expect(header.innerHTML).not.toContain("Applicant_profile_page");
        expect(sidebar.innerHTML).toContain("Recruiter portal");
        expect(sidebar.innerHTML).toContain("../Recruiter_homepage/index.html#opportunitiesSection");
        expect(sidebar.innerHTML).toContain('class="app-shell-sidebar-link active">My Posts<');
        expect(shell.documentMock.body.classList.contains("app-shell-offset")).toBe(false);
    });

    test("ignores unsupported shell roles", () => {
        const shell = loadAppShell({ role: "admin" });

        expect(shell.documentMock.createElement).not.toHaveBeenCalled();
        expect(shell.documentMock.body.prepend).not.toHaveBeenCalled();
    });
});

describe("shared/opportunity-actions.js", () => {
    test("registers DOMContentLoaded and wires details plus apply alerts for populated cards", () => {
        const primaryCard = createCard({
            company: "Acme Labs",
            description: "Hands-on experience",
            details: ["Location: Cape Town", "Duration: 12 months"],
            title: "Frontend Internship"
        });
        const secondaryCard = createCard({
            company: "Bright Future",
            description: "Mentored placement",
            details: ["Location: Johannesburg", "Duration: 6 months"],
            title: "Data Learnership"
        });
        const sharedActions = loadOpportunityActions([primaryCard, secondaryCard]);

        expect(sharedActions.documentMock.addEventListener).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function)
        );

        sharedActions.documentListeners.DOMContentLoaded();
        primaryCard.detailsButton.listeners.click();
        secondaryCard.applyButton.listeners.click();

        expect(sharedActions.alert).toHaveBeenNthCalledWith(
            1,
            "Frontend Internship\nAcme Labs\n\nLocation: Cape Town\nDuration: 12 months\n\nHands-on experience"
        );
        expect(sharedActions.alert).toHaveBeenNthCalledWith(
            2,
            "Application started for Data Learnership at Bright Future."
        );
    });

    test("uses fallback values and safely handles cards without action buttons", () => {
        const fallbackCard = createCard({
            details: [],
            withApplyButton: false,
            withCompany: false,
            withDescription: false,
            withDetailsButton: false,
            withTitle: false
        });
        const detailsOnlyCard = createCard({
            company: "Unknown company",
            description: "",
            details: [],
            title: "Opportunity",
            withApplyButton: false
        });
        const sharedActions = loadOpportunityActions([fallbackCard, detailsOnlyCard]);

        sharedActions.documentListeners.DOMContentLoaded();

        expect(() => detailsOnlyCard.detailsButton.listeners.click()).not.toThrow();
        expect(sharedActions.alert).toHaveBeenCalledWith(
            "Opportunity\nUnknown company\n\n\n\n"
        );
        expect(fallbackCard.detailsButton).toBeNull();
        expect(fallbackCard.applyButton).toBeNull();
    });
});
