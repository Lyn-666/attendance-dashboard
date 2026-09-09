# Attendance Dashboard

A lightweight classroom attendance tool built with **Google Apps Script + Google Sheets**.

It provides a teacher dashboard with a short-lived dynamic QR code, a student check-in page, CSV export, and an optional installable PWA launcher for teachers.

## Features

- Teacher dashboard with **Start Attendance** and **Close Attendance**
- Dynamic QR code refreshed every 15 seconds
- Old QR codes expire when the time slot changes
- Students get 3 minutes after a successful QR scan to enter their name and student ID
- Teacher page sends a heartbeat every 5 seconds
- If the teacher page disappears, attendance becomes inactive after about 20 seconds
- Live checked-in count on the teacher dashboard
- Duplicate check-ins blocked per student ID per session
- Download current session attendance as CSV while attendance is open
- After closing attendance, download the most recent session as CSV
- Open the backing Google Sheet directly from the teacher dashboard
- Optional installable **PWA teacher launcher** hosted with GitHub Pages
- Google Sheet stores:
  - Timestamp
  - Name
  - Student ID
  - Session ID

## Project files

- `Code.gs` — Google Apps Script backend
- `Index.html` — teacher dashboard and student check-in UI
- `appsscript.json` — Apps Script project manifest
- `docs/index.html` — installable PWA launcher
- `docs/manifest.webmanifest` — PWA manifest
- `docs/service-worker.js` — PWA service worker
- `docs/icon.svg` — app icon

## Apps Script setup

1. Create or open the Google Sheet you want to use for attendance.
2. In the Sheet, open **Extensions → Apps Script**.
3. Replace `Code.gs` with the contents from this repository.
4. Create an HTML file named `Index` and paste in `Index.html`.
5. If you use a manifest file, replace `appsscript.json` with the version in this repository.
6. Save the Apps Script project.
7. From the function dropdown, run `setup()` **once**.
8. Approve the requested Google permissions.

`setup()` stores the Spreadsheet ID and creates an `Attendance` sheet if one does not already exist.

## Deploy as a Web App

1. In Apps Script, choose **Deploy → New deployment** or edit your existing Web App deployment.
2. Select **Web app**.
3. Execute as: **Me**.
4. Set access according to your institution's policy.
5. Deploy.
6. Copy the `/exec` Web App URL.

When you change `Code.gs` or `Index.html`, create a **new deployment version** before using the updated `/exec` URL.

## Teacher URL

Add `?teacher=1` to the Web App URL:

```text
https://script.google.com/.../exec?teacher=1
```

The teacher workflow is:

```text
Open teacher dashboard
→ Start Attendance
→ Dynamic QR appears
→ Students scan and check in
→ Live count updates
→ Download CSV at any time if needed
→ Close Attendance
→ Download last session CSV if needed
```

The teacher dashboard also includes an **Open Google Sheet** button for viewing the full attendance history.

## Installable teacher app (PWA)

The `docs/` folder contains a small Progressive Web App launcher. It does not store attendance data. It simply remembers the teacher's deployed Apps Script dashboard URL in that browser and opens the dashboard in an app-like window.

### Enable GitHub Pages

In the GitHub repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/docs**.
4. Save.
5. Wait for GitHub Pages to publish the site.

The launcher URL will normally be:

```text
https://lyn-666.github.io/attendance-dashboard/
```

### First-time PWA setup

1. Open the GitHub Pages launcher.
2. Paste your deployed teacher URL ending in `/exec?teacher=1`.
3. Click **Save & Open**.
4. In a supported browser, choose **Install App** when offered, or use the browser's install/add-to-home-screen action.

After that, the teacher can launch **Attendance Dashboard** from the desktop, taskbar, Start menu, or phone home screen like a normal app.

### Important PWA note

The PWA shell is hosted on GitHub Pages, while the real teacher dashboard is hosted by Google Apps Script. If your institution blocks Google authentication inside an iframe or blocks third-party cookies, use the Apps Script teacher URL directly instead. The core attendance system does not depend on the PWA launcher.

The service worker caches only the PWA shell assets. The attendance dashboard itself remains online-only so the teacher always sees live session state.

## Student workflow

Students do not need a fixed URL. They scan the QR currently displayed on the teacher dashboard.

```text
Scan current QR
→ QR token is validated
→ Enter Name + Student ID
→ Check In
```

The QR itself is valid only for the current 15-second time slot. After a successful QR validation, the student receives a temporary ticket valid for 180 seconds.

## CSV download

The teacher dashboard can download either:

- the currently open attendance session, or
- the most recently closed session.

The generated CSV contains:

```text
Timestamp, Name, Student ID, Session ID
```

The CSV filename is based on the session ID, for example:

```text
CLASS-20260911-090000-attendance.csv
```

## Important timing constants

In `Code.gs`:

```javascript
const SLOT_MS = 15000;
const HEARTBEAT_TIMEOUT_MS = 20000;
const TICKET_TTL_SECONDS = 180;
```

- `SLOT_MS`: QR refresh/validity window
- `HEARTBEAT_TIMEOUT_MS`: how long the teacher page can stop reporting before attendance is considered inactive
- `TICKET_TTL_SECONDS`: how long a student has to complete the check-in form after a successful scan

The matching QR interval is also defined in `Index.html`:

```javascript
const QR_INTERVAL_MS = 15000;
```

If you change the QR interval, update both files so the UI and backend stay synchronized.

## Privacy and classroom use

Avoid committing student attendance data to this repository. Attendance records should remain in the private Google Sheet.

If this repository is public, do not add Spreadsheet IDs, deployment secrets, student names, student IDs, or exported attendance records.

The PWA saves the teacher Web App URL only in browser `localStorage`; it is not committed back to this repository.

## Notes

This system makes saved QR screenshots short-lived, but it cannot fully prevent a student physically present in class from immediately forwarding the current QR to someone else. For stronger identity assurance, consider restricting Web App access to institutional accounts and validating an authenticated institutional identity.
