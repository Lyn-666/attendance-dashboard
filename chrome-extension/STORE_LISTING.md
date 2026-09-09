# Chrome Web Store Listing Draft

## Name

Attendance Dashboard Launcher

## Short description

Open a teacher attendance QR dashboard in one click and keep quick links to its Google Form and Google Sheet.

## Detailed description

Attendance Dashboard Launcher gives teachers a simple one-click entry point to a classroom attendance workflow built with Google Apps Script and Google Sheets.

After one-time setup, clicking the extension icon opens the configured teacher dashboard directly. The dashboard can display a short-lived attendance QR code, show live check-in counts, open the backing Google Sheet, and download attendance records as CSV.

The extension itself does not read student responses or spreadsheet contents. It stores only the teacher-configured dashboard, Google Form, and Google Sheet URLs in Chrome Sync storage.

### Typical workflow

1. Create a Google Form and link it to a Google Sheet.
2. Configure/deploy the companion Google Apps Script attendance dashboard.
3. Save the teacher dashboard URL in the extension once.
4. Click the extension icon at the start of class.
5. Start attendance and project the QR code.
6. Download attendance or open the Google Sheet when needed.

### Features

- One-click launch of the teacher attendance dashboard
- Optional shortcuts to the configured Google Form and Google Sheet
- Minimal Chrome permission: storage only
- No analytics or advertising
- No reading or uploading of student attendance data by the extension

## Category

Productivity

## Single purpose statement

The extension's single purpose is to launch and remember a teacher's configured classroom attendance dashboard and related Google Form/Sheet shortcuts.

## Permission justification

### storage

Used only to remember the teacher-configured dashboard URL and optional Google Form / Google Sheet URLs. These settings are stored in Chrome Sync storage so the configuration can persist between browser sessions and, when Chrome Sync is enabled, across the user's signed-in Chrome devices.

## User data disclosure draft

The extension does not collect or transmit student names, student IDs, attendance responses, spreadsheet contents, authentication credentials, browsing history, financial information, health information, or location data.

The only extension configuration stored is the teacher-provided Google Apps Script dashboard URL and optional Google Form / Google Sheet URLs.

## Suggested screenshots

1. Teacher setup page with dashboard, Form, and Sheet URLs configured
2. Teacher attendance dashboard showing the QR code and live check-in count
3. Dashboard showing Download CSV and Open Google Sheet controls
4. Closed-session screen showing the previous session download option

## Support URL

https://github.com/Lyn-666/attendance-dashboard/issues

## Privacy policy source

See `PRIVACY.md` in this folder. Before publishing, host the privacy policy at a public HTTPS URL and enter that URL in the Chrome Web Store Developer Dashboard.
