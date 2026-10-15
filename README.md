# Enabled Membership — mobile-first landing page

Landing page registrasi member dengan kartu virtual dan backend Google Sheets melalui Google Apps Script. Dibuat sebagai static site agar dapat di-host di GitHub Pages.

## Struktur

- `index.html` — halaman dan formulir.
- `styles.css` — responsive UI, warna beige `#ead1a4`, navy dan coral.
- `script.js` — validasi formulir, pembuatan kode unik format `KBE-YYMMDD-NNNNNN`, tampilan kartu, dan pengiriman data.
- `apps-script/Code.gs` — backend untuk menyimpan data dan kode unik ke spreadsheet, dengan pemeriksaan duplikasi kode dan NIK.
- `apps-script/Code.gs` — endpoint yang menulis data ke Google Sheets.
- `assets/logo.png` dan `assets/anak.png` — tempatkan aset milik Anda di sini.

> File gambar `logo.png` dan `anak.png` tidak tersedia di berkas yang diterima saat proyek ini dibuat. Tambahkan sendiri dengan nama dan lokasi persis seperti di atas. Gambar anak diposisikan di pojok kanan bawah area ilustrasi dan tidak memiliki animasi/gerakan.

## A. Siapkan spreadsheet pribadi

1. Buat Google Spreadsheet baru dengan akses **Restricted / Dibatasi**. Jangan pernah mengaktifkan akses publik karena sheet menyimpan NIK dan diagnosis.
2. Salin ID spreadsheet dari URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.
3. Buka **Extensions → Apps Script**. Tempel isi `apps-script/Code.gs`.
4. Ganti `PASTE_SPREADSHEET_ID_HERE` dengan ID spreadsheet.
5. Jalankan `setupSheet()` sekali dari editor dan setujui izin yang diminta.
6. Pilih **Deploy → New deployment → Web app**. Jalankan sebagai akun Anda. Untuk menerima kiriman dari landing page, set akses web app sesuai kebijakan organisasi Anda (sering kali “Anyone”); ini membuat endpoint dapat dipanggil publik, jadi jangan gunakan data nyata sebelum menguji kontrol akses dan risiko spam.
7. Salin URL Web App yang berakhiran `/exec`.

## B. Sambungkan frontend

Di `script.js`, ganti:

```js
const APPS_SCRIPT_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

dengan URL Web App `/exec`. Deploy ulang versi Apps Script jika kode backend berubah. Uji dengan data dummy terlebih dahulu dan pastikan baris masuk ke sheet.

**Penting:** browser menggunakan `fetch(..., mode: 'no-cors')` karena Apps Script tidak selalu menyediakan CORS response yang dapat dibaca. Dengan demikian, halaman hanya dapat menyatakan bahwa permintaan pengiriman telah dibuat—bukan mengonfirmasi bahwa penulisan ke spreadsheet berhasil. Tim perlu memverifikasi sheet. Untuk pengalaman produksi yang menampilkan status sukses yang benar-benar terverifikasi, gunakan backend/API dengan CORS dan autentikasi yang tepat.

## C. Publikasikan melalui GitHub Pages

1. Buat repository GitHub baru, misalnya `enabled-membership`.
2. Upload `index.html`, `styles.css`, `script.js`, folder `assets/`, dan folder `apps-script/`.
3. Buka **Settings → Pages**.
4. Pilih **Deploy from a branch**, pilih `main` dan folder `/ (root)`, lalu Save.
5. Buka URL GitHub Pages yang diberikan dan uji tampilan di ukuran handphone.

## Privasi dan keamanan — sebelum produksi

- NIK dan diagnosis merupakan data sensitif. Pastikan ada dasar pemrosesan yang sah, pemberitahuan privasi yang jelas, tujuan dan masa retensi yang terbatas, serta mekanisme untuk pertanyaan/penghapusan data sesuai aturan yang berlaku.
- Jangan menaruh spreadsheet atau kredensial rahasia di repository publik. ID spreadsheet pada Apps Script bukan password, tetapi tetap batasi akses sheet.
- Endpoint publik berpotensi menerima spam. Untuk penggunaan produksi, pertimbangkan autentikasi, pembatasan laju, CAPTCHA, pencatatan audit, dan pemeriksaan duplikasi NIK di server.
- Kode KBE pada versi ini memakai format `KBE-YYMMDD-NNNNNN`: `YYMMDD` berasal dari tanggal lahir dan `NNNNNN` adalah nomor peserta acak 6 digit. Kode yang sama dikirim bersama data anggota dan dicatat di kolom Kode anggota pada spreadsheet. Backend memeriksa duplikasi kode dan NIK sebelum menambahkan baris. Karena nomor peserta dibuat di browser, nomor tersebut bukan nomor urut pendaftaran global. Jangan menggunakan kode ini sebagai bukti identitas atau hak akses tanpa verifikasi server.
- Copy manfaat menyebut target kemitraan 100 rumah sakit dan 1.000 supplier, bukan klaim bahwa jumlah tersebut telah aktif diverifikasi. Pastikan kerja sama GrabCar/GoCar dan akses donasi benar-benar tersedia sebelum menjanjikannya kepada anggota.
- Kartu di prototipe hanya tampilan digital awal; status pendaftaran perlu dikonfirmasi oleh petugas.

## Pengujian lokal

Buka `index.html` langsung untuk memeriksa layout. Tanpa URL Apps Script, form berjalan dalam mode pratinjau dan **tidak mengirim atau menyimpan data**. Untuk uji integrasi, isi URL endpoint dan gunakan data dummy.
