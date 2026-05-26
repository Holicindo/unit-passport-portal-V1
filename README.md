# Unit Passport Portal (v1)

![Node.js](https://img.shields.io/badge/Node-18%2B-green) ![Next.js](https://img.shields.io/badge/Next-14-blue) ![License](https://img.shields.io/badge/License-MIT-lightgrey)

A premium, role‑based web portal for Holicindo’s unit management. It supports four access levels:
- **Guest (Level 1)** – Scan QR, view basic specs, submit a public *Report Issue*.
- **Client (Level 2)** – Invitation‑only client portal (`/client-portal/*`) with dashboard, fleet overview, warranty status, and messaging.
- **Partner (Level 3)** – Technician portal with deep technical data.
- **Admin (Level 4)** – Full admin dashboard for HQ monitoring.

## ✨ Key Features (implemented)
- Public service request stored as `ServiceLog` (visible to admin).
- Dedicated `/client-portal` namespace with its own layout, sidebar, and top‑bar.
- Client dashboard showing total units, active units, maintenance alerts, and warranty count.
- Fleet page with searchable table, unit detail view, and status badges.
- Unit detail page with technical specs, placement info, and service‑history timeline.
- Warranty page that calculates 1‑year warranty expiry and highlights expired units.
- Messages page (placeholder inbox) and report detail viewer for clients.
- Role‑based guards updated to allow `CLIENT` role on report endpoints.
- Login flow redirects CLIENT users to `/client-portal/dashboard`.
- Premium UI using custom CSS (glass‑morphism, gradients, micro‑animations).

## 📦 Installation
```bash
# Clone the repo
git clone https://github.com/Holicindo/unit-passport-portal-V1.git
cd unit-passport-portal-V1

# Install dependencies (both frontend & backend)
npm install

# Copy env template and edit values
cp .env.example .env
# Adjust NEXT_PUBLIC_API_URL, DB credentials, JWT secret, etc.
```

## 🚀 Running locally
### Frontend (Next.js)
```bash
cd app/frontend
npm run dev   # http://localhost:3000
```
### Backend (NestJS)
```bash
cd app/backend
npm run start:dev   # http://localhost:3001
```
(Use `npm run start` for production.)

## 📁 Folder structure (high‑level)
```
app/
├─ backend/      # NestJS API
│  ├─ src/
│  └─ uploads/   # unit media files
└─ frontend/     # Next.js UI
   ├─ src/
   │  ├─ app/
   │  │  ├─ client-portal/   # new client portal pages
   │  │  │  ├─ dashboard/
   │  │  │  ├─ fleet/
   │  │  │  ├─ units/[id]/
   │  │  │  ├─ warranty/
   │  │  │  └─ messages/
   │  └─ components/
   └─ public/
```

## 🛠️ Tech Stack
| Layer | Technology |
|------|------------|
| Frontend | Next.js (React 18) |
| UI | Vanilla CSS with custom design tokens |
| Backend | NestJS (Express) |
| Database | PostgreSQL |
| Auth | JWT + role‑based guards |

## 📸 Screenshots (demo)
*Dashboard* | *Fleet list* | *Unit detail*
--- | --- | ---
![Dashboard](./docs/screenshots/dashboard.png) | ![Fleet](./docs/screenshots/fleet.png) | ![Unit](./docs/screenshots/unit.png)

## 📚 API Docs
Swagger UI is available at `http://localhost:3001/api-docs`. Important endpoints:
- `GET /reports/:id` – client can view their own service reports.
- `GET /client-portal/fleet` – list of units owned by the logged‑in client.
- `POST /service-logs` – public service request (no auth).

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/<name>`).
3. Follow the existing code style (`npm run lint`).
4. Write tests (`npm test`).
5. Open a Pull Request.

## 📜 License
MIT – see `LICENSE` file.

*Last updated: 2026‑05‑26*