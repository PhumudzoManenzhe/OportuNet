const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SCRIPT_PATH = path.resolve(__dirname, "../SignUp_LogIn_pages/signup_logIn.js");

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
        onclick: null,
        textContent: "",
        type: "password",
        value: "",
        addEventListener: jest.fn((eventName, handler) => {
            listeners[eventName] = handler;
        }),
        querySelector: jest.fn(() => null),
        ...initial
    };
}

function loadSignupLoginScript(overrides = {}) {
    const signupEmailInput = createFakeNode({ value: "signup@example.com", type: "email" });
    const loginEmailInput = createFakeNode({ value: "login@example.com", type: "email" });
    const passwordInput = createFakeNode({ value: "Sup3rSecret!", type: "password" });
    const forgotPasswordLink = createFakeNode();
    const togglePassword = createFakeNode({ textContent: "Show" });
    const signupForm = createFakeNode({
        querySelector: jest.fn((selector) => {
            if (selector === 'input[type="email"]') {
                return signupEmailInput;
            }

            return null;
        })
    });
    const loginForm = createFakeNode();
    const googleButtons = [createFakeNode(), createFakeNode()];
    const documentListeners = {};
    const elements = {
        email: loginEmailInput,
        forgotPassword: forgotPasswordLink,
        password: passwordInput,
        signupForm,
        togglePassword
    };
    const documentMock = {
        addEventListener: jest.fn((eventName, handler) => {
            documentListeners[eventName] = handler;
        }),
        getElementById: jest.fn((id) => elements[id] || null),
        querySelector: jest.fn((selector) => {
            if (selector === ".login_form form") {
                return loginForm;
            }

            return null;
        }),
        querySelectorAll: jest.fn((selector) => {
            if (selector === ".google-btn, .option a") {
                return googleButtons;
            }

            return [];
        })
    };
    const windowMock = { location: { href: "about:blank" } };
    const alert = jest.fn();
    const consoleMock = { error: jest.fn() };
    const auth = { service: "auth" };
    const db = { service: "db" };
    const googleProviderInstance = { provider: "google" };
    const GoogleAuthProvider = jest.fn(() => googleProviderInstance);
    const createUserWithEmailAndPassword = jest.fn(() =>
        Promise.resolve({ user: { uid: "created-user" } })
    );
    const signInWithPopup = jest.fn(() =>
        Promise.resolve({ user: { uid: "google-user" } })
    );
    const signInWithEmailAndPassword = jest.fn(() =>
        Promise.resolve({ user: { uid: "login-user" } })
    );
    const sendPasswordResetEmail = jest.fn(() => Promise.resolve());
    const doc = jest.fn((dbArg, collection, uid) => ({ db: dbArg, collection, uid }));
    const getDoc = jest.fn(() =>
        Promise.resolve({
            exists: () => false,
            data: () => ({ role: "applicant" })
        })
    );
    const context = vm.createContext({
        GoogleAuthProvider,
        alert,
        auth,
        console: consoleMock,
        createUserWithEmailAndPassword,
        db,
        doc,
        document: documentMock,
        getDoc,
        sendPasswordResetEmail,
        signInWithEmailAndPassword,
        signInWithPopup,
        window: windowMock,
        ...overrides
    });

    context.globalThis = context;

    const source = `${stripImports(fs.readFileSync(SCRIPT_PATH, "utf8"))}
globalThis.__testExports = { googleLogin, signUpUser, logInUser, forgotPassword };`;

    new vm.Script(source, { filename: SCRIPT_PATH }).runInContext(context);

    return {
        api: context.__testExports,
        mocks: {
            GoogleAuthProvider,
            alert,
            auth,
            consoleMock,
            createUserWithEmailAndPassword,
            db,
            doc,
            documentListeners,
            documentMock,
            elements,
            getDoc,
            googleButtons,
            googleProviderInstance,
            loginForm,
            sendPasswordResetEmail,
            signInWithEmailAndPassword,
            signInWithPopup,
            signupEmailInput,
            signupForm,
            togglePassword,
            windowMock
        }
    };
}

