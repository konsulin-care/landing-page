---
title: "Protokol Pengungkapan dan Penanganan Data #JadiTangguh"
version: "1.0.0"
status: frozen
effective_date: "TODO(maintainer)"
steward: "Aly Lamuri"
reviewer: "Haykal Hafidzul Arifin (Ilmuwan, Biro Psikologi Attentive)"
supersedes: null
---

# Protokol Pengungkapan dan Penanganan Data #JadiTangguh

Dokumen ini menjelaskan bagaimana data studi #JadiTangguh dikumpulkan, disimpan, diolah, dan dibuka untuk publik. Dokumen ini ditujukan untuk auditor, pengguna data, dan siapa pun yang ingin memeriksa cara kami bekerja.

## Ruang lingkup dan versi

- Protokol ini berlaku untuk seluruh data yang dikumpulkan melalui #JadiTangguh.
- Setiap perubahan protokol adalah satu commit baru di repositori. Pengguna teknis merujuk versi tertentu melalui tautan permanen GitHub, misalnya https://github.com/konsulin-care/landing-page/blob/&lt;sha&gt;/static/disclosure/protocol.md
- Kolom `supersedes` di atas memuat tautan permanen versi sebelumnya, dan riwayat perubahan di bagian akhir dokumen mencatat setiap versi.
- Perubahan aturan hanya berlaku untuk data yang dikumpulkan setelah tanggal berlaku versi baru. Perubahan yang bersifat material diumumkan kepada peserta.

## Peran

- Penjaga data (data steward) adalah Aly Lamuri, peneliti utama studi.
- Peninjau kedua adalah Haykal Hafidzul Arifin, Ilmuwan di Biro Psikologi Attentive.
- Keduanya menandatangani setiap rilis data publik dan setiap permintaan akses data terbatas.
- Pertanyaan tentang protokol ini dikirim ke hello@konsulin.care

## Data yang dikumpulkan

- Data demografis, yaitu usia, jenis kelamin, kabupaten/kota, pendidikan terakhir, status pekerjaan, status hubungan, dan pengeluaran rumah tangga.
- Jawaban kuesioner pada tingkat butir pertanyaan, catatan persetujuan, dan waktu pengisian.
- Email, hanya jika peserta memilih menyimpan laporan. Sistem memegang email tersebut, hanya peserta yang bisa melihatnya, dan email tidak bisa diekstrak oleh peneliti.
- Pola rujukan, yaitu catatan jika peserta datang melalui tautan undangan teman.
- Survei tidak mengumpulkan data perangkat atau data teknis lainnya. Nama instrumen tidak disebutkan dalam dokumen ini.

## Penyimpanan dan keamanan

- Patient ID pseudonim (FHIR) disimpan di jaringan privat yang hanya bisa diakses oleh sistem backend, dengan pembatasan akses berdasarkan peran (RBAC) dan pengamanan lain.
- Peneliti hanya melihat ID peserta acak, bukan identitas pribadi peserta.
- Data mentah tidak pernah keluar dari lingkungan backend.

## Tingkat rilis

| Tingkat | Isi | Akses |
| --- | --- | --- |
| Agregat | Tabel ringkasan, laporan peserta, email hasil agregat. Sel berukuran kurang dari 11 disembunyikan. | Publik |
| Data publik per gelombang | Data mikro per gelombang yang sudah dilindungi. | Publik, Harvard Dataverse, lisensi CC BY 4.0 dengan ketentuan penggunaan yang melarang identifikasi ulang |
| Data terbatas | Butir pertanyaan, kabupaten/kota, data longitudinal yang tertaut antargelombang, dan sisi rujukan. | Konsulin, unduhan terkendali di bawah Perjanjian Penggunaan Data |
| Data asli | Seluruh data mentah. | Hanya backend, tidak pernah keluar |

## Pengolahan data publik

