# Design Document — Client Portal UI

## Overview

The **Client Portal UI** introduces a dedicated, client-facing section of the Unit Passport Portal accessible exclusively to users with the `CLIENT` role. Rather than modifying existing admin/partner pages, this feature creates a completely separate route namespace under `/client-portal/*` with its own layout, navigation, and pages.

The existing application serves ADMIN and PARTNER users at routes like `/dashboard`, `/units`, `/service`, `/reports`, and `/messages`. These routes remain unchanged. CLIENT users are redirected to `/client-portal/dashboard` upon login and interact only with the new client portal pages.

The portal is built on the existing Next.js 14 (TypeScript) frontend and NestJS backend, reusing the current JWT-based authentication system, the `CLIENT` user role, and existing API endpoints where available. New backend endpoints are added only where the existing API surface does not support client-scoped access.

---

## Architecture

### Design Principles

1. **Dedicated Route Namespace**: All client portal pages live under `/client-portal/*`. No existing admin/partner routes are modified.
2. **Dedicated Layout**: A new `ClientPortalLayout` wraps all `/client-portal/*` pages, providing client-specific navigation (sidebar on desktop, bottom nav on mobile) and a header showing the client's company name.
3. **Role-Based Route Guard**: A reusable `withClientAuth` higher-order component (or Next.js middleware) protects all `/client-portal/*` routes, redirecting unauthenticated users to `/login` and non-CLIENT users to their role-appropriate home.
4. **Login Redirect by Role**: The existing login page is updated to redirect CLIENT users to `/client-portal/dashboard` instead of `/dashboard`.
5. **API Reuse**: Existing backend endpoints (`GET /units/my-fleet`, `GET /units/:id`, `GET /service-logs/unit/:unitId`, `GET /reports/unit/:unitId`, `GET /messages/conversations`, `GET /notifications/alerts`) are reused. New endpoints are added for client-scoped warranty overview and report access.
6. **Polling for Real-Time Updates**: Messages and notifications use client-side polling (no WebSocket required for MVP) — messages poll every 5 seconds when a conversation is open, notifications poll every 60 seconds.


### Route Map

```
/client-portal/dashboard          → ClientDashboardPage
/client-portal/fleet              → ClientFleetPage
/client-portal/units/[id]         → ClientUnitDetailPage
/client-portal/reports/[id]       → ClientReportViewPage
/client-portal/warranty           → ClientWarrantyPage
/client-portal/messages           → ClientMessagesPage
```

### Component Tree

```
app/frontend/src/app/
├── layout.tsx                          (root layout — unchanged)
│   └── ClientLayoutWrapper.tsx         (MODIFIED: detects CLIENT role, renders ClientPortalLayout)
│
└── client-portal/
    ├── layout.tsx                      (NEW: ClientPortalLayout wrapper)
    ├── dashboard/page.tsx              (NEW)
    ├── fleet/page.tsx                  (NEW)
    ├── units/[id]/page.tsx             (NEW)
    ├── reports/[id]/page.tsx           (NEW)
    ├── warranty/page.tsx               (NEW)
    └── messages/page.tsx               (NEW)

src/components/
└── client-portal/
    ├── layout/
    │   ├── ClientPortalLayout.tsx      (NEW: wraps all /client-portal/* pages)
    │   ├── ClientPortalSidebar.tsx     (NEW: desktop sidebar for CLIENT)
    │   ├── ClientPortalBottomNav.tsx   (NEW: mobile bottom nav for CLIENT)
    │   └── ClientPortalHeader.tsx      (NEW: top bar with logo + company name)
    ├── dashboard/
    │   ├── ClientDashboardStats.tsx    (NEW: stat cards)
    │   └── ClientRecentActivity.tsx    (NEW: recent service logs list)
    ├── fleet/
    │   └── ClientFleetList.tsx         (NEW: paginated, searchable fleet table)
    ├── units/
    │   ├── ClientUnitInfo.tsx          (NEW: unit specs card)
    │   ├── ClientWarrantyList.tsx      (NEW: warranty records for a unit)
    │   ├── ClientServiceHistory.tsx    (NEW: service log timeline)
    │   ├── ClientReportsList.tsx       (NEW: reports linked to unit)
    │   └── ClientServiceRequestModal.tsx (NEW: service request form)
    ├── warranty/
    │   └── ClientWarrantyOverview.tsx  (NEW: fleet-wide warranty status table)
    └── messages/
        ├── ClientConversationList.tsx  (NEW: conversation sidebar)
        └── ClientChatWindow.tsx        (NEW: message thread + input)
```


### Data Flow

