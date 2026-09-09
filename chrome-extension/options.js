const teacherUrlInput = document.getElementById('teacherUrl');
const formEditUrlInput = document.getElementById('formEditUrl');
const sheetUrlInput = document.getElementById('sheetUrl');
const statusBox = document.getElementById('status');

const DEFAULTS = {
  teacherUrl: '',
  formEditUrl: '',
  sheetUrl: ''
};

init();

document.getElementById('save').addEventListener('click', saveSettings);
document.getElementById('capture').addEventListener('click', captureCurrentGoogleTab);
document.getElementById('openDashboard').addEventListener('click', openDashboard);

async function init() {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  teacherUrlInput.value = settings.teacherUrl || '';
  formEditUrlInput.value = settings.formEditUrl || '';
  sheetUrlInput.value = settings.sheetUrl || '';
}

async function saveSettings() {
  const teacherUrl = normalizeTeacherUrl(teacherUrlInput.value);
  const formEditUrl = normalizeGoogleUrl(formEditUrlInput.value, 'forms');
  const sheetUrl = normalizeGoogleUrl(sheetUrlInput.value, 'spreadsheets');

  if (!teacherUrl) {
    showStatus('Please enter a valid Apps Script /exec teacher URL.', false);
    return;
  }

  if (formEditUrlInput.value.trim() && !formEditUrl) {
    showStatus('The Google Form URL does not look valid.', false);
    return;
  }

  if (sheetUrlInput.value.trim() && !sheetUrl) {
    showStatus('The Google Sheet URL does not look valid.', false);
    return;
  }

  await chrome.storage.sync.set({
    teacherUrl,
    formEditUrl,
    sheetUrl
  });

  teacherUrlInput.value = teacherUrl;
  formEditUrlInput.value = formEditUrl;
  sheetUrlInput.value = sheetUrl;

  showStatus('Saved. Clicking the extension icon will now open the attendance dashboard.', true);
}

async function captureCurrentGoogleTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab || !tab.url) {
    showStatus('Could not read the current tab.', false);
    return;
  }

  const url = tab.url;

  if (url.includes('docs.google.com/forms/')) {
    formEditUrlInput.value = url;
    showStatus('Captured the current Google Form URL. Save settings to keep it.', true);
    return;
  }

  if (url.includes('docs.google.com/spreadsheets/')) {
    sheetUrlInput.value = url;
    showStatus('Captured the current Google Sheet URL. Save settings to keep it.', true);
    return;
  }

  if (url.includes('script.google.com/') && url.includes('/exec')) {
    teacherUrlInput.value = normalizeTeacherUrl(url) || url;
    showStatus('Captured the current Apps Script dashboard URL. Save settings to keep it.', true);
    return;
  }

  showStatus('Open your Google Form, Google Sheet, or deployed Apps Script dashboard first, then try again.', false);
}

async function openDashboard() {
  const saved = await chrome.storage.sync.get(DEFAULTS);
  const teacherUrl = normalizeTeacherUrl(teacherUrlInput.value || saved.teacherUrl);

  if (!teacherUrl) {
    showStatus('Save a valid teacher dashboard URL first.', false);
    return;
  }

  await chrome.tabs.create({ url: teacherUrl });
}

function normalizeTeacherUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (!url.hostname.endsWith('script.google.com')) return '';
    if (!url.pathname.endsWith('/exec')) return '';
    url.searchParams.set('teacher', '1');
    return url.toString();
  } catch (error) {
    return '';
  }
}

function normalizeGoogleUrl(value, type) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    if (url.hostname !== 'docs.google.com') return '';

    if (type === 'forms' && !url.pathname.startsWith('/forms/')) return '';
    if (type === 'spreadsheets' && !url.pathname.startsWith('/spreadsheets/')) return '';

    return url.toString();
  } catch (error) {
    return '';
  }
}

function showStatus(message, success) {
  statusBox.textContent = message;
  statusBox.className = success ? 'ok' : 'error';
}
