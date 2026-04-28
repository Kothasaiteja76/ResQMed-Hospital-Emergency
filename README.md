# 🚑 Arogya Raksha

> **Emergency response + hospital care platform**  
> One mobile-first app for SOS rescue, helper coordination, doctor booking, safety tools, and health records.

---

## 📑 Table of Contents
- [Project Overview](#-project-overview)
- [Prototype Videos](#-prototype-videos)
- [Screenshots](#-screenshots)
- [Core Feature Set](#-core-feature-set)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Available Scripts](#-available-scripts)

---

## ✨ Project Overview

- 🆘 Instant SOS and helper dispatch model
- 🗺️ Live map tracking with ETA and distance updates
- 🏥 Department-based hospital and doctor booking
- 🗂️ Health Vault for prescriptions and reports
- 🛡️ Safety suite (Medical ID + Safety Circle)
- 🧾 Trips history (rides/helped/earned)
- 🎁 Points and community contribution flows
- 📱 Mobile-style experience across all screen sizes

---

## 🎬 Prototype Videos

| Type | Link |
| --- | --- |
| Full product walkthrough | [Add video link](https://drive.google.com/drive/folders/1QgGScPH1PEJyWkn8pM74n7fJYiNJWjdL?usp=sharing) |

---

## 📸 Screenshots

| Screen | Preview Path |
| --- | --- |
| Landing page | <img width="448" height="872" alt="image" src="https://github.com/user-attachments/assets/e3febc39-a861-4a25-9f58-379419d7ae34" /> <img width="462" height="875" alt="image" src="https://github.com/user-attachments/assets/565aa0b6-dc4a-4a79-939e-f641028ecd42" /> |
| SOS victim flow | <img width="465" height="871" alt="image" src="https://github.com/user-attachments/assets/07b4b19f-7aee-47af-8510-a4a2f98f92a5" /> |
| Incoming helper popup | <img width="443" height="872" alt="image" src="https://github.com/user-attachments/assets/b7be49ea-a384-45b4-9cf2-052a18272956" /> |
| Helper - On the way | <img width="466" height="870" alt="image" src="https://github.com/user-attachments/assets/76f8bdf7-5241-40e1-b4be-68d49c072d54" /> |
| Home dashboard | <img width="453" height="871" alt="image" src="https://github.com/user-attachments/assets/d8f4811a-dfdd-4b57-b35b-3a1f50b4c271" /> |
| Care booking | <img width="471" height="872" alt="image" src="https://github.com/user-attachments/assets/8da83ad2-dbf5-4c9a-b5b4-b39211bd0fe2" /> <img width="446" height="872" alt="image" src="https://github.com/user-attachments/assets/81b3e2c6-508c-4a59-b3b0-afd4b86dcd0e" /> |
| Trips tabs | <img width="449" height="872" alt="image" src="https://github.com/user-attachments/assets/1b1cd92a-c557-4d50-98e2-dfd506f720bf" /> |
| Profile and rewards | <img width="433" height="875" alt="image" src="https://github.com/user-attachments/assets/89904a09-0400-472f-974e-219da360932d" /> |

---

## 🧩 Core Feature Set

### 🚨 SOS & Emergency Flow
- 10-second SOS countdown
- Crash/helmet-triggered emergency path
- One-helper acceptance lock (single responder model)
- Mutual profile sharing: name, age, short address, ETA, distance
- Live victim-helper map tracking
- SOS progress states with actionable cards
- Emergency contact and support-oriented UX blocks

### 🙋 Helper Experience
- Nearby SOS popup intake
- Fast accept and redirect to response interface
- On-the-way + at-hospital dual workflow
- Victim details and route intelligence
- Hospital notification panel
- Success state: "Successfully notified, preparing for treatment"
- Rescue completion and points reward flow

### 🏠 Home Dashboard
- Helmet status card
- Partner hospital discovery
- Department browsing
- Quick actions section
- Community impact highlights

### 🩺 Care & Booking
- Department -> hospital -> doctor navigation
- Detailed doctor cards and profiles
- Slot selection
- Reason-for-visit input
- Payment experience (including Google Pay flow options)
- Appointment lifecycle UI

### 🧾 Trips & Rewards
- Rides tab (movement history grouping)
- Helped tab (rescue history)
- Earned tab (points summary)

### 🛡️ Safety & Health Records
- Safety hub access
- Medical ID module
- Safety Circle contacts module
- Health Vault uploads and retrieval

### 👤 Account & Portals
- Profile details and medical fields
- Emergency contacts and address data
- Role-based portals: doctor, hospital, admin

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| UI | Tailwind CSS, Framer Motion, Lucide Icons |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Backend | Firebase Cloud Functions |
| Maps & Location | Google Maps APIs (Places, directions/ETA logic) |
| Payments | Google Pay (test + production-ready modes) |
| Workspace | npm workspaces |

---

## 🏗️ Project Structure

```text
Uber Hospital and Emergency/
├── src/
│   ├── components/        # Reusable UI and flow components
│   ├── data/              # Firestore/data-layer logic
│   ├── screens/
│   │   ├── public/        # Landing and public-facing pages
│   │   └── app/           # Authenticated application screens
│   ├── shell/             # App layouts and wrappers
│   └── lib/               # Shared client utilities
├── functions/             # Firebase Cloud Functions workspace
├── docs/                  # Documentation and screenshot assets
├── .env.example           # Client environment variable template
└── package.json           # Root workspace scripts
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

---

## 🔐 Environment Setup

```bash
cp .env.example .env.local
```

- Fill Firebase client configuration
- Fill Maps configuration
- Keep server-only secrets in Cloud Functions environment
- Do not commit private keys

---

## 📜 Available Scripts

```bash
# Start development server
npm run dev

# Build frontend
npm run build

# Preview production build
npm run preview

# Build cloud functions workspace
npm run build:functions

# Serve cloud functions locally
npm run serve:functions
```
