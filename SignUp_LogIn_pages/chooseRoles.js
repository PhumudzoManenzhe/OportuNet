import { auth, db } from "../FireStore_db/firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const applicantBtn = document.getElementById("applicantBtn");
const recruiterBtn = document.getElementById("recruiterBtn");

function setRole(role) {
    const user = auth.currentUser;

    if (!user) {
        alert("User not logged in");
        return;
    }

    const docRef = doc(db, "users", user.uid);

    setDoc(docRef, {
        email: user.email,
        role: role
    })
    .then(() => {
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