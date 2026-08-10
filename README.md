# KARAK Karaoke Night 2026

Sistem pendaftaran statik untuk GitHub Pages. Peserta masuk menggunakan Staff ID, daftar kehadiran, dan boleh menambah, mengedit atau memadam pilihan lagu.

## Jalankan secara lokal

```bash
npx vite
```

## Terbitkan di GitHub Pages

1. Push projek ini ke repository GitHub.
2. Buka **Settings → Pages**.
3. Pilih **GitHub Actions** di bahagian Source.
4. Workflow akan menerbitkan laman secara automatik tanpa server atau proses build.

## Tentang penyimpanan data

GitHub Pages ialah hosting statik dan tidak boleh menulis terus ke fail `data/registrations.json` dalam repository. Versi ini menyimpan pendaftaran sebagai JSON di `localStorage` pelayar dan peserta boleh memuat turun rekod mereka sebagai fail JSON. Data kekal pada peranti/pelayar yang sama sahaja.

Untuk satu senarai pusat yang dikongsi oleh semua staf, sistem memerlukan endpoint tulis yang selamat (contohnya GitHub API melalui serverless function). Jangan letakkan GitHub Personal Access Token di dalam JavaScript awam kerana token itu boleh dicuri.
