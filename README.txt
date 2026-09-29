KhataPro fixed build
- Login page: Login + Google only; Create Shop tab removed.
- Dashboard logout bug fixed.
- Customer creation automatically generates a unique 6-digit Digital PIN.
- Mobile number index: customerIndex/{SHA-256(mobile)}/{uid}
- Customer portal flow: Mobile -> Shop -> 6-digit PIN -> Account.
- Transactions support pcs/gm/kg; grams are converted for total calculation.
- Shop settings expanded with contact/address/invoice fields.
- Firebase rules include customerIndex and customerAccess.
Important: customer portal currently uses public read access to hashed index/access records because it does not use Firebase Auth. Deploy firebase-rules.json in Realtime Database Rules before testing.
