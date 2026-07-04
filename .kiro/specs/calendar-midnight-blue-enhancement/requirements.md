# Requirements Document

## Introduction

Feature ini mengaplikasikan midnight blue gradient styling (yang saat ini digunakan pada stats cards) ke calendar widget di client portal untuk memberikan visual emphasis pada fitur tracking warranty expiry yang penting. Perubahan ini bertujuan meningkatkan visual hierarchy di dashboard dengan membuat calendar widget lebih menonjol sambil mempertahankan design consistency neumorphism theme dan user comfort.

## Glossary

- **Calendar_Widget**: Komponen MiniCalendar yang menampilkan kalender bulanan dengan event warranty expiry di dashboard client portal
- **Stats_Cards**: Card komponen yang menampilkan statistik summary (Total Unit, Unit Aktif, Perlu Servis, Garansi Aktif) dengan midnight blue gradient background
- **Content_Cards**: Card komponen lainnya yang menampilkan data tabular atau list (Unit Table, Servis List, dll) dengan light neumorphic styling
- **Midnight_Blue_Gradient**: Gradient warna `linear-gradient(145deg, #02060E 0%, #0356C5 100%)` yang digunakan untuk visual emphasis
- **Light_Neumorphic**: Styling neumorphism dengan light background `linear-gradient(135deg, #E8EAEE 0%, #E0E4ED 100%)`
- **Neumorphism_Shadow**: Kombinasi light dan dark shadow yang menciptakan efek 3D embossed atau inset pada surface
- **Client_Portal**: Interface aplikasi untuk end-user client (bukan admin panel)
- **Visual_Hierarchy**: Pengaturan importance visual elements melalui styling untuk mengarahkan perhatian user
- **Text_Readability**: Kemampuan user untuk membaca text dengan nyaman, dipengaruhi oleh contrast ratio antara text dan background

## Requirements

### Requirement 1: Calendar Widget Midnight Blue Styling

**User Story:** Sebagai user client portal, saya ingin calendar widget menggunakan midnight blue gradient seperti stats cards, sehingga fitur tracking warranty expiry lebih menonjol secara visual.

#### Acceptance Criteria

1. WHEN Calendar_Widget di-render, THE System SHALL mengaplikasikan Midnight_Blue_Gradient sebagai background color
2. WHEN Calendar_Widget di-render, THE System SHALL mengaplikasikan Neumorphism_Shadow yang sesuai untuk dark surface dengan shadow values `-5px -5px 12px rgba(3, 86, 197, 0.25), 5px 5px 14px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.30)`
3. WHEN Calendar_Widget di-render, THE System SHALL mengaplikasikan subtle inner glow gradient overlay `linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, transparent 50%, rgba(0, 0, 0, 0.12) 100%)` untuk depth enhancement
4. WHEN user hover di atas Calendar_Widget, THE System SHALL menampilkan enhanced shadow effect dengan values `-7px -7px 16px rgba(3, 86, 197, 0.32), 7px 7px 18px rgba(0, 0, 0, 0.65), 0 2px 6px rgba(0, 0, 0, 0.35)`
5. WHEN user hover di atas Calendar_Widget, THE System SHALL mentransformasi posisi dengan `translateY(-2px)` untuk lift effect

### Requirement 2: Calendar Text Readability pada Dark Background

**User Story:** Sebagai user client portal, saya ingin dapat membaca semua text di calendar widget dengan jelas, sehingga saya dapat dengan mudah mengidentifikasi tanggal dan event warranty.

#### Acceptance Criteria

1. WHEN Calendar_Widget menggunakan Midnight_Blue_Gradient, THE System SHALL mengubah calendar month title color menjadi `#FFFFFF` (white)
2. WHEN Calendar_Widget menggunakan Midnight_Blue_Gradient, THE System SHALL mengubah day name labels color menjadi `rgba(160, 200, 255, 0.70)` (light blue)
3. WHEN Calendar_Widget menggunakan Midnight_Blue_Gradient, THE System SHALL mengubah calendar day numbers color menjadi `#FFFFFF` (white)
4. WHEN Calendar_Widget menggunakan Midnight_Blue_Gradient, THE System SHALL mengubah navigation button icons color menjadi `rgba(160, 200, 255, 0.70)` (light blue)
5. WHEN Calendar_Widget menggunakan Midnight_Blue_Gradient, THE System SHALL mengubah legend text color menjadi `rgba(160, 200, 255, 0.55)` (lighter blue)

