const path = require("path");

const SCRIPT_PATH = path.resolve(__dirname, "../Applicant_Editable_Profile/profile_script.js");
const GLOBAL_NAMES = ["window", "document", "FileReader", "structuredClone", "crypto", "URL"];

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
    const node = {
        classList: createClassList(),
        dataset: {},
        download: "",
        hidden: false,
        href: "",
        listeners,
        open: false,
        textContent: "",
        value: "",
        addEventListener: jest.fn((type, handler) => {
            listeners[type] = handler;
        }),
        append: jest.fn(),
        click: jest.fn(),
        closest: jest.fn(() => null),
        contains: jest.fn(() => false),
        focus: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        removeAttribute: jest.fn((name) => {
            delete node[name];
        }),
        replaceChildren: jest.fn(),
        reset: jest.fn(() => {
            node.value = "";
        }),
        scrollIntoView: jest.fn(),
        setAttribute: jest.fn((name, value) => {
            node[name] = value;
        }),
        ...initial
    };

    return node;
}

function createFakeDocument() {
    const ids = [
        "about-intro",
        "about-intro-input",
        "about-passion",
        "about-passion-input",
        "add-education-dates-input",
        "add-education-field-input",
        "add-education-school-input",
        "add-section-button",
        "add-section-form",
        "add-section-panel",
        "add-section-select",
        "add-shared-dates-input",
        "add-shared-description-input",
        "add-shared-subtitle-input",
        "add-shared-title-input",
        "add-soft-skills-input",
        "add-technical-skills-input",
        "address-input",
        "avatar-fallback",
        "avatar-menu",
        "avatar-menu-button",
        "cancel-add-section-button",
        "cancel-editor-button",
        "change-photo-option",
        "close-add-section-button",
        "close-editor-button",
        "cv-file-name",
        "cv-file-note",
        "cv-input",
        "editor-form",
        "editor-heading",
        "editor-panel",
        "education-active-header",
        "education-add-button",
        "education-add-group",
        "education-dates-input",
        "education-field-input",
        "education-heading",
        "education-intro",
        "education-item-template",
        "education-list",
        "education-placeholder",
        "education-school-input",
        "education-section",
        "email-input",
        "headline-input",
        "institution-input",
        "location-input",
        "page-feedback",
        "personal-address",
        "personal-email",
        "personal-phone",
        "phone-input",
        "photo-input",
        "profile-headline",
        "profile-institution",
        "profile-location",
        "profile-name",
        "profile-name-input",
        "profile-photo",
        "qualifications-active-header",
        "qualifications-add-button",
        "qualifications-button-input",
        "qualifications-intro",
        "qualifications-intro-input",
        "qualifications-list",
        "qualifications-placeholder",
        "qualifications-section",
        "resume-item-template",
        "shared-dates-label",
        "shared-description-label",
        "shared-subtitle-label",
        "shared-title-label",
        "skill-group-template",
        "skills-active-header",
        "skills-add-button",
        "skills-add-group",
        "skills-list",
        "skills-placeholder",
        "skills-placeholder-intro",
        "skills-section",
        "soft-skills-input",
        "supplemental-add-group",
        "supplemental-legend",
        "technical-skills-input",
        "upload-cv-button",
        "view-cv-link",
        "view-profile-option"
    ];

    const nodes = Object.fromEntries(ids.map((id) => [id, createFakeNode()]));

    nodes["avatar-menu"].hidden = true;
    nodes["profile-photo"].hidden = true;
    nodes["view-cv-link"].hidden = true;
    nodes["add-section-panel"].hidden = true;
    nodes["editor-panel"].hidden = true;

    const documentListeners = {};
    const documentMock = {
        readyState: "loading",
        body: createFakeNode(),
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        createDocumentFragment: jest.fn(() => {
            const children = [];
            return {
                append: jest.fn((child) => {
                    children.push(child);
                }),
                children
            };
        }),
        createElement: jest.fn(() => createFakeNode()),
        getElementById: jest.fn((id) => nodes[id] || null),
        querySelectorAll: jest.fn((selector) => {
            if (selector === "[data-editor-section]") {
                return [];
            }

            if (selector === ".section-action-menu[open]") {
                return [];
            }

            return [];
        })
    };

    return { documentMock, nodes, documentListeners };
}

