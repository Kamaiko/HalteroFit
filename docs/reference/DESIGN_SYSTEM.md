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

| Pattern                   | Strong                  | Hevy                      | Competitor C                         |
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
- Source: Hevy, competitor apps

**2. Checkmark → Auto-Timer Flow**

- Tap checkmark to complete set
- Automatically trigger rest timer
- Source: Hevy (rated "most intuitive")

**3. Minimizable Rest Timer**

- Timer auto-starts after set completion
- Swipe down for low-profile mode
- Sound + vibration alerts
- Source: competitor apps

**4. Distraction-Free Active Workout**

- One primary action per screen
- No nav bar during active workout
- Large touch targets (56x56px)
- Source: Strong

**5. Exercise Filters**

- Filter by: Body Part, Equipment, Type
- Multiple selection support
- Real-time search
- Source: competitor apps

**6. Swipe Navigation Between Exercises**

- Swipe left/right to navigate exercises during active workout
- No need to exit screen
- Source: competitor apps

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

- `primary.DEFAULT`: `#0EA5E9` (sky-500 — brand blue)
- `primary.dark`: `#0284C7` (sky-600 — pressed states)
- `primary.light`: `#38BDF8` (sky-400 — highlights)
- `primary.muted`: `#2768A3` (muted sky — secondary muscle highlights)
- `primary.foreground`: `#FFFFFF`

### Semantic Colors

- `success`: `#38A169` (completed sets, achievements)
- `warning`: `#D69E2E` (plateau warnings)
- `destructive`: `#E53E3E` (overtraining alerts, delete actions)
- `info`: `#0369A1` (sky-700 — tooltips, help)

### Text Colors

- `foreground.DEFAULT`: `#E2E8F0` (primary text)
- `foreground.secondary`: `#A0AEC0` (labels, metadata)
- `foreground.tertiary`: `#718096` (placeholders, disabled)
- `foreground.inverse`: `#1A202C` (text on light backgrounds)

### Border, Surface & Overlay

- `border.DEFAULT`: `#2D3748`
- `border.light`: `#4A5568`
- `border.input`: `#9CA3AF` (checkbox/input borders, unselected)
- `surface.white`: `#FFFFFF`
- `overlay.light`: `rgba(255, 255, 255, 0.3)` (handles, placeholder icons on dark bg)

### UI Library Tokens (react-native-reusables)

- `accent.DEFAULT`: `#27272A`, `accent.foreground`: `#E2E8F0`
- `secondary.DEFAULT`: `#27272A`, `secondary.foreground`: `#E2E8F0`
- `card.DEFAULT`: `#1A1A1A`, `card.foreground`: `#E2E8F0`
- `input`: `#27272A`
- `muted.DEFAULT`: `#27272A`, `muted.foreground`: `#94A3B8`
- `ring`: `#0EA5E9` (matches primary.DEFAULT)

### Domain-Specific Colors

- `brand.carbonLight`: `#404040` (logo gradient — highlight)
- `brand.carbonDark`: `#1A1A1A` (logo gradient — shadow)
- `dev.banner`: `#FF6B35` (orange dev mode indicator)
- `muscle.dimBody`: `#4F4F4F` (SVG body silhouette context layer)

### RPE Colors

- `rpe.low`: `#38A169` (RPE 1-5, green)
- `rpe.medium`: `#D69E2E` (RPE 6-7, amber)
- `rpe.high`: `#E53E3E` (RPE 8-9, red)
- `rpe.max`: `#C53030` (RPE 10, dark red)
- `rpe.max`: `#c53030` (RPE 10, dark red)

---

## Typography

**Suggestions:**

- Font family: System default (San Francisco iOS, Roboto Android)
- Type scale: 12/14/16/20/24/28/32/36px (Tailwind keys: xs/sm/base/lg/xl/2xl/3xl/4xl)
- Line heights: 1.2 (headings), 1.5 (body)
- Weights: 400 (regular), 600 (semibold), 700 (bold)

---

## Spacing System

**Suggestions:**