```
Login Page (existing)
  └── authApi.login() → JWT { role, client_id, id, name }
        ├── role === 'CLIENT'  → router.push('/client-portal/dashboard')
        ├── role === 'ADMIN'   → router.push('/dashboard')
        └── role === 'PARTNER' → router.push('/dashboard')

/client-portal/* routes
  └── ClientPortalLayout
        ├── useEffect: read localStorage['user'] → { role, client_id, name }
        ├── role !== 'CLIENT' → redirect to role-appropriate home
        ├── !token → redirect to /login?redirect=/client-portal/dashboard
        └── role === 'CLIENT' → render ClientPortalSidebar + ClientPortalHeader + page

ClientDashboardPage
  ├── unitApi.findMyFleet()           → fleet array
  ├── serviceLogApi.findByUnit(id)    → recent logs (per unit, aggregated client-side)
  └── Compute stats from fleet data

ClientFleetPage
  └── unitApi.findMyFleet()           → paginated + filtered client-side

ClientUnitDetailPage
  ├── unitApi.findOne(id)             → unit + warranties + service_logs
  ├── serviceLogApi.findByUnit(id)    → service history
  └── reportApi.findByUnit(id)        → reports list

ClientReportViewPage
  └── reportApi.findOne(id)           → full report data (403 → access denied)

ClientWarrantyPage
  └── unitApi.findMyFleet()           → fleet with warranty_expiry field
      (warranty detail per unit fetched via unitApi.findOne when needed)

ClientMessagesPage
  ├── messageApi.getConversations()   → conversation list
  ├── messageApi.getChatHistory(id)   → messages in selected conversation
  ├── messageApi.sendMessage(id, msg) → send
  └── Poll getChatHistory every 5s when conversation is open

Notifications (in ClientPortalHeader)
  └── notificationApi.getAlerts()     → poll every 60s
```

---

## Components and Interfaces

### 1. `ClientLayoutWrapper.tsx` (MODIFIED)

**Location**: `src/components/layout/ClientLayoutWrapper.tsx`

The existing `ClientLayoutWrapper` currently renders the same `Sidebar` + `TopBar` + `BottomNav` for all roles. It is modified to detect the `CLIENT` role and skip rendering the existing navigation — the `/client-portal/*` route segment has its own `layout.tsx` that handles CLIENT navigation.

```typescript
// Modified logic: if pathname starts with /client-portal/, skip all layout chrome
// The client-portal/layout.tsx handles its own layout
const isClientPortal = pathname?.startsWith('/client-portal/');

// For client-portal routes: render children only (no Sidebar, TopBar, BottomNav)
// The ClientPortalLayout inside app/client-portal/layout.tsx handles everything
```


### 2. `app/client-portal/layout.tsx` (NEW)

**Location**: `src/app/client-portal/layout.tsx`

This is the Next.js route segment layout for all `/client-portal/*` pages. It renders `ClientPortalLayout` which handles authentication guard, navigation, and the page shell.

```typescript
import ClientPortalLayout from '@/components/client-portal/layout/ClientPortalLayout';

export default function ClientPortalRouteLayout({ children }: { children: React.ReactNode }) {
  return <ClientPortalLayout>{children}</ClientPortalLayout>;
}
```

---

### 3. `ClientPortalLayout.tsx` (NEW)

**Location**: `src/components/client-portal/layout/ClientPortalLayout.tsx`

The main layout shell for the client portal. Handles:
- Auth guard: reads `localStorage['user']`, redirects if unauthenticated or non-CLIENT
- Renders `ClientPortalHeader` (top bar)
- Renders `ClientPortalSidebar` (desktop, `>= 768px`)
- Renders `ClientPortalBottomNav` (mobile, `< 768px`)
- Renders the page content in `<main>`

```typescript
interface ClientUser {
  id: string;
  role: 'CLIENT';
  client_id: string;
  name: string;
  email?: string;
  company_name?: string;  // from client relation, may be in JWT or fetched separately
}

// Auth guard logic:
useEffect(() => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  if (!token || !userRaw) {
    router.push('/login?redirect=/client-portal/dashboard');
    return;
  }
  try {
    const user = JSON.parse(userRaw);
    if (user.role !== 'CLIENT') {
      // Redirect to role-appropriate home
      router.push(user.role === 'ADMIN' || user.role === 'PARTNER' ? '/dashboard' : '/login');
      return;
    }
    setUser(user);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }
}, []);
```


### 4. `ClientPortalSidebar.tsx` (NEW)

**Location**: `src/components/client-portal/layout/ClientPortalSidebar.tsx`

Desktop sidebar (visible at `>= 768px`). Follows the visual style of the existing `Sidebar.tsx` using the same CSS variables.

```typescript
interface ClientPortalSidebarProps {
  user: ClientUser;
  isOpen: boolean;
}

const clientNavItems = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard, href: '/client-portal/dashboard'  },
  { id: 'fleet',        label: 'Fleet',        icon: Package,         href: '/client-portal/fleet'       },
  { id: 'warranty',     label: 'Warranty',     icon: ShieldCheck,     href: '/client-portal/warranty'    },
  { id: 'messages',     label: 'Messages',     icon: MessageSquare,   href: '/client-portal/messages'    },
  { id: 'notifications',label: 'Notifications',icon: Bell,            href: '#notifications-panel'       },
];
```

