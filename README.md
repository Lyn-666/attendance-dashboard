# Attendance Dashboard

A lightweight classroom attendance tool built with **Google Apps Script + Google Sheets**.

It provides a teacher dashboard with a short-lived dynamic QR code, student check-in, live attendance count, CSV export, and a Chrome extension launcher.

## Recommended teacher workflow

The recommended final setup is:

```text
Google Form / linked Google Sheet
        ↓
Google Apps Script attendance backend
        ↓
Chrome extension
        ↓
Teacher clicks extension icon
        ↓
QR dashboard opens immediately
        ↓
Start / Close attendance / Download CSV / Open Google Sheet
```

The extension is intentionally a launcher rather than a replacement for Google Sheets. Attendance data remains in the teacher's Google Sheet.

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
- Chrome extension for one-click access
- Google Sheet stores:
  - Timestamp
  - Name
  - Student ID
  - Session ID

## Project files

- `Code.gs` — Google Apps Script backend
- `Index.html` — teacher dashboard and student check-in UI
- `appsscript.json` — Apps Script project manifest
- `chrome-extension/manifest.json` — Chrome Extension Manifest V3
- `chrome-extension/background.js` — one-click dashboard launcher
- `chrome-extension/options.html` — one-time extension setup page
- `chrome-extension/options.js` — settings and Google-tab capture logic
- `docs/` — older optional PWA launcher; the Chrome extension is now the recommended teacher launcher

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

## Teacher dashboard URL

The extension automatically adds `teacher=1`, so you may save either the plain `/exec` URL or the full teacher URL:

```text
https://script.google.com/.../exec?teacher=1
```

The dashboard includes:

```text
Start Attendance
Dynamic QR
Live checked-in count
Download CSV
Open Google Sheet
Close Attendance
Download Last Attendance CSV
```

## Install the Chrome extension locally

Until the extension is published in the Chrome Web Store, install it as an unpacked extension:

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `chrome-extension` folder from this repository.
6. Pin **Attendance Dashboard Launcher** to the Chrome toolbar.

## One-time extension setup

The first time you click the extension icon, its setup page opens because no dashboard URL is saved yet.

Enter:

- the deployed Apps Script teacher dashboard URL — required
- the Google Form edit URL — optional convenience link
- the linked Google Sheet URL — optional convenience link

You can also use **Use current Google tab** while viewing a Google Form, Google Sheet, or deployed Apps Script dashboard to capture that URL.

After saving, clicking the extension icon opens the teacher dashboard directly in a new Chrome tab.

## Important limitation: creating a new Google Form

The Chrome extension does **not** currently create or deploy the Apps Script backend automatically from an arbitrary newly created Google Form. Automating that would require a substantially broader Google OAuth integration with Forms, Sheets, Drive, and Apps Script APIs and may be restricted by institutional Google Workspace policy.

The practical supported workflow is therefore:

```text
Create Google Form
→ Link it to a Google Sheet if desired
→ Set up/deploy the attendance Apps Script once for that Sheet
→ Save the teacher dashboard URL in the extension once
→ After that, click the extension icon for one-click classroom use
```

The current QR attendance submission UI is provided by the Apps Script dashboard itself. The Google Form can remain as an administrative/roster form, but it is not required for the dynamic QR check-in flow.

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

The Chrome extension stores teacher URLs in Chrome synchronized extension storage; it does not upload attendance data to this repository.

## Notes

This system makes saved QR screenshots short-lived, but it cannot fully prevent a student physically present in class from immediately forwarding the current QR to someone else. For stronger identity assurance, consider restricting Web App access to institutional accounts and validating an authenticated institutional identity.
