# Implementation Plan: Refactor Log Pengiriman, Instalasi, dan Tukar Faktur

## Goal
Transform 3 operational log pages (/service/delivery, /service/installation, /service/invoice) to have the EXACT same features and UX as /service page (Service Log).

## Project Context

**Tech Stack:**
- Frontend: Next.js 16 (App Router), React 19, TypeScript
- Styling: CSS Modules (neumorphic design system with glass-morphism)
- Build: `npm run build` / `npm run dev`
- Test: `jest --runInBand` (via `npm run test:run`)
- Repository: Next.js frontend at `app/frontend/`

**Key Files:**
- Reference: `d:\Holicindo\unit-passport-portal\app\frontend\src\app\service\page.tsx` (Service Log - 800+ lines, complex expandable grouping)
- CSS: `d:\Holicindo\unit-passport-portal\app\frontend\src\app\service\service.module.css` (comprehensive neumorphic styles)
- Targets:
  - `d:\Holicindo\unit-passport-portal\app\frontend\src\app\service\delivery\page.tsx`
  - `d:\Holicindo\unit-passport-portal\app\frontend\src\app\service\installation\page.tsx`
  - `d:\Holicindo\unit-passport-portal\app\frontend\src\app\service\invoice\page.tsx`

**Shared Components (already exist):**
- `@/components/dashboard/StatsGrid` - stats cards with wave animations
- `@/components/ui/CustomSelect` - portal-based dropdown with search
- `@/components/ui/DatePicker` - neumorphic date input
- `@/components/ui/MultiSelect` - not used in this task
- `@/app/service/utils.ts` - parseIssueDescription, formatDate helpers

**API Layer:**
- `deliveryApi` - findAll, findByUnit, create, update, delete
- `installationApi` - findAll, findByUnit, create, update, delete
- `invoiceApi` - findAll, create, update, delete

**Current State:**
All 3 pages have basic CRUD UI with flat tables, simple modals. No grouping, no expandable rows, no inline editing, no stats cards.

---

## Key Patterns Extracted from Service Log Reference

### 1. **Grouping & Expandable Row Logic**
Service log groups records by `call_id` (or `id` fallback) and displays:
- **Main row**: Latest entry from each group (sorted by `created_at` DESC)
- **Expand/collapse button** (`+`/`-`) toggles visibility of full history
- **State**: `expandedCallIds: Record<string, boolean>` tracks which groups are open
- **Sub-row table**: Nested table inside expanded row with columns: Date, Technician, Action, Result, Progress, Actions

**Pattern code:**
```typescript
const groupedLogs = (Object.values(filteredLogs.reduce((acc, log) => {
  const cid = log.call_id || log.id;
  if (!acc[cid]) acc[cid] = [];
  acc[cid].push(log);
  return acc;
}, {} as Record<string, any[]>)) as any[][]).map((group: any[]) => {
  group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return { mainLog: group[0], history: group };
});
```

### 2. **Inline Editing in Sub-rows**
- **Edit mode**: Click pencil icon → row becomes editable with inputs/selects
- **State**: `editingRowId`, `editRowDate`, `editRowTech`, `editRowAction`, `editRowResult`, `editRowStatus`
- **Save**: Calls `serviceLogApi.update(id, {...})` → `fetchData()` → exits edit mode
- **Cancel**: Resets state, exits edit mode

### 3. **Add Sub-row (New Progress Entry)**
- **Trigger**: "+ Add Row" button inside expanded section
- **State**: `addingToCallId`, `newRowDate`, `newRowTech`, `newRowAction`, `newRowResult`, `newRowStatus`
- **Save**: Calls `serviceLogApi.create({...})` with same `call_id` as parent → `fetchData()`

### 4. **Status Dropdown (CustomSelect with Custom Trigger)**
Service log uses `CustomSelect` with `customTrigger` prop to render neumorphic status pills:
```tsx
<CustomSelect
  value={mainLog.status}
  options={[...]}
  customTrigger={(opt, isOpen) => (
    <button className={`${styles.neuStatusPillTrigger} ${statusClass}`}>
      <span>{opt ? opt.label : currentVal}</span>
      <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
    </button>
  )}
  onChange={(newStatus) => { /* update logic */ }}
/>
```