The sidebar also displays:
- Holicindo brand logo at the top
- Client's `company_name` below the logo
- User's `name` and a logout button at the bottom

---

### 5. `ClientPortalBottomNav.tsx` (NEW)

**Location**: `src/components/client-portal/layout/ClientPortalBottomNav.tsx`

Mobile bottom navigation (visible at `< 768px`). Five items matching the sidebar.

```typescript
const clientBottomNavItems = [
  { label: 'Dashboard',     icon: LayoutDashboard, href: '/client-portal/dashboard'  },
  { label: 'Fleet',         icon: Package,         href: '/client-portal/fleet'       },
  { label: 'Warranty',      icon: ShieldCheck,     href: '/client-portal/warranty'    },
  { label: 'Messages',      icon: MessageSquare,   href: '/client-portal/messages'    },
  { label: 'Notifications', icon: Bell,            href: '#notifications-panel'       },
];
```

---

### 6. `ClientPortalHeader.tsx` (NEW)

**Location**: `src/components/client-portal/layout/ClientPortalHeader.tsx`

Top bar displayed on all client portal pages. Contains:
- Holicindo logo (left)
- Client company name (left, next to logo)
- Authenticated user's name (right)
- Notification bell icon with unread badge (right)
- Logout button (right)

The notification bell opens a slide-out panel showing recent notifications. Polling for new notifications occurs every 60 seconds via `notificationApi.getAlerts()`.

---

### 7. `ClientDashboardPage` (NEW)

**Location**: `src/app/client-portal/dashboard/page.tsx`

Displays a summary of the client's fleet. Data is fetched on mount.

**Sections**:
1. **Stats Row**: 4 cards — Total Units, Active Units, In-Service Units, Active Warranties
2. **Warranty Alerts**: Count of units with warranty expiring within 30 days (amber badge)
3. **Recent Service Activity**: 5 most recent service logs across all fleet units, ordered by `service_date` descending
4. **Empty State**: Shown when fleet has zero units

**Data fetching**:
```typescript
// 1. Fetch fleet
const { data: fleet } = await unitApi.findMyFleet();

// 2. Compute stats from fleet data
const stats = computeDashboardStats(fleet);

// 3. Fetch recent service logs for each unit (parallel)
// Use serviceLogApi.findByUnit(unitId) for each unit, then merge and sort
// Take top 5 by service_date descending
```


### 8. `ClientFleetPage` (NEW)

**Location**: `src/app/client-portal/fleet/page.tsx`

Displays all units in the client's fleet with search and pagination.

**Features**:
- Calls `GET /units/my-fleet` on mount
- Displays each unit: model name, serial number, production date, warranty expiry, status badge
- Search field: debounced 300ms, filters by `model_name` or `serial_number` (client-side)
- Pagination: 10 units per page (client-side)
- Clicking a unit navigates to `/client-portal/units/[id]`
- Error state: error message + retry button if API call fails

---

### 9. `ClientUnitDetailPage` (NEW)

**Location**: `src/app/client-portal/units/[id]/page.tsx`

Full detail view for a single unit. Composed of sub-components.

**Sections**:
1. **Unit Info Card** (`ClientUnitInfo`): model name, serial number, production date, warranty expiry, status, specs (JSONB rendered as key-value pairs)
2. **Warranty Records** (`ClientWarrantyList`): all warranties for the unit — type, duration label, start/end dates, status with color coding; warning indicator if ACTIVE and expiring within 30 days
3. **Service History** (`ClientServiceHistory`): all service logs ordered by `service_date` descending — issue description, action taken, service date, partner name, attachment links
4. **Service Reports** (`ClientReportsList`): all reports for the unit — form type, creation date, creator name; clicking navigates to `/client-portal/reports/[id]`
5. **Request Service Button**: opens `ClientServiceRequestModal`

**Data fetching**:
```typescript
// Parallel fetches
const [unitRes, logsRes, reportsRes] = await Promise.all([
  unitApi.findOne(id),                // includes warranties via relation
  serviceLogApi.findByUnit(id),
  reportApi.findByUnit(id),
]);
// 404 on unitApi.findOne → show "Unit not found" + link to /client-portal/fleet
```

---

### 10. `ClientServiceRequestModal` (NEW)

**Location**: `src/components/client-portal/units/ClientServiceRequestModal.tsx`

Modal form for submitting a service request. Fields: city, notes, contact name, contact phone. Calls `POST /units/:id/request-service`. On success: shows confirmation message and disables the "Request Service" button for the session (via component state). On failure: shows inline error, retains form values.

---

### 11. `ClientReportViewPage` (NEW)

**Location**: `src/app/client-portal/reports/[id]/page.tsx`

