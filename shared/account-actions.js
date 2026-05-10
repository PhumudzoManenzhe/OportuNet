import { auth, db } from "../FireStore_db/firebase.js";
import { deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { deleteDoc, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const LOGIN_PATH = "../SignUp_LogIn_pages/logIn.html";

export function bindDeleteAccountButton(button, options = {}) {
    if (!button) return;
    button.addEventListener("click", () => startDeleteAccountFlow(options));
}

export async function startDeleteAccountFlow({ loginHref = LOGIN_PATH } = {}) {
    const user = await resolveCurrentUser();

    if (!user) {
        alert("Please log in before deleting your account.");
        return;
    }

    const email = user.email || "";
    if (!email) {
        alert("This account does not have an email address to verify.");
        return;
    }

    const typedEmail = prompt("To delete your account, enter your email address.");
    if (typedEmail === null) return;

    if (typedEmail.trim().toLowerCase() !== email.toLowerCase()) {
        alert("The email address does not match your account.");
        return;
    }

    const confirmed = confirm(`Delete the account for ${email}? This cannot be undone.`);
    if (!confirmed) return;

    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);
    const previousData = snapshot.exists() ? snapshot.data() : null;

    try {
        if (snapshot.exists()) {
            await deleteDoc(userRef);
        }

        await deleteUser(user);
        clearLocalSession();
        window.location.href = loginHref;
    } catch (error) {
        if (previousData) {
            try {
                await setDoc(userRef, previousData, { merge: false });
            } catch (restoreError) {
                console.error("Unable to restore account data after delete failure.", restoreError);
            }
        }

        if (error?.code === "auth/requires-recent-login") {
            alert("For security, please log in again before deleting your account.");
            window.location.href = loginHref;
            return;
        }

        console.error("Unable to delete account.", error);
        alert(error?.message || "Your account could not be deleted.");
    }
}

async function resolveCurrentUser() {
    if (auth.currentUser) return auth.currentUser;

    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        }, (error) => {
            unsubscribe();
            reject(error);
        });
    });
}

function clearLocalSession() {
    localStorage.removeItem("recruiter_jobs");
    localStorage.removeItem("recruiter_applications");
    sessionStorage.clear();
}
