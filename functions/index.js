"use strict";

const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");

admin.initializeApp();

const db = admin.firestore();

exports.cleanupDeletedAuthUser = functions.auth.user().onDelete(async (user) => {
    const uid = String(user.uid || "").trim();
    const email = String(user.email || "").trim();

    if (!uid) {
        console.warn("Auth delete event received without a uid.", { email });
        return null;
    }

    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await userRef.get();
    const userData = userSnapshot.exists ? userSnapshot.data() || {} : {};
    const role = String(userData.role || "").trim().toLowerCase();

    console.info("Starting account cleanup.", { email, role, uid });

    const ownedOpportunityIds = new Set();

    const directUserDocDeletes = [
        userRef.delete().catch((error) => {
            console.warn("Unable to delete users/{uid} document.", { uid, error: error.message });
        })
    ];

    const applicantApplicationDeletes = await deleteByQuery(
        db.collection("applications").where("applicantId", "==", uid)
    );

    const recruiterApplicationDeletes = await deleteByQuery(
        db.collection("applications").where("recruiterId", "==", uid)
    );

    const ownedOpportunitiesSnapshot = await db
        .collection("opportunities")
        .where("ownerUid", "==", uid)
        .get();

    const relatedApplicationDeletes = [];
    const ownedOpportunityDeletes = [];

    ownedOpportunitiesSnapshot.forEach((docSnapshot) => {
        ownedOpportunityIds.add(docSnapshot.id);
        ownedOpportunityDeletes.push(docSnapshot.ref.delete());
    });

    for (const opportunityId of ownedOpportunityIds) {
        relatedApplicationDeletes.push(
            deleteByQuery(db.collection("applications").where("jobId", "==", opportunityId))
        );
    }

    await Promise.allSettled([
        ...directUserDocDeletes,
        applicantApplicationDeletes,
        recruiterApplicationDeletes,
        ...ownedOpportunityDeletes,
        ...relatedApplicationDeletes
    ]);

    console.info("Completed account cleanup.", {
        applicantApplicationsDeleted: applicantApplicationDeletes,
        email,
        opportunitiesDeleted: ownedOpportunityIds.size,
        recruiterApplicationsDeleted: recruiterApplicationDeletes,
        uid
    });

    return null;
});

async function deleteByQuery(query) {
    const snapshot = await query.get();
    if (snapshot.empty) return 0;

    const batchSize = 400;
    const docs = snapshot.docs;

    for (let index = 0; index < docs.length; index += batchSize) {
        const batch = db.batch();
        docs.slice(index, index + batchSize).forEach((docSnapshot) => {
            batch.delete(docSnapshot.ref);
        });
        await batch.commit();
    }

    return docs.length;
}
