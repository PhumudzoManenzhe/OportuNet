// Connect to Firestore so the selected role can be stored against the signed-in user.
const db = firebase.firestore();

// Cache the two role buttons used on the selection screen.
const applicantBtn = document.getElementById("applicantBtn");
const recruiterBtn = document.getElementById("recruiterBtn");

// Save the selected role for the current user, then route them to the matching dashboard.
function setRole(role) {
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("User not logged in");
        return;
    }

    db.collection("users").doc(user.uid).set({
        email: user.email,
        role: role
    })
    .then(() => {
        // Redirect based on role so the correct user experience opens next.
        if (role === "applicant") {
            window.location.href = "applicant_homepage.html";
        } else {
            window.location.href = "recruiter_homepage.html";
        }
    })
    .catch((error) => {
        console.error(error);
        alert("Error saving role");
    });
}

// Attach click handlers so each button saves the intended role.
applicantBtn.addEventListener("click", () => setRole("applicant"));
recruiterBtn.addEventListener("click", () => setRole("recruiter"));
