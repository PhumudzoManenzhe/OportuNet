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
        appendChild: jest.fn(),
        classList: {
            add: jest.fn(),
            contains: jest.fn(() => false),
            remove: jest.fn()
        },
        closest: jest.fn(() => null),
        remove: jest.fn(),
        removeAttribute: jest.fn(),
        setAttribute: jest.fn(),
        insertAdjacentElement: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        ...initial
    };
}

function loadSignupLoginScript(overrides = {}) {
    const signupEmailInput = createFakeNode({ value: "signup@example.com", type: "email" });
    const loginEmailInput = createFakeNode({ value: "login@example.com", type: "email" });
    const passwordInput = createFakeNode({ value: "Sup3rSecret!", type: "password" });
    const confirmPasswordInput = createFakeNode({ value: "Sup3rSecret!", type: "password" });
    const forgotPasswordLink = createFakeNode();
    const togglePassword = createFakeNode({ dataset: { target: "password" }, textContent: "Show" });
    const toggleConfirmPassword = createFakeNode({
        dataset: { target: "confirmPassword" },
        textContent: "Show"
    });
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
        confirmPassword: confirmPasswordInput,
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

            if (selector === ".toggle-password") {
                return [togglePassword, toggleConfirmPassword];
            }

            return [];
        })
    };
    const windowMock = {
        location: createResolvedLocation("https://example.test/SignUp_LogIn_pages/index.html")
    };
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
    const collection = jest.fn((dbArg, name) => ({ db: dbArg, name }));
    const doc = jest.fn((dbArg, collection, uid) => ({ db: dbArg, collection, uid }));
    const getDoc = jest.fn(() =>
        Promise.resolve({
            exists: () => false,
            data: () => ({ role: "applicant" })
        })
    );
    const getDocs = jest.fn(() => Promise.resolve({ docs: [] }));
    const query = jest.fn((...args) => ({ args }));
    const setDoc = jest.fn(() => Promise.resolve());
    const where = jest.fn((...args) => ({ args }));
    const context = vm.createContext({
        collection,
        GoogleAuthProvider,
        alert,
        auth,
        console: consoleMock,
        createUserWithEmailAndPassword,
        db,
        doc,
        document: documentMock,
        getDoc,
        getDocs,
        query,
        sendPasswordResetEmail,
        setDoc,
        signInWithEmailAndPassword,
        signInWithPopup,
        where,
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
            collection,
            consoleMock,
            createUserWithEmailAndPassword,
            db,
            doc,
            documentListeners,
            documentMock,
            elements,
            getDoc,
            getDocs,
            googleButtons,
            googleProviderInstance,
            loginForm,
            query,
            sendPasswordResetEmail,
            setDoc,
            signInWithEmailAndPassword,
            signInWithPopup,
            confirmPasswordInput,
            signupEmailInput,
            signupForm,
            toggleConfirmPassword,
            togglePassword,
            where,
            windowMock
        }
    };
}

