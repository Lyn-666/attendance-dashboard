const ATTENDANCE_SHEET = 'Attendance';

const SLOT_MS = 15000;               // QR changes every 15 seconds
const HEARTBEAT_TIMEOUT_MS = 20000;  // Teacher page considered closed after 20s
const TICKET_TTL_SECONDS = 180;      // Student gets 3 minutes after successful scan

function getSS_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');

  if (!id) {
    throw new Error('Please run setup() once first.');
  }

  return SpreadsheetApp.openById(id);
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();

  props.setProperty('SPREADSHEET_ID', ss.getId());

  if (!props.getProperty('QR_SECRET')) {
    props.setProperty('QR_SECRET', Utilities.getUuid());
  }

  props.setProperty('STATUS', 'CLOSED');
  props.deleteProperty('SESSION_ID');
  props.deleteProperty('LAST_HEARTBEAT');

  let attendance = ss.getSheetByName(ATTENDANCE_SHEET);

  if (!attendance) {
    attendance = ss.insertSheet(ATTENDANCE_SHEET);
  }

  if (attendance.getLastRow() === 0) {
    attendance.appendRow([
      'Timestamp',
      'Name',
      'Student ID',
      'Session ID'
    ]);
  }
}

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');

  template.token = e.parameter.token || '';
  template.slot = e.parameter.slot || '';
  template.teacher = e.parameter.teacher || '';

  return template
    .evaluate()
    .setTitle('Class Attendance')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getTeacherState() {
  const props = PropertiesService.getScriptProperties();
  const active = isAttendanceActive_();
  const currentSession = props.getProperty('SESSION_ID') || '';
  const lastSession = props.getProperty('LAST_SESSION_ID') || '';
  const ss = getSS_();

  return {
    status: active ? 'OPEN' : 'CLOSED',
    sessionId: currentSession,
    count: active && currentSession ? getAttendanceCountForSession_(currentSession) : 0,
    lastSessionId: lastSession,
    lastCount: lastSession ? getAttendanceCountForSession_(lastSession) : 0,
    sheetUrl: ss.getUrl()
  };
}

function openAttendance() {
  const props = PropertiesService.getScriptProperties();

  if (isAttendanceActive_()) {
    props.setProperty('LAST_HEARTBEAT', String(Date.now()));

    return {
      success: true,
      sessionId: props.getProperty('SESSION_ID')
    };
  }

  const timezone = Session.getScriptTimeZone();
  const sessionId =
    'CLASS-' +
    Utilities.formatDate(
      new Date(),
      timezone,
      'yyyyMMdd-HHmmss'
    );

  props.setProperty('STATUS', 'OPEN');
  props.setProperty('SESSION_ID', sessionId);
  props.setProperty('LAST_HEARTBEAT', String(Date.now()));

  return {
    success: true,
    sessionId: sessionId
  };
}

function closeAttendance() {
  const props = PropertiesService.getScriptProperties();
  const currentSession = props.getProperty('SESSION_ID') || '';

  if (currentSession) {
    props.setProperty('LAST_SESSION_ID', currentSession);
  }

  props.setProperty('STATUS', 'CLOSED');
  props.deleteProperty('LAST_HEARTBEAT');

  return {
    success: true,
    lastSessionId: currentSession,
    lastCount: currentSession ? getAttendanceCountForSession_(currentSession) : 0
  };
}

function teacherHeartbeat() {
  const props = PropertiesService.getScriptProperties();

  if (props.getProperty('STATUS') === 'OPEN') {
    props.setProperty('LAST_HEARTBEAT', String(Date.now()));
    return { active: true };
  }

  return { active: false };
}

function isAttendanceActive_() {
  const props = PropertiesService.getScriptProperties();

  if (props.getProperty('STATUS') !== 'OPEN') {
    return false;
  }

  const lastHeartbeat = Number(props.getProperty('LAST_HEARTBEAT'));

  if (!lastHeartbeat) {
    return false;
  }

  return Date.now() - lastHeartbeat <= HEARTBEAT_TIMEOUT_MS;
}

function getDisplayState() {
  const props = PropertiesService.getScriptProperties();

  if (!isAttendanceActive_()) {
    return { status: 'CLOSED' };
  }

  const sessionId = props.getProperty('SESSION_ID');
  const slot = Math.floor(Date.now() / SLOT_MS);
  const token = makeToken_(sessionId, slot);
  const appUrl = ScriptApp.getService().getUrl();

  const url =
    appUrl +
    '?token=' + encodeURIComponent(token) +
    '&slot=' + encodeURIComponent(slot);

  return {
    status: 'OPEN',
    sessionId: sessionId,
    slot: slot,
    url: url,
    count: getAttendanceCountForSession_(sessionId)
  };
}