- Data dirilis per gelombang pada awal gelombang berikutnya, dengan jarak sekitar tiga bulan.
- Data publik bersifat potong lintang. Tidak ada ID yang menghubungkan antargelombang.
- Setiap gelombang memuat sekitar 70 persen peserta yang dipilih acak secara independen, dan bobot pascastratifikasi (usia kali jenis kelamin menurut BPS) menyertai data.
- ID acak per gelombang dibuat di dalam alur rilis, bukan diturunkan dari Patient ID. Pemetaannya dihapus setelah rilis, dan ID dibuat ulang untuk setiap versi.
- Data demografis publik dibatasi pada usia (3 kelompok), jenis kelamin, dan kelompok pulau. Data demografis lain hanya muncul pada ekstrak khusus publikasi atau pada data terbatas.
- Skor total instrumen dipublikasikan apa adanya, disertai pertukaran terarah untuk catatan yang jarang di antara kelas yang mirip, dan dilakukan terpisah untuk setiap gelombang.
- Jawaban tingkat butir dipublikasikan sebagai berkas terpisah tanpa penanda dan tanpa skor total, dengan urutan baris diacak sendiri.
- Kuasi-penanda pada data publik memenuhi k ≥ 11, dengan target internal 20. Skor sensitif yang dikelompokkan memenuhi l ≥ 2.
- Tidak ada resampling. Penyesuaian keterwakilan dilakukan dengan bobot.
- Waktu pengisian diperkecil menjadi nomor gelombang. Urutan baris diacak, dan metadata berkas dihapus.
- Sisi rujukan tidak pernah dipublikasikan, hanya agregatnya. Teks bebas tidak pernah dipublikasikan.

## Uji sebelum rilis

- Pemeriksaan k dan l dijalankan dengan ARX atau sdcMicro, dan konfigurasinya disimpan di repositori.
- Pemeriksaan rilis berurutan, yaitu kelas yang berubah tepat satu orang antara dua gelombang digabung atau disembunyikan.
- Simulasi serangan penautan pada gelombang publik terakhir, memakai data asli sebagai kebenaran acuan. Tingkat keberhasilan penautan harus tetap dekat dengan baseline acak.
- Tinjauan penyusup termotivasi, lalu persetujuan penjaga data dan peninjau kedua.
- Pemeriksaan hukum atas klaim anonimitas menurut UU PDP No. 27/2022 sebelum rilis pertama.

## Paket replikasi publikasi

- Untuk setiap publikasi, himpunan variabel minimum yang dipakai analisis, pada k ≥ 11, beserta kode analisisnya.
- Untuk hasil longitudinal, panel tertaut sintetis yang diberi label sintetis sebagai pengganti data asli, beserta statistik cukup yang mereproduksi estimasi utama.
- Paket diterbitkan di Harvard Dataverse dengan DOI, dan dirujuk pada pernyataan ketersediaan data di publikasi.

## Data terbatas

- Isi data terbatas adalah jawaban tingkat butir, kabupaten/kota, data longitudinal yang tertaut antargelombang, dan sisi rujukan.
- Permintaan dikirim ke hello@konsulin.care dan dinilai kasus per kasus oleh penjaga data dan peninjau kedua. Alasan penolakan dicatat.
- Perjanjian Penggunaan Data mengatur larangan identifikasi ulang, larangan penautan, larangan berbagi lebih lanjut, keamanan, retensi dan pemusnahan, pelaporan insiden, aturan publikasi, dan hak audit.
- Akses diberikan melalui unduhan terkendali.
- Pihak yang mendapat akses tercatat di /disclosure/data-access-register.md dan templat Perjanjian Penggunaan Data tersedia atas permintaan.
- Data terbatas dijelaskan melalui catatan metadata berDOI yang tidak memuat berkas data.

## Penarikan

Anda bisa menarik data kapan saja sebelum tanggal rilis. Kami mengumumkan tanggal rilis sedikitnya 14 hari sebelumnya, lewat email untuk peserta yang mendaftar dan di situs ini. Penarikan sebelum tanggal rilis dihormati untuk semua rilis yang belum terbit. Data yang sudah terbit tidak dapat ditarik kembali, dan data yang belum diklaim tidak bisa dikenali sehingga tidak bisa ditarik.

## Retensi

TODO(maintainer)

## Hasil untuk peserta

- Ringkasan langsung tersedia setelah peserta mengirim jawaban.
- Email hasil agregat dikirim satu bulan setelah pengumpulan data ditutup, dihitung dari data asli, dengan sel berukuran kurang dari 11 disembunyikan.
- Email lanjutan dikirim saat hasil penelitian terbit.

## Risiko sisa

- Tidak ada rilis data yang bebas risiko. Risiko menumpuk seiring bertambahnya gelombang, dan data yang sudah terbit tidak dapat ditarik kembali.
- Ambang 0,09 yang dipakai EMA Policy 0070 dan Health Canada PRCI adalah konvensi, bukan kewajiban hukum. Kami memakainya sebagai rujukan bersama k ≥ 11.
- Protokol ini dirancang untuk menekan risiko, bukan menjanjikan risiko nol.

## Riwayat perubahan

- 1.0.0, versi pertama, dibekukan.
