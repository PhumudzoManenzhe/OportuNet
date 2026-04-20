const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SCRIPT_PATH = path.resolve(__dirname, "../Applicant_profile_page/global_profile.js");

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
    const children = [];
    const attributes = { ...(initial.attributes || {}) };
    const node = {
        children,
        dataset: {},
        download: "",
        hidden: false,
        href: "",
        listeners,
        src: "",
        textContent: "",
        value: "",
        addEventListener: jest.fn((type, handler) => {
            listeners[type] = handler;
        }),
        append: jest.fn((child) => {
            children.push(child);
        }),
        getAttribute: jest.fn((name) => attributes[name]),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        removeAttribute: jest.fn((name) => {
            delete node[name];
            delete attributes[name];
        }),
        replaceChildren: jest.fn((...items) => {
            children.length = 0;
            children.push(...items);
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

function createFragment(selectors) {
    const nodes = Object.fromEntries(
        selectors.map((selector) => [selector, createFakeNode()])
    );

    return {
        nodes,
        querySelector: jest.fn((selector) => nodes[selector] || null)
    };
}

function createEducationTemplate() {
    return {
        content: {
            cloneNode: jest.fn(() => createFragment([
                "li",
                ".resume-logo-text",
                ".resume-title",
                ".education-field-line",
                ".education-date-line"
            ]))
        }
    };
}

function createResumeTemplate() {
    return {
        content: {
            cloneNode: jest.fn(() => createFragment([
                "li",
                ".resume-logo-text",
                ".resume-title",
                ".resume-company-line",
                ".resume-date-line",
                ".resume-location-line",
                ".resume-description"
            ]))
        }
    };
}

function createSkillGroupTemplate() {
    return {
        content: {
            cloneNode: jest.fn(() => createFragment([
                "li",
                ".resume-logo-text",
                ".resume-title",
                ".grouped-skill-list"
            ]))
        }
    };
}

function createFakeDocument(options = {}) {
    const nodes = {
        "about-intro": createFakeNode(),
        "about-passion": createFakeNode({ hidden: true }),
        "about-section": createFakeNode(),
        "achievements-list": createFakeNode(),
        "achievements-section": createFakeNode({ hidden: true }),
        "avatar-fallback": createFakeNode(),
        "cv-file-name": createFakeNode(),
        "cv-file-note": createFakeNode(),
        "cv-section": createFakeNode({ hidden: true }),
        "education-item-template": createEducationTemplate(),
        "education-list": createFakeNode(),
        "education-section": createFakeNode(),
        "experience-list": createFakeNode(),
        "experience-section": createFakeNode(),
        "page-feedback": createFakeNode({ hidden: true }),
        "personal-address": createFakeNode(),
        "personal-details-section": createFakeNode({ hidden: true }),
        "personal-email": createFakeNode(),
        "personal-phone": createFakeNode(),
        "profile-back-button": options.withBackButton === false ? null : createFakeNode(),
        "profile-name": createFakeNode(),
        "profile-photo": createFakeNode({ hidden: true }),
        "profile-search-form": options.withSearchForm === false ? null : createFakeNode(),
        "projects-list": createFakeNode(),
        "projects-section": createFakeNode({ hidden: true }),
        "qualifications-list": createFakeNode(),
        "qualifications-section": createFakeNode({ hidden: true }),
        "resume-item-template": createResumeTemplate(),
        "skill-group-template": createSkillGroupTemplate(),
        "skills-list": createFakeNode(),
        "skills-section": createFakeNode(),
        "view-cv-link": createFakeNode({ hidden: true })
    };
    const documentListeners = {};
    const documentMock = {
        addEventListener: jest.fn((type, handler) => {
            documentListeners[type] = handler;
        }),
        createElement: jest.fn(() => createFakeNode()),
        getElementById: jest.fn((id) => nodes[id] || null)
    };

    return { documentListeners, documentMock, nodes };
}

function createDefaultPageData() {
    return {
        about: {
            intro: "",
            passion: ""
        },
        achievements: {
            items: []
        },
        cv: {
            fileName: "",
            fileUrl: ""
        },
        education: [],
        experience: [],
        personalDetails: {
            address: "",
            email: "",
            phone: ""
        },
        profile: {
            name: "",
            photoUrl: ""
        },
        projects: {
            items: []
        },
        qualifications: {
            items: []
        },
        skills: {
            softSkills: [],
            technicalSkills: []
        }
    };
}

function loadApplicantProfilePage(options = {}) {
    const fakeDom = createFakeDocument(options);
    const windowMock = {
        __timers: [],
        clearTimeout: jest.fn(),
        history: {
            back: jest.fn(),
            length: options.historyLength ?? 1
        },
        location: { href: "about:blank" },
        setTimeout: jest.fn((handler) => {
            windowMock.__timers.push(handler);
            return windowMock.__timers.length;
        })
    };
    const auth = options.auth || {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : null
    };
    const db = { service: "db" };
    const doc = jest.fn((dbArg, collectionName, uid) => ({
        collectionName,
        db: dbArg,
        uid
    }));
    const getDoc = options.getDoc || jest.fn(() =>
        Promise.resolve({
            data: () => ({}),
            exists: () => false
        })
    );
    const onAuthStateChanged = options.onAuthStateChanged || jest.fn((_auth, onUser) => {
        const unsubscribe = jest.fn();
        Promise.resolve().then(() => onUser(options.authStateUser ?? null));
        return unsubscribe;
    });
    const consoleMock = {
        error: jest.fn()
    };
    const context = vm.createContext({
        auth,
        console: consoleMock,
        db,
        doc,
        document: fakeDom.documentMock,
        getDoc,
        onAuthStateChanged,
        structuredClone: Object.prototype.hasOwnProperty.call(options, "structuredClone")
            ? options.structuredClone
            : structuredClone,
        window: windowMock
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(SCRIPT_PATH, "utf8"))}
globalThis.__testExports = {
    bindEvents,
    cloneData,
    createLogoFromText,
    elements,
    getInitials,
    handleBackNavigation,
    handleSearchSubmit,
    initializePage,
    isPlainObject,
    mergeInto,
    mergeProfileData,
    profileGateway,
    renderAbout,
    renderCv,
    renderEducation,
    renderExperience,
    renderPage,
    renderPersonalDetails,
    renderProfile,
    renderSkills,
    renderSupplementalSection,
    resolveCurrentUser,
    setDetailText,
    setFeedback,
    setOptionalText,
    state
};`;

    new vm.Script(source, { filename: SCRIPT_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            auth,
            consoleMock,
            db,
            doc,
            documentListeners: fakeDom.documentListeners,
            documentMock: fakeDom.documentMock,
            getDoc,
            nodes: fakeDom.nodes,
            onAuthStateChanged,
            windowMock
        }
    };
}

describe("Applicant profile page helpers", () => {
    test("exposes helper APIs and registers initializePage on DOMContentLoaded", () => {
        const { api, mocks } = loadApplicantProfilePage();

        expect(api).toEqual(
            expect.objectContaining({
                cloneData: expect.any(Function),
                createLogoFromText: expect.any(Function),
                getInitials: expect.any(Function),
                initializePage: expect.any(Function),
                mergeProfileData: expect.any(Function),
                profileGateway: expect.any(Object),
                renderPage: expect.any(Function),
                resolveCurrentUser: expect.any(Function),
                state: expect.any(Object)
            })
        );
        expect(mocks.documentMock.addEventListener).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function)
        );
    });

    test("cloneData and mergeProfileData support deep copies, nested merges, and ignore unknown fields", () => {
        const { api } = loadApplicantProfilePage({ structuredClone: undefined });
        const cloned = api.cloneData({ nested: { value: "one" } });
        const merged = api.mergeProfileData(createDefaultPageData(), {
            profile: { name: "Naledi Mokoena" },
            qualifications: {
                items: [{ id: "q1", title: "Systems Development" }]
            },
            skills: {
                technicalSkills: ["JavaScript"]
            },
            unknownField: "ignored"
        });

        cloned.nested.value = "two";

        expect(cloned).toEqual({ nested: { value: "two" } });
        expect(merged.profile.name).toBe("Naledi Mokoena");
        expect(merged.skills.softSkills).toEqual([]);
        expect(merged.skills.technicalSkills).toEqual(["JavaScript"]);
        expect(merged.qualifications.items).toEqual([
            { id: "q1", title: "Systems Development" }
        ]);
        expect(merged.unknownField).toBeUndefined();
    });

    test("resolveCurrentUser returns the current Firebase user immediately when available", async () => {
        const currentUser = { uid: "user-123" };
        const { api, mocks } = loadApplicantProfilePage({ currentUser });

        await expect(api.resolveCurrentUser()).resolves.toBe(currentUser);
        expect(mocks.onAuthStateChanged).not.toHaveBeenCalled();
    });

    test("resolveCurrentUser can wait for auth state and reject on auth listener errors", async () => {
        const authStateUser = { uid: "user-456" };
        const successPage = loadApplicantProfilePage({ authStateUser });
        const failure = new Error("auth listener failed");
        const failingPage = loadApplicantProfilePage({
            onAuthStateChanged: jest.fn((_auth, onUser, onError) => {
                const unsubscribe = jest.fn();
                Promise.resolve().then(() => onError(failure));
                return unsubscribe;
            })
        });

        await expect(successPage.api.resolveCurrentUser()).resolves.toEqual(authStateUser);
        await flushAsyncWork();
        expect(successPage.mocks.onAuthStateChanged).toHaveBeenCalledWith(
            successPage.mocks.auth,
            expect.any(Function),
            expect.any(Function)
        );

        await expect(failingPage.api.resolveCurrentUser()).rejects.toThrow("auth listener failed");
    });

    test("profileGateway fetches and merges applicant profile data from Firestore", async () => {
        const { api, mocks } = loadApplicantProfilePage({
            currentUser: { uid: "applicant-123" },
            getDoc: jest.fn(() =>
                Promise.resolve({
                    data: () => ({
                        applicantProfile: {
                            about: {
                                intro: "Builder of useful products."
                            },
                            profile: {
                                name: "Naledi Mokoena"
                            },
                            skills: {
                                softSkills: ["Communication"],
                                technicalSkills: ["JavaScript"]
                            }
                        }
                    }),
                    exists: () => true
                })
            )
        });

        const pageData = await api.profileGateway.fetchPageData();

        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "users", "applicant-123");
        expect(mocks.getDoc).toHaveBeenCalledWith({
            collectionName: "users",
            db: mocks.db,
            uid: "applicant-123"
        });
        expect(pageData.profile.name).toBe("Naledi Mokoena");
        expect(pageData.about.intro).toBe("Builder of useful products.");
        expect(pageData.skills.softSkills).toEqual(["Communication"]);
        expect(pageData.skills.technicalSkills).toEqual(["JavaScript"]);
        expect(pageData.personalDetails.phone).toBe("");
    });

    test("profileGateway falls back to defaults when there is no user or Firebase load fails", async () => {
        const noUserPage = loadApplicantProfilePage({ authStateUser: null });
        const failingPage = loadApplicantProfilePage({
            currentUser: { uid: "applicant-123" },
            getDoc: jest.fn(() => Promise.reject(new Error("firestore down")))
        });

        const noUserData = await noUserPage.api.profileGateway.fetchPageData();
        const failedData = await failingPage.api.profileGateway.fetchPageData();

        expect(noUserPage.mocks.getDoc).not.toHaveBeenCalled();
        expect(noUserData).toEqual(createDefaultPageData());
        expect(failingPage.mocks.consoleMock.error).toHaveBeenCalledWith(
            "Unable to load applicant profile data from Firebase.",
            expect.any(Error)
        );
        expect(failedData).toEqual(createDefaultPageData());
    });
});

describe("Applicant profile page DOM behavior", () => {
    test("initializePage binds events and renders the default empty profile state", async () => {
        const { api, mocks } = loadApplicantProfilePage({ authStateUser: null });

        await api.initializePage();

        expect(mocks.nodes["profile-back-button"].addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );
        expect(mocks.nodes["profile-search-form"].addEventListener).toHaveBeenCalledWith(
            "submit",
            expect.any(Function)
        );
        expect(mocks.nodes["profile-photo"].hidden).toBe(true);
        expect(mocks.nodes["avatar-fallback"].hidden).toBe(false);
        expect(mocks.nodes["about-section"].hidden).toBe(true);
        expect(mocks.nodes["education-section"].hidden).toBe(true);
        expect(mocks.nodes["experience-section"].hidden).toBe(true);
        expect(mocks.nodes["qualifications-section"].hidden).toBe(true);
        expect(mocks.nodes["skills-section"].hidden).toBe(true);
        expect(mocks.nodes["projects-section"].hidden).toBe(true);
        expect(mocks.nodes["achievements-section"].hidden).toBe(true);
        expect(mocks.nodes["personal-details-section"].hidden).toBe(true);
        expect(mocks.nodes["cv-section"].hidden).toBe(true);
        expect(mocks.nodes["view-cv-link"].hidden).toBe(true);
    });

    test("renderPage shows populated profile, resume sections, skills, details, and CV content", () => {
        const { api, mocks } = loadApplicantProfilePage();
        api.state.pageData = {
            about: {
                intro: "Entry-level developer.",
                passion: "Interested in cloud platforms."
            },
            achievements: {
                items: [
                    {
                        description: "Top achiever in 2025.",
                        id: "achievement-1",
                        subtitle: "College award",
                        title: "Dean's List"
                    }
                ]
            },
            cv: {
                fileName: "Naledi-CV.pdf",
                fileUrl: "https://example.com/cv.pdf"
            },
            education: [
                {
                    dates: "2022 - 2024",
                    field: "Software Development",
                    id: "education-1",
                    school: "Tshwane College"
                }
            ],
            experience: [
                {
                    company: "Bright Future",
                    dates: "2025",
                    description: "Built internal dashboards.",
                    duration: "6 months",
                    employmentType: "Internship",
                    id: "experience-1",
                    locationType: "Hybrid",
                    title: "Software Intern"
                }
            ],
            personalDetails: {
                address: "Johannesburg",
                email: "naledi@example.com",
                phone: "071 234 5678"
            },
            profile: {
                name: "Naledi Mokoena",
                photoUrl: "https://example.com/photo.png"
            },
            projects: {
                items: [
                    {
                        description: "Community job-tracker app.",
                        id: "project-1",
                        subtitle: "Capstone Project",
                        title: "Opportunity Finder"
                    }
                ]
            },
            qualifications: {
                items: [
                    {
                        dates: "2024",
                        description: "Completed NQF-aligned training.",
                        id: "qualification-1",
                        subtitle: "MICT SETA",
                        title: "Systems Development"
                    }
                ]
            },
            skills: {
                softSkills: ["Communication"],
                technicalSkills: ["JavaScript", "CSS"]
            }
        };

        api.renderPage();

        expect(mocks.nodes["profile-name"].textContent).toBe("Naledi Mokoena");
        expect(mocks.nodes["profile-photo"].hidden).toBe(false);
        expect(mocks.nodes["profile-photo"].src).toBe("https://example.com/photo.png");
        expect(mocks.nodes["avatar-fallback"].hidden).toBe(true);
        expect(mocks.nodes["about-section"].hidden).toBe(false);
        expect(mocks.nodes["about-intro"].textContent).toBe(
            "Entry-level developer.\n\nInterested in cloud platforms."
        );
        expect(mocks.nodes["education-section"].hidden).toBe(false);
        expect(mocks.nodes["education-list"].children).toHaveLength(1);
        expect(
            mocks.nodes["education-list"].children[0].querySelector(".resume-title").textContent
        ).toBe("Tshwane College");
        expect(mocks.nodes["experience-section"].hidden).toBe(false);
        expect(mocks.nodes["experience-list"].children).toHaveLength(1);
        expect(
            mocks.nodes["experience-list"].children[0].querySelector(".resume-title").textContent
        ).toBe("Software Intern");
        expect(
            mocks.nodes["experience-list"].children[0].querySelector(".resume-company-line").textContent
        ).toContain("Bright Future");
        expect(mocks.nodes["qualifications-section"].hidden).toBe(false);
        expect(mocks.nodes["projects-section"].hidden).toBe(false);
        expect(mocks.nodes["achievements-section"].hidden).toBe(false);
        expect(mocks.nodes["skills-section"].hidden).toBe(false);
        expect(mocks.nodes["skills-list"].children).toHaveLength(2);
        expect(
            mocks.nodes["skills-list"].children[0].querySelector(".resume-title").textContent
        ).toBe("Soft skills");
        expect(
            mocks.nodes["skills-list"].children[1].querySelector(".grouped-skill-list").children
        ).toHaveLength(2);
        expect(mocks.nodes["personal-details-section"].hidden).toBe(false);
        expect(mocks.nodes["personal-phone"].textContent).toBe("071 234 5678");
        expect(mocks.nodes["personal-email"].textContent).toBe("naledi@example.com");
        expect(mocks.nodes["personal-address"].textContent).toBe("Johannesburg");
        expect(mocks.nodes["cv-section"].hidden).toBe(false);
        expect(mocks.nodes["cv-file-name"].textContent).toBe("Naledi-CV.pdf");
        expect(mocks.nodes["cv-file-note"].textContent).toBe("PDF uploaded and ready to view.");
        expect(mocks.nodes["view-cv-link"].hidden).toBe(false);
        expect(mocks.nodes["view-cv-link"].href).toBe("https://example.com/cv.pdf");
        expect(mocks.nodes["view-cv-link"].download).toBe("Naledi-CV.pdf");
    });

    test("renderProfile and renderCv fall back cleanly when photo or CV is missing", () => {
        const { api, mocks } = loadApplicantProfilePage();
        api.state.pageData = createDefaultPageData();
        api.state.pageData.profile.name = "Naledi Mokoena";
        mocks.nodes["profile-photo"].src = "https://example.com/old.png";
        mocks.nodes["view-cv-link"].href = "https://example.com/old-cv.pdf";
        mocks.nodes["view-cv-link"].download = "old-cv.pdf";

        api.renderProfile();
        api.renderCv();

        expect(mocks.nodes["profile-photo"].hidden).toBe(true);
        expect(mocks.nodes["profile-photo"].removeAttribute).toHaveBeenCalledWith("src");
        expect(mocks.nodes["avatar-fallback"].hidden).toBe(false);
        expect(mocks.nodes["avatar-fallback"].textContent).toBe("NM");
        expect(mocks.nodes["cv-section"].hidden).toBe(true);
        expect(mocks.nodes["view-cv-link"].hidden).toBe(true);
        expect(mocks.nodes["view-cv-link"].removeAttribute).toHaveBeenCalledWith("href");
        expect(mocks.nodes["view-cv-link"].removeAttribute).toHaveBeenCalledWith("download");
    });

    test("back navigation prefers history and the search form shows timed feedback", () => {
        const { api, mocks } = loadApplicantProfilePage({ historyLength: 2 });

        api.bindEvents();
        mocks.nodes["profile-back-button"].listeners.click();

        expect(mocks.windowMock.history.back).toHaveBeenCalledTimes(1);

        mocks.windowMock.history.length = 1;
        mocks.nodes["profile-back-button"].listeners.click();
        expect(mocks.windowMock.location.href).toBe("../Applicant_homepage/index.html");

        const submitEvent = { preventDefault: jest.fn() };
        mocks.nodes["profile-search-form"].listeners.submit(submitEvent);

        expect(submitEvent.preventDefault).toHaveBeenCalled();
        expect(mocks.nodes["page-feedback"].textContent).toBe(
            "Search will be connected to the wider application shell."
        );
        expect(mocks.nodes["page-feedback"].hidden).toBe(false);
        expect(mocks.windowMock.setTimeout).toHaveBeenCalledWith(expect.any(Function), 3200);

        mocks.windowMock.__timers[0]();
        expect(mocks.nodes["page-feedback"].hidden).toBe(true);
        expect(mocks.nodes["page-feedback"].textContent).toBe("");
    });

    test("initializePage reports a user-facing error when profile loading fails", async () => {
        const failure = new Error("profile unavailable");
        const { api, mocks } = loadApplicantProfilePage();
        api.profileGateway.fetchPageData = jest.fn(() => Promise.reject(failure));

        await api.initializePage();

        expect(mocks.consoleMock.error).toHaveBeenCalledWith(
            "Unable to load the profile page.",
            failure
        );
        expect(mocks.nodes["page-feedback"].textContent).toBe("The profile could not be loaded.");
        expect(mocks.nodes["page-feedback"].hidden).toBe(false);
    });
});
