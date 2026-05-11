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

// TOAST NOTIFICATION HELPER
function showToast(message, type = "error") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger slide-in animation
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300); // Wait for CSS transition
    }, 3000);
}

// FRIENDLY ERROR MESSAGE HELPER
function getFriendlyErrorMessage(error) {
    switch (error.code) {
        case "auth/email-already-in-use": return "This email is already registered. Please log in.";
        case "auth/invalid-email": return "The email address is not valid.";
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
function googleLogin(action) {
    signInWithPopup(auth, googleProvider)
    .then((result) => {
        const user = result.user;

        const docRef = doc(db, "users", user.uid);

        getDoc(docRef)
        .then((docSnap) => {

            if (action === "signup") {
                if (docSnap.exists()) {
                    showToast("An account with this Google email already exists. Please log in.", "error");
                    signOut(auth); // Clear the active session since they shouldn't be logged in
                    setTimeout(() => window.location.href = "./logIn.html", 2000);
                } else {
                    window.location.href = "./chooseRoles.html";
                }
            } else if (action === "login") {
                if (!docSnap.exists()) {
                    showToast("No account found for this Google email. Please sign up.", "error");
                    signOut(auth);
                    setTimeout(() => window.location.href = "./index.html", 2000);
                } else {
                    const role = docSnap.data().role;
                    if (role === "applicant") {
                        window.location.href = "../Applicant_homepage/index.html";
                    } else {
                        window.location.href = "../Recruiter_homepage/index.html";
                    }
                }
            }
        });

    })
    .catch((error) => {
        showToast(getFriendlyErrorMessage(error), "error");
    });
}

// EMAIL SIGN UP FUNCTION
function signUpUser(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        showToast("Account Created!", "success");
        setTimeout(() => window.location.href = "./logIn.html", 2000);
    }).catch((error) => {
        showToast(getFriendlyErrorMessage(error), "error");
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
                window.location.href = "./chooseRoles.html";
            } else {
                const role = docSnap.data().role;

                if (role === "applicant") {
                    window.location.href = "../Applicant_homepage/index.html";
                } else {
                    window.location.href = "../Recruiter_homepage/index.html";
                }
            }
        })
        .catch((error) => {
            console.error("Firestore error:", error);
            showToast("Failed to load user data", "error");
        });

    })
    .catch((error) => {
        showToast(getFriendlyErrorMessage(error), "error");
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
        showToast("Please enter your email first.", "error");
        document.getElementById("email").focus();
        return;
    }

    sendPasswordResetEmail(auth,email)
    .then(() => {
        showToast("If an account exists, a reset email has been sent.", "success");
    })
    .catch((error) => {
        console.error(error);
        showToast(getFriendlyErrorMessage(error), "error");
    });
}
// Attach Event Listeners (Once the DOM is ready)
document.addEventListener("DOMContentLoaded", () => {
    // Handle Sign Up Form
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = signupForm.querySelector('input[type="email"]').value;
            const password = document.getElementById("password").value;
            signUpUser(email, password);
        });
    }

    // Handle Login Form
    const loginForm = document.querySelector(".login_form form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            logInUser(email, password);
        });
    }

    // Handle Google Sign Up Button
    const signupGoogleBtn = document.querySelector(".google-btn");
    if (signupGoogleBtn) {
        signupGoogleBtn.onclick = (e) => {
            e.preventDefault();
            googleLogin("signup");
        };
    }

    // Handle Google Log In Button
    const loginGoogleBtn = document.querySelector(".option a");
    if (loginGoogleBtn) {
        loginGoogleBtn.onclick = (e) => {
            e.preventDefault();
            googleLogin("login");
        };
    }

    // Handle Forgot Password Link
    const forgotPasswordLink = document.getElementById("forgotPassword");
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value;
            forgotPassword(email);
        });
    }
    // Handle Password Toggle(show and hide password)
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";
            togglePassword.textContent = isPassword ? "Hide" : "Show";
        });
    }
});