### 5. **Stats Cards**
Service log passes custom `items` prop to `StatsGrid`:
```typescript
<StatsGrid loading={loading} items={[
  { label: 'Total Permintaan', value: loading ? '...' : totalRequests, max: 1000, icon: FileText, accent: '#3b82f6' },
  { label: 'Antrean Pending', value: loading ? '...' : pendingRequests, max: 100, icon: AlertTriangle, accent: '#FF6B00' },
  { label: 'Selesai Ditangani', value: loading ? '...' : completedRequests, max: 1000, icon: CheckCircle2, accent: '#00C48C' },
]} />
```

### 6. **Toolbar Pattern (dtToolbar classes)**
Service log uses global `.dtToolbar*` classes (likely defined in global CSS):
```tsx
<div className="dtToolbar">
  <div className="dtToolbarLeft">
    <div className="dtToolbarText">Show <CustomSelect .../> entries</div>
    <CustomSelect /* status filter */ />
  </div>
  <div className="dtToolbarRight">
    <div className="dtToolbarSearch">
      <input ... />
      <Search size={16} className="dtToolbarSearchIcon" />
    </div>
    <button className="dtToolbarCreateBtn" ...>...</button>
  </div>
</div>
```

### 7. **Mobile Responsive (Card View)**
Service log has `.desktopView` (table) and `.mobileView` (card list) with media query toggle:
```css
@media (max-width: 768px) {
  .desktopView { display: none !important; }
  .mobileView { display: flex !important; flex-direction: column; gap: 10px; width: 100%; }
}
```
Mobile cards use `.mobileCard`, `.mobileCardHeader`, `.mobileCardBody`, `.mobileCardRow` classes.

### 8. **Modal Styling**
Service log uses `.modalOverlay`, `.modalCard`, `.modalHeader`, `.modalBody`, `.modalFooter` from `service.module.css` with glassmorphic backdrop.

### 9. **Quick Status Update Modal**
Service log has a standalone "Update Status" button that opens a modal to change status for multiple records at once (not per-row). This is an optional advanced feature.

---

## Entity-Specific Adaptations

### Delivery (Log Pengiriman)
**Grouping Key:** `unitId` (track delivery history per unit)
**Main Row Columns:**
- UNIT ID (grouping key, expandable)
- DELIVERY DATE (from main/latest record)
- UNIT (Model + SN, clickable to unit detail)
- DESTINATION (destination_address)
- PARTNER (partner name)
- STATUS (PENDING / IN_TRANSIT / DELIVERED / FAILED - CustomSelect with custom trigger)

**Sub-row Columns (History):**
- Date (delivery_date - DatePicker)
- Destination (destination_address - text input)
- Notes (notes - textarea inline)
- Status (CustomSelect: PENDING / IN_TRANSIT / DELIVERED / FAILED)
- Actions (Edit, Save, Cancel buttons)

**Stats Cards:**
- Total Deliveries
- Pending Deliveries
- Completed Deliveries

**Status Colors:**
- PENDING: `#f59e0b` (amber)
- IN_TRANSIT: `#3b82f6` (blue)
- DELIVERED: `#10b981` (green)
- FAILED: `#ef4444` (red)

### Installation (Log Instalasi)
**Grouping Key:** `unitId` (track installation history per unit)
**Main Row Columns:**
- UNIT ID (grouping key, expandable)
- INSTALLATION DATE (from main/latest record)
- UNIT (Model + SN, clickable)
- LOCATION (location)
- TECHNICIAN (technician_name)
- STATUS (SCHEDULED / IN_PROGRESS / DONE / CANCELLED - CustomSelect)

**Sub-row Columns (History):**
- Date (installation_date - DatePicker)
- Location (location - text input)
- Technician (technician_name - text input)
- Notes (notes - textarea inline)
- Status (CustomSelect: SCHEDULED / IN_PROGRESS / DONE / CANCELLED)
- Actions (Edit, Save, Cancel)