### Requirement 3: Calendar Interactive Elements pada Dark Background

**User Story:** Sebagai user client portal, saya ingin interactive elements di calendar tetap terlihat jelas dan responsif, sehingga saya dapat berinteraksi dengan calendar dengan mudah.

#### Acceptance Criteria

1. WHEN calendar day cell di-hover, THE System SHALL mengaplikasikan background color `rgba(255, 255, 255, 0.08)` untuk subtle highlight effect pada dark surface
2. WHEN calendar day cell adalah today, THE System SHALL mengaplikasikan background color `rgba(46, 91, 255, 0.35)` dan text color `#93C5FD` untuk emphasis
3. WHEN calendar navigation button di-hover, THE System SHALL mengaplikasikan background color `rgba(3, 86, 197, 0.25)` dan icon color `#FFFFFF`
4. WHEN calendar day cell dengan event di-klik, THE System SHALL mengaplikasikan pressed state dengan inset shadow `inset 2px 2px 5px rgba(0, 0, 0, 0.35), inset -2px -2px 5px rgba(3, 86, 197, 0.25)`
5. WHEN event tooltip ditampilkan, THE System SHALL mempertahankan light neumorphic styling untuk contrast dengan dark calendar background

### Requirement 4: Stats Cards Styling Preservation

**User Story:** Sebagai user client portal, saya ingin stats cards tetap mempertahankan midnight blue gradient mereka, sehingga consistency visual antara stats cards dan calendar terjaga.

#### Acceptance Criteria

1. WHEN Stats_Cards di-render, THE System SHALL mengaplikasikan Midnight_Blue_Gradient yang sama dengan Calendar_Widget
2. WHEN Stats_Cards di-render, THE System SHALL mempertahankan existing shadow values `-5px -5px 12px rgba(3, 86, 197, 0.25), 5px 5px 14px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.30)`
3. WHEN Stats_Cards di-render, THE System SHALL mempertahankan text colors: label `rgba(160, 200, 255, 0.70)`, value `#FFFFFF`, sub-text `rgba(160, 200, 255, 0.55)`
4. FOR ALL Stats_Cards variant classes (statCardBlue, statCardGreen, statCardOrange, statCardNavy), THE System SHALL mengaplikasikan styling yang identik
5. WHEN user hover di atas Stats_Cards, THE System SHALL menampilkan hover effect yang sama dengan sebelumnya

### Requirement 5: Content Cards Styling Preservation

**User Story:** Sebagai user client portal, saya ingin content cards lainnya tetap menggunakan light neumorphic styling, sehingga data-heavy content tetap nyaman untuk dibaca dalam waktu lama.

#### Acceptance Criteria

1. WHEN Content_Cards (Unit Table, Servis List, dll) di-render, THE System SHALL mengaplikasikan Light_Neumorphic background gradient `linear-gradient(135deg, #E8EAEE 0%, #E0E4ED 100%)`
2. WHEN Content_Cards di-render, THE System SHALL mempertahankan existing light surface shadow values `-6px -6px 10px rgba(255, 255, 255, 0.68), 6px 6px 12px rgba(0, 31, 63, 0.16), 0 1px 3px rgba(0, 31, 63, 0.06)`
3. WHEN Content_Cards di-render, THE System SHALL mempertahankan existing text colors untuk dark text on light background
4. WHEN Content_Cards di-render, THE System SHALL mempertahankan subtle inner highlight gradient overlay
5. THE System SHALL NOT mengubah styling apapun pada Content_Cards yang bukan Calendar_Widget atau Stats_Cards

### Requirement 6: Cross-Page Consistency

**User Story:** Sebagai user client portal, saya ingin calendar widget terlihat consistent di semua halaman, sehingga user experience tetap uniform di seluruh aplikasi.

#### Acceptance Criteria

1. WHEN Calendar_Widget muncul di Dashboard page, THE System SHALL mengaplikasikan Midnight_Blue_Gradient styling
2. WHEN Calendar_Widget muncul di Fleet page, THE System SHALL mengaplikasikan Midnight_Blue_Gradient styling yang identik dengan Dashboard
3. WHEN Calendar_Widget muncul di Warranty page, THE System SHALL mengaplikasikan Midnight_Blue_Gradient styling yang identik dengan Dashboard
4. WHEN Calendar_Widget muncul di Messages page, THE System SHALL mengaplikasikan Midnight_Blue_Gradient styling yang identik dengan Dashboard
5. WHEN Calendar_Widget muncul di Profile page, THE System SHALL mengaplikasikan Midnight_Blue_Gradient styling yang identik dengan Dashboard

