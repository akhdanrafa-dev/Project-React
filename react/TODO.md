# TODO: Implementasi Ikon Tanda Seru untuk Developer di Kelola Produk

## Tugas Utama
- Tambahkan ikon tanda seru (!) di setiap produk untuk role developer
- Ikon untuk memberi tahu staff tentang stok menipis atau perubahan nama/deskripsi
- Klik ikon muncul dropdown dengan 3 opsi: ubah stok, ubah nama, ubah deskripsi
- Setiap opsi buka form dengan input nilai baru + textarea keterangan

## Langkah Implementasi
- [x] Tambahkan 'role' => auth()->user()->role ke props di StaffProdukController.php
- [x] Update interface Props di kelola-produk.tsx untuk include role
- [x] Tambahkan kolom baru di tabel untuk ikon tanda seru (hanya untuk developer)
- [x] Implementasi DropdownMenu dengan 3 opsi
- [x] Buat Dialog form untuk setiap opsi (ubah stok, nama, deskripsi)
- [x] Tambahkan state management untuk dialog dan form
- [x] Implementasi submit form dengan router.patch ke endpoint update
- [x] Test implementasi: ikon muncul hanya developer, dropdown & form berfungsi

## File yang Akan Diedit
- react/app/Http/Controllers/StaffProdukController.php
- react/resources/js/Pages/kelola-produk.tsx

## Catatan
- Pastikan hanya role developer yang melihat ikon
- Form include field untuk nilai baru + keterangan
- Update produk via PATCH request
