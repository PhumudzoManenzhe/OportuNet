
// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyIr2fg2uUtJPeHmvTJhePkt6DWti12Vw",
  authDomain: "page-not-found-a7dcb.firebaseapp.com",
  projectId: "page-not-found-a7dcb",
  storageBucket: "page-not-found-a7dcb.firebasestorage.app",
  messagingSenderId: "59141562173",
  appId: "1:59141562173:web:a724b5c22145e2b974ef54"
};

// Initialize Firebase (Compat version)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// GOOGLE LOGIN FUNCTION
function googleLogin() {
    auth.signInWithPopup(googleProvider)
    .then((result) => {
        console.log("Google User:", result.user);
        window.location.href = "../Applicant_homepage/index.html"; // Redirect to your homepage
    }).catch((error) => {
        alert("Google Error: " + error.message);
    });
}

// EMAIL SIGN UP FUNCTION
function signUpUser(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        alert("Account Created!");
        window.location.href = "logIn.html";
    }).catch((error) => {
        alert(error.message);
    });
}

//EMAIL LOG IN FUNCTION
function logInUser(email, password) {
    auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        window.location.href = "../Applicant_homepage/index.html"; 
    }).catch((error) => {
        alert(error.message);
    });
}
// for when we actually have a database and need to check if the user is new or not.
// function logInUser(email, password) {
//     auth.signInWithEmailAndPassword(email, password)
//     .then((userCredential) => {
//         const user = userCredential.user;

//         const db = firebase.firestore();

//         db.collection("users").doc(user.uid).get()
//         .then((doc) => {
//             if (!doc.exists) {
//                 // New user → send to role selection
//                 window.location.href = "chooseRole.html";
//             } else {
//                 const role = doc.data().role;

//                 if (role === "applicant") {
//                     window.location.href = "applicantDashboard.html";
//                 } else {
//                     window.location.href = "recruiterDashboard.html";
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
        alert("Please enter your email first.");
        return;
    }

    auth.sendPasswordResetEmail(email)
    .then(() => {
        alert("If an account exists, a reset email has been sent.");
    })
    .catch((error) => {
        console.error(error);

        if (error.code === "auth/user-not-found") {
            alert("No account found with this email.");
        } 
        else if (error.code === "auth/invalid-email") {
            alert("Invalid email address.");
        } 
        else {
            alert(error.message);
        }
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

    // Handle Google Buttons (Both pages)
    const googleBtns = document.querySelectorAll(".google-btn, .option a");
    googleBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            googleLogin();
        };
    });
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