Read-only view of a service report. Reuses existing report template components (`InspectionReportTemplate`, `CoolingReportTemplate`, etc.) in `mode="view"`.

**Sections**:
- Report metadata: form type, creation date, creator name
- Report data: rendered via the appropriate template component based on `form_type`
- Photo thumbnails: displayed in a grid, click to expand full size
- Revision note: shown in a labeled section if present

**Access control**: If API returns 403, show "Access Denied" message and auto-redirect to `/client-portal/fleet` after 3 seconds.

---

### 12. `ClientWarrantyPage` (NEW)

**Location**: `src/app/client-portal/warranty/page.tsx`

Fleet-wide warranty status overview.

**Features**:
- Calls `GET /units/my-fleet` (units include `warranty_expiry` field)
- Displays each unit with its warranty status, color-coded: green (ACTIVE), amber (expiring ≤ 30 days), red (EXPIRED/VOIDED)
- Pagination: 10 items per page
- Clicking a unit navigates to `/client-portal/units/[id]`

**Note**: The `Unit` entity has a `warranty_expiry` date field and a `warranties` relation. The fleet endpoint returns units with `warranty_expiry`. For detailed per-warranty-record display, the unit detail page is used.


### 13. `ClientMessagesPage` (NEW)

**Location**: `src/app/client-portal/messages/page.tsx`

Two-panel messaging interface.

**Left panel** (`ClientConversationList`):
- Lists all conversations from `GET /messages/conversations`
- Shows conversation partner name, last message preview, unread count badge per conversation
- Clicking a conversation loads it in the right panel

**Right panel** (`ClientChatWindow`):
- Displays full message history from `GET /messages/conversations/:id`
- Message input field at the bottom
- Send button calls `POST /messages/conversations/:id/send`
- Sent message appears immediately in the thread (optimistic update)
- Polls `GET /messages/conversations/:id` every 5 seconds to receive new messages
- On send failure: inline error message, input field retains text

**Unread badge**: Total unread count across all conversations shown on the Messages nav item.

---

### 14. Backend: Reports Access for CLIENT Role (MODIFIED)

**Location**: `src/modules/reports/reports.controller.ts`

Currently, `GET /reports/:id` and `GET /reports/unit/:unitId` are restricted to `ADMIN` and `PARTNER` roles. To support the client portal, these endpoints must be extended to allow `CLIENT` access with ownership validation.

```typescript
// GET /reports/unit/:unitId — add CLIENT role
@Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
findByUnit(@Param('unitId') unitId: string, @Request() req: any) {
  // If CLIENT: validate that unitId belongs to req.user.client_id
  // Return 403 if unit does not belong to client
  return this.reportsService.findByUnit(unitId, req.user);
}

// GET /reports/:id — add CLIENT role
@Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
findOne(@Param('id') id: string, @Request() req: any) {
  // If CLIENT: validate that report's unit belongs to req.user.client_id
  // Return 403 if not authorized
  return this.reportsService.findOne(id, req.user);
}
```

---

### 15. Login Page: Role-Based Redirect (MODIFIED)

**Location**: `src/app/login/page.tsx`

The `handleLogin` function currently redirects all users to `redirectUrl || '/dashboard'`. It must be updated to redirect CLIENT users to `/client-portal/dashboard`.

```typescript
const handleLogin = async (e: React.FormEvent) => {
  // ...existing logic...
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));

  // Role-based redirect
  if (data.user.role === 'CLIENT') {
    router.push(redirectUrl || '/client-portal/dashboard');
  } else {
    router.push(redirectUrl || '/dashboard');
  }
};
```

---

## Data Models

### ClientUser (from localStorage)

```typescript
interface ClientUser {
  id: string;           // e.g., "USR-1234567"
  role: 'CLIENT';
  client_id: string;    // e.g., "CLI-7654321"
  name: string;         // Full name of the user
  email?: string;
  company_name?: string; // From client relation — may be embedded in JWT or fetched
}
```


### Unit (from `GET /units/my-fleet` and `GET /units/:id`)

```typescript
interface Unit {
  id: string;
  serial_number: string;
  model_name: string;
  specs: Record<string, any>;       // JSONB — e.g., { type: 'MESIN', capacity: '...' }
  qr_token: string;
  production_date: string | null;   // ISO date string
  warranty_expiry: string | null;   // ISO date string
  status: string;                   // 'ACTIVE' | 'IN_SERVICE' | 'INACTIVE' | 'MAINTENANCE'
  current_client?: {
    id: string;
    company_name: string;
  };
  warranties?: Warranty[];          // Populated in findOne
  service_logs?: ServiceLog[];      // Populated in findOne
}
```

### Warranty (from `unit.warranties`)

