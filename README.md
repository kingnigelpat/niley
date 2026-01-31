# Niley - Tech Store Setup

## 1. Firebase Configuration
This store relies on Google Firebase for the database (products) and authentication (admin login).

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Enable **Firestore Database** (start in Test Mode for development).
4. Enable **Authentication** and turn on **Email/Password** sign-in provider.
5. Go to **Project Settings** (gear icon) -> **General**.
6. Scroll down to "Your apps" and add a **Web App**.
7. Copy the `firebaseConfig` object (apiKey, authDomain, etc.).
8. Open `firebase-config.js` in this folder.
9. Replace the placeholder values with your real keys.

## 2. Instagram Configuration
To verify where orders are sent:
1. Open `shop.js`.
2. Find `const IG_USERNAME`.
3. Change it to your Instagram handle.

## 3. Using the Store
1. Open `admin.html` in your browser.
2. Enter an email/password. It will ask if you want to register a new account -> Click OK.
3. Once in the dashboard, add some products.
4. Open `shop.html` to see your store live!
