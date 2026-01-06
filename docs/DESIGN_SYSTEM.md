# Design System

Strategic design guidelines and UI/UX patterns for building Halterofit's mobile interface.

## Table of Contents

1. [Competitor UX Patterns](#competitor-ux-patterns)
2. [Design Principles](#design-principles)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing System](#spacing-system)
6. [Components](#components)
7. [Navigation Patterns](#navigation-patterns)
8. [Form Patterns](#form-patterns)
9. [UI States](#ui-states)
10. [Iconography](#iconography)

---

## Competitor UX Patterns

### Comparison Table

| Pattern                   | Strong                  | Hevy                      | Jefit                                |
| ------------------------- | ----------------------- | ------------------------- | ------------------------------------ |
| **Active Workout Layout** | Single exercise focus   | Exercise cards with tabs  | Tri-section (video/table/timer)      |
| **Set Logging**           | Checkmark → complete    | Checkmark → auto-timer    | Table with previous data pre-loaded  |
| **Rest Timer**            | Auto-start, skip/adjust | Auto-start, notifications | Auto-start, minimizable (swipe down) |
| **Exercise Library**      | Basic search            | Search + filters          | 1,400+ exercises, advanced filters   |
| **Navigation**            | Minimal tabs            | Bottom tabs               | Bottom tabs (5 tabs)                 |
| **Warmup Sets**           | Not highlighted         | "W" marker                | "W" marker in table                  |
| **Design Philosophy**     | Minimalist, fast        | Modern, balanced          | Feature-rich, comprehensive          |

### Key Patterns to Adopt

**1. Pre-loaded Previous Data**

- Show last workout's weight/reps in set logging table
- Enable one-tap to copy previous set
- Source: Jefit, Hevy

**2. Checkmark → Auto-Timer Flow**

- Tap checkmark to complete set
- Automatically trigger rest timer
- Source: Hevy (rated "most intuitive")

**3. Minimizable Rest Timer**

- Timer auto-starts after set completion
- Swipe down for low-profile mode
- Sound + vibration alerts
- Source: Jefit

**4. Distraction-Free Active Workout**

- One primary action per screen
- No nav bar during active workout
- Large touch targets (56x56px)
- Source: Strong

**5. Exercise Filters**

- Filter by: Body Part, Equipment, Type
- Multiple selection support
- Real-time search
- Source: Jefit

**6. Swipe Navigation Between Exercises**

- Swipe left/right to navigate exercises during active workout
- No need to exit screen
- Source: Jefit

---

## Design Principles

### 1. Offline-First Reliability

- Immediate feedback for all actions (no spinners blocking UI)
- Always show sync status (synced/pending/offline)
- No data loss, ever

### 2. Gym-Optimized Interface

- **Touch targets:** 56x56px minimum for primary actions
- **High contrast:** Readable in bright/dim gym lighting
- **One action per screen:** No clutter during workouts
- **Minimal keyboard:** Use pickers/steppers for numeric input

### 3. Quick Logging Flow

- Goal: 1-2 taps per set logged
- Pre-filled forms with smart defaults
- Previous workout data visible for reference

### 4. Progressive Disclosure

- Basic features upfront (weight, reps)
- Advanced features accessible but hidden (RIR, tempo, notes)
- Analytics revealed after sufficient data collected

---

## Color System

### Backgrounds

- `background.DEFAULT`: `#0A0A0A` (deep black, OLED-friendly)
- `background.surface`: `#1A1A1A` (cards)
- `background.elevated`: `#2A2A2A` (modals, overlays)

### Brand Colors

- `primary.DEFAULT`: `#4299e1` (brand blue)
- `primary.dark`: `#2b6cb0` (pressed states)
- `primary.light`: `#63b3ed` (highlights)

### Semantic Colors

- `success`: `#38a169` (completed sets, achievements)
- `warning`: `#d69e2e` (plateau warnings)
- `danger`: `#e53e3e` (overtraining alerts, delete actions)
- `info`: `#3182ce` (tooltips, help)

### Text Colors

- `foreground.DEFAULT`: `#e2e8f0` (primary text)
- `foreground.secondary`: `#a0aec0` (labels, metadata)
- `foreground.tertiary`: `#718096` (placeholders, disabled)

### RPE Colors

- `rpe.low`: `#38a169` (RPE 1-5, green)
- `rpe.medium`: `#d69e2e` (RPE 6-7, amber)
- `rpe.high`: `#e53e3e` (RPE 8-9, red)
- `rpe.max`: `#c53030` (RPE 10, dark red)

---

## Typography

**Suggestions:**

- Font family: System default (San Francisco iOS, Roboto Android)
- Type scale: 12/14/16/18/24/32/48px
- Line heights: 1.2 (headings), 1.5 (body)
- Weights: 400 (regular), 600 (semibold), 700 (bold)

---

## Spacing System

**Suggestions:**

- Base unit: 4px
- Scale: 4/8/12/16/24/32/48/64px
- Component padding: 16px (default), 24px (cards)
- Screen margins: 16px horizontal

---

## Components

### Touch Targets

- **Primary actions:** 56x56px minimum (gym-friendly)
- **Secondary actions:** 44x44px minimum (Apple HIG standard)
- **Text inputs:** 48px height minimum

### Visual Hierarchy

- **Primary action:** Solid fill, `primary` color, high contrast
- **Secondary action:** Outline, `border` color
- **Tertiary action:** Ghost (no border), subtle press

### Feedback Patterns

- **Haptic:** Light impact on all button presses
- **Visual:** 90% opacity on press (`activeOpacity={0.9}`)
- **Loading:** Skeleton loaders (no blocking spinners)

### Animation Timing

- **Quick interactions:** 200ms (button press, toggle)
- **Content transitions:** 300ms (screen navigation, modal open)
- **Background updates:** 400-600ms (charts, progress bars)

### Animation Curves

- **Ease-out:** Entering elements (start fast, slow down)
- **Ease-in-out:** Transitioning elements
- **Spring:** Interactive elements (physics-based, natural)

### Current Stack

- **Base Library:** React Native Reusables (shadcn/ui port)
- **Styling:** NativeWind v4 (Tailwind CSS for RN)
- **Animations:** Reanimated v4 (Skia-based, 60fps)
- **Icons:** @expo/vector-icons (Material, Ionicons, FontAwesome)

---

## Navigation Patterns

**Technology:** React Navigation v6

**Planned Structure:**

- Auth Stack (login, register, forgot password)
- Main Tab Navigator (workouts, exercises, profile)
- Workout Stack (workout list, active workout, workout history)
- Modal Stack (exercise picker, settings)

---

## Form Patterns

**Planned Patterns:**

- Validation: Real-time for critical fields, on-submit for forms
- Error display: Inline below input field (red text + icon)
- Success feedback: Green checkmark + haptic
- Placeholders: Show example values, not instructions

---

## UI States

**Planned States:**

### Empty States

- No workouts yet → CTA: "Create Your First Workout"
- No exercises in plan → CTA: "Add Exercises"
- No history → Illustration + encouraging message

### Loading States

- Skeleton loaders for lists (exercise lists, workout history)
- Spinner only for full-screen operations (initial sync)

### Error States

- Network errors → Retry button + offline mode explanation
- Validation errors → Inline below field
- Critical errors → Modal with contact support option

---

## Iconography

**Status:** Partially implemented

**Current Library:** @expo/vector-icons

**Icon Families:**

- **Material Icons:** Primary (workout, exercises, settings)
- **Ionicons:** Secondary (navigation, actions)
- **FontAwesome:** Specialty (social, advanced features)

**Sizes:**

- Small: 16px (inline, badges)
- Medium: 24px (buttons, tabs)
- Large: 32px (empty states, headers)

**Usage:**

- Use outlined icons for inactive states
- Use filled icons for active/selected states
- Maintain consistent icon family per feature area
