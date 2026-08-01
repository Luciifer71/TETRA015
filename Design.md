# Design System & Component Library
## AI-Powered Invoice Audit & Risk Screening Platform

**Version**: 1.0  
**Date**: August 1, 2026

---

## Table of Contents
1. [Design Tokens](#design-tokens)
2. [Component Specifications](#component-specifications)
3. [Patterns & Conventions](#patterns--conventions)
4. [Best Practices](#best-practices)

---

## Design Tokens

### Color Tokens

```css
/* Semantic Colors */
--color-primary: #1E40AF
--color-primary-hover: #1E3A8A
--color-primary-light: #3B82F6

--color-success: #10B981
--color-warning: #F59E0B
--color-danger: #EF4444
--color-critical: #DC2626
--color-info: #0284C7

--color-text-primary: #1F2937
--color-text-secondary: #6B7280
--color-text-muted: #9CA3AF

--color-bg-primary: #FFFFFF
--color-bg-secondary: #F9FAFB
--color-bg-tertiary: #F3F4F6

--color-border: #E5E7EB
--color-border-light: #F3F4F6
--color-border-dark: #D1D5DB
```

### Spacing Tokens

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
```

### Typography Tokens

```css
--font-family-base: 'Inter', sans-serif

--font-size-h1: 36px
--font-size-h2: 28px
--font-size-h3: 22px
--font-size-h4: 18px
--font-size-body: 16px
--font-size-body-sm: 14px
--font-size-label: 13px
--font-size-caption: 12px

--font-weight-regular: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

--line-height-tight: 1.2
--line-height-normal: 1.5
--line-height-relaxed: 1.75
```

### Shadow Tokens

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

### Border Radius Tokens

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-full: 9999px
```

---

## Component Specifications

### Button

**Primary Button**:
- Background: var(--color-primary)
- Text: White
- Padding: 12px 24px
- Border Radius: var(--radius-md)
- Font Size: var(--font-size-body)
- Hover: Darken background, add shadow
- Active: Inset shadow
- Disabled: Opacity 0.5

**Secondary Button**:
- Background: Transparent
- Border: 1px solid var(--color-primary)
- Text: var(--color-primary)
- Hover: Light blue background

**Danger Button**:
- Background: var(--color-danger)
- Text: White
- Hover: Darken to var(--color-critical)

**States Example**:
```tsx
<Button variant="primary" size="md" disabled={isLoading}>
  {isLoading ? <Spinner /> : 'Upload'}
</Button>
```

---

### Input Field

**Default State**:
- Height: 40px
- Padding: 12px 16px
- Border: 1px solid var(--color-border)
- Border Radius: var(--radius-sm)
- Font Size: 16px
- Background: var(--color-bg-primary)

**Focus State**:
- Border: 2px solid var(--color-primary)
- Box Shadow: 0 0 0 3px rgba(30, 64, 175, 0.1)

**Error State**:
- Border: 2px solid var(--color-danger)
- Placeholder text: var(--color-warning)

**Disabled State**:
- Background: var(--color-bg-tertiary)
- Opacity: 0.5

```tsx
<Input
  label="Vendor Name"
  placeholder="Enter vendor"
  error={error}
  errorMessage="Vendor not found"
  disabled={isLoading}
/>
```

---

### Card

**Properties**:
- Background: var(--color-bg-primary)
- Border: 1px solid var(--color-border)
- Border Radius: var(--radius-md)
- Padding: 24px
- Shadow: var(--shadow-sm)
- Hover: shadow-md, subtle scale (1.02)

```tsx
<Card>
  <Card.Header>
    <h3>Invoice Summary</h3>
  </Card.Header>
  <Card.Body>
    {/* content */}
  </Card.Body>
  <Card.Footer>
    {/* actions */}
  </Card.Footer>
</Card>
```

---

### Badge

**Low Risk**:
- Background: rgba(16, 185, 129, 0.1)
- Text: var(--color-success)
- Label: "LOW"

**Medium Risk**:
- Background: rgba(245, 158, 11, 0.1)
- Text: var(--color-warning)
- Label: "MEDIUM"

**High Risk**:
- Background: rgba(239, 68, 68, 0.1)
- Text: var(--color-danger)
- Label: "HIGH"

**Critical Risk**:
- Background: var(--color-critical)
- Text: White
- Label: "CRITICAL"

```tsx
<Badge variant="high">HIGH</Badge>
<Badge variant="success">APPROVED</Badge>
```

---

### Table

**Header**:
- Background: var(--color-bg-secondary)
- Font Weight: var(--font-weight-semibold)
- Padding: 16px
- Border Bottom: 2px solid var(--color-border)

**Rows**:
- Alternate background (every 2nd row: var(--color-bg-tertiary))
- Hover: var(--color-bg-secondary)
- Padding: 16px
- Border Bottom: 1px solid var(--color-border-light)

**Cells**:
- Vertical Align: Middle
- Text Overflow: Ellipsis with tooltip on hover

```tsx
<Table>
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Invoice #</Table.HeaderCell>
      <Table.HeaderCell>Vendor</Table.HeaderCell>
      <Table.HeaderCell>Amount</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {invoices.map(inv => (
      <Table.Row key={inv.id}>
        <Table.Cell>{inv.invoiceNumber}</Table.Cell>
        <Table.Cell>{inv.vendor}</Table.Cell>
        <Table.Cell>{formatCurrency(inv.amount)}</Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>
```

---

### Modal/Dialog

**Backdrop**:
- Background: rgba(0, 0, 0, 0.5)
- Transition: Fade in/out 200ms

**Modal**:
- Background: var(--color-bg-primary)
- Border Radius: var(--radius-md)
- Width: 90vw max 600px
- Max Height: 90vh
- Shadow: var(--shadow-xl)
- Animation: Scale + fade in 200ms

**Header**:
- Padding: 24px
- Border Bottom: 1px solid var(--color-border)
- Display: Flex + justify-between

**Body**:
- Padding: 24px
- Overflow: auto

**Footer**:
- Padding: 16px 24px
- Border Top: 1px solid var(--color-border)
- Display: Flex + gap + justify-end

```tsx
<Modal open={isOpen} onClose={handleClose}>
  <Modal.Header>Confirm Action</Modal.Header>
  <Modal.Body>Are you sure?</Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>
```

---

### Toast Notification

**Position**: Top-right
**Width**: 400px max
**Animation**: Slide in from right (300ms), fade out (300ms)
**Auto-dismiss**: 5 seconds

**Variants**:
- Success: Green background
- Error: Red background
- Warning: Orange background
- Info: Blue background

```tsx
<Toast type="success" message="Invoice uploaded successfully" />
<Toast type="error" message="Failed to upload file" />
```

---

## Patterns & Conventions

### Form Validation

**Real-time Validation**:
- Validate as user types (debounced 500ms)
- Show inline error message below field
- Change border to red on error
- Show helpful error text

**Submit Validation**:
- Validate all fields on submit
- Show first error field in focus
- Display summary of errors above form

```tsx
<FormField>
  <Label>GST Number</Label>
  <Input 
    value={gst}
    onChange={handleGstChange}
    error={!!gstError}
    aria-invalid={!!gstError}
    aria-describedby="gst-error"
  />
  {gstError && (
    <ErrorMessage id="gst-error">{gstError}</ErrorMessage>
  )}
</FormField>
```

### Loading States

**Skeleton Screens**:
- Show placeholder shapes while loading
- Fade to real content when ready
- Match final layout dimensions

**Loading Spinners**:
- Centered in container
- Colored with primary color
- Size appropriate to context

**Progress Bars**:
- Full-width or confined
- Show percentage or indeterminate
- Smooth animation

### Empty States

**No Data**:
- Large icon (100x100px)
- Heading explaining situation
- Brief description
- Call-to-action button

```tsx
<EmptyState
  icon={<UploadIcon />}
  heading="No invoices uploaded yet"
  description="Upload your first invoice to get started"
  action={<Button>Upload Invoice</Button>}
/>
```

### Search & Filters

**Search Bar**:
- Placeholder: "Search by invoice number, vendor..."
- Debounced 300ms
- Clear button (X icon) when text present
- Autocomplete suggestions

**Filter Badges**:
- Show applied filters as removable badges
- Click badge to remove
- "Clear All" button to reset

### Data Tables

**Column Header**:
- Sortable columns show up/down arrow
- Click to toggle sort direction
- Hover: cursor pointer, subtle background

**Row Actions**:
- View (eye icon)
- Edit (pencil icon)
- Delete (trash icon)
- More (...) menu for additional actions

**Pagination**:
- Previous/Next buttons
- Page number input
- Items per page selector
- Total count display

---

## Best Practices

### Spacing

- Use spacing scale consistently
- Maintain 16px base spacing between sections
- Use 8px for compact spacing
- Use 24px for generous spacing

### Typography

- One H1 per page
- Proper heading hierarchy (H1 → H2 → H3)
- Use semantic tags (strong, em, code)
- Limit line length to 60-80 characters

### Colors

- Don't use color alone to convey information
- Ensure 4.5:1 contrast ratio for text
- Use semantic colors (green=success, red=error)
- Avoid pure black (#000000), use dark gray

### Icons

- Use consistent icon library (e.g., Feather, Heroicons)
- Size: 16-24px for inline, 48-64px for hero
- Use with labels or title attributes
- Ensure readable on both light and dark backgrounds

### Responsive Design

- Mobile-first approach
- Test on real devices
- Touch targets: 44x44px minimum
- Hide non-essential elements on mobile

### Performance

- Lazy-load images and heavy components
- Minimize animations on mobile
- Optimize asset sizes
- Debounce expensive operations

### Accessibility

- Use semantic HTML
- Provide alt text for images
- Ensure keyboard navigation
- Test with screen readers
- Use ARIA only when needed

---

**Version**: 1.0  
**Last Updated**: August 1, 2026

---

**END OF DESIGN DOCUMENT**