**Stats Cards:**
- Total Installations
- Scheduled Installations
- Completed Installations

**Status Colors:**
- SCHEDULED: `#f59e0b` (amber)
- IN_PROGRESS: `#3b82f6` (blue)
- DONE: `#10b981` (green)
- CANCELLED: `#94a3b8` (grey)

### Invoice (Log Tukar Faktur)
**Grouping Key:** `invoice_number` (track revisions/history per invoice number)
**Main Row Columns:**
- INVOICE # (grouping key, expandable)
- INVOICE DATE (from main/latest record)
- UNIT (Model + SN, clickable - optional, can be null)
- DESCRIPTION (description of goods)
- PARTNER (partner name)
- STATUS (PENDING / SUBMITTED / CONFIRMED - CustomSelect)

**Sub-row Columns (History):**
- Date (invoice_date - DatePicker)
- Description (description - text input)
- Notes (notes - textarea inline)
- Status (CustomSelect: PENDING / SUBMITTED / CONFIRMED)
- Actions (Edit, Save, Cancel)

**Stats Cards:**
- Total Invoices
- Pending Invoices
- Confirmed Invoices

**Status Colors:**
- PENDING: `#f59e0b` (amber)
- SUBMITTED: `#3b82f6` (blue)
- CONFIRMED: `#10b981` (green)

---

## Implementation Steps

### Step 1: Refactor Delivery Page (Log Pengiriman)
**What:** Transform `/service/delivery/page.tsx` to match Service Log patterns.
**Files:**
- Modify: `d:\Holicindo\unit-passport-portal\app\frontend\src\app\service\delivery\page.tsx`
- Import: `service.module.css`, `StatsGrid`, `CustomSelect`, `DatePicker`, `utils.ts`

**Changes:**
1. Import `service.module.css` styles (replace all inline styles with CSS module classes)
2. Add state for grouping/expanding: `expandedUnitIds: Record<string, boolean>`
3. Add state for inline editing: `editingRowId`, `editRowDate`, `editRowDestination`, `editRowNotes`, `editRowStatus`
4. Add state for adding sub-rows: `addingToUnitId`, `newRowDate`, `newRowDestination`, `newRowNotes`, `newRowStatus`
5. Implement grouping logic: group by `unitId`, sort each group by `created_at DESC`, extract `mainLog` and `history`
6. Add `StatsGrid` component with 3 cards (Total / Pending / Delivered)
7. Replace search/filter section with `.dtToolbar` pattern (page size dropdown, status filter, search input, action buttons)
8. Replace table with expandable grouped table:
   - Main row: UNIT ID (expand button), DELIVERY DATE, UNIT, DESTINATION, PARTNER, STATUS (CustomSelect with custom trigger)
   - Expanded section: sub-row table with Date, Destination, Notes, Status, Actions columns
   - Inline edit handlers: `handleStartRowEdit`, `handleSaveRowEdit`, `handleCancelRowEdit`
   - Add row: "+ Add Row" button → `handleSaveNewSubRow`
9. Add mobile card view (`.mobileView` wrapper with `.mobileCard` cards)
10. Update modal to use `service.module.css` modal classes
11. Ensure all status updates call `deliveryApi.update` → `fetchData()`

**Verify:** `npm run dev` → navigate to `/service/delivery` → verify:
- Stats cards display correct counts
- Table groups by unit ID
- Expand/collapse works
- Inline editing works in sub-rows
- Add row works
- Status dropdown updates records
- Mobile view renders cards
- No console errors

---

### Step 2: Refactor Installation Page (Log Instalasi)
**What:** Transform `/service/installation/page.tsx` to match Service Log patterns.
**Files:**
- Modify: `d:\Holicindo\unit-passport-portal\app\frontend\src\app\service\installation\page.tsx`
- Import: `service.module.css`, `StatsGrid`, `CustomSelect`, `DatePicker`, `utils.ts`

