# Stock Take

Website ringkas untuk stock take ubat bulanan. Sesiapa yang ada link boleh buka dan guna, tanpa login.

- `index.html`, `app.js`: website.
- `config.js`: sambungan ke database online (Supabase). Kalau kosong, kiraan disimpan dalam browser itu sahaja.
- `supabase-setup.sql`: jadual database. Tampal dalam Supabase → SQL Editor → Run.

## Sambung ke database online (sekali sahaja)

1. Buka https://supabase.com dan daftar akaun percuma.
2. Tekan **New project**. Beri nama `stock-take` dan pilih region **Singapore**. Simpan kata laluan database di tempat selamat.
3. Bila project dah siap, pergi ke **SQL Editor**, tampal semua isi `supabase-setup.sql`, dan tekan **Run**.
4. Pergi ke **Project Settings → API**. Salin **Project URL** dan kunci **anon public**.
5. Letak kedua-duanya dalam `config.js`. Jangan guna kunci `service_role`.

## Perlu tahu

- Siapa saja yang ada link boleh tambah, ubah dan padam kiraan. Kongsi link dengan staf sahaja.
- Supabase percuma akan "tidur" kalau tiada siapa guna selama 7 hari. Untuk hidupkan semula, log masuk ke supabase.com dan tekan **Restore project**. Data tak hilang.
- Jangan masukkan maklumat pesakit di sini. Website ni untuk stok ubat sahaja.