describe("signup_logIn.js", () => {
    test("signUpUser creates an account and redirects to the login page", async () => {
        const { api, mocks } = loadSignupLoginScript();

        api.signUpUser("new.user@example.com", "abc12345");
        await flushAsyncWork();

        expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
            mocks.auth,
            "new.user@example.com",
            "abc12345"
        );
        expect(mocks.alert).toHaveBeenCalledWith("Account Created!");
        expect(mocks.windowMock.location.href).toBe("./logIn.html");
    });

    test("googleLogin sends first-time Google users to role selection", async () => {
        const { api, mocks } = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => false
                })
            )
        });

        api.googleLogin();
        await flushAsyncWork();

        expect(mocks.GoogleAuthProvider).toHaveBeenCalledTimes(1);
        expect(mocks.signInWithPopup).toHaveBeenCalledWith(
            mocks.auth,
            mocks.googleProviderInstance
        );
        expect(mocks.doc).toHaveBeenCalledWith(mocks.db, "users", "google-user");
        expect(mocks.windowMock.location.href).toBe("./chooseRoles.html");
    });

    test("logInUser routes existing recruiters to the recruiter homepage", async () => {
        const { api, mocks } = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => true,
                    data: () => ({ role: "recruiter" })
                })
            )
        });

        api.logInUser("recruiter@example.com", "safe-pass");
        await flushAsyncWork();

        expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
            mocks.auth,
            "recruiter@example.com",
            "safe-pass"
        );
        expect(mocks.windowMock.location.href).toBe("../Recruiter_homepage/index.html");
    });

    test("logInUser alerts when Firestore user loading fails", async () => {
        const firestoreError = new Error("lookup failed");
        const { api, mocks } = loadSignupLoginScript({
            getDoc: jest.fn(() => Promise.reject(firestoreError))
        });

        api.logInUser("applicant@example.com", "safe-pass");
        await flushAsyncWork();

        expect(mocks.consoleMock.error).toHaveBeenCalledWith(
            "Firestore error:",
            firestoreError
        );
        expect(mocks.alert).toHaveBeenCalledWith("Failed to load user data");
    });

    test("forgotPassword stops early when the email field is empty", () => {
        const { api, mocks } = loadSignupLoginScript();

        api.forgotPassword("");

        expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(mocks.alert).toHaveBeenCalledWith("Please enter your email first.");
    });

    test("forgotPassword surfaces Firebase validation errors with friendly alerts", async () => {
        const { api, mocks } = loadSignupLoginScript({
            sendPasswordResetEmail: jest.fn(() =>
                Promise.reject({ code: "auth/invalid-email" })
            )
        });

        api.forgotPassword("not-an-email");
        await flushAsyncWork();

        expect(mocks.alert).toHaveBeenCalledWith("Invalid email address.");
    });

    test("DOMContentLoaded wires the signup and login form submissions to Firebase auth", async () => {
        const { mocks } = loadSignupLoginScript();

        mocks.documentListeners.DOMContentLoaded();

        const signupEvent = { preventDefault: jest.fn() };
        const loginEvent = { preventDefault: jest.fn() };

        mocks.signupForm.listeners.submit(signupEvent);
        mocks.loginForm.listeners.submit(loginEvent);
        await flushAsyncWork();

        expect(signupEvent.preventDefault).toHaveBeenCalled();
        expect(loginEvent.preventDefault).toHaveBeenCalled();
        expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
            mocks.auth,
            "signup@example.com",
            "Sup3rSecret!"
        );
        expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
            mocks.auth,
            "login@example.com",
            "Sup3rSecret!"
        );
    });

    test("DOMContentLoaded wires Google login, forgot password, and password visibility toggle", async () => {
        const { mocks } = loadSignupLoginScript();

        mocks.documentListeners.DOMContentLoaded();

        const googleEvent = { preventDefault: jest.fn() };
        const forgotPasswordEvent = { preventDefault: jest.fn() };

        mocks.googleButtons[0].onclick(googleEvent);
        mocks.elements.forgotPassword.listeners.click(forgotPasswordEvent);
        await flushAsyncWork();

        expect(googleEvent.preventDefault).toHaveBeenCalled();
        expect(mocks.signInWithPopup).toHaveBeenCalledWith(
            mocks.auth,
            mocks.googleProviderInstance
        );
        expect(forgotPasswordEvent.preventDefault).toHaveBeenCalled();
        expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith(
            mocks.auth,
            "login@example.com"
        );

        mocks.togglePassword.listeners.click();
        expect(mocks.elements.password.type).toBe("text");
        expect(mocks.togglePassword.textContent).toBe("Hide");

        mocks.togglePassword.listeners.click();
        expect(mocks.elements.password.type).toBe("password");
        expect(mocks.togglePassword.textContent).toBe("Show");
    });
});
