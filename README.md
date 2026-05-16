# OportuNet
A web platform connecting South African youth with learnerships and skills development opportunities.

## Firebase account cleanup

Deleting a user from Firebase Authentication does not automatically remove their Firestore data.
This project now includes a Cloud Functions workspace in [functions/index.js](./functions/index.js)
with an Auth delete trigger that cleans up:

- `users/{uid}`
- `applications` where `applicantId == uid`
- `applications` where `recruiterId == uid`
- `opportunities` where `ownerUid == uid`
- `applications` linked to deleted recruiter opportunities

Important:

- This cleanup trigger fires for single-user deletion events.
- Firebase's documented Auth delete trigger does not fire for bulk deletes done with `deleteUsers(...)`.
- The current applicant CV flow stores PDF data as data URLs in Firestore-facing profile data, not Cloud Storage objects, so there is no separate Storage cleanup path yet.

### Deploy the cleanup function

1. Install the Firebase CLI if you do not already have it.
2. In the project root, run `firebase login`.
3. Connect the project with `firebase use <your-project-id>`.
4. Install function dependencies:

```bash
cd functions
npm install
```

5. Deploy:

```bash
firebase deploy --only functions
```

After deployment, deleting a single user from Firebase Authentication or from the app's delete-account flow will trigger backend cleanup.