**Changes:**
1. Import `service.module.css` styles (replace inline styles)
2. Add state for grouping/expanding: `expandedUnitIds: Record<string, boolean>`
3. Add state for inline editing: `editingRowId`, `editRowDate`, `editRowLocation`, `editRowTech`, `editRowNotes`, `editRowStatus`
4. Add state for adding sub-rows: `addingToUnitId`, `newRowDate`, `newRowLocation`, `newRowTech`, `newRowNotes`, `newRowStatus`
5. Implement grouping logic: group by `unitId`, sort by `created_at DESC`, extract `mainLog` and `history`
6. Add `StatsGrid` with 3 cards (Total / Scheduled / Completed)
7. Replace toolbar with `.dtToolbar` pattern
8. Replace table with expandable grouped table:
   - Main row: UNIT ID (expand), INSTALLATION DATE, UNIT, LOCATION, TECHNICIAN, STATUS (CustomSelect)
   - Sub-row table: Date, Location, Technician, Notes, Status, Actions
   - Inline edit handlers
   - Add row button
9. Add mobile card view
10. Update modal styling
11. Wire status updates to `installationApi.update`

**Verify:** `npm run dev` → `/service/installation` → verify all features (grouping, expanding, inline edit, add row, status updates, mobile view, stats cards)

---

### Step 3: Refactor Invoice Page (Log Tukar Faktur)
**What:** Transform `/service/invoice/page.tsx` to match Service Log patterns.
**Files:**
- Modify: `d:\Holicindo\unit-passport-portal\app\frontend\src\app\service\invoice\page.tsx`
- Import: `service.module.css`, `StatsGrid`, `CustomSelect`, `DatePicker`, `utils.ts`

**Changes:**
1. Import `service.module.css` styles
2. Add state for grouping/expanding: `expandedInvoiceIds: Record<string, boolean>`
3. Add state for inline editing: `editingRowId`, `editRowDate`, `editRowDescription`, `editRowNotes`, `editRowStatus`
4. Add state for adding sub-rows: `addingToInvoiceId`, `newRowDate`, `newRowDescription`, `newRowNotes`, `newRowStatus`
5. Implement grouping logic: group by `invoice_number`, sort by `created_at DESC`, extract `mainLog` and `history`
6. Add `StatsGrid` with 3 cards (Total / Pending / Confirmed)
7. Replace toolbar with `.dtToolbar` pattern
8. Replace table with expandable grouped table:
   - Main row: INVOICE # (expand), INVOICE DATE, UNIT (nullable), DESCRIPTION, PARTNER, STATUS (CustomSelect)
   - Sub-row table: Date, Description, Notes, Status, Actions
   - Inline edit handlers
   - Add row button
9. Add mobile card view
10. Update modal styling
11. Wire status updates to `invoiceApi.update`

**Verify:** `npm run dev` → `/service/invoice` → verify all features (grouping by invoice_number, expanding, inline edit, add row, status updates, mobile view, stats cards)

---

### Step 4: Cross-Page Integration Testing
**What:** Test all 3 pages together to ensure consistency and no regressions.

**Test Cases:**
1. Navigate between `/service`, `/service/delivery`, `/service/installation`, `/service/invoice` - all pages render without errors
2. Stats cards on all pages display correct data (count totals match table row counts)
3. Grouping works correctly (delivery/installation by unitId, invoice by invoice_number)
4. Expand/collapse toggles history correctly on all pages
5. Inline editing: click edit → fields become editable → save updates backend → refresh shows changes
6. Add sub-row: click "+ Add Row" → fill form → save creates new record under same group → refresh shows new row
7. Status dropdown: change status via CustomSelect → record updates in backend → stats cards update
8. Mobile responsive: resize browser to <768px → desktop table hides → mobile cards show → all data visible
9. Search/filter: type in search → records filter → change status dropdown → records filter by status
10. Page size: change page size dropdown → table shows correct number of rows
11. Modal CRUD: create new record → modal opens → fill form → save → record appears in table → edit record → modal pre-fills → save → changes reflected → delete record → confirm modal → record removed

