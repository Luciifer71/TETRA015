# UI/UX Design Specification
## AI-Powered Invoice Audit & Risk Screening Platform

**Version**: 1.0  
**Framework**: React + Tailwind CSS + shadcn/ui  
**Date**: August 1, 2026

---

## Table of Contents
1. [Design System](#design-system)
2. [Component Library](#component-library)
3. [Page Layouts](#page-layouts)
4. [Responsive Design](#responsive-design)
5. [Dark Mode](#dark-mode)
6. [Animations](#animations)
7. [Accessibility](#accessibility)

---

## Design System

### Color Palette

**Primary Colors**:
```
Primary Blue: #1E40AF (Trust, Professional)
Primary Dark: #1E3A8A (Darker shade for hover)
Primary Light: #3B82F6 (Lighter for backgrounds)
```

**Status Colors**:
```
Success Green: #10B981 (Approved, Low Risk)
Warning Orange: #F59E0B (Medium Risk, Caution)
Danger Red: #EF4444 (High Risk, Errors)
Critical Red: #DC2626 (Critical Risk)
Info Blue: #0284C7 (Information)
```

**Neutral Colors**:
```
Dark Gray: #1F2937 (Text primary)
Medium Gray: #6B7280 (Text secondary)
Light Gray: #F3F4F6 (Backgrounds, dividers)
White: #FFFFFF (Cards, main background)
```

### Typography

**Font Family**: Inter (sans-serif)

**Scale**:
```
H1: 36px, weight 700, line-height 1.2 (Page titles)
H2: 28px, weight 600, line-height 1.3 (Section titles)
H3: 22px, weight 600, line-height 1.4 (Subsection)
H4: 18px, weight 600, line-height 1.5 (Card titles)
Body: 16px, weight 400, line-height 1.5 (Main text)
Body Small: 14px, weight 400, line-height 1.4 (Secondary text)
Label: 13px, weight 500, line-height 1.3 (Form labels)
Caption: 12px, weight 400, line-height 1.2 (Helper text)
```

### Spacing Scale

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Border Radius

```
sm: 4px (buttons, inputs)
md: 8px (cards, modals)
lg: 12px (containers)
full: 9999px (badges, avatars)
```

### Shadows

```
sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

---

## Component Library

### Button Component

**Variants**:
- Primary (solid blue)
- Secondary (outlined)
- Danger (solid red)
- Ghost (transparent)

**Sizes**:
- sm (8px padding, 12px font)
- md (12px padding, 14px font)
- lg (16px padding, 16px font)

**States**:
- Default (normal)
- Hover (shadow + color shift)
- Active (inset shadow)
- Disabled (opacity 0.5)
- Loading (spinner + disabled)

### Input Component

**Variants**:
- Text
- Number
- Date
- Select (dropdown)
- Textarea
- Multiselect

**States**:
- Default (border: light gray)
- Focus (border: blue, shadow)
- Error (border: red)
- Disabled (background: gray, opacity 0.5)
- Filled (with value)

**Properties**:
```
Padding: 12px
Border Radius: 4px
Font Size: 16px
Min Height: 40px
```

### Card Component

**Properties**:
```
Border: 1px solid #E5E7EB
Border Radius: 8px
Padding: 24px
Background: #FFFFFF
Shadow: md
Hover: shadow-lg + slight scale (1.02x)
Transition: all 200ms ease
```

### Badge/Status Component

**Styles**:
```
LOW: Green background + green text
MEDIUM: Orange background + orange text
HIGH: Red background + red text
CRITICAL: Dark red background + white text

PENDING: Gray background
PROCESSED: Green background
FLAGGED: Orange background
APPROVED: Blue background
REJECTED: Red background
```

**Properties**:
```
Padding: 4px 12px
Border Radius: 16px
Font Size: 12px
Font Weight: 600
```

### Table Component

**Columns**:
- Header: Bold, medium gray background
- Rows: Alternate white/light gray
- Hover: Light blue background
- Selected: Medium blue background

**Features**:
- Sortable columns (arrow indicators)
- Checkbox for selection
- Responsive (horizontal scroll on mobile)
- Pagination controls

### Modal/Dialog Component

**Properties**:
```
Width: 90vw max 600px
Border Radius: 8px
Shadow: xl
Backdrop: Dark overlay (opacity 0.5)
Animation: Scale in + fade in (200ms)
```

**Actions**:
- Cancel button (secondary)
- Confirm button (primary)
- Close (X button, top-right)

### Notification/Toast Component

**Types**:
- Success (green)
- Error (red)
- Warning (orange)
- Info (blue)

**Position**: Top-right, auto-dismiss after 5 seconds

**Animation**: Slide in from right, fade out

---

## Page Layouts

### Dashboard Layout

```
┌─────────────────────────────────────────┐
│ Header (Logo, Title, User Menu)         │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │ Main Content                 │
│ Nav      │                              │
│          │ ┌──────────────────────────┐ │
│          │ │ Summary Cards (4-col)    │ │
│          │ └──────────────────────────┘ │
│          │                              │
│          │ ┌──────────────────────────┐ │
│          │ │ Risk Chart | Vendor Chart│ │
│          │ └──────────────────────────┘ │
│          │                              │
│          │ ┌──────────────────────────┐ │
│          │ │ Recent Invoices Table     │ │
│          │ └──────────────────────────┘ │
│          │                              │
├──────────┴──────────────────────────────┤
│ Footer                                   │
└─────────────────────────────────────────┘
```

**Summary Cards** (4 columns on desktop):
- Total Invoices Processed
- Total Amount Processed
- High Risk Count
- Pending Review Count

**Charts** (2 columns on desktop):
- Risk Distribution (pie/donut)
- Top Vendors (bar chart)

**Table**: Recent invoices with columns:
- Invoice #, Vendor, Amount, Risk Level, Status, Date

---

### Upload Layout

```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Upload Instructions              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Drop Zone / File Picker         │ │
│ │ (Drag files here or click)      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Recent Uploads                   │ │
│ │ • file1.pdf - Processed ✓       │ │
│ │ • file2.pdf - Processing...     │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

### Invoice List Layout

```
┌─────────────────────────────────────────┐
│ Header                                  │
├──────────┬──────────────────────────────┤
│ Sidebar  │ ┌──────────────────────────┐ │
│          │ │ Search Bar + Filters     │ │
│          │ └──────────────────────────┘ │
│          │                              │
│          │ ┌──────────────────────────┐ │
│          │ │ Invoice Table            │ │
│          │ │ (Sortable, Selectable)   │ │
│          │ └──────────────────────────┘ │
│          │                              │
│          │ ┌──────────────────────────┐ │
│          │ │ Pagination Controls      │ │
│          │ └──────────────────────────┘ │
│          │                              │
└──────────┴──────────────────────────────┘
```

---

### Invoice Detail Layout

```
┌─────────────────────────────────────────────┐
│ Header + Breadcrumb                         │
├─────────────┬───────────────────────────────┤
│ Sidebar     │ ┌─────────────────────────┐   │
│             │ │ Tabs:                   │   │
│             │ │ Overview | Risk | Audit │   │
│             │ └─────────────────────────┘   │
│             │                               │
│             │ ┌─────────────────────────┐   │
│             │ │ Extracted Data Panel    │   │
│             │ │ - Invoice #, Vendor, $  │   │
│             │ │ - Dates, Items          │   │
│             │ └─────────────────────────┘   │
│             │                               │
│             │ ┌─────────────────────────┐   │
│             │ │ Matching Results        │   │
│             │ │ ✓ Ledger Matched       │   │
│             │ │ ✓ Vendor Verified      │   │
│             │ └─────────────────────────┘   │
│             │                               │
│             │ ┌─────────────────────────┐   │
│             │ │ Risk Analysis           │   │
│             │ │ Score: 25/100 [LOW]    │   │
│             │ │ Factors: ...            │   │
│             │ │ Explanation: ...        │   │
│             │ └─────────────────────────┘   │
│             │                               │
│             │ ┌─────────────────────────┐   │
│             │ │ Action Buttons          │   │
│             │ │ [Approve] [Flag] [Edit] │   │
│             │ └─────────────────────────┘   │
│             │                               │
└─────────────┴───────────────────────────────┘
```

---

## Responsive Design

### Breakpoints

```
Mobile:  < 640px  (single column, stacked)
Tablet:  640-1024px (2-column layout)
Desktop: > 1024px  (3+ column layout)
```

### Mobile Adaptations

**Dashboard**:
- Single column layout
- Summary cards stack vertically
- Charts full-width
- Table scrollable horizontally
- Bottom navigation bar

**Upload**:
- Full-width drop zone
- Centered layout
- Larger touch targets (48px min)

**Invoice List**:
- Collapsible filters
- Compact table (essential columns only)
- Swipe-able rows for actions

**Invoice Detail**:
- Stacked sections
- Expandable panels
- Tabs for content sections

### Desktop Features

- Sidebar always visible
- Multi-column layouts
- Hover effects on interactive elements
- Right-click context menus
- Keyboard shortcuts

---

## Dark Mode

### Dark Color Palette

```
Background: #0F172A
Surface: #1E293B
Text Primary: #F1F5F9
Text Secondary: #CBD5E1
Border: #334155

Accent Blue: #38BDF8
Success Green: #34D399
Warning Orange: #FBBF24
Danger Red: #F87171
```

### Toggle Implementation

```typescript
// Use system preference + manual toggle
const [darkMode, setDarkMode] = useLocalStorage('darkMode', 
  window.matchMedia('(prefers-color-scheme: dark)').matches
)

// Apply via class on root element
document.documentElement.classList.toggle('dark', darkMode)
```

---

## Animations

### Transition Timings

```
Fast: 150ms (hover effects, button states)
Normal: 200ms (modal open, fade transitions)
Slow: 300ms (page transitions, complex animations)
```

### Easing Functions

```
Standard: ease (0.4, 0, 0.2, 1)
Emphasis: cubic-bezier(0.2, 0, 0, 1)
Decelerate: cubic-bezier(0.0, 0, 0.2, 1)
```

### Key Animations

**Page Load**:
- Fade in main content (200ms)
- Skeleton screens fade to content

**Modal Open**:
- Backdrop fade in (150ms)
- Content scale up + fade (200ms)

**Button Hover**:
- Shadow increase (100ms)
- Color shift (100ms)

**Chart Render**:
- Bars/lines draw from zero (500ms)
- Labels fade in (300ms)

**Loading States**:
- Pulse/breathing animation for skeletons
- Spinner rotation (1s loop)

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Text on background: 4.5:1 minimum
- UI components: 3:1 minimum

**Focus Indicators**:
- Visible outline (2px, blue)
- All interactive elements keyboard-accessible

**Semantic HTML**:
- Proper heading hierarchy
- Form labels connected to inputs
- ARIA attributes where needed

**Keyboard Navigation**:
```
Tab: Move to next element
Shift+Tab: Move to previous element
Enter/Space: Activate buttons/links
Arrow Keys: Navigate lists/tables
Escape: Close modals
```

**Screen Reader Optimization**:
```html
<!-- Form labels -->
<label htmlFor="invoice-search">Search Invoices</label>
<input id="invoice-search" type="text" />

<!-- Buttons with icons only -->
<button aria-label="Delete invoice">🗑️</button>

<!-- Chart descriptions -->
<div role="img" aria-label="Risk distribution: 72% Low, 20% Medium, 6% High, 2% Critical" />

<!-- Loading state -->
<div aria-live="polite" aria-busy={loading}>
  Loading invoices...
</div>
```

---

**Version**: 1.0  
**Last Updated**: August 1, 2026

---

**END OF UI DOCUMENT**