function makeToken_(sessionId, slot) {
  const secret = PropertiesService
    .getScriptProperties()
    .getProperty('QR_SECRET');

  if (!secret) {
    throw new Error('QR secret missing. Run setup() first.');
  }

  const message = sessionId + '|' + slot;
  const signature = Utilities.computeHmacSha256Signature(message, secret);

  return Utilities
    .base64EncodeWebSafe(signature)
    .replace(/=+$/, '')
    .substring(0, 16);
}

function validateScan(token, slot) {
  const props = PropertiesService.getScriptProperties();

  if (!isAttendanceActive_()) {
    return {
      valid: false,
      message: 'Attendance is closed.'
    };
  }

  const sessionId = props.getProperty('SESSION_ID');
  const currentSlot = Math.floor(Date.now() / SLOT_MS);
  slot = Number(slot);

  if (!Number.isFinite(slot) || slot !== currentSlot) {
    return {
      valid: false,
      message: 'QR code expired. Please scan the current QR code.'
    };
  }

  const expectedToken = makeToken_(sessionId, slot);

  if (token !== expectedToken) {
    return {
      valid: false,
      message: 'Invalid QR code.'
    };
  }

  const ticket = Utilities.getUuid();

  CacheService
    .getScriptCache()
    .put(
      'ticket_' + ticket,
      sessionId,
      TICKET_TTL_SECONDS
    );

  return {
    valid: true,
    ticket: ticket,
    sessionId: sessionId
  };
}

function submitAttendance(ticket, name, studentId) {
  if (!isAttendanceActive_()) {
    return {
      success: false,
      message: 'Attendance is closed.'
    };
  }

  const props = PropertiesService.getScriptProperties();
  const currentSession = props.getProperty('SESSION_ID');
  const cache = CacheService.getScriptCache();
  const cachedSession = cache.get('ticket_' + ticket);

  if (!cachedSession) {
    return {
      success: false,
      message: 'Your QR session expired. Please scan again.'
    };
  }

  if (cachedSession !== currentSession) {
    return {
      success: false,
      message: 'Invalid attendance session.'
    };
  }

  name = String(name || '').trim();
  studentId = String(studentId || '').trim();

  if (!name || !studentId) {
    return {
      success: false,
      message: 'Please complete all fields.'
    };
  }

  const ss = getSS_();
  const sheet = ss.getSheetByName(ATTENDANCE_SHEET);

  if (!sheet) {
    return {
      success: false,
      message: 'Attendance sheet not found.'
    };
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const existingStudentId = String(data[i][2]).trim();
      const existingSession = String(data[i][3]).trim();

      if (
        existingStudentId === studentId &&
        existingSession === currentSession
      ) {
        return {
          success: false,
          message: 'You have already checked in.'
        };
      }
    }

    sheet.appendRow([
      new Date(),
      name,
      studentId,
      currentSession
    ]);

    cache.remove('ticket_' + ticket);

    return {
      success: true,
      message: 'Attendance recorded successfully!'
    };

  } finally {
    lock.releaseLock();
  }
}

function getCurrentSessionCSV() {
  const props = PropertiesService.getScriptProperties();
  const sessionId = props.getProperty('SESSION_ID') || '';
  return buildSessionCSV_(sessionId);
}

function getLastSessionCSV() {
  const props = PropertiesService.getScriptProperties();
  const sessionId = props.getProperty('LAST_SESSION_ID') || '';
  return buildSessionCSV_(sessionId);
}

function buildSessionCSV_(sessionId) {
  if (!sessionId) {
    return {
      success: false,
      message: 'No attendance session found.'
    };
  }

  const ss = getSS_();
  const sheet = ss.getSheetByName(ATTENDANCE_SHEET);

  if (!sheet) {
    return {
      success: false,
      message: 'Attendance sheet not found.'
    };
  }

  const data = sheet.getDataRange().getValues();
  const rows = [['Timestamp', 'Name', 'Student ID', 'Session ID']];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][3]) === sessionId) {
      rows.push(data[i]);
    }
  }

  const timezone = Session.getScriptTimeZone();
  const csv = rows.map(function(row) {
    return row.map(function(value) {
      let text = value;

      if (value instanceof Date) {
        text = Utilities.formatDate(
          value,
          timezone,
          'yyyy-MM-dd HH:mm:ss'
        );
      }

      text = String(text).replace(/"/g, '""');
      return '"' + text + '"';
    }).join(',');
  }).join('\n');

  return {
    success: true,
    csv: csv,
    filename: sessionId + '-attendance.csv',
    count: Math.max(rows.length - 1, 0)
  };
}

function getAttendanceCountForSession_(sessionId) {
  if (!sessionId) {
    return 0;
  }

  const ss = getSS_();
  const sheet = ss.getSheetByName(ATTENDANCE_SHEET);

  if (!sheet || sheet.getLastRow() < 2) {
    return 0;
  }

  const data = sheet.getDataRange().getValues();
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][3]) === sessionId) {
      count++;
    }
  }

  return count;
}
