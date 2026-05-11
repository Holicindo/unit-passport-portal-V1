# Holicindo Unit Passport Portal

Unit Passport Portal adalah platform digital berbasis QR Code untuk mengelola informasi, dokumentasi, dan riwayat servis setiap unit Holicindo.

Setiap unit akan memiliki QR Code unik. Ketika QR Code discan, customer atau teknisi dapat melihat informasi unit, spesifikasi teknis, manual, wiring diagram, video tutorial, dan riwayat servis.

## Main Goals

- Membuat halaman Unit Passport yang mobile-first
- Menampilkan data unit berdasarkan QR Code
- Menyediakan akses cepat ke manual, wiring diagram, dan video tutorial
- Menyediakan fitur request service
- Menyediakan dashboard admin untuk mengelola unit, client, dan QR Code
- Menyediakan client dashboard untuk melihat daftar aset/unit

## Week 1 Focus

- Day 1: NDA, G Suite onboarding, GitHub setup
- Day 2: Cloudflare DNS shielding
- Day 3: Server setup
- Day 4-5: Audit dan backup WordPress existing

## Security Notes

- Tidak menyimpan password, API key, credential, atau database mentah di repository
- Semua akses menggunakan email perusahaan
- Repository harus private