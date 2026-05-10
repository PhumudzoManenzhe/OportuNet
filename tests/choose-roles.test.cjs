const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SCRIPT_PATH = path.resolve(__dirname, "../SignUp_LogIn_pages/chooseRoles.js");

function stripImports(source) {
    return source.replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];\s*$/gm, "");
}

function flushAsyncWork(cycles = 5) {
    return Array.from({ length: cycles }).reduce(
        (promise) => promise.then(() => Promise.resolve()),
        Promise.resolve()
    );
}

function createResolvedLocation(initialHref) {
    let currentUrl = new URL(initialHref);

    return {
        get href() {
            return `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
        },
        set href(value) {
            currentUrl = new URL(value, currentUrl);
        }
    };
}

function createClassList() {
    const tokens = new Set();

    return {
        add: (...names) => names.forEach((name) => tokens.add(name)),
        remove: (...names) => names.forEach((name) => tokens.delete(name)),
        contains: (name) => tokens.has(name)
    };
}

function createFakeNode(initial = {}) {
    const listeners = {};
    const attributes = {};

    return {
        attributes,
        classList: createClassList(),
        disabled: false,
        focus: jest.fn(),
        hidden: false,
        listeners,
        textContent: "",
        value: "",
        addEventListener: jest.fn((eventName, handler) => {
            listeners[eventName] = handler;
        }),
        setAttribute: jest.fn((name, value) => {
            attributes[name] = String(value);
        }),
        ...initial
    };
}

function loadChooseRolesScript(options = {}) {
    const elements = {
        applicantAddress: createFakeNode(),
        applicantBtn: createFakeNode(),
        applicantDetailsForm: createFakeNode({ hidden: true }),
        applicantEmail: createFakeNode(),
        applicantFullName: createFakeNode(),
        applicantPhone: createFakeNode(),
        cancelApplicantDetailsBtn: createFakeNode(),
        cancelRecruiterDetailsBtn: createFakeNode(),
        recruiterBtn: createFakeNode(),
        recruiterDetailsForm: createFakeNode({ hidden: true }),
        recruiterFullName: createFakeNode(),
        recruiterOrganisationName: createFakeNode(),
        roleFeedback: createFakeNode({ hidden: true }),
        saveApplicantDetailsBtn: createFakeNode(),
        saveRecruiterDetailsBtn: createFakeNode()
    };
    const documentMock = {
        getElementById: jest.fn((id) => elements[id] || null)
    };
    const windowMock = {
        location: createResolvedLocation("https://example.test/SignUp_LogIn_pages/chooseRoles.html")
    };
    const alert = jest.fn();
    const consoleMock = { error: jest.fn() };
    const auth = {
        currentUser: Object.prototype.hasOwnProperty.call(options, "currentUser")
            ? options.currentUser
            : {
                email: "user@example.com",
                uid: "user-123"
            }
    };
    const db = { service: "db" };
    const doc = jest.fn((dbArg, collection, uid) => ({ db: dbArg, collection, uid }));
    const setDoc = options.setDoc || jest.fn(() => Promise.resolve());
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
        alert,
        auth,
        console: consoleMock,
        db,
        doc,
        document: documentMock,
        onAuthStateChanged,
        setDoc,
        window: windowMock
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(SCRIPT_PATH, "utf8"))}
globalThis.__testExports = {
    buildApplicantProfile,
    buildRecruiterProfile,
    focusFirstInvalidApplicantField,
    focusFirstInvalidRecruiterField,
    handleApplicantSubmit,
    handleRecruiterSubmit,
    hideRoleForms,
    prefillRoleDetails,
    readApplicantDetails,
    readRecruiterDetails,
    readValue,
    resolveCurrentUser,
    setFeedback,
    setFieldValueIfEmpty,
    setRole,
    setSavingState,
    showApplicantDetails,
    showRecruiterDetails,
    validateApplicantDetails,
    validateRecruiterDetails
};`;

    new vm.Script(source, { filename: SCRIPT_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            alert,
            auth,
            consoleMock,
            db,
            doc,
            documentMock,
            elements,
            onAuthStateChanged,
            setDoc,
            windowMock
        }
    };
}

const applicantDetails = {
    address: "",
    email: "applicant@example.com",
    fullName: "Naledi Mokoena",
    phone: "0712345678"
};

const recruiterDetails = {
    fullName: "Mpho Dlamini",
    organisationName: ""
};

describe("chooseRoles.js", () => {
    test("initializes the role controls, pre-fills email, and toggles the applicant form", () => {
        const { api, mocks } = loadChooseRolesScript();

        expect(mocks.elements.applicantEmail.value).toBe("user@example.com");
        expect(mocks.elements.applicantBtn.addEventListener).toHaveBeenCalledWith("click", api.showApplicantDetails);
        expect(mocks.elements.recruiterBtn.addEventListener).toHaveBeenCalledWith("click", api.showRecruiterDetails);

        api.showApplicantDetails();

        expect(mocks.elements.applicantDetailsForm.hidden).toBe(false);
        expect(mocks.elements.recruiterDetailsForm.hidden).toBe(true);
        expect(mocks.elements.applicantBtn.classList.contains("role-btn-selected")).toBe(true);
        expect(mocks.elements.applicantBtn.attributes["aria-expanded"]).toBe("true");
        expect(mocks.elements.recruiterBtn.attributes["aria-expanded"]).toBe("false");
        expect(mocks.elements.roleFeedback.hidden).toBe(false);
        expect(mocks.elements.applicantFullName.focus).toHaveBeenCalled();

        mocks.elements.applicantFullName.value = "Naledi Mokoena";
        mocks.elements.applicantEmail.value = "applicant@example.com";
        api.focusFirstInvalidApplicantField();
        expect(mocks.elements.applicantPhone.focus).toHaveBeenCalled();

        api.hideRoleForms();
        expect(mocks.elements.applicantDetailsForm.hidden).toBe(true);
        expect(mocks.elements.recruiterDetailsForm.hidden).toBe(true);
        expect(mocks.elements.roleFeedback.hidden).toBe(true);
    });

    test("toggles the recruiter form and validates that recruiter name is required", () => {
        const { api, mocks } = loadChooseRolesScript();

        api.showRecruiterDetails();

        expect(mocks.elements.recruiterDetailsForm.hidden).toBe(false);
        expect(mocks.elements.applicantDetailsForm.hidden).toBe(true);
        expect(mocks.elements.recruiterBtn.classList.contains("role-btn-selected")).toBe(true);
        expect(mocks.elements.recruiterFullName.focus).toHaveBeenCalled();
        expect(api.validateRecruiterDetails({ fullName: "", organisationName: "" })).toBe(false);
        expect(mocks.elements.roleFeedback.textContent).toBe("Please add your name before continuing.");

        mocks.elements.recruiterFullName.focus.mockClear();
        mocks.elements.recruiterFullName.value = "Mpho Dlamini";
        api.focusFirstInvalidRecruiterField();
        expect(mocks.elements.recruiterFullName.focus).not.toHaveBeenCalled();
    });

    test("setRole stops when there is no logged-in user", async () => {
        const { api, mocks } = loadChooseRolesScript({
            currentUser: null,
            authStateUser: null
        });

        await api.setRole("applicant", applicantDetails);
        await flushAsyncWork();

        expect(mocks.onAuthStateChanged).toHaveBeenCalled();
        expect(mocks.setDoc).not.toHaveBeenCalled();
        expect(mocks.alert).toHaveBeenCalledWith("User not logged in");
    });

    test("setRole saves applicant profile details with address optional", async () => {
        const { api, mocks } = loadChooseRolesScript();

        expect(api.validateApplicantDetails(applicantDetails)).toBe(true);
        expect(api.buildApplicantProfile(applicantDetails)).toEqual({
            profile: {
                addSectionButton: "Add section",
                name: "Naledi Mokoena",
                photoUrl: ""
            },
            personalDetails: {
                address: "",
                email: "applicant@example.com",
                phone: "0712345678"
            }
        });

        await api.setRole("applicant", applicantDetails);
        await flushAsyncWork();

        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "users", "user-123");
        expect(mocks.setDoc).toHaveBeenCalledWith(
            { db: mocks.db, collection: "users", uid: "user-123" },
            {
                applicantProfile: {
                    profile: {
                        addSectionButton: "Add section",
                        name: "Naledi Mokoena",
                        photoUrl: ""
                    },
                    personalDetails: {
                        address: "",
                        email: "applicant@example.com",
                        phone: "0712345678"
                    }
                },
                displayName: "Naledi Mokoena",
                email: "applicant@example.com",
                role: "applicant"
            },
            { merge: true }
        );
        expect(mocks.windowMock.location.href).toBe("/Applicant_homepage/index.html");
        expect(mocks.elements.saveApplicantDetailsBtn.disabled).toBe(false);
    });

    test("applicant validation only blocks required identity and contact fields", () => {
        const { api, mocks } = loadChooseRolesScript();

        mocks.elements.applicantFullName.value = "Naledi Mokoena";
        mocks.elements.applicantEmail.value = "applicant@example.com";
        mocks.elements.applicantPhone.value = "";

        expect(api.readApplicantDetails()).toEqual({
            address: "",
            email: "applicant@example.com",
            fullName: "Naledi Mokoena",
            phone: ""
        });
        expect(api.validateApplicantDetails(api.readApplicantDetails())).toBe(false);
        expect(mocks.elements.roleFeedback.textContent).toBe(
            "Please add your full name, email address, and phone number before continuing."
        );
        expect(mocks.elements.applicantPhone.focus).toHaveBeenCalled();
    });

    test("setRole saves recruiter name for personalized dashboard greetings", async () => {
        const { api, mocks } = loadChooseRolesScript();

        expect(api.buildRecruiterProfile(recruiterDetails)).toEqual({
            companyName: "Mpho Dlamini",
            contactName: "Mpho Dlamini",
            fullName: "Mpho Dlamini",
            organisationName: ""
        });

        await api.setRole("recruiter", recruiterDetails);
        await flushAsyncWork();

        expect(mocks.setDoc).toHaveBeenCalledWith(
            { db: mocks.db, collection: "users", uid: "user-123" },
            {
                companyName: "Mpho Dlamini",
                displayName: "Mpho Dlamini",
                email: "user@example.com",
                recruiterProfile: {
                    companyName: "Mpho Dlamini",
                    contactName: "Mpho Dlamini",
                    fullName: "Mpho Dlamini",
                    organisationName: ""
                },
                role: "recruiter"
            },
            { merge: true }
        );
        expect(mocks.windowMock.location.href).toBe("/Recruiter_homepage/index.html");
    });

    test("form submissions read field values and cancel buttons hide open forms", async () => {
        const { api, mocks } = loadChooseRolesScript();

        mocks.elements.applicantFullName.value = "Naledi Mokoena";
        mocks.elements.applicantEmail.value = "applicant@example.com";
        mocks.elements.applicantPhone.value = "0712345678";
        mocks.elements.applicantAddress.value = "";
        mocks.elements.recruiterFullName.value = "Mpho Dlamini";
        mocks.elements.recruiterOrganisationName.value = "Acme Labs";

        mocks.elements.applicantBtn.listeners.click();
        const applicantEvent = { preventDefault: jest.fn() };
        api.handleApplicantSubmit(applicantEvent);
        await flushAsyncWork();

        expect(applicantEvent.preventDefault).toHaveBeenCalled();
        expect(mocks.setDoc).toHaveBeenLastCalledWith(
            { db: mocks.db, collection: "users", uid: "user-123" },
            expect.objectContaining({
                displayName: "Naledi Mokoena",
                role: "applicant"
            }),
            { merge: true }
        );

        mocks.elements.recruiterBtn.listeners.click();
        const recruiterEvent = { preventDefault: jest.fn() };
        mocks.elements.recruiterDetailsForm.listeners.submit(recruiterEvent);
        await flushAsyncWork();

        expect(recruiterEvent.preventDefault).toHaveBeenCalled();
        expect(api.readRecruiterDetails()).toEqual({
            fullName: "Mpho Dlamini",
            organisationName: "Acme Labs"
        });
        expect(mocks.setDoc).toHaveBeenLastCalledWith(
            { db: mocks.db, collection: "users", uid: "user-123" },
            expect.objectContaining({
                companyName: "Acme Labs",
                displayName: "Mpho Dlamini",
                recruiterProfile: expect.objectContaining({
                    companyName: "Acme Labs",
                    contactName: "Mpho Dlamini"
                }),
                role: "recruiter"
            }),
            { merge: true }
        );

        mocks.elements.cancelRecruiterDetailsBtn.listeners.click();
        expect(mocks.elements.applicantDetailsForm.hidden).toBe(true);
        expect(mocks.elements.recruiterDetailsForm.hidden).toBe(true);
    });

    test("setRole alerts when saving the selected role fails", async () => {
        const saveError = new Error("permission denied");
        const { api, mocks } = loadChooseRolesScript({
            setDoc: jest.fn(() => Promise.reject(saveError))
        });

        await api.setRole("recruiter", recruiterDetails);
        await flushAsyncWork();

        expect(mocks.consoleMock.error).toHaveBeenCalledWith(saveError);
        expect(mocks.alert).toHaveBeenCalledWith("Error saving role");
        expect(mocks.elements.recruiterBtn.disabled).toBe(false);
    });

    test("small helpers safely handle existing values and missing feedback nodes", () => {
        const { api, mocks } = loadChooseRolesScript();
        const field = createFakeNode({ value: "Existing" });

        api.setFieldValueIfEmpty(field, "Replacement");
        expect(field.value).toBe("Existing");

        api.setFieldValueIfEmpty(field, "");
        expect(field.value).toBe("Existing");

        expect(api.readValue(null)).toBe("");
        api.setSavingState(true);
        expect(mocks.elements.applicantBtn.disabled).toBe(true);
        api.setSavingState(false);
        expect(mocks.elements.applicantBtn.disabled).toBe(false);
    });
});