- Base unit: 4px (8px grid)
- Named scale: xs:4px / sm:8px / md:16px / lg:24px / xl:32px / 2xl:48px / 3xl:64px
- Component padding: md (16px) default, lg (24px) cards
- Screen margins: md (16px) horizontal

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

- **Instant feedback:** 100ms — `DURATION_INSTANT` (long-press triggers, micro-feedback)
- **Fast transitions:** 150ms — `DURATION_FAST` (sequential animation delays, quick slides)
- **Standard transitions:** 200ms — `DURATION_STANDARD` (card animations, tab indicators)
- **Moderate transitions:** 300ms — `DURATION_MODERATE` (fade-ins, chart animations)

### Animation Curves

- **Ease-out:** Entering elements (start fast, slow down)
- **Ease-in-out:** Transitioning elements
- **Spring:** Interactive elements (physics-based, natural)

### Current Stack

- **Base Library:** React Native Reusables (shadcn/ui port)
- **Styling:** NativeWind v4 (Tailwind CSS for RN)
- **Animations:** Reanimated v4 (worklets architecture, 60fps)
- **Icons:** @expo/vector-icons (Material, Ionicons, FontAwesome)

---

## Navigation Patterns

**Technology:** Expo Router v6 (file-based routing, built on React Navigation v7)

**Current Structure:**

- Root layout (`app/_layout.tsx`): Stack navigator, global providers
- Tab navigator (`app/(tabs)/`): Home | Workout | Exercises | Progress
- Exercise routes: exercise-browser, exercise-picker, exercise/[id]
- Plan routes: plans/[id], plans/[id]/days/[dayId], plans/[id]/days/[dayId]/edit
- Auth: placeholder (`app/(auth)/`), implementation deferred to Phase 4

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

**Sizes** (from `apps/mobile/src/constants/layout.ts`):

- XS: 16px — `ICON_SIZE_XS` (checkmarks in checkboxes)
- SM: 20px — `ICON_SIZE_SM` (chevrons, small action icons)
- MD: 24px — `ICON_SIZE_MD` (tab bar, action buttons — most common)
- LG: 32px — `ICON_SIZE_LG` (stat cards, prominent UI)
- XL: 40px — `ICON_SIZE_XL` (header placeholders, decorative)
- 2XL: 48px — `ICON_SIZE_2XL` (error states, loading states)
- 3XL: 64px — `ICON_SIZE_3XL` (full-screen placeholders, GIF fallbacks)
- MUSCLE: 72px — `ICON_SIZE_MUSCLE` (muscle group icons in 80px container)

**Usage:**

- Use outlined icons for inactive states
- Use filled icons for active/selected states
- Maintain consistent icon family per feature area

---

## UX Patterns

### Core Interaction Patterns

| Feature              | Anti-Pattern                      | Best Practice                                               |
| -------------------- | --------------------------------- | ----------------------------------------------------------- |
| **Set Logging**      | 7 taps (modals, confirmations)    | 1-2 taps (auto-fill last, inline edit, quick +/- buttons)   |
| **Plate Calculator** | Manual math                       | Button next to weight → "Add per side: 20kg + 10kg + 2.5kg" |
| **Rest Timer**       | Stops when minimized              | Background + push notification + auto-start from history    |
| **RIR Tracking**     | Prompt after every set (annoying) | End-of-workout summary OR optional inline button            |
| **Exercise Search**  | Search button + pagination        | Real-time filter (FlashList 500+ exercises, 300ms debounce) |
| **Workout Start**    | Empty only                        | MVP: Empty + Repeat Last; Phase 2: Templates + Resume       |

### Gym Environment

- Large tap targets (44x44pt minimum) — gloves, sweaty hands
- High contrast — bright gym lighting
- Landscape support — phone on bench
- One-handed operation mode

### Data Reliability

- Never show "No internet" errors during workout
- Instant save confirmation (local-first)
- Subtle sync indicator when online
- Conflict resolution: last write wins

### Error Messages

Contextual, not technical:

```typescript
// Bad → Good
"Network request failed" → "Saved locally. Will sync when online."
"Invalid input"          → "Weight must be between 0-500kg"
"Error 500"              → "Couldn't load history. Try again?"
```
