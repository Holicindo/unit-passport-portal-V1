# Implementation Plan: SEO Customer Experience Content

## Overview

Rencana ini mencakup 9 tugas untuk memproduksi **aset konten SEO siap pakai** — dokumen Markdown yang terstruktur rapi dan siap disalin ke Google Docs / Word. Output mencakup 15 artikel blog, 5 postingan LinkedIn, 5 deskripsi video YouTube, template dan panduan Google Review, kalender konten 30 hari, dan matriks konten. Semua file ditempatkan di folder `content/` dalam direktori spec ini.

---

## Tasks

- [x] 1. Strategi Kata Kunci & Panduan SEO
  - Buat file `content/01-keyword-strategy.md`
  - Tulis tabel 12 kata kunci dengan kolom: **Kata Kunci | Intent | Platform Target**
    - Sertakan semua 12 kata kunci dari design.md (kenyamanan ruangan, pencahayaan customer experience, suhu ruangan customer satisfaction, pelayanan responsif, customer experience, meningkatkan Google Review, tips pelayanan pelanggan, customer-centric service, cara meningkatkan kepuasan pelanggan, detail pelayanan loyalitas customer, rating bisnis Google, jasa layanan kenyamanan ruangan)
    - Intent: informational / navigational / transactional
    - Platform target: blog / linkedin / youtube / google_review
  - Tulis bagian **Panduan Internal Linking** dengan:
    - Peta linking antar artikel (cluster linking Kelompok A ↔ B ↔ C)
    - Aturan: kelompok yang sama saling link, Kelompok C sebagai pillar content
    - Aturan anchor text: gunakan kata kunci target, hindari "klik di sini"
    - Hindari circular linking lebih dari 2 tingkat
  - Tulis bagian **Panduan Meta Tag** dengan:
    - Aturan title tag: maksimal 60 karakter, mengandung kata kunci utama
    - Aturan meta description: 150–160 karakter, deskriptif, mengandung CTA tersirat
    - Contoh nyata untuk setiap aturan
  - _Requirements: 7.1, 7.2, 7.6_

