# Universal Game Manager — Pixel Worlds module

Prototipe local-first multi-game. Modul Pixel Worlds sudah memiliki:
- Inventory: tambah item dan hapus item.
- World: catat world dan jumlah blok terpasang, terpisah dari inventory.
- Events: catat target dan progres.
- IndexedDB untuk penyimpanan lokal.
- Ekspor/impor backup JSON.
- PWA dasar untuk cache offline melalui HTTPS/localhost.

## Uji lokal
Jalankan `python -m http.server 8000` di folder ini, lalu buka `http://localhost:8000`.
Untuk instalasi PWA/service worker, gunakan HTTPS atau localhost.

## Penting
Data browser dapat hilang jika data situs dihapus atau perangkat/browser diganti. Ekspor backup secara berkala. File backup JSON tidak dienkripsi. Jangan masukkan password, token, atau kredensial akun game. Ini prototipe awal dan belum diaudit keamanan. Tidak ada integrasi otomatis ke game, server cloud, analitik, iklan, atau Google Gemini AI.
