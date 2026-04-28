<div align="center">

# Arogya Raksha

### One app for every health emergency and every hospital visit

**Uber-for-hospitals meets live SOS** — built for Indian users: instant help, doctor booking, encrypted health records, and volunteer rewards in one dark, mobile-first experience (**Helmet One**–style UI).

[![Live demo](https://img.shields.io/badge/Run-locally-22c55e?style=for-the-badge)](#run-locally)

</div>

---

## Helmet & product video

**Replace the link below** with your public YouTube / Drive / Loom URL when the helmet walkthrough is ready.

| | |
| --- | --- |
| **Helmet & product walkthrough** | [▶ Watch on YouTube](https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_VIDEO_ID) |

---

## Screenshots

Add your marketing captures to [`docs/screenshots/`](docs/screenshots/) using these names (or update the paths in this file):

### Landing — hero

![Arogya Raksha landing — hero, SOS and care CTAs](docs/screenshots/01-landing-hero.png)

### Inside the app — “Everything you need, in one place”

![Feature highlights grid — instant SOS, I-Can-Help, departments, vault, points, Firebase, live tracking, community](docs/screenshots/02-features-everything-in-one-place.png)

---

## Everything we built (feature list)

### Brand & shell

- **Arogya Raksha** positioning: emergency + hospital care in one product narrative on the landing page  
- **Dark theme** UI tuned for high contrast (emerald / amber / red accents)  
- **Bottom navigation** (Home · Trips · Safety · Profile) with **center SOS FAB**  
- **Guest-friendly** entry paths (“Get the app” / explore before full signup where applicable)

### Emergency SOS (victim)

- **One-tap SOS** with **Helmet One–style countdown** (manual + **crash / helmet** intake path)  
- **10-second cancel** window before dispatch  
- **Live GPS** plus **manual location** search (Google Places)  
- **Active SOS resume** if the user returns with an open request  
- **Phased UI**: countdown → alert sent → **help on the way** → safe / resolved flows  
- **Single assigned helper** (Firestore transaction — only one accept slot; clear UX when full)  
- **Mutual “ride-app” cards**: victim sees **responder name, age, short address, ETA, distance**; shared briefs on SOS + assignment docs  
- **Live map**: victim ↔ helper markers, **encoded route**, updating **ETA** and distance  
- **Safety guide** + **“Need to talk?”** support strip during active SOS  
- **“How are you feeling?”** mood check-in for handover / staff context  
- **Medical ID** shortcut from the emergency journey  
- **Hospital alerts** surfaced when a helper notifies an ER (status on victim side where wired)

### Helpers (“I Can Help”)

- **Nearby SOS feed** (distance + urgency sort, freshness window)  
- **Accept** with **helper brief** (profile-based name / age / address / phone)  
- **Live location streaming** to assignment + **periodic route / ETA recompute** (Directions-style)  
- **Auto “arrived”** when within radius of victim pin  
- **Distance guard**: auto-remove helper if they drift **>5 km** from incident  
- **On the way** tab: ETA hero, map, **victim shared details**, safety note, important callouts  
- **At hospital** tab: handover copy, medical ID prompt, feeling chips, **hospital notify panel**, thank-you card  
- **Hospital notify**: search / pick hospital, injury notes, **“Successfully notified · preparing for treatment”** success state  
- **Points** on mark-done (+ toast / ledger hook)  
- **Leaderboard** tab (demo community heroes)

### Incoming SOS (helper acquisition)

- **Global full-screen popup** for nearby requests (session ignore + snooze)  
- **Rapido-style** distance / time context and **one-tap accept** → routes to Help tab

### Home dashboard

- **Helmet status** card (shield, sensors / battery / connectivity messaging — demo data layer)  
- **Partner hospital** spotlight with deep link into care flow  
- **Browse by department** horizontal cards  
- **“More”** tools row: Medical ID, Safety hub, Vault, Care / hospitals  
- **Quick actions** grid: **Report accident**, **Call ambulance**, **Share live location**, **Safety circle** (placed **below** hospital + more per layout spec)  
- **Community impact** stats strip  
- Deep links into **Care**, **Trips**, **Safety**, **SOS**

### Care & appointments

- **Department → hospitals → doctors** browsing (showcase partner content + search)  
- **Doctor profile**: experience, fee, ratings, languages, hours, bio  
- **Slot picker** (multi-day chips + time chips)  
- **“Tell the doctor”** multi-line chief complaint before pay  
- **Google Pay for Web** (official button + test / demo pay paths + pay at hospital)  
- **Sticky pay bar** with scroll-safe layout (no overlap with the doctor note field)  
- **Appointments** list: upcoming / history, department + doctor metadata

### Health Vault

- **Upload** prescriptions, labs, imaging to **Firebase Storage**  
- **Timeline / filters** and download access (rules-backed)

### Medical ID & Safety Circle

- **Medical ID** screen for allergies, conditions, meds, blood group — **fast unlock** story for ER  
- **Safety Circle**: trusted contacts for alerts / SOS context (wired to product narrative)

### Safety hub

- Hub page linking **Medical ID**, **Safety circle**, and related safety tools

### Trips

- **Rides** tab: **helmet movement** story — day-grouped trip segments (demo data until hardware feed)  
- **Helped** tab: SOS help history cards  
- **Earned** tab: points summary + link to profile rewards

### Profile & rewards

- **Profile** with medical fields, **saved addresses**, **emergency contacts**  
- **Points / rewards** surface and “helped” narrative

### Portals (stubs)

- **Doctor portal** (`/doctor`) and **Hospital portal** (`/hospital`) placeholder screens for future staff tools

### Admin & demos

- **Admin panel** (`/admin`) with **hardware / crash simulator** hooks for demos and testing

### Backend & integrations

- **Firebase Auth**, **Firestore**, **Storage**, **Cloud Functions** (workspace: `functions/`)  
- **SOS + assignments + hospital alerts** data model with **participant briefs**  
- **Google Maps** Places (search) + **Directions-style routing / ETA** for assignments  
- **Google Pay** env-driven TEST vs PRODUCTION merchant setup  
- **AI / Gemini** proxy pattern on Functions (keys server-side — see `functions/.env.example`)  
- **npm workspaces**: **one** root `node_modules` + `npm run build:functions` / `serve:functions`

### Docs in repo

- `docs/feature-matrix.md` — merged feature comparison  
- `docs/firebase-schema.md` — collections overview  
- `docs/ui-design-system.md` — UI tokens / patterns  
- `.env.example` — client env + **VITE\_** security note  

---

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` → `.env.local` and fill Firebase / Maps keys when you want full backend mode (see comments in `.env.example`).

---

<div align="center">

**Arogya Raksha** — *your neighbourhood safety net and your doctor’s waiting room in the same app.*

</div>
