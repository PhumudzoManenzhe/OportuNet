import { auth, db } from "../FireStore_db/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const PROFILE_FIELD = "applicantProfile";

const profileApp = window.ApplicantEditableProfile;

if (!profileApp) {
    throw new Error("Applicant editable profile script must load before profile_firebase.js.");
}

const fallbackFetchPageData = profileApp.profileGateway.fetchPageData.bind(profileApp.profileGateway);

profileApp.profileGateway.fetchPageData = async function fetchPageData() {
    const defaultPageData = await fallbackFetchPageData();
    const user = await resolveCurrentUser();

    if (!user) {
        return defaultPageData;
    }

    const userSnapshot = await getDoc(doc(db, "users", user.uid));

    if (!userSnapshot.exists()) {
        return defaultPageData;
    }

    return mergeProfileData(defaultPageData, userSnapshot.data()?.[PROFILE_FIELD]);
};

profileApp.profileGateway.savePageData = async function savePageData(pageData) {
    const user = await resolveCurrentUser();

    if (!user) {
        throw new Error("Please log in before saving your applicant profile.");
    }

    const nextPageData = mergeProfileData(await fallbackFetchPageData(), pageData);

    await setDoc(doc(db, "users", user.uid), {
        email: user.email || "",
        [PROFILE_FIELD]: nextPageData
    }, { merge: true });

    return profileApp.cloneData(nextPageData);
};

async function resolveCurrentUser() {
    if (auth.currentUser) {
        return auth.currentUser;
    }

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

function mergeProfileData(base, override) {
    if (!override || typeof override !== "object" || Array.isArray(override)) {
        return profileApp.cloneData(base);
    }

    const merged = profileApp.cloneData(base);
    mergeInto(merged, override);
    return merged;
}

function mergeInto(target, source) {
    Object.entries(source).forEach(([key, value]) => {
        if (!(key in target)) {
            return;
        }

        if (Array.isArray(value)) {
            target[key] = profileApp.cloneData(value);
            return;
        }

        if (isPlainObject(value) && isPlainObject(target[key])) {
            mergeInto(target[key], value);
            return;
        }

        target[key] = value;
    });
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
