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

function createFakeButton() {
    const listeners = {};

    return {
        listeners,
        addEventListener: jest.fn((eventName, handler) => {
            listeners[eventName] = handler;
        })
    };
}

function loadChooseRolesScript(overrides = {}) {
    const applicantBtn = createFakeButton();
    const recruiterBtn = createFakeButton();
    const documentMock = {
        getElementById: jest.fn((id) => {
            if (id === "applicantBtn") {
                return applicantBtn;
            }

            if (id === "recruiterBtn") {
                return recruiterBtn;
            }

            return null;
        })
    };
    const windowMock = {
        location: createResolvedLocation("https://example.test/SignUp_LogIn_pages/chooseRoles.html")
    };
    const alert = jest.fn();
    const consoleMock = { error: jest.fn() };
    const auth = {
        currentUser: {
            email: "user@example.com",
            uid: "user-123"
        }
    };
    const db = { service: "db" };
    const doc = jest.fn((dbArg, collection, uid) => ({ db: dbArg, collection, uid }));
    const setDoc = jest.fn(() => Promise.resolve());
    const context = vm.createContext({
        alert,
        auth,
        console: consoleMock,
        db,
        doc,
        document: documentMock,
        setDoc,
        window: windowMock,
        ...overrides
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(SCRIPT_PATH, "utf8"))}
globalThis.__testExports = { setRole };`;

    new vm.Script(source, { filename: SCRIPT_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            alert,
            applicantBtn,
            auth,
            consoleMock,
            db,
            doc,
            recruiterBtn,
            setDoc,
            windowMock
        }
    };
}

describe("chooseRoles.js", () => {
    test("setRole stops when there is no logged-in user", () => {
        const { api, mocks } = loadChooseRolesScript({
            auth: { currentUser: null }
        });

        api.setRole("applicant");

        expect(mocks.setDoc).not.toHaveBeenCalled();
        expect(mocks.alert).toHaveBeenCalledWith("User not logged in");
    });

    test("setRole saves the applicant role and redirects to the applicant homepage", async () => {
        const { api, mocks } = loadChooseRolesScript();

        api.setRole("applicant");
        await flushAsyncWork();

        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "users", "user-123");
        expect(mocks.setDoc).toHaveBeenCalledWith(
            { db: mocks.db, collection: "users", uid: "user-123" },
            {
                email: "user@example.com",
                role: "applicant"
            }
        );
        expect(mocks.windowMock.location.href).toBe("/Applicant_homepage/index.html");
    });

    test("setRole alerts when saving the selected role fails", async () => {
        const saveError = new Error("permission denied");
        const { api, mocks } = loadChooseRolesScript({
            setDoc: jest.fn(() => Promise.reject(saveError))
        });

        api.setRole("recruiter");
        await flushAsyncWork();

        expect(mocks.consoleMock.error).toHaveBeenCalledWith(saveError);
        expect(mocks.alert).toHaveBeenCalledWith("Error saving role");
    });

    test("role buttons are wired to save the matching applicant or recruiter role", async () => {
        const { mocks } = loadChooseRolesScript();

        mocks.applicantBtn.listeners.click();
        await flushAsyncWork();
        expect(mocks.setDoc).toHaveBeenLastCalledWith(
            { db: mocks.db, collection: "users", uid: "user-123" },
            {
                email: "user@example.com",
                role: "applicant"
            }
        );

        mocks.recruiterBtn.listeners.click();
        await flushAsyncWork();
        expect(mocks.setDoc).toHaveBeenLastCalledWith(
            { db: mocks.db, collection: "users", uid: "user-123" },
            {
                email: "user@example.com",
                role: "recruiter"
            }
        );
    });
});