- [ ] 2. Konten Blog — Kelompok A: Pencahayaan (5 Artikel)
  - Buat file `content/02-blog-lighting.md`
  - Untuk setiap artikel tulis semua elemen berikut secara lengkap:
    - **Judul artikel** (sesuai 5 judul Kelompok A di design.md)
    - **Title Tag** (≤60 karakter, mengandung kata kunci utama)
    - **Meta Description** (150–160 karakter)
    - **H1** (sama dengan judul, mengandung kata kunci utama secara alami)
    - **Struktur Heading H2 dan H3** (outline lengkap)
    - **Outline Konten** (800–1.000 kata: poin-poin per section dengan penjelasan substansial)
    - **Internal Links** (minimal 2 per artikel, dengan anchor text berbasis kata kunci, target ke artikel relevan di Kelompok B atau C)
    - **CTA Google Review** (teks ajakan meninggalkan Google Review)
  - 5 judul:
    1. "Mengapa Pencahayaan yang Tepat Membuat Customer Lebih Nyaman dan Betah"
    2. "Hubungan Antara Cahaya dan Mood: Fakta yang Perlu Diketahui Pebisnis"
    3. "Tips Memilih Pencahayaan Ruangan untuk Meningkatkan Customer Experience"
    4. "Pengaruh Warna Cahaya terhadap Persepsi Kualitas Layanan"
    5. "Kesalahan Pencahayaan yang Tanpa Sadar Menurunkan Kepuasan Customer"
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 3. Konten Blog — Kelompok B: Suhu Ruangan (5 Artikel)
  - Buat file `content/03-blog-temperature.md`
  - Format sama dengan Task 2 (title tag, meta description, H1, H2/H3, outline, internal links, CTA)
  - Setiap artikel **wajib menyertakan studi kasus atau contoh implementasi nyata** (bisnis riil atau skenario konkret) sebagai bagian tersendiri dalam outline
  - 5 judul:
    1. "Peran Suhu Ruangan dalam Menciptakan Pengalaman Customer yang Nyaman"
    2. "Bagaimana Suasana Ruangan Memengaruhi Mood dan Keputusan Customer"
    3. "Standar Suhu Ruangan yang Direkomendasikan untuk Layanan Pelanggan"
    4. "Studi Kasus: Bisnis yang Meningkatkan Rating Setelah Memperbaiki Suhu Ruangan"
    5. "Suhu Ideal vs Suhu Aktual: Cara Mengukur Kenyamanan Termal Customer"
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [ ] 4. Konten Blog — Kelompok C: Detail Pelayanan (5 Artikel)
  - Buat file `content/04-blog-service.md`
  - Format sama dengan Task 2 (title tag, meta description, H1, H2/H3, outline, internal links, CTA)
  - Setiap artikel **wajib menyertakan daftar tips praktis** yang dapat langsung diterapkan pembaca
  - Artikel ke-5 ("Integrasi Pencahayaan, Suhu, dan Pelayanan: Formula Kepuasan Customer") **wajib mengintegrasikan ketiga tema** (pencahayaan + suhu + pelayanan) dalam satu narasi kohesif, dengan section tersendiri untuk masing-masing tema
  - 5 judul:
    1. "Detail Kecil yang Membuat Customer Merasa Diperhatikan dan Ingin Kembali"
    2. "Cara Memahami Keinginan Customer Melalui Pelayanan yang Responsif"
    3. "Mengapa Customer Lebih Puas Saat Kebutuhannya Direspons dengan Cepat"
    4. "Customer-Centric Service: Strategi Melayani yang Berpusat pada Pelanggan"
    5. "Integrasi Pencahayaan, Suhu, dan Pelayanan: Formula Kepuasan Customer"
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Konten LinkedIn (5 Postingan)
  - Buat file `content/05-linkedin-posts.md`
  - Untuk setiap postingan tulis semua elemen berikut secara lengkap:
    - **Judul (EN)** — judul utama dalam Bahasa Inggris
    - **Hook** — 2 baris pembuka yang memancing engagement (bisa EN atau bilingual)
    - **Body lengkap** — teks postingan utuh (bisa bilingual EN/ID)
    - **Hashtag** — 3–5 hashtag relevan untuk audiens profesional B2B
    - **Fakta/Statistik Pendukung** — minimal 1 data atau angka yang mendukung argumen
  - 5 topik sesuai design.md:
    1. "The Role of Lighting and Room Temperature in Customer Experience"
    2. "How Small Service Details Improve Customer Satisfaction and Online Reviews"
    3. "Why Businesses That Prioritize Customer Comfort Get More Google Reviews"
    4. "Customer-Centric Service: The Competitive Edge You're Not Leveraging"
    5. "From Comfort to Loyalty: The Science of Room Environment in Business"
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Konten YouTube (5 Video)
  - Buat file `content/06-youtube-content.md`
  - Untuk setiap video tulis semua elemen berikut secara lengkap:
    - **Judul video** (≤70 karakter, mengandung kata kunci utama)
    - **Panjang judul** (hitung karakter dan cantumkan)
    - **Deskripsi lengkap** yang terdiri dari:
      - *Opening paragraph* (2–3 kalimat dengan kata kunci utama)
      - *Bullet points* poin-poin yang dibahas dalam video
      - *CTA* (ajakan like dan subscribe)
      - *Blog links* (link ke 1–2 artikel blog terkait dari Kelompok A/B/C)
    - **Tags** — 5–10 tag/keyword relevan
  - Untuk judul berbentuk pertanyaan: cantumkan catatan "Jawaban disampaikan dalam 60 detik pertama"
  - 5 judul sesuai design.md:
    1. "Kenapa Lampu dan Suhu Ruangan Bisa Bikin Customer Lebih Nyaman?" *(62 karakter)*
    2. "Cara Meningkatkan Review Positif dari Pengalaman Customer" *(56 karakter)*
    3. "Hal Kecil yang Bikin Customer Betah dan Puas" *(45 karakter)*
    4. "Standar Kenyamanan Ruangan yang Bisnis Sukses Terapkan" *(54 karakter)*
    5. "Detail Pelayanan yang Bikin Customer Mau Balik Lagi" *(51 karakter)*
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 7. Google Review Templates & Panduan
  - Buat file `content/07-google-review.md`
  - **3 Template Review** (teks siap pakai, masing-masing dalam satu paragraf):
    - *Template 1 — Kenyamanan Lengkap*: menyebutkan pencahayaan nyaman, suhu pas, dan staf responsif
    - *Template 2 — Fokus Atmosfer*: menyebutkan lighting/suasana, AC/suhu, dan kecepatan pelayanan
    - *Template 3 — Fokus Pelayanan Detail*: menyebutkan cahaya tidak menyilaukan, ruangan sejuk, dan perhatian staf terhadap detail
    - Setiap template WAJIB menyebutkan: pencahayaan + suhu ruangan + pelayanan responsif
    - Teks harus terkesan autentik, tidak memaksa, natural seperti ulasan organik
  - **Panduan 5 Langkah Meninggalkan Google Review**:
    - Tulis dalam Bahasa Indonesia, mudah dipahami semua usia
    - Langkah-langkah spesifik dan praktis (buka Google Maps, cari bisnis, dst.)
  - **Pertanyaan Pemandu** (untuk customer yang bingung mau nulis apa):
    - Minimal 5 pertanyaan yang membantu customer mengingat dan merumuskan pengalaman mereka
  - **Strategi Timing**:
    - Kapan waktu terbaik meminta review (saat checkout, setelah layanan selesai, dll.)
    - Channel yang disarankan (WhatsApp, email follow-up, QR code, dll.)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 8. Kalender Konten 30 Hari
  - Buat file `content/08-content-calendar.md`
  - Tabel lengkap dengan kolom: **Hari | Tanggal | Platform | Judul Konten | Kata Kunci Utama | Status**
  - 30 entri mencakup semua konten yang diproduksi di Task 2–7, dengan jadwal sesuai design.md:
    - Blog Lighting: Hari 1, 5, 10, 15, 20
    - Blog Temperature: Hari 3, 8, 13, 18, 23
    - Blog Service Detail: Hari 6, 12, 17, 22, 27
    - LinkedIn: Hari 2, 9, 16, 21, 28
    - YouTube: Hari 4, 11, 14, 19, 25
    - Google Review (templates + panduan): Hari 1
  - Status default untuk semua entri: `Draft`
  - Sertakan ringkasan di akhir tabel: jumlah konten per platform
  - _Requirements: 7.3_

