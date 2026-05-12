import { auth, db } from "../FireStore_db/firebase.js";
import { 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
//Firebase Configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDyIr2fg2uUtJPeHmvTJhePkt6DWti12Vw",
//   authDomain: "page-not-found-a7dcb.firebaseapp.com",
//   projectId: "page-not-found-a7dcb",
//   storageBucket: "page-not-found-a7dcb.firebasestorage.app",
//   messagingSenderId: "59141562173",
//   appId: "1:59141562173:web:a724b5c22145e2b974ef54"
// };

// Initialize Firebase (Compat version)
// firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth();
const googleProvider = new GoogleAuthProvider();

function canRenderInlineMessage() {
    return Boolean(
        typeof document !== "undefined" &&
        typeof document.createElement === "function" &&
        typeof document.getElementById === "function" &&
        typeof document.querySelector === "function"
    );
}

function notify(message, type = "error", targetName = "form") {
    if (canRenderInlineMessage() && showInlineMessage(message, type, targetName)) {
        return;
    }

    if (typeof alert === "function") {
        alert(message);
    }
}

function redirectTo(path, delay = 0) {
    const redirect = () => {
        window.location.href = path;
    };

    if (delay > 0 && typeof setTimeout === "function") {
        setTimeout(redirect, delay);
        return;
    }

    redirect();
}

function getActiveForm() {
    return document.getElementById("signupForm") || document.querySelector(".login_form form");
}

function getField(targetName) {
    const signupForm = document.getElementById("signupForm");

    if (targetName === "email") {
        return signupForm?.querySelector('input[type="email"]') || document.getElementById("email");
    }

    if (targetName === "password") {
        return document.getElementById("password");
    }

    if (targetName === "confirmPassword") {
        return document.getElementById("confirmPassword");
    }

    return null;
}

function getGoogleButton() {
    return document.querySelector(".google-btn") || document.querySelector(".option a");
}

function clearInlineMessages(form = getActiveForm()) {
    if (!form) return;

    const messages = form.querySelectorAll(".field-message, .form-message, .google-message");
    messages.forEach((message) => message.remove());

    const invalidFields = form.querySelectorAll(".has-error");
    invalidFields.forEach((field) => {
        field.classList.remove("has-error");
        field.removeAttribute("aria-invalid");
    });
}

function getMessageTarget(field) {
    if (!field) return null;

    return field.closest(".input-group, .input_box, .password_box");
}

function showInlineMessage(message, type = "error", targetName = "form") {
    const form = getActiveForm();
    if (!form) return false;

    const googleButton = targetName === "google" ? getGoogleButton() : null;
    const field = getField(targetName);
    const target = getMessageTarget(field) || form;
    const messageElement = document.createElement("p");
    const isFieldMessage = Boolean(field);

    messageElement.className = googleButton
        ? `google-message ${type}`
        : isFieldMessage
            ? `field-message ${type}`
            : `form-message ${type}`;
    messageElement.textContent = message;
    messageElement.setAttribute("role", type === "error" ? "alert" : "status");

    if (field && type === "error") {
        field.classList.add("has-error");
        field.setAttribute("aria-invalid", "true");
    }

    if (googleButton) {
        googleButton.insertAdjacentElement("afterend", messageElement);
    } else {
        target.appendChild(messageElement);
    }
    return true;
}

// FRIENDLY ERROR MESSAGE HELPER
function getFriendlyErrorMessage(error) {
    switch (error.code) {
        case "auth/email-already-in-use": return "This email is already registered. Please log in.";
        case "auth/invalid-email": return "Invalid email address.";
        case "auth/weak-password": return "The password is too weak. Please use at least 6 characters.";
        case "auth/user-not-found": return "No account found with this email address.";
        case "auth/wrong-password":
        case "auth/invalid-credential": return "Incorrect email or password. Please try again.";
        case "auth/too-many-requests": return "Too many failed attempts. Please try again later.";
        case "auth/popup-closed-by-user": return "Sign-in was canceled.";
        case "auth/network-request-failed": return "Network error. Please check your internet connection.";
        default: return "An unexpected error occurred. Please try again.";
    }
}

// GOOGLE LOGIN FUNCTION
function googleLogin(action = "signup") {
    clearInlineMessages();
    signInWithPopup(auth, googleProvider)
    .then((result) => {
        const user = result.user;

        const docRef = doc(db, "users", user.uid);

        getDoc(docRef)
        .then((docSnap) => {

            if (action === "signup") {
                if (docSnap.exists()) {
                    notify("An account with this Google email already exists.", "error", "google");
                    signOut(auth); // Clear the active session since they shouldn't be logged in
                } else {
                    redirectTo("./chooseRoles.html");
                }
            } else if (action === "login") {
                if (!docSnap.exists()) {
                    notify("No account found for this Google email.", "error", "google");
                    signOut(auth);
                } else {
                    const role = docSnap.data().role;
                    if (role === "applicant") {
                        redirectTo("../Applicant_homepage/index.html");
                    } else if (role === "recruiter") {
                        redirectTo("../Recruiter_homepage/index.html");
                    } else {
                        redirectTo("./chooseRoles.html");
                    }
                }
            }
        })
        .catch((error) => {
            console.error("Firestore error:", error);
            notify("Failed to load user data", "error", "form");
        });

    })
    .catch((error) => {
        notify(getFriendlyErrorMessage(error), "error", "form");
    });
}

// EMAIL SIGN UP FUNCTION
function signUpUser(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        notify("Account created! Choose your role to finish setup.", "success", "form");
        redirectTo("./chooseRoles.html", 2000);
    }).catch((error) => {
        notify(getFriendlyErrorMessage(error), "error", getAuthErrorTarget(error));
    });
}

