/*
 * SETUP: isi APPS_SCRIPT_URL setelah Web App Google Apps Script dideploy.
 * Jangan memasukkan data anggota ke spreadsheet yang dapat diakses publik.
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzLMNNx7ynxVhXvRhalRK-MltrJhrqNY7rVt3R7PDPqcw567-xc04Ti28hX0t3i-a5B/exec";
const form = document.getElementById('memberForm');
const statusEl = document.getElementById('formStatus');
const submitButton = document.getElementById('submitButton');
const result = document.getElementById('membershipResult');
const birthDateInput = document.getElementById('birthDate');
document.getElementById('year').textContent = new Date().getFullYear();
birthDateInput.max = new Date().toISOString().slice(0, 10);

function dateDigits(isoDate) { return (isoDate || '').replaceAll('-', '').slice(2); }
function createMemberCode(birthDate) {
  // Format: KBE-YYMMDD-NNNNNN. NNNNNN adalah nomor peserta acak 6 digit;
  // backend memeriksa duplikasi kode sebelum menyimpan ke spreadsheet.
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const participantNumber = String((bytes[0] % 900000) + 100000);
  return `KBE-${dateDigits(birthDate)}-${participantNumber}`;
}
function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b83f3b' : '#8a5d2d';
}
function showCard(name, code, birthDate) {
  document.getElementById('cardName').textContent = name;
  document.getElementById('cardCode').textContent = code;
  document.getElementById('cardDate').textContent = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase();
  result.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const nik = document.getElementById('nik').value.trim();
  if (!/^\d{16}$/.test(nik)) { setStatus('NIK harus terdiri dari 16 digit angka.', true); return; }
  if (!document.getElementById('consent').checked) { setStatus('Mohon setujui penggunaan data terlebih dahulu.', true); return; }

  const data = {
    fullName: document.getElementById('fullName').value.trim(),
    nik,
    birthDate: birthDateInput.value,
    diagnosis: document.getElementById('diagnosis').value.trim(),
    domicile: document.getElementById('domicile').value.trim(),
    memberCode: createMemberCode(birthDateInput.value),
    submittedAt: new Date().toISOString(),
    consent: 'yes'
  };
  submitButton.disabled = true;
  submitButton.style.opacity = '.65';
  setStatus('Mengirim pendaftaran…');

  if (!APPS_SCRIPT_URL.startsWith('https://script.google.com/macros/s/')) {
    // Mode pratinjau: tidak ada data yang dikirim atau disimpan.
    setStatus('Mode pratinjau: URL Google Apps Script belum dipasang. Kartu contoh ditampilkan, data TIDAK dikirim ke spreadsheet.', true);
    showCard(data.fullName, data.memberCode, data.birthDate);
    submitButton.disabled = false; submitButton.style.opacity = '1';
    return;
  }

  try {
    // no-cors menghindari preflight Apps Script. Respons tidak dapat dibaca browser,
    // sehingga UI tidak mengklaim bahwa penulisan spreadsheet telah terverifikasi.
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    setStatus('Permintaan pengiriman telah dibuat. Karena Google Apps Script tidak mengembalikan konfirmasi yang dapat dibaca browser, tim Enabled perlu memeriksa spreadsheet untuk memastikan data masuk.');
    showCard(data.fullName, data.memberCode, data.birthDate);
    form.reset(); birthDateInput.max = new Date().toISOString().slice(0, 10);
  } catch (error) {
    setStatus('Pengiriman tidak dapat dimulai. Periksa koneksi internet dan URL Apps Script, lalu coba lagi.', true);
  } finally {
    submitButton.disabled = false; submitButton.style.opacity = '1';
  }
});

document.getElementById('downloadCard').addEventListener('click', () => window.print());
document.getElementById('copyCode').addEventListener('click', async () => {
  const code = document.getElementById('cardCode').textContent;
  try { await navigator.clipboard.writeText(code); document.getElementById('copyCode').textContent = 'Kode tersalin ✓'; }
  catch { setStatus(`Salin kode ini secara manual: ${code}`); }
});