### Requirement 7: Visual Hierarchy Balance

**User Story:** Sebagai user client portal, saya ingin dashboard memiliki balance yang baik antara bold visual elements dan comfortable reading experience, sehingga saya dapat fokus pada information yang penting tanpa kelelahan visual.

#### Acceptance Criteria

1. WHEN Client_Portal dashboard di-render, THE System SHALL mengaplikasikan Midnight_Blue_Gradient hanya pada Stats_Cards dan Calendar_Widget untuk visual emphasis
2. WHEN Client_Portal dashboard di-render, THE System SHALL mengaplikasikan Light_Neumorphic styling pada semua Content_Cards yang menampilkan data tabular atau list
3. WHEN Client_Portal dashboard di-render, THE System SHALL mempertahankan ratio maksimal 30% dark surfaces (midnight blue) dan minimal 70% light surfaces untuk user comfort
4. FOR ALL components dengan Midnight_Blue_Gradient, THE System SHALL mempertahankan Neumorphism_Shadow untuk design consistency
5. FOR ALL components dengan Light_Neumorphic styling, THE System SHALL mempertahankan existing shadow dan highlight effects

### Requirement 8: Responsive Behavior Preservation

**User Story:** Sebagai user client portal di berbagai devices, saya ingin calendar widget tetap responsive dan readable, sehingga user experience tetap optimal di mobile maupun desktop.

#### Acceptance Criteria

1. WHEN Calendar_Widget di-render di mobile viewport, THE System SHALL mempertahankan Midnight_Blue_Gradient styling dengan Text_Readability yang sama
2. WHEN Calendar_Widget di-render di tablet viewport, THE System SHALL mengaplikasikan responsive padding dan spacing yang existing
3. WHEN Calendar_Widget di-render di desktop viewport, THE System SHALL mempertahankan existing layout di grid two-column
4. WHEN viewport width berubah, THE System SHALL mempertahankan Neumorphism_Shadow proportions yang sesuai dengan surface size
5. WHEN Calendar_Widget di-render di mobile viewport, THE System SHALL mempertahankan touch-friendly interactive element sizing minimal 44px x 44px

### Requirement 9: Accessibility Compliance

**User Story:** Sebagai user client portal dengan kebutuhan accessibility, saya ingin calendar widget memenuhi standard accessibility, sehingga saya dapat menggunakan calendar dengan assistive technologies.

#### Acceptance Criteria

1. WHEN Calendar_Widget menggunakan dark background, THE System SHALL mempertahankan minimum contrast ratio 4.5:1 untuk normal text dan 3:1 untuk large text sesuai WCAG AA
2. WHEN Calendar_Widget di-render, THE System SHALL mempertahankan existing ARIA labels pada navigation buttons untuk screen readers
3. WHEN calendar day cell dengan event di-fokus via keyboard, THE System SHALL menampilkan visible focus indicator dengan outline atau shadow
4. WHEN user navigate calendar via keyboard, THE System SHALL mempertahankan logical tab order (prev button → next button → day cells)
5. WHEN event tooltip ditampilkan, THE System SHALL dapat di-dismiss dengan ESC key atau click outside

### Requirement 10: CSS File Organization

**User Story:** Sebagai developer, saya ingin CSS changes terorganisir dengan baik, sehingga maintenance dan debugging menjadi lebih mudah.

#### Acceptance Criteria

1. THE System SHALL mengaplikasikan midnight blue gradient styles di `ClientPortal.module.css` untuk global calendar widget styling
2. THE System SHALL mempertahankan existing calendar-specific styles di `calendar.module.css` untuk event indicators dan tooltips
3. WHEN calendar styles di-update, THE System SHALL menggunakan CSS class overrides yang spesifik tanpa mengubah base neumorphism tokens di globals.css
4. WHEN calendar styles di-update, THE System SHALL menambahkan CSS comments yang menjelaskan purpose dari dark surface styling adjustments
5. THE System SHALL mempertahankan existing CSS variable naming conventions dan structure