describe("signup_logIn.js", () => {
    test("signUpUser creates an account and redirects to role selection", async () => {
        const { api, mocks } = loadSignupLoginScript();

        api.signUpUser("new.user@example.com", "abc12345");
        await flushAsyncWork();

        expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
            mocks.auth,
            "new.user@example.com",
            "abc12345"
        );
        expect(mocks.alert).toHaveBeenCalledWith(
            "Account created! Choose your role to finish setup."
        );
        expect(mocks.windowMock.location.href).toBe("/SignUp_LogIn_pages/chooseRoles.html");
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
        expect(mocks.windowMock.location.href).toBe("/SignUp_LogIn_pages/chooseRoles.html");
    });

    test("googleLogin blocks duplicate Google signup accounts without leaving the page", async () => {
        const signOut = jest.fn(() => Promise.resolve());
        const googleButton = createFakeNode();
        const message = {
            className: "",
            textContent: "",
            setAttribute: jest.fn()
        };
        const { api, mocks } = loadSignupLoginScript({
            signOut,
            document: {
                addEventListener: jest.fn(),
                createElement: jest.fn(() => message),
                getElementById: jest.fn((id) => (id === "signupForm" ? createFakeNode() : null)),
                querySelector: jest.fn((selector) => {
                    if (selector === ".google-btn") return googleButton;
                    return null;
                }),
                querySelectorAll: jest.fn(() => [])
            },
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => true,
                    data: () => ({ role: "applicant" })
                })
            )
        });

        api.googleLogin("signup");
        await flushAsyncWork();

        expect(mocks.alert).not.toHaveBeenCalled();
        expect(message.className).toBe("google-message error");
        expect(message.textContent).toBe("An account with this Google email already exists.");
        expect(googleButton.insertAdjacentElement).toHaveBeenCalledWith("afterend", message);
        expect(signOut).toHaveBeenCalledWith(mocks.auth);
        expect(mocks.windowMock.location.href).toBe("/SignUp_LogIn_pages/index.html");
    });

    test("googleLogin shows missing login accounts under the Google button", async () => {
        const signOut = jest.fn(() => Promise.resolve());
        const googleButton = createFakeNode();
        const message = {
            className: "",
            textContent: "",
            setAttribute: jest.fn()
        };
        const { api, mocks } = loadSignupLoginScript({
            signOut,
            document: {
                addEventListener: jest.fn(),
                createElement: jest.fn(() => message),
                getElementById: jest.fn(() => null),
                querySelector: jest.fn((selector) => {
                    if (selector === ".login_form form") return createFakeNode();
                    if (selector === ".option a") return googleButton;
                    return null;
                }),
                querySelectorAll: jest.fn(() => [])
            },
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => false
                })
            )
        });

        api.googleLogin("login");
        await flushAsyncWork();

        expect(mocks.alert).not.toHaveBeenCalled();
        expect(message.className).toBe("google-message error");
        expect(message.textContent).toBe("No account found for this Google email.");
        expect(googleButton.insertAdjacentElement).toHaveBeenCalledWith("afterend", message);
        expect(signOut).toHaveBeenCalledWith(mocks.auth);
        expect(mocks.windowMock.location.href).toBe("/SignUp_LogIn_pages/index.html");
    });

    test("googleLogin sends admins to the admin dashboard", async () => {
        const { api, mocks } = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => true,
                    data: () => ({ role: "admin" })
                })
            )
        });

        api.googleLogin("login");
        await flushAsyncWork();

        expect(mocks.windowMock.location.href).toBe("/ADMIN_DASHBOARD_PAGE/index.html");
    });

    test("googleLogin sends unknown roles to role selection", async () => {
        const { api, mocks } = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => true,
                    data: () => ({ role: "unknown" })
                })
            )
        });

        api.googleLogin("login");
        await flushAsyncWork();

        expect(mocks.windowMock.location.href).toBe("/SignUp_LogIn_pages/chooseRoles.html");
    });

    test("googleLogin surfaces popup and Firestore failures", async () => {
        const popupError = { code: "auth/popup-closed-by-user" };
        const firestoreError = new Error("lookup failed");
        const popupFailure = loadSignupLoginScript({
            signInWithPopup: jest.fn(() => Promise.reject(popupError))
        });

        popupFailure.api.googleLogin("login");
        await flushAsyncWork();

        expect(popupFailure.mocks.alert).toHaveBeenCalledWith("Sign-in was canceled.");

        const firestoreFailure = loadSignupLoginScript({
            getDoc: jest.fn(() => Promise.reject(firestoreError))
        });

        firestoreFailure.api.googleLogin("login");
        await flushAsyncWork();

        expect(firestoreFailure.mocks.consoleMock.error).toHaveBeenCalledWith(
            "Firestore error:",
            firestoreError
        );
        expect(firestoreFailure.mocks.alert).toHaveBeenCalledWith("Failed to load user data");
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
        expect(mocks.windowMock.location.href).toBe("/Recruiter_homepage/index.html");
    });

    test("logInUser routes applicants, admins, and missing roles correctly", async () => {
        const applicantLogin = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => true,
                    data: () => ({ role: "applicant" })
                })
            )
        });

        applicantLogin.api.logInUser("applicant@example.com", "safe-pass");
        await flushAsyncWork();

        expect(applicantLogin.mocks.windowMock.location.href).toBe(
            "/Applicant_homepage/index.html"
        );

        const adminLogin = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => true,
                    data: () => ({ role: "admin" })
                })
            )
        });

        adminLogin.api.logInUser("admin@example.com", "safe-pass");
        await flushAsyncWork();

        expect(adminLogin.mocks.windowMock.location.href).toBe(
            "/ADMIN_DASHBOARD_PAGE/index.html"
        );

        const missingRoleLogin = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => true,
                    data: () => ({ role: "unknown" })
                })
            )
        });

        missingRoleLogin.api.logInUser("unknown@example.com", "safe-pass");
        await flushAsyncWork();

        expect(missingRoleLogin.mocks.windowMock.location.href).toBe(
            "/SignUp_LogIn_pages/chooseRoles.html"
        );
    });

    test("logInUser sends users without a profile to role selection", async () => {
        const { api, mocks } = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => false
                })
            )
        });

        api.logInUser("new@example.com", "safe-pass");
        await flushAsyncWork();

        expect(mocks.windowMock.location.href).toBe("/SignUp_LogIn_pages/chooseRoles.html");
    });

    test("logInUser falls back to an email-matched Firestore profile and syncs it to the auth uid", async () => {
        const manualAdminSnapshot = {
            id: "manual-admin-doc",
            data: () => ({
                accountStatus: "active",
                email: "admin@example.com",
                role: "admin"
            })
        };
        const { api, mocks } = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => false
                })
            ),
            getDocs: jest.fn(() => Promise.resolve({ docs: [manualAdminSnapshot] }))
        });

        api.logInUser("admin@example.com", "safe-pass");
        await flushAsyncWork();

        expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "users");
        expect(mocks.where).toHaveBeenCalledWith("email", "==", "admin@example.com");
        expect(mocks.setDoc).toHaveBeenCalledWith(
            { db: mocks.db, collection: "users", uid: "login-user" },
            expect.objectContaining({
                email: "admin@example.com",
                role: "admin"
            }),
            { merge: true }
        );
        expect(mocks.windowMock.location.href).toBe("/ADMIN_DASHBOARD_PAGE/index.html");
    });

    test("login blocks suspended accounts before routing into the app", async () => {
        const signOut = jest.fn(() => Promise.resolve());
        const { api, mocks } = loadSignupLoginScript({
            getDoc: jest.fn(() =>
                Promise.resolve({
                    exists: () => true,
                    data: () => ({ accountStatus: "suspended", role: "recruiter" })
                })
            ),
            signOut
        });

        api.logInUser("suspended@example.com", "safe-pass");
        await flushAsyncWork();

        expect(signOut).toHaveBeenCalledWith(mocks.auth);
        expect(mocks.alert).toHaveBeenCalledWith(
            "This account has been suspended. Please contact the administrator."
        );
        expect(mocks.windowMock.location.href).toBe("/SignUp_LogIn_pages/index.html");
    });

    test("logInUser surfaces Firebase auth failures", async () => {
        const { api, mocks } = loadSignupLoginScript({
            signInWithEmailAndPassword: jest.fn(() =>
                Promise.reject({ code: "auth/invalid-credential" })
            )
        });

        api.logInUser("wrong@example.com", "bad-pass");
        await flushAsyncWork();

        expect(mocks.alert).toHaveBeenCalledWith(
            "Incorrect email or password. Please try again."
        );
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

    test("forgotPassword focuses the email field when available", () => {
        const focus = jest.fn();
        const { api, mocks } = loadSignupLoginScript();
        mocks.elements.email.focus = focus;

        api.forgotPassword("");

        expect(focus).toHaveBeenCalled();
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

    test("DOMContentLoaded blocks signup when passwords do not match", async () => {
        const { mocks } = loadSignupLoginScript();

        mocks.confirmPasswordInput.value = "DifferentPass!";
        mocks.documentListeners.DOMContentLoaded();

        const signupEvent = { preventDefault: jest.fn() };

        mocks.signupForm.listeners.submit(signupEvent);
        await flushAsyncWork();

        expect(signupEvent.preventDefault).toHaveBeenCalled();
        expect(mocks.alert).toHaveBeenCalledWith("Passwords do not match.");
        expect(mocks.createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    test("DOMContentLoaded renders password mismatch under confirm password when inline UI is available", async () => {
        const removedMessage = { remove: jest.fn() };
        const invalidField = {
            classList: { remove: jest.fn() },
            removeAttribute: jest.fn()
        };
        const confirmWrapper = { appendChild: jest.fn() };
        const message = {
            className: "",
            textContent: "",
            setAttribute: jest.fn()
        };
        const signupEmailInput = createFakeNode({ value: "signup@example.com", type: "email" });
        const passwordInput = createFakeNode({ value: "Sup3rSecret!", type: "password" });
        const confirmPasswordInput = createFakeNode({
            value: "DifferentPass!",
            closest: jest.fn(() => confirmWrapper),
            type: "password"
        });
        const signupForm = createFakeNode({
            querySelector: jest.fn((selector) => {
                if (selector === 'input[type="email"]') return signupEmailInput;
                return null;
            }),
            querySelectorAll: jest.fn((selector) => {
                if (selector === ".field-message, .form-message, .google-message") return [removedMessage];
                if (selector === ".has-error") return [invalidField];
                return [];
            })
        });
        const documentMock = {
            addEventListener: jest.fn((eventName, handler) => {
                if (eventName === "DOMContentLoaded") handler();
            }),
            createElement: jest.fn(() => message),
            getElementById: jest.fn((id) => {
                if (id === "signupForm") return signupForm;
                if (id === "password") return passwordInput;
                if (id === "confirmPassword") return confirmPasswordInput;
                return null;
            }),
            querySelector: jest.fn(() => null),
            querySelectorAll: jest.fn(() => [])
        };
        const { mocks } = loadSignupLoginScript({ document: documentMock });

        const signupEvent = { preventDefault: jest.fn() };
        signupForm.listeners.submit(signupEvent);

        expect(removedMessage.remove).toHaveBeenCalled();
        expect(invalidField.classList.remove).toHaveBeenCalledWith("has-error");
        expect(invalidField.removeAttribute).toHaveBeenCalledWith("aria-invalid");
        expect(confirmPasswordInput.classList.add).toHaveBeenCalledWith("has-error");
        expect(confirmPasswordInput.setAttribute).toHaveBeenCalledWith("aria-invalid", "true");
        expect(message.className).toBe("field-message error");
        expect(message.textContent).toBe("Passwords do not match.");
        expect(message.setAttribute).toHaveBeenCalledWith("role", "alert");
        expect(confirmWrapper.appendChild).toHaveBeenCalledWith(message);
        expect(mocks.createUserWithEmailAndPassword).not.toHaveBeenCalled();
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

    test("renders inline form messages when DOM APIs are available", async () => {
        const appendedToForm = [];
        const message = {
            className: "",
            textContent: "",
            setAttribute: jest.fn()
        };
        const form = {
            appendChild: jest.fn((node) => appendedToForm.push(node)),
            querySelectorAll: jest.fn(() => [])
        };
        const documentMock = {
            addEventListener: jest.fn(),
            createElement: jest.fn(() => message),
            getElementById: jest.fn((id) => (id === "signupForm" ? form : null)),
            querySelector: jest.fn(() => null)
        };
        const { api, mocks } = loadSignupLoginScript({
            document: documentMock,
            setTimeout: (callback) => callback()
        });

        api.signUpUser("new.user@example.com", "abc12345");
        await flushAsyncWork();

        expect(mocks.alert).not.toHaveBeenCalled();
        expect(message.className).toBe("form-message success");
        expect(message.textContent).toBe("Account created! Choose your role to finish setup.");
        expect(message.setAttribute).toHaveBeenCalledWith("role", "status");
        expect(form.appendChild).toHaveBeenCalledWith(message);
        expect(appendedToForm).toEqual([message]);
    });

    test("renders inline Firebase errors under the matching field", async () => {
        const emailWrapper = { appendChild: jest.fn() };
        const passwordWrapper = { appendChild: jest.fn() };
        const emailInput = createFakeNode({
            closest: jest.fn(() => emailWrapper),
            type: "email",
            value: "bad-email"
        });
        const passwordInput = createFakeNode({
            closest: jest.fn(() => passwordWrapper),
            type: "password",
            value: "123"
        });
        const form = createFakeNode({
            querySelector: jest.fn((selector) => {
                if (selector === 'input[type="email"]') return emailInput;
                return null;
            })
        });
        const messages = [
            { className: "", textContent: "", setAttribute: jest.fn() },
            { className: "", textContent: "", setAttribute: jest.fn() }
        ];
        const documentMock = {
            addEventListener: jest.fn(),
            createElement: jest
                .fn()
                .mockReturnValueOnce(messages[0])
                .mockReturnValueOnce(messages[1]),
            getElementById: jest.fn((id) => {
                if (id === "signupForm") return form;
                if (id === "password") return passwordInput;
                return null;
            }),
            querySelector: jest.fn(() => null)
        };
        const invalidEmail = loadSignupLoginScript({
            createUserWithEmailAndPassword: jest.fn(() =>
                Promise.reject({ code: "auth/invalid-email" })
            ),
            document: documentMock
        });

        invalidEmail.api.signUpUser("bad-email", "abc12345");
        await flushAsyncWork();

        expect(emailInput.classList.add).toHaveBeenCalledWith("has-error");
        expect(emailInput.setAttribute).toHaveBeenCalledWith("aria-invalid", "true");
        expect(messages[0].textContent).toBe("Invalid email address.");
        expect(emailWrapper.appendChild).toHaveBeenCalledWith(messages[0]);

        const weakPassword = loadSignupLoginScript({
            createUserWithEmailAndPassword: jest.fn(() =>
                Promise.reject({ code: "auth/weak-password" })
            ),
            document: documentMock
        });

        weakPassword.api.signUpUser("signup@example.com", "123");
        await flushAsyncWork();

        expect(passwordInput.classList.add).toHaveBeenCalledWith("has-error");
        expect(passwordInput.setAttribute).toHaveBeenCalledWith("aria-invalid", "true");
        expect(messages[1].textContent).toBe(
            "The password is too weak. Please use at least 6 characters."
        );
        expect(passwordWrapper.appendChild).toHaveBeenCalledWith(messages[1]);
    });

    test("falls back to alerts when inline messages cannot be rendered", async () => {
        const documentMock = {
            addEventListener: jest.fn(),
            querySelector: jest.fn(() => null)
        };

        const { api, mocks } = loadSignupLoginScript({
            document: documentMock
        });

        api.signUpUser("new.user@example.com", "abc12345");
        await flushAsyncWork();

        expect(mocks.alert).toHaveBeenCalledWith(
            "Account created! Choose your role to finish setup."
        );
    });
});