function loadProfileScript(options = {}) {
    const snapshot = snapshotGlobals();
    restoreEnvironment = () => restoreGlobals(snapshot);

    const windowMock = {
        addEventListener: jest.fn(),
        clearTimeout: jest.fn(),
        scrollTo: jest.fn(),
        setTimeout: jest.fn(() => 1)
    };

    setGlobal("window", windowMock);
    setGlobal("URL", { revokeObjectURL: jest.fn() });

    if (Object.prototype.hasOwnProperty.call(options, "structuredClone")) {
        setGlobal("structuredClone", options.structuredClone);
    }

    if (Object.prototype.hasOwnProperty.call(options, "crypto")) {
        setGlobal("crypto", options.crypto);
    }

    if (Object.prototype.hasOwnProperty.call(options, "FileReader")) {
        setGlobal("FileReader", options.FileReader);
    } else {
        delete global.FileReader;
    }

    let documentMock;
    let nodes;

    if (options.withDocument) {
        const fakeDom = createFakeDocument();
        documentMock = fakeDom.documentMock;
        nodes = fakeDom.nodes;
        setGlobal("document", documentMock);
    } else {
        delete global.document;
    }

    let app;
    jest.resetModules();
    jest.isolateModules(() => {
        require(SCRIPT_PATH);
        app = global.window.ApplicantEditableProfile;
    });

    return { app, documentMock, nodes, windowMock };
}

function createReaderClass({ onRead }) {
    return class FakeReader {
        constructor() {
            this.error = null;
            this.listeners = {};
            this.result = "";
        }

        addEventListener(type, handler) {
            this.listeners[type] = handler;
        }

        readAsDataURL(file) {
            onRead.call(this, file);
        }
    };
}

async function createMinimalPageData(app, overrides = {}) {
    const pageData = await app.profileGateway.fetchPageData();
    pageData.education = [];
    pageData.qualifications.items = [];
    pageData.skills.softSkills = [];
    pageData.skills.technicalSkills = [];
    Object.assign(pageData, overrides);
    return pageData;
}

