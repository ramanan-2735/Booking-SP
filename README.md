# 🏸 Badminton Court & Pass Management System

Welcome to your **Badminton Court & Pass Management System**! 

This application is designed specifically for sports complex owners, front-desk staff, and receptionists to manage badminton courts, client pass balances, and daily bookings easily and reliably.

---

## 🌟 What This System Helps You Do

* **👥 Manage Clients**: Register players and track membership profiles (only Client Name is required).
* **💳 Manage Hourly Passes**: Sell pre-paid session packages (e.g., 20 or 30 court hours).
* **🏸 Court Bookings**: Assign court slots (`Court 1` to `Court 6`) with start times and durations.
* **🛡️ Prevent Double-Bookings**: Automatic protection prevents scheduling two players on the same court at the same time.
* **⏳ Auto-Track Hours Balance**: Automatically deducts used hours from a client's pass and restores hours if a booking is cancelled.
* **📱 Multi-Device Sync**: Works on mobile phones, tablets, laptops, and desktop computers with instant real-time data sync across all staff devices.

---

## 🚀 Complete Step-by-Step Setup & Deployment Guide

Follow these 5 simple steps to set up your own **100% Free Firebase Account** and launch your website live on the web!

### Step 1: Create a Free Firebase Project
1. Open [Firebase Console](https://console.firebase.google.com/) in your browser.
2. Click **Create a project** (or **Add project**).
3. Enter your project name (e.g., `MyBadmintonComplex`) and click **Continue**.
4. Disable Google Analytics for now (optional) and click **Create project**.

---

### Step 2: Enable Firebase Services

#### A. Enable Cloud Firestore Database:
1. In the left menu, click **Build** $\rightarrow$ **Firestore Database**.
2. Click **Create database**.
3. Choose your nearest location and select **Start in production mode**.
4. Click **Create**.
5. Go to the **Rules** tab, paste the following rules, and click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### B. Enable Google Authentication:
1. In the left menu, click **Build** $\rightarrow$ **Authentication**.
2. Click **Get started**.
3. Under **Sign-in method**, select **Google** $\rightarrow$ toggle **Enable**.
4. Select your support email and click **Save**.

---

### Step 3: Register Web App & Get Your 6 Keys

#### Where to find your Firebase Keys in 5 clicks:
1. In Firebase Console, click the **Gear Icon (⚙️)** at the top left (next to Project Overview) $\rightarrow$ Select **Project settings**.
2. Scroll down to the bottom section called **"Your apps"**.
3. If no app exists, click the **Web icon (`</>`)**, enter a nickname (e.g., `Badminton Web App`), and click **Register app**.
4. Under **"Firebase SDK snippet"**, select the **Config** option.
5. You will see a block of code looking like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "my-complex-app.firebaseapp.com",
  projectId: "my-complex-app",
  storageBucket: "my-complex-app.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef..."
};
```

---

### Step 4: Create Your `.env` File
In your project root folder on your computer, create a new text file named `.env` and map those 6 keys like this:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=my-complex-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-complex-app
VITE_FIREBASE_STORAGE_BUCKET=my-complex-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
```

---

### Step 5: Build & Deploy Live to the Web!
Open your terminal (Command Prompt or PowerShell) inside your project directory and run:

```bash
# 1. Install dependencies
npm install

# 2. Build the website
npm run build

# 3. Log into your Firebase account
npx firebase login

# 4. Deploy your website live!
npx firebase deploy
```

🎉 **Done!** Firebase will print your live public URL (e.g., `https://your-project-id.web.app`).

---

## 🔗 How to Open & Save the Application

Open your live web link in any browser (Google Chrome, Safari, Microsoft Edge, Firefox):

```text
APPLICATION LINK:
https://your-project-id.web.app
```

> 💡 **Tip for Mobile & Desktop**: 
> * **On Mobile**: Open the link in Chrome or Safari, tap **Share / Menu** $\rightarrow$ select **"Add to Home Screen"** to use it like a native phone app!
> * **On Computer**: Bookmark this link in your browser bar for 1-click access.

---

## 🔑 How to Sign In

1. Open the application link.
2. Click the **"Sign in with Google"** button.
3. Select your Google account.
4. You will enter the management dashboard.

---

## 👥 How to Add a New Client