```typescript
interface Warranty {
  id: string;
  warranty_type: string;    // e.g., 'GENERAL', 'COMPRESSOR'
  duration_label: string;   // e.g., '1_TAHUN'
  start_date: string;       // ISO date string
  end_date: string;         // ISO date string
  status: string;           // 'ACTIVE' | 'EXPIRED' | 'VOIDED'
  voided_reason?: string;
}
```

### ServiceLog (from `GET /service-logs/unit/:unitId`)

```typescript
interface ServiceLog {
  id: string;
  unit?: { id: string; serial_number: string; model_name: string };
  partner?: { partner_name: string; city: string };
  technician_name?: string;
  issue_description: string;
  action_taken?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  service_date?: string;    // ISO date string
  created_at: string;
  attachments?: string[];   // Array of file URLs
}
```

### ServiceReport (from `GET /reports/unit/:unitId` and `GET /reports/:id`)

```typescript
interface ServiceReport {
  id: string;
  form_type: string;        // 'INSPECTION' | 'COOLING_1' | 'COOLING_2' | 'REWORK' | etc.
  data: Record<string, any>; // JSONB — structured form data
  photo_urls?: string[];    // Array of photo URLs
  revision_note?: string;
  created_at: string;
  created_by?: { id: string; name: string };
  unit?: { id: string; serial_number: string; model_name: string };
}
```

### Conversation (from `GET /messages/conversations`)

```typescript
interface Conversation {
  id: string;
  participants: { id: string; name: string }[];
  last_message?: string;
  unread_count?: number;
  updated_at: string;
}
```

### Notification (from `GET /notifications/alerts`)

```typescript
interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;    // Optional deep link
}
```

### Dashboard Stats (computed client-side)

```typescript
interface ClientDashboardStats {
  totalUnits: number;
  activeUnits: number;       // status === 'ACTIVE'
  inServiceUnits: number;    // status === 'IN_SERVICE' or 'MAINTENANCE'
  activeWarranties: number;  // units where warranty_expiry > today
  expiringWarranties: number; // units where 0 < daysUntilExpiry <= 30
}

function computeDashboardStats(fleet: Unit[]): ClientDashboardStats {
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    totalUnits: fleet.length,
    activeUnits: fleet.filter(u => u.status === 'ACTIVE').length,
    inServiceUnits: fleet.filter(u => u.status === 'IN_SERVICE' || u.status === 'MAINTENANCE').length,
    activeWarranties: fleet.filter(u => u.warranty_expiry && new Date(u.warranty_expiry) > today).length,
    expiringWarranties: fleet.filter(u => {
      if (!u.warranty_expiry) return false;
      const exp = new Date(u.warranty_expiry);
      return exp > today && exp <= in30Days;
    }).length,
  };
}
```


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Unauthenticated Access Redirects to Login

*For any* path under `/client-portal/*`, when accessed without a valid JWT token in localStorage, the Access Guard SHALL redirect the user to `/login` with a `redirect` query parameter containing the attempted path.

**Validates: Requirements 1.3**

---

### Property 2: Non-CLIENT Role Redirects Away from Client Portal

*For any* `/client-portal/*` path and any user with role `ADMIN` or `PARTNER`, the Access Guard SHALL redirect the user to their role-appropriate home page and never render any client portal page content.

**Validates: Requirements 1.4**

---

### Property 3: Dashboard Stats Accurately Reflect Fleet Data

*For any* fleet array of units with arbitrary statuses and warranty expiry dates, the computed dashboard statistics (total units, active units, in-service units, active warranties, expiring warranties) SHALL exactly match the counts derived from the fleet data — no hardcoded values, no off-by-one errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 4: Recent Activity Shows Top 5 Most Recent Logs

*For any* collection of service logs across a client's fleet (with at least 5 logs), the dashboard recent activity section SHALL display exactly the 5 logs with the most recent `service_date` values, in descending order by `service_date`.

**Validates: Requirements 2.5**

---

### Property 5: Fleet Search Filters Correctly

*For any* fleet array and any non-empty search string, the filtered result SHALL contain only units whose `model_name` or `serial_number` contains the search string (case-insensitive), and SHALL contain all such units — no false positives, no false negatives.

**Validates: Requirements 3.4**

---

### Property 6: Fleet and Warranty Pagination Enforces 10-Per-Page

*For any* list of items with more than 10 entries (fleet units or warranty items), the paginated display SHALL show exactly 10 items on all full pages, and the remaining items on the last page — the total count across all pages SHALL equal the total item count.

**Validates: Requirements 3.3, 6.4**

---

### Property 7: Unit Detail Displays All Required Fields

*For any* unit object returned by the API, the unit detail page SHALL render the unit's model name, serial number, production date, warranty expiry date, status, and all key-value pairs from the `specs` JSONB field — no required field may be silently omitted.

**Validates: Requirements 4.1**

---

### Property 8: Warranty Expiry Warning Appears Exactly When Due