describe("Applicant editable profile helpers", () => {
    test("exposes the helper API and registers cleanup on window load", () => {
        const { app, windowMock } = loadProfileScript();

        expect(app).toEqual(
            expect.objectContaining({
                cloneData: expect.any(Function),
                createItemId: expect.any(Function),
                createLogoFromText: expect.any(Function),
                getInitials: expect.any(Function),
                initializePage: expect.any(Function),
                isPdfFile: expect.any(Function),
                mergeUniqueItems: expect.any(Function),
                parseSkillText: expect.any(Function),
                profileGateway: expect.any(Object),
                state: expect.any(Object)
            })
        );
        expect(windowMock.addEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    });

    test("parseSkillText removes blanks and supports commas plus new lines", () => {
        const { app } = loadProfileScript();

        expect(app.parseSkillText(" HTML, CSS \n\nJavaScript,  Figma ")).toEqual([
            "HTML",
            "CSS",
            "JavaScript",
            "Figma"
        ]);
    });

    test("mergeUniqueItems removes case-insensitive duplicates while preserving first entries", () => {
        const { app } = loadProfileScript();

        expect(app.mergeUniqueItems(["HTML", "css"], ["html", "React", "CSS", "Node"])).toEqual([
            "HTML",
            "css",
            "React",
            "Node"
        ]);
    });

    test("createLogoFromText and getInitials handle sparse values cleanly", () => {
        const { app } = loadProfileScript();

        expect(app.createLogoFromText("   ** naledi")).toBe("N");
        expect(app.createLogoFromText("   !!!   ")).toBe("?");
        expect(app.getInitials("  Naledi   Mokoena  Dlamini ")).toBe("NM");
    });

    test("isPdfFile accepts mime type or extension and rejects non-PDF files", () => {
        const { app } = loadProfileScript();

        expect(app.isPdfFile({ name: "resume.txt", type: "application/pdf" })).toBe(true);
        expect(app.isPdfFile({ name: "resume.PDF", type: "" })).toBe(true);
        expect(app.isPdfFile({ name: "resume.docx", type: "application/msword" })).toBe(false);
    });

    test("createItemId uses crypto.randomUUID when available", () => {
        const { app } = loadProfileScript({
            crypto: { randomUUID: jest.fn(() => "uuid-123") }
        });

        expect(app.createItemId("education")).toBe("education-uuid-123");
    });

    test("createItemId falls back to timestamp and random suffix without crypto", () => {
        const { app } = loadProfileScript({
            crypto: undefined
        });

        expect(app.createItemId("skill")).toMatch(/^skill-\d+-[a-f0-9]+$/);
    });

    test("cloneData and profileGateway methods return deep clones", async () => {
        const { app } = loadProfileScript({
            structuredClone: undefined
        });

        const cloned = app.cloneData({ nested: { value: "one" } });
        cloned.nested.value = "two";
        expect(cloned.nested.value).toBe("two");

        const fetched = await app.profileGateway.fetchPageData();
        fetched.profile.name = "Changed";
        fetched.qualifications.items[0].title = "Updated";

        const freshFetch = await app.profileGateway.fetchPageData();
        expect(freshFetch.profile.name).toBe("Naledi Mokoena");
        expect(freshFetch.qualifications.items[0].title).toBe("Google UX Design Certificate");

        const saved = await app.profileGateway.savePageData(fetched);
        saved.profile.name = "Saved copy only";
        expect(fetched.profile.name).toBe("Changed");
    });

    test("upload helpers resolve data URLs and normalize non-string reader results", async () => {
        const { app } = loadProfileScript({
            FileReader: createReaderClass({
                onRead(file) {
                    this.result = file.result;
                    this.listeners.load();
                }
            })
        });

        await expect(
            app.profileGateway.uploadProfilePhoto({ result: "data:image/png;base64,abc" })
        ).resolves.toBe("data:image/png;base64,abc");
        await expect(
            app.profileGateway.uploadCv({ result: { unexpected: true } })
        ).resolves.toBe("");
    });

    test("upload helpers reject FileReader errors", async () => {
        const { app } = loadProfileScript({
            FileReader: createReaderClass({
                onRead() {
                    this.error = new Error("reader failed");
                    this.listeners.error();
                }
            })
        });

        await expect(app.profileGateway.uploadCv({})).rejects.toThrow("reader failed");
    });

    test("initializePage safely no-ops when there is no DOM available", async () => {
        const { app } = loadProfileScript();
        app.profileGateway.fetchPageData = jest.fn();

        await app.initializePage();

        expect(app.state.isInitialized).toBe(false);
        expect(app.profileGateway.fetchPageData).not.toHaveBeenCalled();
    });
});

describe("Applicant editable profile DOM behavior", () => {
    test("initializePage renders empty personal detail placeholders and the default empty CV state", async () => {
        const { app, nodes } = loadProfileScript({ withDocument: true });
        const pageData = await createMinimalPageData(app);
        pageData.personalDetails = { phone: "", email: "", address: "" };
        pageData.cv = { fileName: "", fileUrl: "" };
        app.profileGateway.fetchPageData = jest.fn().mockResolvedValue(pageData);

        await app.initializePage();

        expect(nodes["personal-phone"].textContent).toBe("Add your phone number");
        expect(nodes["personal-email"].textContent).toBe("Add your email address");
        expect(nodes["personal-address"].textContent).toBe("Add your home address");
        expect(nodes["personal-phone"].classList.contains("detail-empty")).toBe(true);
        expect(nodes["cv-file-name"].textContent).toBe("No CV uploaded yet");
        expect(nodes["cv-file-note"].textContent).toBe("Upload a PDF version of your CV. Only PDF files are accepted.");
        expect(nodes["upload-cv-button"].textContent).toBe("Upload PDF CV");
        expect(nodes["view-cv-link"].hidden).toBe(true);
    });

    test("the CV change handler rejects non-PDF uploads and shows feedback", async () => {
        const { app, nodes } = loadProfileScript({ withDocument: true });
        const pageData = await createMinimalPageData(app);
        app.profileGateway.fetchPageData = jest.fn().mockResolvedValue(pageData);
        app.profileGateway.uploadCv = jest.fn();

        await app.initializePage();
        nodes["cv-input"].value = "selected-file";

        await nodes["cv-input"].listeners.change({
            target: {
                files: [{ name: "resume.docx", type: "application/msword" }]
            }
        });

        expect(app.profileGateway.uploadCv).not.toHaveBeenCalled();
        expect(nodes["page-feedback"].textContent).toBe("Please upload a PDF version of your CV.");
        expect(nodes["cv-input"].value).toBe("");
    });

    test("the CV change handler accepts PDF uploads and updates the view link", async () => {
        const { app, nodes } = loadProfileScript({ withDocument: true });
        const pageData = await createMinimalPageData(app);
        app.profileGateway.fetchPageData = jest.fn().mockResolvedValue(pageData);
        app.profileGateway.uploadCv = jest.fn().mockResolvedValue("data:application/pdf;base64,abc");

        await app.initializePage();

        const file = { name: "Naledi-CV.PDF", type: "" };
        await nodes["cv-input"].listeners.change({
            target: {
                files: [file]
            }
        });

        expect(app.profileGateway.uploadCv).toHaveBeenCalledWith(file);
        expect(nodes["cv-file-name"].textContent).toBe("Naledi-CV.PDF");
        expect(nodes["cv-file-note"].textContent).toBe("PDF uploaded and ready to view.");
        expect(nodes["upload-cv-button"].textContent).toBe("Replace PDF CV");
        expect(nodes["view-cv-link"].hidden).toBe(false);
        expect(nodes["view-cv-link"].href).toBe("data:application/pdf;base64,abc");
        expect(nodes["view-cv-link"].download).toBe("Naledi-CV.PDF");
        expect(nodes["page-feedback"].textContent).toBe("PDF CV uploaded for this demo session.");
        expect(nodes["cv-input"].value).toBe("");
    });
});
