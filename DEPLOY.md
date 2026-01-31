# How to Deploy Niley Online

Since your site uses HTML, CSS, and JavaScript with no backend server (everything is handled by Firebase/Cloudinary), you can host it for free on **Netlify**.

## Option 1: The Easiest Way (Netlify Drop)

1.  **Prepare your folder**:
    *   Make sure all your files (`admin.html`, `shop.html`, `style.css`, regex/js files, and images) are in one folder: `Documents/niley`.
2.  **Go to Netlify**:
    *   Visit [https://app.netlify.com/drop](https://app.netlify.com/drop).
3.  **Drag and Drop**:
    *   Drag your entire `niley` folder onto the browser window where it says "Drag and drop your site folder here".
4.  **Wait for Upload**:
    *   Netlify will upload your files and give you a random URL (e.g., `misty-river-1234.netlify.app`).

---

## CRITICAL FINAL STEP: Authorize the Domain

Your Admin Login **will not work** on the new URL until you tell Firebase it's safe.

1.  Copy your new Netlify URL (e.g., `https://misty-river-1234.netlify.app`).
2.  Go to the [Firebase Console](https://console.firebase.google.com/).
3.  Click **Authentication** -> **Settings** tab.
4.  Click **Authorized Domains**.
5.  Click **Add Domain**.
6.  Paste your Netlify domain (just the `misty-river-1234.netlify.app` part).
7.  Click **Add**.

**Done!** Your store is now online globally.
