import { auth, db } from "../FireStore_db/firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// HTML elements
const qualificationSelect =
  document.getElementById("qualificationSelect");

const selectedInfo =
  document.getElementById("selectedInfo");


// Load qualifications into dropdown
async function loadQualifications(selectedQualification = "") {

  qualificationSelect.innerHTML =
    '<option value="">Select Qualification</option>';

  try {

    const querySnapshot = await getDocs(
      collection(db, "qualifications")
    );

    querySnapshot.forEach((docSnap) => {

      const qualification = docSnap.data();

      // Skip broken documents
      if (!qualification.title) return;

      const option = document.createElement("option");

      option.value = qualification.title;

      option.textContent = qualification.title;

      option.dataset.level =
        qualification.level || "";

      option.dataset.framework =
        qualification.sub_framework || "";

      // Auto-select saved qualification
      if (
        qualification.title === selectedQualification
      ) {
        option.selected = true;
      }

      qualificationSelect.appendChild(option);
    });

  } catch (error) {

    console.error(
      "Error loading qualifications:",
      error
    );

    qualificationSelect.innerHTML =
      '<option value="">Failed to load qualifications</option>';
  }
}


// Check logged-in user
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    console.log("No logged-in user");
    return;
  }

  try {

    const userRef =
      doc(db, "users", user.uid);

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log("User document missing");
      return;
    }

    const userData = userSnap.data();

    // Load qualifications
    await loadQualifications(
      userData.qualification || ""
    );

    // If qualification already exists
    if (userData.qualification) {

      selectedInfo.innerHTML = `
        <p>
          <strong>NQF Level:</strong>
          ${userData.nqf_level || ""}
        </p>

        <p>
          <strong>Sub-framework:</strong>
          ${userData.sub_framework || ""}
        </p>
      `;
    }

  } catch (error) {

    console.error(
      "Error checking user:",
      error
    );
  }
});


// Save qualification when selected
qualificationSelect.addEventListener(
  "change",
  async () => {

    const user = auth.currentUser;

    if (!user) {
      alert("No logged-in user");
      return;
    }

    const selectedOption =
      qualificationSelect.options[
        qualificationSelect.selectedIndex
      ];

    if (selectedOption.value === "") {
      return;
    }

    try {

      await updateDoc(
        doc(db, "users", user.uid),
        {
          qualification:
            selectedOption.value,

          nqf_level: Number(
            selectedOption.dataset.level
          ),

          sub_framework:
            selectedOption.dataset.framework
        }
      );

      selectedInfo.innerHTML = `
        <p>
          <strong>NQF Level:</strong>
          ${selectedOption.dataset.level}
        </p>

        <p>
          <strong>Sub-framework:</strong>
          ${selectedOption.dataset.framework}
        </p>
      `;

      console.log(
        "Qualification saved successfully"
      );

    } catch (error) {

      console.error(
        "Error saving qualification:",
        error
      );
    }
  }
);