**Verify:** Run through all test cases manually. Run `npm run build` to ensure no TypeScript errors. Run `npm run test:run` if tests exist for these pages.

---

### Step 5: Code Cleanup & Documentation
**What:** Final polish and documentation.

**Tasks:**
1. Remove all inline `style={{...}}` objects that duplicate `service.module.css` classes
2. Ensure consistent naming: `expandedUnitIds` for delivery/installation, `expandedInvoiceIds` for invoice
3. Ensure consistent status colors across all pages (match the patterns defined above)
4. Add JSDoc comments to complex functions (grouping logic, inline edit handlers)
5. Verify all imports are used (remove unused imports)
6. Verify all state variables are used (no dead state)
7. Update inline comments to clarify grouping keys and sub-row logic

**Verify:** Code review - no unused imports, no dead code, consistent patterns across all 3 pages.

---

## State Management Summary

All 3 pages follow the same state pattern:

### Core Data State
- `records: any[]` - all records from API
- `units: any[]` - all units (for dropdowns)
- `partners: any[]` - all partners (for dropdowns)
- `loading: boolean` - initial load state
- `error: string | null` - error message
- `submitting: boolean` - form submission state

### Filter State
- `search: string` - search query
- `statusFilter: string` - status filter value
- `pageSize: number` - page size (20/50/100)

### Grouping/Expansion State
- `expandedUnitIds: Record<string, boolean>` (delivery/installation) OR `expandedInvoiceIds: Record<string, boolean>` (invoice)

### Inline Editing State (Sub-rows)
- `editingRowId: string | null` - ID of row being edited
- `editRowDate: string` - edited date value
- `editRow[Field]: string` - edited field values (destination, location, description, notes, tech, status)

### Add Sub-row State
- `addingToUnitId: string | null` (delivery/installation) OR `addingToInvoiceId: string | null` (invoice)
- `newRowDate: string` - new row date
- `newRow[Field]: string` - new row field values

### Modal State
- `showModal: boolean` - form modal open
- `editId: string | null` - record being edited (null = create mode)
- `form: {...}` - form field values
- `formError: string | null` - form validation error
- `deleteId: string | null` - record pending deletion

---

## Component Reuse Strategy

### StatsGrid Component
**Usage:** All 3 pages pass custom `items` prop with 3 cards each.
**Props:**
```typescript
<StatsGrid loading={loading} items={[
  { label: 'Total [Entity]', value: loading ? '...' : totalCount, max: 1000, icon: [Icon], accent: '#[color]' },
  { label: 'Pending [Status]', value: loading ? '...' : pendingCount, max: 100, icon: [Icon], accent: '#[color]' },
  { label: 'Completed [Status]', value: loading ? '...' : completedCount, max: 1000, icon: [Icon], accent: '#[color]' },
]} />
```

### CustomSelect Component
**Usage:** All 3 pages use `CustomSelect` for:
1. Page size dropdown (simple mode, no custom trigger)
2. Status filter dropdown (simple mode)
3. Status column in table (custom trigger mode - neumorphic pill)

**Custom Trigger Pattern:**
```tsx
<CustomSelect
  value={record.status}
  options={statusOptions}
  showSearch={false}
  onChange={(newStatus) => { /* update record */ }}
  customTrigger={(opt, isOpen) => (
    <button className={`${styles.neuStatusPillTrigger} ${statusClassName}`}>
      <span>{opt ? opt.label : record.status}</span>
      <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
    </button>
  )}
/>
```

### DatePicker Component
**Usage:** Used in inline editing and add sub-row forms.
**Props:**
```tsx
<DatePicker
  value={editRowDate}
  onChange={(date) => setEditRowDate(date)}
  className={styles.neuDateInput}
/>
```

### Utils (formatDate, parseIssueDescription)
**Usage:**
- `formatDate(dateStr)` - format dates to Indonesian locale (e.g., "25 Januari 2026")
- `parseIssueDescription(desc)` - extract issue and contact info (NOT used in delivery/installation/invoice, but available if needed)

