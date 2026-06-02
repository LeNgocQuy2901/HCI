# k6 test case mapping

| Area | Test case | Coverage |
| --- | --- | --- |
| Auth | Register new account | `app-api.js` |
| Auth | Register existing email | `app-api.js` expects `409` |
| Auth | Valid login | `app-api.js` |
| Auth | Wrong password | `app-api.js` expects `401` |
| Learn | Select lesson and inspect video | Published content and video metadata |
| Learn | Mark Review again | Sync learning progress as `learning` |
| Learn | Mark Got it | Sync progress as `mastered` and understood |
| Quiz | Complete lesson quiz | Fetch quiz and submit a `100` score event |
| Quiz | Meet `requiredQuizScore` | Assert selected lesson requires `100%` |
| Lookup | Search vocabulary and select card | Find a published sign and inspect video |
| Lookup | Watch searched word video | Video metadata; optional Drive range request |
| Translate | Translate word in dataset | With `VERIFY_TRANSLATE_DATASET=true`, assert `hello` frames exist |
| Translate | Translate word outside dataset | With `VERIFY_TRANSLATE_DATASET=true`, assert synthetic unknown word is absent |
| Recognition | Camera mode Words | Multipart frame request with `mode=words` |
| Recognition | Camera mode Alphabet | Multipart frame request with `mode=alnum` |
| Recognition | Camera mode Number | Multipart frame request with `mode=numbers` |
| Upload | Upload image | Multipart PNG inference request |
| Upload | Upload video | Multipart MP4 inference request |
| Admin | Create sign | Create and clean up temporary draft sign |
| Admin | Publish lesson | Create, publish, and clean up temporary lesson |
| Admin | Export CSV | Load users and serialize the same CSV shape client-side |
| Admin | Change user/admin roles | Promote generated user, then demote it |
| Profile | Update information | Update generated user's full name |
| Profile | Change password | Change password and verify old/new login behavior |
| Profile | Upload avatar | Update avatar through the profile avatar API |
