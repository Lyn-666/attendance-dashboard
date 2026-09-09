const DEFAULTS = {
  teacherUrl: '',
  formEditUrl: '',
  sheetUrl: ''
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set(current);
});

chrome.action.onClicked.addListener(async () => {
  const settings = await chrome.storage.sync.get(DEFAULTS);

  if (!settings.teacherUrl) {
    await chrome.runtime.openOptionsPage();
    return;
  }

  const normalized = normalizeTeacherUrl(settings.teacherUrl);
  if (!normalized) {
    await chrome.runtime.openOptionsPage();
    return;
  }

  await chrome.tabs.create({ url: normalized });
});

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
