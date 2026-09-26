KHATAPRO v3
===========

Professional bilingual (English + Nepali) multi-shop customer ledger.

Main features:
- Firebase email/password shop owner authentication
- Separate shop data per Firebase Auth UID
- Customer records and transaction ledger
- Credit and payment entries
- Automatic totals and remaining balance
- Private automatically generated 6-digit customer PIN
- Customer portal requires mobile + PIN; mobile alone reveals nothing
- Shop settings and portal enable/disable
- Reports with all/today/month/year filters
- Search customers
- Delete individual transactions
- Responsive professional UI with mobile bottom navigation
- English / नेपाली language switch on every page

Firebase setup:
1. Enable Email/Password authentication.
2. Paste firebase-rules.json rules into Realtime Database Rules.
3. Host with a real HTTPS/static host (Firebase Hosting, GitHub Pages, Netlify, etc.).
4. Do not put Firebase Admin SDK service-account keys in this project or GitHub.

Security note:
The customer portal uses SHA-256(mobile|6-digit PIN) as a lookup key. This is better than mobile-only lookup, but a 6-digit PIN is not equivalent to server-side authentication or SMS OTP. For high-security production, move customer authentication to Firebase Authentication or a trusted backend/Cloud Function.


V7 safety update: transaction rows no longer have a delete X action. Credit entries save Item, MRP, Qty, Total and timestamp. Owner and customer views show Date & Time, Item, MRP, Qty, Total. Responsive owner/customer layouts retained.
