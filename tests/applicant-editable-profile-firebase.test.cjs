const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SCRIPT_PATH = path.resolve(__dirname, "../Applicant_Editable_Profile/profile_firebase.js");

function stripImports(source) {
    return source.replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];\s*$/gm, "");
}

function flushAsyncWork(cycles = 5) {
    return Array.from({ length: cycles }).reduce(
        (promise) => promise.then(() => Promise.resolve()),
        Promise.resolve()
    );
}

function createDefaultPageData() {
    return {
        about: {
            intro: "",
            passion: ""
        },
        cv: {
            fileName: "",
            fileUrl: ""
        },
        education: [],
        personalDetails: {
            address: "",
            email: "",
            phone: ""
        },
        profile: {
            name: "",
            photoUrl: ""
        },
        qualifications: {
            buttonLabel: "Add qualifications",
            intro: "",
            items: []
        },
        skills: {
            intro: "",
            softSkills: [],
            technicalSkills: []
        }
    };
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function loadProfileFirebaseModule(options = {}) {
    const defaultPageData = clone(options.defaultPageData || createDefaultPageData());
    const fallbackFetchPageData = options.fallbackFetchPageData || jest.fn(async () => clone(defaultPageData));
    const cloneData = jest.fn((value) => clone(value));
    const profileApp = options.profileApp === undefined
        ? {
            cloneData,
            profileGateway: {
                fetchPageData: fallbackFetchPageData,
                savePageData: jest.fn()
            }
        }
        : options.profileApp;
    const auth = options.auth || {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : null
    };
    const db = { service: "db" };
    const doc = options.doc || jest.fn((dbArg, collectionName, uid) => ({
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
    const setDoc = options.setDoc || jest.fn(() => Promise.resolve());
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
        getDoc,
        onAuthStateChanged,
        setDoc,
        window: {
            ApplicantEditableProfile: profileApp
        }
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(SCRIPT_PATH, "utf8"))}
globalThis.__testExports = {
    PROFILE_FIELD,
    isPlainObject,
    mergeInto,
    mergeProfileData,
    resolveCurrentUser
};`;

    new vm.Script(source, { filename: SCRIPT_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            auth,
            cloneData,
            consoleMock,
            db,
            doc,
            fallbackFetchPageData,
            getDoc,
            onAuthStateChanged,
            profileApp,
            setDoc
        }
    };
}

describe("Applicant editable profile Firebase gateway", () => {
    test("throws when the editable profile app has not been loaded first", () => {
        expect(() => {
            loadProfileFirebaseModule({
                profileApp: null
            });
        }).toThrow("Applicant editable profile script must load before profile_firebase.js.");
    });

    test("resolveCurrentUser returns the current Firebase user immediately when available", async () => {
        const currentUser = { uid: "user-123" };
        const { api, mocks } = loadProfileFirebaseModule({ currentUser });

        await expect(api.resolveCurrentUser()).resolves.toBe(currentUser);
        expect(mocks.onAuthStateChanged).not.toHaveBeenCalled();
    });

    test("resolveCurrentUser waits for auth state and rejects on listener errors", async () => {
        const authStateUser = { uid: "user-456" };
        const successModule = loadProfileFirebaseModule({ authStateUser });
        const failure = new Error("auth unavailable");
        const failingModule = loadProfileFirebaseModule({
            onAuthStateChanged: jest.fn((_auth, _onUser, onError) => {
                const unsubscribe = jest.fn();
                Promise.resolve().then(() => onError(failure));
                return unsubscribe;
            })
        });

        await expect(successModule.api.resolveCurrentUser()).resolves.toEqual(authStateUser);
        await flushAsyncWork();
        await expect(failingModule.api.resolveCurrentUser()).rejects.toThrow("auth unavailable");
    });

    test("fetchPageData returns the default editable profile data when there is no user", async () => {
        const { mocks } = loadProfileFirebaseModule({ authStateUser: null });

        const pageData = await mocks.profileApp.profileGateway.fetchPageData();

        expect(mocks.fallbackFetchPageData).toHaveBeenCalledTimes(1);
        expect(mocks.getDoc).not.toHaveBeenCalled();
        expect(pageData).toEqual(createDefaultPageData());
    });

    test("fetchPageData merges Firebase applicantProfile data into the fallback profile data", async () => {
        const defaultPageData = createDefaultPageData();
        defaultPageData.profile.name = "Local Default";
        defaultPageData.skills.softSkills = ["Teamwork"];

        const { mocks } = loadProfileFirebaseModule({
            currentUser: {
                uid: "applicant-123"
            },
            defaultPageData,
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
                            qualifications: {
                                items: [{ id: "q1", title: "Systems Development" }]
                            },
                            skills: {
                                technicalSkills: ["JavaScript"]
                            }
                        }
                    }),
                    exists: () => true
                })
            )
        });

        const pageData = await mocks.profileApp.profileGateway.fetchPageData();

        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "users", "applicant-123");
        expect(mocks.getDoc).toHaveBeenCalledWith({
            collectionName: "users",
            db: mocks.db,
            uid: "applicant-123"
        });
        expect(pageData.profile.name).toBe("Naledi Mokoena");
        expect(pageData.about.intro).toBe("Builder of useful products.");
        expect(pageData.skills.softSkills).toEqual(["Teamwork"]);
        expect(pageData.skills.technicalSkills).toEqual(["JavaScript"]);
        expect(pageData.qualifications.items).toEqual([
            { id: "q1", title: "Systems Development" }
        ]);
    });

    test("fetchPageData falls back cleanly when the user document is missing or Firebase load fails", async () => {
        const missingDocModule = loadProfileFirebaseModule({
            currentUser: { uid: "user-1" },
            getDoc: jest.fn(() =>
                Promise.resolve({
                    data: () => ({}),
                    exists: () => false
                })
            )
        });
        const failure = new Error("firestore down");
        const failingModule = loadProfileFirebaseModule({
            currentUser: { uid: "user-2" },
            getDoc: jest.fn(() => Promise.reject(failure))
        });

        const missingDocData = await missingDocModule.mocks.profileApp.profileGateway.fetchPageData();
        const failedData = await failingModule.mocks.profileApp.profileGateway.fetchPageData();

        expect(missingDocData).toEqual(createDefaultPageData());
        expect(failingModule.mocks.consoleMock.error).toHaveBeenCalledWith(
            "Unable to load applicant profile data from Firebase.",
            failure
        );
        expect(failedData).toEqual(createDefaultPageData());
    });

    test("savePageData rejects when the user is not logged in", async () => {
        const { mocks } = loadProfileFirebaseModule({ authStateUser: null });

        await expect(
            mocks.profileApp.profileGateway.savePageData(createDefaultPageData())
        ).rejects.toThrow("Please log in before saving your applicant profile.");

        expect(mocks.setDoc).not.toHaveBeenCalled();
    });

    test("savePageData merges the page data, saves it with merge mode, and returns a clone", async () => {
        const basePageData = createDefaultPageData();
        basePageData.profile.name = "Base Name";

        const incomingPageData = {
            about: {
                intro: "Curious and proactive."
            },
            profile: {
                name: "Naledi Mokoena"
            },
            qualifications: {
                items: [{ id: "q1", title: "Systems Development" }]
            },
            skills: {
                technicalSkills: ["JavaScript"]
            }
        };
        const { mocks } = loadProfileFirebaseModule({
            currentUser: {
                email: "naledi@example.com",
                uid: "applicant-123"
            },
            defaultPageData: basePageData
        });

        const savedPageData = await mocks.profileApp.profileGateway.savePageData(incomingPageData);

        expect(mocks.setDoc).toHaveBeenCalledWith(
            {
                collectionName: "users",
                db: mocks.db,
                uid: "applicant-123"
            },
            {
                applicantProfile: {
                    about: {
                        intro: "Curious and proactive.",
                        passion: ""
                    },
                    cv: {
                        fileName: "",
                        fileUrl: ""
                    },
                    education: [],
                    personalDetails: {
                        address: "",
                        email: "",
                        phone: ""
                    },
                    profile: {
                        name: "Naledi Mokoena",
                        photoUrl: ""
                    },
                    qualifications: {
                        buttonLabel: "Add qualifications",
                        intro: "",
                        items: [{ id: "q1", title: "Systems Development" }]
                    },
                    skills: {
                        intro: "",
                        softSkills: [],
                        technicalSkills: ["JavaScript"]
                    }
                },
                email: "naledi@example.com"
            },
            { merge: true }
        );
        expect(savedPageData).toEqual(
            expect.objectContaining({
                about: expect.objectContaining({
                    intro: "Curious and proactive."
                }),
                profile: expect.objectContaining({
                    name: "Naledi Mokoena"
                })
            })
        );

        savedPageData.profile.name = "Changed locally";
        expect(mocks.cloneData).toHaveBeenCalled();
    });

    test("mergeProfileData clones nested arrays and objects while ignoring unknown fields", () => {
        const { api } = loadProfileFirebaseModule();
        const merged = api.mergeProfileData(createDefaultPageData(), {
            profile: {
                name: "Naledi Mokoena"
            },
            qualifications: {
                items: [{ id: "q1", title: "Systems Development" }]
            },
            skills: {
                softSkills: ["Communication"],
                technicalSkills: ["JavaScript"]
            },
            unsupportedField: "ignored"
        });

        expect(merged.profile.name).toBe("Naledi Mokoena");
        expect(merged.qualifications.items).toEqual([
            { id: "q1", title: "Systems Development" }
        ]);
        expect(merged.skills.softSkills).toEqual(["Communication"]);
        expect(merged.skills.technicalSkills).toEqual(["JavaScript"]);
        expect(merged.unsupportedField).toBeUndefined();
        expect(api.isPlainObject({ key: "value" })).toBe(true);
        expect(api.isPlainObject([])).toBe(false);
    });
});
