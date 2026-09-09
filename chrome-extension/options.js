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
document.getElementById('openDashboard').addEventListener('click', openDashboard);
document.getElementById('openForm').addEventListener('click', openForm);
document.getElementById('openSheet').addEventListener('click', openSheet);
document.getElementById('clear').addEventListener('click', clearSettings);

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

  await chrome.storage.sync.set({ teacherUrl, formEditUrl, sheetUrl });

  teacherUrlInput.value = teacherUrl;
  formEditUrlInput.value = formEditUrl;
  sheetUrlInput.value = sheetUrl;

  showStatus('Saved. Clicking the extension icon will open the attendance dashboard.', true);
}

async function clearSettings() {
  await chrome.storage.sync.clear();
  teacherUrlInput.value = '';
  formEditUrlInput.value = '';
  sheetUrlInput.value = '';
  showStatus('Saved settings cleared.', true);
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

async function openForm() {
  const saved = await chrome.storage.sync.get(DEFAULTS);
  const formUrl = normalizeGoogleUrl(formEditUrlInput.value || saved.formEditUrl, 'forms');

  if (!formUrl) {
    showStatus('Save a valid Google Form URL first.', false);
    return;
  }

  await chrome.tabs.create({ url: formUrl });
}

async function openSheet() {
  const saved = await chrome.storage.sync.get(DEFAULTS);
  const sheetUrl = normalizeGoogleUrl(sheetUrlInput.value || saved.sheetUrl, 'spreadsheets');

  if (!sheetUrl) {
    showStatus('Save a valid Google Sheet URL first.', false);
    return;
  }

  await chrome.tabs.create({ url: sheetUrl });
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
