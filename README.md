# Bot WhatsApp untuk Railway

Bot WhatsApp sederhana yang bisa di-hosting gratis di Railway.app

## Fitur

- 🤖 Perintah dasar (!menu, !info, !ping)
- 📅 Informasi jadwal praktikum dan asistensi
- 📝 Informasi pengumpulan laporan
- 📊 Informasi nilai
- ⚙️ Manajemen pesan terjadwal (untuk admin)
- 🔄 Koneksi yang stabil
- 🚀 Siap di-deploy ke Railway

## Perintah yang Tersedia

### Perintah Umum
- `!bantuan` - Menampilkan daftar perintah yang tersedia
- `!jadwal` - Informasi jadwal praktikum
- `!sesi` - Informasi waktu setiap sesi praktikum
- `!laporan` - Informasi cara mengumpulkan laporan
- `!nilai` - Informasi nilai praktikum
- `!izin` - Informasi izin tidak hadir praktikum
- `!asistensi` - Informasi jadwal asistensi
- `!software` - Link download software praktikum
- `!template` - Link template laporan
- `!tugasakhir` - Informasi tugas akhir

### Perintah Admin
- `!update <perintah> <nilai>` - Memperbarui respons perintah
- `!schedule <groupId> <YYYY-MM-DD> <HH:mm> <pesan>` - Menjadwalkan pesan
- `!listschedules` - Menampilkan daftar pesan terjadwal
- `!cancelschedule <scheduleId>` - Membatalkan pesan terjadwal
- `!showcommands` - Menampilkan nilai semua perintah

## Cara Penggunaan

### Persyaratan
- Akun [Railway](https://railway.app/)
- Node.js versi 18 atau lebih tinggi
- WhatsApp yang terpasang di HP

### Langkah-langkah Deployment

1. Fork repository ini ke akun GitHub Anda

2. Buat project baru di Railway
   - Klik "New Project"
   - Pilih "Deploy from GitHub repo"
   - Pilih repository yang sudah di-fork
   - Klik "Deploy Now"

3. Tunggu proses deployment selesai

4. Buka URL yang diberikan Railway untuk melihat status bot

5. Scan QR Code yang muncul di log Railway menggunakan WhatsApp di HP Anda

### Menjalankan Secara Lokal

1. Clone repository
```bash
git clone https://github.com/username/wa-bot-railway.git
cd wa-bot-railway
```

2. Install dependencies
```bash
npm install
```

3. Jalankan bot
```bash
npm run dev
```

4. Scan QR Code yang muncul di terminal

## Konfigurasi

### Environment Variables
- `PORT` - Port untuk server (default: 3000)

### Admin WhatsApp
Untuk menambahkan admin, tambahkan nomor WhatsApp ke array `ADMIN_NUMBERS` di `index.js`:
```javascript
const ADMIN_NUMBERS = [
    '6287781009836@c.us'  // Format: [nomor]@c.us
];
```

## Pemeliharaan

### Backup Data
- Data pesan terjadwal disimpan di `/sessions/schedules.json`
- Sesi WhatsApp disimpan di folder `/sessions`

### Pembaruan Bot
1. Pull perubahan terbaru dari repository
2. Install dependencies yang diperbarui
3. Deploy ulang ke Railway

## Troubleshooting

### Masalah Umum
1. QR Code tidak muncul
   - Periksa log Railway
   - Pastikan port sudah dikonfigurasi dengan benar

2. Bot terputus
   - Bot akan mencoba reconnect secara otomatis
   - Periksa log untuk detail error

3. Pesan terjadwal tidak terkirim
   - Pastikan format group ID benar
   - Periksa apakah bot masih ada di grup

## Kontribusi

Silakan buat issue atau pull request jika ingin berkontribusi pada project ini.

## Lisensi

Project ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut. 