- [ ] 9. Matriks Konten
  - Buat file `content/09-content-matrix.md`
  - Tabel ringkasan dengan kolom: **No | Topik | Platform | Kata Kunci Utama | Status Publikasi**
  - Mencakup semua 30 item konten yang diproduksi (15 blog + 5 LinkedIn + 5 YouTube + 3 template review + 1 panduan review + 1 strategi timing)
  - Sertakan bagian **Rekomendasi Lintas Platform**: topik yang berpotensi high-engagement dan dapat dikembangkan ke platform lain
  - Sertakan bagian **Ringkasan**: total konten per platform, total kata kunci tercakup
  - _Requirements: 7.5, 7.7_

---

## Notes

- Semua file ditempatkan di: `.kiro/specs/seo-customer-experience-content/content/`
- Format semua file: **Markdown terstruktur**, siap disalin ke Google Docs atau Word
- Konten blog menggunakan **Bahasa Indonesia**; judul LinkedIn menggunakan **Bahasa Inggris** (body dapat bilingual)
- Panduan Google Review menggunakan **Bahasa Indonesia** yang ramah semua usia
- Task 2–7 dapat dikerjakan secara paralel setelah Task 1 selesai
- Task 8 dikerjakan setelah Task 2–7 selesai (membutuhkan semua judul konten)
- Task 9 dikerjakan terakhir sebagai ringkasan dari semua konten yang diproduksi

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "3", "4", "5", "6", "7"] },
    { "id": 2, "tasks": ["8"] },
    { "id": 3, "tasks": ["9"] }
  ]
}
```
