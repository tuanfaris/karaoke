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

## Supabase database setup

1. Open the Supabase project dashboard.
2. Open **SQL Editor** and create a new query.
3. Paste and run the complete [`supabase/schema.sql`](supabase/schema.sql) file.
4. The website then stores registrations centrally in Supabase; browser storage is only a local cache.

The publishable key in the frontend is intentionally public. Never add the Supabase secret key, service-role key, database password, or connection string to this repository.