---

## Mobile Responsive Patterns

All 3 pages must implement desktop/mobile view toggle:

### Desktop View (>768px)
- `.desktopView` wrapper around `<table>`
- Expandable table with grouping
- Inline editing in sub-rows

### Mobile View (<=768px)
- `.mobileView` wrapper around card list
- Each record = `.mobileCard` with:
  - `.mobileCardHeader` (ID + status badge)
  - `.mobileCardBody` (key-value rows)
  - `.mobileCardFooter` (optional actions)
- Click card → navigate to detail view OR expand inline (TBD based on UX preference)

### Media Query (in service.module.css)
```css
@media (max-width: 768px) {
  .desktopView { display: none !important; }
  .mobileView { display: flex !important; }
}
```

---

## Verification Commands

After each step:
1. **Dev server:** `npm run dev` (navigate to page and test manually)
2. **Build:** `npm run build` (verify no TypeScript errors)
3. **Tests:** `npm run test:run` (if tests exist)

Final verification (Step 4):
1. Open browser console → no errors
2. Resize window → mobile view triggers at 768px breakpoint
3. Test all CRUD operations (create, edit, delete, inline edit, add sub-row, status update)
4. Test all filters (search, status, page size)
5. Test stats cards (counts match table data)

---

## Notes & Assumptions

1. **Grouping keys:**
   - Delivery & Installation: `unitId` (track history per unit)
   - Invoice: `invoice_number` (track revisions per invoice)

2. **API endpoints:**
   - All APIs have `findAll`, `create`, `update`, `delete` methods
   - All records have `id`, `created_at`, `status` fields
   - Delivery: `unitId`, `delivery_date`, `destination_address`, `notes`, `partnerId`, `status`
   - Installation: `unitId`, `installation_date`, `location`, `technician_name`, `notes`, `partnerId`, `status`
   - Invoice: `invoice_number`, `invoice_date`, `description`, `notes`, `unitId` (nullable), `partnerId`, `status`

3. **Fallback behavior:**
   - If grouping key is null/undefined, use record `id` as fallback
   - If unit data is missing, display "Unit Tidak Diketahui" and "-" for SN
   - If partner data is missing, display "-"

4. **Status dropdown behavior:**
   - When status changes, immediately call API update → refresh data
   - No confirmation modal for status changes (quick inline update)

5. **Inline editing scope:**
   - Main row status: use CustomSelect with custom trigger (neumorphic pill)
   - Sub-row fields: use standard inputs/textareas/DatePicker, save button triggers update

6. **Add sub-row logic:**
   - Creates new record with same grouping key as parent (same `unitId` or `invoice_number`)
   - After save, new record appears in history when expanded

7. **Delete behavior:**
   - Delete button in modal (existing CRUD modal delete functionality)
   - No delete in inline sub-row actions (to avoid accidental deletion of history)

8. **Mobile view simplification:**
   - Mobile cards show main record data only (no inline expansion of sub-rows on mobile)
   - Tap card → could navigate to detail page or show modal with full history (TBD - for now, just show card list)

---

## Success Criteria

All 3 pages (Delivery, Installation, Invoice) must have:
- ✅ Stats cards (3 cards showing totals and status counts)
- ✅ Toolbar (page size dropdown, status filter, search input, action buttons)
- ✅ Expandable table with grouping (group by unitId or invoice_number, expand/collapse history)
- ✅ Inline editing (sub-rows editable with edit/save/cancel buttons)
- ✅ Add sub-row functionality (+ Add Row button in expanded view)
- ✅ Status dropdown (inline editable with CustomSelect component using custom trigger)
- ✅ Mobile responsiveness (card-based view on mobile)
- ✅ Consistent styling (import and use service.module.css)
- ✅ Same UX patterns as /service page (grouping, expanding, inline editing, stats, toolbar, mobile cards)

Final deliverable: 3 refactored pages that look and behave identically to Service Log, adapted to their respective entity schemas.
