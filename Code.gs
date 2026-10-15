/**
 * Google Apps Script backend untuk spreadsheet Enabled Membership.
 * Buat spreadsheet baru yang aksesnya dibatasi ke petugas berwenang.
 * Di Extensions > Apps Script, tempel file ini, isi SPREADSHEET_ID, lalu deploy sebagai Web app.
 * Jalankan fungsi setupSheet() sekali dari editor untuk membuat header.
 */
const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'Registrasi Member';

function setupSheet() {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Waktu registrasi', 'Kode anggota', 'Nama lengkap', 'NIK', 'Tanggal lahir', 'Diagnosis', 'Domisili', 'Persetujuan']);
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    validate_(payload);
    const sheet = getSheet_();
    if (sheet.getLastRow() === 0) setupSheet();
    // Format kode anggota sebagai teks agar angka tidak diubah oleh Sheets.
    sheet.getRange('B:B').setNumberFormat('@');

    // Idempotency/duplicate protection for a retried request.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existing = sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues().flat();
      if (existing.includes(payload.memberCode)) {
        throw new Error('Kode anggota duplikat. Silakan kirim ulang pendaftaran.');
      }
      // Cegah pendaftaran berulang menggunakan NIK yang sama.
      const existingNiks = sheet.getRange(2, 4, lastRow - 1, 1).getDisplayValues().flat();
      if (existingNiks.includes(String(payload.nik))) {
        throw new Error('NIK sudah terdaftar. Hubungi tim Enabled jika membutuhkan bantuan.');
      }
    }
    sheet.appendRow([
      new Date(), safeCell_(payload.memberCode), safeCell_(payload.fullName),
      safeCell_(payload.nik), safeCell_(payload.birthDate), safeCell_(payload.diagnosis),
      safeCell_(payload.domicile), payload.consent === 'yes' ? 'Ya' : 'Tidak'
    ]);
    return json_({ ok: true, memberCode: payload.memberCode });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Pendaftaran tidak dapat diproses.' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ service: 'Enabled Membership API', status: 'ready' });
}
function getSheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf('PASTE_') === 0) throw new Error('Set SPREADSHEET_ID first.');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}
function validate_(p) {
  if (!p.fullName || !/^\d{16}$/.test(String(p.nik || '')) || !/^\d{4}-\d{2}-\d{2}$/.test(String(p.birthDate || '')) || !p.diagnosis || !p.domicile || !/^KBE-\d{6}-\d{6}$/.test(String(p.memberCode || '')) || p.consent !== 'yes') {
    throw new Error('Invalid or incomplete member data.');
  }
}
function safeCell_(value) {
  const text = String(value == null ? '' : value).trim();
  // Prevent spreadsheet formula injection from user-entered values.
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