*For any* warranty record, the visual warning indicator SHALL appear if and only if the warranty `status` is `ACTIVE` AND the `end_date` is within 30 calendar days of the current date (inclusive of today, exclusive of dates more than 30 days away).

**Validates: Requirements 4.3**

---

### Property 9: Service Log Attachment Links Match Attachment Count

*For any* service log with an `attachments` array of length N, the rendered service log entry SHALL display exactly N clickable links — one per attachment URL — with no links omitted and no extra links added.

**Validates: Requirements 4.5**

---

### Property 10: Report Photo Thumbnails Match photo_urls Count

*For any* service report with a `photo_urls` array of length N, the report view SHALL render exactly N photo thumbnails — one per URL — with no photos omitted and no extra thumbnails added.

**Validates: Requirements 5.3**

---

### Property 11: Warranty Color Coding Matches Status

*For any* warranty record, the color class applied to its status indicator SHALL be: green for `ACTIVE` (and not expiring within 30 days), amber for `ACTIVE` with expiry within 30 days, and red for `EXPIRED` or `VOIDED` — no other color assignments are valid.

**Validates: Requirements 6.2**

---

### Property 12: Sent Message Appears in Conversation View

*For any* non-empty message string submitted via the chat input, after a successful `POST /messages/conversations/:id/send` response, the message SHALL appear in the conversation thread without requiring a page reload, and the input field SHALL be cleared.

**Validates: Requirements 7.3**

---

### Property 13: Unread Count Badge Reflects Actual Unread Count

*For any* unread message count N > 0, the Messages navigation item SHALL display a badge showing exactly N. When N = 0, no badge SHALL be displayed.

**Validates: Requirements 7.5**

---

### Property 14: Notification Badge Reflects Actual Unread Count

*For any* set of notifications returned by `GET /notifications/alerts`, the notification badge count SHALL equal the number of notifications where `is_read === false`. When all notifications are read, the badge SHALL not be displayed.

**Validates: Requirements 8.2, 8.5**

---

### Property 15: Notifications Displayed in Descending Creation Order

*For any* array of notifications with arbitrary `created_at` timestamps, the notifications panel SHALL display them in strictly descending order by `created_at` — the most recently created notification appears first.

**Validates: Requirements 8.3**

---

### Property 16: Client Portal Navigation Contains All Required Links

*For any* render of `ClientPortalSidebar` or `ClientPortalBottomNav`, the navigation SHALL contain exactly the 5 required links: Dashboard (`/client-portal/dashboard`), Fleet (`/client-portal/fleet`), Warranty (`/client-portal/warranty`), Messages (`/client-portal/messages`), and Notifications — and SHALL NOT contain links to admin-only routes (`/partners`, `/users`, `/audit`, `/dashboard`, `/units`, `/service`, `/reports`).

**Validates: Requirements 10.1**

---

### Property 17: Active Navigation State Matches Current Pathname

*For any* valid client portal pathname, exactly one navigation item SHALL have the active visual state, and that item's `href` SHALL match (or be a prefix of) the current pathname — all other items SHALL NOT have the active state.

**Validates: Requirements 10.2**

---

### Property 18: Header Displays Company Name for Any Client User

*For any* authenticated CLIENT user object with a `company_name` field, the `ClientPortalHeader` SHALL render the company name visibly in the header — the rendered output SHALL contain the company name string.

**Validates: Requirements 1.6, 10.5**


---

## Error Handling

### Error Scenarios and Responses

| Scenario | Handling |
|---|---|
| No token or user in localStorage on `/client-portal/*` | Redirect to `/login?redirect=/client-portal/dashboard` |
| Invalid JSON in `localStorage['user']` | Clear both keys, redirect to `/login` |
| JWT expired (API returns 401) | Axios interceptor clears token + user, redirects to `/login` |
| `GET /units/my-fleet` fails | Inline error message + retry button; do not crash page |
| `GET /units/:id` returns 404 | "Unit not found" message + link to `/client-portal/fleet` |
| `GET /reports/:id` returns 403 | "Access Denied" message + auto-redirect to `/client-portal/fleet` after 3 seconds |
| `POST /units/:id/request-service` fails | Inline error in modal, form values retained, submit button re-enabled |
| `POST /messages/conversations/:id/send` fails | Inline error below input, message text retained in input field |
| Fleet is empty (zero units) | Empty-state illustration + message: "No units registered under your account" |
| No service logs for a unit | Empty-state message in service history section |
| No reports for a unit | Empty-state message in reports section |
| Notification polling fails | Silent failure — do not show error toast; retry on next poll interval |

### Axios 401 Interceptor

The existing `src/lib/api.ts` does not have a 401 interceptor. One must be added:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Report Access Denied Auto-Redirect

```typescript
// In ClientReportViewPage
useEffect(() => {
  if (accessDenied) {
    const timer = setTimeout(() => {
      router.push('/client-portal/fleet');
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [accessDenied]);
```

---

