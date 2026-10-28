# Role-Based Access Control (RBAC) Implementation

## Overview
Sistem RBAC yang telah diimplementasikan untuk mengontrol akses user berdasarkan role mereka. Implementasi mencakup:
- Permission matrix per role
- Dashboard khusus untuk role QC
- Conditional rendering untuk action buttons
- Redirect otomatis berdasarkan role

## Role Permissions Matrix

### SUPER_ADMIN
- **Full access** ke semua modul
- Create, Read, Update, Delete pada semua entitas

### ADMIN
- Full access kecuali:
  - Users: tidak bisa delete
  - Audit: hanya view

### PARTNER
- Dashboard: view only
- Units: view only
- Operational (Service Logs): create, edit, view
- Reports: create, edit, view
- Master Data: view only

### MECHANIC
- Dashboard: view only
- Units: view only
- Operational: create, edit, view
- Reports: create, view (tidak bisa edit)

### CLIENT
- Dashboard: view only
- Units: view only (hanya unit milik sendiri)
- Reports: view only

### QC (Quality Control)
- **Dashboard**: Dashboard khusus di `/dashboard/qc`
- **Units**: View only, **TIDAK BISA registrasi unit baru**
- **Reports**: View dan edit (untuk QC notes)
- **Tidak ada akses** ke modul lain

## Files Modified

### 1. Context & Permissions
**File**: `app/frontend/src/contexts/PermissionsContext.tsx`
- Context untuk manage permissions globally
- `usePermissions()` hook dengan methods:
  - `can(module, permission)` - check single permission
  - `canAny(module, permissions)` - check any of permissions
  - `canAll(module, permissions)` - check all permissions
  - `isQC`, `isAdmin`, `isSuperAdmin` - role flags

### 2. QC Dashboard
**File**: `app/frontend/src/app/dashboard/qc/page.tsx`
- Dashboard khusus untuk QC
- Menampilkan stats: Total Unit, Total Laporan, Pending Inspeksi, Issue Ditemukan
- Recent units dan recent reports
- Hanya link ke Units dan Reports

### 3. Layout Wrapper
**File**: `app/frontend/src/components/layout/ClientLayoutWrapper.tsx`
- Wrap semua page dengan `PermissionsProvider`
- Auto-redirect QC dari `/dashboard` ke `/dashboard/qc`
- Get user role dari localStorage

### 4. Units Page
**File**: `app/frontend/src/app/units/page.tsx`
- Permission checks: `canCreateUnit`, `canDeleteUnit`
- Hide "Create New" dan "Bulk Upload" buttons untuk QC
- Hide "Registrasi Unit" tab untuk QC
- Pass permissions ke child components

### 5. Units Table Components
**File**: `app/frontend/src/app/units/components/UnitsTable.tsx`
- Props tambahan: `canEdit`, `canDelete`
- Hide checkbox selection jika tidak ada delete permission
- Hide edit button jika tidak ada edit permission
- Hide delete button jika tidak ada delete permission
- Berlaku untuk Desktop Table dan Mobile Cards

### 6. Login Redirect
**File**: `app/frontend/src/app/login/page.tsx`
- Redirect QC ke `/dashboard/qc` setelah login

### 7. Top Bar
**File**: `app/frontend/src/components/layout/TopBar.tsx`
- Label role untuk QC: "QUALITY CONTROL"

### 8. Database Migration
**File**: `app/backend/src/database/migrations/015_add_qc_role_to_enum.sql`
- Menambahkan value 'QC' ke `users_role_enum` di PostgreSQL

### 9. Backend Entity
**File**: `app/backend/src/modules/auth/entities/user.entity.ts`
- Enum QC sudah ditambahkan ke `UserRole`

### 10. Frontend User Management
**Files**:
- `app/frontend/src/app/users/page.tsx`
- `app/frontend/src/app/users/components/UserModals.tsx`
- `app/frontend/src/app/users/roles/page.tsx`
- QC option di semua dropdowns dan role matrix

## Usage

### Check Permission in Components
```typescript
import { usePermissions } from '@/contexts/PermissionsContext';

function MyComponent() {
  const { can, isQC } = usePermissions();

  const canCreateUnit = can('units', 'create');
  const canEditReport = can('reports', 'edit');

  return (
    <>
      {canCreateUnit && <button>Create Unit</button>}
      {isQC && <div>QC Specific Content</div>}
    </>
  );
}
```

### Available Modules
- `dashboard`
- `units`
- `operational`
- `reports`
- `users`
- `masterData`
- `partners`
- `audit`

### Available Permissions
- `view`
- `create`
- `edit`
- `delete`

## QC User Flow

1. **Login** → Auto redirect ke `/dashboard/qc`
2. **Dashboard QC** → Lihat stats unit dan laporan
3. **Sidebar** → Hanya tampil menu "Unit" dan "Laporan"
4. **Units Page** → 
   - Tidak ada button "Create New"
   - Tidak ada button "Bulk Upload"
   - Tidak ada tab "Registrasi Unit"
   - Tidak ada checkbox untuk delete
   - Tidak ada button edit
   - Hanya bisa view detail unit
5. **Reports Page** → 
   - Bisa view semua laporan
   - Bisa edit laporan (untuk add QC notes)
   - Tidak bisa create atau delete

## Testing

### Test QC Role
1. Create user dengan role "Quality Control (QC)"
2. Login dengan user tersebut
3. Verifikasi:
   - ✅ Redirect ke `/dashboard/qc`
   - ✅ Sidebar hanya tampil "Unit" dan "Laporan"
   - ✅ Di Units page tidak ada button "Create New", "Bulk Upload", "Registrasi Unit"
   - ✅ Tidak ada checkbox selection dan button edit/delete
   - ✅ Bisa view detail unit (klik row atau button Detail)
   - ✅ Di Reports page bisa edit laporan

### Test Other Roles
- SUPER_ADMIN: Full access semua
- PARTNER: Bisa create/edit service logs
- MECHANIC: Bisa create service logs, create reports
- CLIENT: View only untuk unit milik sendiri

## Notes

- Permission matrix di `PermissionsContext.tsx` adalah single source of truth
- Backend endpoint belum ada middleware RBAC, jadi permissions hanya di frontend
- Untuk production: tambahkan guard di backend juga
- QC tidak boleh akses dashboard umum karena tidak relevan untuk role mereka

## Future Improvements

1. Backend RBAC middleware untuk enforce permissions di API level
2. Permission-based route guards
3. Dynamic permission loading dari database
4. Audit log untuk track permission usage
5. Role hierarchy (inheritance)
