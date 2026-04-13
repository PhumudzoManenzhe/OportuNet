// Initialize Firestore
const db = firebase.firestore();

const applicantBtn = document.getElementById("applicantBtn");
const recruiterBtn = document.getElementById("recruiterBtn");

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
        // Redirect based on role
        if (role === "applicant") {
            window.location.href = "../Applicant_homepage/index.html";
        } else {
            window.location.href = "../Recruiter_homepage/index.html";
        }
    })
    .catch((error) => {
        console.error(error);
        alert("Error saving role");
    });
}

applicantBtn.addEventListener("click", () => setRole("applicant"));
recruiterBtn.addEventListener("click", () => setRole("recruiter"));