//EMAIL LOG IN FUNCTION
// for when we actually have a database and need to check if the user is new or not.
function logInUser(email, password) {
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;

        const docRef = doc(db, "users", user.uid);

        getDoc(docRef)
        .then((docSnap) => {
            if (!docSnap.exists()) {
                redirectTo("./chooseRoles.html");
            } else {
                const role = docSnap.data().role;

                if (role === "applicant") {
                    redirectTo("../Applicant_homepage/index.html");
                } else if (role === "recruiter") {
                    redirectTo("../Recruiter_homepage/index.html");
                } else {
                    redirectTo("./chooseRoles.html");
                }
            }
        })
        .catch((error) => {
            console.error("Firestore error:", error);
            notify("Failed to load user data", "error", "form");
        });

    })
    .catch((error) => {
        notify(getFriendlyErrorMessage(error), "error", getAuthErrorTarget(error));
    });
}

// function logInUser(email, password) {
//     signInWithEmailAndPassword(auth ,email, password)
//     .then((userCredential) => {
//         const user = userCredential.user;

//         //const db = firebase.firestore();

//         db.collection("users").doc(user.uid).get()
//         .then((doc) => {
//             if (!doc.exists) {
//                 // New user → send to role selection
//                 window.location.href = "chooseRoles.html";
//             } else {
//                 const role = doc.data().role;

//                 if (role === "applicant") {
//                     window.location.href = "../Applicant_homepage/index.html";
//                 } else {
//                     window.location.href = "../Recruiter_homepage/index.html";
//                 }
//             }
//         })
//         .catch((error) => {
//             console.error("Firestore error:", error);
//             alert("Failed to load user data");
//         });

//     })
//     .catch((error) => {
//         alert(error.message);
//     });
// }

function forgotPassword(email) {
    if (!email) {
        notify("Please enter your email first.", "error", "email");
        const emailField = document.getElementById("email");
        if (typeof emailField?.focus === "function") {
            emailField.focus();
        }
        return;
    }

    sendPasswordResetEmail(auth,email)
    .then(() => {
        notify("If an account exists, a reset email has been sent.", "success", "email");
    })
    .catch((error) => {
        console.error(error);
        notify(getFriendlyErrorMessage(error), "error", getAuthErrorTarget(error));
    });
}

function getAuthErrorTarget(error) {
    switch (error.code) {
        case "auth/email-already-in-use":
        case "auth/invalid-email":
        case "auth/user-not-found":
            return "email";
        case "auth/weak-password":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "password";
        default:
            return "form";
    }
}
// Attach Event Listeners (Once the DOM is ready)
document.addEventListener("DOMContentLoaded", () => {
    // Handle Sign Up Form
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            clearInlineMessages(signupForm);
            const email = signupForm.querySelector('input[type="email"]').value.trim();
            const password = document.getElementById("password").value;
            const confirmPasswordInput = document.getElementById("confirmPassword");
            const confirmPassword = confirmPasswordInput?.value;

            if (confirmPasswordInput && password !== confirmPassword) {
                notify("Passwords do not match.", "error", "confirmPassword");
                return;
            }

            signUpUser(email, password);
        });
    }

    // Handle Login Form
    const loginForm = document.querySelector(".login_form form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            clearInlineMessages(loginForm);
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            logInUser(email, password);
        });
    }

    // Handle Google Sign Up and Log In buttons
    const googleButtons = document.querySelectorAll(".google-btn, .option a");
    googleButtons.forEach((button) => {
        button.onclick = (e) => {
            e.preventDefault();
            clearInlineMessages();
            const action = button.classList?.contains("google-btn") ? "signup" : "login";
            googleLogin(action);
        };
    });

    // Handle Forgot Password Link
    const forgotPasswordLink = document.getElementById("forgotPassword");
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (e) => {
            e.preventDefault();
            clearInlineMessages(loginForm);

            const email = document.getElementById("email").value.trim();
            forgotPassword(email);
        });
    }
    // Handle Password Toggle(show and hide password)
    const passwordToggles = document.querySelectorAll(".toggle-password");
    passwordToggles.forEach((togglePassword) => {
        const targetId = togglePassword.dataset?.target || "password";
        const passwordInput = document.getElementById(targetId);

        if (!passwordInput) return;

        togglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";
            togglePassword.textContent = isPassword ? "Hide" : "Show";
        });
    });
});

