# Stock Take · Mediviron Kota Masai

Website untuk stock take ubat bulanan. Staf buka link, taip nama ubat dan bilangan, dan hantar laporan Excel/PDF ke accountant. **Tiada login.** Semua staf nampak data yang sama bila database (Supabase) disambung.

---

## Panduan serah kepada klinik

Tujuan: website dan database jadi **milik akaun klinik**, bukan akaun peribadi. Lepas siap, pembina asal boleh tinggalkan projek ni tanpa kesan kepada klinik.

Masa diperlukan: lebih kurang 30 minit, guna laptop/Mac.

### Langkah 1 · Akaun GitHub klinik (manager)
1. Buka https://github.com/signup dan daftar guna **email klinik** (bukan email peribadi).
2. Ingat nama akaun (contoh: `mediviron-kotamasai`).

### Langkah 2 · Pindah website (pembina asal)
1. Log masuk GitHub, buka https://github.com/niknajlaa30-pixel/stock-take
2. Tekan **Settings**, scroll ke bawah sekali ke **Danger Zone**, dan tekan **Transfer ownership**.
3. Taip nama akaun klinik, kemudian sahkan.
4. Manager akan dapat email dan perlu tekan **Accept**.

### Langkah 3 · Hidupkan website di akaun klinik (manager)
1. Dalam repo `stock-take` (akaun klinik), tekan **Settings**, kemudian **Pages**.
2. Di **Branch**, pilih `main` dan folder `/ (root)`, kemudian tekan **Save**.
3. Tunggu 2 minit. Link baru: `https://NAMA-AKAUN-KLINIK.github.io/stock-take/`

### Langkah 4 · Database supaya semua staf kongsi data (manager)
1. Buka https://supabase.com dan daftar guna **email klinik**.
2. Tekan **New project**, beri nama `stock-take`, dan pilih region **Singapore**. Simpan kata laluan database di tempat selamat.
3. Bila project siap, buka **SQL Editor**. Salin **semua** isi fail `supabase-setup.sql`, tampal, dan tekan **Run**.
4. Pergi ke **Project Settings → API**. Salin **Project URL** dan kunci **anon public**.
   **Jangan** guna kunci `service_role`.
5. Di GitHub, buka fail `config.js` dalam repo, dan tekan ikon **pensil (Edit)**.
6. Tampal URL di antara tanda `""` selepas `supabaseUrl:`, dan kunci di antara `""` selepas `supabaseAnonKey:`.
7. Tekan **Commit changes**. Tunggu 2 minit, kemudian buka link website.
   Kotak "Database online belum disambung" sepatutnya dah hilang.

### Langkah 5 · Kongsi dengan staf
- Hantar link website dalam group staf sahaja.
- Di iPhone: buka link dalam Safari, tekan **Share**, kemudian **Add to Home Screen**.
- Di Android: buka link dalam Chrome, tekan **⋮**, kemudian **Add to Home screen**.
- Setiap staf taip nama sendiri di kotak **"Key in oleh"**. Phone akan ingat nama tu.

### Langkah 6 · Selepas serah (pembina asal)
- Page lama di claude.ai boleh dipadam. **Data dalam page lama tak pindah automatik.** Muat turun Excel setiap bulan yang perlu disimpan sebelum padam.
- Folder di Mac dan chat Claude boleh dipadam. Website klinik tak terjejas.

---

## Perlu tahu
- **Sesiapa yang ada link** boleh tambah, ubah dan padam kiraan. Kongsi link dengan staf sahaja.
- Setiap kiraan merekod **siapa key in, siapa ubah, dan siapa padam**. Rekod "Kiraan yang dipadam" tak boleh dipadam dari website.
- Supabase percuma akan **"tidur" kalau 7 hari tiada siapa guna**. Untuk hidupkan semula, log masuk ke supabase.com dan tekan **Restore project**. Data tak hilang.
- **Jangan masukkan maklumat pesakit.** Website ni untuk stok ubat sahaja.
- Maklumat accountant (telefon dan email) boleh ditukar dalam website, guna butang **✎ Ubah** di bahagian "Hantar ke accountant".

## Untuk developer
- `page.html` ialah satu-satunya sumber page (sama dengan versi claude.ai).
- `shim.js` menyambung page ke Supabase (satu jadual `docs`) dan ke muat turun browser.
- Selepas ubah `page.html`, jalankan `python3 build.py` untuk jana `index.html`, kemudian commit.
