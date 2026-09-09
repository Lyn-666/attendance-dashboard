# Publishing to the Chrome Web Store

This folder is intended to be the upload root for the Chrome Web Store package.

## Before uploading

1. Confirm the extension works with `chrome://extensions` → **Developer mode** → **Load unpacked**.
2. Verify the teacher dashboard opens when clicking the toolbar icon.
3. Verify the options page can save, reopen, and clear the teacher dashboard URL.
4. Verify optional Google Form and Google Sheet shortcuts open correctly.
5. Confirm `manifest.json` has the correct version number.
6. Confirm no student data, Spreadsheet IDs, deployment secrets, or real classroom exports are included in this folder.
7. Host `PRIVACY.md` at a public HTTPS URL and use that URL in the Chrome Web Store privacy field.

## Create the upload ZIP

Zip the **contents** of the `chrome-extension/` folder so that `manifest.json` is at the root of the ZIP.

The package should contain at least:

```text
manifest.json
background.js
options.html
options.js
PRIVACY.md
STORE_LISTING.md
icons/
  icon16.png
  icon32.png
  icon48.png
  icon128.png
```

Documentation files may remain in the ZIP, but they are not required by Chrome at runtime.

## Developer Dashboard

1. Register for a Chrome Web Store developer account.
2. Open the Chrome Web Store Developer Dashboard.
3. Click **Add new item**.
4. Upload the ZIP.
5. Fill in the store listing using `STORE_LISTING.md` as the draft copy.
6. Upload required screenshots and promotional assets.
7. Complete the Privacy practices section.
8. Set Distribution to **Public** if you want the extension searchable in the store.
9. Submit for review.

## Privacy practices guidance

The extension currently requests only:

```text
storage
```

Justification: it stores the teacher-configured Apps Script dashboard URL and optional Google Form / Google Sheet URLs in Chrome Sync storage.

The extension does not read student responses, spreadsheet contents, page contents, passwords, browsing history, or authentication tokens.

## Version updates

For every Web Store update:

1. Increment the version in `manifest.json`, for example `1.0.0` → `1.0.1`.
2. Test with Load unpacked.
3. Build a fresh ZIP.
4. Upload it as a new package in the Chrome Web Store Developer Dashboard.

## Important architecture note

The Chrome extension is the launcher. The Google Apps Script Web App remains the attendance backend and teacher QR dashboard. A public extension installation alone does not automatically deploy the Apps Script backend into a teacher's Google account.

A future fully self-service version could use Google OAuth and the Google Drive/Forms/Sheets APIs to create/configure the backend automatically, but that would require additional permissions, OAuth verification, and a more extensive Chrome Web Store privacy review.