## Testing Strategy

### Dual Testing Approach

This feature uses two complementary testing layers:

1. **Unit Tests (Example-Based)**: Verify specific behaviors with concrete examples — component rendering, user interactions, API call verification, and edge cases.
2. **Property-Based Tests (PBT)**: Verify universal properties that must hold across all valid inputs — data isolation, stat computation, filtering, pagination, ordering, and badge counts.

### PBT Library

Use **[fast-check](https://github.com/dubzzz/fast-check)** — TypeScript-native, no additional configuration needed for Next.js projects.

```bash
npm install --save-dev fast-check
```

### PBT Configuration

- Minimum **100 iterations** per property test (`numRuns: 100`)
- Each test tagged with a comment referencing the design property
- Tag format: `// Feature: client-portal-ui, Property {N}: {property title}`


### Unit Tests (Example-Based)

```
src/__tests__/client-portal-ui/
├── layout/
│   ├── ClientPortalLayout.test.tsx
│   │   ├── redirects to /login when no token in localStorage
│   │   ├── redirects to /dashboard when role is ADMIN
│   │   ├── redirects to /dashboard when role is PARTNER
│   │   └── renders children when role is CLIENT
│   ├── ClientPortalSidebar.test.tsx
│   │   ├── renders exactly 5 navigation items
│   │   ├── renders Holicindo logo
│   │   ├── renders company name
│   │   └── renders logout button
│   └── ClientPortalBottomNav.test.tsx
│       └── renders exactly 5 navigation items
├── dashboard/
│   └── ClientDashboardPage.test.tsx
│       ├── calls unitApi.findMyFleet (not findAll)
│       ├── shows empty state when fleet is empty
│       └── shows recent service logs section
├── fleet/
│   └── ClientFleetPage.test.tsx
│       ├── calls unitApi.findMyFleet on mount
│       ├── shows error message and retry button on API failure
│       └── navigates to /client-portal/units/[id] on row click
├── units/
│   └── ClientUnitDetailPage.test.tsx
│       ├── shows "Unit not found" on 404
│       ├── shows "Request Service" button
│       ├── opens service request modal on button click
│       └── disables "Request Service" button after successful submission
├── reports/
│   └── ClientReportViewPage.test.tsx
│       ├── shows "Access Denied" on 403
│       ├── auto-redirects after 3 seconds on 403
│       └── shows revision note section when revision_note is present
└── messages/
    └── ClientMessagesPage.test.tsx
        ├── calls messageApi.getConversations on mount
        ├── shows inline error and retains text on send failure
        └── clears input after successful send
```

### Property-Based Tests

```
src/__tests__/client-portal-ui/properties/
├── auth-guard.property.test.ts
│   // Feature: client-portal-ui, Property 1: Unauthenticated Access Redirects
│   // Feature: client-portal-ui, Property 2: Non-CLIENT Role Redirects
│
├── dashboard-stats.property.test.ts
│   // Feature: client-portal-ui, Property 3: Dashboard Stats Accurately Reflect Fleet Data
│   // Feature: client-portal-ui, Property 4: Recent Activity Shows Top 5 Most Recent Logs
│
├── fleet-search.property.test.ts
│   // Feature: client-portal-ui, Property 5: Fleet Search Filters Correctly
│
├── pagination.property.test.ts
│   // Feature: client-portal-ui, Property 6: Pagination Enforces 10-Per-Page
│
├── unit-detail.property.test.ts
│   // Feature: client-portal-ui, Property 7: Unit Detail Displays All Required Fields
│   // Feature: client-portal-ui, Property 8: Warranty Expiry Warning Appears Exactly When Due
│   // Feature: client-portal-ui, Property 9: Service Log Attachment Links Match Count
│
├── report-view.property.test.ts
│   // Feature: client-portal-ui, Property 10: Report Photo Thumbnails Match photo_urls Count
│
├── warranty-status.property.test.ts
│   // Feature: client-portal-ui, Property 11: Warranty Color Coding Matches Status
│
├── messaging.property.test.ts
│   // Feature: client-portal-ui, Property 12: Sent Message Appears in Conversation View
│   // Feature: client-portal-ui, Property 13: Unread Count Badge Reflects Actual Unread Count
│
├── notifications.property.test.ts
│   // Feature: client-portal-ui, Property 14: Notification Badge Reflects Actual Unread Count
│   // Feature: client-portal-ui, Property 15: Notifications Displayed in Descending Order
│
└── navigation.property.test.ts
    // Feature: client-portal-ui, Property 16: Navigation Contains All Required Links
    // Feature: client-portal-ui, Property 17: Active Navigation State Matches Pathname
    // Feature: client-portal-ui, Property 18: Header Displays Company Name
```


### Example Property Test

```typescript
// dashboard-stats.property.test.ts
// Feature: client-portal-ui, Property 3: Dashboard Stats Accurately Reflect Fleet Data

import fc from 'fast-check';
import { computeDashboardStats } from '@/components/client-portal/dashboard/ClientDashboardStats';

describe('Property 3: Dashboard Stats Accurately Reflect Fleet Data', () => {
  it('computed stats exactly match fleet data for any valid fleet', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            serial_number: fc.string({ minLength: 5, maxLength: 20 }),
            model_name: fc.string({ minLength: 3, maxLength: 50 }),
            status: fc.constantFrom('ACTIVE', 'IN_SERVICE', 'MAINTENANCE', 'INACTIVE'),
            warranty_expiry: fc.option(
              fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
                .map(d => d.toISOString()),
              { nil: null }
            ),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (fleet) => {
          const stats = computeDashboardStats(fleet);
          const today = new Date();
          const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

          expect(stats.totalUnits).toBe(fleet.length);
          expect(stats.activeUnits).toBe(fleet.filter(u => u.status === 'ACTIVE').length);
          expect(stats.inServiceUnits).toBe(
            fleet.filter(u => u.status === 'IN_SERVICE' || u.status === 'MAINTENANCE').length
          );
          expect(stats.activeWarranties).toBe(
            fleet.filter(u => u.warranty_expiry && new Date(u.warranty_expiry) > today).length
          );
          expect(stats.expiringWarranties).toBe(
            fleet.filter(u => {
              if (!u.warranty_expiry) return false;
              const exp = new Date(u.warranty_expiry);
              return exp > today && exp <= in30Days;
            }).length
          );
          // All stats must be non-negative
          Object.values(stats).forEach(v => expect(v).toBeGreaterThanOrEqual(0));
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Running Tests

```bash
# Run all client portal tests (single run, no watch mode)
npx jest --testPathPattern="client-portal-ui" --passWithNoTests --forceExit
```

---

## File Summary

### New Files

| File | Description |
|---|---|
| `src/app/client-portal/layout.tsx` | Next.js route segment layout for all /client-portal/* pages |
| `src/app/client-portal/dashboard/page.tsx` | Client dashboard page |
| `src/app/client-portal/fleet/page.tsx` | Fleet overview page |
| `src/app/client-portal/units/[id]/page.tsx` | Unit detail page |
| `src/app/client-portal/reports/[id]/page.tsx` | Service report view page |
| `src/app/client-portal/warranty/page.tsx` | Warranty status overview page |
| `src/app/client-portal/messages/page.tsx` | In-app messaging page |
| `src/components/client-portal/layout/ClientPortalLayout.tsx` | Auth guard + layout shell |
| `src/components/client-portal/layout/ClientPortalSidebar.tsx` | Desktop sidebar navigation |
| `src/components/client-portal/layout/ClientPortalSidebar.module.css` | Sidebar styles |
| `src/components/client-portal/layout/ClientPortalBottomNav.tsx` | Mobile bottom navigation |
| `src/components/client-portal/layout/ClientPortalBottomNav.module.css` | Bottom nav styles |
| `src/components/client-portal/layout/ClientPortalHeader.tsx` | Top bar with logo, company name, notifications |
| `src/components/client-portal/layout/ClientPortalHeader.module.css` | Header styles |
| `src/components/client-portal/dashboard/ClientDashboardStats.tsx` | Stats cards + computeDashboardStats() |
| `src/components/client-portal/dashboard/ClientRecentActivity.tsx` | Recent service logs list |
| `src/components/client-portal/fleet/ClientFleetList.tsx` | Paginated, searchable fleet table |
| `src/components/client-portal/units/ClientUnitInfo.tsx` | Unit specs card |
| `src/components/client-portal/units/ClientWarrantyList.tsx` | Warranty records for a unit |
| `src/components/client-portal/units/ClientServiceHistory.tsx` | Service log timeline |
| `src/components/client-portal/units/ClientReportsList.tsx` | Reports linked to a unit |
| `src/components/client-portal/units/ClientServiceRequestModal.tsx` | Service request form modal |
| `src/components/client-portal/warranty/ClientWarrantyOverview.tsx` | Fleet-wide warranty status table |
| `src/components/client-portal/messages/ClientConversationList.tsx` | Conversation list panel |
| `src/components/client-portal/messages/ClientChatWindow.tsx` | Chat thread + input |

### Modified Files

| File | Change |
|---|---|
| `src/components/layout/ClientLayoutWrapper.tsx` | Skip layout chrome for `/client-portal/*` paths |
| `src/app/login/page.tsx` | Redirect CLIENT users to `/client-portal/dashboard` after login |
| `src/lib/api.ts` | Add 401 response interceptor |
| `src/modules/reports/reports.controller.ts` | Allow CLIENT role on `GET /reports/:id` and `GET /reports/unit/:unitId` with ownership validation |
| `src/modules/reports/reports.service.ts` | Add client ownership check in `findOne` and `findByUnit` |