1. Click **`Master`** on the navigation menu (or click **`+ New Client`** in the left menu).
2. Click the **`+ Add Client`** button.
3. Enter the **Client Name** (e.g., *Rahul Sharma*).
4. *(Optional)* Add Phone Number, Email, or Notes.
5. Click **Create Client**.

> 📌 **Important**: Only the **Client Name is required**. All other fields (Phone, Email, Notes) are optional!

---

## 💳 How to Add a Purchase / Hour Pass

1. Click **`Purchases`** on the menu (or click **`+ New Pass`** in the left menu).
2. Click the **`+ Add Purchase`** button.
3. Select the **Client**.
4. Enter **Hours Purchased** (e.g., *20 hours*).
5. Enter **Rate Per Hour** and **Payment Status** (*Paid*, *Pending*, or *Partial*).
6. Click **Save Purchase**.

> ⏳ The system automatically calculates remaining balance hours for the customer!

---

## 🏸 How to Schedule a Court Booking

1. Click **`Bookings`** on the menu (or click the yellow **`+ New Booking`** button).
2. Select the **Client**.
3. Select the **Badminton Court** (`Court 1` through `Court 6`).
4. Select the **Start Date** and **Start Time** (e.g., *09:00 AM*).
5. Select the **Duration** in hours (e.g., *1 hour* or *2 hours*).
6. Review the client's remaining pass balance preview.
7. Click **Schedule Booking**.

---

### 🛡️ Automatic Double-Booking Protection

The system automatically checks court availability:
* **REJECTS** overlapping bookings on the same court (e.g., trying to book Court 1 at 10:30 AM when 10:00–11:00 AM is already booked).
* **ALLOWS** adjacent bookings (e.g., Court 1 at 10:00–11:00 AM and 11:00–12:00 PM).
* **ALLOWS** different courts at the same time (e.g., Court 1 at 10:00 AM and Court 2 at 10:00 AM).

---

## ❌ How to Cancel a Booking

1. Click **`Bookings`** on the menu.
2. Find the booking card.
3. Click the **Delete / Trash** icon.
4. Confirm cancellation when prompted.

> 🔄 **Automatic Hour Balance Restoration**: Cancelling a booking automatically restores the deducted hours back to the client's pass balance!

---

## 📲 Using Multiple Devices Simultaneously

You can use the application on multiple devices at the same time:

* **Reception Desk**: Desktop PC or iPad
* **Court Manager**: Mobile Phone
* **Complex Owner**: Laptop

### Real-Time Synchronization:
When staff on **Device A** adds a client or creates a booking, **Device B** will automatically update in real-time without needing to refresh the page!

---

## 🔄 Daily Workflow for Reception Staff

```text
NEW PLAYER ARRIVES
       │
       ▼
1. Add Client (Name)
       │
       ▼
2. Add Purchase (e.g. 20-Hour Pass)
       │
       ▼
3. Schedule Booking (Court # + Date + Time)
       │
       ▼
Remaining Pass Hours Update Automatically!
```

---

## ❓ Troubleshooting & FAQs

### Problem: I see "Court Collision" error when scheduling
* **Cause**: Another player is already booked on that exact court during that time slot.
* **Solution**: Choose a different court (`Court 2`, `Court 3`, etc.) or adjust the start time.

### Problem: I don't see bookings added by another receptionist
* **Solution**: Check your internet connection. Click the **Refresh (↻)** button at the top right of the application screen.

### Problem: I cannot sign in
* **Solution**: Make sure you are choosing an authorized Google account. Contact your administrator if needed.

---

## ⚠️ Important Rules for Reception Staff

1. **Check Court Numbers**: Always verify the correct court number (`Court 1` to `Court 6`) before confirming a booking.
2. **Cancel Properly**: If a player cancels, click the Delete/Cancel button instead of creating duplicate replacement entries. This ensures their remaining hour balance stays accurate.
3. **Only Client Name is Required**: Do not worry if a customer doesn't want to provide an email or phone number.

---

## ✅ Pre-Flight Checklist Before Going Live

- [ ] Firebase project created & services enabled
- [ ] `.env` file filled with 6 Firebase keys
- [ ] Production build & deploy complete (`npx firebase deploy`)
- [ ] Application link saved & tested on phone/desktop
- [ ] Added first client & purchase pass
- [ ] Verified court booking & collision prevention
- [ ] Multi-device real-time sync verified
